"""
services/medupi_community.py
----------------------------
Community-reported prices.

Users report "I bought <medicine> for ₹<price> at <pharmacy> in <city>".
Stored with their device's user_token + timestamp + optional lat/lng.
Aggregated stats expose median + IQR per (medicine, city) so single-row
outliers don't skew the picture.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from statistics import median
from typing import Optional

from sqlalchemy.orm import Session

from models.community_price import CommunityPrice
from services import medupi_price_freshness

log = logging.getLogger("medupi_community")

# Sanity bounds — reject obvious typos before they pollute the stats
MIN_PRICE = 0.5
MAX_PRICE = 100_000.0


def _entry_dict(c: CommunityPrice) -> dict:
    return {
        "id": c.id,
        "medicine_name": c.medicine_name,
        "salt_composition": c.salt_composition,
        "strength": c.strength,
        "dosage_form": c.dosage_form,
        "price_paid": c.price_paid,
        "pharmacy_name": c.pharmacy_name,
        "city": c.city,
        "state": c.state,
        "pincode": c.pincode,
        "lat": c.lat,
        "lng": c.lng,
        "status": c.status,
        "reported_at": c.reported_at.isoformat() if c.reported_at else None,
    }


def add_report(
    db: Session,
    *,
    user_token: str,
    medicine_name: str,
    price_paid: float,
    pharmacy_name: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    pincode: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    salt_composition: Optional[str] = None,
    strength: Optional[str] = None,
    dosage_form: Optional[str] = None,
) -> dict:
    if not (medicine_name or "").strip():
        raise ValueError("medicine_name is required")
    try:
        price_paid = float(price_paid)
    except (TypeError, ValueError):
        raise ValueError("price_paid must be a number")
    if not (MIN_PRICE <= price_paid <= MAX_PRICE):
        raise ValueError(f"price_paid out of range ({MIN_PRICE} ≤ x ≤ {MAX_PRICE})")

    # Naive abuse guard: same user_token submitting >20/min → reject
    one_minute_ago = datetime.utcnow() - timedelta(minutes=1)
    recent = (
        db.query(CommunityPrice)
        .filter(CommunityPrice.user_token == user_token,
                CommunityPrice.reported_at > one_minute_ago)
        .count()
    )
    if recent >= 20:
        raise ValueError("rate limit — slow down (max 20 reports/minute per device)")

    c = CommunityPrice(
        user_token=user_token,
        medicine_name=medicine_name.strip(),
        salt_composition=(salt_composition or None),
        strength=(strength or None),
        dosage_form=(dosage_form or None),
        price_paid=price_paid,
        pharmacy_name=(pharmacy_name or None),
        city=(city.strip() if city else None),
        state=(state or None),
        pincode=(pincode or None),
        lat=lat,
        lng=lng,
        status="active",
        reported_at=datetime.utcnow(),
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return _entry_dict(c)


def list_reports(
    db: Session,
    *,
    medicine_name: Optional[str] = None,
    city: Optional[str] = None,
    limit: int = 50,
) -> list[dict]:
    q = db.query(CommunityPrice).filter(CommunityPrice.status == "active")
    if medicine_name:
        q = q.filter(CommunityPrice.medicine_name.ilike(f"%{medicine_name}%"))
    if city:
        q = q.filter(CommunityPrice.city.ilike(f"%{city}%"))
    rows = q.order_by(CommunityPrice.reported_at.desc()).limit(max(1, min(limit, 200))).all()
    out = [_entry_dict(r) for r in rows]
    for entry in out:
        medupi_price_freshness.annotate_community_entry(entry)
    return out


def stats_for(db: Session, medicine_name: str, *, city: Optional[str] = None) -> dict:
    """
    Returns:
      { count, median, min, max, p25, p75, latest_at, by_city: {city: count} }
    """
    q = (
        db.query(CommunityPrice)
        .filter(CommunityPrice.status == "active",
                CommunityPrice.medicine_name.ilike(f"%{medicine_name}%"))
    )
    if city:
        q = q.filter(CommunityPrice.city.ilike(f"%{city}%"))
    rows = q.all()
    if not rows:
        return {"count": 0}

    prices = sorted([r.price_paid for r in rows if r.price_paid])
    n = len(prices)
    p25 = prices[max(0, n // 4)] if prices else None
    p75 = prices[min(n - 1, (3 * n) // 4)] if prices else None
    latest = max((r.reported_at for r in rows if r.reported_at), default=None)
    by_city: dict[str, int] = {}
    for r in rows:
        if r.city:
            by_city[r.city] = by_city.get(r.city, 0) + 1
    return {
        "count": n,
        "median": median(prices) if prices else None,
        "min": min(prices) if prices else None,
        "max": max(prices) if prices else None,
        "p25": p25,
        "p75": p75,
        "latest_at": latest.isoformat() if latest else None,
        "by_city": dict(sorted(by_city.items(), key=lambda kv: kv[1], reverse=True)[:10]),
    }
