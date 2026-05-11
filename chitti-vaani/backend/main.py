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

from config import settings
from routes.vaani import bp as vaani_bp
from routes.email import bp as email_bp
from routes.emergency import bp as emergency_bp
from routes.admin import bp as admin_bp
from routes.feedback import bp as feedback_bp
from services import admin_scheduler, feedback_scheduler
from scripts import admin_seed

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
    app.register_blueprint(admin_bp)
    app.register_blueprint(feedback_bp)

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

    return app


app = _create_app()


if __name__ == "__main__":
    import os
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8003)), debug=True)
