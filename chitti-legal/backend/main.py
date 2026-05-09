"""Chitti Legal — Flask app entry point."""

import os

from flask import Flask, jsonify
from flask_cors import CORS

from config import settings
from routes.legal import bp as legal_bp


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

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8002"))
    app.run(host="0.0.0.0", port=port, debug=False)
