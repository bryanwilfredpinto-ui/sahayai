"""
lib/chitti_quality.py
---------------------
Chitti Quality v2 — the canonical home of:

  1. RISK_LEVELS         — HIGH / MEDIUM / LOW per Chitti (16 products).
  2. AGENTIC_RULES       — what Chitti can do without asking vs. must ask.
  3. SAFEGUARDS          — block UPI for minors / elderly; flag distress.
  4. CarbonTracker       — grams of CO₂ per response; flags > 0.5g.
  5. IncidentReporter    — `📣 Report a problem` from any page; emails Sire
                           within 1h via the founder transport.
  6. DefectAggregator    — rolls 👎 comments into typed defect clusters.
  7. WeeklyDigest        — Sunday 08:00 IST trend report.
  8. Escalator           — 3-day repeating defect → GitHub issue;
                           <70% thumbs-up → SMS; >0.5g CO₂ → flag for
                           DeepSeek prompt optimisation.

Every public function is import-safe — if a backend hasn't yet wired the
DB engine or the SMS gateway, the helper returns an honest no-op instead
of raising. Honest-stubs-over-fake-demos is the founder's rule.
"""
from __future__ import annotations

import json
import logging
import os
import smtplib
from dataclasses import dataclass, asdict, field
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from typing import Any, Iterable
from zoneinfo import ZoneInfo

log = logging.getLogger("chitti_quality")
_IST = ZoneInfo("Asia/Kolkata")


# =====================================================================
# 1. RISK LEVELS — 16 products, 3 tiers
# =====================================================================
# HIGH    = money / health / legal — server-enforced disclaimer required.
# MEDIUM  = daily commerce + accessibility-critical.
# LOW     = info / dashboards / aggregation.
RISK_LEVELS: dict[str, str] = {
    # HIGH
    "chitti-medupi":     "HIGH",
    "chitti-upi":        "HIGH",
    "chitti-legal":      "HIGH",
    "chitti-ca":         "HIGH",
    "chitti-government": "HIGH",
    # MEDIUM
    "chitti-vaani":      "MEDIUM",
    "chitti-kirana":     "MEDIUM",
    "chitti-pharmacy":   "MEDIUM",
    "chitti-saloon":     "MEDIUM",
    "chitti-shares":     "MEDIUM",
    "chitti-technicals": "MEDIUM",
    "chitti-fundamentals": "MEDIUM",
    # LOW
    "chitti-news":          "LOW",
    "chitti-scanner":       "LOW",
    "chitti-voice-factory": "LOW",
    "chitti-tourism":       "LOW",
}

ALL_PRODUCTS: list[str] = list(RISK_LEVELS.keys())


def risk_level(chitti: str) -> str:
    """Return HIGH / MEDIUM / LOW for a Chitti slug. Defaults to MEDIUM
    so that an un-registered Chitti is treated cautiously, never as LOW."""
    return RISK_LEVELS.get(chitti, "MEDIUM")


# =====================================================================
# 2. AGENTIC RULES — what Chitti may do without asking
# =====================================================================
# These are *advisory at lib level* and *enforced at each Chitti's
# backend*. The list lives here so that all 16 Chittis share one rulebook.

@dataclass(frozen=True)
class AgenticRule:
    action: str           # short identifier
    description: str      # human-readable
    risk_threshold: str   # most-strict risk tier where the rule applies
    requires_confirm: bool  # True = ASK before doing; False = DO and tell


AGENTIC_RULES: list[AgenticRule] = [
    # --- Always do, never ask ----------------------------------------
    AgenticRule("speak_aloud",        "Read any visible page text aloud",                          "LOW",    False),
    AgenticRule("translate_ui",       "Switch UI language at user request",                        "LOW",    False),
    AgenticRule("explain_simply",     "Re-explain content in plain English / Hindi class-5 level", "LOW",    False),
    AgenticRule("answer_question",    "Answer a question within this Chitti's domain",             "LOW",    False),
    AgenticRule("save_local_history", "Save the user's last 20 queries locally for re-use",        "LOW",    False),

    # --- Do for LOW/MEDIUM, ask for HIGH -----------------------------
    AgenticRule("send_email_summary", "Email a summary of today's session to the user",            "HIGH",   True),
    AgenticRule("export_pdf",         "Generate and download a PDF of results",                    "HIGH",   True),
    AgenticRule("share_link",         "Create a public share link for results",                    "HIGH",   True),
    AgenticRule("save_to_drive",      "Save results to user's Google Drive (OAuth required)",      "MEDIUM", True),

    # --- Always ask, regardless of risk ------------------------------
    AgenticRule("place_order",        "Place an order with any vendor (Jan Aushadhi, kirana, etc.)", "LOW",  True),
    AgenticRule("send_money",         "Initiate a UPI payment",                                    "LOW",    True),  # also blocked outright by SAFEGUARDS
    AgenticRule("file_government",    "Submit a government form (DigiLocker, ITR, GST)",           "LOW",    True),
    AgenticRule("contact_doctor",     "Book or call a doctor on the user's behalf",                "LOW",    True),
    AgenticRule("share_health_data",  "Share medical records with any third party",                "LOW",    True),
    AgenticRule("emergency_contact",  "Trigger the Vaani emergency cascade (family, NEVER cops)",  "LOW",    True),
]


def rule(action: str) -> AgenticRule | None:
    for r in AGENTIC_RULES:
        if r.action == action:
            return r
    return None


def may_do(action: str, chitti: str) -> bool:
    """Return True if Chitti may take this action without asking the user.
    A missing rule defaults to True for LOW risk, False otherwise."""
    r = rule(action)
    risk = risk_level(chitti)
    if r is None:
        return risk == "LOW"
    if not r.requires_confirm:
        return True
    # Rule says confirm. Tighter rule wins.
    tier = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}
    return tier[risk] < tier[r.risk_threshold]


# =====================================================================
# 3. SAFEGUARDS — block UPI for minor / elderly; distress flagging
# =====================================================================

# Distress keywords across the 4 user archetypes. Voice-spotting tier.
# Kept narrow on purpose — better to miss than to false-positive at scale.
DISTRESS_KEYWORDS: list[str] = [
    # English
    "help me", "i can't pay", "i am stuck", "scared", "scam", "fraud",
    "i don't understand", "i'm alone", "no one is helping",
    # Hindi (romanised + native)
    "madad karo", "मदद करो", "बचाओ", "धोखा",
    # Tamil
    "udhavi", "உதவி",
    # Telugu
    "sahayam", "సహాయం",
    # Marathi
    "madat",
    # Gujarati
    "madad",
    # Kannada
    "sahaya", "ಸಹಾಯ",
    # Malayalam
    "sahayam", "സഹായം",
]


@dataclass
class SafeguardVerdict:
    allowed: bool
    reason: str
    severity: str = "info"  # info | warn | block


def block_upi_for_vulnerable(age: int | None, segment: str | None) -> SafeguardVerdict:
    """UPI gating: block under-18, over-75, or self-declared blind/illiterate
    without explicit per-session unlock. Spec PART 1 §5."""
    if age is not None and age < 18:
        return SafeguardVerdict(False, "User is a minor — UPI initiation blocked.", "block")
    if age is not None and age >= 75:
        return SafeguardVerdict(False, "User is 75+ — UPI requires family co-sign.", "warn")
    if segment in ("blind", "illiterate") and not _has_session_unlock(segment):
        return SafeguardVerdict(False, "Accessibility-flagged user — UPI requires session unlock.", "warn")
    return SafeguardVerdict(True, "ok", "info")


def _has_session_unlock(segment: str) -> bool:
    # Per-session unlock is set when the user (or their guardian) explicitly
    # turns it on via the Chitti UPI / MedUPI safety panel. Until that's wired
    # we honour an env override for dev: CHITTI_UPI_UNLOCK_SEGMENTS=blind,illiterate
    raw = os.environ.get("CHITTI_UPI_UNLOCK_SEGMENTS", "")
    return segment in {s.strip() for s in raw.split(",") if s.strip()}


def scan_distress(text: str) -> SafeguardVerdict:
    """Returns severity=block when Vaani's family cascade should fire.
    NEVER returns a verdict that routes to police. Family-only per
    `project_chitti_vaani_emergency_protocol`."""
    if not text:
        return SafeguardVerdict(True, "empty", "info")
    needle = text.lower()
    hits = [kw for kw in DISTRESS_KEYWORDS if kw.lower() in needle]
    if not hits:
        return SafeguardVerdict(True, "no distress signal", "info")
    if len(hits) >= 2:
        return SafeguardVerdict(False, f"Distress keywords: {hits[:3]}", "block")
    return SafeguardVerdict(True, f"Single distress hint: {hits[0]}", "warn")


# =====================================================================
# 4. Carbon tracker
# =====================================================================
# Approximation only — we don't have access to DeepSeek's per-call energy
# meter. We use a simple linear model based on input + output token count.
# Coefficients tuned to land ~0.2g for a typical 200-token reply on shared
# GPU infra (ML CO2 Impact Calculator, mid-2025 averages).

_BASE_CO2_G_PER_TOKEN = 0.0008   # output tokens dominate
_INPUT_CO2_G_PER_TOKEN = 0.0001  # cached prompt tokens are much cheaper


def co2_for_response(input_tokens: int = 0, output_tokens: int = 0) -> float:
    """Return grams of CO₂ for a single response. Rounded to 2 dp."""
    g = (input_tokens * _INPUT_CO2_G_PER_TOKEN) + (output_tokens * _BASE_CO2_G_PER_TOKEN)
    return round(max(g, 0.05), 2)


CO2_FLAG_THRESHOLD_G = float(os.environ.get("CHITTI_CO2_FLAG_G", "0.5"))


def carbon_alert(per_response_g: float) -> SafeguardVerdict:
    if per_response_g > CO2_FLAG_THRESHOLD_G:
        return SafeguardVerdict(
            False,
            f"Carbon per response {per_response_g}g > {CO2_FLAG_THRESHOLD_G}g — flag for prompt optimisation.",
            "warn",
        )
    return SafeguardVerdict(True, "carbon within budget", "info")


# =====================================================================
# 5. IncidentReporter — "Report a problem" → email Sire within 1h
# =====================================================================

INCIDENT_RECIPIENT = os.environ.get("FOUNDER_EMAIL", "bryanwilfredpinto@gmail.com")


def _smtp_send(subject: str, html: str, recipient: str = INCIDENT_RECIPIENT) -> bool:
    host = os.environ.get("FOUNDER_SMTP_HOST", "")
    port = int(os.environ.get("FOUNDER_SMTP_PORT", "587"))
    user = os.environ.get("FOUNDER_SMTP_USER", "")
    pw = os.environ.get("FOUNDER_SMTP_PASS", "")
    from_addr = os.environ.get("FOUNDER_FROM", user or "chitti@sahayai.in")
    if not (host and user and pw):
        log.info("INCIDENT (no SMTP configured) — subject=%r recipient=%s", subject, recipient)
        return False
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = recipient
    msg.set_content("HTML viewer required.")
    msg.add_alternative(html, subtype="html")
    try:
        with smtplib.SMTP(host, port, timeout=20) as s:
            s.starttls()
            s.login(user, pw)
            s.send_message(msg)
        return True
    except Exception as e:  # noqa: BLE001
        log.warning("INCIDENT SMTP send failed: %s", e)
        return False


def report_incident(chitti: str, page: str, what_happened: str,
                    user_lang: str = "en", segment: str = "general",
                    user_agent: str = "") -> dict:
    """Used by the 📣 button on every page. Best-effort email; always returns
    a stable dict for the frontend to confirm."""
    when = datetime.now(_IST).strftime("%Y-%m-%d %H:%M IST")
    subject = f"[Chitti Incident] {chitti} · {page}"
    html = f"""
    <html><body style="font-family:-apple-system,sans-serif">
      <h2>Chitti Incident — {chitti}</h2>
      <p><b>Page:</b> {page}<br>
         <b>When:</b> {when}<br>
         <b>Language:</b> {user_lang}<br>
         <b>User segment:</b> {segment}<br>
         <b>Risk level:</b> {risk_level(chitti)}<br>
         <b>UA:</b> {user_agent[:200]}</p>
      <h3>What happened</h3>
      <pre style="white-space:pre-wrap;background:#f6f8fa;padding:12px;border-radius:6px">{what_happened or '(no description)'}</pre>
      <p style="color:#666;font-size:12px">Auto-sent by lib/chitti_quality.report_incident</p>
    </body></html>
    """.strip()
    ok = _smtp_send(subject, html)
    return {"ok": ok, "logged": True, "recipient": INCIDENT_RECIPIENT, "when": when}


# =====================================================================
# 6. DefectAggregator — type 👎 comments into clusters
# =====================================================================

DEFECT_TYPES: list[tuple[str, list[str]]] = [
    ("translation",    ["translat", "wrong language", "anuvad", "अनुवाद", "भाषा", "மொழி", "భాష"]),
    ("hallucination",  ["wrong answer", "false", "made up", "ग़लत", "तरुम", "incorrect"]),
    ("voice",          ["voice", "audio", "speak", "tts", "stt", "mic", "मायक", "आवाज"]),
    ("accessibility",  ["braille", "screen reader", "talkback", "blind", "contrast", "font"]),
    ("ux",             ["confusing", "stuck", "couldn't find", "where is", "नहीं समझा"]),
    ("performance",    ["slow", "timeout", "loading", "धीमा", "हैंग"]),
    ("price",          ["price", "cost", "wrong amount", "कीमत", "महंगा"]),
    ("emergency",      ["call cops", "police", "112", "100", "auto-dial"]),  # red-flag: should never fire
]


def classify_defect(text: str) -> str:
    if not text:
        return "other"
    t = text.lower()
    for label, keys in DEFECT_TYPES:
        if any(k.lower() in t for k in keys):
            return label
    return "other"


@dataclass
class DefectCluster:
    type: str
    count: int = 0
    pct: float = 0.0
    affected_products: list[str] = field(default_factory=list)
    root_cause: str = "unclassified"
    fix_effort: str = "M"  # S / M / L
    samples: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)


_ROOT_CAUSE_HINTS = {
    "translation":   ("Bhashini stub returning English fallback", "M"),
    "hallucination": ("DeepSeek prompt missing grounding sources", "L"),
    "voice":         ("Browser SpeechRecognition variance", "S"),
    "accessibility": ("chitti_a11y.js missing on page", "S"),
    "ux":            ("Flow ambiguous to PWD user", "M"),
    "performance":   ("Render cold start / large payload", "M"),
    "price":         ("Stale NPPA/screener feed", "M"),
    "emergency":     ("CRITICAL: voice keyword router misrouted", "L"),
    "other":         ("Unclassified — manual triage", "M"),
}


def aggregate_defects(rows: Iterable[dict]) -> list[DefectCluster]:
    """rows = list of {chitti, comment} dicts (last 24h thumbs-down comments)."""
    total = 0
    buckets: dict[str, DefectCluster] = {}
    for r in rows:
        comment = (r.get("comment") or "").strip()
        if not comment:
            continue
        total += 1
        label = classify_defect(comment)
        b = buckets.setdefault(label, DefectCluster(type=label))
        b.count += 1
        if r.get("chitti") and r["chitti"] not in b.affected_products:
            b.affected_products.append(r["chitti"])
        if len(b.samples) < 3:
            b.samples.append(comment[:200])
    out = []
    for label, b in buckets.items():
        b.pct = round((100.0 * b.count / total), 1) if total else 0.0
        cause, effort = _ROOT_CAUSE_HINTS.get(label, ("Unclassified — manual triage", "M"))
        b.root_cause = cause
        b.fix_effort = effort
        out.append(b)
    out.sort(key=lambda x: -x.count)
    return out


def defect_status(pct: float) -> str:
    if pct >= 10: return "🔴"
    if pct >= 5:  return "🟡"
    return "🟢"


# =====================================================================
# 7. Weekly digest (Sunday 08:00 IST)
# =====================================================================

@dataclass
class WeeklyTrendRow:
    chitti: str
    responses_7d: int = 0
    avg_up_pct_7d: float | None = None
    delta_vs_prev_week: float | None = None  # in percentage points
    top_lang: str = "—"
    top_segment: str = "—"
    peak_hour_ist: str = "—"
    headline: str = ""    # most-improved / urgent / steady

    def to_dict(self) -> dict:
        return asdict(self)


def render_weekly_html(rows: list[WeeklyTrendRow]) -> tuple[str, str]:
    today = datetime.now(_IST).strftime("%Y-%m-%d")
    subject = f"Sahay AI — Weekly Quality Trend · week ending {today}"

    # Pick the most improved + most-at-risk Chittis.
    sorted_by_delta = sorted(
        [r for r in rows if r.delta_vs_prev_week is not None],
        key=lambda r: r.delta_vs_prev_week or 0,
        reverse=True,
    )
    most_improved = sorted_by_delta[0] if sorted_by_delta else None
    most_urgent = sorted_by_delta[-1] if sorted_by_delta and sorted_by_delta[-1].delta_vs_prev_week is not None and sorted_by_delta[-1].delta_vs_prev_week < 0 else None

    def _row_html(r: WeeklyTrendRow) -> str:
        delta = "—" if r.delta_vs_prev_week is None else f"{r.delta_vs_prev_week:+.1f} pp"
        arrow = "▬" if r.delta_vs_prev_week in (None, 0) else ("▲" if r.delta_vs_prev_week > 0 else "▼")
        return (f"<tr><td><b>{r.chitti}</b></td>"
                f"<td style='text-align:right'>{r.responses_7d:,}</td>"
                f"<td style='text-align:right'>{r.avg_up_pct_7d if r.avg_up_pct_7d is not None else '—'}%</td>"
                f"<td style='text-align:right'>{arrow} {delta}</td>"
                f"<td>{r.top_lang}</td>"
                f"<td>{r.top_segment}</td>"
                f"<td>{r.peak_hour_ist}</td>"
                f"<td>{r.headline}</td></tr>")

    html = f"""
    <html><body style="font-family:-apple-system,sans-serif">
      <h2>Sahay AI — Weekly Quality Trend</h2>
      <p>Week ending <b>{today}</b> · auto-generated Sunday 08:00 IST</p>
      <h3>Headlines</h3>
      <ul>
        <li><b>Most improved:</b> {most_improved.chitti if most_improved else '—'}{
            f' ({most_improved.delta_vs_prev_week:+.1f} pp)' if most_improved else ''}</li>
        <li><b>Needs urgent attention:</b> {most_urgent.chitti if most_urgent else '—'}{
            f' ({most_urgent.delta_vs_prev_week:+.1f} pp)' if most_urgent else ''}</li>
      </ul>
      <table border="1" cellpadding="6" style="border-collapse:collapse;font-size:13px">
        <thead style="background:#f0f0f0">
          <tr>
            <th>Chitti</th><th>Responses (7d)</th><th>👍 avg</th><th>Δ vs prev week</th>
            <th>Top language</th><th>Top segment</th><th>Peak hr (IST)</th><th>Headline</th>
          </tr>
        </thead>
        <tbody>{''.join(_row_html(r) for r in rows)}</tbody>
      </table>
      <p style="color:#888;font-size:11px;margin-top:18px">
        Live trust page: <a href="https://sahayai.in/chitti_quality.html">sahayai.in/chitti_quality.html</a>.
        Generated by lib/chitti_quality.render_weekly_html.
      </p>
    </body></html>
    """.strip()
    return subject, html


# =====================================================================
# 8. Escalator — repeat defects + low thumbs + carbon
# =====================================================================

GH_REPO = os.environ.get("CHITTI_GITHUB_REPO", "bryan-wilfred-pinto/sahayai")
GH_TOKEN = os.environ.get("CHITTI_GITHUB_TOKEN", "")

SMS_PROVIDER_URL = os.environ.get("CHITTI_SMS_URL", "")  # e.g. msg91 / fast2sms
SMS_PROVIDER_KEY = os.environ.get("CHITTI_SMS_KEY", "")
SIRE_PHONE = os.environ.get("CHITTI_SIRE_PHONE", "")    # E.164, e.g. +919xxxxxxxxx

THUMBS_DOWN_CRITICAL_PCT = float(os.environ.get("CHITTI_CRITICAL_THUMBS_UP_PCT", "70"))


def open_github_issue(title: str, body: str, labels: Iterable[str] = ()) -> bool:
    """Returns False if no token — caller logs to stdout instead."""
    if not GH_TOKEN:
        log.info("[escalation] would open issue: %s", title)
        return False
    try:
        import httpx
        r = httpx.post(
            f"https://api.github.com/repos/{GH_REPO}/issues",
            headers={
                "Authorization": f"token {GH_TOKEN}",
                "Accept": "application/vnd.github+json",
            },
            json={"title": title, "body": body, "labels": list(labels) or ["chitti-quality"]},
            timeout=20,
        )
        ok = r.status_code in (200, 201)
        if not ok:
            log.warning("[escalation] github issue create failed: %s %s", r.status_code, r.text[:200])
        return ok
    except Exception as e:  # noqa: BLE001
        log.warning("[escalation] github exception: %s", e)
        return False


def send_sms_to_sire(message: str) -> bool:
    if not (SMS_PROVIDER_URL and SMS_PROVIDER_KEY and SIRE_PHONE):
        log.info("[escalation] would SMS Sire: %s", message)
        return False
    try:
        import httpx
        r = httpx.post(
            SMS_PROVIDER_URL,
            headers={"Authorization": f"Bearer {SMS_PROVIDER_KEY}"},
            json={"to": SIRE_PHONE, "message": message},
            timeout=15,
        )
        return r.status_code in (200, 201, 202)
    except Exception as e:  # noqa: BLE001
        log.warning("[escalation] sms exception: %s", e)
        return False


def escalate_repeating_defect(defect_type: str, days_in_a_row: int,
                              affected_products: list[str]) -> bool:
    """Opens a GitHub issue when a defect_type has appeared 3+ days in a row."""
    if days_in_a_row < 3:
        return False
    title = f"[chitti-quality] {defect_type} defect repeating {days_in_a_row} days in a row"
    body = (f"Defect type: **{defect_type}**\n\n"
            f"Days in a row: **{days_in_a_row}**\n\n"
            f"Affected products: {', '.join(affected_products) or '—'}\n\n"
            f"Auto-created by `lib/chitti_quality.escalate_repeating_defect`.\n"
            f"Triage: see SAHAYAI_MASTER.md §6 and chitti-quality/CONTEXT.md §6 (escalation).")
    return open_github_issue(title, body, labels=["chitti-quality", "auto", defect_type])


def escalate_low_thumbs(chitti: str, up_pct: float) -> bool:
    """SMS Sire when any Chitti drops below the critical thumbs-up bar."""
    if up_pct >= THUMBS_DOWN_CRITICAL_PCT:
        return False
    msg = (f"[Chitti Quality] {chitti} at {up_pct:.0f}% 👍 — "
           f"below {THUMBS_DOWN_CRITICAL_PCT:.0f}% bar. Check sahayai.in/founder.")
    return send_sms_to_sire(msg)


def escalate_carbon(chitti: str, per_response_g: float) -> bool:
    """Flags >0.5g responses for DeepSeek prompt optimisation. We don't page
    Sire for this — just open a GitHub issue tagged perf+carbon."""
    if per_response_g <= CO2_FLAG_THRESHOLD_G:
        return False
    title = f"[chitti-quality] {chitti} carbon per response {per_response_g}g exceeds {CO2_FLAG_THRESHOLD_G}g"
    body = (f"Per-response CO₂ for **{chitti}** is **{per_response_g}g**, "
            f"above the {CO2_FLAG_THRESHOLD_G}g budget.\n\n"
            f"Likely cause: oversized DeepSeek prompt or low cache hit rate.\n"
            f"Fix: tighten system prompt, raise cache TTL, trim few-shot examples.\n\n"
            f"Auto-created by `lib/chitti_quality.escalate_carbon`.")
    return open_github_issue(title, body, labels=["chitti-quality", "auto", "carbon", "perf"])


# =====================================================================
# Public API summary
# =====================================================================

__all__ = [
    # 1
    "RISK_LEVELS", "ALL_PRODUCTS", "risk_level",
    # 2
    "AgenticRule", "AGENTIC_RULES", "rule", "may_do",
    # 3
    "DISTRESS_KEYWORDS", "SafeguardVerdict",
    "block_upi_for_vulnerable", "scan_distress",
    # 4
    "co2_for_response", "carbon_alert", "CO2_FLAG_THRESHOLD_G",
    # 5
    "report_incident",
    # 6
    "DEFECT_TYPES", "DefectCluster",
    "classify_defect", "aggregate_defects", "defect_status",
    # 7
    "WeeklyTrendRow", "render_weekly_html",
    # 8
    "open_github_issue", "send_sms_to_sire",
    "escalate_repeating_defect", "escalate_low_thumbs", "escalate_carbon",
]
