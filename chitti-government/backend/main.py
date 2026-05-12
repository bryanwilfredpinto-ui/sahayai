"""
main.py
-------
Flask entrypoint for the Chitti Government backend.

Why Flask: same reason as chitti-medupi — Render's free-tier slim image
lacks the Rust toolchain pydantic-core needs, so FastAPI's v2-native
default cannot compile from source. Flask is pure Python, plays nicely
with gunicorn, and matches every endpoint surface we already had.

Boot sequence (runs once per gunicorn worker on import):
  1. ensure_schema()             — CREATE SCHEMA IF NOT EXISTS government (Postgres)
  2. Base.metadata.create_all()  — creates government.schemes, .feedback, etc.
  3. seed_if_empty()             — loads 30 curated schemes the first time
  4. scheduler.start()           — APScheduler starts the PIB poller

Entrypoint: gunicorn main:app --bind 0.0.0.0:$PORT
"""
from __future__ import annotations

import logging

from flask import Flask, jsonify
from flask_cors import CORS

from config import settings
from database import Base, engine
import models  # noqa: F401 — registers all models with Base.metadata
from routes.government import bp as government_bp
from services import (
    government_database,
    government_scheduler,
)

# Sahay AI shared quality framework — installed across every Chitti.
# See lib/__init__.py for the architecture overview.
from lib.feedback import feedback_bp, ensure_feedback_table
from lib.founder_report import schedule_daily_report
from lib.hooks import HookRegistry
from lib.observability import Observability, make_metrics_blueprint
from lib.quadrails import build_default_quadrails


CHITTI_SLUG = "chitti-government"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("main")


def _bootstrap() -> None:
    try:
        government_database.ensure_schema()
    except Exception as e:  # noqa: BLE001
        log.warning("ensure_schema skipped: %s", e)
    Base.metadata.create_all(bind=engine)
    try:
        n = government_database.seed_if_empty()
        if n:
            log.info("schemes seed loaded: %d rows", n)
    except Exception as e:  # noqa: BLE001
        log.warning("schemes seed skipped: %s", e)
    # Create quality framework tables (quality_audit, quality_feedback).
    try:
        ensure_feedback_table(engine, CHITTI_SLUG)
        log.info("quality framework tables ensured for %s", CHITTI_SLUG)
    except Exception as e:  # noqa: BLE001
        log.warning("quality framework table init skipped: %s", e)
    try:
        government_scheduler.start()
    except Exception as e:  # noqa: BLE001
        log.warning("scheduler failed to start: %s", e)
    # Daily founder report at 07:00 IST. Each Chitti contributes its own
    # slice; chitti-founder aggregates and emails.
    try:
        sched = getattr(government_scheduler, "_scheduler", None) or getattr(government_scheduler, "scheduler", None)
        if sched is not None:
            schedule_daily_report(sched, engine, CHITTI_SLUG)
    except Exception as e:  # noqa: BLE001
        log.warning("founder cron schedule skipped: %s", e)


def _create_app() -> Flask:
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024  # 8 MB upload cap (DigiLocker XML / PDF)
    app.config["JSON_SORT_KEYS"] = False

    allowed = [o.strip() for o in (settings.ALLOWED_ORIGINS or "").split(",") if o.strip()]
    CORS(
        app,
        origins=allowed or "*",
        supports_credentials=False,
        allow_headers="*",
        methods="*",
    )

    @app.get("/")
    def root():
        return jsonify({
            "app": "Chitti Government API",
            "version": "1.0.0",
            "status": "ok",
            "endpoints": [
                "GET  /health",
                "GET  /api/government/health",
                "GET  /api/government/schemes",
                "GET  /api/government/schemes/<slug>",
                "GET  /api/government/schemes/<slug>/checklist",
                "GET  /api/government/schemes/<slug>/status_link",
                "POST /api/government/eligibility/check",
                "POST /api/government/eligibility/scan",
                "GET  /api/government/alerts",
                "POST /api/government/alerts/poll",
                "GET  /api/government/locator/kinds",
                "GET  /api/government/locator",
                "POST /api/government/feedback",
                "GET  /api/government/feedback/summary",
                "GET  /api/government/scheduler/status",
                "GET  /api/government/freshness",
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

    app.register_error_handler(400, _err(400, "bad_request"))
    app.register_error_handler(404, _err(404, "not_found"))
    app.register_error_handler(405, _err(405, "method_not_allowed"))
    app.register_error_handler(413, _err(413, "payload_too_large"))
    app.register_error_handler(415, _err(415, "unsupported_media_type"))

    @app.errorhandler(500)
    def server_error(e):
        log.exception("500: %s", e)
        return jsonify({"error": "internal_server_error", "detail": "see server logs"}), 500

    app.register_blueprint(government_bp)

    # Quality framework: /api/feedback (thumbs up/down) + optional /metrics.
    app.register_blueprint(feedback_bp)
    mbp = make_metrics_blueprint()
    if mbp is not None:
        app.register_blueprint(mbp)

    # Build and stash the hook registry. Service code reaches for it via
    # `current_app.config["CHITTI_HOOKS"]` and wraps every DeepSeek call with
    # hooks.before_model / hooks.after_model.
    try:
        obs = Observability(chitti=CHITTI_SLUG, engine=engine)
        app.config["CHITTI_HOOKS"] = HookRegistry(
            chitti=CHITTI_SLUG,
            quadrails=build_default_quadrails(CHITTI_SLUG),
            observability=obs,
        )
        log.info("quality hooks installed for %s", CHITTI_SLUG)
    except Exception as e:  # noqa: BLE001
        log.warning("quality hooks install skipped: %s", e)

    return app


_bootstrap()
app = _create_app()


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8003))
    app.run(host="0.0.0.0", port=port, debug=True)
