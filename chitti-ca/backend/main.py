"""Chitti CA — Flask app entry point."""

import os

from flask import Flask, jsonify
from flask_cors import CORS

from config import settings
from routes.ca import bp as ca_bp


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

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8001"))
    app.run(host="0.0.0.0", port=port, debug=False)
