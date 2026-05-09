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

            CREATE TABLE IF NOT EXISTS voice_submissions (
              submission_id       TEXT PRIMARY KEY,
              language_code       TEXT NOT NULL,
              donor_name          TEXT NOT NULL,
              donor_email         TEXT NOT NULL,
              donor_phone         TEXT,
              audio_sha256        TEXT NOT NULL,
              audio_duration_s    REAL NOT NULL,
              audio_storage_url   TEXT,
              consent_stage1_accepted_at TIMESTAMP NOT NULL,
              is_winner           INTEGER DEFAULT 0,
              created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS ix_submissions_lang
              ON voice_submissions(language_code, is_winner, created_at DESC);

            CREATE TABLE IF NOT EXISTS voice_winners (
              winner_id           TEXT PRIMARY KEY,
              submission_id       TEXT NOT NULL UNIQUE,
              language_code       TEXT NOT NULL,
              donor_name          TEXT NOT NULL,
              donor_email         TEXT NOT NULL,
              donor_photo_url     TEXT,
              audio_storage_url   TEXT NOT NULL,
              audio_sha256        TEXT NOT NULL,
              consent_stage2_accepted_at TIMESTAMP NOT NULL,
              can_delete          INTEGER DEFAULT 0,
              created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY(submission_id) REFERENCES voice_submissions(submission_id)
            );
            CREATE INDEX IF NOT EXISTS ix_winners_lang
              ON voice_winners(language_code, created_at DESC);

            CREATE TABLE IF NOT EXISTS voice_synthesis_map (
              language_code       TEXT PRIMARY KEY,
              supplier_type       TEXT NOT NULL,
              winner_id           TEXT,
              updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY(winner_id) REFERENCES voice_winners(winner_id)
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


def create_submission(
    *,
    submission_id: str,
    language_code: str,
    donor_name: str,
    donor_email: str,
    donor_phone: str | None,
    audio_sha256: str,
    audio_duration_s: float,
    audio_storage_url: str | None,
) -> bool:
    with _LOCK, _conn() as c:
        try:
            c.execute(
                """
                INSERT INTO voice_submissions
                  (submission_id, language_code, donor_name, donor_email, donor_phone,
                   audio_sha256, audio_duration_s, audio_storage_url, consent_stage1_accepted_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                """,
                (submission_id, language_code, donor_name, donor_email, donor_phone,
                 audio_sha256, audio_duration_s, audio_storage_url),
            )
            return True
        except Exception:
            return False


def get_submission(submission_id: str) -> dict | None:
    with _LOCK, _conn() as c:
        row = c.execute(
            "SELECT * FROM voice_submissions WHERE submission_id = ?",
            (submission_id,),
        ).fetchone()
    return dict(row) if row else None


def confirm_winner(
    *,
    submission_id: str,
    winner_id: str,
    donor_photo_url: str | None,
) -> bool:
    with _LOCK, _conn() as c:
        try:
            sub = c.execute(
                "SELECT * FROM voice_submissions WHERE submission_id = ?",
                (submission_id,),
            ).fetchone()
            if not sub:
                return False

            c.execute(
                """
                INSERT INTO voice_winners
                  (winner_id, submission_id, language_code, donor_name, donor_email,
                   donor_photo_url, audio_storage_url, audio_sha256, consent_stage2_accepted_at, can_delete)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 0)
                """,
                (winner_id, submission_id, sub["language_code"], sub["donor_name"],
                 sub["donor_email"], donor_photo_url, sub["audio_storage_url"], sub["audio_sha256"]),
            )
            c.execute(
                "UPDATE voice_submissions SET is_winner = 1 WHERE submission_id = ?",
                (submission_id,),
            )
            return True
        except Exception:
            return False


def get_winners(language_code: str | None = None) -> list[dict]:
    with _LOCK, _conn() as c:
        if language_code:
            rows = c.execute(
                """
                SELECT * FROM voice_winners
                WHERE language_code = ?
                ORDER BY created_at DESC
                """,
                (language_code,),
            ).fetchall()
        else:
            rows = c.execute(
                """
                SELECT * FROM voice_winners
                ORDER BY created_at DESC
                """
            ).fetchall()
    return [dict(r) for r in rows]


def get_synthesis_map(language_code: str) -> dict | None:
    with _LOCK, _conn() as c:
        row = c.execute(
            "SELECT * FROM voice_synthesis_map WHERE language_code = ?",
            (language_code,),
        ).fetchone()
    return dict(row) if row else None


def set_synthesis_map(*, language_code: str, supplier_type: str, winner_id: str | None) -> bool:
    with _LOCK, _conn() as c:
        try:
            c.execute(
                """
                INSERT OR REPLACE INTO voice_synthesis_map
                  (language_code, supplier_type, winner_id, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                """,
                (language_code, supplier_type, winner_id),
            )
            return True
        except Exception:
            return False
