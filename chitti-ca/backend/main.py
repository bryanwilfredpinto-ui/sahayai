"""Chitti CA — Flask app entry point."""

import logging
import os

from flask import Flask, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine

from config import settings
from routes.ca import bp as ca_bp

# Sahay AI shared quality framework — installed across every Chitti.
# See lib/__init__.py for the architecture overview.
from lib.feedback import feedback_bp, ensure_feedback_table
from lib.hooks import HookRegistry
from lib.observability import Observability, make_metrics_blueprint
from lib.quadrails import build_default_quadrails


CHITTI_SLUG = "chitti-ca"

log = logging.getLogger("main")

# chitti-ca is stateless (no SQLAlchemy engine of its own). Spin up a tiny
# SQLite engine on /tmp to host the quality framework tables (quality_audit
# + quality_feedback). The chitti-founder service will read these.
_quality_engine = create_engine(
    "sqlite:////tmp/chitti_ca_quality.db",
    connect_args={"check_same_thread": False},
)


def _origins() -> list[str]:
    return [o.strip() for o in (settings.ALLOWED_ORIGINS or "").split(",") if o.strip()]


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": _origins()}})
    app.register_blueprint(ca_bp)

    @app.get("/")
    def root():
        return jsonify({
            "name": "chitti-ca",
            "version": "1.0",
            "deepseek_configured": bool(settings.DEEPSEEK_API_KEY),
            "endpoints": ["GET /", "GET /health", "GET /api/ca/health", "POST /api/ca/ask"],
        })

    @app.get("/health")
    def health():
        return jsonify({"ok": True})

    # Quality framework: ensure tables, then wire /api/feedback + /metrics
    # blueprints and stash the hook registry on app.config for service code.
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
        app.config["CHITTI_HOOKS"] = HookRegistry(
            chitti=CHITTI_SLUG,
            quadrails=build_default_quadrails(CHITTI_SLUG),
            observability=obs,
        )
        log.info("quality hooks installed for %s", CHITTI_SLUG)
    except Exception as e:  # noqa: BLE001
        log.warning("quality hooks install skipped: %s", e)

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8001"))
    app.run(host="0.0.0.0", port=port, debug=False)
