"""
chitti-4wheeler / backend / main.py
-----------------------------------
Flask entrypoint for Chitti 4-Wheeler API. Same shape as
chitti-2wheeler / chitti-government — Flask + gunicorn, pure-Python
deps so Render's slim image builds without the Rust toolchain.

Endpoints (P0 — skeleton):
  GET  /health                  — liveness for Render + chitti-founder
  POST /api/4w/ask              — DeepSeek-powered Hinglish Q&A grounded in
                                  MECHANIC_KNOWLEDGE.md
  GET  /api/4w/dtc/<code>       — DTC plain-Hinglish lookup
  POST /api/4w/breakdown        — breakdown decision tree
  GET  /api/4w/maintenance/next — next-service estimate from brand schedule
  POST /api/4w/profile          — persist car profile (in-memory today)

Everything else → 501 "coming_soon" per the
[Honest stubs over fake demos] platform rule.

Boot: gunicorn main:app --bind 0.0.0.0:$PORT
"""
from __future__ import annotations

import logging
import os

from flask import Flask, jsonify
from flask_cors import CORS

from config import settings
from routes.wheels import bp as wheels_bp

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
log = logging.getLogger("main")


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": settings.allowed_origins_list}})

    @app.get("/health")
    def health():
        return jsonify({
            "ok": True,
            "chitti": "chitti-4wheeler",
            "version": "0.1-skeleton",
            "deepseek_configured": bool(settings.DEEPSEEK_API_KEY),
        })

    app.register_blueprint(wheels_bp, url_prefix="/api/4w")

    @app.errorhandler(404)
    def _404(e):
        return jsonify({"error": "not_found", "hint": "See /api/4w/ routes; FEATURES.md lists what's live vs coming soon."}), 404

    @app.errorhandler(500)
    def _500(e):
        log.exception("internal error")
        return jsonify({"error": "internal", "hint": "Backend hiccup. Retry."}), 500

    log.info("chitti-4wheeler boot OK · deepseek=%s", bool(settings.DEEPSEEK_API_KEY))
    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8080")), debug=False)
