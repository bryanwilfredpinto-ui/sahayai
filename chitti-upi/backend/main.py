"""
main.py — Flask entrypoint for Chitti UPI Fraud Guard.

Endpoints:
  GET   /                     — service banner
  GET   /health               — liveness
  POST  /api/upi/check        — risk classification
  GET   /api/upi/rules        — RBI 2026 educational cards
  GET   /api/upi/health       — DeepSeek key configured?

Run: gunicorn main:app --bind 0.0.0.0:$PORT
"""
from __future__ import annotations

import logging

from flask import Flask, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine

from config import settings
from routes.upi import bp as upi_bp

# Sahay AI shared quality framework — installed across every Chitti.
from lib.hooks import HookRegistry
from lib.observability import Observability, install_request_timing
from lib.quadrails import build_default_quadrails

CHITTI_SLUG = "chitti-upi"

# chitti-upi is a stateless fraud classifier — it has no business DB.
# Give the quality framework its own dedicated engine so quality_audit /
# quality_feedback tables have somewhere to land.
_quality_engine = create_engine(
    "sqlite:////tmp/chitti_upi_quality.db",
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
    app.config["MAX_CONTENT_LENGTH"] = 1 * 1024 * 1024

    allowed = [o.strip() for o in (settings.ALLOWED_ORIGINS or "").split(",") if o.strip()]
    CORS(app, origins=allowed or "*", supports_credentials=False,
         allow_headers="*", methods="*")

    @app.get("/")
    def root():
        return jsonify({"app": "Chitti UPI Fraud Guard API", "version": "1.0.0", "status": "ok"})

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

    app.register_blueprint(upi_bp)

    # Quality framework: Observability + HookRegistry + SLA timing.
    # Every DeepSeek call in services/upi_service.py is wrapped via the
    # registry — see services/upi_service.py:check() for the call-site.
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
        log.warning("quality framework install skipped: %s", e)

    return app


app = _create_app()


if __name__ == "__main__":
    import os
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8004)), debug=True)
