"""
services/relay_db.py
--------------------
SQLite store for Chitti-to-Chitti emergency pairs and a small inbox of
relay events that web Chittis poll for (Android v2 will swap polling
for FCM push).

Tables:
  pair_codes — pending pair codes (6-digit, expire in 5 min)
  pairs      — symmetric pairs between user_tokens
  relay_inbox — events to be delivered to a partner's Chitti
"""
from __future__ import annotations

import json
import os
import secrets
import sqlite3
import threading
import time
from typing import List, Optional

_LOCK = threading.Lock()
_DB_PATH = os.environ.get("VAANI_RELAY_DB", "/tmp/chitti_vaani_relay.sqlite")


def _conn():
    c = sqlite3.connect(_DB_PATH, timeout=10.0, isolation_level=None)
    c.execute("PRAGMA journal_mode=WAL")
    c.execute("PRAGMA synchronous=NORMAL")
    return c


def init_db() -> None:
    with _LOCK, _conn() as c:
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS pair_codes (
                code        TEXT PRIMARY KEY,
                user_token  TEXT NOT NULL,
                user_label  TEXT,
                created_at  INTEGER NOT NULL
            )
            """
        )
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS pairs (
                user_a      TEXT NOT NULL,
                user_b      TEXT NOT NULL,
                label_for_a TEXT,
                label_for_b TEXT,
                created_at  INTEGER NOT NULL,
                PRIMARY KEY (user_a, user_b)
            )
            """
        )
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS relay_inbox (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                to_user     TEXT NOT NULL,
                from_user   TEXT NOT NULL,
                kind        TEXT NOT NULL,
                payload     TEXT NOT NULL,
                created_at  INTEGER NOT NULL,
                delivered   INTEGER NOT NULL DEFAULT 0
            )
            """
        )
        c.execute("CREATE INDEX IF NOT EXISTS idx_inbox_to ON relay_inbox(to_user, delivered, id)")


def issue_pair_code(user_token: str, user_label: str = "") -> str:
    code = "".join(secrets.choice("0123456789") for _ in range(6))
    with _LOCK, _conn() as c:
        c.execute("INSERT OR REPLACE INTO pair_codes(code, user_token, user_label, created_at) VALUES (?,?,?,?)",
                  (code, user_token, user_label[:80], int(time.time())))
        # Sweep stale codes (older than 5 minutes)
        c.execute("DELETE FROM pair_codes WHERE created_at < ?", (int(time.time()) - 300,))
    return code


def consume_pair_code(code: str, partner_token: str, partner_label: str = "") -> Optional[dict]:
    with _LOCK, _conn() as c:
        row = c.execute(
            "SELECT user_token, user_label FROM pair_codes WHERE code=? AND created_at >= ?",
            (code, int(time.time()) - 300),
        ).fetchone()
        if not row:
            return None
        owner_token, owner_label = row
        if owner_token == partner_token:
            return None  # cannot pair with self
        c.execute("DELETE FROM pair_codes WHERE code=?", (code,))
        # Symmetric pair (user_a < user_b lexicographically to keep one row)
        a, b = sorted([owner_token, partner_token])
        if a == owner_token:
            la, lb = owner_label or "", partner_label or ""
        else:
            la, lb = partner_label or "", owner_label or ""
        c.execute(
            "INSERT OR REPLACE INTO pairs(user_a, user_b, label_for_a, label_for_b, created_at) VALUES (?,?,?,?,?)",
            (a, b, la, lb, int(time.time())),
        )
        return {"user_a": a, "user_b": b, "label_for_a": la, "label_for_b": lb}


def list_partners(user_token: str) -> List[dict]:
    with _LOCK, _conn() as c:
        rows = c.execute(
            """SELECT user_a, user_b, label_for_a, label_for_b, created_at
                 FROM pairs WHERE user_a=? OR user_b=?""",
            (user_token, user_token),
        ).fetchall()
    out = []
    for ua, ub, la, lb, ts in rows:
        if ua == user_token:
            out.append({"partner_token": ub, "partner_label": lb, "since": ts})
        else:
            out.append({"partner_token": ua, "partner_label": la, "since": ts})
    return out


def unpair(user_token: str, partner_token: str) -> bool:
    a, b = sorted([user_token, partner_token])
    with _LOCK, _conn() as c:
        cur = c.execute("DELETE FROM pairs WHERE user_a=? AND user_b=?", (a, b))
        return (cur.rowcount or 0) > 0


def push_event(to_user: str, from_user: str, kind: str, payload: dict) -> int:
    with _LOCK, _conn() as c:
        cur = c.execute(
            "INSERT INTO relay_inbox(to_user, from_user, kind, payload, created_at, delivered) VALUES (?,?,?,?,?,0)",
            (to_user, from_user, kind, json.dumps(payload), int(time.time())),
        )
        return cur.lastrowid or 0


def fetch_pending(user_token: str, *, mark_delivered: bool = True, limit: int = 20) -> List[dict]:
    with _LOCK, _conn() as c:
        rows = c.execute(
            """SELECT id, from_user, kind, payload, created_at
                 FROM relay_inbox
                WHERE to_user=? AND delivered=0
                ORDER BY id ASC LIMIT ?""",
            (user_token, limit),
        ).fetchall()
        ids = [r[0] for r in rows]
        if mark_delivered and ids:
            c.execute(
                f"UPDATE relay_inbox SET delivered=1 WHERE id IN ({','.join('?'*len(ids))})",
                ids,
            )
        # Sweep delivered events older than 24h
        c.execute("DELETE FROM relay_inbox WHERE delivered=1 AND created_at < ?", (int(time.time()) - 86400,))
    return [
        {"id": r[0], "from": r[1], "kind": r[2], "payload": json.loads(r[3] or "{}"), "ts": r[4]}
        for r in rows
    ]


init_db()
