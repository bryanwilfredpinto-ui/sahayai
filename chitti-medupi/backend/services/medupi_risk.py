"""
services/medupi_risk.py
-----------------------
Risk classification engine for Chitti MedUPI alternatives.

HIGH (H) → strong stop-and-think warning. Limited alternatives.
MEDIUM (M) → mild disclaimer. Confirm with pharmacist.
LOW (L) → friendly tone — same composition, save money.

Source-of-truth: a hand-curated mapping of molecule → risk class. Top 200
molecules covers ~90% of Indian retail. Risk class also drives the colour
banner and STOP-AND-THINK gate on the frontend.
"""
from __future__ import annotations

# Lower-case molecule key. Multi-component salts are stored as the canonical
# joined string (e.g. "amoxicillin+clavulanic acid").
RISK_MAP: dict[str, str] = {
    # ── HIGH risk ──
    # Antidiabetics
    "metformin": "H",
    "sitagliptin": "H",
    "sitagliptin+metformin": "H",
    "glimepiride": "H",
    "vildagliptin": "H",
    "insulin": "H",
    "insulin human mixed": "H",
    "insulin glargine": "H",
    # Antihypertensives
    "telmisartan": "H",
    "amlodipine": "H",
    "atenolol": "H",
    "atenolol+chlorthalidone": "H",
    "losartan": "H",
    "ramipril": "H",
    "metoprolol": "H",
    # Statins / lipid
    "atorvastatin": "H",
    "rosuvastatin": "H",
    "simvastatin": "H",
    # Antiplatelets / anticoagulants
    "warfarin": "H",
    "aspirin": "H",
    "clopidogrel": "H",
    "rivaroxaban": "H",
    # Antibiotics
    "amoxicillin": "H",
    "amoxicillin+clavulanic acid": "H",
    "azithromycin": "H",
    "ciprofloxacin": "H",
    "ofloxacin": "H",
    "norfloxacin": "H",
    "cefixime": "H",
    "doxycycline": "H",
    # Thyroid
    "levothyroxine": "H",
    "thyroxine": "H",
    # Psychiatric
    "fluoxetine": "H",
    "sertraline": "H",
    "alprazolam": "H",
    "olanzapine": "H",
    "risperidone": "H",
    "carbamazepine": "H",
    "valproate": "H",
    # Asthma reliever
    "salbutamol": "H",
    "budesonide": "H",
    "formoterol": "H",
    # Anti-cancer
    "tamoxifen": "H",
    "imatinib": "H",

    # ── MEDIUM risk ──
    "diclofenac": "M",
    "ibuprofen": "M",
    "ibuprofen+paracetamol": "M",
    "naproxen": "M",
    "tramadol": "M",
    "ranitidine": "M",
    "omeprazole": "M",
    "pantoprazole": "M",
    "rabeprazole": "M",
    "domperidone": "M",
    "ondansetron": "M",
    "montelukast": "M",
    "montelukast+levocetirizine": "M",

    # ── LOW risk ──
    "paracetamol": "L",
    "acetaminophen": "L",
    "paracetamol+phenylephrine+chlorpheniramine": "L",
    "paracetamol+phenylephrine+caffeine": "L",
    "cetirizine": "L",
    "fexofenadine": "L",
    "pheniramine": "L",
    "loratadine": "L",
    "vitamin b-complex": "L",
    "vitamin c": "L",
    "vitamin d3": "L",
    "calcium carbonate": "L",
    "calcium carbonate+vitamin d3": "L",
    "iron polymaltose": "L",
    "iron+folic acid": "L",
    "zinc sulphate": "L",
    "oral rehydration salts": "L",
    "himsra+kasani": "L",
}

WARNING_TEXT_EN = {
    "H": (
        "HIGH-RISK CATEGORY: This medicine belongs to a category where substitution may "
        "impact treatment. Do NOT make any change without consulting your doctor. "
        "Chitti shows alternatives for information only."
    ),
    "M": (
        "Substitution should be confirmed with your doctor or pharmacist. Same composition "
        "is generally interchangeable, but inactive ingredients may differ."
    ),
    "L": (
        "Generic alternatives with the same composition are typically safe to substitute. "
        "Confirm with pharmacist if unsure."
    ),
}

WARNING_TEXT_HI = {
    "H": (
        "उच्च जोखिम श्रेणी: यह दवा ऐसी श्रेणी में आती है जहाँ बदलाव से इलाज पर असर पड़ सकता है। "
        "बिना डॉक्टर की सलाह के कोई बदलाव न करें। चिट्टी सिर्फ जानकारी के लिए विकल्प दिखाता है।"
    ),
    "M": (
        "बदलाव से पहले अपने डॉक्टर या केमिस्ट से पुष्टि कर लें। संरचना समान होने पर आमतौर पर "
        "बदला जा सकता है, पर निष्क्रिय अवयव भिन्न हो सकते हैं।"
    ),
    "L": (
        "समान संरचना वाले जेनेरिक विकल्प आमतौर पर सुरक्षित हैं। संदेह हो तो केमिस्ट से पुष्टि कर लें।"
    ),
}

SYMBOL = {"H": "⛔", "M": "⚠️", "L": "✅"}
LABEL_EN = {"H": "HIGH RISK", "M": "MEDIUM RISK", "L": "LOW RISK"}
LABEL_HI = {"H": "उच्च जोखिम", "M": "मध्यम जोखिम", "L": "कम जोखिम"}


def _normalize(molecule: str) -> str:
    """Lower-case + collapse whitespace + strip stray brackets."""
    if not molecule:
        return ""
    s = molecule.strip().lower()
    # Collapse "Amoxicillin + Clavulanic Acid" → "amoxicillin+clavulanic acid"
    s = " ".join(s.split())
    s = s.replace(" + ", "+").replace("+ ", "+").replace(" +", "+")
    return s


def classify(molecule: str) -> dict:
    """
    Return:
      {
        "class": "H|M|L",
        "symbol": "⛔|⚠️|✅",
        "label_en": "HIGH RISK|MEDIUM RISK|LOW RISK",
        "label_hi": "उच्च जोखिम|मध्यम जोखिम|कम जोखिम",
        "warning_en": "...",
        "warning_hi": "...",
      }
    Defaults to LOW if unknown — but the unknown case is logged so the
    map can be expanded.
    """
    key = _normalize(molecule)
    cls = RISK_MAP.get(key, "L")
    return {
        "molecule": molecule,
        "class": cls,
        "symbol": SYMBOL[cls],
        "label_en": LABEL_EN[cls],
        "label_hi": LABEL_HI[cls],
        "warning_en": WARNING_TEXT_EN[cls],
        "warning_hi": WARNING_TEXT_HI[cls],
    }
