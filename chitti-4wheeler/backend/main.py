"""
chitti-4wheeler / backend / main.py
-----------------------------------
Flask entrypoint for Chitti 4-Wheeler API. Same shape as
chitti-2wheeler — Flask + gunicorn + Turso embedded replica.

Boot order:
  1. ensure_schema()             — no-op on Turso/SQLite
  2. Base.metadata.create_all()  — creates car_profiles (+ future models)
  3. Register routes blueprint

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
        log.info("Base.metadata.create_all OK — car_profiles ready")
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
            "chitti": "chitti-4wheeler",
            "version": "0.2-turso",
            "deepseek_configured": bool(settings.DEEPSEEK_API_KEY),
            "db_kind": "turso-replica" if settings.DATABASE_URL.startswith("libsql://") else "sqlite-local",
        })

    app.register_blueprint(wheels_bp, url_prefix="/api/4w")

    try:
        from lib.observability import Observability, install_request_timing
        from lib.hooks import HookRegistry
        from lib.quadrails import build_default_quadrails
        obs = Observability(chitti="chitti-4wheeler", engine=engine)
        app.config["CHITTI_OBSERVABILITY"] = obs
        app.config["CHITTI_HOOKS"] = HookRegistry(
            chitti="chitti-4wheeler",
            quadrails=build_default_quadrails("chitti-4wheeler"),
            observability=obs,
        )
        install_request_timing(app, "chitti-4wheeler", observability=obs)
        log.info("quality hooks + request timing installed for chitti-4wheeler")
    except Exception as e:  # noqa: BLE001
        log.warning("quality framework install skipped: %s", e)

    @app.errorhandler(404)
    def _404(e):
        return jsonify({"error": "not_found", "hint": "See /api/4w/ routes; FEATURES.md lists what's live vs coming soon."}), 404

    @app.errorhandler(500)
    def _500(e):
        log.exception("internal error")
        return jsonify({"error": "internal", "hint": "Backend hiccup. Retry."}), 500

    log.info("chitti-4wheeler boot OK · deepseek=%s · db=%s", bool(settings.DEEPSEEK_API_KEY), settings.DATABASE_URL.split("?", 1)[0])
    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8080")), debug=False)
