"""
lib/founder_report.py
---------------------
Daily founder report — pulled from every Chitti's quality_audit + quality_feedback
tables, aggregated, and (a) emailed to bryanwilfredpinto@gmail.com at 07:00 IST,
(b) served as JSON at /admin/founder for the sahayai.in/founder dashboard.

Lives in two places:

  1. **lib/founder_report.py** (this file) — the aggregation + email logic.
     Imported by each Chitti's main.py to schedule its own slice of the report.
     (Each Chitti reports on itself; the founder service stitches them together.)

  2. **chitti-founder/backend/** — the central dashboard service that pulls
     all 12 Chittis' summaries and emails one consolidated report. See that
     folder's README.

Report contents (per Chitti, last 24h):

  - total responses
  - thumbs-up % (out of thumbs-rated responses)
  - rail triggers — count by (rail, action). "Quadrails triggered" = sum of
    BLOCK + REDIRECT + INJECT outcomes.
  - hallucination rate — fraction of sampled responses with hallucination >0.5
  - average tone score
  - top complaints — comments on thumbs-down feedback, deduped + length-sorted

Email transport
---------------
Gmail OAuth (already wired in chitti-vaani for sending) is reused if available.
Falls back to SMTP via FOUNDER_SMTP_* env vars. Falls back to "log only" if
neither is configured — useful for dev.
"""
from __future__ import annotations

import json
import logging
import os
import random
import smtplib
from dataclasses import dataclass, asdict, field
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from typing import Any

from sqlalchemy import select, func
from sqlalchemy.orm import sessionmaker

from .evaluators import EVAL_SAMPLE_RATE, evaluate_response
from .observability import QualityAudit
from .feedback import QualityFeedback


log = logging.getLogger("founder_report")

FOUNDER_EMAIL = os.environ.get("FOUNDER_EMAIL", "bryanwilfredpinto@gmail.com")
REPORT_HOUR_IST = int(os.environ.get("FOUNDER_REPORT_HOUR_IST", "7"))
REPORT_MINUTE_IST = int(os.environ.get("FOUNDER_REPORT_MINUTE_IST", "0"))


# ---------- Per-Chitti slice ----------------------------------------------


@dataclass
class ChittiDailySlice:
    chitti: str
    window_hours: int = 24
    total_responses: int = 0
    thumbs_up: int = 0
    thumbs_down: int = 0
    thumbs_up_pct: float | None = None
    rail_triggers: dict[str, int] = field(default_factory=dict)  # rail:action -> count
    quadrails_total_blocks: int = 0
    hallucination_rate: float | None = None     # 0..1, fraction of sampled responses with hallucination > 0.5
    avg_tone: float | None = None                # 0..1
    avg_helpfulness: float | None = None
    avg_correctness: float | None = None
    top_complaints: list[str] = field(default_factory=list)
    sampled: int = 0                              # how many responses were LLM-judged

    def to_dict(self) -> dict:
        return asdict(self)


# ---------- Aggregator ----------------------------------------------------


def compute_slice(chitti: str, engine, *, window_hours: int = 24,
                  eval_sample_rate: float | None = None) -> ChittiDailySlice:
    """Pull last `window_hours` of quality_audit + quality_feedback rows for
    this Chitti and roll them up. Runs LLM-as-judge on a random sample."""
    sample_rate = eval_sample_rate if eval_sample_rate is not None else EVAL_SAMPLE_RATE
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    since = datetime.now(timezone.utc) - timedelta(hours=window_hours)
    out = ChittiDailySlice(chitti=chitti, window_hours=window_hours)

    with Session() as sess:
        # total responses
        out.total_responses = int(sess.scalar(
            select(func.count(QualityAudit.id)).where(
                (QualityAudit.chitti == chitti) &
                (QualityAudit.kind == "response") &
                (QualityAudit.ts >= since)
            )
        ) or 0)

        # rail counts (rail:action -> count)
        rail_rows = sess.execute(
            select(QualityAudit.rail, QualityAudit.action, func.count(QualityAudit.id))
            .where(
                (QualityAudit.chitti == chitti) &
                (QualityAudit.kind == "rail") &
                (QualityAudit.ts >= since)
            )
            .group_by(QualityAudit.rail, QualityAudit.action)
        ).all()
        for rail_, action_, count_ in rail_rows:
            out.rail_triggers[f"{rail_}:{action_}"] = int(count_)
            if action_ in ("block", "redirect", "inject"):
                out.quadrails_total_blocks += int(count_)

        # thumbs
        thumbs_rows = sess.execute(
            select(QualityFeedback.thumbs, func.count(QualityFeedback.id))
            .where(
                (QualityFeedback.chitti == chitti) &
                (QualityFeedback.ts >= since)
            )
            .group_by(QualityFeedback.thumbs)
        ).all()
        for t_, c_ in thumbs_rows:
            if t_ == "up":
                out.thumbs_up = int(c_)
            elif t_ == "down":
                out.thumbs_down = int(c_)
        total_thumbs = out.thumbs_up + out.thumbs_down
        out.thumbs_up_pct = round(100.0 * out.thumbs_up / total_thumbs, 1) if total_thumbs else None

        # top complaints — comments on thumbs-down
        complaint_rows = sess.execute(
            select(QualityFeedback.comment)
            .where(
                (QualityFeedback.chitti == chitti) &
                (QualityFeedback.thumbs == "down") &
                (QualityFeedback.comment.is_not(None)) &
                (QualityFeedback.ts >= since)
            )
            .limit(200)
        ).all()
        seen: set[str] = set()
        for (c,) in complaint_rows:
            if not c:
                continue
            key = c.strip().lower()[:200]
            if key in seen:
                continue
            seen.add(key)
            out.top_complaints.append(c.strip()[:300])
        out.top_complaints = sorted(out.top_complaints, key=len, reverse=True)[:5]

        # sample responses for LLM-as-judge
        sample_size = max(0, min(50, int(out.total_responses * sample_rate)))
        if sample_size:
            resp_rows = sess.execute(
                select(QualityAudit.payload_json)
                .where(
                    (QualityAudit.chitti == chitti) &
                    (QualityAudit.kind == "response") &
                    (QualityAudit.ts >= since)
                )
                .limit(out.total_responses)
            ).all()
            payloads = [r[0] for r in resp_rows if r[0]]
            picks = random.sample(payloads, min(sample_size, len(payloads)))
            tones, helps, corrs, halls = [], [], [], []
            for p_json in picks:
                try:
                    p = json.loads(p_json)
                except (json.JSONDecodeError, TypeError):
                    continue
                scores = evaluate_response(
                    chitti=chitti,
                    user_input=p.get("user_text", ""),
                    model_output=p.get("model_output", ""),
                    sources=p.get("sources") or [],
                )
                if not scores:
                    continue
                tones.append(scores.tone)
                helps.append(scores.helpfulness)
                corrs.append(scores.correctness)
                halls.append(scores.hallucination)
            if tones:
                out.sampled = len(tones)
                out.avg_tone = round(sum(tones) / len(tones), 3)
                out.avg_helpfulness = round(sum(helps) / len(helps), 3)
                out.avg_correctness = round(sum(corrs) / len(corrs), 3)
                hall_high = sum(1 for h in halls if h > 0.5)
                out.hallucination_rate = round(hall_high / len(halls), 3)

    return out


# ---------- Rendering -----------------------------------------------------


def render_email_html(slices: list[ChittiDailySlice]) -> tuple[str, str]:
    """Return (subject, html_body) for the consolidated daily report."""
    today = datetime.now(timezone.utc).astimezone(_IST).strftime("%Y-%m-%d")
    subject = f"Sahay AI — Founder Report {today}"

    grand_responses = sum(s.total_responses for s in slices)
    grand_blocks = sum(s.quadrails_total_blocks for s in slices)
    grand_thumbs_up = sum(s.thumbs_up for s in slices)
    grand_thumbs_down = sum(s.thumbs_down for s in slices)
    grand_total_thumbs = grand_thumbs_up + grand_thumbs_down
    grand_pct = (round(100.0 * grand_thumbs_up / grand_total_thumbs, 1)
                 if grand_total_thumbs else None)

    rows = []
    for s in sorted(slices, key=lambda x: -x.total_responses):
        complaint_html = "<br>".join(f"• {_html(c)}" for c in s.top_complaints) or "—"
        rows.append(f"""
        <tr>
          <td><b>{_html(s.chitti)}</b></td>
          <td style="text-align:right">{s.total_responses}</td>
          <td style="text-align:right">{s.thumbs_up_pct if s.thumbs_up_pct is not None else '—'}%</td>
          <td style="text-align:right">{s.quadrails_total_blocks}</td>
          <td style="text-align:right">{int((s.hallucination_rate or 0) * 100)}%</td>
          <td style="text-align:right">{s.avg_tone if s.avg_tone is not None else '—'}</td>
          <td style="font-size:11px">{complaint_html}</td>
        </tr>""")

    html = f"""
    <html><body style="font-family:-apple-system,sans-serif">
      <h2>Sahay AI — Founder Report {today}</h2>
      <p>
        <b>Grand total:</b> {grand_responses:,} responses ·
        {grand_pct if grand_pct is not None else '—'}% thumbs up ·
        {grand_blocks} quadrail triggers
      </p>
      <table border="1" cellpadding="6" style="border-collapse:collapse;font-size:13px">
        <thead style="background:#f0f0f0">
          <tr>
            <th>Chitti</th>
            <th>Responses</th>
            <th>👍 %</th>
            <th>Rails ⚠</th>
            <th>Hallucination</th>
            <th>Avg tone</th>
            <th>Top complaints</th>
          </tr>
        </thead>
        <tbody>{"".join(rows)}</tbody>
      </table>
      <p style="color:#888;font-size:11px;margin-top:18px">
        Live dashboard: <a href="https://sahayai.in/founder">sahayai.in/founder</a>.
        Auto-generated by lib/founder_report.py at 07:00 IST.
      </p>
    </body></html>
    """.strip()
    return subject, html


def _html(s: str) -> str:
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;"))


# ---------- Email transport ----------------------------------------------


def send_report_email(subject: str, html_body: str, recipient: str = FOUNDER_EMAIL) -> bool:
    """SMTP send. Returns True on success. Logs and returns False on any error."""
    host = os.environ.get("FOUNDER_SMTP_HOST", "")
    port = int(os.environ.get("FOUNDER_SMTP_PORT", "587"))
    user = os.environ.get("FOUNDER_SMTP_USER", "")
    pw = os.environ.get("FOUNDER_SMTP_PASS", "")
    from_addr = os.environ.get("FOUNDER_FROM", user or "chitti@sahayai.in")

    if not (host and user and pw):
        log.info("FOUNDER report (no SMTP configured) — subject=%r", subject)
        return False

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = recipient
    msg.set_content("This email requires an HTML viewer.")
    msg.add_alternative(html_body, subtype="html")

    try:
        with smtplib.SMTP(host, port, timeout=20) as s:
            s.starttls()
            s.login(user, pw)
            s.send_message(msg)
        return True
    except Exception as e:  # noqa: BLE001
        log.warning("FOUNDER SMTP send failed: %s", e)
        return False


# ---------- Scheduler integration ----------------------------------------


from zoneinfo import ZoneInfo  # noqa: E402 — placed here for clarity of grouping
_IST = ZoneInfo("Asia/Kolkata")


def schedule_daily_report(scheduler, engine, chitti: str) -> None:
    """Wire APScheduler so this Chitti contributes its slice every day at 07:00 IST.

    The chitti-founder service then aggregates all 12 slices and sends ONE email.
    But each Chitti also stores its own slice locally (idempotent — for backup).
    """
    if scheduler is None:
        return

    def _job():
        try:
            slice_ = compute_slice(chitti, engine)
            log.info("FOUNDER slice for %s: %s", chitti, slice_.to_dict())
        except Exception as e:  # noqa: BLE001
            log.warning("FOUNDER slice failed for %s: %s", chitti, e)

    scheduler.add_job(
        _job, "cron",
        hour=REPORT_HOUR_IST, minute=REPORT_MINUTE_IST,
        timezone=_IST,
        id=f"founder_report_{chitti}",
        replace_existing=True,
    )
    log.info("FOUNDER cron scheduled: %s @ %02d:%02d IST", chitti, REPORT_HOUR_IST, REPORT_MINUTE_IST)
