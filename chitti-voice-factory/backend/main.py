"""Chitti Voice Factory — Flask app entry point.

See CHITTI_VOICE_FACTORY_MASTER_SPEC.md for the full spec.
"""

import os

from flask import Flask, jsonify
from flask_cors import CORS

import ledger
from routes.voice import bp as voice_bp
from routes.admin import bp as admin_bp


def _allowed_origins() -> list[str]:
    raw = os.environ.get(
        "ALLOWED_ORIGINS",
        "https://sahayai.in,https://www.sahayai.in,http://localhost:5500,http://127.0.0.1:5500",
    )
    return [o.strip() for o in raw.split(",") if o.strip()]


def create_app() -> Flask:
    app = Flask(__name__)
    app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret-key")
    CORS(app, resources={r"/*": {"origins": _allowed_origins()}})
    ledger.init_db()
    app.register_blueprint(voice_bp)
    app.register_blueprint(admin_bp)

    @app.get("/")
    def root():
        return jsonify({
            "name": "chitti-voice-factory",
            "version": "2.0",
            "spec": "CHITTI_VOICE_FACTORY_MASTER_SPEC.md",
            "ledger_endpoint": "/api/voice/ledger",
            "status_endpoint": "/api/voice/status",
            "hall_of_fame": "/api/voice/hall-of-fame",
            "submit_voice": "/api/voice/submit",
            "admin_dashboard": "/admin/dashboard.html",
            "use_mock_bhashini": os.environ.get("VOICE_FACTORY_USE_MOCK_BHASHINI", "1") == "1",
        })

    @app.get("/health")
    def health():
        return jsonify({"ok": True})

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    app.run(host="0.0.0.0", port=port, debug=False)
