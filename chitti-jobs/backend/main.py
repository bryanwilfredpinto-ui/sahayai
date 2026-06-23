"""
main.py
-------
Flask entrypoint for the Chitti Jobs backend (BO1–BO10).

Boot sequence (once per gunicorn worker on import):
  1. ensure_schema()             — no-op on Turso/SQLite; CREATE SCHEMA on PG
  2. Base.metadata.create_all()  — creates users, jobs_raw, jobs_scored,
                                    applications, follow_ups, interviews, ingest_log
  3. quality framework tables    — quality_audit / quality_feedback
  4. scheduler.start()           — daily 07:00 IST source poll (BO4)

Entrypoint: gunicorn main:app --bind 0.0.0.0:$PORT
"""
from __future__ import annotations

import logging

from flask import Flask, jsonify
from flask_cors import CORS

from config import settings
from database import Base, engine
import models  # noqa: F401 — registers all models with Base.metadata
from routes.jobs import bp as jobs_bp
from services import jobs_database, jobs_scheduler

from lib.feedback import feedback_bp, ensure_feedback_table
from lib.founder_report import schedule_daily_report
from lib.hooks import HookRegistry
from lib.observability import Observability, install_request_timing, make_metrics_blueprint
from lib.quadrails import build_default_quadrails

CHITTI_SLUG = "chitti-jobs"

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
log = logging.getLogger("main")


def _bootstrap() -> None:
    try:
        jobs_database.ensure_schema()
    except Exception as e:  # noqa: BLE001
        log.warning("ensure_schema skipped: %s", e)
    Base.metadata.create_all(bind=engine)
    try:
        ensure_feedback_table(engine, CHITTI_SLUG)
        log.info("quality framework tables ensured for %s", CHITTI_SLUG)
    except Exception as e:  # noqa: BLE001
        log.warning("quality framework table init skipped: %s", e)
    try:
        jobs_scheduler.start()
    except Exception as e:  # noqa: BLE001
        log.warning("scheduler failed to start: %s", e)
    try:
        sched = getattr(jobs_scheduler, "_scheduler", None)
        if sched is not None:
            schedule_daily_report(sched, engine, CHITTI_SLUG)
    except Exception as e:  # noqa: BLE001
        log.warning("founder cron schedule skipped: %s", e)


def _create_app() -> Flask:
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024
    app.config["JSON_SORT_KEYS"] = False

    allowed = [o.strip() for o in (settings.ALLOWED_ORIGINS or "").split(",") if o.strip()]
    CORS(
        app,
        origins=allowed or "*",
        supports_credentials=False,
        allow_headers=["Content-Type", "Authorization", "Accept", "X-User-Token",
                       "X-Admin-Secret", "X-Requested-With", "X-Chitti-Request-Id"],
        methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        expose_headers=["X-Chitti-Request-Id", "X-Chitti-Response-Time-Ms"],
    )

    @app.get("/")
    def root():
        return jsonify({
            "app": "Chitti Jobs API",
            "version": "1.0.0-bo10",
            "status": "ok",
            "llm": "deepseek",
            "endpoints": [
                "GET  /health",
                "GET  /api/jobs/health",
                "GET  /api/jobs/profile", "POST /api/jobs/profile",
                "POST /api/jobs/source", "POST /api/jobs/manual",
                "GET  /api/jobs/digest",
                "POST /api/jobs/scored/<id>/skip", "POST /api/jobs/scored/<id>/apply",
                "POST /api/jobs/applications/<id>/sent",
                "GET  /api/jobs/pipeline", "POST /api/jobs/applications/<id>/status",
            ],
        })

    @app.get("/health")
    def health():
        return jsonify({"ok": True})

    def _err(status: int, code: str):
        def handler(e):
            detail = str(getattr(e, "description", e))
            return jsonify({"error": code, "detail": detail}), status
        handler.__name__ = f"err_{status}"
        return handler

    for code, name in ((400, "bad_request"), (404, "not_found"), (405, "method_not_allowed"),
                       (413, "payload_too_large"), (415, "unsupported_media_type")):
        app.register_error_handler(code, _err(code, name))

    @app.errorhandler(500)
    def server_error(e):
        log.exception("500: %s", e)
        return jsonify({"error": "internal_server_error", "detail": "see server logs"}), 500

    app.register_blueprint(jobs_bp)
    app.register_blueprint(feedback_bp)
    mbp = make_metrics_blueprint()
    if mbp is not None:
        app.register_blueprint(mbp)

    try:
        obs = Observability(chitti=CHITTI_SLUG, engine=engine)
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

    return app


_bootstrap()
app = _create_app()


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8010))
    app.run(host="0.0.0.0", port=port, debug=True)
