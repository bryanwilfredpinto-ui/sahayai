"""
services/medupi_database.py
---------------------------
Master drug DB access + seeding.

On first startup we load data/medicines_seed.json into the `medicines`
table. Top ~50 highest-volume Indian retail medicines covers ~80% of
common-condition prescriptions today. Replace this seed with the full
NPPA + Jan Aushadhi public catalog when the loader scripts ship.

Search functions:
- search_by_brand(query)              → fuzzy brand-name lookup (typo-tolerant)
- search_by_composition(...)          → STRICT same-molecule + strength + form
- get_by_id(id)                       → single row
"""
from __future__ import annotations

import json
import logging
from pathlib import Path

from rapidfuzz import fuzz, process
from sqlalchemy.orm import Session

from database import SessionLocal
from models.medicine import Medicine

log = logging.getLogger("medupi_database")

SEED_PATH = Path(__file__).resolve().parent.parent / "data" / "medicines_seed.json"


def seed_if_empty() -> int:
    """Load medicines_seed.json into the DB if the table is empty. Idempotent."""
    db = SessionLocal()
    try:
        if db.query(Medicine).count() > 0:
            return 0
        if not SEED_PATH.exists():
            log.warning("medicines_seed.json not found at %s — skipping seed", SEED_PATH)
            return 0
        with SEED_PATH.open("r", encoding="utf-8") as f:
            rows = json.load(f)
        count = 0
        for r in rows:
            m = Medicine(
                brand_name=r["brand_name"],
                salt_composition=r["salt_composition"],
                salt_components=json.dumps(r.get("salt_components") or []),
                strength=r["strength"],
                dosage_form=r["dosage_form"],
                pack_size=r.get("pack_size"),
                manufacturer=r.get("manufacturer"),
                mrp=r.get("mrp"),
                nppa_ceiling_price=r.get("nppa_ceiling_price"),
                jan_aushadhi_price=r.get("jan_aushadhi_price"),
                jan_aushadhi_code=r.get("jan_aushadhi_code"),
                risk_class=r.get("risk_class") or "L",
                schedule=r.get("schedule"),
                prescription_required=int(r.get("prescription_required") or 0),
                therapeutic_class=r.get("therapeutic_class"),
                purpose_en=r.get("purpose_en"),
                purpose_hi=r.get("purpose_hi"),
            )
            db.add(m)
            count += 1
        db.commit()
        log.info("Seeded %d medicines from %s", count, SEED_PATH.name)
        return count
    finally:
        db.close()


def _row_to_dict(m: Medicine) -> dict:
    return {
        "id": m.id,
        "brand_name": m.brand_name,
        "salt_composition": m.salt_composition,
        "strength": m.strength,
        "dosage_form": m.dosage_form,
        "pack_size": m.pack_size,
        "manufacturer": m.manufacturer,
        "mrp": m.mrp,
        "nppa_ceiling_price": m.nppa_ceiling_price,
        "jan_aushadhi_price": m.jan_aushadhi_price,
        "jan_aushadhi_code": m.jan_aushadhi_code,
        "risk_class": m.risk_class,
        "schedule": m.schedule,
        "prescription_required": bool(m.prescription_required),
        "therapeutic_class": m.therapeutic_class,
        "purpose_en": m.purpose_en,
        "purpose_hi": m.purpose_hi,
    }


def search_by_brand(db: Session, query: str, limit: int = 10) -> list[dict]:
    """
    Typo-tolerant brand-name search. Returns top `limit` matches sorted by
    fuzzy score. Falls back to substring on the salt for queries that
    look like a molecule rather than a brand ("metformin").
    """
    q = (query or "").strip()
    if not q:
        return []
    rows = db.query(Medicine).all()
    if not rows:
        return []
    choices = {r.id: f"{r.brand_name} {r.salt_composition}" for r in rows}
    matches = process.extract(q, choices, scorer=fuzz.WRatio, limit=limit)
    matched_ids = [m_id for (_str, _score, m_id) in matches if _score >= 55]
    by_id = {r.id: r for r in rows}
    return [_row_to_dict(by_id[i]) for i in matched_ids if i in by_id]


def search_by_composition(
    db: Session, molecule: str, strength: str = "", dosage_form: str = ""
) -> list[dict]:
    """
    STRICT match: same molecule AND same strength AND same dosage form.
    Case-insensitive. If strength or dosage_form is omitted, falls back to
    a molecule-only filter (used by the Compare-tab "show me everything"
    flow). Sorted by jan_aushadhi_price ASC, then mrp ASC.
    """
    if not molecule:
        return []
    mol = molecule.strip().lower()
    q = db.query(Medicine).filter(
        Medicine.salt_composition.ilike(f"%{mol}%")
    )
    if strength:
        q = q.filter(Medicine.strength.ilike(strength.strip()))
    if dosage_form:
        q = q.filter(Medicine.dosage_form.ilike(dosage_form.strip()))
    rows = q.all()
    rows.sort(
        key=lambda m: (
            m.jan_aushadhi_price if m.jan_aushadhi_price is not None else (m.mrp or 99999),
            m.mrp or 99999,
        )
    )
    return [_row_to_dict(m) for m in rows]


def get_by_id(db: Session, mid: int) -> dict | None:
    m = db.query(Medicine).filter(Medicine.id == mid).first()
    return _row_to_dict(m) if m else None
