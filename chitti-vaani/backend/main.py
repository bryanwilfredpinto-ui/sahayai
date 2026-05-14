"""
main.py — Flask entrypoint for Chitti Vaani backend.

Endpoints surface (single product, single Flask app):
  GET   /                    — service banner
  GET   /health              — liveness
  POST  /api/vaani/ask       — Chitti Vaani reply (DeepSeek)
  GET   /api/vaani/health    — DeepSeek key configured?
  GET   /api/vaani/languages — supported voice languages

Run:    gunicorn main:app --bind 0.0.0.0:$PORT
"""
from __future__ import annotations

import logging

from flask import Flask, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine

from config import settings
from routes.vaani import bp as vaani_bp
from routes.email import bp as email_bp
from routes.emergency import bp as emergency_bp
from routes.local import bp as local_bp
from routes.admin import bp as admin_bp
from routes.feedback import bp as feedback_bp
from routes.checkin import bp as checkin_bp
from routes.missed_call import bp as missed_call_bp
from services import admin_scheduler, checkin_service, feedback_scheduler, missed_call_service
from scripts import admin_seed

# Sahay AI shared quality framework — installed across every Chitti.
# See lib/__init__.py for the architecture overview.
from lib.feedback import feedback_bp as quality_feedback_bp, ensure_feedback_table
from lib.founder_report import schedule_daily_report
from lib.hooks import HookRegistry
from lib.observability import Observability, install_request_timing, make_metrics_blueprint
from lib.quadrails import build_default_quadrails


CHITTI_SLUG = "chitti-vaani"

# Chitti Vaani persists admin + feedback data via SQLite at /tmp paths and does
# not expose a single shared SQLAlchemy engine. Give the quality framework its
# own dedicated engine so quality_audit / quality_feedback tables live in their
# own DB file, away from existing admin / feedback subsystems.
_quality_engine = create_engine(
    "sqlite:////tmp/chitti_vaani_quality.db",
    connect_args={"check_same_thread": False},
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("main")


def _create_app() -> Flask:
    app = Flask(__name__)
    app.config["JSON_SORT_KEYS"] = False
    app.config["MAX_CONTENT_LENGTH"] = 1 * 1024 * 1024  # 1 MB body cap

    allowed = [o.strip() for o in (settings.ALLOWED_ORIGINS or "").split(",") if o.strip()]
    CORS(app, origins=allowed or "*", supports_credentials=False,
         allow_headers="*", methods="*")

    @app.get("/")
    def root():
        return jsonify({"app": "Chitti Vaani API", "version": "1.0.0", "status": "ok"})

    @app.get("/health")
    def health():
        return jsonify({"ok": True})

    def _err(status, code):
        def handler(e):
            return jsonify({"error": code, "detail": str(getattr(e, "description", e))}), status
        handler.__name__ = f"err_{status}"
        return handler

    app.register_error_handler(400, _err(400, "bad_request"))
    app.register_error_handler(404, _err(404, "not_found"))
    app.register_error_handler(405, _err(405, "method_not_allowed"))
    app.register_error_handler(413, _err(413, "payload_too_large"))

    @app.errorhandler(500)
    def server_error(e):
        log.exception("500: %s", e)
        return jsonify({"error": "internal_server_error", "detail": "see server logs"}), 500

    app.register_blueprint(vaani_bp)
    app.register_blueprint(email_bp)
    app.register_blueprint(emergency_bp)
    app.register_blueprint(local_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(feedback_bp)
    app.register_blueprint(checkin_bp)
    app.register_blueprint(missed_call_bp)

    # Daily check-in (P0 — elderly users). Idempotent table create, and
    # scheduler integration happens after admin_scheduler.start() so we
    # piggy-back on its APScheduler instance.
    try:
        checkin_service.init_db()
    except Exception as e:  # noqa: BLE001
        log.warning("checkin DB init skipped: %s", e)
    try:
        missed_call_service.init_db()
    except Exception as e:  # noqa: BLE001
        log.warning("missed_call DB init skipped: %s", e)

    # Admin: schema, seed, scheduler. Each step is wrapped — a misconfigured
    # ADMIN_DATABASE_URL must not take down the rest of Vaani.
    try:
        from services import admin_db
        admin_db.init_db()
        admin_seed.seed_defaults_if_empty()
    except Exception as e:  # noqa: BLE001
        log.warning("admin DB init/seed skipped: %s", e)
    try:
        admin_scheduler.start()
    except Exception as e:  # noqa: BLE001
        log.warning("admin_scheduler not started: %s", e)

    # Cross-product feedback: schema + daily 6 AM IST report scheduler.
    try:
        from services import feedback_db
        feedback_db.init_db()
    except Exception as e:  # noqa: BLE001
        log.warning("feedback DB init skipped: %s", e)
    try:
        feedback_scheduler.start()
    except Exception as e:  # noqa: BLE001
        log.warning("feedback_scheduler not started: %s", e)

    # Quality framework: create tables, register /api/feedback + /metrics,
    # build the hook registry that service code wraps DeepSeek calls with.
    try:
        ensure_feedback_table(_quality_engine, CHITTI_SLUG)
        log.info("quality framework tables ensured for %s", CHITTI_SLUG)
    except Exception as e:  # noqa: BLE001
        log.warning("quality framework table init skipped: %s", e)

    app.register_blueprint(quality_feedback_bp)
    mbp = make_metrics_blueprint()
    if mbp is not None:
        app.register_blueprint(mbp)

    try:
        obs = Observability(chitti=CHITTI_SLUG, engine=_quality_engine)
        app.config["CHITTI_OBSERVABILITY"] = obs
        app.config["CHITTI_HOOKS"] = HookRegistry(
            chitti=CHITTI_SLUG,
            quadrails=build_default_quadrails(CHITTI_SLUG),
            observability=obs,
        )
        install_request_timing(app, CHITTI_SLUG, observability=obs)
        log.info("quality hooks + request timing installed for %s", CHITTI_SLUG)
    except Exception as e:  # noqa: BLE001
        log.warning("quality hooks install skipped: %s", e)

    # Daily founder report at 07:00 IST — piggyback on admin_scheduler's
    # APScheduler instance (exposed as `_scheduler`).
    try:
        sched = getattr(admin_scheduler, "_scheduler", None) or getattr(admin_scheduler, "scheduler", None)
        if sched is not None:
            schedule_daily_report(sched, _quality_engine, CHITTI_SLUG)
    except Exception as e:  # noqa: BLE001
        log.warning("founder cron schedule skipped: %s", e)

    # Daily check-in scan — every 5 min, reuses admin_scheduler's APScheduler.
    # The job itself is gated per-row (only fires inside the user's IST
    # window) so polling every 5 minutes is cheap. Silence beyond the
    # per-user max_prompts triggers emergency_service.trigger() — same
    # family cascade, same 112/100/102 denylist, never cops.
    try:
        from apscheduler.triggers.interval import IntervalTrigger
        sched = getattr(admin_scheduler, "_scheduler", None) or getattr(admin_scheduler, "scheduler", None)
        if sched is not None:
            def _checkin_job():
                try:
                    res = checkin_service.run_scan()
                    log.info("[scheduler] daily_checkin OK %s", res)
                except Exception as e:  # noqa: BLE001
                    log.exception("[scheduler] daily_checkin FAILED: %s", e)
            sched.add_job(
                _checkin_job,
                IntervalTrigger(minutes=5),
                id="daily_checkin",
                replace_existing=True,
                misfire_grace_time=600,
            )
            log.info("daily_checkin job scheduled (every 5 min)")
    except Exception as e:  # noqa: BLE001
        log.warning("daily_checkin schedule skipped: %s", e)

    # Missed-call dispatch — every minute. Honest stub today (provider
    # client wires later), but the queue is real so a webhook today
    # already produces a row + an audit trail.
    try:
        from apscheduler.triggers.interval import IntervalTrigger
        sched = getattr(admin_scheduler, "_scheduler", None) or getattr(admin_scheduler, "scheduler", None)
        if sched is not None:
            def _missed_call_job():
                try:
                    res = missed_call_service.run_dispatch_queue()
                    log.info("[scheduler] missed_call_dispatch OK %s", res)
                except Exception as e:  # noqa: BLE001
                    log.exception("[scheduler] missed_call_dispatch FAILED: %s", e)
            sched.add_job(
                _missed_call_job,
                IntervalTrigger(minutes=1),
                id="missed_call_dispatch",
                replace_existing=True,
                misfire_grace_time=120,
            )
            log.info("missed_call_dispatch job scheduled (every 1 min)")
    except Exception as e:  # noqa: BLE001
        log.warning("missed_call_dispatch schedule skipped: %s", e)

    return app


app = _create_app()


if __name__ == "__main__":
    import os
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8003)), debug=True)
