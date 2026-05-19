"""
database.py
-----------
Embedded-replica resolver for Turso libSQL URLs.

Per SAHAYAI_MASTER.md §2 row 3 (LOCKED), Chitti backends MUST NOT pass a
`libsql://` URL straight into SQLAlchemy `create_engine`. The `sqlalchemy-libsql`
dialect inherits the stock pysqlite dialect, which assumes a stdlib
`sqlite3.Connection` (PRAGMA support + mutable isolation_level). Turso's remote
Hrana protocol satisfies neither.

The embedded-replica pattern (ported from chitti-news/backend/database.py):

  1. `libsql_experimental.connect(local_path, sync_url=..., auth_token=...)`
     opens a real SQLite file on disk that syncs (read + write) with Turso in
     the background.
  2. A daemon thread runs `.sync()` every 60s. Initial sync runs once in the
     background so /health binds well before Render/Railway's 30s probe.
  3. SQLAlchemy then talks to the local file via plain `sqlite:///<path>` —
     full PRAGMA support, real stdlib `sqlite3.Connection` semantics.

`resolve_db_url(...)` is idempotent: it caches per-host so when chitti-vaani's
three env vars (DATABASE_URL, ADMIN_DATABASE_URL, FEEDBACK_DATABASE_URL) all
point at the same Turso DB, we open ONE replica and ONE sync thread.

URL shapes:
  - libsql://<host>?authToken=<token>   → embedded replica, returns sqlite:///<local>
  - postgres://...                      → rewrites to postgresql+psycopg2:// (legacy)
  - sqlite:///path                      → passed through unchanged
  - empty / None                        → passed through unchanged
"""
from __future__ import annotations

import logging
import os
import threading
import time
import urllib.parse

log = logging.getLogger("database")

# host → (local_path, syncer_conn). Guard for idempotency across multiple
# call sites pointing at the same Turso DB.
_REPLICAS: dict[str, tuple[str, object]] = {}
_REPLICAS_LOCK = threading.Lock()


def _parse_libsql_url(raw: str) -> tuple[str, str, str]:
    """Return (host, sync_url, auth_token) from libsql://host?authToken=..."""
    parsed = urllib.parse.urlparse(raw)
    qs = urllib.parse.parse_qs(parsed.query)
    token = (qs.get("authToken") or [""])[0]
    sync_url = f"{parsed.scheme}://{parsed.netloc}"
    return parsed.netloc, sync_url, token


def _default_local_path(host: str) -> str:
    """Derive a stable /tmp file path from the Turso hostname.

    chitti-vaani-bryanwilfredpinto.aws-ap-south-1.turso.io → /tmp/chitti_vaani.db
    """
    # Take the first dotted segment, strip the bryanwilfredpinto suffix.
    first = host.split(".", 1)[0]
    short = first.split("-bryanwilfredpinto")[0]
    safe = short.replace("-", "_")
    return f"/tmp/{safe}.db"


def _bootstrap_replica(libsql_url: str, local_path: str):
    """Open the local replica + start background sync. Returns the syncer conn."""
    import libsql_experimental as libsql  # type: ignore[import-not-found]

    host, sync_url, token = _parse_libsql_url(libsql_url)
    log.info("Opening embedded replica at %s (sync_url=%s)", local_path, sync_url)
    syncer = libsql.connect(local_path, sync_url=sync_url, auth_token=token)

    def _loop():
        try:
            syncer.sync()
            log.info("Initial sync from Turso complete (%s)", host)
        except Exception as e:  # noqa: BLE001
            log.warning("Initial Turso sync failed for %s (will retry): %s", host, e)
        while True:
            time.sleep(60)
            try:
                syncer.sync()
            except Exception as e:  # noqa: BLE001
                log.warning("Background Turso sync failed for %s: %s", host, e)

    threading.Thread(target=_loop, name=f"turso-sync-{host}", daemon=True).start()
    return syncer


def resolve_db_url(raw: str | None, local_path_hint: str | None = None) -> str:
    """Resolve any env-provided DB URL into one safe for SQLAlchemy create_engine.

    - libsql:// → bootstrap embedded replica (idempotent per host) and return sqlite:///<local>
    - postgres:// → rewrite to postgresql+psycopg2://
    - everything else → pass through unchanged
    """
    if not raw:
        return raw or ""

    if raw.startswith("libsql://"):
        host, _, _ = _parse_libsql_url(raw)
        with _REPLICAS_LOCK:
            if host not in _REPLICAS:
                local_path = (
                    local_path_hint
                    or os.environ.get("LIBSQL_REPLICA_PATH")
                    or _default_local_path(host)
                )
                syncer = _bootstrap_replica(raw, local_path)
                _REPLICAS[host] = (local_path, syncer)
            local_path, _ = _REPLICAS[host]
        return f"sqlite:///{local_path}"

    if raw.startswith("postgres://"):
        return raw.replace("postgres://", "postgresql+psycopg2://", 1)

    return raw


def sync_now(host: str | None = None) -> None:
    """Force an immediate Turso sync. host=None syncs every open replica."""
    with _REPLICAS_LOCK:
        targets = (
            [(host, *_REPLICAS[host])] if host and host in _REPLICAS
            else [(h, *v) for h, v in _REPLICAS.items()]
        )
    for h, _path, syncer in targets:
        try:
            syncer.sync()  # type: ignore[attr-defined]
        except Exception as e:  # noqa: BLE001
            log.warning("Forced Turso sync failed for %s: %s", h, e)
