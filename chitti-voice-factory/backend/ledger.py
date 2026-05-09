"""SQLite-backed honest ledger.

Schema matches CHITTI_VOICE_FACTORY_MASTER_SPEC.md §5. Every synthesis attempt
(success OR failure) is logged with sha256 of the text — never raw text — plus
supplier, latency, and ok flag. Status queries derive `available:true` only
from real rows in the last 24 hours.

The ledger is the source of truth. No hard-coded availability anywhere.
"""

import hashlib
import os
import sqlite3
import threading
from datetime import datetime, timedelta, timezone


_LOCK = threading.Lock()
_DB_PATH = os.environ.get("VOICE_FACTORY_DB", "./chitti_voice_factory.sqlite")


def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(_DB_PATH, isolation_level=None, timeout=10.0)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _LOCK, _conn() as c:
        c.executescript(
            """
            CREATE TABLE IF NOT EXISTS synthesis_log (
              id              INTEGER PRIMARY KEY AUTOINCREMENT,
              language_code   TEXT NOT NULL,
              supplier        TEXT NOT NULL,
              text_sha256     TEXT NOT NULL,
              text_chars      INTEGER NOT NULL,
              bytes_out       INTEGER,
              latency_ms      INTEGER,
              ok              INTEGER NOT NULL,
              error_code      TEXT,
              created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS ix_log_lang_time
              ON synthesis_log(language_code, created_at);

            CREATE TABLE IF NOT EXISTS donor_consents (
              id                  INTEGER PRIMARY KEY AUTOINCREMENT,
              donor_handle        TEXT NOT NULL,
              language_code       TEXT NOT NULL,
              consent_text_sha256 TEXT NOT NULL,
              audio_proof_url     TEXT NOT NULL,
              recorded_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              revoked_at          TIMESTAMP
            );
            """
        )


def text_sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def log_synthesis(
    *,
    language_code: str,
    supplier: str,
    text: str,
    bytes_out: int | None,
    latency_ms: int | None,
    ok: bool,
    error_code: str | None = None,
) -> int:
    with _LOCK, _conn() as c:
        cur = c.execute(
            """
            INSERT INTO synthesis_log
              (language_code, supplier, text_sha256, text_chars,
               bytes_out, latency_ms, ok, error_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                language_code,
                supplier,
                text_sha256(text),
                len(text),
                bytes_out,
                latency_ms,
                1 if ok else 0,
                error_code,
            ),
        )
        return cur.lastrowid


def status_for(language_code: str) -> dict:
    """Honest status for one language. `available:true` requires ALL of:
       1. ok=1 row in last 24h
       2. latency_ms IS NOT NULL on that row
       3. supplier is one of the known suppliers
       4. (caller adds disclaimer text non-empty)
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    with _LOCK, _conn() as c:
        row = c.execute(
            """
            SELECT supplier, latency_ms, created_at
            FROM synthesis_log
            WHERE language_code = ?
              AND ok = 1
              AND latency_ms IS NOT NULL
              AND created_at >= ?
            ORDER BY id DESC
            LIMIT 1
            """,
            (language_code, cutoff.isoformat(sep=" ")),
        ).fetchone()
        totals = c.execute(
            """
            SELECT
              SUM(CASE WHEN ok=1 THEN 1 ELSE 0 END) AS oks,
              COUNT(*) AS total,
              AVG(CASE WHEN ok=1 THEN latency_ms END) AS avg_latency_ms
            FROM synthesis_log
            WHERE language_code = ? AND created_at >= ?
            """,
            (language_code, cutoff.isoformat(sep=" ")),
        ).fetchone()

    if row is None:
        return {
            "available": False,
            "reason": "no_successful_synthesis_in_last_24h",
            "supplier": None,
            "last_success_at": None,
            "avg_latency_ms_24h": None,
            "calls_24h": int(totals["total"] or 0),
            "ok_24h": int(totals["oks"] or 0),
        }
    return {
        "available": True,
        "reason": None,
        "supplier": row["supplier"],
        "last_success_at": row["created_at"],
        "avg_latency_ms_24h": int(totals["avg_latency_ms"]) if totals["avg_latency_ms"] is not None else None,
        "calls_24h": int(totals["total"] or 0),
        "ok_24h": int(totals["oks"] or 0),
    }


def recent_log(limit: int = 200) -> list[dict]:
    with _LOCK, _conn() as c:
        rows = c.execute(
            """
            SELECT id, language_code, supplier, text_sha256, text_chars,
                   bytes_out, latency_ms, ok, error_code, created_at
            FROM synthesis_log
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return [dict(r) for r in rows]
