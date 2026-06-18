# CEOS — CHITTI MEDUPI
## Constitution, Ethics, Operations & Safety
### UPI for Your Medicine Bills · Scan. Compare. Save.

**Version:** 1.0 | **Status:** FINAL | **Date:** June 2026 | **Classification:** PUBLIC
**URL:** sahayai.in/chitti_medupi.html | **Backend:** chitti-shares-api (Railway)
**Founder:** Bryan Wilfred Pinto | **Built on:** DeepSeek + NPPA/DPCO data
**Accessed via:** Chitti Vaani → medicine scan/query → MedUPI panel
**Read first:** https://sahayai.in/sahay_master.md + https://sahayai.in/ceos_vaani.md

---

## THE FORMULA

| Component | What It Does | Source Inspiration |
|---|---|---|
| Jan Aushadhi Sugam (PMBI) | Official govt generic medicine database | Jan-Aushadhi-first pricing model |
| Tata 1mg | Medicine search, composition, alternatives | Composition matching engine |
| PharmEasy | Prescription upload, medicine delivery | Prescription OCR flow |
| Netmeds | Generic medicine comparison | Price comparison model |
| Apollo 24/7 | Health records + medicine reminders | Reminder engine reference |
| Medkart | Generic medicine price comparison tool | Comparison UI model |
| Truemeds | Doctor-approved generic substitutes | Risk classification model |
| SayaCare | NABL-tested generics, quality reports | Quality assurance model |
| NPPA/DPCO | Ceiling price database for essential medicines | Overcharge detection |
| Medscape Drug Checker | Drug-drug interaction database | Interaction checker reference |
| AI Prescription Saathi | OCR prescription reader | Prescription decode reference |
| DrugBank API | Clinical drug interaction validation | Interaction data source |
| ABDM (Ayushman Bharat DM) | Health records interoperability | Health record standard |
| Ayushman Bharat PM-JAY | Insurance coverage for medicines | Coverage check model |
| CGHS | Central Govt Health Scheme medicine list | Coverage check model |

---

## TABLE OF CONTENTS

| Section | Title |
|---|---|
| 1 | Preamble & Vision |
| 2 | Constitution (Core Principles) |
| 3 | User Personas |
| 4 | Research — 20 Medicine Apps + 20 AI Health Platforms |
| 5 | Complete Feature Suite |
| 6 | Scan Engine |
| 7 | Composition Matching & Risk Classification |
| 8 | Jan Aushadhi Intelligence |
| 9 | Family Wallet |
| 10 | Reminder Engine |
| 11 | Insurance Coverage Check |
| 12 | Prescription Decoder |
| 13 | Optimised Cart Simulator |
| 14 | Health File Integration |
| 15 | Learn Tab (Medicine Literacy) |
| 16 | Savings Tracker |
| 17 | GUARDRAILS (Safety) |
| 18 | EVALS |
| 19 | OBSERVABILITY |
| 20 | SWARM INTELLIGENCE |
| 21 | ROLE |
| 22 | SKILLS |
| 23 | SOP |
| 24 | Technical Architecture |
| 25 | BUILD ORDER (✅ EXISTS / ⭐ BUILD) |
| 26 | Quality Gates |
| 27 | Quality Metrics |
| 28 | Product Audit |
| 29 | Certification Criteria |
| 30 | Deliverables |
| 31 | Success Metrics |
| 32 | Risk Disclosure & Legal |
| 33 | Sign-off |

---

## SECTION 1: PREAMBLE & VISION

### 1.1 Executive Summary

Chitti MedUPI is India's first voice-first, Jan-Aushadhi-first medicine price comparison and savings tool. A user scans or speaks any branded medicine name → Chitti shows the same-composition Jan Aushadhi generic, the price difference, nearest store, risk classification, and potential savings. No sign-up. No delivery. No markup. Pure price transparency for every Indian family.

**The Core Insight:** India's medicine market has a massive information asymmetry. A Crocin 650 costs ₹22. The same Paracetamol 650mg at Jan Aushadhi costs ₹6.47. The patient doesn't know. Chitti MedUPI closes that gap — for every medicine, every family, in their language, by voice.

**Jan Aushadhi context:** 15,032 stores across India (2024-25), ₹2,234 crore annual sales, savings of ₹30,000+ crore since inception. Chitti MedUPI is the voice-first front door to this entire system.

### 1.2 Vision Statement
"Be the trusted family pharmacist who is always available — who knows every medicine's composition, finds the cheapest same-quality alternative, warns about dangerous substitutions, reminds about refills and expiry, and saves every Indian family ₹10,000+ annually on medicine bills."

### 1.3 Mission
- Make Jan Aushadhi accessible to every Indian by voice in 26 languages
- Show same-composition alternatives with strict risk classification
- Decode any prescription — handwritten or printed — in seconds
- Track family medicine spend and savings transparently
- Never recommend unsafe substitution — HIGH risk meds get STOP prompt
- Integrate with Health File for complete medical history

---

## SECTION 2: CONSTITUTION

**Art 1: Jan Aushadhi First** — every scan shows Jan Aushadhi price first, always
**Art 2: Same Composition Only** — never therapeutic alternatives, same molecule + strength + form ONLY
**Art 3: Risk Before Savings** — HIGH risk medicines get stop-and-think prompt before any alternative shown
**Art 4: Not Medical Advice** — Chitti shows information. Doctor/pharmacist makes the decision. Always.
**Art 5: NPPA Ceiling Price** — if branded price > NPPA ceiling → scam alert shown
**Art 6: No Selling** — Chitti never sells medicines, earns no commission on sales, never pushes any brand
**Art 7: Family Privacy** — all family wallet data on-device. Never sold. Never shared.
**Art 8: Voice First** — every feature accessible by voice in 26 languages for illiterate/elderly users
**Art 9: Free Forever** — core scan + compare + Jan Aushadhi finder always free
**Art 10: ABDM Ready** — health records interoperable with Ayushman Bharat Digital Mission
**Art 11: DeepSeek Only** — no Anthropic in any backend [LOCKED — sahay_master.md §2]
**Art 12: Chitti Forget** — one command deletes all family wallet data permanently

---

## SECTION 3: USER PERSONAS

| User | Need | MedUPI Solution |
|---|---|---|
| Elderly parent | Can't read medicine labels, paying ₹500/month extra | Voice scan → Jan Aushadhi alternative → ₹150/month |
| Delivery rider | Chronic BP medicine ₹800/month | Cart simulator → saves ₹600/month switching to generics |
| Rural housewife | Illiterate, buys whatever doctor writes | Voice prescription decoder → understands what + why |
| Diabetic patient | 5 chronic medicines monthly | Family wallet shows ₹8,400 annual savings possible |
| Blind user | Cannot read medicine strip | Camera scan → TTS reads composition + alternatives aloud |
| Kirana owner | Buying OTC meds for family | Expiry reminder + refill reminder → never waste |
| First-time parent | Doesn't know if generic is safe for baby | Risk classification → LOW risk vitamins shown clearly |
| Government employee | Entitled to CGHS coverage | Insurance tab → check coverage in one tap |

---

## SECTION 4: RESEARCH — 20 MEDICINE APPS + 20 AI HEALTH PLATFORMS

### 4.1 Top 20 Medicine / Pharmacy Apps

| # | App | Core Function | What They Miss | Chitti MedUPI Advantage |
|---|---|---|---|---|
| 1 | Tata 1mg | Medicine search, buy, composition lookup | No Jan Aushadhi first, no voice, paid delivery | Jan-Aushadhi-first + voice + no delivery markup |
| 2 | PharmEasy | Prescription upload, delivery, lab tests | No Jan Aushadhi, no voice, no savings tracker | Voice + Jan Aushadhi + savings tracker |
| 3 | Netmeds (Reliance) | Medicine delivery, generic search | No voice, no Jan Aushadhi store finder | Voice + Jan Aushadhi store finder |
| 4 | Apollo 24/7 | Health records, medicine reminders, delivery | No Jan Aushadhi, no composition matching | Jan Aushadhi + strict composition matching |
| 5 | Jan Aushadhi Sugam (PMBI) | Official Jan Aushadhi store locator + product list | No composition matching, no branded comparison | Full composition match + branded alternative shown |
| 6 | Medkart | Generic medicine price comparison | No voice, no Jan Aushadhi store, no family wallet | Voice + store finder + family wallet |
| 7 | Truemeds | Doctor-approved generic substitutes | No Jan Aushadhi, no voice, requires doctor consult | Jan Aushadhi first + voice + no gatekeeping |
| 8 | SayaCare | NABL-tested generics with quality report | Delivery only, no composition search | Instant scan + no delivery wait |
| 9 | Medbuzz | Online generic medicine order | No composition matching, no Jan Aushadhi store finder | Scan + match + nearest Jan Aushadhi |
| 10 | GenericMeds | PMBJP generic medicine list | Text search only, no voice, no camera | Camera scan + voice + savings |
| 11 | MedIndia | Drug database, composition lookup | Ad-heavy, no voice, no Jan Aushadhi | Voice-first + clean UI + Jan Aushadhi |
| 12 | HealthKart | Supplements + medicine comparison | No Jan Aushadhi, no prescription decode | Prescription OCR + Jan Aushadhi |
| 13 | Practo | Doctor consultation + prescription | No medicine comparison, no Jan Aushadhi | Complement to Practo — price check after consult |
| 14 | mFine | AI symptom checker + doctor | No medicine price check | Post-consult savings tool |
| 15 | Pharmeasy (B2B) | Pharmacy stock management | Not consumer-facing | Consumer savings focus |
| 16 | Myupchar | Health info + medicine info | No Jan Aushadhi, no savings tracker | Savings + Jan Aushadhi |
| 17 | GetDavai | Medicine composition lookup | No voice, no Jan Aushadhi, no family | Voice + Jan Aushadhi + family |
| 18 | MyDawaai | Alternative medicine brands + prices | No voice, no Jan Aushadhi, small DB | Voice + official Jan Aushadhi DB |
| 19 | AI Prescription Saathi | OCR prescription reader | No composition match, no Jan Aushadhi | Decode + match + Jan Aushadhi in one flow |
| 20 | Pharmacy Bazar | Delivery + reminders | No Jan Aushadhi, no voice | Jan Aushadhi first + voice reminders |

### 4.2 Top 20 AI Health / Pharma Platforms

| # | AI Platform | Core Function | Gap | Chitti MedUPI Adaptation |
|---|---|---|---|---|
| 1 | DeepSeek Vision | Image understanding, text extraction | No pharma-specific training | Prescription OCR + composition extraction engine |
| 2 | NPPA/DPCO Price DB | Official ceiling price database | No consumer app, no voice | Backend for overcharge detection |
| 3 | DrugBank API | Clinical drug interaction data | No India-specific pricing, expensive | Interaction checker reference (COMING SOON) |
| 4 | MIMS Drug DB | Medicine reference for professionals | Medical jargon, no voice | Simplified for consumers via DeepSeek |
| 5 | Medscape Drug Checker | Drug-drug interaction checker | No India generics, English only | India-adapted DDI checker (COMING SOON) |
| 6 | AI Prescription Reader | OCR handwritten/printed prescription | No composition match, no Jan Aushadhi | Full pipeline: OCR → match → Jan Aushadhi |
| 7 | FDA Drug Label AI | Label extraction from medicine packs | US-only, no India CDSCO data | CDSCO-adapted label extractor |
| 8 | ABDM Health Locker | Health record interoperability | No medicine price comparison | MedUPI pulls from ABDM health records |
| 9 | Ayushman Bharat API | PM-JAY coverage check | No medicine-level matching | Coverage check for specific medicines |
| 10 | CGHS Drug List | Govt employee medicine entitlement | Static PDF, no search | Voice-searchable CGHS drug list |
| 11 | ESI Medicine List | ESI scheme medicine coverage | Static, no voice | Voice-searchable ESI list |
| 12 | ML Kit Vision (Google) | On-device OCR, barcode | No pharma knowledge | Medicine strip barcode → CDSCO QR decode |
| 13 | GPT-4o Vision | Prescription image understanding | No Jan Aushadhi, expensive | DeepSeek vision is the cheaper India alternative |
| 14 | Whisper ASR | Voice medicine name recognition | No Indian language depth | AI4Bharat IndicConformer is better for Indic |
| 15 | RxNorm API (NIH) | Drug name standardization | US-only | India drug name normalization via CDSCO |
| 16 | OpenFDA API | Drug adverse events, recalls | US-only | CDSCO adverse event alerts (COMING SOON) |
| 17 | PharmaSecure | Medicine authentication QR | B2B, no consumer app | CDSCO QR scan → authenticate via PharmaSecure |
| 18 | Chronic Disease AI | Medication adherence prediction | No India context | Refill reminder engine based on chronic patterns |
| 19 | Polypharmacy AI | Multi-drug interaction risk | Complex, B2B | Simplified: flag when >3 meds scanned together |
| 20 | ElevenLabs TTS | Natural voice for reminders | No Indian languages | AI4Bharat TTS for medicine reminders by voice |

### 4.3 Key Gaps — What Chitti MedUPI Fills

| Gap | Chitti MedUPI Solution |
|---|---|
| No Jan-Aushadhi-first consumer app with voice | Jan Aushadhi first, always. Voice in 26 languages. |
| No prescription decoder for Indian handwriting | DeepSeek vision OCR + composition extract |
| No family medicine savings tracker | Family Wallet: per-member spend + savings + chronic meds |
| No NPPA overcharge alert | If price > NPPA ceiling → "Overcharge detected" alert |
| No voice-based medicine reminder for illiterate/elderly | Voice call reminder via Twilio + Vaani TTS |
| No risk classification before showing alternatives | HIGH/MEDIUM/LOW risk BEFORE savings shown |
| No CDSCO QR scanner for medicine authentication | CDSCO traceability QR decode built in |
| No insurance coverage check (Ayushman/CGHS/ESI) | Coverage tab → 3 schemes searchable by voice |
| No cart optimizer for monthly chronic medicine list | Cart Simulator: cheapest same-composition cart |
| No expiry tracker from medicine strip scan | Expiry OCR → reminder 30 days before |

### 4.4 Scope of Improvement (What Competitors Have → Build Next)

| Improvement | Competitor Reference | Priority |
|---|---|---|
| Drug-drug interaction checker (scan 2 meds together) | Medscape, DrugBank | P1 |
| CDSCO adverse event / recall alert | FDA drug recall system | P1 |
| Medicine authentication via PharmaSecure QR | PharmaSecure B2B | P1 |
| 12-month savings bar chart (spend vs saved) | Apollo 24/7 analytics | P1 |
| Community price reporting (users flag overcharge) | Citizen reporting model | P2 |
| Chronic care projections (5-year savings if switch) | Insurance actuarial model | P2 |
| ABDM health record integration | ABDM API | P2 |
| Teleconsultation for generic switch advice | Practo, mFine | P2 |
| B2B kirana/pharmacy dashboard | PharmEasy B2B | P3 |
| Medicine delivery via Jan Aushadhi home delivery pilot | PMBI delivery pilot | P3 |

---

## SECTION 5: COMPLETE FEATURE SUITE

| # | Feature | Status |
|---|---|---|
| 1 | Camera scan (medicine strip, bottle, label) | ✅ LIVE |
| 2 | Image / PDF upload | ✅ LIVE |
| 3 | Voice — speak medicine name (Hindi + English) | ✅ LIVE |
| 4 | CDSCO QR code scan | ✅ LIVE |
| 5 | Text search by medicine name | ✅ LIVE |
| 6 | Same-composition alternatives (strict match) | ✅ LIVE |
| 7 | Jan Aushadhi price shown first | ✅ LIVE |
| 8 | Savings percentage and ₹ amount | ✅ LIVE |
| 9 | Risk classification (HIGH/MEDIUM/LOW) | ✅ LIVE |
| 10 | Nearest Jan Aushadhi store (GPS + pincode) | ✅ LIVE |
| 11 | Prescription decoder (DeepSeek OCR) | ✅ LIVE |
| 12 | Optimised cart simulator | ✅ LIVE |
| 13 | Family Wallet (Self/Mother/Father/Spouse/Child) | ✅ LIVE |
| 14 | Medicine purchase log + savings calc | ✅ LIVE |
| 15 | Refill reminder (browser push) | ✅ LIVE |
| 16 | Expiry reminder (≤7d / ≤30d / OK buckets) | ✅ LIVE |
| 17 | Daily dose reminder | ✅ LIVE |
| 18 | Doctor appointment reminder | ✅ LIVE |
| 19 | Ayushman Bharat coverage check | ✅ LIVE |
| 20 | CGHS coverage check | ✅ LIVE |
| 21 | ESI coverage check | ✅ LIVE |
| 22 | Health File integration (embedded) | ✅ LIVE |
| 23 | Medicine literacy education (5 primers) | ✅ LIVE |
| 24 | Demo mode (sample data, no real scan) | ✅ LIVE |
| 25 | 9-language UI (EN/HI + 7 Indian) | ✅ LIVE |
| 26 | NPPA overcharge detection | ⭐ BUILD |
| 27 | Drug-drug interaction checker | ⭐ BUILD |
| 28 | Medicine authentication (PharmaSecure QR) | ⭐ BUILD |
| 29 | 12-month savings bar chart | ⭐ BUILD |
| 30 | WhatsApp + Twilio voice reminder channels | 🔶 PARTIAL |
| 31 | Community price reporting | ⭐ BUILD |
| 32 | Chronic care projection (5-year savings) | ⭐ BUILD |
| 33 | CDSCO adverse event / recall alert | ⭐ BUILD |
| 34 | ABDM health record integration | ⭐ BUILD |
| 35 | 26-language full support (currently 9) | ⭐ BUILD |
| 36 | Vaani panel integration (← Vaani back button) | ⭐ BUILD |
| 37 | Voice-first full flow (scan → save by voice only) | 🔶 PARTIAL |

---

## SECTIONS 6-16: FEATURE SPECIFICATIONS

### Section 6: Scan Engine
**LIVE:** Camera scan, image/PDF upload, voice name input, CDSCO QR decode, text search
**API:** POST /api/medupi/scan → DeepSeek vision → composition extract → alternatives lookup
**BUILD ⭐:** NPPA overcharge detection (if price > ceiling → alert), PharmaSecure authentication

### Section 7: Composition Matching & Risk Classification
**LIVE:** Strict same molecule + strength + form matching. Never therapeutic alternatives.
Risk bands: HIGH (antibiotics/cardiac/diabetes/BP/psychiatric/anti-cancer/thyroid/anticoagulants) → STOP prompt. MEDIUM (painkillers/fever/antacids) → mild disclaimer. LOW (vitamins/basic OTC) → full output.
**BUILD ⭐:** Drug-drug interaction check when >1 medicine scanned. CDSCO recall alert.

### Section 8: Jan Aushadhi Intelligence
**LIVE:** Jan Aushadhi price shown first on every result. Nearest store finder (GPS + pincode). 15,032 stores indexed.
**BUILD ⭐:** Stock check at specific store (phone call check). Map view for all stores within 5km. Mobile van schedule for rural areas.

### Section 9: Family Wallet
**LIVE:** Self/Mother/Father/Spouse/Child profiles. Per-member purchase log. Savings auto-calculated. Total spend + saved + annual projection. Family Wallet preview via /api/medupi/family/wallet.
**BUILD ⭐:** 12-month spend vs savings bar chart. Chronic medicine tracker per member. Family share (daughter manages mother's wallet from her phone).

### Section 10: Reminder Engine
**LIVE:** Refill / expiry / dose / doctor appointment reminders. Browser push notification. Medicine Cabinet → expiry buckets (EXPIRED/≤7d/≤30d/OK). Daily scan at 08:00 IST.
**BUILD ⭐:** WhatsApp channel (WhatsApp Business API). Twilio voice call for elderly without smartphones. SMS fallback. Expiry OCR from medicine strip scan.

### Section 11: Insurance Coverage Check
**LIVE:** Ayushman Bharat (PM-JAY), CGHS, ESI → type medicine name → check coverage.
**BUILD ⭐:** Private health plan coverage (when insurers expose API). Receipt OCR for claim filing. PM-JAY hospital network check for medicine availability.

### Section 12: Prescription Decoder
**LIVE:** Upload full prescription → DeepSeek vision → extract medicines + dose + frequency + follow-up date → auto-create reminders. Integrated with Health File.
**BUILD ⭐:** Handwritten doctor name + registration number OCR. Drug-drug interaction check on full prescription. Auto-map each medicine to Jan Aushadhi alternative.

### Section 13: Optimised Cart Simulator
**LIVE:** Drop full monthly medicine list → cheapest same-composition cart → monthly + annual savings.
**BUILD ⭐:** Subscription mode (auto-remind to reorder each month). Cart sharing with family member. WhatsApp share of savings report.

### Section 14: Health File Integration
**LIVE:** Health File embedded as tab in MedUPI. Same AES-256-GCM backend. Same family profiles via localStorage. Prescription upload on Health File auto-populates MedUPI reminders.

### Section 15: Learn Tab
**LIVE:** 5 medicine literacy primers — What is a generic? / What is composition? / What is NPPA? / Schedule H / Bioequivalence / 5 questions to ask your doctor.
**BUILD ⭐:** Video explainers in Hindi. Community Q&A (what did other users ask?). ASHA worker training module.

### Section 16: Savings Tracker
**LIVE:** Per purchase: brand price vs Jan Aushadhi price vs actual savings. Running total.
**BUILD ⭐:** Annual savings certificate (shareable PDF). 12-month chart. 5-year chronic care projection. Community savings leaderboard (anonymised district-level).

---

## SECTION 17: GUARDRAILS (SAFETY)

| Guardrail | Rule |
|---|---|
| HIGH risk medicines | STOP prompt before any alternative shown. Always: "Doctor se puchein pehle." |
| Schedule H medicines | "Yeh prescription-only medicine hai. Bina doctor ke mat lena." |
| No medical advice | Every response ends with "Doctor / pharmacist se confirm karein." |
| NPPA ceiling | If price > ceiling → "Overcharge alert — NPPA ceiling price ₹X" |
| No fake prices | All prices from NPPA/DPCO/Jan Aushadhi DB — never fabricated |
| No selling | No affiliate links, no commission, no delivery push |
| No clinical diagnosis | Chitti reads labels — never diagnoses conditions |
| Drug interaction | If >1 HIGH risk med scanned together → mandatory interaction warning |
| Polypharmacy flag | If >5 meds in cart → "Itni dawaiyaan ek saath? Doctor ko batao." |
| Family data | All wallet data on-device. No server-side PII. |
| Chitti forget | Wipes all medicine history, wallet, reminders on command |

---

## SECTION 18: EVALS

| Eval | Target | Current |
|---|---|---|
| Composition match accuracy | ≥ 95% | ✅ LIVE |
| Risk classification accuracy | 100% HIGH meds flagged | ✅ LIVE |
| OCR accuracy (printed prescription) | ≥ 90% | ✅ LIVE |
| OCR accuracy (handwritten) | ≥ 70% | 🔶 Partial |
| Jan Aushadhi price accuracy vs PMBI | ±5% | ✅ LIVE |
| NPPA overcharge detection | ≥ 95% | ⭐ BUILD |
| Nearest store accuracy | Correct city/pincode ≥ 95% | ✅ LIVE |
| Reminder fire accuracy | 100% on schedule | ✅ LIVE |
| Voice medicine name recognition (Hindi) | ≥ 90% | ✅ LIVE |
| 26-language support | 26/26 | 9/26 LIVE |
| Hallucination audit | No fabricated prices | ✅ Verified |

---

## SECTION 19: OBSERVABILITY

| Metric | Alert |
|---|---|
| Scan success rate | < 90% → review OCR model |
| HIGH risk flag rate | Unexpected spike → review classifier |
| Jan Aushadhi price staleness | > 7 days → refresh PMBI data |
| Reminder delivery rate | < 95% → alert |
| API response time | > 3s → critical |
| Self-ping /health | Every 4 min, non-200 → email Sire |

---

## SECTION 20: SWARM INTELLIGENCE

- Anonymised scan data: which medicines scanned most, which savings accepted, which alternatives rejected
- ≥ 100 confirmations before updating medicine DB
- Community overcharge reports: if 10+ users flag same pharmacy for same medicine → community alert
- Fake medicine detection: if multiple users report same QR batch as suspicious → CDSCO report
- Seasonal pattern: monsoon medicines spike → proactive reminders sent
- All swarm data: anonymised, 'Chitti forget' removes contribution

---

## SECTION 21: ROLE

### Identity
You are Chitti MedUPI. India's trusted family pharmacist — available 24/7, never sells anything, always shows Jan Aushadhi first, always warns about risks before savings, and speaks your language.

### Mission
Save every Indian family ₹10,000+ annually on medicine bills through composition transparency, Jan Aushadhi access, and smart reminders — without ever giving medical advice.

### Accessed Through
Chitti Vaani → user scans medicine photo or says medicine name → Vaani routes here as panel. User never opens MedUPI directly.

### Non-Negotiables
- Jan Aushadhi price always shown first
- HIGH risk medicines always get STOP prompt — never skip
- NPPA ceiling price always checked — overcharge always flagged
- Never recommend replacing a medicine — inform only
- Doctor/pharmacist disclaimer on every single response
- No selling, no commission, no delivery push
- 'Chitti forget' always wipes all medicine data

---

## SECTION 22: SKILLS (10 SKILLS)

| # | Skill | What It Does | Status |
|---|---|---|---|
| 1 | Scan Engine | Camera/voice/text → composition extract via DeepSeek vision | ✅ LIVE |
| 2 | Composition Matcher | Strict same-molecule + strength + form matching | ✅ LIVE |
| 3 | Risk Classifier | HIGH/MEDIUM/LOW risk band before alternatives shown | ✅ LIVE |
| 4 | Jan Aushadhi Finder | Nearest store by GPS/pincode + Jan Aushadhi price first | ✅ LIVE |
| 5 | Prescription Decoder | OCR full prescription → extract + remind + Jan Aushadhi map | ✅ LIVE |
| 6 | Family Wallet | Per-member spend + savings + chronic med tracking | ✅ LIVE |
| 7 | Reminder Engine | Refill/expiry/dose/appointment via push/WhatsApp/voice | ✅ LIVE (push only) |
| 8 | Insurance Checker | Ayushman/CGHS/ESI coverage by medicine name | ✅ LIVE |
| 9 | Cart Simulator | Optimised monthly medicine cart → cheapest same-composition | ✅ LIVE |
| 10 | Savings Tracker | Per purchase and running total, annual projection | ✅ LIVE |

---

## SECTION 23: SOP (8 PROCEDURES)

| SOP | Name | Key Steps |
|---|---|---|
| SOP 01 | Scan Flow | Input (camera/voice/text/upload) → DeepSeek extract composition → match DB → risk classify → show Jan Aushadhi first → alternatives → savings |
| SOP 02 | HIGH Risk Flow | Scan result → HIGH risk detected → STOP prompt → "Doctor se puchein" → user confirms → then show alternatives with strong disclaimer |
| SOP 03 | Prescription Decode | Upload image → DeepSeek vision OCR → extract each medicine + dose + frequency → Jan Aushadhi map each → auto-create reminders → save to Health File |
| SOP 04 | Family Wallet Log | Select member → log purchase (brand + price paid) → auto-calc savings vs Jan Aushadhi → update running total → annual projection |
| SOP 05 | Reminder Create | User sets refill/expiry/dose/appointment → schedule in backend → browser push at time → WhatsApp/Twilio fallback (when wired) → read aloud via TTS |
| SOP 06 | NPPA Overcharge Check | Scan branded price → check vs NPPA/DPCO ceiling → if price > ceiling → "Overcharge alert: NPPA max ₹X, you were quoted ₹Y" → suggest consumer helpline 1800-11-4000 |
| SOP 07 | Insurance Check | User types/speaks medicine name → classify therapeutic category → check Ayushman/CGHS/ESI list → "Covered" / "Not covered" / "Check with your TPA" |
| SOP 08 | Vaani Handoff | Load page with ?from=vaani&input= → show ← Vaani button → decode input (medicine name or image) → pre-fill scan field → run SOP 01 automatically |

---

## SECTION 24: TECHNICAL ARCHITECTURE

```
Frontend: chitti_medupi.html (GitHub Pages)
Backend: chitti-shares-api (Railway Node.js)
  ├── /api/medupi/scan         → composition lookup
  ├── /api/medupi/alternatives → same-composition matches
  ├── /api/medupi/janaushadhi  → nearest store finder
  ├── /api/medupi/insurance    → Ayushman/CGHS/ESI check
  ├── /api/medupi/family/wallet → family spend data
  ├── /api/medupi/reminders    → schedule + fire reminders
  └── /health                  → self-ping every 4 min

Database: Turso (libSQL embedded replica)
  ├── medicines table          → composition + risk + NPPA price
  ├── jan_aushadhi table       → 15,032 stores + products + prices
  ├── family_wallet table      → per-device, per-member spend/savings
  └── reminders table          → scheduled push/WhatsApp/voice

AI: DeepSeek (deepseek-chat + vision)
  ├── Prescription OCR         → extract medicines from image
  ├── Composition classify     → identify risk band
  └── Consumer explanation     → plain Hindi/English medicine info

Data Sources:
  ├── PMBI Jan Aushadhi DB     → official product + price list
  ├── NPPA/DPCO ceiling prices → overcharge detection
  ├── Ayushman Bharat list     → PM-JAY coverage
  ├── CGHS drug list           → government employee coverage
  └── ESI medicine list        → worker scheme coverage
```

---

## SECTION 25: BUILD ORDER (10 PHASES)

### BO1: Vaani Integration (Panel + Handoff)
**✅ EXISTS:** Full page works standalone
**⭐ BUILD:**
- checkVaaniHandoff() — detect ?from=vaani, show ← Vaani button
- prefillSpecialist(input) — auto-fill scan field with Vaani's input
- postMessage closeSpecialist to parent when back tapped
- 26-language selector (currently 9, needs 26 with honest badges)
- 5-element widget on every result card (currently missing on some)
**Tests:** 20+ | **Timeline:** 2 hours

### BO2: NPPA Overcharge Detection
**✅ EXISTS:** Nothing — gap identified in research
**⭐ BUILD:**
- Fetch NPPA/DPCO ceiling price DB (public, updated quarterly)
- On every scan: compare branded price vs NPPA ceiling
- If price > ceiling → red "Overcharge alert" card
- "Consumer helpline: 1800-11-4000" always shown on alert
- AuditLog: log every overcharge detected
**Tests:** 30+ | **Timeline:** 3 hours

### BO3: Drug-Drug Interaction Checker
**✅ EXISTS:** Nothing — gap identified in research
**⭐ BUILD:**
- When user scans/adds 2+ medicines → check interaction
- DrugBank API or simplified India-adapted interaction DB
- HIGH interaction → stop prompt "Yeh dono dawaiyaan saath mein? Doctor ko zaroor batao"
- MEDIUM → yellow warning with explanation
- LOW / none → clear
**Tests:** 30+ | **Timeline:** 4 hours

### BO4: Reminder Channel Completion
**✅ EXISTS:** Browser push, daily scan at 08:00 IST
**⭐ BUILD:**
- WhatsApp Business API channel for refill/dose reminders
- Twilio voice call for elderly without smartphones
- SMS fallback via MSG91
- Expiry date OCR from medicine strip (scan → extract expiry → auto-reminder)
**Tests:** 30+ | **Timeline:** 3 hours

### BO5: 12-Month Savings Chart
**✅ EXISTS:** Running total in text
**⭐ BUILD:**
- Bar chart: 12 months spend (red) vs savings (green) — Chart.js
- Plain-language commentary: "Is mahine ₹X bachaya — saal ka ₹Y hua"
- Annual savings certificate (shareable PDF via jsPDF)
- WhatsApp share button with savings summary
**Tests:** 10+ | **Timeline:** 2 hours

### BO6: Community Price Reporting
**✅ EXISTS:** Nothing
**⭐ BUILD:**
- After any scan: "Aapko yeh medicine kitne mein mili?" → user reports actual price
- If reported price > NPPA ceiling by > 20% → anonymised community alert
- ≥5 reports on same pharmacy → "Overcharge flag" near that pincode
- Annual report to NPPA (aggregate, anonymised by district)
**Tests:** 20+ | **Timeline:** 3 hours

### BO7: CDSCO Authentication + Recall Alert
**✅ EXISTS:** CDSCO QR scan → decode only
**⭐ BUILD:**
- PharmaSecure QR → verify authenticity via PharmaSecure API
- CDSCO drug recall list (RSS feed) → alert if scanned medicine on recall list
- Fake medicine detected → community alert to nearby users
- Annual fake medicine report to FSSAI/CDSCO
**Tests:** 20+ | **Timeline:** 3 hours

### BO8: Family Wallet Completion
**✅ EXISTS:** Per-member purchase log, spend/savings, monthly wallet view
**⭐ BUILD:**
- 12-month bar chart per family member
- Chronic medicine tracker (auto-detect if same medicine reordered monthly)
- 5-year chronic care projection if switch to Jan Aushadhi
- Family share: daughter sees mother's wallet (opt-in, read-only)
- Polypharmacy flag: if >5 chronic meds → "Doctor ko poori list dikhao"
**Tests:** 30+ | **Timeline:** 3 hours

### BO9: ABDM Integration
**✅ EXISTS:** Health File integration (embedded tab)
**⭐ BUILD:**
- ABDM Health ID link: user connects → medicines from ABDM health locker auto-sync
- Share medicine history with doctor via ABDM-compliant format
- PM-JAY hospital network check for specific medicine
- Receipt OCR → claim file PDF → submit to insurer
**Tests:** 20+ | **Timeline:** 4 hours

### BO10: 26-Language Support + Certification
**✅ EXISTS:** 9 languages (EN/HI + 7 Indian)
**⭐ BUILD:**
- Full 26-language support via Bhashini cascade (honest mock badges for tribal)
- Voice medicine name recognition in all 26 languages
- TTS reminder in user's language ("Aapki Metformin ka refill karo kal tak")
- Twilio voice reminder in 9 primary languages
- Real-user testing: elderly grandmother, illiterate farmer, blind user
- Product audit: 8 sections PASS
**Tests:** 100+ | **Timeline:** 6 hours

### OVERALL BUILD ORDER SUMMARY

| BO | Name | Status | Hours |
|---|---|---|---|
| BO1 | Vaani Integration | ⭐ BUILD | 2h |
| BO2 | NPPA Overcharge Detection | ⭐ BUILD | 3h |
| BO3 | Drug-Drug Interaction | ⭐ BUILD | 4h |
| BO4 | Reminder Channels | 🔶 PARTIAL | 3h |
| BO5 | 12-Month Chart | ⭐ BUILD | 2h |
| BO6 | Community Price Reporting | ⭐ BUILD | 3h |
| BO7 | CDSCO Authentication | ⭐ BUILD | 3h |
| BO8 | Family Wallet Completion | ⭐ BUILD | 3h |
| BO9 | ABDM Integration | ⭐ BUILD | 4h |
| BO10 | 26-Language + Certification | ⭐ BUILD | 6h |
| **TOTAL** | | | **~33 hours** |

---

## SECTION 26: QUALITY GATES (G0-G10)

| Gate | PASS Criteria |
|---|---|
| G0 | Should this exist? Score ≥ 80 → YES — 15,032 Jan Aushadhi stores, ₹30,000 crore savings potential |
| G1 | All 33 CEOS sections complete |
| G2 | UI: risk badge always before savings, Jan Aushadhi always first |
| G3 | 37 features tested — scan/compare/reminder/family/insurance |
| G4 | User journeys: elderly voice scan, illiterate camera scan, blind TTS flow, diabetic cart simulator |
| G5 | 9 accessibility profiles, 26 langs (honest badges), TalkBack certified |
| G6 | 20 medicine apps + 20 AI platforms cited with gap analysis |
| G7 | 15 weaknesses documented |
| G8 | No fabricated prices — all from PMBI/NPPA/DPCO |
| G9 | Founder audit: would Sire's mother use this for her diabetes medicines? |
| G10 | Production readiness ≥ 90/100 |

---

## SECTION 27: QUALITY METRICS

| Metric | Target | Current |
|---|---|---|
| Composition match accuracy | ≥ 95% | ✅ LIVE |
| HIGH risk flag — never miss | 100% | ✅ LIVE |
| OCR printed prescription | ≥ 90% | ✅ LIVE |
| Jan Aushadhi price vs PMBI | ±5% | ✅ LIVE |
| Nearest store accuracy | ≥ 95% | ✅ LIVE |
| NPPA overcharge detection | ≥ 95% | ⭐ BUILD |
| Voice recognition (Hindi medicines) | ≥ 90% | ✅ LIVE |
| Reminder delivery | ≥ 95% | ✅ LIVE |
| Hallucination: no fake prices | Zero tolerance | ✅ Verified |
| 26-language support | 26/26 | 9/26 |

---

## SECTION 28: PRODUCT AUDIT

**Can elderly user scan a medicine strip and see Jan Aushadhi price by voice?**
**Does HIGH risk medicine always show STOP prompt — never skip?**
**Is Jan Aushadhi price always first — never buried below branded options?**
**Does every result card have the 5-element widget (🔊🤖👍👎✏️)?**
**Does doctor/pharmacist disclaimer appear on every single result?**
**Is there zero selling, zero affiliate link, zero delivery push?**
**Can blind user complete full scan → Jan Aushadhi alternative by TTS?**
**Does 'Chitti forget' wipe ALL medicine wallet data immediately?**

---

## SECTION 29: CERTIFICATION CRITERIA

**CONDITIONAL CERTIFIED:** BO1-BO5 complete, G0-G9 PASS, 9 languages, Vaani panel integration working
**FULLY CERTIFIED:** All BOs complete, 26 languages, ABDM integrated, community reporting live, ≥ 4.5 Play Store rating

---

## SECTION 30: DELIVERABLES

**Updated files:** chitti_medupi.html (Vaani handoff + 26 langs + NPPA alert + DDI checker + ABDM)
**Backend endpoints:** /api/medupi/nppa, /api/medupi/interaction, /api/medupi/recall, /api/medupi/abdm
**New data:** NPPA ceiling price DB, DrugBank India interaction subset, CDSCO recall RSS feed
**Docs:** ceos_medupi.md → push to repo root → sahayai.in/ceos_medupi.md

---

## SECTION 31: SUCCESS METRICS

| Metric | Target |
|---|---|
| Jan Aushadhi savings per user per month | ≥ ₹500 |
| Annual family savings | ≥ ₹6,000 |
| HIGH risk medicines correctly flagged | 100% |
| NPPA overcharges caught | ≥ 80% of above-ceiling cases |
| Prescription decode accuracy | ≥ 85% |
| Reminder adherence (refill on time) | > 70% |
| DAU (30 days post-launch) | > 5,000 |
| NPS | > 65 |

---

## SECTION 32: RISK DISCLOSURE & LEGAL

**Compliance:** CDSCO guidelines · NPPA/DPCO pricing norms · Telemedicine Practice Guidelines · ABDM-ready · DPDP Act 2023 · No selling of personal health data

**Mandatory disclaimer on every result:**
"Chitti MedUPI provides informational insights only. Same-composition alternatives shown — not therapeutic alternatives. Consult your doctor or pharmacist before switching any medicine. HIGH risk medicines must never be switched without medical advice. Prices are indicative. Chitti does not sell medicines or earn commission."

**Consumer helpline:** 1800-11-4000 (overcharging complaints)
**Grievance:** sire@sahayai.in | 7 working days (IT Rules 2021)

---

## SECTION 33: SIGN-OFF

| Role | Name | Date |
|---|---|---|
| Sire (Product Owner) | Bryan Wilfred Pinto | June 2026 |
| AI Architect | Claude (Anthropic) — Verified | June 2026 |
| Pharmacy Domain Expert | _______________ | _______ |
| QA Lead | _______________ | _______ |

---

**CEOS COMPLETE — CHITTI MEDUPI**
**Sections: 33 | Skills: 10 | SOPs: 8 | Build Phases: 10 | Version: 1.0 | June 2026**
**Push to:** repo root as `ceos_medupi.md` → live at `https://sahayai.in/ceos_medupi.md`
