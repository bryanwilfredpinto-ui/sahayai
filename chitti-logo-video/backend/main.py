"""Chitti Logo & Video — Flask app entry point."""

import os

from flask import Flask, jsonify
from flask_cors import CORS

from config import settings
from routes.lv import bp as lv_bp


def _origins() -> list[str]:
    return [o.strip() for o in (settings.ALLOWED_ORIGINS or "").split(",") if o.strip()]


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": _origins()}})
    app.register_blueprint(lv_bp)

    @app.get("/")
    def root():
        return jsonify({
            "name": "chitti-logo-video",
            "version": "1.0",
            "logo_supplier": "replicate" if settings.REPLICATE_API_TOKEN else "mock",
            "video_supplier": settings.VIDEO_PROVIDER or "mock",
            "endpoints": [
                "GET /", "GET /health", "GET /api/lv/health",
                "POST /api/lv/logo/generate",
                "POST /api/lv/video/enqueue",
                "GET /api/lv/video/status/<job_id>",
            ],
        })

    @app.get("/health")
    def health():
        return jsonify({"ok": True})

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8003"))
    app.run(host="0.0.0.0", port=port, debug=False)
