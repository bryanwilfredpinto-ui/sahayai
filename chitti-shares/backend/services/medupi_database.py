"""
services/medupi_database.py
---------------------------
Master drug database for Chitti MedUPI.

Sources (all public, free):
  - NPPA (National Pharmaceutical Pricing Authority) ceiling-price list
    https://www.nppaindia.nic.in/  → Drug Price Control Order data
  - Jan Aushadhi product catalog
    https://janaushadhi.gov.in/  → CSV of all generics + prices + Jan Aushadhi codes
  - CDSCO approved molecules
    https://cdsco.gov.in/

Schema (when wired into Postgres / SQLite):
  Medicine(
    id, brand_name, salt_composition, salt_components (jsonb),
    strength, dosage_form, pack_size, manufacturer,
    mrp, nppa_ceiling_price, jan_aushadhi_price, jan_aushadhi_code,
    risk_class, schedule, prescription_required
  )

NEXT SESSION:
  - Seed top 200 medicines (covers ~80% of Indian retail volume)
  - Bulk-import NPPA price list (parse PDF or scrape XML)
  - Bulk-import Jan Aushadhi catalog (CSV)
  - Build search_by_brand() with fuzzy match (rapidfuzz)
  - Build search_by_composition(molecule, strength, form)
"""
from __future__ import annotations

import logging

log = logging.getLogger("medupi_database")

# Stub seed — top 10 most-prescribed Indian retail medicines, with placeholder data.
# REPLACE with proper DB-backed seed next session.
_STUB_SEED = [
    {"brand_name":"Crocin 650","salt_composition":"Paracetamol","strength":"650mg","dosage_form":"Tablet","mrp":34.0,"jan_aushadhi_price":8.0,"risk_class":"L"},
    {"brand_name":"Dolo 650","salt_composition":"Paracetamol","strength":"650mg","dosage_form":"Tablet","mrp":30.0,"jan_aushadhi_price":8.0,"risk_class":"L"},
    {"brand_name":"Calpol 650","salt_composition":"Paracetamol","strength":"650mg","dosage_form":"Tablet","mrp":32.0,"jan_aushadhi_price":8.0,"risk_class":"L"},
    {"brand_name":"Glycomet 500","salt_composition":"Metformin","strength":"500mg","dosage_form":"Tablet","mrp":40.0,"jan_aushadhi_price":12.0,"risk_class":"H"},
    {"brand_name":"Telma 40","salt_composition":"Telmisartan","strength":"40mg","dosage_form":"Tablet","mrp":110.0,"jan_aushadhi_price":35.0,"risk_class":"H"},
    {"brand_name":"Augmentin 625","salt_composition":"Amoxicillin+Clavulanic Acid","strength":"500+125mg","dosage_form":"Tablet","mrp":260.0,"jan_aushadhi_price":85.0,"risk_class":"H"},
    {"brand_name":"Atorva 10","salt_composition":"Atorvastatin","strength":"10mg","dosage_form":"Tablet","mrp":80.0,"jan_aushadhi_price":18.0,"risk_class":"H"},
    {"brand_name":"Pantop 40","salt_composition":"Pantoprazole","strength":"40mg","dosage_form":"Tablet","mrp":140.0,"jan_aushadhi_price":35.0,"risk_class":"M"},
    {"brand_name":"Ecosprin 75","salt_composition":"Aspirin","strength":"75mg","dosage_form":"Tablet","mrp":15.0,"jan_aushadhi_price":4.0,"risk_class":"H"},
    {"brand_name":"Becosules","salt_composition":"Vitamin B-Complex","strength":"std","dosage_form":"Capsule","mrp":75.0,"jan_aushadhi_price":22.0,"risk_class":"L"},
]


def search_by_brand(query: str) -> list[dict]:
    """Stub fuzzy search. Wires to fuzzy DB lookup next session."""
    if not query:
        return []
    q = query.strip().lower()
    return [m for m in _STUB_SEED if q in m["brand_name"].lower() or q in m["salt_composition"].lower()][:10]


def search_by_composition(molecule: str, strength: str, dosage_form: str) -> list[dict]:
    """
    STRICT match: same molecule + same strength + same dosage form ONLY.
    Stub returns from seed. Wires to DB next session.
    """
    if not (molecule and strength and dosage_form):
        return []
    mol = molecule.strip().lower()
    s   = strength.strip().lower()
    f   = dosage_form.strip().lower()
    return [m for m in _STUB_SEED
            if mol in m["salt_composition"].lower()
            and s == m["strength"].lower()
            and f == m["dosage_form"].lower()]
