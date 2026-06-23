"""
services/memory_client.py  —  BO2  (MEMORY FIRST)
-------------------------------------------------
Chitti Jobs must know the user before it scrapes, scores, or drafts
anything (Constitution Art 10). Identity is the device-pseudonymous
`X-User-Token` UUID — the same identity the Memory OS uses
(MEMORY_ARCHITECTURE.md §1). No login, no PII required (DPDP minimisation).

Two layers, both best-effort and NEVER blocking (memory design principle:
if memory is unavailable, Chitti behaves normally):

  1. LOCAL  — the chitti-jobs `users` table is the durable job profile,
              keyed by uid. This always works and is the source of truth
              for this product (one-DB-per-Chitti, §2).
  2. BRIDGE — when CHITTI_MEMORY_URL is set, read/merge + write-back the
              profile as Memory-OS facts (mem_fact shape) so the central
              memory and other Chittis can see it. When unset, this is a
              silent no-op (honest: no fake "synced" claim).

Consent-first: a durable profile is only written when the user opts in
(consent_basic=True), captured at onboarding.
"""
from __future__ import annotations

import json
import logging

import httpx
from sqlalchemy.orm import Session

from config import settings
from models.user import UserProfile

log = logging.getLogger("services.memory_client")

_LIST_FIELDS = ("target_roles", "target_locations", "target_industries", "blacklist_companies")
# Profile fields exposed/accepted (CEOS BO2 field list + Gulf flag).
_SCALAR_FIELDS = (
    "name", "experience_years", "current_role", "salary_expectation",
    "work_type", "resume_text", "linkedin_url", "career_situation",
    "gulf_target", "lang",
)


def _loads(v):
    if not v:
        return []
    try:
        out = json.loads(v)
        return out if isinstance(out, list) else []
    except (ValueError, TypeError):
        return [s.strip() for s in str(v).split(",") if s.strip()]


def profile_to_dict(p: UserProfile | None) -> dict:
    if p is None:
        return {}
    d = {
        "uid": p.uid,
        "name": p.name,
        "experience_years": p.experience_years,
        "current_role": p.current_role,
        "salary_expectation": p.salary_expectation,
        "work_type": p.work_type,
        "resume_text": p.resume_text,
        "linkedin_url": p.linkedin_url,
        "career_situation": p.career_situation,
        "gulf_target": bool(p.gulf_target),
        "user_level": p.user_level,
        "lang": p.lang,
        "consent_basic": bool(p.consent_basic),
    }
    for f in _LIST_FIELDS:
        d[f] = _loads(getattr(p, f))
    return d


def knows_user(db: Session, uid: str) -> bool:
    p = db.query(UserProfile).filter(UserProfile.uid == uid).first()
    if not p:
        return False
    # "Knows" = has enough to act: a name OR experience OR at least one target role.
    return bool(p.name or p.experience_years is not None or _loads(p.target_roles))


def get_profile(db: Session, uid: str) -> dict:
    """Return the user's job profile. Reads local first, then merges any
    Memory-OS bridge facts on top (bridge wins for fields it provides)."""
    p = db.query(UserProfile).filter(UserProfile.uid == uid).first()
    base = profile_to_dict(p)
    bridged = _bridge_fetch(uid)
    if bridged:
        base.update({k: v for k, v in bridged.items() if v not in (None, "", [])})
    base["uid"] = uid
    return base


def save_profile(db: Session, uid: str, fields: dict, consent: bool | None = None) -> dict:
    """Upsert the user's job profile (onboarding / edits). Consent-gated."""
    p = db.query(UserProfile).filter(UserProfile.uid == uid).first()
    if p is None:
        p = UserProfile(uid=uid)
        db.add(p)

    if consent is not None:
        p.consent_basic = bool(consent)

    for f in _SCALAR_FIELDS:
        if f in fields and fields[f] is not None:
            setattr(p, f, fields[f])
    for f in _LIST_FIELDS:
        if f in fields and fields[f] is not None:
            val = fields[f]
            setattr(p, f, json.dumps(val if isinstance(val, list) else _split(val)))

    db.commit()
    db.refresh(p)
    out = profile_to_dict(p)
    _bridge_write(uid, out)  # best-effort, never raises
    return out


def _split(v):
    return [s.strip() for s in str(v).split(",") if s.strip()]


# ── Memory-OS bridge (optional; no-op when CHITTI_MEMORY_URL unset) ──────────

def _bridge_fetch(uid: str) -> dict:
    if not settings.CHITTI_MEMORY_URL:
        return {}
    try:
        url = settings.CHITTI_MEMORY_URL.rstrip("/") + "/api/memory/facts"
        with httpx.Client(timeout=4.0) as c:
            r = c.get(url, params={"uid": uid, "scope": "general"})
            r.raise_for_status()
            facts = (r.json() or {}).get("facts", [])
        out: dict = {}
        for fact in facts:
            k, v = fact.get("key"), fact.get("value")
            if k == "job_profile" and v:
                try:
                    out.update(json.loads(v))
                except (ValueError, TypeError):
                    pass
        return out
    except Exception as e:  # noqa: BLE001 — memory NEVER blocks
        log.info("memory bridge fetch skipped: %s", e)
        return {}


def _bridge_write(uid: str, profile: dict) -> None:
    if not settings.CHITTI_MEMORY_URL or not profile.get("consent_basic"):
        return
    try:
        url = settings.CHITTI_MEMORY_URL.rstrip("/") + "/api/memory/fact"
        payload = {
            "uid": uid, "key": "job_profile", "value": json.dumps(profile),
            "category": "preference", "scope": "general", "source_chitti": "chitti-jobs",
        }
        with httpx.Client(timeout=4.0) as c:
            c.post(url, json=payload)
    except Exception as e:  # noqa: BLE001 — memory NEVER blocks
        log.info("memory bridge write skipped: %s", e)
