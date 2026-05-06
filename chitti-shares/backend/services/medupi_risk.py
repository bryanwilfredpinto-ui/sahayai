"""
services/medupi_risk.py
-----------------------
Risk classification for Chitti MedUPI alternatives.

HIGH risk → strong stop-and-think warning + limited alternatives.
MEDIUM   → mild disclaimer.
LOW      → friendly tone, full output.

Source-of-truth: a hand-curated mapping of molecule → risk class
(top 200 molecules covers ~90% of Indian retail). Build out from
NPPA's "Schedule" classification + ICMR's drug-substitution rules.

NEXT SESSION:
  - Expand the molecule map to 200 molecules
  - Pull schedule (H / H1 / X) from CDSCO data
  - Add explicit-warning text for each HIGH-risk class (cardiac /
    diabetes / antibiotics / psychiatric / anti-cancer / thyroid /
    anticoagulants)
"""
from __future__ import annotations

# Tag every molecule we surface in alternatives. Default = LOW if unknown.
RISK_MAP: dict[str, str] = {
    # HIGH — substitution can impact treatment without medical advice
    "metformin": "H",
    "telmisartan": "H",
    "amlodipine": "H",
    "atenolol": "H",
    "losartan": "H",
    "atorvastatin": "H",
    "rosuvastatin": "H",
    "amoxicillin": "H",
    "amoxicillin+clavulanic acid": "H",
    "azithromycin": "H",
    "ciprofloxacin": "H",
    "ofloxacin": "H",
    "warfarin": "H",
    "aspirin": "H",
    "clopidogrel": "H",
    "levothyroxine": "H",
    "thyroxine": "H",
    "insulin": "H",
    "fluoxetine": "H",
    "alprazolam": "H",
    "olanzapine": "H",
    "risperidone": "H",
    "carbamazepine": "H",
    "valproate": "H",
    # MEDIUM — common OTC + lifestyle
    "diclofenac": "M",
    "ibuprofen": "M",
    "naproxen": "M",
    "tramadol": "M",
    "ranitidine": "M",
    "omeprazole": "M",
    "pantoprazole": "M",
    "domperidone": "M",
    "ondansetron": "M",
    # LOW — vitamins, basic OTC
    "paracetamol": "L",
    "acetaminophen": "L",
    "vitamin b-complex": "L",
    "vitamin d3": "L",
    "vitamin c": "L",
    "calcium carbonate": "L",
    "iron polymaltose": "L",
}

WARNING_TEXT = {
    "H": "⚠️ HIGH-RISK CATEGORY: This medicine belongs to a category where substitution may impact treatment. Do NOT make any change without consulting your doctor. Chitti shows alternatives for information only.",
    "M": "Substitution should be confirmed with your doctor or pharmacist. Same composition is generally interchangeable, but inactive ingredients may differ.",
    "L": "Generic alternatives with the same composition are typically safe to substitute. Confirm with pharmacist if unsure.",
}


def classify(molecule: str) -> dict:
    """Return {class, warning} for the input molecule."""
    if not molecule:
        return {"class": "L", "warning": WARNING_TEXT["L"]}
    key = molecule.strip().lower()
    cls = RISK_MAP.get(key, "L")
    return {"class": cls, "warning": WARNING_TEXT[cls]}
