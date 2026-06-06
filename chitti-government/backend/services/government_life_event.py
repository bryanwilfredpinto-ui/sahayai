"""
services/government_life_event.py
---------------------------------
Life-Event Engine (CEOS Feature 3 — the CHITTI moat). Deterministic map of a
life event -> ordered bundle of {documents, schemes, registrations, deadlines}.
No LLM in the critical path. Mirrors LIFE_EVENTS in chitti_government.html so a
Vaani-routed answer matches the standalone page.
"""
from __future__ import annotations

EVENTS: dict[str, dict] = {
    "daughter_born": {"label": "My daughter was born", "actions": [
        {"type": "document", "name": "Register the birth within 21 days → Birth Certificate", "url": "https://crsorgi.gov.in/"},
        {"type": "document", "name": "Aadhaar enrolment for the newborn", "url": "https://uidai.gov.in/"},
        {"type": "scheme", "name": "Open a Sukanya Samriddhi account (before age 10)", "url": "https://www.nsiindia.gov.in/"},
        {"type": "scheme", "name": "PMMVY maternity benefit (₹6,000 for 2nd-child girl)", "url": "https://pmmvy.wcd.gov.in/"},
        {"type": "registration", "name": "Immunisation (Mission Indradhanush / U-WIN)", "url": "https://nhm.gov.in/"},
        {"type": "scheme", "name": "Your state girl-child scheme (Kanyashree / Ladli / Kanya Sumangala)", "url": "https://www.myscheme.gov.in/"},
    ]},
    "child_born": {"label": "A child was born", "actions": [
        {"type": "document", "name": "Birth Certificate within 21 days", "url": "https://crsorgi.gov.in/"},
        {"type": "scheme", "name": "PMMVY (₹5,000 for first child)", "url": "https://pmmvy.wcd.gov.in/"},
        {"type": "scheme", "name": "JSY / JSSK cash for institutional delivery", "url": "https://nhm.gov.in/"},
        {"type": "registration", "name": "Immunisation + add child to ration card + ABHA", "url": "https://abha.abdm.gov.in/"},
    ]},
    "marriage": {"label": "I got married", "actions": [
        {"type": "document", "name": "Register the marriage → Marriage Certificate", "url": "https://www.myscheme.gov.in/"},
        {"type": "registration", "name": "Update Aadhaar / ration card / bank nominee", "url": "https://uidai.gov.in/"},
        {"type": "scheme", "name": "State marriage-assistance scheme (if eligible)", "url": "https://www.myscheme.gov.in/"},
    ]},
    "death": {"label": "A death in the family", "actions": [
        {"type": "document", "name": "Register the death within 21 days → Death Certificate", "url": "https://crsorgi.gov.in/"},
        {"type": "document", "name": "Legal-heir / succession certificate", "url": "https://www.myscheme.gov.in/"},
        {"type": "scheme", "name": "Family/widow pension (NSAP) + NFBS ₹20,000 lump sum (BPL)", "url": "https://nsap.nic.in/"},
        {"type": "registration", "name": "Claim PMJJBY / PMSBY / LIC; transfer ration card + land mutation", "url": "https://www.jansuraksha.gov.in/"},
    ]},
    "job_loss": {"label": "I lost my job", "actions": [
        {"type": "registration", "name": "Register on e-Shram (unorganised worker)", "url": "https://eshram.gov.in/"},
        {"type": "scheme", "name": "Skilling (Skill India / PMKVY)", "url": "https://www.skillindiadigital.gov.in/"},
        {"type": "scheme", "name": "MUDRA / PMEGP for self-employment; PM-SVANidhi if vending", "url": "https://www.mudra.org.in/"},
        {"type": "registration", "name": "EPFO advance/withdrawal if you had EPF", "url": "https://www.epfindia.gov.in/"},
    ]},
    "start_business": {"label": "I'm starting a business", "actions": [
        {"type": "registration", "name": "Udyam (MSME) registration — free", "url": "https://udyamregistration.gov.in/"},
        {"type": "scheme", "name": "PM MUDRA / PMEGP / CGTMSE financing", "url": "https://www.mudra.org.in/"},
        {"type": "scheme", "name": "Startup India (DPIIT) if innovative; PM Vishwakarma if artisan", "url": "https://www.startupindia.gov.in/"},
        {"type": "registration", "name": "GST (if turnover applies) + current account + ONDC", "url": "https://www.gst.gov.in/"},
    ]},
    "buy_house": {"label": "I bought land / a house", "actions": [
        {"type": "registration", "name": "Register the sale deed + mutation in land records", "url": "https://www.myscheme.gov.in/"},
        {"type": "scheme", "name": "PMAY home-loan interest benefit (if first home + eligible)", "url": "https://pmay-urban.gov.in/"},
        {"type": "scheme", "name": "PM Surya Ghar rooftop solar after possession", "url": "https://pmsuryaghar.gov.in/"},
    ]},
    "turn_18": {"label": "I turned 18", "actions": [
        {"type": "document", "name": "Voter ID (Form 6) + PAN + (optional) driving licence", "url": "https://voters.eci.gov.in/"},
        {"type": "registration", "name": "Open an independent bank account", "url": "https://pmjdy.gov.in/"},
        {"type": "scheme", "name": "e-Shram / APY / PM-SYM eligibility opens; scholarships", "url": "https://eshram.gov.in/"},
    ]},
    "turn_60": {"label": "I turned 60", "actions": [
        {"type": "scheme", "name": "Old-age pension (NSAP / state)", "url": "https://nsap.nic.in/"},
        {"type": "scheme", "name": "SCSS savings; ensure APY / PM-SYM pension starts", "url": "https://www.nsiindia.gov.in/"},
        {"type": "deadline", "name": "At 70: Ayushman Vay Vandana ₹5 lakh health cover (Aadhaar only)", "url": "https://beneficiary.nha.gov.in/"},
    ]},
    "disability": {"label": "Disability onset", "actions": [
        {"type": "document", "name": "Apply for UDID (the gateway to all PwD benefits)", "url": "https://www.swavlambancard.gov.in/"},
        {"type": "scheme", "name": "ADIP assistive aids + Divyangjan pension (IGNDPS)", "url": "https://depwd.gov.in/"},
        {"type": "scheme", "name": "PwD scholarships (AICTE Saksham) + reservations + concessions", "url": "https://scholarships.gov.in/"},
    ]},
    "move_state": {"label": "I moved to a new state", "actions": [
        {"type": "registration", "name": "Update Aadhaar address; port ration card (ONORC)", "url": "https://nfsa.gov.in/"},
        {"type": "document", "name": "New domicile certificate (note state residency periods)", "url": "https://www.myscheme.gov.in/"},
        {"type": "registration", "name": "Update voter roll + bank + admit children (RTE)", "url": "https://voters.eci.gov.in/"},
    ]},
    "retirement": {"label": "I'm retiring", "actions": [
        {"type": "registration", "name": "EPF / EPS / NPS / gratuity claims; commence pension", "url": "https://www.epfindia.gov.in/"},
        {"type": "scheme", "name": "SCSS; senior health (Vay Vandana at 70); update nominees", "url": "https://www.nsiindia.gov.in/"},
    ]},
}


def list_events() -> list[dict]:
    return [{"id": k, "label": v["label"], "action_count": len(v["actions"])} for k, v in EVENTS.items()]


def get(event_id: str) -> dict | None:
    ev = EVENTS.get((event_id or "").strip())
    if not ev:
        return None
    return {"ok": True, "event": event_id, "label": ev["label"], "actions": ev["actions"],
            "note": "Chitti prepares you for these steps in order of urgency; the government makes the final decision."}
