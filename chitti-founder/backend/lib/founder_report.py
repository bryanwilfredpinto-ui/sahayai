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
                  eval_sample_rate: float | None = None,
                  observability=None) -> ChittiDailySlice:
    """Pull last `window_hours` of quality_audit + quality_feedback rows for
    this Chitti and roll them up. Runs LLM-as-judge on a random sample.

    If `observability` is provided, every LLM-as-judge call writes a
    `kind="judge"` audit row (one before, one after, with latency and
    scores). Pass `Observability(chitti=..., engine=engine)` from the
    caller — typically the daily founder cron — so judge turns join the
    same audit fan-in as production turns.
    """
    sample_rate = eval_sample_rate if eval_sample_rate is not None else EVAL_SAMPLE_RATE
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    since = datetime.now(timezone.utc) - timedelta(hours=window_hours)
    out = ChittiDailySlice(chitti=chitti, window_hours=window_hours)

    # If no Observability was passed, build a transient one from `engine`
    # so judge turns still land in `quality_audit` alongside production
    # turns. Best-effort: failure to import is just a missed audit row,
    # never a failed slice.
    if observability is None:
        try:
            from .observability import Observability  # noqa: PLC0415
            observability = Observability(chitti=chitti, engine=engine)
        except Exception:  # noqa: BLE001
            observability = None

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
                    observability=observability,
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


def render_email_html(slices: list[ChittiDailySlice],
                      prev_slices: list[ChittiDailySlice] | None = None,
                      defects: list | None = None) -> tuple[str, str]:
    """Return (subject, html_body) for the consolidated daily Chitti Quality
    email — 07:00 IST. Includes the Part 2 horizontal quality table, the
    Part 3 defect-rate table, the Critical/Warning/Healthy panels, and the
    YOUR TASKS TODAY numbered list. `prev_slices` is the same shape from
    24h earlier so we can show ▲ / ▼ / ▬ trend arrows."""
    today = datetime.now(timezone.utc).astimezone(_IST).strftime("%Y-%m-%d")
    subject = f"Sahay AI — Daily Quality Report · {today}"

    prev_pct = {p.chitti: (p.thumbs_up_pct or 0) for p in (prev_slices or [])}

    # ── Part 2 — horizontal quality table ──────────────────────────────
    def _status(up_pct: float | None) -> tuple[str, str]:
        if up_pct is None: return ("⚪", "—")
        if up_pct > 90: return ("🟢", "Healthy")
        if up_pct >= 80: return ("🟡", "Warning")
        return ("🔴", "Critical")

    def _trend(chitti: str, up_pct: float | None) -> str:
        if up_pct is None: return "▬"
        prev = prev_pct.get(chitti)
        if prev is None or prev == 0: return "▬"
        if up_pct - prev > 1: return "▲"
        if up_pct - prev < -1: return "▼"
        return "▬"

    def _action(up_pct: float | None) -> str:
        if up_pct is None: return "No data — wire /admin/founder/slice"
        if up_pct > 90: return "Keep shipping"
        if up_pct >= 80: return "Read top complaints; ship patch this week"
        return "URGENT: triage today; SMS escalation if <70%"

    critical: list[str] = []
    warning: list[str] = []
    healthy: list[str] = []
    rows = []
    for s in sorted(slices, key=lambda x: -x.total_responses):
        symbol, label = _status(s.thumbs_up_pct)
        trend = _trend(s.chitti, s.thumbs_up_pct)
        up_pct_str = "—" if s.thumbs_up_pct is None else f"{s.thumbs_up_pct}%"
        down_pct = None if s.thumbs_up_pct is None else round(100 - s.thumbs_up_pct, 1)
        down_pct_str = "—" if down_pct is None else f"{down_pct}%"
        top_issue = (s.top_complaints[0] if s.top_complaints else "—")[:80]
        if label == "Critical": critical.append(s.chitti)
        elif label == "Warning": warning.append(s.chitti)
        elif label == "Healthy": healthy.append(s.chitti)
        rows.append(
            f"<tr>"
            f"<td><b>{_html(s.chitti)}</b></td>"
            f"<td style='text-align:right'>{s.total_responses}</td>"
            f"<td style='text-align:right'>{up_pct_str}</td>"
            f"<td style='text-align:right'>{down_pct_str}</td>"
            f"<td style='font-size:11px'>{_html(top_issue)}</td>"
            f"<td style='text-align:center;font-size:16px'>{trend}</td>"
            f"<td style='text-align:center'>{symbol} {label}</td>"
            f"<td style='font-size:11px'>{_html(_action(s.thumbs_up_pct))}</td>"
            f"</tr>"
        )

    # ── Part 3 — defect-rate table ────────────────────────────────────
    defects = defects or []
    def _dstatus(pct: float) -> str:
        if pct >= 10: return "🔴"
        if pct >= 5: return "🟡"
        return "🟢"
    defect_rows = []
    for d in defects[:10]:
        affected = ", ".join(getattr(d, "affected_products", []) or [])
        defect_rows.append(
            f"<tr>"
            f"<td>{_dstatus(d.pct)} <b>{_html(d.type)}</b></td>"
            f"<td style='text-align:right'>{d.count}</td>"
            f"<td style='text-align:right'>{d.pct}%</td>"
            f"<td style='font-size:11px'>{_html(affected) or '—'}</td>"
            f"<td style='font-size:11px'>{_html(d.root_cause)}</td>"
            f"<td style='text-align:center'>{_html(d.fix_effort)}</td>"
            f"</tr>"
        )
    top3 = defects[:3]
    top3_html = ""
    if top3:
        eta_map = {"S": "1 day", "M": "1 week", "L": "1 sprint"}
        top3_html = "<ol style='margin:6px 0 0;padding-left:20px'>" + "".join(
            f"<li><b>{_html(d.type)}</b> · {d.count} hits · "
            f"fix ETA <b>{eta_map.get(d.fix_effort, '—')}</b> · "
            f"{_html(d.root_cause)}</li>"
            for d in top3
        ) + "</ol>"

    # ── Your tasks today ──────────────────────────────────────────────
    tasks: list[str] = []
    if critical:
        tasks.append(f"🚨 Triage <b>{critical[0]}</b> — &lt;80% thumbs up. SMS will fire if &lt;70%.")
    for s in slices:
        if (s.hallucination_rate or 0) > 0.05:
            tasks.append(f"🧠 {s.chitti} hallucination rate {int((s.hallucination_rate or 0)*100)}% — tighten grounding sources.")
            break
    for d in defects[:1]:
        tasks.append(f"🛠️ Pick a fix for top defect: <b>{d.type}</b> ({d.pct}%) — {d.root_cause}.")
    if not tasks:
        tasks.append("✅ No critical signals today. Keep shipping.")
    tasks_html = "<ol style='margin:6px 0 0;padding-left:20px'>" + "".join(
        f"<li>{t}</li>" for t in tasks
    ) + "</ol>"

    # ── Headline numbers ──────────────────────────────────────────────
    grand_responses = sum(s.total_responses for s in slices)
    grand_thumbs_up = sum(s.thumbs_up for s in slices)
    grand_thumbs_down = sum(s.thumbs_down for s in slices)
    grand_total_thumbs = grand_thumbs_up + grand_thumbs_down
    grand_pct = (round(100.0 * grand_thumbs_up / grand_total_thumbs, 1)
                 if grand_total_thumbs else None)

    html = f"""
    <html><body style="font-family:-apple-system,sans-serif;color:#0E2344">
      <h2 style="margin:0 0 4px">Sahay AI — Daily Quality Report</h2>
      <p style="margin:0 0 14px;color:#666">{today} · 07:00 IST · auto-generated by lib/founder_report.py</p>

      <p>
        <b>Grand total:</b> {grand_responses:,} responses ·
        <b>{grand_pct if grand_pct is not None else '—'}%</b> thumbs up ·
        <b>{len(critical)}</b> 🔴 · <b>{len(warning)}</b> 🟡 · <b>{len(healthy)}</b> 🟢
      </p>

      <h3 style="margin-top:18px">Part 2 · Quality status per Chitti</h3>
      <table border="1" cellpadding="6" style="border-collapse:collapse;font-size:13px;width:100%">
        <thead style="background:#f0f0f0">
          <tr>
            <th>Product</th><th>Responses</th><th>👍 rate</th><th>👎 rate</th>
            <th>Top issue</th><th>Trend</th><th>Status</th><th>Action</th>
          </tr>
        </thead>
        <tbody>{''.join(rows) or '<tr><td colspan=8 style="text-align:center;color:#888">No slice data — chitti-founder cron has not yet pulled from /admin/founder/slice.</td></tr>'}</tbody>
      </table>

      <table cellpadding="8" cellspacing="0" style="margin-top:16px;font-size:13px;width:100%">
        <tr>
          <td style="background:#fee2e2;border-radius:8px;width:33%;vertical-align:top">
            <b style="color:#7f1d1d">🔴 Critical (&lt;80%)</b><br>
            {('<br>'.join(critical) or '— none —')}
          </td>
          <td style="background:#fef3c7;border-radius:8px;width:33%;vertical-align:top">
            <b style="color:#7c2d12">🟡 Warning (80–90%)</b><br>
            {('<br>'.join(warning) or '— none —')}
          </td>
          <td style="background:#dcfce7;border-radius:8px;width:33%;vertical-align:top">
            <b style="color:#14532d">🟢 Healthy (&gt;90%)</b><br>
            {('<br>'.join(healthy) or '— none —')}
          </td>
        </tr>
      </table>

      <h3 style="margin-top:18px">YOUR TASKS TODAY</h3>
      {tasks_html}

      <h3 style="margin-top:24px">Part 3 · Defect rate (last 24h)</h3>
      <table border="1" cellpadding="6" style="border-collapse:collapse;font-size:13px;width:100%">
        <thead style="background:#f0f0f0">
          <tr>
            <th>Defect type</th><th>Count</th><th>%</th>
            <th>Affected products</th><th>Root cause</th><th>Fix effort</th>
          </tr>
        </thead>
        <tbody>{''.join(defect_rows) or '<tr><td colspan=6 style="text-align:center;color:#888">No 👎 comments in the last 24h — or aggregator not yet wired.</td></tr>'}</tbody>
      </table>

      <h3 style="margin-top:18px">Top 3 defect clusters · with fix ETA</h3>
      {top3_html or '<p style="color:#888">No defect clusters today.</p>'}

      <p style="color:#888;font-size:11px;margin-top:18px">
        Live dashboard: <a href="https://sahayai.in/founder">sahayai.in/founder</a> ·
        Public trust page: <a href="https://sahayai.in/chitti_quality.html">chitti_quality.html</a>.
        See <code>chitti-quality/CONTEXT.md</code> for the full framework.
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
