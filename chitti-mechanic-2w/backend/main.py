"""Chitti Mechanic 2 Wheeler — Flask app entry point.

DOCTRINE: rules are the product, and the product's rules live CLIENT-SIDE in
chitti_mechanic_2w_engine.js (works offline, DeepSeek-independent). This backend
therefore exposes:
  - a real /health  (BCP self-ping, Railway healthcheck)
  - honest 501 stubs for the server-only features that are genuinely not built yet
    (live VAHAN/DigiLocker fetch, insurer premium API, OCR, vision, messaging
    delivery, server-side Vehicle Twin persistence). NEVER a fake demo response.

DATABASE_URL falls back to local SQLite until Turso is provisioned (and the
org-wide Turso read-block of 2026-06-13 is resolved).
Spec: chitti-mechanic-2w/ceos/ARCHITECTURE.md
"""

import os

from flask import Flask, jsonify, request
from flask_cors import CORS

CHITTI_SLUG = "chitti-mechanic-2w"
VERSION = "1.0.0"

# Honest persistence note: real Turso wiring lands when DATABASE_URL is set to a
# libsql://...?authToken=... form (see SAHAYAI_MASTER §2). Until then, local only.
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:////tmp/chitti_mechanic_2w.db")
DEEPSEEK_KEY = os.environ.get("DEEPSEEK_API_KEY", "")


def _origins():
    raw = os.environ.get("ALLOWED_ORIGINS", "*")
    return [o.strip() for o in raw.split(",") if o.strip()] or ["*"]


def _stub(feature: str, section: str, note: str):
    """Honest 501 — the contract is committed + visible, never a fake demo."""
    return (
        jsonify(
            {
                "ok": False,
                "status": "not_implemented",
                "feature": feature,
                "master_spec_section": section,
                "note": note,
                "doctrine": "Deterministic value runs client-side in chitti_mechanic_2w_engine.js. "
                "This server feature is an honest COMING SOON — never a faked response.",
            }
        ),
        501,
    )


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, origins=_origins(), supports_credentials=False)

    @app.get("/")
    def root():
        return jsonify(
            {
                "name": CHITTI_SLUG,
                "version": VERSION,
                "deepseek_configured": bool(DEEPSEEK_KEY),
                "db": "turso" if DATABASE_URL.startswith("libsql") else "local-sqlite-fallback",
                "doctrine": "rules are the product; engine is client-side; server features are honest stubs",
                "endpoints": [
                    "GET /", "GET /health",
                    "GET /api/2w/health",
                    "POST /api/2w/vault/ocr (501 — vision)",
                    "POST /api/2w/reminders/send (501 — messaging delivery)",
                    "POST /api/2w/insure/quote (501 — insurer partner API)",
                    "GET  /api/2w/compliance/<reg> (501 — VAHAN/DigiLocker partner)",
                    "POST /api/2w/diagnose (501 — DeepSeek narration / vision / audio)",
                    "POST /api/2w/value (501 — live used-2W valuation feed)",
                ],
            }
        )

    @app.get("/health")
    def health():
        # BCP Layer-1 self-ping target. Always cheap + truthful.
        return jsonify({"chitti": CHITTI_SLUG, "ok": True, "version": VERSION})

    @app.get("/api/2w/health")
    def api_health():
        return jsonify({"chitti": CHITTI_SLUG, "ok": True})

    # ── Honest 501 stubs (server-only features genuinely not built yet) ──
    @app.post("/api/2w/vault/ocr")
    def vault_ocr():
        return _stub("Document OCR (insurance/PUC/RC extract)", "CEOS §6 / BO1",
                     "Needs a funded vision model. Manual entry works today client-side.")

    @app.post("/api/2w/reminders/send")
    def reminders_send():
        return _stub("Reminder delivery (SMS/WhatsApp/push)", "CEOS §7 / BO2",
                     "Schedule + on-page voice reminders run client-side now; delivery needs a messaging provider.")

    @app.post("/api/2w/insure/quote")
    def insure_quote():
        return _stub("Live insurer premium quote", "CEOS §9 / BO3",
                     "CSR-ranked comparison + savings estimate run client-side; live quotes need the insurer partner API.")

    @app.get("/api/2w/compliance/<reg>")
    def compliance(reg):
        _ = reg
        return _stub("Live PUC/insurance/challan fetch (VAHAN/DigiLocker)", "CEOS §10 / BO4",
                     "No 3rd-party partner API yet; user-initiated DigiLocker link is the path. Date-based reminders work today.")

    @app.post("/api/2w/diagnose")
    def diagnose():
        _ = request.get_json(silent=True)
        return _stub("AI symptom narration / photo / sound diagnosis", "CEOS §16/§23 / BO7-BO8",
                     "Deterministic symptom triage + OBD lookup run client-side; AI narration needs DeepSeek funding + Vaani relevance-rail; vision/audio need a model.")

    @app.post("/api/2w/value")
    def value():
        _ = request.get_json(silent=True)
        return _stub("Live used-2W valuation feed", "CEOS §8/§19 / BO6",
                     "Buy/Sell scoring + fair-range run client-side; a live market feed (OBV-style) is COMING SOON.")

    @app.errorhandler(404)
    def not_found(_e):
        return jsonify({"ok": False, "error": "not_found"}), 404

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8080")))
