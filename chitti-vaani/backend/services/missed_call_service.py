"""
services/missed_call_service.py
-------------------------------
P1 (2026-05-13) — missed-call callback for rural / low-connectivity users.

The flow:
  1. User gives a missed call to Chitti's published number.
  2. Telephony provider (Exotel / Knowlarity / MSG91 / Twilio India) hits
     POST /api/vaani/missed-call/webhook with { phone, call_sid, ... }.
     The webhook is signature-verified by the provider when configured
     (CHITTI_MISSED_CALL_SECRET); we accept open POSTs in dev for now.
  3. We queue the callback and acknowledge the webhook immediately.
  4. A separate worker (`run_dispatch_queue`, scheduled every minute)
     dials the queued numbers back via the same telephony provider.

What's honest about this skeleton:
  - Provider integrations (Exotel / Knowlarity / Twilio) are stubs. The
    queue + the dispatch loop are real; the wire-level "make the actual
    callback" is a `_make_callback()` function that logs what it WOULD
    do and returns False until CHITTI_TELEPHONY_PROVIDER is set.
  - We DO NOT auto-dial cops (112 / 100 / 102 …) — the denylist from
    emergency_service is enforced again here, defensively. Even on a
    misconfigured webhook, the callback queue refuses cop numbers.
  - The callback is scoped to a user_token; if Vaani doesn't know the
    user from a prior pairing, the row sits in 'pending_link' state
    until the user opens any Chitti page on the same number's phone
    and confirms.

The queue is sqlite — same pattern as relay_db / checkin_service. No
external dependencies; one DB per Chitti.
"""
from __future__ import annotations

import logging
import os
import sqlite3
import threading
import time
from datetime import datetime
from typing import Optional

from services.emergency_service import is_cop_number

log = logging.getLogger("missed_call_service")

_DB_LOCK = threading.Lock()
_DB_PATH = os.environ.get("VAANI_MISSED_CALL_DB", "/tmp/chitti_vaani_missed_call.sqlite")

# Provider hook — wire to Exotel / Knowlarity / Twilio India when the
# env vars land. The dispatch loop only calls _make_callback when this
# is truthy; otherwise queued rows transition to `stubbed` and the row
# records what the callback WOULD have been.
_PROVIDER = (os.environ.get("CHITTI_TELEPHONY_PROVIDER") or "").lower().strip()


def _conn():
    c = sqlite3.connect(_DB_PATH, timeout=10.0, isolation_level=None)
    c.execute("PRAGMA journal_mode=WAL")
    c.execute("PRAGMA synchronous=NORMAL")
    return c


def init_db() -> None:
    with _DB_LOCK, _conn() as c:
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS missed_calls (
              id            INTEGER PRIMARY KEY AUTOINCREMENT,
              phone         TEXT    NOT NULL,
              user_token    TEXT,
              language      TEXT    NOT NULL DEFAULT 'hi',
              call_sid      TEXT,
              source        TEXT    NOT NULL DEFAULT 'webhook',
              note          TEXT,
              status        TEXT    NOT NULL DEFAULT 'queued',
              attempts      INTEGER NOT NULL DEFAULT 0,
              last_error    TEXT,
              created_at    INTEGER NOT NULL,
              dialed_at     INTEGER,
              finished_at   INTEGER
            )
            """
        )
        c.execute("CREATE INDEX IF NOT EXISTS idx_mc_status ON missed_calls(status, created_at)")
        c.execute("CREATE INDEX IF NOT EXISTS idx_mc_phone ON missed_calls(phone)")


# ───── Phone hygiene ───────────────────────────────────────

def _digits(s: str) -> str:
    return "".join(ch for ch in (s or "") if ch.isdigit())


def _canonical_phone(raw: str) -> str:
    """Best-effort E.164-ish for India. 10 digits → +91XXXXXXXXXX."""
    d = _digits(raw)
    if not d:
        return ""
    if d.startswith("91") and len(d) == 12:
        return "+" + d
    if d.startswith("0") and len(d) == 11:
        return "+91" + d[1:]
    if len(d) == 10:
        return "+91" + d
    if len(d) >= 12:
        return "+" + d
    return "+" + d


# ───── Queue ops ──────────────────────────────────────────

def enqueue(
    phone: str,
    *,
    user_token: Optional[str] = None,
    language: str = "hi",
    call_sid: Optional[str] = None,
    source: str = "webhook",
    note: Optional[str] = None,
) -> dict:
    phone_clean = _canonical_phone(phone)
    if not phone_clean:
        raise ValueError("phone is required")
    if is_cop_number(phone_clean):
        # Defensive — emergency_service has the same denylist for outbound
        # SOS; we enforce it here for inbound missed-call abuse too.
        log.warning("[missed-call] refused cop number %s", phone_clean)
        raise ValueError("refused: emergency line denied by code policy")
    init_db()
    now = int(time.time())
    status = "queued" if user_token else "pending_link"
    with _DB_LOCK, _conn() as c:
        cur = c.execute(
            """
            INSERT INTO missed_calls
              (phone, user_token, language, call_sid, source, note, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (phone_clean, user_token, language or "hi", call_sid, source, note, status, now),
        )
        row_id = cur.lastrowid
    log.info(
        "[missed-call enqueued] id=%s phone=%s status=%s source=%s",
        row_id, phone_clean, status, source,
    )
    return {"ok": True, "id": row_id, "status": status, "phone": phone_clean}


def link_to_user(phone: str, user_token: str) -> dict:
    """When a user opens a Chitti page on the phone we just missed,
    pair the user_token in. Switches pending_link → queued."""
    init_db()
    phone_clean = _canonical_phone(phone)
    with _DB_LOCK, _conn() as c:
        cur = c.execute(
            """
            UPDATE missed_calls
            SET user_token = ?, status = CASE WHEN status='pending_link' THEN 'queued' ELSE status END
            WHERE phone = ? AND (user_token IS NULL OR user_token = ?)
            """,
            (user_token, phone_clean, user_token),
        )
    return {"ok": True, "linked": cur.rowcount}


def list_for_user(user_token: str, *, limit: int = 50) -> list[dict]:
    init_db()
    with _DB_LOCK, _conn() as c:
        rows = c.execute(
            "SELECT id, phone, user_token, language, call_sid, source, note, status, "
            "attempts, last_error, created_at, dialed_at, finished_at "
            "FROM missed_calls WHERE user_token=? "
            "ORDER BY created_at DESC LIMIT ?",
            (user_token, max(1, min(limit, 200))),
        ).fetchall()
    keys = (
        "id phone user_token language call_sid source note status attempts "
        "last_error created_at dialed_at finished_at"
    ).split()
    return [dict(zip(keys, r)) for r in rows]


def cancel(user_token: str, mc_id: int) -> bool:
    init_db()
    with _DB_LOCK, _conn() as c:
        cur = c.execute(
            "UPDATE missed_calls SET status='cancelled', finished_at=? "
            "WHERE id=? AND user_token=? AND status IN ('queued','pending_link')",
            (int(time.time()), mc_id, user_token),
        )
    return cur.rowcount > 0


# ───── Dispatch (stub today; provider call wires here) ────

def _make_callback(row: dict) -> tuple[bool, str]:
    """
    Return (ok, note). The note ends up in `last_error` on failure or in
    a status-history line on success.

    Honest stub:
      - When CHITTI_TELEPHONY_PROVIDER is unset, this function logs what
        it WOULD have done and returns (False, 'stubbed_no_provider').
      - When set, the matching provider client lives next to this file
        in the per-Chitti service folder; this function dispatches by
        provider name.
    """
    phone = row.get("phone")
    if not _PROVIDER:
        log.info(
            "[missed-call dispatch STUB] phone=%s lang=%s — set CHITTI_TELEPHONY_PROVIDER to enable",
            phone, row.get("language"),
        )
        return False, "stubbed_no_provider"
    # Real provider integration lives in a future commit. Until then,
    # we surface an honest failure rather than pretending to dial.
    log.warning(
        "[missed-call dispatch] provider=%s configured but no client wired yet (phone=%s)",
        _PROVIDER, phone,
    )
    return False, f"provider_{_PROVIDER}_not_wired"


def run_dispatch_queue(*, max_rows: int = 10, max_attempts: int = 3) -> dict:
    """Called by the APScheduler job. Picks queued rows, attempts callbacks."""
    init_db()
    now = int(time.time())
    dialed = 0
    failed = 0
    stubbed = 0
    with _DB_LOCK, _conn() as c:
        rows = c.execute(
            "SELECT id, phone, user_token, language, call_sid, source, note, status, "
            "attempts, last_error, created_at, dialed_at, finished_at "
            "FROM missed_calls WHERE status='queued' AND attempts < ? "
            "ORDER BY created_at ASC LIMIT ?",
            (max_attempts, max_rows),
        ).fetchall()
    keys = (
        "id phone user_token language call_sid source note status attempts "
        "last_error created_at dialed_at finished_at"
    ).split()
    for r in rows:
        row = dict(zip(keys, r))
        ok, note = _make_callback(row)
        with _DB_LOCK, _conn() as c:
            if ok:
                c.execute(
                    "UPDATE missed_calls SET status='dialed', dialed_at=?, finished_at=?, "
                    "attempts=attempts+1, last_error=NULL WHERE id=?",
                    (now, now, row["id"]),
                )
                dialed += 1
            elif note == "stubbed_no_provider":
                # Don't burn through attempts when the provider isn't
                # configured — flip to 'stubbed' so the row is visible
                # but doesn't block the queue forever.
                c.execute(
                    "UPDATE missed_calls SET status='stubbed', attempts=attempts+1, "
                    "last_error=?, finished_at=? WHERE id=?",
                    (note, now, row["id"]),
                )
                stubbed += 1
            else:
                c.execute(
                    "UPDATE missed_calls SET attempts=attempts+1, last_error=? WHERE id=?",
                    (note, row["id"]),
                )
                failed += 1
                # If we hit max_attempts, mark failed terminally.
                c.execute(
                    "UPDATE missed_calls SET status='failed', finished_at=? "
                    "WHERE id=? AND attempts >= ?",
                    (now, row["id"], max_attempts),
                )
    return {
        "upserted": dialed,
        "skipped": stubbed,
        "errors": failed,
        "note": f"missed-call dispatch: dialed={dialed} stubbed={stubbed} failed={failed}",
    }
