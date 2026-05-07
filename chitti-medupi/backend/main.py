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
from services import (
    medupi_database,
    medupi_jan_aushadhi,
    medupi_migrations,
    medupi_scheduler,
)

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
    Base.metadata.create_all(bind=engine)
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
    try:
        medupi_scheduler.start()
    except Exception as e:  # noqa: BLE001
        log.warning("scheduler failed to start: %s", e)


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
        allow_headers="*",
        methods="*",
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
        return jsonify({"error": "internal_server_error", "detail": "see server logs"}), 500

    app.register_blueprint(medupi_bp)
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
