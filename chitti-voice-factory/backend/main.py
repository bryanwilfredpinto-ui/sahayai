"""
main.py — Flask entrypoint for Chitti Voice Factory.

Endpoints surface:
  GET   /                      — service banner
  GET   /health                — liveness
  GET   /api/voice/languages   — 26-language registry
  GET   /api/voice/status      — all languages honest status
  GET   /api/voice/status/<lang> — one language status
  POST  /api/voice/speak       — synthesise + cascade
  GET   /api/voice/honest-banner — disclaimer text
  GET   /api/voice/ledger      — anonymized ledger report
  POST  /api/voice/donate      — volunteer donation (v1: stub)
  GET   /api/voice/donations   — public donor list (v1: empty)

Run: gunicorn main:app --bind 0.0.0.0:$PORT
"""
from __future__ import annotations

import logging

from flask import Flask, jsonify
from flask_cors import CORS

from config import settings
from database import ensure_schema
from routes.donate import bp as donate_bp
from routes.fluency import bp as fluency_bp
from routes.voice import bp as voice_bp

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
        return jsonify({
            "app": "Chitti Voice Factory",
            "version": "1.0.0",
            "status": "ok",
            "languages": 26,
            "docs": "https://github.com/sahayai/sahayai/blob/main/CHITTI_VOICE_FACTORY_MASTER_SPEC.md",
        })

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

    app.register_blueprint(voice_bp)
    app.register_blueprint(donate_bp)
    app.register_blueprint(fluency_bp)

    # Ensure schema on startup
    ensure_schema()

    return app


app = _create_app()


if __name__ == "__main__":
    import os
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8004)), debug=True)
