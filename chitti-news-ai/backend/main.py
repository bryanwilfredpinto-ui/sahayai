"""
main.py — Flask entrypoint for chitti-news-ai-api.

Boot order (runs once per gunicorn worker on import):
  1. ensure_schema()                — CREATE TABLE IF NOT EXISTS
  2. seed_sources_if_empty()        — loads data/sources.json on first boot
  3. scheduler.start()              — APScheduler (RSS poll, discovery, trust)

Entrypoint: `gunicorn main:app --bind 0.0.0.0:$PORT`

Self-pinged by chitti-founder every 4 minutes per SAHAYAI_MASTER.md §2e.
"""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify
from flask_cors import CORS

from config import settings
from database import SessionLocal, ensure_schema
import models  # noqa: F401 — registers models with Base.metadata
from models.sources import Source
from routes.news_ai import bp as news_ai_bp
from services import news_scheduler


CHITTI_SLUG = "chitti-news-ai"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("main")


def _seed_sources_if_empty() -> int:
    seed_path = Path(__file__).parent / "data" / "sources.json"
    if not seed_path.exists():
        log.warning("sources seed file missing at %s", seed_path)
        return 0
    with SessionLocal() as s:
        existing = s.query(Source).count()
        if existing > 0:
            return 0
        rows = json.loads(seed_path.read_text(encoding="utf-8"))
        for r in rows:
            s.add(Source(
                name=r["name"],
                url=r["url"],
                kind=r.get("kind", "rss"),
                category=r.get("category", "press"),
                language=r.get("language", "en"),
                active=bool(r.get("active_seed", True)),
                trust_score=r.get("trust_score_seed", 0.0),
                trust_band=r.get("trust_band_seed", "pending"),
                reason_for_inclusion=r.get("reason_for_inclusion"),
            ))
        s.commit()
        return len(rows)


def _bootstrap() -> None:
    try:
        ensure_schema()
    except Exception as e:  # noqa: BLE001
        log.warning("ensure_schema skipped: %s", e)
    try:
        n = _seed_sources_if_empty()
        if n:
            log.info("seeded %d sources from data/sources.json", n)
    except Exception as e:  # noqa: BLE001
        log.warning("source seed skipped: %s", e)
    try:
        news_scheduler.start()
    except Exception as e:  # noqa: BLE001
        log.warning("scheduler failed to start: %s", e)


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, origins=list(settings.allowed_origins), supports_credentials=False)

    _bootstrap()

    app.register_blueprint(news_ai_bp)

    @app.get("/health")
    def health():
        with SessionLocal() as s:
            try:
                sources_active = s.query(Source).filter(Source.active == True).count()  # noqa: E712
                sources_pending = s.query(Source).filter(Source.trust_band == "pending").count()
            except Exception:
                sources_active = 0
                sources_pending = 0
        return jsonify({
            "ok": True,
            "service": settings.service_name,
            "version": settings.version,
            "chitti_slug": CHITTI_SLUG,
            "now_utc": datetime.utcnow().isoformat() + "Z",
            "sources_active": sources_active,
            "sources_pending_verification": sources_pending,
            "scheduler_enabled": settings.scheduler_enabled,
            "rss_poll_minutes": settings.rss_poll_minutes,
        })

    @app.get("/")
    def root():
        return jsonify({
            "ok": True,
            "service": settings.service_name,
            "tagline": "I am a tool tracker. Rankings are dynamic. Always check official sites.",
            "frontend": "https://sahayai.in/chitti_news_ai.html",
            "spec": "https://github.com/sahayai/sahayai/blob/main/CHITTI_NEWS_AI_MASTER_SPEC.md",
        })

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8080"))
    app.run(host="0.0.0.0", port=port)
