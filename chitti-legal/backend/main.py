"""Chitti Legal — Flask app entry point."""

import logging
import os

from flask import Flask, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine

from config import settings
from routes.legal import bp as legal_bp

# Sahay AI shared quality framework — installed across every Chitti.
# See lib/__init__.py for the architecture overview.
from lib.feedback import feedback_bp, ensure_feedback_table
from lib.hooks import HookRegistry
from lib.observability import Observability, install_request_timing, make_metrics_blueprint
from lib.quadrails import build_default_quadrails


CHITTI_SLUG = "chitti-legal"

log = logging.getLogger("main")

# chitti-legal is a stateless Flask backend (no app DB). The quality
# framework still needs a SQLAlchemy engine for its audit/feedback tables,
# so we spin up a tiny SQLite engine under /tmp.
_quality_engine = create_engine(
    "sqlite:////tmp/chitti_legal_quality.db",
    connect_args={"check_same_thread": False},
)


def _origins() -> list[str]:
    return [o.strip() for o in (settings.ALLOWED_ORIGINS or "").split(",") if o.strip()]


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": _origins()}})
    app.register_blueprint(legal_bp)

    @app.get("/")
    def root():
        return jsonify({
            "name": "chitti-legal",
            "version": "1.0",
            "deepseek_configured": bool(settings.DEEPSEEK_API_KEY),
            "endpoints": ["GET /", "GET /health", "GET /api/legal/health", "POST /api/legal/explain"],
        })

    @app.get("/health")
    def health():
        return jsonify({"ok": True})

    # Quality framework: ensure tables, register feedback + metrics blueprints,
    # build the hook registry that service code wraps DeepSeek calls with.
    try:
        ensure_feedback_table(_quality_engine, CHITTI_SLUG)
    except Exception as e:  # noqa: BLE001
        log.warning("quality framework table init skipped: %s", e)

    app.register_blueprint(feedback_bp)
    mbp = make_metrics_blueprint()
    if mbp is not None:
        app.register_blueprint(mbp)

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
        log.warning("quality hooks install skipped: %s", e)

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8002"))
    app.run(host="0.0.0.0", port=port, debug=False)
