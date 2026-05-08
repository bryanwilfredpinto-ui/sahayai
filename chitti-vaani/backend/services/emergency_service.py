"""
services/emergency_service.py
-----------------------------
Vaani's 24/7 emergency cascade — family-only, never cops.

Flow:
  1. Frontend (or Android EmergencyMonitor) detects an emergency keyword
     during ANY Chitti-mediated audio (incoming call, outbound call,
     ambient when armed). It POSTs `/api/vaani/emergency/trigger` with
     reason + transcript.
  2. We log the trigger and fan out a relay event to every paired
     Chitti partner (spouse / children / caregivers).
  3. The frontend simultaneously begins the master-confirm sequence
     locally:
        a) "Master, are you OK? Say theek hun" — 10s wait
        b) On silence: ring alarm via STREAM_ALARM (Android) or Web Audio
        c) On further silence: outbound call to spouse from trusted circle
  4. If a paired partner's Chitti is connected (web polling /
     Android FCM), it receives the relay event and rings its OWN alarm
     on the partner's phone — even if the partner's phone is on silent.

We never auto-call 112 / 100 / 102 / 1098 / 1930 / 108. The keyword
denylist below traps any caller_token that resembles a government
emergency line, so a misconfigured trusted circle cannot escalate to
cops via this path.
"""
from __future__ import annotations

import logging
import time
from typing import List, Optional

from services import relay_db

log = logging.getLogger("emergency")


# Multi-language keyword set. Frontend / Vosk are the primary detectors;
# the backend just trusts the trigger and fans out. We keep this list
# here for later server-side validation (e.g. weighting / dedup) without
# coupling the detector to the protocol.
EMERGENCY_KEYWORDS = [
    # English
    "emergency", "ambulance", "hospital", "accident", "heart attack",
    "stroke", "choking", "seizure", "fire", "help", "bleeding",
    "unconscious", "fainted",
    # Hindi
    "bachao", "madad", "dard", "dil ka dauraa", "saans", "khoon",
    "behosh", "girne", "atak", "aag",
    # Tamil
    "udavi", "valippadu",
    # Telugu
    "sahaayam", "gunde",
    # Bengali
    "shahajjo", "hridrog",
]

# Numbers Chitti REFUSES to auto-dial — even if a misconfigured trusted
# circle entry has one of these. Bryan's rule: family only, never cops.
COP_DENYLIST = {"112", "100", "101", "102", "108", "1098", "1930", "139"}


def is_cop_number(number: str) -> bool:
    digits = "".join(c for c in (number or "") if c.isdigit())
    return digits in COP_DENYLIST


def trigger(
    user_token: str,
    *,
    reason: str = "",
    transcript: str = "",
    source: str = "web",
) -> dict:
    """Master's Chitti has detected (or master pressed) emergency.

    Push a relay event to every paired partner. Frontend handles the
    local cascade (alarm, ring spouse, etc) — that's where the user's
    actual phone is.
    """
    if not user_token:
        return {"ok": False, "error": "user_token required"}

    payload = {
        "reason":     (reason or "").strip()[:200],
        "transcript": (transcript or "").strip()[:1000],
        "source":     source,
        "ts":         int(time.time()),
    }

    partners = relay_db.list_partners(user_token)
    fanout_ids: List[int] = []
    for p in partners:
        eid = relay_db.push_event(
            to_user=p["partner_token"],
            from_user=user_token,
            kind="emergency",
            payload=payload,
        )
        if eid:
            fanout_ids.append(eid)

    log.warning(
        "emergency triggered user_token=%s source=%s partners=%d reason=%s",
        user_token[:8] + "…", source, len(partners), payload["reason"],
    )
    return {
        "ok": True,
        "partners_notified": len(fanout_ids),
        "fanout_ids": fanout_ids,
        "reminder_to_frontend": (
            "Frontend MUST run the local cascade: master-confirm 10s, then alarm "
            "via STREAM_ALARM, then outbound call to spouse. NEVER auto-dial cops."
        ),
    }


def check_in(user_token: str, said: str = "") -> dict:
    """Master responded 'theek hun' / 'I'm OK' — abort cascade locally
    and tell paired partners we're fine."""
    if not user_token:
        return {"ok": False, "error": "user_token required"}
    payload = {
        "said": (said or "")[:200],
        "ts":   int(time.time()),
    }
    partners = relay_db.list_partners(user_token)
    for p in partners:
        relay_db.push_event(
            to_user=p["partner_token"],
            from_user=user_token,
            kind="emergency_check_in",
            payload=payload,
        )
    log.info("emergency check-in user_token=%s said=%r", user_token[:8] + "…", said)
    return {"ok": True, "partners_notified": len(partners)}


def issue_pair_code(user_token: str, user_label: str = "") -> dict:
    code = relay_db.issue_pair_code(user_token, user_label)
    return {"ok": True, "code": code, "expires_in_seconds": 300}


def accept_pair_code(code: str, partner_token: str, partner_label: str = "") -> dict:
    pair = relay_db.consume_pair_code(code, partner_token, partner_label)
    if not pair:
        return {"ok": False, "error": "code invalid, expired, or self-pair"}
    return {"ok": True, "pair": pair}


def list_partners(user_token: str) -> dict:
    return {"ok": True, "partners": relay_db.list_partners(user_token)}


def unpair(user_token: str, partner_token: str) -> dict:
    return {"ok": True, "removed": relay_db.unpair(user_token, partner_token)}


def poll(user_token: str) -> dict:
    """Frontend long-poll equivalent. Returns any emergency relay events
    queued for this user since the last call."""
    if not user_token:
        return {"ok": False, "error": "user_token required"}
    events = relay_db.fetch_pending(user_token, mark_delivered=True)
    return {"ok": True, "events": events}
