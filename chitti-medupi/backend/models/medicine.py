"""
models/medicine.py
------------------
Master drug DB row. One Indian retail medicine = one row.

Source-of-truth fields are seeded from data/medicines_seed.json (combined
NPPA ceiling-price list + Jan Aushadhi public catalog + CDSCO molecule
schedules). Top ~50 highest-volume Indian retail medicines covers ~80%
of common-condition prescriptions today.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text, Index

from database import Base


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)

    brand_name = Column(String(140), index=True, nullable=False)
    salt_composition = Column(String(240), index=True, nullable=False)
    salt_components = Column(Text, nullable=True)        # JSON list dumped as text
    strength = Column(String(60), index=True, nullable=False)
    dosage_form = Column(String(40), index=True, nullable=False)  # tablet/capsule/syrup/injection/cream/...
    pack_size = Column(String(60), nullable=True)
    manufacturer = Column(String(160), nullable=True)

    mrp = Column(Float, nullable=True)
    nppa_ceiling_price = Column(Float, nullable=True)
    jan_aushadhi_price = Column(Float, nullable=True)
    jan_aushadhi_code = Column(String(40), nullable=True)

    # H = HIGH risk · M = MEDIUM · L = LOW (see services/medupi_risk.py)
    risk_class = Column(String(2), index=True, nullable=False, default="L")
    schedule = Column(String(8), nullable=True)          # H / H1 / X / OTC
    prescription_required = Column(Integer, nullable=False, default=0)  # 0/1

    # Therapeutic class (e.g. "antibiotic", "antihypertensive") — for filtering
    therapeutic_class = Column(String(80), nullable=True, index=True)

    # Plain-English purpose ("Used for fever and pain relief.") — never advice.
    purpose_en = Column(Text, nullable=True)
    purpose_hi = Column(Text, nullable=True)

    # Provenance — who set the most recent price + when. Drives the
    # "Last updated X days ago" + "Verify with pharmacy" UI badges.
    price_source = Column(String(40), nullable=True)   # jan_aushadhi / nppa / kaggle / brave / community / manual
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


# Composite index for the strict-match lookup hot path
Index(
    "ix_medicines_strict_match",
    Medicine.salt_composition,
    Medicine.strength,
    Medicine.dosage_form,
)
