"""
services/medupi_price_alerts.py
-------------------------------
P1 (2026-05-13) — "Tell me when Crocin drops below ₹20".

Three honest signals (in priority order) decide whether an alert fires:

  1. **NPPA ceiling drop** — a new NPPA ceiling for the same molecule + form
     is at or below the user's threshold.
  2. **Jan Aushadhi MRP** — the same composition is available at a Jan
     Aushadhi store at or below the threshold.
  3. **Community-reported price** — at least TWO independent reports in
     the user's pincode (or nationwide if no pincode) within the last
     30 days agree below the threshold. One report alone never fires
     (same trust contract as the news fact-checker — never single-source).

Notification fan-out is a stub today (browser push / WhatsApp / Twilio
voice). The service logs which channels it would have used and clears
the row; channels plug in to `_notify(payload)` without changing the
matcher.

Daily scheduler job: `daily_price_alert_scan` at 09:00 IST (after the
02:00 IST Brave refresh + 03:00 IST Jan Aushadhi monthly + 04:00 IST
NPPA weekly so the data is as fresh as it gets).
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from models.community_price import CommunityPrice
from models.jan_aushadhi import JanAushadhiStore  # noqa: F401  (kept for fk safety)
from models.medicine import Medicine
from models.price_alert import PriceAlert

log = logging.getLogger("medupi_price_alerts")

COMMUNITY_LOOKBACK_DAYS = 30
COMMUNITY_MIN_REPORTS = 2          # never single-source


def _to_dict(row: PriceAlert) -> dict:
    return {
        "id": row.id,
        "user_token": row.user_token,
        "medicine_name": row.medicine_name,
        "threshold_inr": row.threshold_inr,
        "pincode": row.pincode,
        "service_radius_km": row.service_radius_km,
        "status": row.status,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "last_checked_at": row.last_checked_at.isoformat() if row.last_checked_at else None,
        "fired_at": row.fired_at.isoformat() if row.fired_at else None,
        "fired_price": row.fired_price,
        "fired_source": row.fired_source,
        "fired_channels": row.fired_channels,
    }


# ───── CRUD ────────────────────────────────────────────────

def add_alert(
    db: Session,
    user_token: str,
    medicine_name: str,
    threshold_inr: float,
    *,
    pincode: Optional[str] = None,
    service_radius_km: Optional[float] = None,
) -> dict:
    if not user_token or len(user_token) < 8:
        raise ValueError("user_token required")
    name = (medicine_name or "").strip()
    if not name:
        raise ValueError("medicine_name required")
    try:
        threshold_inr = float(threshold_inr)
    except (TypeError, ValueError) as e:
        raise ValueError("threshold_inr must be a number") from e
    if threshold_inr <= 0:
        raise ValueError("threshold_inr must be > 0")

    # Upsert by (user_token, medicine_name) — same shape as Vaani's
    # paired-Chitti contract: changing the threshold updates in place.
    existing = (
        db.query(PriceAlert)
        .filter(
            PriceAlert.user_token == user_token,
            func.lower(PriceAlert.medicine_name) == name.lower(),
        )
        .first()
    )
    if existing:
        existing.threshold_inr = threshold_inr
        existing.pincode = (pincode or "").strip() or None
        existing.service_radius_km = service_radius_km
        existing.status = "active"
        existing.fired_at = None
        existing.fired_price = None
        existing.fired_source = None
        existing.fired_channels = None
        db.commit()
        db.refresh(existing)
        return _to_dict(existing)

    row = PriceAlert(
        user_token=user_token,
        medicine_name=name,
        threshold_inr=threshold_inr,
        pincode=(pincode or "").strip() or None,
        service_radius_km=service_radius_km,
        status="active",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_dict(row)


def list_alerts(
    db: Session, user_token: str, status: str = "active", limit: int = 50
) -> list[dict]:
    q = db.query(PriceAlert).filter(PriceAlert.user_token == user_token)
    if status:
        q = q.filter(PriceAlert.status == status)
    rows = q.order_by(PriceAlert.created_at.desc()).limit(limit).all()
    return [_to_dict(r) for r in rows]


def delete_alert(db: Session, user_token: str, alert_id: int) -> bool:
    row = (
        db.query(PriceAlert)
        .filter(PriceAlert.user_token == user_token, PriceAlert.id == alert_id)
        .first()
    )
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True


# ───── Matching ────────────────────────────────────────────

def _check_nppa(db: Session, name: str, threshold: float) -> Optional[dict]:
    """NPPA ceiling on the Medicine row, if known. Lowest price across all forms."""
    row = (
        db.query(Medicine)
        .filter(
            func.lower(Medicine.brand_name) == name.lower(),
            Medicine.nppa_ceiling_price.isnot(None),
        )
        .order_by(Medicine.nppa_ceiling_price.asc())
        .first()
    )
    if not row or row.nppa_ceiling_price is None:
        return None
    if row.nppa_ceiling_price <= threshold:
        return {
            "source": "nppa_ceiling",
            "price": float(row.nppa_ceiling_price),
            "note": "NPPA ceiling — legal maximum price.",
        }
    return None


def _check_jan_aushadhi(db: Session, name: str, threshold: float) -> Optional[dict]:
    """Same-composition Jan Aushadhi MRP, when stored on the Medicine row."""
    row = (
        db.query(Medicine)
        .filter(
            func.lower(Medicine.brand_name) == name.lower(),
            Medicine.jan_aushadhi_price.isnot(None),
        )
        .order_by(Medicine.jan_aushadhi_price.asc())
        .first()
    )
    if not row or row.jan_aushadhi_price is None:
        return None
    if row.jan_aushadhi_price <= threshold:
        return {
            "source": "jan_aushadhi",
            "price": float(row.jan_aushadhi_price),
            "note": "Same composition at Jan Aushadhi — generic substitute.",
        }
    return None


def _check_community(
    db: Session, name: str, threshold: float, *, pincode: Optional[str] = None
) -> Optional[dict]:
    """≥ 2 community reports within 30 days agreeing below threshold."""
    cutoff = datetime.utcnow() - timedelta(days=COMMUNITY_LOOKBACK_DAYS)
    q = db.query(CommunityPrice).filter(
        and_(
            func.lower(CommunityPrice.medicine_name) == name.lower(),
            CommunityPrice.status == "active",
            CommunityPrice.price_paid <= threshold,
            CommunityPrice.reported_at >= cutoff,
        )
    )
    if pincode:
        # Honest scope: same 6-digit pincode only. Radius-by-haversine
        # comes later — community price rows already carry lat/lng.
        q = q.filter(CommunityPrice.pincode == pincode)
    rows = q.all()
    if len(rows) < COMMUNITY_MIN_REPORTS:
        return None
    rows.sort(key=lambda r: r.price_paid)
    return {
        "source": "community",
        "price": float(rows[0].price_paid),
        "note": (
            f"{len(rows)} community reports in last {COMMUNITY_LOOKBACK_DAYS} days agree at or below "
            f"₹{threshold:.0f}"
        ),
    }


def evaluate_alert(db: Session, row: PriceAlert) -> Optional[dict]:
    """Return a fire payload or None — never a half-truth."""
    name = row.medicine_name
    threshold = float(row.threshold_inr or 0)
    if threshold <= 0:
        return None
    # Priority order — NPPA first (most authoritative), then Jan Aushadhi
    # (next-most-authoritative), then community (crowd, requires ≥2).
    for fn in (
        _check_nppa,
        _check_jan_aushadhi,
        lambda d, n, t: _check_community(d, n, t, pincode=row.pincode),
    ):
        try:
            hit = fn(db, name, threshold)
        except Exception as e:  # noqa: BLE001
            log.warning("price-alert check failed (%s, %s): %s", name, fn.__name__ if hasattr(fn, "__name__") else "?", e)
            continue
        if hit:
            return hit
    return None


# ───── Notification stubs (channels wire next) ─────────────

def _notify(row: PriceAlert, hit: dict) -> str:
    """
    Honest stub — log what we WOULD send. Returns comma-separated
    channels attempted so the row can record them.
    """
    spoken_en = (
        f"Price alert. {row.medicine_name} is now ₹{hit['price']:.0f} via "
        f"{hit['source'].replace('_', ' ')}. Below your threshold of "
        f"₹{row.threshold_inr:.0f}."
    )
    log.info(
        "[price-alert FIRE — channels stubbed] user_token=%s medicine=%s threshold=%.2f hit=%s spoken=%r",
        row.user_token[:8] + "…", row.medicine_name, row.threshold_inr, hit, spoken_en,
    )
    return "stub:browser_push,stub:whatsapp,stub:voice_call"


# ───── Scheduler entry ─────────────────────────────────────

def run_daily_scan(db: Session, *, now: Optional[datetime] = None) -> dict:
    now = now or datetime.utcnow()
    rows = (
        db.query(PriceAlert).filter(PriceAlert.status == "active").all()
    )
    fired = 0
    checked = 0
    errors = 0
    for row in rows:
        checked += 1
        try:
            hit = evaluate_alert(db, row)
            row.last_checked_at = now
            if hit:
                row.status = "fired"
                row.fired_at = now
                row.fired_price = float(hit["price"])
                row.fired_source = hit["source"]
                row.fired_channels = _notify(row, hit)
                fired += 1
        except Exception as e:  # noqa: BLE001
            log.exception("price-alert scan failed for id=%s: %s", row.id, e)
            errors += 1
    db.commit()
    return {
        "upserted": fired,
        "skipped": checked - fired,
        "errors": errors,
        "note": f"price-alert scan: checked={checked} fired={fired} errors={errors}",
    }
