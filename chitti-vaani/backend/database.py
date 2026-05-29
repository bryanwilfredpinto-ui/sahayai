"""
database.py
-----------
DB URL + engine resolver for Chitti Vaani.

Per SAHAYAI_MASTER.md §2 row 3 (LOCKED, REVISED 2026-05-29) every write MUST land
on Turso REMOTE — never on a /tmp local file that disappears on Railway restart.

The earlier embedded-replica pattern (`libsql_experimental.connect(local_path,
sync_url=...)`) opened a local SQLite file at /tmp/<chitti>.db and ran a
background `.sync()` loop. In production this failed: SQLAlchemy wrote to the
file via stdlib sqlite3, which produced WAL frames libsql could not reconcile —
every `syncer.sync()` raised `wal_insert_begin failed` and writes never
propagated upstream. Container restart wiped /tmp; data was lost.

The replacement is direct HTTPS to Turso via the shim at `lib.turso_http`. The
shim implements PEP-249 DBAPI on top of Turso's `/v2/pipeline` Hrana endpoint
and is plugged into SQLAlchemy via `create_engine(..., creator=...)`. The
underlying SQLAlchemy dialect remains the stock `sqlite` dialect, which the
shim is compatible with (qmark paramstyle, PRAGMA passthrough, sqlite-flavoured
exception types).

Public surface:
  resolve_db_url(raw, local_path_hint=None) -> str
      Backward-compatible: returns a URL string for callers that pass it
      straight to make_engine().

  make_engine(raw, **engine_kwargs) -> Engine
      Preferred entry point. For libsql:// it builds a Turso-backed engine
      using the lib.turso_http shim. For postgres:// or sqlite:// it builds
      a normal SQLAlchemy engine.

  sync_now(host=None) -> None
      No-op shim retained for backward compatibility with the embedded-replica
      module — there is nothing to sync; writes are durable on commit().
"""
from __future__ import annotations

import logging
import urllib.parse
from typing import Any

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.pool import NullPool

log = logging.getLogger("database")


def _parse_libsql_url(raw: str) -> tuple[str, str]:
    parsed = urllib.parse.urlparse(raw)
    qs = urllib.parse.parse_qs(parsed.query)
    token = (qs.get("authToken") or [""])[0]
    return parsed.netloc, token


def resolve_db_url(raw: str | None, local_path_hint: str | None = None) -> str:
    """Lightly normalise the URL. Real dialect routing happens in make_engine().

    - libsql://     → returned unchanged (make_engine recognises it)
    - postgres://   → rewritten to postgresql+psycopg2://
    - sqlite://     → passthrough
    - empty / None  → empty string (caller handles fallback)
    """
    if not raw:
        return raw or ""
    if raw.startswith("postgres://"):
        return raw.replace("postgres://", "postgresql+psycopg2://", 1)
    return raw


def _build_libsql_engine(raw: str, engine_kwargs: dict[str, Any]) -> Engine:
    """Build a SQLAlchemy engine that talks to Turso directly via lib.turso_http.

    Uses the built-in sqlite dialect with a creator= callable so SQLAlchemy
    routes every connection through our HTTP shim instead of stdlib sqlite3.
    """
    from lib import turso_http

    host, token = _parse_libsql_url(raw)
    if not token:
        log.warning("libsql URL for %s has no authToken — Turso will reject the connection", host)

    def _creator():
        # SQLAlchemy treats this return value as a DBAPI Connection.
        return turso_http.connect(host=host, token=token)

    # Drop kwargs the sqlite dialect / our shim do not want:
    kwargs = dict(engine_kwargs)
    kwargs.pop("pool_pre_ping", None)            # HTTP keep-alive doesn't need it
    ca = kwargs.get("connect_args") or {}
    ca = {k: v for k, v in ca.items() if k != "check_same_thread"}
    if ca:
        kwargs["connect_args"] = ca
    else:
        kwargs.pop("connect_args", None)
    kwargs.setdefault("poolclass", NullPool)     # each checkout = fresh HTTPS conn
    kwargs["module"] = turso_http               # tell the sqlite dialect to use our DBAPI

    log.info("Opening Turso engine via direct HTTPS: host=%s pool=NullPool", host)
    # URL is a placeholder; the actual transport is creator + module.
    return create_engine("sqlite://", creator=_creator, **kwargs)


def make_engine(raw: str | None, **engine_kwargs: Any) -> Engine:
    """One-stop helper: pick the right transport for the URL."""
    if not raw:
        raise ValueError("make_engine: empty DB URL — caller must provide a fallback before calling")

    if raw.startswith("libsql://"):
        return _build_libsql_engine(raw, engine_kwargs)

    url = resolve_db_url(raw)
    log.info("Opening DB engine: scheme=%s", url.split(":", 1)[0])
    return create_engine(url, **engine_kwargs)


def sync_now(host: str | None = None) -> None:
    """No-op. Retained for backward compatibility with the embedded-replica era."""
    return None
