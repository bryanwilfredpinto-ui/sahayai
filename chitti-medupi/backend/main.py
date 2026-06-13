"""
main.py
-------
Flask entrypoint for the Chitti MedUPI backend.

Why Flask: Render's free-tier slim image lacks Rust + cmake, so
pydantic-core (and hence FastAPI's v2-native default) cannot compile
from source. Flask is pure Python, plays nicely with gunicorn, and
matches every endpoint surface we already had under FastAPI.

Boot sequence (runs once per gunicorn worker on import):
  1. ensure_schema()             — CREATE SCHEMA IF NOT EXISTS medupi (Postgres)
  2. Base.metadata.create_all()  — creates medupi.medicines etc.
  3. run_all() migrations        — column-level upgrades for v1.7
  4. seed_if_empty() ×2          — 51 medicines + 25 stores on first boot
  5. scheduler.start()           — APScheduler kicks in for the cron jobs

Entrypoint:  uvicorn-style → `gunicorn main:app --bind 0.0.0.0:$PORT`
"""
from __future__ import annotations

import logging

from flask import Flask, jsonify
from flask_cors import CORS

from config import settings
from database import Base, engine
import models  # noqa: F401 — registers all models with Base.metadata
from routes.medupi import bp as medupi_bp
from routes.health_file import bp as health_file_bp  # Chitti Health File, added 2026-05-23
from routes.health_scanner import bp as health_scanner_bp  # Chitti Health Scanner, added 2026-06-05
from services import (
    medupi_database,
    medupi_jan_aushadhi,
    medupi_migrations,
    medupi_scheduler,
)

# Sahay AI shared quality framework — installed across every Chitti.
# See lib/__init__.py for the architecture overview.
from lib.feedback import feedback_bp, ensure_feedback_table
from lib.founder_report import schedule_daily_report
from lib.hooks import HookRegistry
from lib.observability import Observability, install_request_timing, make_metrics_blueprint
from lib.quadrails import build_default_quadrails


CHITTI_SLUG = "chitti-medupi"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("main")


# ───── Bootstrap (idempotent — safe across gunicorn worker restarts) ─────

def _bootstrap() -> None:
    try:
        medupi_migrations.ensure_schema()
    except Exception as e:  # noqa: BLE001
        log.warning("ensure_schema skipped: %s", e)
    # NOTE (2026-06-13): create_all forces the engine's first connection, which
    # runs `PRAGMA read_uncommitted` during dialect.initialize. When the Turso
    # backend is degraded (e.g. reads blocked on quota), that bare call raised
    # OperationalError and crash-looped every gunicorn worker at boot. Guard it
    # like every other boot-time DB call so a degraded DB no longer takes the
    # whole service down — the worker boots, health endpoints respond, and
    # DB-backed routes fail per-request instead of killing the process.
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:  # noqa: BLE001
        log.warning("create_all skipped (DB unavailable at boot): %s", e)
    try:
        result = medupi_migrations.run_all()
        log.info("migrations: %s", result)
    except Exception as e:  # noqa: BLE001
        log.warning("migrations skipped: %s", e)
    try:
        n = medupi_database.seed_if_empty()
        if n:
            log.info("medicines seed loaded: %d rows", n)
    except Exception as e:  # noqa: BLE001
        log.warning("medicines seed skipped: %s", e)
    try:
        n = medupi_jan_aushadhi.seed_if_empty()
        if n:
            log.info("Jan Aushadhi seed loaded: %d stores", n)
    except Exception as e:  # noqa: BLE001
        log.warning("Jan Aushadhi seed skipped: %s", e)
    # Create quality framework tables (quality_audit, quality_feedback).
    try:
        ensure_feedback_table(engine, CHITTI_SLUG)
        log.info("quality framework tables ensured for %s", CHITTI_SLUG)
    except Exception as e:  # noqa: BLE001
        log.warning("quality framework table init skipped: %s", e)
    try:
        medupi_scheduler.start()
    except Exception as e:  # noqa: BLE001
        log.warning("scheduler failed to start: %s", e)
    # Daily founder report at 07:00 IST. Each Chitti contributes its own
    # slice; chitti-founder aggregates and emails.
    try:
        sched = getattr(medupi_scheduler, "_scheduler", None) or getattr(medupi_scheduler, "scheduler", None)
        if sched is not None:
            schedule_daily_report(sched, engine, CHITTI_SLUG)
    except Exception as e:  # noqa: BLE001
        log.warning("founder cron schedule skipped: %s", e)


# ───── Flask app factory ─────

def _create_app() -> Flask:
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024  # 8 MB upload cap (image scan)
    app.config["JSON_SORT_KEYS"] = False

    allowed = [o.strip() for o in (settings.ALLOWED_ORIGINS or "").split(",") if o.strip()]
    CORS(
        app,
        origins=allowed or "*",
        supports_credentials=False,
        allow_headers=[
            "Content-Type", "Authorization", "Accept",
            "X-User-Token", "X-Admin-Secret",
            "X-Requested-With", "X-Chitti-Request-Id",
        ],
        methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        expose_headers=[
            "X-Chitti-Request-Id", "X-Chitti-Response-Time-Ms",
        ],
    )

    @app.get("/")
    def root():
        return jsonify({
            "app": "Chitti MedUPI API",
            "version": "1.7.2-flask",
            "status": "ok",
        })

    @app.get("/health")
    def health():
        return jsonify({"ok": True})

    # ── Error handlers ──

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
        # Surface the actual exception class + message so curl-from-outside
        # can debug write failures without Railway log access. The class name
        # + first-line message are not secrets (no PII, no SQL parameters).
        original = getattr(e, "original_exception", None) or e
        ex_class = type(original).__name__
        ex_msg = str(original).splitlines()[0][:300] if str(original) else ""
        return jsonify({
            "error": "internal_server_error",
            "detail": "see server logs",
            "exception_class": ex_class,
            "exception_message": ex_msg,
        }), 500

    app.register_blueprint(medupi_bp)
    app.register_blueprint(health_file_bp)
    app.register_blueprint(health_scanner_bp)

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


# Run bootstrap before exposing the app — gunicorn waits for the module
# to fully import before serving traffic, so this is safe.
_bootstrap()
app = _create_app()


if __name__ == "__main__":
    # Local dev: `python main.py`
    import os
    port = int(os.environ.get("PORT", 8001))
    app.run(host="0.0.0.0", port=port, debug=True)
