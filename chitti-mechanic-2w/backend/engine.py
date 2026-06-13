"""Chitti Mechanic 2 Wheeler — deterministic engine (Python port of the core rules).

Mirror of chitti_mechanic_2w_engine.js for the server-side API so the architecture
endpoints (/insure, /tyre, /service, /diagnose, /value, /scam) return REAL deterministic
results — not stubs. Rules are the product; every result carries confidence/risks/sources.
Kept in sync with the JS rule table version.
"""

VERSION = "1.0.0"
UPDATED = "2026-06-13"


def _src():
    return [f"Chitti Mechanic 2W rule table v{VERSION} ({UPDATED})"]


def _band(lo, hi):
    return f"₹{int(lo):,}–₹{int(hi):,}"


CLASSES = {
    "commuter": "oil_20w40_mineral",
    "performance": "oil_10w30_synth",
    "scooter": "oil_10w30_scooter",
    "ev": "none",
}
OILS = {
    "oil_20w40_mineral": {"grade": "20W-40 (mineral, JASO MA2)", "interval_km": 3000, "price": "₹350–550"},
    "oil_10w30_synth": {"grade": "10W-30 (synthetic, JASO MA2)", "interval_km": 6000, "price": "₹550–900"},
    "oil_10w30_scooter": {"grade": "10W-30 scooter (JASO MB)", "interval_km": 4000, "price": "₹350–600"},
    "none": {"grade": "No engine oil (EV)", "interval_km": 0, "price": "₹0"},
}
SERVICE = [
    {"item": "Engine oil change", "km": 3000, "tier": "caution", "cost": "₹500–1,000"},
    {"item": "Air filter clean", "km": 3000, "tier": "safe", "cost": "₹0"},
    {"item": "Spark plug", "km": 10000, "tier": "safe", "cost": "₹150–300"},
    {"item": "Brake shoes/pads", "km": 15000, "tier": "mechanic", "cost": "₹800–1,500"},
    {"item": "Chain clean + lube", "km": 500, "tier": "safe", "cost": "₹100"},
]
TYRES = [
    {"name": "CEAT EnergyRide", "best": "EV scooters, range", "usage": ["ev", "mileage"], "price": "₹1,800–2,200"},
    {"name": "Michelin City Extra", "best": "Durability", "usage": ["durability", "highway"], "price": "₹2,200–2,800"},
    {"name": "MRF Zapper", "best": "All-rounder grip", "usage": ["allround", "commuter", "performance"], "price": "₹1,600–2,000"},
    {"name": "Apollo WAV", "best": "Value + wet grip", "usage": ["value", "commuter", "mileage"], "price": "₹1,500–1,900"},
]
INSURERS = [
    ("ACKO", 98.4, "Urban riders"), ("HDFC ERGO", 98.1, "EV owners"),
    ("Bajaj Allianz", 98.0, "Low-mileage"), ("Royal Sundaram", 97.2, "Value"),
    ("ICICI Lombard", 96.8, "Tech-savvy"), ("TATA AIG", 96.5, "Add-ons"),
    ("SBI General", 96.0, "Branch support"), ("Reliance General", 95.5, "Budget TP"),
]
OBD = {
    "P0300": ("Random/multiple cylinder misfire", "mechanic", "₹500–2,000"),
    "P0171": ("Fuel system too lean", "mechanic", "₹500–1,500"),
    "P0562": ("System voltage low — weak battery/charging", "caution", "₹1,500–2,500"),
    "P0563": ("System voltage high — regulator/rectifier", "mechanic", "₹800–1,500"),
}
TRIAGE = {"safe": ("\U0001f7e2", "Safe DIY"), "caution": ("\U0001f7e1", "Caution"), "mechanic": ("\U0001f534", "Mechanic only")}
TP_BY_CLASS = {"commuter": 752, "performance": 1193, "scooter": 752, "ev": 538}
DEFAULT_IDV = {"commuter": 55000, "performance": 95000, "scooter": 60000, "ev": 110000}
SCAM_THRESHOLD_PCT = 30


def _cls(v):
    return v if v in CLASSES else "commuter"


def _age_factor(years):
    years = years or 0
    if years <= 1:
        return 1.0
    if years <= 3:
        return 0.92
    if years <= 5:
        return 0.80
    return 0.68


def insure_compare(idv=0, vehicle_age_years=0, vclass="scooter", current_premium=0):
    vclass = _cls(vclass)
    idv = int(idv) or DEFAULT_IDV[vclass]
    ranked = sorted(INSURERS, key=lambda x: -x[1])
    opts = []
    for i, (name, csr, best_for) in enumerate(ranked):
        od = idv * 0.0145 * _age_factor(vehicle_age_years)
        factor = 1.08 - (i * 0.022)
        prem = round(od * factor + TP_BY_CLASS[vclass])
        saving = max(0, current_premium - prem) if current_premium else None
        opts.append({"name": name, "csr": csr, "bestFor": best_for, "estPremium": prem, "estSaving": saving})
    cheapest = sorted(opts, key=lambda o: (o["estPremium"], -o["csr"]))[0]
    return {"module": "insurance", "idv": idv, "vclass": vclass, "options": opts, "best": cheapest,
            "summary": f"Cheapest estimate: {cheapest['name']} ~₹{cheapest['estPremium']:,} at IDV ₹{idv:,}. Pick on CSR + cover, not price alone.",
            "confidence": "medium — IDV-based estimate (OD + IRDAI TP), reproducible; confirm on insurer site",
            "risks": ["Computed estimate, not a binding quote.", "Pick on Claim-Settlement-Ratio + cover, not price alone.",
                      "Chitti never buys a policy without your Yes (Golden Rule)."],
            "sources": _src() + ["IRDAI TP bands + IDV own-damage model; insurer CSRs (indicative)"]}


def tyre_reco(usage="allround"):
    usage = (usage or "allround").lower()
    picks = [t for t in TYRES if usage in t["usage"]] or [t for t in TYRES if "allround" in t["usage"]]
    return {"module": "tyre_reco", "usage": usage,
            "options": [{"name": t["name"], "best": t["best"], "price": t["price"]} for t in picks],
            "summary": "For " + usage + ": " + ", ".join(f"{t['name']} ({t['price']})" for t in picks),
            "confidence": "medium — by usage; confirm the OEM SIZE on your sidewall",
            "risks": ["Fit the OEM size printed on your tyre sidewall."], "sources": _src()}


def service_schedule(vclass="scooter", odo_km=0, last_service_km=0):
    vclass = _cls(vclass)
    since = int(odo_km) - int(last_service_km)
    due = [f"{s['item']} ({s['cost']}) {TRIAGE[s['tier']][0]}" for s in SERVICE if since >= s["km"] or (since % s["km"]) >= (s["km"] - 600)]
    oil = OILS[CLASSES[vclass]]
    return {"module": "service", "kmSinceService": since,
            "dueItems": due or [f"Nothing overdue — next oil change ~every {oil['interval_km']} km."],
            "oil": None if CLASSES[vclass] == "none" else oil,
            "summary": ("EV — no engine oil." if CLASSES[vclass] == "none" else f"Recommended oil: {oil['grade']} every {oil['interval_km']} km. {oil['price']}."),
            "confidence": "high (manufacturer-class table)",
            "risks": ["Confirm the exact grade in YOUR owner's manual.", "Use the right JASO spec (MA2 bikes / MB scooters)."],
            "sources": _src()}


def obd_lookup(code=""):
    code = (code or "").upper().strip()
    if code not in OBD:
        return {"module": "obd", "found": False,
                "summary": f'Code "{code}" is not in Chitti\'s library. Most Indian 2-wheelers have no OBD2 — describe the symptom instead. Chitti never invents a meaning.',
                "confidence": "n/a", "risks": ["Unknown code — do not guess."], "sources": _src()}
    meaning, tier, cost = OBD[code]
    sym, word = TRIAGE[tier]
    return {"module": "obd", "found": True, "code": code, "meaning": meaning, "tier": tier, "cost": cost,
            "summary": f"{code}: {meaning}. {sym} {word}. Likely cost {cost}.",
            "confidence": "high (code → meaning deterministic)",
            "risks": ["A code points at a system, not the exact part — a mechanic confirms."], "sources": _src()}


def scam_check(item="repair", quote=0, expected_lo=0, expected_hi=0):
    lo, hi = int(expected_lo), int(expected_hi)
    if not lo and not hi and item:
        m = next((s for s in SERVICE if item.lower() in s["item"].lower()), None)
        if m:
            parts = m["cost"].replace("₹", "").replace(",", "").split("–")
            lo = int(parts[0]); hi = int(parts[1]) if len(parts) > 1 else lo
    hi = hi or lo
    quote = int(quote)
    over = round(((quote - hi) / hi) * 100) if hi else None
    scam = over is not None and over > SCAM_THRESHOLD_PCT
    return {"module": "scam", "item": item, "quote": quote, "expected": _band(lo, hi) if (lo or hi) else None,
            "overPct": over, "scamAlert": scam,
            "summary": (f"⚠️ Quote ₹{quote:,} is ~{over}% above the fair range {_band(lo, hi)}. Negotiate or get a second quote." if scam
                        else (f"Quote ₹{quote:,} is within the fair range {_band(lo, hi)}." if (lo or hi) else "Tell Chitti the item to check the fair range.")),
            "confidence": "high (fair-range table)" if (lo or hi) else "info",
            "risks": ["Fair ranges are typical bands; genuine OEM parts can justify more.", "Always ask for the old part back + a GST bill."],
            "sources": _src()}


def fuel_roi(monthly_km=1000, mileage_kmpl=45, petrol_price=105, ev_cost_month=1200, ev_net_price=95000):
    monthly_km = int(monthly_km) or 1000
    mileage_kmpl = int(mileage_kmpl) or 45
    petrol_price = int(petrol_price) or 105
    petrol_monthly = round((monthly_km / mileage_kmpl) * petrol_price)
    ev_monthly = int(ev_cost_month) or 1200
    saving = petrol_monthly - ev_monthly
    net = int(ev_net_price) or 95000
    payback = (net // saving + 1) if saving > 0 else None
    return {"module": "fuel_ev", "petrolMonthly": petrol_monthly, "evMonthly": ev_monthly,
            "monthlySaving": saving, "yearlySaving": saving * 12, "paybackMonths": payback,
            "summary": (f"Petrol ~₹{petrol_monthly:,}/mo vs EV ~₹{ev_monthly:,}/mo → save ~₹{saving:,}/mo. Payback ≈ {payback} months." if saving > 0
                        else "At your usage, an EV switch does not clearly pay back yet."),
            "confidence": "medium — depends on real km, tariff, resale",
            "risks": ["Battery cost, charging access, resale affect real ROI.", "Estimates from your inputs, not a guarantee."],
            "sources": _src()}


def inspect(asking=0, expected_market=0, owners=1, service_history=False, rc_clear=False,
            insurance_valid=False, accident_signs=False, flood_signs=False, odo_suspect=False):
    score = 100
    if not service_history:
        score -= 12
    if int(owners) > 1:
        score -= 6 * (int(owners) - 1)
    if not rc_clear:
        score -= 8
    if not insurance_valid:
        score -= 4
    if accident_signs:
        score -= 25
    if flood_signs:
        score -= 30
    if odo_suspect:
        score -= 20
    score = max(0, min(100, round(score)))
    market = int(expected_market)
    verdict = "Good buy" if score >= 80 else "Buy with caution — negotiate hard" if score >= 60 else "Avoid / inspect at a workshop first"
    offer = round(market * (0.93 if score >= 80 else 0.88 if score >= 60 else 0.82)) if market else None
    return {"module": "inspect", "score": score, "verdict": verdict, "expectedMarket": market or None,
            "suggestedOffer": offer,
            "summary": f"Buy Score {score}/100 — {verdict}." + (f" Expected ₹{market:,}; offer around ₹{offer:,}." if market else ""),
            "confidence": "medium — checklist, not a workshop teardown",
            "risks": ["A guided checklist, NOT a workshop inspection. High score ≠ guarantee; low score ≠ proof of fraud.",
                      "Accident/flood/odometer history is not in any public API — verify with bills + a mechanic.",
                      "Always road-test + get a mechanic to inspect before paying."],
            "sources": _src()}
