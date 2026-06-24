"""
lib/dpdp_consent.py — Universal DPDP Act 2023 consent + user-facts store.
================================================================================
Shared module (vendored into / imported by every Chitti backend). It owns the
two tables that back Universal Onboarding:

  * user_facts      — one row per device UUID: the onboarding profile + the
                      onboarding_complete flag (occupation, district, vehicle,
                      GST, family-health context, chosen language, …).
  * dpdp_consent    — granular per-domain consent rows. **Default is DENY** —
                      a domain with no row (or a revoked row) returns False.
  * dpdp_tombstone  — "Chitti forget" record. PII is deleted; a tombstone row
                      is kept so aggregate counts stay honest (DPDP §"erase").

Doctrine
--------
* **Fail-closed.** check_consent() returns False on ANY error. Denying access
  to domain data on a DB hiccup is the DPDP-safe failure mode.
* **Default OFF.** No consent row → no consent. The onboarding UI ships every
  toggle OFF; this module enforces the same default server-side.
* **Storage.** Plain sqlite3 against the path in env ``DPDP_DB`` (default
  ``<repo>/data/dpdp.db``). A Turso libSQL *embedded replica* is a SQLite file
  on disk, so production just points DPDP_DB at that replica path — no code
  change, and this module stays unit-testable with a throwaway temp DB.

Public API (what every Chitti backend calls)
--------------------------------------------
  check_consent(user_id, domain)  -> bool   # gate BEFORE touching domain data
  grant_consent(user_id, domain)  -> None
  revoke_consent(user_id, domain) -> None
  forget_user(user_id)            -> dict   # delete all data, keep tombstone
  set_user_facts(user_id, facts, onboarding_complete=True) -> None
  get_user_facts(user_id)         -> dict | None
  is_onboarded(user_id)           -> bool

Domains: health · financial · legal · vehicle · cross_chitti  (extensible).
"""

from __future__ import annotations

import json
import os
import sqlite3
import threading
from datetime import datetime, timezone

# The five locked onboarding consent domains (Step 4). New domains may be added;
# unknown domains are still honoured (stored), but these are the canonical set
# the onboarding UI renders, all OFF by default.
VALID_DOMAINS = ("health", "financial", "legal", "vehicle", "cross_chitti")

_LOCK = threading.Lock()


def _db_path() -> str:
    p = os.environ.get("DPDP_DB")
    if p:
        return p
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # repo root
    data_dir = os.path.join(here, "data")
    try:
        os.makedirs(data_dir, exist_ok=True)
    except Exception:
        data_dir = here
    return os.path.join(data_dir, "dpdp.db")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _conn() -> sqlite3.Connection:
    c = sqlite3.connect(_db_path(), timeout=10)
    c.execute("PRAGMA journal_mode=WAL")
    c.executescript(
        """
        CREATE TABLE IF NOT EXISTS user_facts (
            user_id TEXT PRIMARY KEY,
            facts_json TEXT NOT NULL DEFAULT '{}',
            onboarding_complete INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS dpdp_consent (
            user_id TEXT NOT NULL,
            domain  TEXT NOT NULL,
            granted INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (user_id, domain)
        );
        CREATE TABLE IF NOT EXISTS dpdp_tombstone (
            user_id TEXT PRIMARY KEY,
            tombstoned_at TEXT NOT NULL
        );
        """
    )
    return c


# ──────────────────────────────────────────────────────────────────────────
# Consent gate — call check_consent() BEFORE accessing domain-specific data.
# ──────────────────────────────────────────────────────────────────────────
def check_consent(user_id: str, domain: str) -> bool:
    """Return True only if this user has explicitly granted `domain`.

    DEFAULT DENY. Returns False for: no row, revoked row, forgotten user,
    missing args, or ANY exception (fail-closed)."""
    if not user_id or not domain:
        return False
    try:
        with _LOCK, _conn() as c:
            # A forgotten user has no consent, period.
            tomb = c.execute(
                "SELECT 1 FROM dpdp_tombstone WHERE user_id=?", (user_id,)
            ).fetchone()
            if tomb:
                return False
            row = c.execute(
                "SELECT granted FROM dpdp_consent WHERE user_id=? AND domain=?",
                (user_id, domain),
            ).fetchone()
            return bool(row and row[0] == 1)
    except Exception:
        return False  # fail-closed — deny on error


def grant_consent(user_id: str, domain: str) -> None:
    if not user_id or not domain:
        raise ValueError("user_id and domain are required")
    with _LOCK, _conn() as c:
        c.execute(
            """INSERT INTO dpdp_consent (user_id, domain, granted, updated_at)
               VALUES (?,?,1,?)
               ON CONFLICT(user_id, domain)
               DO UPDATE SET granted=1, updated_at=excluded.updated_at""",
            (user_id, domain, _now()),
        )


def revoke_consent(user_id: str, domain: str) -> None:
    if not user_id or not domain:
        raise ValueError("user_id and domain are required")
    with _LOCK, _conn() as c:
        c.execute(
            """INSERT INTO dpdp_consent (user_id, domain, granted, updated_at)
               VALUES (?,?,0,?)
               ON CONFLICT(user_id, domain)
               DO UPDATE SET granted=0, updated_at=excluded.updated_at""",
            (user_id, domain, _now()),
        )


def set_consents(user_id: str, consents: dict) -> None:
    """Bulk apply a {domain: bool} map (used by the onboarding endpoint)."""
    if not user_id or not isinstance(consents, dict):
        raise ValueError("user_id and a consents dict are required")
    for domain, granted in consents.items():
        if granted:
            grant_consent(user_id, str(domain))
        else:
            revoke_consent(user_id, str(domain))


def list_consents(user_id: str) -> dict:
    """Return {domain: bool} for all five canonical domains (DENY default)."""
    out = {d: False for d in VALID_DOMAINS}
    if not user_id:
        return out
    try:
        with _LOCK, _conn() as c:
            if c.execute("SELECT 1 FROM dpdp_tombstone WHERE user_id=?", (user_id,)).fetchone():
                return out
            for domain, granted in c.execute(
                "SELECT domain, granted FROM dpdp_consent WHERE user_id=?", (user_id,)
            ).fetchall():
                out[domain] = bool(granted == 1)
    except Exception:
        pass
    return out


# ──────────────────────────────────────────────────────────────────────────
# user_facts — the onboarding profile, keyed by device UUID.
# ──────────────────────────────────────────────────────────────────────────
def set_user_facts(user_id: str, facts: dict, onboarding_complete: bool = True) -> None:
    if not user_id:
        raise ValueError("user_id is required")
    facts = facts or {}
    with _LOCK, _conn() as c:
        # Re-onboarding a forgotten user lifts the tombstone (fresh consent).
        c.execute("DELETE FROM dpdp_tombstone WHERE user_id=?", (user_id,))
        c.execute(
            """INSERT INTO user_facts (user_id, facts_json, onboarding_complete, updated_at)
               VALUES (?,?,?,?)
               ON CONFLICT(user_id)
               DO UPDATE SET facts_json=excluded.facts_json,
                             onboarding_complete=excluded.onboarding_complete,
                             updated_at=excluded.updated_at""",
            (user_id, json.dumps(facts, ensure_ascii=False), 1 if onboarding_complete else 0, _now()),
        )


def get_user_facts(user_id: str) -> dict | None:
    if not user_id:
        return None
    try:
        with _LOCK, _conn() as c:
            row = c.execute(
                "SELECT facts_json, onboarding_complete FROM user_facts WHERE user_id=?",
                (user_id,),
            ).fetchone()
            if not row:
                return None
            facts = json.loads(row[0] or "{}")
            facts["onboarding_complete"] = bool(row[1] == 1)
            return facts
    except Exception:
        return None


def is_onboarded(user_id: str) -> bool:
    f = get_user_facts(user_id)
    return bool(f and f.get("onboarding_complete"))


# ──────────────────────────────────────────────────────────────────────────
# "Chitti forget" — delete ALL data, keep a tombstone (DPDP right to erase).
# ──────────────────────────────────────────────────────────────────────────
def forget_user(user_id: str) -> dict:
    if not user_id:
        raise ValueError("user_id is required")
    with _LOCK, _conn() as c:
        consents = c.execute(
            "SELECT COUNT(*) FROM dpdp_consent WHERE user_id=?", (user_id,)
        ).fetchone()[0]
        facts = c.execute(
            "SELECT COUNT(*) FROM user_facts WHERE user_id=?", (user_id,)
        ).fetchone()[0]
        c.execute("DELETE FROM dpdp_consent WHERE user_id=?", (user_id,))
        c.execute("DELETE FROM user_facts WHERE user_id=?", (user_id,))
        c.execute(
            """INSERT INTO dpdp_tombstone (user_id, tombstoned_at) VALUES (?,?)
               ON CONFLICT(user_id) DO UPDATE SET tombstoned_at=excluded.tombstoned_at""",
            (user_id, _now()),
        )
    return {"user_id": user_id, "consents_deleted": consents, "facts_deleted": facts,
            "tombstoned": True}


# ──────────────────────────────────────────────────────────────────────────
# Self-test — `python lib/dpdp_consent.py` (uses a throwaway temp DB).
# ──────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import tempfile

    os.environ["DPDP_DB"] = os.path.join(tempfile.mkdtemp(), "dpdp_test.db")
    uid = "device-abc-123"
    fails = []

    def chk(name, cond):
        print(("✅" if cond else "❌") + "  " + name)
        if not cond:
            fails.append(name)

    # Default DENY for every domain.
    for d in VALID_DOMAINS:
        chk(f"default deny: {d}", check_consent(uid, d) is False)

    # Grant → True; revoke → False.
    grant_consent(uid, "health")
    chk("grant health → allowed", check_consent(uid, "health") is True)
    revoke_consent(uid, "health")
    chk("revoke health → denied", check_consent(uid, "health") is False)

    # Bulk set + list (all OFF default honoured).
    set_consents(uid, {"financial": True, "vehicle": True})
    cl = list_consents(uid)
    chk("bulk grant financial", cl["financial"] is True)
    chk("bulk grant vehicle", cl["vehicle"] is True)
    chk("untouched legal stays OFF", cl["legal"] is False)

    # user_facts round-trip + onboarding flag.
    set_user_facts(uid, {"lang": "hi", "occupation": "kisaan", "district": "Nagpur"})
    chk("is_onboarded after set", is_onboarded(uid) is True)
    chk("facts round-trip occupation", get_user_facts(uid)["occupation"] == "kisaan")

    # Bad args fail-closed.
    chk("empty user_id denied", check_consent("", "health") is False)
    chk("empty domain denied", check_consent(uid, "") is False)

    # Forget → everything denied + facts gone + onboarded False.
    res = forget_user(uid)
    chk("forget reports tombstoned", res["tombstoned"] is True)
    chk("forget denies financial", check_consent(uid, "financial") is False)
    chk("forget clears facts", get_user_facts(uid) is None)
    chk("forget → not onboarded", is_onboarded(uid) is False)

    # Re-onboard lifts tombstone.
    set_user_facts(uid, {"lang": "en"})
    grant_consent(uid, "health")
    chk("re-onboard lifts tombstone (health allowed)", check_consent(uid, "health") is True)

    print(f"\n{'ALL PASS' if not fails else str(len(fails)) + ' FAILED'} "
          f"({len(VALID_DOMAINS)} domains)")
    raise SystemExit(1 if fails else 0)
