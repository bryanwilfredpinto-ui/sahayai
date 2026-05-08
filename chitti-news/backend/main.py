"""
main.py
-------
Flask entrypoint for the Chitti News backend.

Boot order (runs once per gunicorn worker on import):
  1. ensure_schema()                — CREATE SCHEMA IF NOT EXISTS news
  2. Base.metadata.create_all()     — creates news.articles etc.
  3. seed_sources_if_empty()        — loads data/sources.json on first boot
  4. seed_articles_if_empty()       — loads data/articles_seed.json
  5. scheduler.start()              — APScheduler kicks in (RSS poll every 30 min)

Entrypoint: `gunicorn main:app --bind 0.0.0.0:$PORT`
"""
from __future__ import annotations

import logging

from flask import Flask, jsonify
from flask_cors import CORS

from config import settings
from database import Base, engine, ensure_schema
import models  # noqa: F401 — registers models with Base.metadata
from routes.news import bp as news_bp
from services import news_scheduler, news_seed

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("main")


def _bootstrap() -> None:
    try:
        ensure_schema()
    except Exception as e:  # noqa: BLE001
        log.warning("ensure_schema skipped: %s", e)
    Base.metadata.create_all(bind=engine)
    try:
        n = news_seed.seed_sources_if_empty()
        if n: log.info("sources seed loaded: %d rows", n)
    except Exception as e:  # noqa: BLE001
        log.warning("sources seed skipped: %s", e)
    try:
        n = news_seed.seed_articles_if_empty()
        if n: log.info("articles seed loaded: %d rows", n)
    except Exception as e:  # noqa: BLE001
        log.warning("articles seed skipped: %s", e)
    try:
        news_scheduler.start()
    except Exception as e:  # noqa: BLE001
        log.warning("scheduler failed to start: %s", e)


def _create_app() -> Flask:
    app = Flask(__name__)
    app.config["JSON_SORT_KEYS"] = False

    allowed = [o.strip() for o in (settings.ALLOWED_ORIGINS or "").split(",") if o.strip()]
    CORS(app, origins=allowed or "*", supports_credentials=False, allow_headers="*", methods="*")

    @app.get("/")
    def root():
        return jsonify({"app": "Chitti News API", "version": "1.0.0", "status": "ok"})

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

    @app.errorhandler(500)
    def server_error(e):
        log.exception("500: %s", e)
        return jsonify({"error": "internal_server_error", "detail": "see server logs"}), 500

    app.register_blueprint(news_bp)
    return app


_bootstrap()
app = _create_app()


if __name__ == "__main__":
    import os
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8002)), debug=True)
