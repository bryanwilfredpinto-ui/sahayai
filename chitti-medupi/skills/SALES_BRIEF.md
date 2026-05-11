# SALES_BRIEF — Pain × Benefit

Ten pain points faced by Indian families managing medicines, paired with the concrete benefit Chitti MedUPI delivers in response. Each pair maps to a shipped feature, not a roadmap promise. The product never sells, never upsells, never charges — but the pain it removes is what makes a Bhopal grandmother hand her phone to her daughter-in-law and say "isko bhi dekhao."

---

## 1.
**Pain:** A family pays ₹120 for a branded paracetamol strip when the same molecule is ₹18 at the Jan Aushadhi store down the road.
**Benefit:** One scan returns the same composition at Jan Aushadhi price + the nearest store with address and walking distance — in Hindi or English, by voice or by tap.

---

## 2.
**Pain:** The patient cannot read the English prescription handed to them by the doctor.
**Benefit:** Photograph the prescription, MedUPI extracts the medicine names, reads each one aloud in Hindi, and shows the salt composition in plain language so the user knows what they're being asked to take.

---

## 3.
**Pain:** The user doesn't know which Jan Aushadhi store is nearest, or whether the one they walked to is still open.
**Benefit:** Haversine geo lookup against ~11,000 BPPI stores returns the closest by lat/lng, with a by-state fallback list when nothing is in immediate radius. Address, district, pincode — never invented.

---

## 4.
**Pain:** The chemist at the counter recommends an alternative the user has no way to verify is actually equivalent.
**Benefit:** Strict same-composition matching — MedUPI returns alternatives only when salt + strength + dosage form all match. The user walks into the pharmacy with the names of the equivalents already in their hand, in Hindi.

---

## 5.
**Pain:** The household runs out of a chronic-illness medicine and only realises mid-week.
**Benefit:** Per-family-profile refill reminders (Self / Spouse / Child / Parent) — wired today via API; browser-push, Twilio voice, and WhatsApp channels on the roadmap so grandparents without smartphones still get the call. See [TODO.md](../TODO.md) §5–§6.

---

## 6.
**Pain:** The family pays for a medicine that Ayushman Bharat / CGHS / ESI would have covered, simply because no one told them.
**Benefit:** The insurance-match endpoint returns a `covered` flag + EN/HI reason text across Ayushman, CGHS, ESI, and private schemes — surfaced inline on every medicine card. Honest about its source: today a therapeutic-class proxy, with the official Ayushman empanelled list folding in when available.

---

## 7.
**Pain:** Adult children managing parents' medicines from a different city have no view into what's actually being spent.
**Benefit:** Family wallet — multi-profile entries roll up into this-month spend + savings, 12-month total, and annual projection. No advertising on top, no data sold downstream — privacy-first, per [BOUNDARIES.md](BOUNDARIES.md) §7.

---

## 8.
**Pain:** Patients on chronic regimens are quietly switched between brands by their chemist without knowing whether the new pill is the same molecule.
**Benefit:** Compare two strips side-by-side — same composition, same strength, same form? MedUPI says yes or no with the underlying fields visible. The risk classifier adds a HIGH / MEDIUM / LOW banner so the user knows when to call the doctor before accepting the switch.

---

## 9.
**Pain:** A Blind user can scan groceries with their phone's accessibility tools, but no medicine app speaks back the way they need it to.
**Benefit:** Voice IN + voice OUT on every screen. Every API response carries `speak_en` and `speak_hi`. Every UI signal has symbol AND text AND voice — never colour-only. Demo mode is operable by Blind, Deaf, Mute, and Illiterate users equally. Accessibility before AI — see [VALUES.md](VALUES.md) §3.

---

## 10.
**Pain:** Online pharmacy snippets shown on price-comparison sites are weeks stale, and the user has no way to tell.
**Benefit:** Live Brave Search snippets across 1mg, PharmEasy, NetMeds, Apollo, MedPlus, TrueMeds — every snippet tagged with a freshness pill (green ≤24h, amber ≤7 days, red > 7 days, hidden if quota exhausted). The user sees the date the price was last seen, in EN and HI, never disguised as current. See [TRUTH_SOURCES.md](TRUTH_SOURCES.md) §9.

---

## How to talk about MedUPI in one sentence

> "It's the only medicine app that refuses to recommend a different molecule — and that refusal is what makes the savings safe."

If a prospective user, partner, or grant officer remembers nothing else, this is the line.
