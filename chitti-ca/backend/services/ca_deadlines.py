"""
services/ca_deadlines.py
------------------------
P1 (2026-05-13) — GST + tax deadline reminders.

A small, deterministic calendar of recurring Indian tax + GST statutory
deadlines. The data lives in `_RULES` below; the helper expands them
to concrete dates from today's date and answers "what's the next N
deadlines I should care about?"

Determinism contract (per project_chitti_ca_legal_logo_video):
- Dates are computed from statute, NOT from the LLM. DeepSeek is
  allowed to *explain* a deadline, never to invent one.
- Disclaimer wrapping is preserved by the route layer — `ca_service`
  already appends the server-enforced CA disclaimer.

Why static + recurring beats a fancy parser:
- The Indian statutory calendar is well-known and changes infrequently.
- A periodic CBDT / CBIC notification can shift one specific date —
  when that happens, we add a single override row, never edit the
  recurring rule.
- A user-facing reminder is wrong-and-loud if our date is wrong. Pin
  to the source of truth, not to an LLM guess.

Reminder subscription is logged today (no notification channels yet).
The same _RULES + the same /subscribe endpoint will plug into the
Vaani Twilio / WhatsApp channels once those are wired.
"""
from __future__ import annotations

import calendar
import logging
import os
import sqlite3
import threading
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Optional
from zoneinfo import ZoneInfo

log = logging.getLogger("ca_deadlines")

IST = ZoneInfo("Asia/Kolkata")

_DB_LOCK = threading.Lock()
_DB_PATH = os.environ.get("CA_DEADLINES_DB", "/tmp/chitti_ca_deadlines.sqlite")


# ──────────────────────────────────────────────────────────────────
# Statutory rules. Each rule expands to a date in a given month/year.
# `applies_to` is a free-form tag list the frontend can filter by:
#   gstr1 / gstr3b / gstr9 / itr / advance_tax / tds / tcs / form_16 /
#   pf_esi / sft / belated_itr / revised_itr / msme_45.
# `frequency` ∈ monthly / quarterly / annual / one_off.
# `audience` ∈ all / regular / composition / salaried / business / employer.
# ──────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class _Rule:
    key: str
    title: str
    title_hi: str
    applies_to: tuple[str, ...]
    frequency: str
    audience: tuple[str, ...]
    explainer_en: str
    explainer_hi: str
    # The schedule function returns the next concrete date on/after `today`
    # for a given rule. Implemented as named helpers below.
    schedule: str


def _nth_of_month(today: date, day: int, offset_months: int = 0) -> date:
    """Return the day-th of the current (or offset) month, or next valid one if past."""
    year, month = today.year, today.month
    month += offset_months
    while month <= 0:
        year -= 1
        month += 12
    while month > 12:
        year += 1
        month -= 12
    last = calendar.monthrange(year, month)[1]
    d = min(day, last)
    return date(year, month, d)


def _next_nth_of_month(today: date, day: int) -> date:
    """Return the next day-th of the month at or after `today`."""
    candidate = _nth_of_month(today, day)
    if candidate >= today:
        return candidate
    return _nth_of_month(today, day, offset_months=1)


def _next_quarter_end_plus(today: date, day_offset: int) -> date:
    """For GSTR-1 quarterly: due 13th of month following quarter end (Mar/Jun/Sep/Dec)."""
    q_ends = [date(today.year, m, calendar.monthrange(today.year, m)[1]) for m in (3, 6, 9, 12)]
    # Add Q1 of next year to handle Dec quarter rolling into Jan
    q_ends.append(date(today.year + 1, 3, calendar.monthrange(today.year + 1, 3)[1]))
    for qe in q_ends:
        due_month = qe.month + 1
        due_year = qe.year + (1 if due_month > 12 else 0)
        due_month = due_month if due_month <= 12 else due_month - 12
        last = calendar.monthrange(due_year, due_month)[1]
        d = min(day_offset, last)
        due = date(due_year, due_month, d)
        if due >= today:
            return due
    return q_ends[-1]


def _next_annual(today: date, month: int, day: int) -> date:
    """Return the next year's month/day on or after `today`."""
    candidate = date(today.year, month, min(day, calendar.monthrange(today.year, month)[1]))
    if candidate >= today:
        return candidate
    return date(today.year + 1, month, min(day, calendar.monthrange(today.year + 1, month)[1]))


# Schedule function dispatch. Keys map to lambdas of (today) → next date.
_SCHEDULES = {
    "gstr1_monthly_11":      lambda t: _next_nth_of_month(t, 11),
    "gstr3b_monthly_20":     lambda t: _next_nth_of_month(t, 20),
    "gstr1_quarterly_13":    lambda t: _next_quarter_end_plus(t, 13),
    "tds_monthly_7":         lambda t: _next_nth_of_month(t, 7),
    "advance_tax_q1":        lambda t: _next_annual(t, 6, 15),
    "advance_tax_q2":        lambda t: _next_annual(t, 9, 15),
    "advance_tax_q3":        lambda t: _next_annual(t, 12, 15),
    "advance_tax_q4":        lambda t: _next_annual(t, 3, 15),
    "itr_july_31":           lambda t: _next_annual(t, 7, 31),
    "itr_audit_oct_31":      lambda t: _next_annual(t, 10, 31),
    "belated_itr_dec_31":    lambda t: _next_annual(t, 12, 31),
    "tax_saving_mar_31":     lambda t: _next_annual(t, 3, 31),
    "gstr9_dec_31":          lambda t: _next_annual(t, 12, 31),
    "form_16_jun_15":        lambda t: _next_annual(t, 6, 15),
    "pf_esi_monthly_15":     lambda t: _next_nth_of_month(t, 15),
    "msme_45_day_clock":     lambda t: t + timedelta(days=45),
}


_RULES: tuple[_Rule, ...] = (
    _Rule(
        key="gstr1_monthly",
        title="GSTR-1 (monthly)",
        title_hi="GSTR-1 (मासिक)",
        applies_to=("gstr1",),
        frequency="monthly",
        audience=("regular",),
        explainer_en="Outward supplies return for regular taxpayers above ₹5 cr turnover. Due on the 11th of each month.",
        explainer_hi="₹5 करोड़ से ज़्यादा टर्नओवर वाले regular taxpayers के लिए outward supplies return — हर महीने की 11 तारीख तक।",
        schedule="gstr1_monthly_11",
    ),
    _Rule(
        key="gstr1_quarterly",
        title="GSTR-1 (quarterly, QRMP)",
        title_hi="GSTR-1 (तिमाही, QRMP)",
        applies_to=("gstr1",),
        frequency="quarterly",
        audience=("regular",),
        explainer_en="QRMP scheme taxpayers (turnover up to ₹5 cr) file GSTR-1 quarterly. Due the 13th of the month after each quarter ends.",
        explainer_hi="QRMP scheme (₹5 करोड़ तक) के लिए GSTR-1 तिमाही — quarter खत्म होने के अगले महीने की 13 तारीख तक।",
        schedule="gstr1_quarterly_13",
    ),
    _Rule(
        key="gstr3b_monthly",
        title="GSTR-3B (monthly)",
        title_hi="GSTR-3B (मासिक)",
        applies_to=("gstr3b",),
        frequency="monthly",
        audience=("regular",),
        explainer_en="Summary return + tax payment. Due on the 20th of each month for monthly filers.",
        explainer_hi="Summary return और tax payment — monthly filers के लिए हर महीने की 20 तारीख तक।",
        schedule="gstr3b_monthly_20",
    ),
    _Rule(
        key="gstr9_annual",
        title="GSTR-9 (annual return)",
        title_hi="GSTR-9 (वार्षिक रिटर्न)",
        applies_to=("gstr9",),
        frequency="annual",
        audience=("regular",),
        explainer_en="Annual GST return covering the previous financial year. Due 31 December.",
        explainer_hi="पिछले वित्त वर्ष की GST annual return — 31 दिसंबर तक।",
        schedule="gstr9_dec_31",
    ),
    _Rule(
        key="tds_monthly",
        title="TDS / TCS payment",
        title_hi="TDS / TCS payment",
        applies_to=("tds", "tcs"),
        frequency="monthly",
        audience=("employer", "business"),
        explainer_en="Deposit tax deducted/collected at source by the 7th of the next month (30 April for March deductions).",
        explainer_hi="महीने के deduct किए TDS/TCS को अगले महीने की 7 तारीख तक जमा करें (मार्च का 30 अप्रैल तक)।",
        schedule="tds_monthly_7",
    ),
    _Rule(
        key="advance_tax_q1",
        title="Advance tax — Q1 (15% by 15 June)",
        title_hi="Advance tax — Q1 (15% — 15 जून तक)",
        applies_to=("advance_tax",),
        frequency="annual",
        audience=("business", "salaried"),
        explainer_en="Pay 15% of estimated annual tax liability by 15 June.",
        explainer_hi="अनुमानित सालाना tax का 15% — 15 जून तक चुका दीजिए।",
        schedule="advance_tax_q1",
    ),
    _Rule(
        key="advance_tax_q2",
        title="Advance tax — Q2 (45% by 15 September)",
        title_hi="Advance tax — Q2 (45% — 15 सितंबर तक)",
        applies_to=("advance_tax",),
        frequency="annual",
        audience=("business", "salaried"),
        explainer_en="Cumulative 45% of estimated annual tax by 15 September.",
        explainer_hi="कुल मिला कर 45% — 15 सितंबर तक।",
        schedule="advance_tax_q2",
    ),
    _Rule(
        key="advance_tax_q3",
        title="Advance tax — Q3 (75% by 15 December)",
        title_hi="Advance tax — Q3 (75% — 15 दिसंबर तक)",
        applies_to=("advance_tax",),
        frequency="annual",
        audience=("business", "salaried"),
        explainer_en="Cumulative 75% of estimated annual tax by 15 December.",
        explainer_hi="कुल 75% — 15 दिसंबर तक।",
        schedule="advance_tax_q3",
    ),
    _Rule(
        key="advance_tax_q4",
        title="Advance tax — Q4 (100% by 15 March)",
        title_hi="Advance tax — Q4 (100% — 15 मार्च तक)",
        applies_to=("advance_tax",),
        frequency="annual",
        audience=("business", "salaried"),
        explainer_en="Cumulative 100% of estimated annual tax by 15 March.",
        explainer_hi="100% advance tax — 15 मार्च तक।",
        schedule="advance_tax_q4",
    ),
    _Rule(
        key="tax_saving_mar_31",
        title="Tax-saving investments — last chance (31 March)",
        title_hi="Tax-saving निवेश — आख़िरी मौक़ा (31 मार्च)",
        applies_to=("tax_saving",),
        frequency="annual",
        audience=("salaried", "business"),
        explainer_en="80C / 80D / 80CCD(1B) / 80G investments must be made by 31 March of the financial year you are claiming for.",
        explainer_hi="80C / 80D / 80CCD(1B) / 80G — 31 मार्च तक निवेश करना ज़रूरी है।",
        schedule="tax_saving_mar_31",
    ),
    _Rule(
        key="itr_july_31",
        title="ITR filing (non-audit) — 31 July",
        title_hi="ITR फाइलिंग (non-audit) — 31 जुलाई",
        applies_to=("itr",),
        frequency="annual",
        audience=("salaried", "business"),
        explainer_en="Original ITR filing deadline for individuals + non-audit cases.",
        explainer_hi="Individuals और non-audit cases के लिए original ITR की deadline।",
        schedule="itr_july_31",
    ),
    _Rule(
        key="itr_audit_oct_31",
        title="ITR filing (audit) — 31 October",
        title_hi="ITR फाइलिंग (audit) — 31 अक्टूबर",
        applies_to=("itr",),
        frequency="annual",
        audience=("business",),
        explainer_en="Audit-case ITR + tax audit report u/s 44AB by 31 October.",
        explainer_hi="Audit-case ITR + 44AB tax audit report — 31 अक्टूबर तक।",
        schedule="itr_audit_oct_31",
    ),
    _Rule(
        key="belated_itr_dec_31",
        title="Belated / revised ITR — 31 December",
        title_hi="Belated / revised ITR — 31 दिसंबर",
        applies_to=("itr",),
        frequency="annual",
        audience=("all",),
        explainer_en="Last date to file a belated or revised ITR for the previous financial year.",
        explainer_hi="पिछले वित्त वर्ष का belated/revised ITR — 31 दिसंबर तक।",
        schedule="belated_itr_dec_31",
    ),
    _Rule(
        key="form_16_jun_15",
        title="Form 16 issue — 15 June",
        title_hi="Form 16 issue — 15 जून",
        applies_to=("form_16",),
        frequency="annual",
        audience=("employer",),
        explainer_en="Employers must issue Form 16 to employees by 15 June for the previous FY.",
        explainer_hi="Employers — पिछले FY के लिए Form 16 — 15 जून तक देना है।",
        schedule="form_16_jun_15",
    ),
    _Rule(
        key="pf_esi_monthly",
        title="PF + ESI contribution — 15th",
        title_hi="PF + ESI contribution — 15 तारीख",
        applies_to=("pf_esi",),
        frequency="monthly",
        audience=("employer",),
        explainer_en="Provident Fund + ESI dues by the 15th of each month for the previous month's wages.",
        explainer_hi="पिछले महीने के PF + ESI — 15 तारीख तक।",
        schedule="pf_esi_monthly_15",
    ),
)


def _to_dict(rule: _Rule, due: date, language: str) -> dict:
    days = (due - date.today()).days
    if language == "hi":
        title, explainer = rule.title_hi, rule.explainer_hi
        urgent_phrase = (
            f"{title} — {due.strftime('%d-%m-%Y')} ({days} दिन बाक़ी)"
            if days >= 0 else
            f"{title} — {due.strftime('%d-%m-%Y')} ({abs(days)} दिन पहले निकल गई)"
        )
    else:
        title, explainer = rule.title, rule.explainer_en
        urgent_phrase = (
            f"{title} — {due.strftime('%d %b %Y')} ({days} day{'s' if days != 1 else ''} away)"
            if days >= 0 else
            f"{title} — {due.strftime('%d %b %Y')} ({abs(days)} day{'s' if abs(days) != 1 else ''} ago)"
        )
    return {
        "key": rule.key,
        "title": title,
        "explainer": explainer,
        "applies_to": list(rule.applies_to),
        "frequency": rule.frequency,
        "audience": list(rule.audience),
        "due_date": due.isoformat(),
        "days_until": days,
        "is_urgent": days <= 7,
        "spoken": urgent_phrase,
    }


# ───── Public API ──────────────────────────────────────────

def upcoming(
    *,
    audience: Optional[str] = None,
    within_days: int = 90,
    language: str = "en",
    today: Optional[date] = None,
) -> list[dict]:
    """Next deadlines within `within_days` of today. Sorted soonest first."""
    today = today or datetime.now(IST).date()
    items = []
    for rule in _RULES:
        if audience and audience not in rule.audience and "all" not in rule.audience:
            continue
        try:
            due = _SCHEDULES[rule.schedule](today)
        except Exception as e:  # noqa: BLE001
            log.warning("deadline schedule failed for %s: %s", rule.key, e)
            continue
        if (due - today).days > within_days:
            continue
        items.append(_to_dict(rule, due, language))
    items.sort(key=lambda d: d["due_date"])
    return items


# ───── Reminder subscription (stub) ────────────────────────

def _init_subs_db() -> None:
    with _DB_LOCK, sqlite3.connect(_DB_PATH, timeout=10.0, isolation_level=None) as c:
        c.execute("PRAGMA journal_mode=WAL")
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS ca_deadline_subs (
              user_token TEXT NOT NULL,
              rule_key   TEXT NOT NULL,
              language   TEXT NOT NULL DEFAULT 'en',
              created_at INTEGER NOT NULL,
              PRIMARY KEY (user_token, rule_key)
            )
            """
        )


def subscribe(user_token: str, rule_key: str, language: str = "en") -> dict:
    if not user_token or len(user_token) < 8:
        raise ValueError("user_token required")
    if not any(r.key == rule_key for r in _RULES):
        raise ValueError(f"unknown rule_key: {rule_key}")
    _init_subs_db()
    import time
    with _DB_LOCK, sqlite3.connect(_DB_PATH, timeout=10.0, isolation_level=None) as c:
        c.execute(
            "INSERT OR REPLACE INTO ca_deadline_subs(user_token, rule_key, language, created_at) VALUES (?,?,?,?)",
            (user_token, rule_key, language or "en", int(time.time())),
        )
    log.info(
        "[ca-deadline subscribe stub] user_token=%s rule_key=%s lang=%s — channels not yet wired",
        user_token[:8] + "…", rule_key, language,
    )
    return {"ok": True, "user_token": user_token, "rule_key": rule_key, "language": language}


def unsubscribe(user_token: str, rule_key: str) -> dict:
    _init_subs_db()
    with _DB_LOCK, sqlite3.connect(_DB_PATH, timeout=10.0, isolation_level=None) as c:
        cur = c.execute(
            "DELETE FROM ca_deadline_subs WHERE user_token=? AND rule_key=?",
            (user_token, rule_key),
        )
    return {"ok": True, "removed": cur.rowcount}


def list_subscriptions(user_token: str, *, language: str = "en") -> list[dict]:
    _init_subs_db()
    with _DB_LOCK, sqlite3.connect(_DB_PATH, timeout=10.0, isolation_level=None) as c:
        rows = c.execute(
            "SELECT rule_key, language FROM ca_deadline_subs WHERE user_token=?",
            (user_token,),
        ).fetchall()
    by_key = {r.key: r for r in _RULES}
    today = datetime.now(IST).date()
    out = []
    for rule_key, lang in rows:
        rule = by_key.get(rule_key)
        if not rule:
            continue
        try:
            due = _SCHEDULES[rule.schedule](today)
        except Exception:  # noqa: BLE001
            continue
        out.append(_to_dict(rule, due, lang or language))
    out.sort(key=lambda d: d["due_date"])
    return out
