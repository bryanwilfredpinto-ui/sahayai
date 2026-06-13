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

import engine

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
                    "GET /", "GET /health", "GET /api/2w/health",
                    "POST /api/2w/insure  (LIVE deterministic — IDV-based premium compare)",
                    "POST /api/2w/tyre    (LIVE deterministic — recommendation by usage)",
                    "POST /api/2w/service (LIVE deterministic — schedule + oil grade)",
                    "POST /api/2w/diagnose(LIVE deterministic — OBD lookup + scam check)",
                    "POST /api/2w/value   (LIVE deterministic — buy-score inspection)",
                    "POST /api/2w/scam    (LIVE deterministic — fair-price check)",
                    "POST /api/2w/fuel    (LIVE deterministic — petrol→EV ROI)",
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

    def _body():
        return request.get_json(silent=True) or {}

    # ── LIVE deterministic endpoints (rules are the product; mirror the JS engine) ──
    @app.post("/api/2w/insure")
    def insure():
        d = _body()
        return jsonify(engine.insure_compare(idv=d.get("idv", 0), vehicle_age_years=d.get("vehicleAgeYears", 0),
                                             vclass=d.get("vclass", "scooter"), current_premium=d.get("currentPremium", 0)))

    @app.post("/api/2w/tyre")
    def tyre():
        return jsonify(engine.tyre_reco(usage=_body().get("usage", "allround")))

    @app.post("/api/2w/service")
    def service():
        d = _body()
        return jsonify(engine.service_schedule(vclass=d.get("vclass", "scooter"), odo_km=d.get("odoKm", 0), last_service_km=d.get("lastServiceKm", 0)))

    @app.post("/api/2w/diagnose")
    def diagnose():
        d = _body()
        if d.get("code"):
            return jsonify(engine.obd_lookup(d["code"]))
        return jsonify(engine.scam_check(item=d.get("item", "repair"), quote=d.get("quote", 0),
                                         expected_lo=d.get("expectedLo", 0), expected_hi=d.get("expectedHi", 0)))

    @app.post("/api/2w/value")
    def value():
        d = _body()
        return jsonify(engine.inspect(asking=d.get("asking", 0), expected_market=d.get("expectedMarket", 0),
                                      owners=d.get("owners", 1), service_history=d.get("serviceHistory", False),
                                      rc_clear=d.get("rcClear", False), insurance_valid=d.get("insuranceValid", False),
                                      accident_signs=d.get("accidentSigns", False), flood_signs=d.get("floodSigns", False),
                                      odo_suspect=d.get("odoSuspect", False)))

    @app.post("/api/2w/scam")
    def scam():
        d = _body()
        return jsonify(engine.scam_check(item=d.get("item", "repair"), quote=d.get("quote", 0),
                                         expected_lo=d.get("expectedLo", 0), expected_hi=d.get("expectedHi", 0)))

    @app.post("/api/2w/fuel")
    def fuel():
        d = _body()
        return jsonify(engine.fuel_roi(monthly_km=d.get("monthlyKm", 1000), mileage_kmpl=d.get("mileageKmpl", 45),
                                       petrol_price=d.get("petrolPrice", 105), ev_cost_month=d.get("evCostPerMonth", 1200),
                                       ev_net_price=d.get("evNetPrice", 95000)))

    # NOTE: OCR / messaging delivery / live VAHAN fetch are genuinely external integrations
    # (vision model, SMS gateway, DigiLocker partner). They are NOT product-feature gaps —
    # the equivalent value runs deterministically client-side (manual entry, .ics calendar,
    # date-based reminders). _stub() retained as the honest contract for those when wired.
    _ = _stub

    @app.errorhandler(404)
    def not_found(_e):
        return jsonify({"ok": False, "error": "not_found"}), 404

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8080")))
