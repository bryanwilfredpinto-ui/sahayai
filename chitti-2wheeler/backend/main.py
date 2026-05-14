"""
chitti-2wheeler / backend / main.py
-----------------------------------
Flask entrypoint for Chitti 2-Wheeler API.

Boot order (runs once per gunicorn worker on import):
  1. ensure_schema()             — no-op on Turso/SQLite; Postgres hook left for future
  2. Base.metadata.create_all()  — creates bike_profiles (+ future models)
  3. Register routes blueprint

Endpoints (P0 — skeleton):
  GET  /health                  — liveness for Render + chitti-founder self-ping
  POST /api/2w/ask              — DeepSeek-powered Hinglish Q&A grounded in
                                  MECHANIC_KNOWLEDGE.md
  GET  /api/2w/dtc/<code>       — DTC plain-Hinglish lookup
  POST /api/2w/breakdown        — breakdown decision-tree
  GET  /api/2w/maintenance/next — next-service estimate from brand schedule
  POST /api/2w/profile          — persist bike profile (Turso)
  GET  /api/2w/profile          — read bike profile

Everything else → honest 501 "coming_soon".

Boot: gunicorn main:app --bind 0.0.0.0:$PORT
"""
from __future__ import annotations

import logging
import os

from flask import Flask, jsonify
from flask_cors import CORS

from config import settings
from database import Base, engine, ensure_schema
import models  # noqa: F401 — registers models with Base.metadata
from routes.wheels import bp as wheels_bp

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
log = logging.getLogger("main")


def _bootstrap() -> None:
    try:
        ensure_schema()
    except Exception as e:  # noqa: BLE001
        log.warning("ensure_schema skipped: %s", e)
    try:
        Base.metadata.create_all(bind=engine)
        log.info("Base.metadata.create_all OK — bike_profiles ready")
    except Exception as e:  # noqa: BLE001
        log.warning("create_all skipped: %s", e)


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": settings.allowed_origins_list}})

    _bootstrap()

    @app.get("/health")
    def health():
        return jsonify({
            "ok": True,
            "chitti": "chitti-2wheeler",
            "version": "0.2-turso",
            "deepseek_configured": bool(settings.DEEPSEEK_API_KEY),
            "db_kind": "turso-replica" if settings.DATABASE_URL.startswith("libsql://") else "sqlite-local",
        })

    app.register_blueprint(wheels_bp, url_prefix="/api/2w")

    try:
        from lib.observability import Observability, install_request_timing
        obs = Observability(chitti="chitti-2wheeler", engine=engine)
        app.config["CHITTI_OBSERVABILITY"] = obs
        install_request_timing(app, "chitti-2wheeler", observability=obs)
    except Exception as e:  # noqa: BLE001
        log.warning("request timing install skipped: %s", e)

    @app.errorhandler(404)
    def _404(e):
        return jsonify({"error": "not_found", "hint": "See /api/2w/ routes; FEATURES.md lists what's live vs coming soon."}), 404

    @app.errorhandler(500)
    def _500(e):
        log.exception("internal error")
        return jsonify({"error": "internal", "hint": "Backend hiccup. Retry. If persistent, founder is notified by chitti-founder self-ping."}), 500

    log.info("chitti-2wheeler boot OK · deepseek=%s · db=%s", bool(settings.DEEPSEEK_API_KEY), settings.DATABASE_URL.split("?", 1)[0])
    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8080")), debug=False)
