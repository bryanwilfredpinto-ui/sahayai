"""
services/medupi_jan_aushadhi.py
-------------------------------
Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) store locator.
11,000+ stores nationwide. Public CSV at janaushadhi.gov.in.

Seed in data/jan_aushadhi_seed.json (representative sample). Replace
with full CSV import when the bulk loader ships.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from math import asin, cos, radians, sin, sqrt
from pathlib import Path

from sqlalchemy.orm import Session

from database import SessionLocal
from models.jan_aushadhi import JanAushadhiStore

log = logging.getLogger("medupi_jan_aushadhi")

SEED_PATH = Path(__file__).resolve().parent.parent / "data" / "jan_aushadhi_seed.json"


def seed_if_empty() -> int:
    """Load jan_aushadhi_seed.json into the DB if the table is empty."""
    db = SessionLocal()
    try:
        if db.query(JanAushadhiStore).count() > 0:
            return 0
        if not SEED_PATH.exists():
            log.warning("jan_aushadhi_seed.json not found at %s — skipping seed", SEED_PATH)
            return 0
        with SEED_PATH.open("r", encoding="utf-8") as f:
            rows = json.load(f)
        count = 0
        for r in rows:
            s = JanAushadhiStore(
                store_code=r["store_code"],
                name=r["name"],
                address=r.get("address"),
                district=r.get("district"),
                state=r.get("state"),
                pincode=r.get("pincode"),
                phone=r.get("phone"),
                hours=r.get("hours"),
                lat=float(r["lat"]),
                lng=float(r["lng"]),
                last_verified=datetime.utcnow(),
            )
            db.add(s)
            count += 1
        db.commit()
        log.info("Seeded %d Jan Aushadhi stores", count)
        return count
    finally:
        db.close()


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in km."""
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return 2 * R * asin(sqrt(a))


def _row_to_dict(s: JanAushadhiStore, dist_km: float | None = None) -> dict:
    out = {
        "store_code": s.store_code,
        "name": s.name,
        "address": s.address,
        "district": s.district,
        "state": s.state,
        "pincode": s.pincode,
        "phone": s.phone,
        "hours": s.hours,
        "lat": s.lat,
        "lng": s.lng,
    }
    if dist_km is not None:
        out["distance_km"] = round(dist_km, 2)
    return out


def find_nearby(
    db: Session,
    lat: float,
    lng: float,
    radius_km: float = 5.0,
    limit: int = 10,
) -> list[dict]:
    """Stores within `radius_km` of the lat/lng, sorted by distance ASC."""
    if lat is None or lng is None:
        return []
    rows = db.query(JanAushadhiStore).all()
    out = []
    for s in rows:
        d = _haversine_km(lat, lng, s.lat, s.lng)
        if d <= radius_km:
            out.append(_row_to_dict(s, d))
    out.sort(key=lambda x: x["distance_km"])
    return out[:limit]


def find_in_state(db: Session, state: str, limit: int = 50) -> list[dict]:
    """Stores in a given state — fallback when geolocation is unavailable."""
    if not state:
        return []
    rows = (
        db.query(JanAushadhiStore)
        .filter(JanAushadhiStore.state.ilike(state.strip()))
        .limit(limit)
        .all()
    )
    return [_row_to_dict(s) for s in rows]
