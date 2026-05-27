"""
chitti-founder / lib / cto_certify.py — 2026-05-27 (Chitti CTO directive)

Chitti CTO = Solution Architect + Quality Auditor. Every feature Claude Code
builds must be certified by the CTO BEFORE Sire sees it. The CTO speaks to
Sire through TWO rails:

  1. WhatsApp — written summary (via lib/cto_verifier.whatsapp_send)
  2. Chitti Vaani — spoken aloud (via the in-memory notification queue this
     module owns; Vaani frontend polls /api/cto/notifications/pending)

The certification verdict is one of:
  CERTIFIED   — every changed page passed the 10-gate check, nothing red
  CONDITIONAL — every changed page green or yellow, no red, but ≥1 needs_human
                gate. Sire told before relaying so she can do the human checks.
  REJECTED    — at least one changed page is red. Claude must FIX FIRST, then
                re-cert; Sire is told this happened, not told the feature is ready.

Doctrine: see CHITTI_CTO_OATH.md (repo root). Two-line summary:

  Sire never sees uncertified work.
  Sire never has to ask — CTO reports first, every time.
"""
from __future__ import annotations

import logging
import os
import time
import uuid
from collections import deque
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Any

from lib.cto_verifier import (
    verify_url,
    URLVerifyResult,
    whatsapp_send,
)

log = logging.getLogger("chitti-founder.cto-certify")


# ---------- Notification queue (Vaani rail) -------------------------------
# Vaani frontend polls /api/cto/notifications/pending every ~60s. On pickup
# Vaani speaks each message and POSTs /api/cto/notifications/ack with the
# notification ids so the queue empties.
#
# Bound the queue so a runaway certify loop can't OOM the dyno.
_VAANI_QUEUE_MAX = 50
_VAANI_QUEUE: deque[dict[str, Any]] = deque(maxlen=_VAANI_QUEUE_MAX)

# Recent certificates ring for /admin/founder/cto-certificates
_CERT_RING_MAX = 200
_CERT_RING: deque[dict[str, Any]] = deque(maxlen=_CERT_RING_MAX)


# ---------- Result types ---------------------------------------------------


@dataclass
class Certificate:
    """A CTO certificate for one feature handover."""
    id: str
    ts: str                            # ISO UTC
    feature_name: str
    commit_sha: str                    # short or full; whatever the caller passes
    test_plan_summary: str             # one-line human-readable test plan
    pages_checked: list[dict[str, Any]] = field(default_factory=list)  # URLVerifyResult.to_dict() per page
    verdict: str = "PENDING"           # CERTIFIED | CONDITIONAL | REJECTED
    reasons: list[str] = field(default_factory=list)
    spoken_text: str = ""              # the exact text Vaani will say
    whatsapp_text: str = ""            # the exact text WhatsApp will send
    whatsapp_result: dict[str, Any] | None = None
    queued_for_vaani: bool = False
    needs_human: list[str] = field(default_factory=list)  # gates flagged yellow

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


# ---------- Resolver: changed file → public URL ----------------------------


# Map a repo file path (as written in git) to the public URL the CTO checks.
def _resolve_url(repo_path: str) -> str | None:
    p = (repo_path or "").strip().lstrip("./")
    if not p: return None
    # Anything in chitti-*/  is backend code, not user-facing — skip
    if "/" in p and p.split("/")[0].startswith("chitti-"):
        return None
    # Any /backend/ or /scripts/ path — skip
    if "/backend/" in p or "/scripts/" in p:
        return None
    # Only verify pages, scripts, and assets that GitHub Pages serves
    if p.endswith(".html") or p.endswith(".js") or p.endswith(".css") or p.startswith("tools/"):
        return f"https://sahayai.in/{p}"
    return None


# ---------- Verdict logic --------------------------------------------------


def _decide_verdict(results: list[URLVerifyResult]) -> tuple[str, list[str], list[str]]:
    """Return (verdict, reasons, needs_human_summaries)."""
    reasons: list[str] = []
    needs_human: list[str] = []

    if not results:
        return "REJECTED", ["No public URLs derived from changed files — nothing to certify."], []

    any_red = False
    any_yellow = False
    for r in results:
        page = r.url.split("/")[-1] or r.url
        if r.red:
            any_red = True
            failed = next((g for g in r.gates if g.status == "fail"), None)
            if failed:
                reasons.append(f"🔴 {page} — {failed.name}: {failed.detail}")
            else:
                reasons.append(f"🔴 {page} — HTTP {r.http_status}, no body")
        elif r.yellow:
            any_yellow = True
            for g in r.gates:
                if g.status == "needs_human":
                    needs_human.append(f"{page} · {g.name}")
        else:
            reasons.append(f"✅ {page} — clean")

    if any_red:
        return "REJECTED", reasons, needs_human
    if any_yellow:
        return "CONDITIONAL", reasons, needs_human
    return "CERTIFIED", reasons, needs_human


# ---------- Text rendering -------------------------------------------------


_VERDICT_VOICE = {
    "CERTIFIED": "Sire, Chitti CTO. Feature certified.",
    "CONDITIONAL": "Sire, Chitti CTO. Feature passes the automated checks; some gates need human eyes.",
    "REJECTED":  "Sire, Chitti CTO. Feature rejected. Fix in progress before handover.",
}


def _voice_text(cert: Certificate) -> str:
    """Short, calm, natural — what Vaani says aloud. Avoid markdown, URLs, jargon."""
    head = _VERDICT_VOICE.get(cert.verdict, "Sire, Chitti CTO update.")
    feat = cert.feature_name or "the change"
    n_pages = len(cert.pages_checked)
    page_word = "page" if n_pages == 1 else "pages"
    if cert.verdict == "CERTIFIED":
        body = f"{feat} — {n_pages} {page_word} checked, all green."
    elif cert.verdict == "CONDITIONAL":
        n_nh = len(cert.needs_human)
        body = f"{feat} — {n_pages} {page_word} checked, {n_nh} item{'s' if n_nh != 1 else ''} need your eyes."
    else:
        # Reject — name the first failing page if any
        first_red = next((r for r in cert.reasons if r.startswith("🔴")), "")
        first_red = first_red.replace("🔴 ", "").split(" — ", 1)[0]
        body = f"{feat} — {first_red or 'a page'} failed quality checks. Fixing now."
    return f"{head} {body}"


def _whatsapp_text(cert: Certificate) -> str:
    """Markdown-flavoured for WhatsApp. Concise; Sire can scan in 5 seconds."""
    emoji = {"CERTIFIED": "✅", "CONDITIONAL": "⚠️", "REJECTED": "🔴"}.get(cert.verdict, "ℹ️")
    lines = [
        f"{emoji} *Chitti CTO — {cert.verdict}*",
        f"Feature: {cert.feature_name}",
        f"Commit: `{cert.commit_sha[:10]}`",
    ]
    if cert.test_plan_summary:
        lines.append(f"Test plan: {cert.test_plan_summary}")
    lines.append("")
    # Page summary
    for r in cert.pages_checked[:6]:
        page = r["url"].split("/")[-1] or r["url"]
        if r["red"]:
            failed = next((g for g in r["gates"] if g["status"] == "fail"), None)
            detail = (failed["name"] + " — " + failed["detail"]) if failed else f"HTTP {r['http_status']}"
            lines.append(f"🔴 {page}: {detail}")
        elif r["yellow"]:
            lines.append(f"⚠️ {page} — {r['load_ms']} ms · needs interactive check")
        else:
            lines.append(f"✅ {page} — {r['load_ms']} ms · all gates pass")
    if len(cert.pages_checked) > 6:
        lines.append(f"_+ {len(cert.pages_checked) - 6} more pages_")
    if cert.needs_human:
        lines.append("")
        lines.append("Needs your eyes:")
        for nh in cert.needs_human[:5]:
            lines.append(f"• {nh}")
        if len(cert.needs_human) > 5:
            lines.append(f"_+ {len(cert.needs_human) - 5} more — see /admin/founder/cto-daily_")
    return "\n".join(lines)


# ---------- Public API -----------------------------------------------------


def certify_feature(
    feature_name: str,
    commit_sha: str = "",
    changed_files: list[str] | None = None,
    test_plan_summary: str = "",
    extra_urls: list[str] | None = None,
    notify_whatsapp: bool = True,
    notify_vaani: bool = True,
) -> Certificate:
    """The CTO entrypoint. Claude Code (or the GH Action) calls this every
    time it claims a feature is done. Returns a Certificate with the verdict
    and the exact spoken / written text that was sent to Sire.

    Notification posture:
    - WhatsApp always fires (success AND failure) when notify_whatsapp=True.
      User explicitly asked for "every certification or fix" — silent success
      defeats the purpose. Cooldown is handled at the daily summary level,
      not here.
    - Vaani: text queued; Vaani frontend polls every ~60s and speaks on next
      visit. Queue is global (one user — Sire).
    """
    cert_id = f"cert-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')}-{uuid.uuid4().hex[:6]}"
    ts = datetime.now(timezone.utc).isoformat()

    # 1. Resolve URLs to verify
    urls: list[str] = list(extra_urls or [])
    for f in (changed_files or []):
        u = _resolve_url(f)
        if u and u not in urls:
            urls.append(u)
    # If caller gave us no URLs at all, the 10-gate check has nothing to do —
    # we cannot certify code-only changes (backend etc.) from this rail. Be
    # honest about that rather than fake-certify.
    if not urls:
        cert = Certificate(
            id=cert_id, ts=ts, feature_name=feature_name,
            commit_sha=commit_sha, test_plan_summary=test_plan_summary,
            verdict="CONDITIONAL",
            reasons=["No public URLs to fetch. Backend/library-only change — CTO certifies via code review only, not 10-gate."],
            needs_human=["Confirm backend tests pass and call /admin/founder/cto-certify again with extra_urls if any frontend touched."],
        )
        cert.spoken_text   = _voice_text(cert)
        cert.whatsapp_text = _whatsapp_text(cert)
        _post_notifications(cert, notify_whatsapp, notify_vaani)
        _CERT_RING.append(cert.to_dict())
        return cert

    # 2. Run the 10-gate verifier on each URL
    results: list[URLVerifyResult] = [verify_url(u) for u in urls]

    # 3. Decide verdict
    verdict, reasons, needs_human = _decide_verdict(results)

    cert = Certificate(
        id=cert_id, ts=ts,
        feature_name=feature_name,
        commit_sha=commit_sha,
        test_plan_summary=test_plan_summary,
        pages_checked=[r.to_dict() for r in results],
        verdict=verdict,
        reasons=reasons,
        needs_human=needs_human,
    )
    cert.spoken_text   = _voice_text(cert)
    cert.whatsapp_text = _whatsapp_text(cert)

    # 4. Notify the two rails
    _post_notifications(cert, notify_whatsapp, notify_vaani)
    _CERT_RING.append(cert.to_dict())

    log.info(
        "[cto-certify] %s · %s · %d page(s) · wa_ok=%s vaani_queued=%s",
        cert.id, cert.verdict, len(results),
        (cert.whatsapp_result or {}).get("ok"), cert.queued_for_vaani,
    )
    return cert


def _post_notifications(cert: Certificate, notify_whatsapp: bool, notify_vaani: bool) -> None:
    if notify_whatsapp:
        cert.whatsapp_result = whatsapp_send(cert.whatsapp_text)
    if notify_vaani:
        _VAANI_QUEUE.append({
            "id": cert.id,
            "ts": cert.ts,
            "verdict": cert.verdict,
            "feature_name": cert.feature_name,
            "spoken_text": cert.spoken_text,
            "kind": "cto_certificate",
        })
        cert.queued_for_vaani = True


# ---------- Vaani rail accessors -------------------------------------------


def vaani_pending() -> list[dict[str, Any]]:
    """Return pending notifications for Vaani to speak. Read-only — does not
    consume the queue. Vaani must call ack to remove items it spoke."""
    return list(_VAANI_QUEUE)


def vaani_ack(ids: list[str]) -> dict[str, Any]:
    """Vaani calls this with the ids it actually spoke. Removes those from
    the queue. Idempotent — unknown ids silently ignored."""
    if not ids:
        return {"ok": False, "error": "ids required"}
    ids_set = set(ids)
    remaining = [n for n in _VAANI_QUEUE if n["id"] not in ids_set]
    _VAANI_QUEUE.clear()
    for r in remaining:
        _VAANI_QUEUE.append(r)
    return {"ok": True, "acked": len(ids), "remaining": len(_VAANI_QUEUE)}


def recent_certificates(limit: int = 25) -> list[dict[str, Any]]:
    """Last N certificates, newest first. For /admin/founder/cto-certificates."""
    items = list(_CERT_RING)[-limit:]
    return list(reversed(items))


# ---------- Test plan helper ------------------------------------------------


def cto_oath_text() -> str:
    """Returned verbatim by /admin/founder/cto-oath. Pinned to the doctrine."""
    return (
        "Chitti CTO Oath (2026-05-27)\n\n"
        "1. Sire never sees uncertified work.\n"
        "2. Sire never has to ask — CTO reports first, every time, on two rails:\n"
        "   • Chitti Vaani speaks the verdict aloud.\n"
        "   • WhatsApp sends the written summary.\n"
        "3. Verdict is one of: CERTIFIED, CONDITIONAL, REJECTED.\n"
        "4. REJECTED stops handover — Claude fixes and re-certifies.\n"
        "5. CONDITIONAL goes to Sire only after the human-eyes items are listed.\n"
        "6. The 10-gate check from cto_verifier.py is the floor; feature-specific\n"
        "   checks add to it. Honest stubs over fake-pass — never invent a green.\n"
    )
