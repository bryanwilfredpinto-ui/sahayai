"""
chitti-2wheeler / backend / main.py
-----------------------------------
Flask entrypoint for Chitti 2-Wheeler API.

Why Flask: same reason as chitti-medupi and chitti-government — Render's
free-tier slim image lacks the Rust toolchain pydantic-core needs, so
FastAPI's v2-native default cannot compile from source. Flask is pure
Python, plays nicely with gunicorn, matches the shape of every other
Chitti backend.

Endpoints (P0 — skeleton):
  GET  /health                  — liveness for Render + chitti-founder self-ping
  POST /api/2w/ask              — DeepSeek-powered Hinglish Q&A grounded in
                                  MECHANIC_KNOWLEDGE.md
  GET  /api/2w/dtc/<code>       — DTC plain-Hinglish lookup (local stub today)
  POST /api/2w/breakdown        — breakdown decision-tree (deterministic)
  GET  /api/2w/maintenance/next — next-service estimate from brand schedule
  POST /api/2w/profile          — persist bike profile (in-memory today)

Everything else from FEATURES.md returns 501 with an honest "coming soon"
body. Per [SAHAYAI_MASTER §3 — Honest stubs over fake demos].

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
            "chitti": "chitti-2wheeler",
            "version": "0.1-skeleton",
            "deepseek_configured": bool(settings.DEEPSEEK_API_KEY),
        })

    app.register_blueprint(wheels_bp, url_prefix="/api/2w")

    @app.errorhandler(404)
    def _404(e):
        return jsonify({"error": "not_found", "hint": "See /api/2w/ routes; FEATURES.md lists what's live vs coming soon."}), 404

    @app.errorhandler(500)
    def _500(e):
        log.exception("internal error")
        return jsonify({"error": "internal", "hint": "Backend hiccup. Retry. If persistent, founder is notified by chitti-founder self-ping."}), 500

    log.info("chitti-2wheeler boot OK · deepseek=%s", bool(settings.DEEPSEEK_API_KEY))
    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8080")), debug=False)
