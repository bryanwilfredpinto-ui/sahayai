"""
chitti-founder / lib / cto_certify.py — 2026-05-27 (Chitti CTO directive)
                                       — 2026-05-27 (rev 2: Vaani-only rails)

Chitti CTO = Solution Architect + Quality Auditor. Every feature Claude Code
builds must be certified by the CTO BEFORE Sire sees it.

Notification rails (LOCKED 2026-05-27 rev 2):
   CTO notifications go through Chitti Vaani ONLY.
   No Twilio. No Meta Cloud. No MSG91. No new APIs.
   Vaani uses its existing rails:
     • speakText()  — speaks the message aloud
     • wa.me deep link — opens WhatsApp app, pre-filled message
     • sms: deep link — opens SMS app, pre-filled message (Sire's second SIM)

Verdict semantics (unchanged from rev 1):
   CERTIFIED    — every changed page passed; first-time pass for this feature
   CONDITIONAL  — green but ≥1 gate is `needs_human`
   REJECTED     — at least one changed page is red. Claude fixes silently;
                   no Sire notification yet. Once re-certified, message
                   format flips to "had issues. Fixed now." (recovery).

Doctrine: see CHITTI_CTO_OATH.md (repo root).
"""
from __future__ import annotations

import logging
import os
import re
import uuid
from collections import deque
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Any

from lib.cto_verifier import (
    verify_url,
    URLVerifyResult,
)

log = logging.getLogger("chitti-founder.cto-certify")


# ---------- Notification queue (Vaani rail) -------------------------------
# Vaani frontend polls /api/cto/notifications/pending. On pickup Vaani:
#   1. speakText(spoken_text)
#   2. window.open(wa_link) if sire_whatsapp present
#   3. location.href = sms_link if sire_sms present
# All three actions on every notification.
_VAANI_QUEUE_MAX = 50
_VAANI_QUEUE: deque[dict[str, Any]] = deque(maxlen=_VAANI_QUEUE_MAX)

# Recent certificates ring for /admin/founder/cto-certificates + recovery detection.
_CERT_RING_MAX = 200
_CERT_RING: deque[dict[str, Any]] = deque(maxlen=_CERT_RING_MAX)


# ---------- Sire's numbers (env-driven, never logged) ----------------------


def _digits_only(s: str) -> str:
    return re.sub(r"\D+", "", s or "")


def _sire_whatsapp_number() -> str:
    """E.164 digits-only (no +) for wa.me deep links. Empty if unset."""
    n = (os.environ.get("SIRE_WHATSAPP_NUMBER")
         or os.environ.get("SIRE_PHONE_NUMBER", ""))
    return _digits_only(n)


def _sire_sms_number() -> str:
    """E.164 with optional + for sms: deep links. Falls back to WhatsApp number
    if SIRE_SMS_NUMBER unset (single SIM households)."""
    n = (os.environ.get("SIRE_SMS_NUMBER")
         or os.environ.get("SIRE_PHONE_NUMBER", ""))
    if not n: return ""
    d = _digits_only(n)
    return "+" + d if d else ""


# ---------- Result types ---------------------------------------------------


@dataclass
class Certificate:
    """A CTO certificate for one feature handover."""
    id: str
    ts: str                            # ISO UTC
    feature_name: str
    commit_sha: str
    test_plan_summary: str
    pages_checked: list[dict[str, Any]] = field(default_factory=list)
    verdict: str = "PENDING"           # CERTIFIED | CONDITIONAL | REJECTED
    reasons: list[str] = field(default_factory=list)
    needs_human: list[str] = field(default_factory=list)
    spoken_text: str = ""              # Vaani speaks this
    message: str = ""                  # WhatsApp + SMS body
    recovery: bool = False             # True if prior cert for this feature was REJECTED
    notified_via_vaani: bool = False   # True iff queued; deep links fire when Vaani polls
    sire_targets: dict[str, str] = field(default_factory=dict)  # {whatsapp: "...", sms: "..."}

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


# ---------- Resolver: changed file → public URL ----------------------------


def _resolve_url(repo_path: str) -> str | None:
    p = (repo_path or "").strip().lstrip("./")
    if not p: return None
    if "/" in p and p.split("/")[0].startswith("chitti-"):
        return None  # backend code — not user-facing
    if "/backend/" in p or "/scripts/" in p:
        return None
    if p.endswith(".html") or p.endswith(".js") or p.endswith(".css") or p.startswith("tools/"):
        return f"https://sahayai.in/{p}"
    return None


# ---------- Verdict logic --------------------------------------------------


def _decide_verdict(results: list[URLVerifyResult]) -> tuple[str, list[str], list[str]]:
    """Return (verdict, reasons, needs_human_summaries)."""
    if not results:
        return "REJECTED", ["No public URLs derived from changed files."], []
    reasons: list[str] = []
    needs_human: list[str] = []
    any_red = False
    any_yellow = False
    for r in results:
        page = r.url.split("/")[-1] or r.url
        if r.red:
            any_red = True
            failed = next((g for g in r.gates if g.status == "fail"), None)
            reasons.append(
                f"🔴 {page} — {failed.name}: {failed.detail}" if failed
                else f"🔴 {page} — HTTP {r.http_status}"
            )
        elif r.yellow:
            any_yellow = True
            for g in r.gates:
                if g.status == "needs_human":
                    needs_human.append(f"{page} · {g.name}")
        else:
            reasons.append(f"✅ {page} — clean")
    if any_red:    return "REJECTED",    reasons, needs_human
    if any_yellow: return "CONDITIONAL", reasons, needs_human
    return "CERTIFIED", reasons, needs_human


# ---------- Recovery detection ---------------------------------------------


def _was_recently_rejected(feature_name: str) -> bool:
    """True iff the most recent prior cert for this feature_name was REJECTED.
    Bounds the lookback to the ring (most recent 200 certs)."""
    if not feature_name: return False
    fn = feature_name.strip().lower()
    # Walk the ring newest → oldest
    for c in reversed(_CERT_RING):
        if (c.get("feature_name", "").strip().lower() == fn):
            return c.get("verdict") == "REJECTED"
    return False


# ---------- Message rendering (the spec's exact wording) -------------------


def _page_label(cert: Certificate) -> str:
    """The '[page]' slot in the Sire message. Prefer feature_name; fall back
    to first changed page's filename; else 'the change'."""
    if cert.feature_name and cert.feature_name != "unspecified-feature":
        # Trim conventional-commit prefix to keep messages short
        head = re.sub(r"^(feat|fix|chore|test|docs|refactor|perf|build|ci)\([^)]+\):\s*", "", cert.feature_name)
        head = re.sub(r"^(feat|fix|chore|test|docs|refactor|perf|build|ci):\s*", "", head)
        return head.strip().rstrip(".").split("\n")[0][:80] or cert.feature_name[:80]
    if cert.pages_checked:
        return (cert.pages_checked[0].get("url") or "").split("/")[-1] or "the page"
    return "the change"


def _build_messages(cert: Certificate) -> tuple[str, str]:
    """Return (spoken_text, written_message) per Sire's locked format:

      CERTIFIED + first-time : "Sire, [page] certified and ready."
      CERTIFIED + recovery   : "Sire, [page] had issues. Fixed now."
      CONDITIONAL            : "Sire, [page] certified. {n} items need your eyes."
      REJECTED               : (not sent to Sire — quiet failure)
    """
    label = _page_label(cert)

    if cert.verdict == "REJECTED":
        # No Sire notification on REJECTED — Claude fixes and re-certifies.
        return "", ""

    if cert.verdict == "CONDITIONAL":
        n = len(cert.needs_human)
        if n > 0:
            msg = f"Sire, {label} certified. {n} item{'s' if n != 1 else ''} need your eyes."
        else:
            msg = f"Sire, {label} certified and ready."
        return msg, msg

    # CERTIFIED
    if cert.recovery:
        msg = f"Sire, {label} had issues. Fixed now."
    else:
        msg = f"Sire, {label} certified and ready."
    return msg, msg


# ---------- Public API -----------------------------------------------------


def certify_feature(
    feature_name: str,
    commit_sha: str = "",
    changed_files: list[str] | None = None,
    test_plan_summary: str = "",
    extra_urls: list[str] | None = None,
    notify_vaani: bool = True,
    notify_whatsapp: bool = True,   # kept for backward-compat with GH Action; ignored
) -> Certificate:
    """The CTO entrypoint. Claude Code calls this every time it claims a
    feature is done. Returns a Certificate. On CERTIFIED / CONDITIONAL the
    notification is queued for Vaani (which fires speak + wa.me + sms:).
    On REJECTED Sire is NOT notified — Claude fixes silently and re-certs.

    `notify_whatsapp` exists only so the GH Action payload doesn't break; it
    no longer triggers an external API call. Vaani is the sole rail.
    """
    cert_id = f"cert-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')}-{uuid.uuid4().hex[:6]}"
    ts = datetime.now(timezone.utc).isoformat()

    # 1. Resolve URLs
    urls: list[str] = list(extra_urls or [])
    for f in (changed_files or []):
        u = _resolve_url(f)
        if u and u not in urls:
            urls.append(u)

    cert = Certificate(
        id=cert_id, ts=ts,
        feature_name=feature_name,
        commit_sha=commit_sha,
        test_plan_summary=test_plan_summary,
    )

    if not urls:
        # Backend/library-only changes — the 10-gate rail has nothing to verify.
        # Be honest: CONDITIONAL with a needs_human note. No Sire notification
        # by default for these — Claude is expected to have run the tests.
        cert.verdict = "CONDITIONAL"
        cert.reasons = ["No public URLs to fetch. Backend/library-only change."]
        cert.needs_human = ["Confirm backend tests pass; call certify again with extra_urls if a frontend change shipped."]
        cert.spoken_text = ""
        cert.message = ""
        _CERT_RING.append(cert.to_dict())
        log.info("[cto-certify] %s · %s · backend-only · silent", cert.id, cert.verdict)
        return cert

    # 2. Run the 10-gate verifier on each URL
    results: list[URLVerifyResult] = [verify_url(u) for u in urls]
    cert.pages_checked = [r.to_dict() for r in results]

    # 3. Decide verdict + recovery flag (recovery uses ring BEFORE we append)
    verdict, reasons, needs_human = _decide_verdict(results)
    cert.verdict = verdict
    cert.reasons = reasons
    cert.needs_human = needs_human
    cert.recovery = (verdict == "CERTIFIED" and _was_recently_rejected(feature_name))

    # 4. Build Sire-facing messages
    cert.spoken_text, cert.message = _build_messages(cert)

    # 5. Queue for Vaani (sole rail). Skipped on REJECTED.
    if notify_vaani and cert.verdict != "REJECTED" and cert.message:
        wa = _sire_whatsapp_number()
        sms = _sire_sms_number()
        cert.sire_targets = {"whatsapp": wa, "sms": sms}
        _VAANI_QUEUE.append({
            "id": cert.id,
            "ts": cert.ts,
            "kind": "cto_certificate",
            "verdict": cert.verdict,
            "feature_name": cert.feature_name,
            "spoken_text": cert.spoken_text,
            "message": cert.message,             # body for wa.me + sms:
            "sire_whatsapp": wa,                 # digits only, for wa.me
            "sire_sms": sms,                     # +E.164, for sms:
            "recovery": cert.recovery,
        })
        cert.notified_via_vaani = True

    _CERT_RING.append(cert.to_dict())
    log.info(
        "[cto-certify] %s · %s%s · pages=%d · queued_vaani=%s",
        cert.id, cert.verdict, " (recovery)" if cert.recovery else "",
        len(results), cert.notified_via_vaani,
    )
    return cert


# ---------- Lightweight notify helper (for daily/hourly/post-push flows) ---


def notify_sire_via_vaani(
    *,
    kind: str,
    message: str,
    spoken_text: str | None = None,
) -> dict[str, Any]:
    """Queue a non-certificate notification for Vaani (e.g. hourly RED alert,
    deploy verification failure). Fires the same three rails: speak + wa.me +
    sms:. No-op if message empty."""
    if not message:
        return {"ok": False, "reason": "empty_message"}
    nid = f"notif-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')}-{uuid.uuid4().hex[:6]}"
    wa = _sire_whatsapp_number()
    sms = _sire_sms_number()
    _VAANI_QUEUE.append({
        "id": nid,
        "ts": datetime.now(timezone.utc).isoformat(),
        "kind": kind,
        "spoken_text": spoken_text or message,
        "message": message,
        "sire_whatsapp": wa,
        "sire_sms": sms,
    })
    log.info("[cto-notify] %s · queued · kind=%s · wa_set=%s sms_set=%s",
             nid, kind, bool(wa), bool(sms))
    return {"ok": True, "id": nid, "queued": True,
            "sire_targets": {"whatsapp": wa, "sms": sms}}


# ---------- Vaani rail accessors -------------------------------------------


def vaani_pending() -> list[dict[str, Any]]:
    return list(_VAANI_QUEUE)


def vaani_ack(ids: list[str]) -> dict[str, Any]:
    if not ids:
        return {"ok": False, "error": "ids required"}
    ids_set = set(ids)
    remaining = [n for n in _VAANI_QUEUE if n["id"] not in ids_set]
    _VAANI_QUEUE.clear()
    for r in remaining:
        _VAANI_QUEUE.append(r)
    return {"ok": True, "acked": len(ids), "remaining": len(_VAANI_QUEUE)}


def recent_certificates(limit: int = 25) -> list[dict[str, Any]]:
    items = list(_CERT_RING)[-limit:]
    return list(reversed(items))


def cto_oath_text() -> str:
    return (
        "Chitti CTO Oath (2026-05-27 · rev 2)\n\n"
        "1. Sire never sees uncertified work.\n"
        "2. Sire never has to ask — CTO reports first, every time.\n"
        "3. All CTO notifications go through Chitti Vaani only.\n"
        "   • Vaani speaks the message aloud.\n"
        "   • Vaani opens wa.me deep link → WhatsApp app.\n"
        "   • Vaani opens sms: deep link → SMS app (Sire's second SIM).\n"
        "4. No Twilio. No Meta Cloud. No MSG91. No new APIs.\n"
        "5. Verdict is one of: CERTIFIED · CONDITIONAL · REJECTED.\n"
        "6. REJECTED stops handover — Claude fixes silently, re-certs to recovery.\n"
        "7. The 10-gate floor never moves. Honest stubs over fake-pass.\n"
    )
