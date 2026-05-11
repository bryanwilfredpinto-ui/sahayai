# BOUNDARIES — Hard Refusals

What Chitti MedUPI will **never** do. Each entry follows the WHAT / WHY / AUDIT format. Each refusal is enforced in code, not policy.

---

## 1. Never recommend a different salt
**WHAT:** Chitti will not suggest a switch from one molecule to another (e.g. Aspirin → Paracetamol, Telmisartan → Losartan), even when one is cheaper.

**WHY:** Different molecules have different mechanisms, contraindications, and interactions. A switch is a *prescribing decision* — outside MedUPI's scope and a CDSCO violation. A cardiac patient told "switch to paracetamol" instead of aspirin could throw a clot. See [CONTEXT.md](../CONTEXT.md) §4.

**AUDIT TRAIL:**
- Enforced in [`services/medupi_alternatives.py`](../backend/services/medupi_alternatives.py): query filters `salt_composition == input.salt_composition` (no `LIKE`, no fuzzy).
- DB-level composite index `ix_medicines_strict_match` on `(salt_composition, strength, dosage_form)`.
- Logged in `medupi.search_log` with the queried composition for every request — a relaxed query would show up in the audit table immediately.

---

## 2. Never recommend a different strength
**WHAT:** Chitti will not suggest "go from Telmisartan 40 to Telmisartan 80" or "split a 500mg into halves." Strength is matched exactly.

**WHY:** Strength is dose. Dose is prescription. A 40 → 80 switch in a hypertensive patient can drop blood pressure to a dangerous low.

**AUDIT TRAIL:** Same matcher; `strength` is the second column of the composite index. Any UI rendering of an alternative card whose `strength` field differs from the query is a bug; file an issue.

---

## 3. Never recommend a different dosage form
**WHAT:** No Tablet → Capsule, no Injection → Tablet, no Inhaler → Syrup. Form is matched exactly.

**WHY:** Bioavailability and dosing intervals differ across forms. Insulin pen → vial is a dosing-error vector. Modified-release tablet → immediate-release is a peak-trough disaster.

**AUDIT TRAIL:** Third column of the strict-match composite index. The 8 enumerated forms (Tablet / Capsule / Syrup / Injection / Inhaler / Cream / Drops / Sachet) cover ~98% of Indian retail — and they never mix.

---

## 4. Never tell the user to stop a prescription
**WHAT:** Chitti will not say "you can skip this dose," "you don't need this medicine," or "this prescription is wrong." Ever.

**WHY:** Stopping a prescribed regimen mid-course (especially antibiotics, anticoagulants, antipsychotics, anti-epileptics) is catastrophic. Even questioning a doctor's prescription in copy crosses the prescribing line.

**AUDIT TRAIL:** No endpoint emits "stop" / "skip" / "don't take" language. Frontend copy reviewed for this phrase. Disclaimer banner reinforces: *"Always ask your doctor before any change."*

---

## 5. Never accept a payment
**WHAT:** No cart. No checkout. No "order now." No affiliate links. No commission on Jan Aushadhi purchases.

**WHY:** The moment a payment flows, the neutrality is gone. Users will ask: "is Chitti recommending Jan Aushadhi because it's cheaper, or because Chitti gets a cut?" The answer must be unambiguously the former, forever.

**AUDIT TRAIL:** No payment SDK in [`requirements.txt`](../backend/requirements.txt). No Razorpay / Stripe / UPI-PSP / cart endpoint anywhere in [`routes/medupi.py`](../backend/routes/medupi.py). [README.md](../README.md) §IS NOT explicitly lists this as out of scope.

---

## 6. Never store the medicine image after extraction
**WHAT:** The image uploaded to the vision scanner is held in memory only for the duration of the LLM call. It is not written to disk, not logged, not retained.

**WHY:** A photo of a medicine strip is health-PII. Retention creates a HIPAA-equivalent obligation we will not take on. Also: the user trusts MedUPI not to leak what they're treating.

**AUDIT TRAIL:** [`services/medupi_recognition.py`](../backend/services/medupi_recognition.py) accepts base64 in-memory, posts to the vision model, parses JSON, discards the bytes. No `os.write`, no S3 upload, no log-line containing the image bytes. Confirm via grep before each release.

---

## 7. Never sell or share health data
**WHAT:** No analytics SDK that exports per-user medicine data. No third-party retargeting. No data broker integration. Family wallet entries stay on the user's device or in the Neon DB tied to their family-scoped session — never aggregated for sale.

**WHY:** Health data is the most sensitive PII a family generates. Selling it would betray the entire user base.

**AUDIT TRAIL:** No Google Analytics with custom dimensions on medicine queries. No Mixpanel / Amplitude with health events. Master spec §13 lists "Selling personal health data" under **Out of Scope** — privacy-first, never.

---

## 8. Never invent a Jan Aushadhi store
**WHAT:** If the haversine geo lookup finds zero stores within a sensible radius, the response is "no nearby store" — not "the nearest store is approximately…"

**WHY:** Sending a Blind / Illiterate user to a non-existent address in a tier-3 city is cruel. The fall-through is the by-state list of real stores.

**AUDIT TRAIL:** [`services/medupi_jan_aushadhi.py`](../backend/services/medupi_jan_aushadhi.py) returns an empty list, not a synthesised entry. Loader runs are tracked in `medupi.loader_run`; only stores written by a logged loader run are queryable.

---

## 9. Never visit pharmacy URLs programmatically
**WHAT:** No scraping of 1mg, PharmEasy, NetMeds, Apollo, MedPlus, TrueMeds. Brave Search returns snippets; MedUPI displays the snippet and the source URL — the user clicks if they want.

**WHY:** ToS compliance, IP ranges getting blocked, and (more importantly) freshness gaming. Snippets are dated; scraped pages can be A/B-tested to fool a scraper.

**AUDIT TRAIL:** [`services/medupi_brave.py`](../backend/services/medupi_brave.py) only calls Brave Search API. No `requests.get(pharmacy_url)` anywhere in the backend. [README.md](../README.md) §non-negotiable #5.

---

## 10. Never claim to be a doctor, pharmacist, or insurer
**WHAT:** The disclaimer banner is sticky on every page. The modal opens to the full Gold Standard text. Hindi version auto-renders when toggled.

**WHY:** MedUPI is a price-and-composition layer. It is not licensed to prescribe, dispense, or underwrite. The disclaimer is the *Legal Firewall + Trust Builder* — it protects MedUPI and arms the user for their doctor conversation simultaneously.

**AUDIT TRAIL:** Sticky banner enforced in every Chitti HTML page per global memory `project_legal_disclaimer.md`. Full modal renders the verbatim Gold Standard text from master spec §8. Disclaimer Hindi text bundled in [`services/medupi_alternatives.py`](../backend/services/medupi_alternatives.py) → `_disclaimer_hi()`.
