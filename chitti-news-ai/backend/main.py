"""
main.py — Flask entrypoint for chitti-news-ai-api.

Boot order:
  1. ensure_schema() — CREATE TABLE IF NOT EXISTS (articles, sources)
  2. upsert_sources() — sync sources.json → DB on every boot. Idempotent.
     Adds new sources, updates url/tab/is_bharat/active for existing ones,
     never deletes (so historical articles keep their source_id).
  3. scheduler.start() — APScheduler RSS poll every RSS_POLL_MINUTES (default 120 = 2 h)

Sire-locked architecture 2026-05-23: discard all prior trust/discovery/scoring/
daily-tip machinery — chitti-news-ai is "real AI news + one-tap Chitti explains."
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
from routes.news_ai import daily_tip_bp
from routes.feed import bp as feed_bp                              # v0.2 aggregator
from services import news_scheduler


CHITTI_SLUG = "chitti-news-ai"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("main")


def _upsert_sources() -> dict:
    """Sync data/sources.json into the Source table on every boot.
    Adds new rows + updates url/tab/is_bharat/active/reason on existing rows
    (matched by name). Never deletes — historical articles keep their FK."""
    seed_path = Path(__file__).parent / "data" / "sources.json"
    if not seed_path.exists():
        log.warning("sources seed file missing at %s", seed_path)
        return {"inserted": 0, "updated": 0}
    rows = json.loads(seed_path.read_text(encoding="utf-8"))
    inserted = updated = 0
    with SessionLocal() as s:
        for r in rows:
            existing = s.query(Source).filter(Source.name == r["name"]).first()
            if existing:
                existing.url = r["url"]
                existing.kind = r.get("kind", existing.kind)
                existing.category = r.get("category", existing.category)
                existing.language = r.get("language", existing.language)
                existing.tab = r.get("tab", existing.tab)
                existing.is_bharat = bool(r.get("is_bharat", existing.is_bharat))
                existing.active = bool(r.get("active_seed", True))
                existing.trust_score = r.get("trust_score_seed", existing.trust_score)
                existing.trust_band = r.get("trust_band_seed", existing.trust_band)
                existing.reason_for_inclusion = r.get("reason_for_inclusion", existing.reason_for_inclusion)
                updated += 1
            else:
                s.add(Source(
                    name=r["name"],
                    url=r["url"],
                    kind=r.get("kind", "rss"),
                    category=r.get("category", "press"),
                    language=r.get("language", "en"),
                    tab=r.get("tab", "ai-news"),
                    is_bharat=bool(r.get("is_bharat", False)),
                    active=bool(r.get("active_seed", True)),
                    trust_score=r.get("trust_score_seed", 0.0),
                    trust_band=r.get("trust_band_seed", "pending"),
                    reason_for_inclusion=r.get("reason_for_inclusion"),
                ))
                inserted += 1
        s.commit()
    return {"inserted": inserted, "updated": updated}


def _bootstrap() -> None:
    try:
        ensure_schema()
    except Exception as e:  # noqa: BLE001
        log.warning("ensure_schema skipped: %s", e)
    try:
        stats = _upsert_sources()
        log.info("sources upserted: %s", stats)
        # Force-sync so source rows reach Turso immediately. Without this,
        # a Railway redeploy within 60 s wipes the local SQLite before the
        # bg sync ticks — and the next boot has neither sources nor articles.
        try:
            from database import sync_now
            sync_now()
            log.info("forced Turso sync after source upsert")
        except Exception as se:  # noqa: BLE001
            log.warning("forced sync after source upsert failed: %s", se)
    except Exception as e:  # noqa: BLE001
        log.warning("source upsert skipped: %s", e)
    try:
        news_scheduler.start()
    except Exception as e:  # noqa: BLE001
        log.warning("scheduler failed to start: %s", e)
    # Kick off an immediate RSS fetch on boot — don't wait the full interval
    # (default 360 min). This means every redeploy gets fresh articles within
    # ~30 s of boot, instead of being empty for hours.
    try:
        news_scheduler.trigger_now("rss_poll")
        log.info("kicked off immediate rss_poll on boot")
    except Exception as e:  # noqa: BLE001
        log.warning("boot-time rss_poll kick failed: %s", e)

    # v0.3 aggregator: ingest courses + the 5 streams + classify everything
    # on boot. Runs in a background thread so /health binds well before
    # ingest finishes. Failure of any of the four steps is non-fatal — the
    # rules-only classifier still serves whatever data did land.
    import threading

    def _boot_ingest_and_classify():
        try:
            from services.courses_ingestor import ingest_all as _ingest_courses
            r = _ingest_courses()
            log.info("[boot] courses ingest: %s landed", r.get("total_landed"))
        except Exception as e:  # noqa: BLE001
            log.warning("[boot] courses ingest skipped: %s", e)
        try:
            from services.streams_ingestor import ingest_all as _ingest_streams
            r = _ingest_streams()
            log.info("[boot] streams ingest: %s landed", r.get("total_landed"))
        except Exception as e:  # noqa: BLE001
            log.warning("[boot] streams ingest skipped: %s", e)
        try:
            from services.profession_classifier import (
                classify_unlabeled_courses, classify_unlabeled_articles,
                classify_unlabeled_stream_items,
            )
            c = classify_unlabeled_courses(limit=2000)
            log.info("[boot] courses classify: %s", c)
            a = classify_unlabeled_articles(limit=2000)
            log.info("[boot] articles classify: %s", a)
            s = classify_unlabeled_stream_items(limit=2000)
            log.info("[boot] streams classify: %s", s)
        except Exception as e:  # noqa: BLE001
            log.warning("[boot] classification skipped: %s", e)

    threading.Thread(target=_boot_ingest_and_classify,
                     name="news-ai-boot-ingest", daemon=True).start()
    log.info("[boot] v0.3 aggregator ingest+classify started in background")


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(
        app,
        origins=list(settings.allowed_origins) or "*",
        supports_credentials=False,
        allow_headers=[
            "Content-Type", "Authorization", "Accept",
            "X-User-Token", "X-Admin-Secret",
            "X-Requested-With", "X-Chitti-Request-Id",
        ],
        methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        expose_headers=[
            "X-Chitti-Request-Id", "X-Chitti-Response-Time-Ms",
        ],
    )

    _bootstrap()

    app.register_blueprint(news_ai_bp)
    app.register_blueprint(daily_tip_bp)
    app.register_blueprint(feed_bp)                                    # v0.2 aggregator

    # Sahay AI shared quality framework — installed across every Chitti.
    try:
        from database import engine as _engine
        from lib.observability import Observability, install_request_timing
        from lib.hooks import HookRegistry
        from lib.quadrails import build_default_quadrails
        obs = Observability(chitti=CHITTI_SLUG, engine=_engine)
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

    @app.get("/health")
    def health():
        with SessionLocal() as s:
            try:
                sources_active = s.query(Source).filter(Source.active == True).count()  # noqa: E712
            except Exception:
                sources_active = 0
        return jsonify({
            "ok": True,
            "service": "chitti-news-ai-api",
            "chitti_slug": CHITTI_SLUG,
            "now_utc": datetime.utcnow().isoformat() + "Z",
            "sources_active": sources_active,
            "scheduler_enabled": settings.scheduler_enabled,
            "rss_poll_minutes": settings.rss_poll_minutes,
        })

    @app.get("/")
    def root():
        return jsonify({
            "ok": True,
            "service": "chitti-news-ai-api",
            "tagline": "Real AI news. Chitti explains in your language. No spice. Sire-locked 2026-05-23.",
            "frontend": "https://sahayai.in/chitti_news_ai.html",
        })

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

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8011"))
    app.run(host="0.0.0.0", port=port)
