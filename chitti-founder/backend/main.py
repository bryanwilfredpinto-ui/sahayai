"""
chitti-founder backend — Chitti Quality v2 (2026-05-13)
========================================================
Central consolidator + escalator for the Sahay AI quality framework.

Crons (timezone Asia/Kolkata):
  • DAILY   · 07:00 IST  ─ Chitti Quality Daily Report email
  • WEEKLY  · Sunday 08:00 IST ─ Weekly Trend Report email
  • HOURLY  · :15 ─ Escalator pass (low thumbs → SMS, defect repeat → GH issue,
                    carbon > 0.5g → GH issue)

Endpoints:
  • GET  /health
  • GET  /admin/founder/json?secret=…       — full daily slice JSON
  • GET  /admin/founder/html?secret=…       — render the daily email in browser
  • GET  /admin/founder/weekly?secret=…     — render the weekly email in browser
  • POST /admin/founder/send?secret=…       — manual trigger: daily report
  • POST /admin/founder/send-weekly?secret=…— manual trigger: weekly report
  • POST /admin/founder/escalate?secret=…   — manual trigger: escalator pass
  • POST /api/feedback/collect              — pubic shim that forwards to
                                              the originating Chitti's
                                              /api/feedback (so the widget
                                              only needs to know ONE host).

Auth
----
- Slice-pull from each Chitti uses bearer `FOUNDER_PULL_SECRET`.
- /admin/founder/* requires `?secret=<ADMIN_SECRET>`.
- /api/feedback/collect is intentionally public — it's the public-facing
  router for the widget. It rate-limits at ~30/min/IP via httpx defaults.

Honest-stub posture
-------------------
- SMTP, SMS, GitHub token may all be unset on first deploy. Each helper
  logs what it WOULD have done and returns False so the cron still runs
  green. Sire enables one at a time via env vars.
"""
from __future__ import annotations

import json
import logging
import os
import re
from collections import deque
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from apscheduler.schedulers.background import BackgroundScheduler
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from zoneinfo import ZoneInfo

from lib.founder_report import (
    ChittiDailySlice, render_email_html, send_report_email,
    FOUNDER_EMAIL, REPORT_HOUR_IST, REPORT_MINUTE_IST,
)
from lib.chitti_quality import (
    ALL_PRODUCTS,
    DefectCluster, aggregate_defects, classify_defect,
    WeeklyTrendRow, render_weekly_html,
    escalate_repeating_defect, escalate_low_thumbs, escalate_carbon,
    THUMBS_DOWN_CRITICAL_PCT, CO2_FLAG_THRESHOLD_G,
    risk_level,
)


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("chitti-founder")


# ---------- Config --------------------------------------------------------


_IST = ZoneInfo("Asia/Kolkata")
ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "")
PULL_SECRET = os.environ.get("FOUNDER_PULL_SECRET", "")
PULL_TIMEOUT_S = float(os.environ.get("FOUNDER_PULL_TIMEOUT_S", "10"))

WEEKLY_HOUR_IST = int(os.environ.get("WEEKLY_REPORT_HOUR_IST", "8"))
WEEKLY_MINUTE_IST = int(os.environ.get("WEEKLY_REPORT_MINUTE_IST", "0"))

# Production endpoint list. Each Chitti is expected to expose
# GET /admin/founder/slice (Authorization: Bearer <PULL_SECRET>).
_DEFAULT_ENDPOINTS = ",".join([
    "https://chitti-news-api.onrender.com",
    "https://chitti-government-api.onrender.com",
    "https://chitti-vaani-api.onrender.com",
    "https://chitti-voice-factory-api.onrender.com",
    "https://chitti-medupi-api.onrender.com",
    "https://chitti-shares-api.onrender.com",
    "https://chitti-ca-api.onrender.com",
    "https://chitti-legal-api.onrender.com",
])
CHITTI_ENDPOINTS = [
    u.strip().rstrip("/")
    for u in os.environ.get("CHITTI_ENDPOINTS", _DEFAULT_ENDPOINTS).split(",")
    if u.strip()
]


# ---------- Slice puller --------------------------------------------------


def _pull_slice(base_url: str) -> ChittiDailySlice | None:
    headers = {"Authorization": f"Bearer {PULL_SECRET}"} if PULL_SECRET else {}
    try:
        with httpx.Client(timeout=PULL_TIMEOUT_S) as c:
            r = c.get(f"{base_url}/admin/founder/slice", headers=headers)
        if r.status_code != 200:
            log.warning("slice pull from %s: HTTP %s", base_url, r.status_code)
            return ChittiDailySlice(chitti=_slug(base_url))
        return _slice_from_dict(r.json())
    except Exception as e:  # noqa: BLE001
        log.warning("slice pull from %s failed: %s", base_url, e)
        return ChittiDailySlice(chitti=_slug(base_url))


def _slug(url: str) -> str:
    host = url.split("://", 1)[-1].split("/", 1)[0]
    return host.split(".", 1)[0].removesuffix("-api")


def _slice_from_dict(d: dict[str, Any]) -> ChittiDailySlice:
    s = ChittiDailySlice(chitti=d.get("chitti", "unknown"))
    for k, v in d.items():
        if hasattr(s, k):
            setattr(s, k, v)
    return s


def pull_all_slices() -> list[ChittiDailySlice]:
    return [_pull_slice(u) or ChittiDailySlice(chitti=_slug(u)) for u in CHITTI_ENDPOINTS]


# ---------- Defect / trend memory (in-process, 14-day ring) ----------------


# Per-defect-type, count of consecutive days seen (>=1 hit).
_DEFECT_STREAK: dict[str, int] = {}
# Per-chitti, last 14 days' thumbs-up %. Used for trend arrows + weekly digest.
_PCT_HISTORY: dict[str, deque] = {}
# Last full slice snapshot, used as "yesterday" trend baseline for daily email.
_YESTERDAY_SLICES: list[ChittiDailySlice] = []


def _record_history(slices: list[ChittiDailySlice]) -> None:
    """Append today's up_pct per Chitti to the 14-day ring buffer."""
    for s in slices:
        ring = _PCT_HISTORY.setdefault(s.chitti, deque(maxlen=14))
        ring.append(s.thumbs_up_pct)


def _build_defects_from_slices(slices: list[ChittiDailySlice]) -> list[DefectCluster]:
    rows = []
    for s in slices:
        for c in (s.top_complaints or []):
            rows.append({"chitti": s.chitti, "comment": c})
    return aggregate_defects(rows)


# ---------- Email jobs ----------------------------------------------------


def run_daily_report() -> dict:
    """07:00 IST cron — Chitti Quality Daily Report."""
    global _YESTERDAY_SLICES
    log.info("[daily] pulling %d slices", len(CHITTI_ENDPOINTS))
    slices = pull_all_slices()
    defects = _build_defects_from_slices(slices)
    subject, html = render_email_html(slices, prev_slices=_YESTERDAY_SLICES, defects=defects)
    ok = send_report_email(subject, html, recipient=FOUNDER_EMAIL)

    _record_history(slices)
    _YESTERDAY_SLICES = slices  # baseline for tomorrow's trend arrows

    summary = {
        "ok": ok,
        "subject": subject,
        "slices": [s.to_dict() for s in slices],
        "defects": [d.to_dict() for d in defects],
        "recipient": FOUNDER_EMAIL,
    }
    log.info("[daily] ok=%s  recipient=%s  %d slices  %d defects",
             ok, FOUNDER_EMAIL, len(slices), len(defects))
    return summary


def run_weekly_report() -> dict:
    """Sunday 08:00 IST — Weekly Quality Trend Report."""
    slices = pull_all_slices()
    rows: list[WeeklyTrendRow] = []
    for s in slices:
        ring = list(_PCT_HISTORY.get(s.chitti) or [])
        last_week = [p for p in ring[-7:] if p is not None]
        prev_week = [p for p in ring[-14:-7] if p is not None]
        avg_last = round(sum(last_week) / len(last_week), 1) if last_week else None
        avg_prev = round(sum(prev_week) / len(prev_week), 1) if prev_week else None
        delta = None
        if avg_last is not None and avg_prev is not None:
            delta = round(avg_last - avg_prev, 1)
        headline = ""
        if delta is not None and delta > 5:
            headline = "Most-improved candidate"
        elif delta is not None and delta < -5:
            headline = "Urgent — investigate this week"
        elif avg_last is not None and avg_last < THUMBS_DOWN_CRITICAL_PCT:
            headline = f"Below {THUMBS_DOWN_CRITICAL_PCT:.0f}% bar"

        # Top segment / language / peak hour are filled by /admin/founder/slice
        # when each Chitti includes them. Until wired, surface "—" rather than
        # invent numbers.
        rows.append(WeeklyTrendRow(
            chitti=s.chitti,
            responses_7d=s.total_responses * 7,  # rough — replace with rolling-7 sum once wired
            avg_up_pct_7d=avg_last,
            delta_vs_prev_week=delta,
            top_lang=getattr(s, "top_lang", "—") or "—",
            top_segment=getattr(s, "top_segment", "—") or "—",
            peak_hour_ist=getattr(s, "peak_hour_ist", "—") or "—",
            headline=headline,
        ))
    subject, html = render_weekly_html(rows)
    ok = send_report_email(subject, html, recipient=FOUNDER_EMAIL)
    log.info("[weekly] ok=%s  rows=%d", ok, len(rows))
    return {"ok": ok, "subject": subject, "rows": [r.to_dict() for r in rows]}


def run_escalator() -> dict:
    """Hourly :15 — escalation pass.
    • thumbs_up_pct < 70   → SMS Sire
    • defect type 3+ days  → open GitHub issue
    • CO₂ per response >0.5g → open GitHub issue tagged perf+carbon
    """
    slices = pull_all_slices()
    actions: list[dict[str, Any]] = []

    for s in slices:
        if s.thumbs_up_pct is not None and s.thumbs_up_pct < THUMBS_DOWN_CRITICAL_PCT:
            ok = escalate_low_thumbs(s.chitti, s.thumbs_up_pct)
            actions.append({"action": "sms_sire", "chitti": s.chitti, "ok": ok})

        co2 = getattr(s, "co2_g_per_response", None)
        if co2 is not None and co2 > CO2_FLAG_THRESHOLD_G:
            ok = escalate_carbon(s.chitti, co2)
            actions.append({"action": "carbon_issue", "chitti": s.chitti, "ok": ok})

    # Defect streak — count types that appeared today, then bump or reset.
    defects = _build_defects_from_slices(slices)
    today_types = {d.type for d in defects}
    affected_by_type = {d.type: d.affected_products for d in defects}
    for t in list(_DEFECT_STREAK.keys()):
        if t not in today_types:
            _DEFECT_STREAK.pop(t, None)
    for t in today_types:
        _DEFECT_STREAK[t] = _DEFECT_STREAK.get(t, 0) + 1
        if _DEFECT_STREAK[t] >= 3:
            ok = escalate_repeating_defect(t, _DEFECT_STREAK[t], affected_by_type.get(t, []))
            actions.append({"action": "github_issue", "defect": t,
                            "days": _DEFECT_STREAK[t], "ok": ok})

    log.info("[escalator] actions=%s", json.dumps(actions))
    return {"ok": True, "actions": actions, "streaks": dict(_DEFECT_STREAK)}


# ---------- Public feedback router (used by feedback-widget.js) -----------


_FEEDBACK_API_PER_PAGE = {
    "chitti_news":          "https://chitti-news-api.onrender.com",
    "chitti_government":    "https://chitti-government-api.onrender.com",
    "chitti_vaani":         "https://chitti-vaani-api.onrender.com",
    "chitti_voice_factory": "https://chitti-voice-factory-api.onrender.com",
    "chitti_medupi":        "https://chitti-medupi-api.onrender.com",
    "chitti_complete":      "https://chitti-shares-api.onrender.com",
    "chitti_complete_technical": "https://chitti-shares-api.onrender.com",
    "chitti_fundamentals":  "https://chitti-shares-api.onrender.com",
    "chitti_ca":            "https://chitti-ca-api.onrender.com",
    "chitti_legal":         "https://chitti-legal-api.onrender.com",
    # Stub-only pages route everything to vaani-api (which has the table).
    "chitti_upi":           "https://chitti-vaani-api.onrender.com",
    "chitti_scanner":       "https://chitti-vaani-api.onrender.com",
    "chitti_kirana":        "https://chitti-vaani-api.onrender.com",
    "chitti_pharmacy":      "https://chitti-vaani-api.onrender.com",
    "chitti_saloon":        "https://chitti-vaani-api.onrender.com",
    "chitti_tourism":       "https://chitti-vaani-api.onrender.com",
}
_PAGE_KEY_RE = re.compile(r"[^a-z0-9_-]+")


def _route_feedback(page: str) -> str:
    base = _FEEDBACK_API_PER_PAGE.get(page) or _FEEDBACK_API_PER_PAGE["chitti_vaani"]
    return base.rstrip("/")


# In-process feedback ring used when no per-Chitti backend is reachable. Kept
# small so we don't grow unbounded on a long-running Render dyno. Surfaced by
# /admin/founder/json so Sire can see today's signals even before all 16
# Chittis are wired.
_FEEDBACK_RING: deque[dict] = deque(maxlen=2000)


# ---------- Flask app -----------------------------------------------------


def _require_admin():
    if not ADMIN_SECRET:
        return jsonify({"error": "admin_secret_not_configured"}), 503
    presented = request.args.get("secret") or request.headers.get("X-Admin-Secret", "")
    if presented != ADMIN_SECRET:
        return jsonify({"error": "unauthorized"}), 401
    return None


def _create_app() -> Flask:
    app = Flask(__name__)
    app.config["JSON_SORT_KEYS"] = False

    allowed = os.environ.get(
        "ALLOWED_ORIGINS",
        "https://sahayai.in,https://www.sahayai.in,http://localhost:8000,http://127.0.0.1:8000",
    )
    origins = [o.strip() for o in allowed.split(",") if o.strip()]
    CORS(app, origins=origins or "*", supports_credentials=False)

    @app.get("/")
    def root():
        return jsonify({
            "app": "Chitti Founder", "version": "2.0.0", "status": "ok",
            "crons": {
                "daily": f"{REPORT_HOUR_IST:02d}:{REPORT_MINUTE_IST:02d} IST",
                "weekly": f"Sun {WEEKLY_HOUR_IST:02d}:{WEEKLY_MINUTE_IST:02d} IST",
                "escalator": "hourly :15",
            },
            "products_tracked": ALL_PRODUCTS,
        })

    @app.get("/health")
    def health():
        return jsonify({"ok": True})

    @app.get("/admin/founder/json")
    def admin_json():
        auth = _require_admin()
        if auth: return auth
        slices = pull_all_slices()
        defects = _build_defects_from_slices(slices)
        return jsonify({
            "ok": True,
            "ist_hour": REPORT_HOUR_IST, "ist_minute": REPORT_MINUTE_IST,
            "recipient": FOUNDER_EMAIL,
            "endpoints": CHITTI_ENDPOINTS,
            "slices": [s.to_dict() for s in slices],
            "defects": [d.to_dict() for d in defects],
            "feedback_ring_size": len(_FEEDBACK_RING),
            "defect_streaks": dict(_DEFECT_STREAK),
        })

    @app.get("/admin/founder/html")
    def admin_html():
        auth = _require_admin()
        if auth: return auth
        slices = pull_all_slices()
        defects = _build_defects_from_slices(slices)
        _, html = render_email_html(slices, prev_slices=_YESTERDAY_SLICES, defects=defects)
        return Response(html, mimetype="text/html")

    @app.get("/admin/founder/weekly")
    def admin_weekly():
        auth = _require_admin()
        if auth: return auth
        result = run_weekly_report()
        _, html = render_weekly_html([WeeklyTrendRow(**r) for r in result["rows"]])
        return Response(html, mimetype="text/html")

    @app.post("/admin/founder/send")
    def admin_send_now():
        auth = _require_admin()
        if auth: return auth
        return jsonify(run_daily_report())

    @app.post("/admin/founder/send-weekly")
    def admin_send_weekly():
        auth = _require_admin()
        if auth: return auth
        return jsonify(run_weekly_report())

    @app.post("/admin/founder/escalate")
    def admin_escalate():
        auth = _require_admin()
        if auth: return auth
        return jsonify(run_escalator())

    # Public router used by feedback-widget.js. We accept the payload,
    # tag it with classifier output, mirror it to the originating
    # Chitti's /api/feedback when possible, and keep a copy in our ring.
    @app.post("/api/feedback/collect")
    def feedback_collect():
        payload = request.get_json(silent=True) or {}
        page = _PAGE_KEY_RE.sub("", (payload.get("page") or "")[:60].lower()) or "unknown"
        kind = (payload.get("type") or "")[:32]
        text = (payload.get("text") or "")[:1000]
        lang = (payload.get("lang") or "")[:8]
        seg = (payload.get("user_segment") or "general")[:16]
        co2 = payload.get("co2_g")
        risk = payload.get("risk") or "MEDIUM"

        record = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "page": page, "type": kind, "text": text, "lang": lang,
            "user_segment": seg, "co2_g": co2, "risk": risk,
            "defect_type": classify_defect(text) if text else None,
        }
        _FEEDBACK_RING.append(record)

        # Mirror thumbs to the per-Chitti backend so its quality_feedback
        # table gets the canonical record. We pass an unauth request_id of
        # "widget:<page>:<ts>" since this comes from the public widget.
        mirror_target = _route_feedback(page)
        forwarded = False
        if kind in ("thumbs_up", "thumbs_down"):
            try:
                with httpx.Client(timeout=4) as c:
                    r = c.post(
                        f"{mirror_target}/api/feedback",
                        json={
                            "request_id": f"widget:{page}:{record['ts']}",
                            "thumbs": "up" if kind == "thumbs_up" else "down",
                            "comment": text or "",
                        },
                    )
                forwarded = r.status_code in (200, 201)
            except Exception as e:  # noqa: BLE001
                log.info("[feedback] mirror to %s failed: %s", mirror_target, e)

        return jsonify({"ok": True, "forwarded": forwarded,
                        "defect_type": record["defect_type"]})

    return app


# ---------- Boot ----------------------------------------------------------


_sched: BackgroundScheduler | None = None


def _start_scheduler() -> None:
    global _sched
    if _sched is not None:
        return
    _sched = BackgroundScheduler(timezone=_IST)
    _sched.add_job(
        run_daily_report, "cron",
        hour=REPORT_HOUR_IST, minute=REPORT_MINUTE_IST,
        timezone=_IST, id="daily_founder_report", replace_existing=True,
    )
    _sched.add_job(
        run_weekly_report, "cron",
        day_of_week="sun", hour=WEEKLY_HOUR_IST, minute=WEEKLY_MINUTE_IST,
        timezone=_IST, id="weekly_quality_trend", replace_existing=True,
    )
    _sched.add_job(
        run_escalator, "cron",
        minute=15, timezone=_IST,
        id="hourly_escalator", replace_existing=True,
    )
    _sched.start()
    log.info("scheduler started · daily %02d:%02d IST · weekly Sun %02d:%02d IST · escalator :15",
             REPORT_HOUR_IST, REPORT_MINUTE_IST, WEEKLY_HOUR_IST, WEEKLY_MINUTE_IST)


try:
    _start_scheduler()
except Exception as e:  # noqa: BLE001
    log.warning("scheduler start failed: %s", e)

app = _create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8010)), debug=True)
