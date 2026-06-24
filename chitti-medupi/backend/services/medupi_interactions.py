"""
services/medupi_interactions.py — Chitti MedUPI BO3
---------------------------------------------------
Deterministic drug–drug interaction (DDI) engine — backend parity with the
client-side chitti_medupi_interactions.js. RULES ARE THE PRODUCT.

Doctrine: NEVER diagnoses, NEVER clears a combination as "safe". Surfaces
well-established, high-confidence interactions in plain language and always
routes to a doctor/pharmacist. Unknown != safe. No LLM in the critical path.

Sources: standard clinical references (BNF, Stockley's, FDA/CDSCO labelling).
Only major/contraindicated or well-documented moderate interactions encoded.
"""
from __future__ import annotations

import re

# Drug classes — a molecule may belong to several (aspirin = antiplatelet AND nsaid).
CLASSES: dict[str, list[str]] = {
    "anticoagulant": ["warfarin", "acenocoumarol", "rivaroxaban", "apixaban", "dabigatran", "edoxaban", "heparin", "enoxaparin"],
    "antiplatelet": ["aspirin", "clopidogrel", "ticagrelor", "prasugrel", "dipyridamole"],
    "nsaid": ["aspirin", "diclofenac", "ibuprofen", "naproxen", "aceclofenac", "ketorolac", "etoricoxib", "indomethacin", "mefenamic acid", "piroxicam", "nimesulide"],
    "ace_arb": ["ramipril", "enalapril", "lisinopril", "perindopril", "telmisartan", "losartan", "olmesartan", "valsartan", "irbesartan", "candesartan"],
    "potassium_sparing": ["spironolactone", "eplerenone", "amiloride", "triamterene"],
    "potassium_supplement": ["potassium chloride", "potassium citrate"],
    "statin": ["atorvastatin", "rosuvastatin", "simvastatin", "lovastatin", "pravastatin", "pitavastatin"],
    "macrolide": ["azithromycin", "clarithromycin", "erythromycin", "roxithromycin"],
    "azole_antifungal": ["fluconazole", "ketoconazole", "itraconazole", "voriconazole"],
    "ssri_snri": ["fluoxetine", "sertraline", "paroxetine", "citalopram", "escitalopram", "fluvoxamine", "venlafaxine", "duloxetine"],
    "serotonergic_opioid": ["tramadol", "tapentadol", "pethidine"],
    "triptan": ["sumatriptan", "rizatriptan", "zolmitriptan", "naratriptan"],
    "maoi": ["selegiline", "rasagiline", "linezolid", "isocarboxazid", "phenelzine"],
    "nitrate": ["isosorbide mononitrate", "isosorbide dinitrate", "nitroglycerin", "glyceryl trinitrate", "gtn"],
    "pde5": ["sildenafil", "tadalafil", "vardenafil", "avanafil"],
    "sulfonylurea": ["glimepiride", "gliclazide", "glibenclamide", "glipizide", "glyburide"],
    "insulin": ["insulin", "insulin glargine", "insulin human mixed", "insulin aspart", "insulin lispro"],
    "qt_prolonging": ["azithromycin", "clarithromycin", "erythromycin", "ciprofloxacin", "ofloxacin", "levofloxacin", "moxifloxacin", "ondansetron", "domperidone", "haloperidol", "amiodarone", "fluoxetine", "citalopram", "escitalopram", "hydroxychloroquine"],
    "cns_depressant": ["alprazolam", "clonazepam", "diazepam", "lorazepam", "tramadol", "codeine", "zolpidem", "phenobarbital", "pregabalin", "gabapentin"],
    "methotrexate": ["methotrexate"],
    "digoxin": ["digoxin"],
    "lithium": ["lithium"],
}

TYPE_HI = {
    "bleeding": "रक्तस्राव (खून बहने) का खतरा",
    "serotonin": "सेरोटोनिन सिंड्रोम का खतरा",
    "hyperkalemia": "खून में पोटैशियम बढ़ने का खतरा",
    "muscle": "मांसपेशियों को नुकसान का खतरा",
    "hypotension": "रक्तचाप अचानक गिरने का खतरा",
    "hypoglycemia": "शुगर बहुत कम होने का खतरा",
    "qt": "दिल की धड़कन की लय बिगड़ने का खतरा",
    "sedation": "ज़्यादा नींद / साँस धीमी होने का खतरा",
    "toxicity": "दवा का स्तर बढ़कर नुकसान का खतरा",
    "kidney": "किडनी व रक्तचाप पर असर का खतरा",
}

# (class_a, class_b, severity, type, mechanism_en, advice_en)
RULES: list[tuple] = [
    ("anticoagulant", "antiplatelet", "severe", "bleeding", "Both reduce the blood’s ability to clot — together they sharply raise the risk of serious internal or stomach bleeding.", "Take together only if a doctor has specifically prescribed both. Watch for black stools, unusual bruising, or bleeding gums."),
    ("anticoagulant", "nsaid", "severe", "bleeding", "A blood thinner plus a painkiller (NSAID) can cause dangerous stomach and gut bleeding.", "Avoid NSAIDs for pain while on a blood thinner — ask your doctor for a safer option such as paracetamol."),
    ("anticoagulant", "anticoagulant", "severe", "bleeding", "Two blood thinners together greatly increase bleeding risk.", "Never combine two blood thinners unless a specialist directs it."),
    ("antiplatelet", "nsaid", "moderate", "bleeding", "Both irritate the stomach lining and reduce clotting — higher bleeding and ulcer risk.", "Use the lowest dose for the shortest time; a stomach-protecting medicine may be needed. Confirm with your doctor."),
    ("ace_arb", "potassium_sparing", "severe", "hyperkalemia", "Both raise blood potassium — together they can push it to dangerous levels that affect the heart.", "Needs blood-potassium monitoring. Do not combine without doctor supervision."),
    ("ace_arb", "potassium_supplement", "severe", "hyperkalemia", "A BP medicine that retains potassium plus a potassium supplement can push potassium to harmful levels.", "Avoid potassium supplements unless your doctor checks your blood levels."),
    ("ace_arb", "nsaid", "moderate", "kidney", "NSAIDs reduce the BP medicine’s effect and can strain the kidneys.", "Avoid regular NSAID use; monitor blood pressure and kidney function. Confirm with your doctor."),
    ("statin", "macrolide", "severe", "muscle", "These antibiotics raise statin levels, increasing the risk of severe muscle damage (rhabdomyolysis).", "Your doctor may pause the statin during the antibiotic course. Report muscle pain or dark urine immediately."),
    ("statin", "azole_antifungal", "severe", "muscle", "Antifungals raise statin levels and the risk of muscle injury.", "Your doctor may adjust or pause the statin. Watch for muscle pain or weakness."),
    ("ssri_snri", "serotonergic_opioid", "severe", "serotonin", "Both raise serotonin — together they can cause serotonin syndrome (agitation, fever, fast heartbeat, tremor).", "High-risk combination. Get medical advice before combining; seek urgent care if you feel feverish, shaky, or confused."),
    ("ssri_snri", "maoi", "severe", "serotonin", "An antidepressant plus an MAOI (which includes the antibiotic linezolid) can cause life-threatening serotonin syndrome.", "This combination is contraindicated — do not take together. Consult your doctor urgently."),
    ("serotonergic_opioid", "maoi", "severe", "serotonin", "Tramadol/pethidine plus an MAOI can cause severe serotonin syndrome and seizures.", "Contraindicated. Do not combine."),
    ("ssri_snri", "triptan", "moderate", "serotonin", "A migraine triptan plus an antidepressant can raise serotonin (serotonin syndrome risk).", "Use together only under medical guidance; watch for tremor, sweating, or agitation."),
    ("ssri_snri", "ssri_snri", "moderate", "serotonin", "Two serotonin-raising antidepressants increase serotonin syndrome risk.", "Avoid combining without psychiatric supervision."),
    ("nitrate", "pde5", "severe", "hypotension", "A heart nitrate plus an erectile-dysfunction drug can cause a sudden, dangerous drop in blood pressure.", "Never take together. Tell your doctor you take nitrates; separate by the time they advise."),
    ("sulfonylurea", "insulin", "moderate", "hypoglycemia", "Two blood-sugar-lowering medicines together increase the risk of low blood sugar (hypoglycaemia).", "Monitor sugar closely and keep glucose handy. Doses are usually adjusted by the doctor."),
    ("sulfonylurea", "sulfonylurea", "moderate", "hypoglycemia", "Two sulfonylureas together raise the risk of low blood sugar.", "Not usually combined — confirm with your doctor."),
    ("qt_prolonging", "qt_prolonging", "moderate", "qt", "Both can affect the heart’s rhythm (QT prolongation); together the risk rises.", "Tell your doctor you take both — an ECG may be needed, especially with heart disease."),
    ("cns_depressant", "cns_depressant", "moderate", "sedation", "Two sedating medicines together increase drowsiness and can slow breathing.", "Avoid driving and do not add alcohol. Confirm doses with your doctor."),
    ("methotrexate", "nsaid", "severe", "toxicity", "NSAIDs raise methotrexate levels and toxicity (blood, kidney).", "Avoid NSAIDs while on methotrexate unless your doctor monitors levels."),
    ("digoxin", "macrolide", "moderate", "toxicity", "These antibiotics can raise digoxin levels (heart-rhythm risk).", "Your doctor may check the digoxin level; report nausea, visual changes, or palpitations."),
    ("lithium", "nsaid", "severe", "toxicity", "NSAIDs raise lithium levels toward toxicity (tremor, confusion).", "Avoid NSAIDs with lithium unless levels are monitored."),
    ("lithium", "ace_arb", "moderate", "toxicity", "A BP medicine can raise lithium levels.", "Lithium-level monitoring is needed; confirm with your doctor."),
]

_SEV_RANK = {"severe": 2, "moderate": 1}
_SEV_SYMBOL = {"severe": "⛔", "moderate": "⚠️"}
_SEV_LABEL_EN = {"severe": "SEVERE — avoid / doctor only", "moderate": "MODERATE — use with caution"}
_SEV_LABEL_HI = {"severe": "गंभीर — बचें / केवल डॉक्टर की सलाह पर", "moderate": "मध्यम — सावधानी से लें"}

DISCLAIMER_EN = ("This is an information aid, not a clearance. Chitti checks a curated list of "
                 "well-known interactions — \"no interaction found\" does NOT mean a combination is "
                 "safe. Always confirm with your doctor or pharmacist before taking medicines together.")
DISCLAIMER_HI = ("यह केवल जानकारी है, सुरक्षा की गारंटी नहीं। \"कोई अंतरक्रिया नहीं\" का मतलब सुरक्षित नहीं। "
                 "दवाएँ साथ लेने से पहले हमेशा डॉक्टर या फार्मासिस्ट से पुष्टि करें।")


def _normalize(m: str) -> str:
    if not m:
        return ""
    s = str(m).strip().lower()
    s = " ".join(s.split())
    s = re.sub(r"\s*\+\s*", "+", s)
    return s


def _tokens(norm: str) -> list[str]:
    parts = [p.strip() for p in norm.split("+") if p.strip()]
    if norm not in parts:
        parts.append(norm)
    return parts


def _classes_of(norm: str) -> set[str]:
    toks = _tokens(norm)
    out = set()
    for cls, members in CLASSES.items():
        if any(t in members for t in toks):
            out.add(cls)
    return out


def _rule_fires(rule, ca: set, cb: set) -> bool:
    a, b = rule[0], rule[1]
    if a == b:
        return a in ca and b in cb
    return (a in ca and b in cb) or (b in ca and a in cb)


def check(molecules: list[str]) -> dict:
    """Deterministic DDI report. Never raises on bad input."""
    norm = [_normalize(m) for m in (molecules or [])]
    norm = [m for m in norm if m]
    uniq: list[str] = []
    for m in norm:
        if m not in uniq:
            uniq.append(m)

    cls_cache = [_classes_of(m) for m in uniq]
    interactions = []
    pairs = 0
    for x in range(len(uniq)):
        for y in range(x + 1, len(uniq)):
            pairs += 1
            best = None
            for rule in RULES:
                if _rule_fires(rule, cls_cache[x], cls_cache[y]):
                    if best is None or _SEV_RANK[rule[2]] > _SEV_RANK[best[2]]:
                        best = rule
            if best:
                sev, typ, mech, adv = best[2], best[3], best[4], best[5]
                interactions.append({
                    "a": uniq[x], "b": uniq[y], "severity": sev, "type": typ,
                    "symbol": _SEV_SYMBOL[sev], "label_en": _SEV_LABEL_EN[sev], "label_hi": _SEV_LABEL_HI[sev],
                    "mechanism_en": mech, "advice_en": adv,
                    "hi_summary": (TYPE_HI.get(typ, "खतरा")) + " — डॉक्टर या फार्मासिस्ट से सलाह लें।",
                })
    interactions.sort(key=lambda i: _SEV_RANK[i["severity"]], reverse=True)
    highest = interactions[0]["severity"] if interactions else None
    return {
        "input": uniq,
        "pairs_checked": pairs,
        "interactions": interactions,
        "count": len(interactions),
        "highest": highest,
        "none_found": len(interactions) == 0 and len(uniq) >= 2,
        "disclaimer_en": DISCLAIMER_EN,
        "disclaimer_hi": DISCLAIMER_HI,
        "version": "1.0.0",
    }
