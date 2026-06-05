# CHITTI MedUPI — Master Specification

**Version:** 1.8 (Phase 7 P1 + agentic /ask)
**Date:** 2026-05-08
**Author:** Bryan Wilfred Pinto · drafted by Claude
**Status:** LIVING DOCUMENT — every Claude session must read this first.

> "UPI for your medicine bills — Scan. Compare. Save."

---

## 0. Where this product sits

```
Chitti (parent brand)
├── Chitti Shares
│   ├── Chitti Technical    (chitti_complete_technical.html)
│   └── Chitti Fundamentals (chitti_fundamentals.html)
└── Chitti MedUPI           (chitti_medupi.html)        ← THIS PRODUCT
```

Sibling product file at the workspace root. Same Bharat Premium theme. Same backend pattern under `chitti-shares/backend/` (or a new `chitti-medupi/backend/` if we split). Same four-user contract.

---

## 0a. Sibling capability — Chitti Health Scanner (NEW, in the MedUPI family)

**Chitti Health Scanner** is a new visual-health capability that joins the MedUPI family alongside Chitti MedUPI (medicine cost) and Chitti Health File (records / timeline). It lets a user point the phone camera at skin, eyes, teeth, wounds, nails, hair and more, and — when the AI vision capability ships — helps them **notice** patterns worth a professional's attention.

```
Chitti MedUPI family
├── Chitti MedUPI         (chitti_medupi.html)          — medicine cost intelligence
├── Chitti Health File    (records / timeline)          — every scan feeds this
└── Chitti Health Scanner (chitti_health_scanner.html)  ← NEW visual-health capability
```

| Field | Value |
|---|---|
| **What it is** | Visual-health scanner — DETECTS / NOTICES patterns and **ESCALATES** to a professional. Golden line: *"Chitti helps you notice — doctors help you heal."* |
| **Backend** | Extends `chitti-medupi-api` with **`/api/health-scanner/*`** (shared backend, not a new service). |
| **Frontend** | **`chitti_health_scanner.html`** (page skeleton built). |
| **Doc set** | COSDF v1.0 (Chitti Organ-Scan Discipline Framework — 15 levels) lives under **`chitti-health-scanner/`**. See `chitti-health-scanner/README.md`. |
| **Status** | **Honest skeleton** — AI vision models are **NOT built / NOT clinically validated**. All analysis endpoints return honest **`501 coming_soon`**. Every research accuracy number (skin 95%, dental 89–97%, etc.) is a **TARGET / research benchmark, never an achieved result**. Certification scores stay **BLANK (`___%`)** until measured. |
| **Safety** | **NEVER diagnoses** — no "you have <disease>", no prescriptions, no certainty, no fear-mongering, no shaming. Every output carries confidence level + plain-language explanation + suggested action (🟢 monitor / 🟡 consider consult / 🔴 seek care) + the disclaimer **"This is not a medical diagnosis."** Honest about lower accuracy on darker / Fitzpatrick IV–VI skin tones. |
| **Cross-links** | Feeds the **Chitti Health File** timeline on every confirmed scan; cross-links to **MedUPI** (Jan Aushadhi generics) and **Chitti Government** (PMJAY). |

Same locked platform rules as MedUPI apply unchanged: DeepSeek-only LLM (vision via DeepSeek-vision, disclaimer-guarded), four-user accessibility (Blind / Deaf / Mute / Illiterate — voice IN + voice OUT + icons/symbols + plain language, never colour-only), multilingual via the shared substrate (no Hinglish), the Golden Rule confirm gate (opening camera / capturing / saving / sharing all pass *"Sire, shall I open the camera? Haan / Nahi"*), the per-response widget (`data-chitti-response` + 🔊 / 🤖 / 👍 / 👎), and camera-intelligence privacy (health images **AES-256-GCM** encrypted at rest, user-owned, never sold, anonymised before any aggregate, "Chitti forget" deletes all; DPDP 2023 + ABDM-aware).

---

## 1. Product Overview

| Field | Value |
|---|---|
| **Product Name** | Chitti MedUPI |
| **Short Name** | MedUPI |
| **Tagline** | "UPI for your medicine bills — Scan. Compare. Save." |
| **Category** | AI-powered Medicine Cost Intelligence & Family Health Finance Assistant |
| **Mission** | Make healthcare affordable, transparent, and stress-free for every Indian family — especially the common man. |
| **Target users** | Tier-2/3 city families (Bhopal, Indore, Pune, Lucknow), middle / lower-middle class, chronic patients (diabetes / BP / thyroid), elderly parents, daily-wage earners. |
| **Live URL** | `https://sahayai.in/chitti_medupi.html` |
| **Backend** | `chitti-shares-api-production.up.railway.app` (shared with Shares for now; carve to own service if scale demands) |

**Why the name works:** "MedUPI" reads instantly as *Medical UPI* — the same instant, simple, transparent intelligence UPI brought to payments, applied to medicine costs. "Chitti" adds a friendly, trustworthy Indian personality (helpful robot + "small/affordable helper").

**Positioning:**
- ✅ IS the neutral price + composition intelligence layer.
- ❌ NOT a doctor, pharmacist, prescription engine, or e-pharmacy.

---

## 2. Why this is a game-changer for the common man

In India, medicines are **50–70% of out-of-pocket healthcare spend**. Chronic-illness families spend **₹8,000–15,000+/year** on medicines alone — driving financial stress, skipped doses, debt.

Chitti MedUPI delivers:

| Benefit | Impact |
|---|---|
| **Huge monetary savings** | Surfaces Jan Aushadhi + quality generics (50–90% cheaper, average 60–70% off branded). Same CDSCO standard, same bioequivalence. **₹5,000–₹12,000/year savings** for a typical family. |
| **Removes information asymmetry** | Most people don't know equivalent options exist or where the nearest Jan Aushadhi is. One scan closes the gap. |
| **Family financial relief** | Tracks complete monthly medicine spend + shows clear savings opportunities. |
| **Better adherence** | Refill reminders + expiry alerts cut wastage and stock-outs. |
| **Confidence builder** | Users walk into doctor / pharmacist conversations informed. |
| **Accessibility** | Hindi-first, voice support, simple UI, large font — usable by elderly + low-literacy users. |
| **Long-term impact** | Reduces chronic-disease financial burden, improves adherence, prevents catastrophic health expenses for millions. |

**Positioning verdict:** A *personal medicine bill bodyguard* — turning confusion and overpayment into transparency, control, and repeated savings.

---

## 3. Reference apps surveyed (build to copy + improve)

Bryan asked: study Tata 1mg, PharmEasy, NetMeds, Apollo 24|7. Here's the honest audit + what to copy + what to improve.

### 3.1 Tata 1mg

**Strengths to copy:**
- Comprehensive medicine information page (composition, uses, side effects, FAQs)
- Generic alternative finder (their signature feature)
- Prescription upload + reminder
- Subscription refills for chronic medicines
- Lab tests integration (out of scope for MedUPI)
- Doctor consultation (out of scope)
- Hindi + 10 regional languages — but mostly text translation, not voice

**Backend pattern (inferred):**
- Master drug database with brand, composition, manufacturer, MRP
- Recommendation engine for alternatives
- Order/cart/payment (out of scope for MedUPI)

### 3.2 PharmEasy

**Strengths to copy:**
- Clean cart UI with savings highlighted prominently
- Auto-refill subscription
- Family multi-profile
- Coupon/discount stacking shown clearly
- Insurance integration partial

**Pattern:**
- Real-time inventory across pharmacies
- Personalised pricing offers (likely deal-tier-based)

### 3.3 NetMeds

**Strengths to copy:**
- Generic substitutes shown front and centre on every product page
- "SoS" express delivery
- Subscription refills
- Lower-price generics highlighted with explicit savings %

### 3.4 Apollo 24|7

**Strengths to copy:**
- Health records vault (digital prescriptions stored)
- Doctor consult + pharmacy + lab + diagnostic combined (out of scope for MedUPI core)
- Family health profile

### 3.5 Common patterns across all four

1. Medicine search + product page with composition
2. Prescription upload (jpg / pdf)
3. Cart + checkout (NOT in MedUPI scope)
4. Family multi-profile
5. Refill reminders
6. Subscription
7. Insurance integration partial
8. Generic alternatives

### 3.6 What none of them does well — Chitti MedUPI's edge

| Gap | Chitti's edge |
|---|---|
| None show **Jan Aushadhi** integration end-to-end (composition match + nearest store + savings %) | Chitti makes Jan Aushadhi the headline — every scan suggests the nearest Jan Aushadhi store for the same composition |
| None show a **Family Medicine Wallet** with monthly spend tracking + chronic-care projections | Chitti's signature: "you saved ₹X this month / ₹Y this year" |
| None offer **voice INPUT in Hindi** for medicine search | Chitti voice-driven: speak the medicine name, get the result |
| None do **expiry alerts** for medicines already at home | Chitti scans the strip's expiry date and warns before throw-away |
| None do **risk classification** before showing alternatives | Chitti shows hard warnings on antibiotics/cardiac/diabetes/psych meds — no glib "switch to generic" |
| None integrate **CDSCO + NPPA + Jan Aushadhi master data** in one transparent layer | Chitti's neutral intelligence layer — not a pharmacy, not commission-driven |
| None have **insurance optimizer** for Ayushman Bharat / CGHS | Chitti flags whether your med is covered by your scheme |
| None have **community-driven price reporting** | Chitti lets users report local prices for cross-verification |

---

## 4. Input Channels

1. **Real-time camera scan** (medicine strip / bottle / prescription)
2. **Image / PDF upload** (gallery picker)
3. **Text input** (medicine name search)
4. **Voice input** (Hindi priority + English) — leverages browser Web Speech API, the same `🎤` mic pattern as Chitti Shares
5. **Family member sharing + multi-profile**

---

## 5. Core AI Pipeline (strict + safe)

```
[Input: image / PDF / text / voice]
      ↓
[1. Recognition Layer]   ← OCR + LLM extracts: brand · salt/composition · strength · dosage form · pack size
      ↓
[2. Standardization Engine] ← maps to CDSCO-approved generic molecules + NPPA pricing data
      ↓
[3. Matching Engine] ← STRICT: same molecule + same strength + same dosage form ONLY
      ↓                      NO therapeutic alternatives. NO different molecules. EVER.
[4. Intelligence Layer] ← equivalent brands (branded + generic + Jan Aushadhi)
                        · current market prices + NPPA ceiling
                        · potential savings %
                        · nearest Jan Aushadhi
                        · plain-English "why cheaper?" explanations
                        · risk classification + appropriate disclaimer
      ↓
[Output: structured response + always-visible disclaimer]
```

**Sample output:**

```
Scanned Medicine: Crocin 650
Composition: Paracetamol 650 mg Tablet
Equivalent Options:
  • Jan Aushadhi Generic → ₹8
  • Dolo 650 → ₹20
  • Calpol 650 → ₹22
Potential Savings: Up to 70%
Nearest Jan Aushadhi: 1.2 km away
Disclaimer: These are same-composition equivalents. Consult your doctor or pharmacist before any change.
```

---

## 6. Risk Classification (non-negotiable)

| Risk | Examples | Output style |
|---|---|---|
| **HIGH** | Antibiotics · Cardiac · Diabetes · BP · Psychiatric · Anti-cancer · Thyroid · Anticoagulants | Limited alternatives + STRONG warning. *"This medicine belongs to a category where substitution may impact treatment. Do not make any change without consulting your doctor."* |
| **MEDIUM** | Painkillers · Fever medicines · Antacids | Normal output + mild disclaimer. |
| **LOW** | Vitamins · Basic OTC (Vicks, salt, etc.) | Full output with friendly tone. |

The risk-classification engine reads from the master molecule table — every molecule tagged H/M/L. Frontend renders **DIFFERENT colour banner + DIFFERENT button text** based on risk: red banner + "ALWAYS ask your doctor before switching" for HIGH, amber + "Confirm with pharmacist" for MEDIUM, green + "Same composition, save money" for LOW.

---

## 7. Legal & Compliance Guardrails (non-negotiable)

### Chitti MedUPI MUST NEVER:
- ❌ Prescribe, diagnose, or recommend switching medicines
- ❌ Suggest dosage changes or different molecules
- ❌ Replace professional medical advice
- ❌ Sell or share personal health data

### Compliance standards:
- CDSCO guidelines
- NPPA / DPCO pricing norms
- Telemedicine Practice Guidelines
- ABDM (Ayushman Bharat Digital Mission) ready
- Digital Personal Data Protection Act compliant

---

## 8. Disclaimer Block (verbatim from Bryan — gold standard)

### 8.1 CORE MASTER DISCLAIMER (always visible on every results screen)

> Chitti Health Assist provides informational insights on medicines and their compositions. It does not prescribe, diagnose, or recommend treatment. Any alternative brands shown are based on the same composition, strength, and dosage form. Please consult your doctor or a qualified pharmacist before making any change to your medication.

### 8.2 SHORT UX VERSION (under each result)

> Same composition options shown. Please confirm with your doctor / pharmacist before switching.

### 8.3 NON-NEGOTIABLE LEGAL LINES

> - Chitti does not recommend replacing prescribed medicines.
> - Chitti does not provide medical advice.
> - Final decision must be taken by a licensed healthcare professional.

### 8.4 HIGH-RISK MEDICINE WARNING (dynamic — diabetes / BP / heart / antibiotics)

> This medicine belongs to a category where substitution may impact treatment. Do not make any change without consulting your doctor.

### 8.5 COMPOSITION CLARITY DISCLAIMER

> Equivalent medicines are identified based on matching active ingredients (salt), strength, and dosage form. Differences in brand, manufacturer, or inactive ingredients may exist.

### 8.6 PRICE DISCLAIMER

> Prices shown are indicative and may vary by location, pharmacy, and availability.

### 8.7 SCAN ACCURACY DISCLAIMER

> Medicine details are extracted using AI and may not be 100% accurate. Please verify the information before use.

### 8.8 LIABILITY LIMITATION (Terms & Conditions)

> Chitti Health Assist shall not be liable for any direct, indirect, incidental, or consequential outcomes resulting from the use of this information. Users are advised to consult licensed healthcare professionals before making any medical decisions.

### 8.9 GOLD STANDARD COMBINED BLOCK (default AI output template)

> **Chitti Health Assist provides informational insights only and does not prescribe, diagnose, or recommend treatment.**
> 
> The alternatives shown are based on matching composition (active ingredient), strength, and dosage form. Differences in brand, manufacturer, or inactive ingredients may exist.
> 
> Chitti does not recommend replacing any prescribed medicine. Please consult your doctor or a qualified pharmacist before making any changes.
> 
> Prices are indicative and may vary by pharmacy and location. Medicine details are extracted using AI and may not always be fully accurate.
> 
> For certain medicines (e.g., for diabetes, heart conditions, antibiotics), substitution without medical advice may impact treatment.

### 8.10 Brutal truth — disclaimer rules

- ❌ Skip disclaimer → legal trouble
- ❌ Hide disclaimer → consumer complaint risk
- ❌ Make it too complex → user ignores it

✅ Need BOTH a SHORT version (UX) AND a FULL version (legal).

> The disclaimer is your *Legal Firewall + Trust Builder.* Not just protection — it actively builds credibility.

### Implementation pattern (matches Chitti Shares' SEBI banner)

- **Sticky amber bar at top** of every page: "MEDICAL DISCLAIMER · Informational only, not medical advice. Read full disclaimer →"
- **"Read full disclaimer" link** opens modal with the full Gold Standard text (8.9) + section 8.4 if HIGH risk
- **Short caption** (8.2) printed under every result card
- **Hindi version** of every disclaimer auto-rendered when UI language is Hindi

---

## 9. Complete Feature List

### Core
- 📷 Medicine Scanner (OCR + composition detection)
- 💊 Price comparison + equivalent brand finder (same molecule + strength + form, ALWAYS)
- 💰 Savings calculator + Optimised Cart simulator
- 📄 Prescription upload + simple decoder (plain Hindi/English explanation per medicine — purpose only, never advice)
- 🏥 Jan Aushadhi store locator with distance
- 🏪 Hyper-local cheapest pharmacy suggestions

### Family & Tracking
- 👨‍👩‍👧 Family Medicine Wallet (multi-profile: self / parents / children)
- 📈 Monthly cost tracker + spending reports
- 🔔 Smart refill reminders
- 📅 Expiry-date scanner + alerts for medicines at home
- 🩺 Chronic Care Mode (diabetes / BP / thyroid — long-term cost projections)

### Advanced Intelligence
- 🛡️ Insurance optimiser (Ayushman Bharat / CGHS / private)
- 📍 Community-driven local price reporting
- 💬 Soft doctor prescription pattern insights ("This salt has X equivalent options" — non-accusatory)
- 📚 Educational "Why is this cheaper?" notes

### UX
- 🌐 Full Hindi + English (voice in/out)
- 🔍 Large font mode for elderly users
- 📴 Offline support for common medicines
- 👨‍👩‍👧‍👦 Family sharing + dashboard

---

## 10. Trust, UX & Design Guidelines

- **Tone:** Friendly, helpful "Chitti" — trusted family assistant
- **Design:** Clean, simple, trustworthy — green / blue accent on the Bharat Premium base (saffron / navy / gold from Chitti Shares — MedUPI uses the SAME Bharat theme for consistency, with green tinting for the medical-safe semantic)
- **Risk-appropriate warnings on every output**
- **Mandatory disclaimer never out of sight**
- **Speed + simplicity + clarity** in that order

---

## 11. Technical & Monetisation Notes

- **Master drug DB** updated regularly — sourced from NPPA + Jan Aushadhi public lists + CDSCO public data
- **Strong privacy architecture** — no resale, no third-party tracking, encrypted personal data
- **Monetisation:**
  - Core functionality: 100% free (mass adoption is the goal)
  - Optional premium: advanced analytics (chronic-care projections, family-wide insurance matching)
  - Affiliate links only when transparent (no hidden pushes)

### Success metrics
- Consistent user-reported savings
- High retention via daily/weekly tracker usage
- Zero regulatory complaints
- Strong adoption in Tier-2/3 cities

---

## 12. Architecture (ChITTI MedUPI build plan)

### 12.1 Frontend (`chitti_medupi.html`)

Single-file HTML at workspace root (matches `chitti_complete_technical.html` and `chitti_fundamentals.html` pattern). Bharat Premium theme + Hindi UI toggle + four-user contract baked in from line 1.

**Tab structure (8 tabs):**

```
[📷 Scan] [💊 Compare] [👨‍👩‍👧 Family Wallet] [📅 Reminders] [🏥 Jan Aushadhi] [🛡️ Insurance] [🎓 Learn] [⚙️ Settings]
```

Plus header:
- Bharat C logo + "Chitti MedUPI" + tagline
- Switch buttons: Chitti Technical · Chitti Fundamentals
- EN / हिं language toggle
- Demo Mode · Read page · Hear disclaimer

Plus sticky **medical disclaimer banner** at the very top + full legal modal.

### 12.2 Backend (`chitti-medupi/backend/` — sister to `chitti-shares/backend/`)

```
chitti-medupi/backend/
├── main.py                  FastAPI app · CORS · startup seed · /health · /
├── config.py                Settings (DATABASE_URL · GEMINI_API_KEY · TWILIO · CORS)
├── database.py              SQLAlchemy engine + SessionLocal + get_db
├── requirements.txt         fastapi · sqlalchemy · anthropic · rapidfuzz · psycopg2-binary
├── runtime.txt              python 3.11.10
├── render.yaml              Railway Blueprint (web service + Postgres DB)
├── .env.example
├── data/
│   ├── medicines_seed.json           top 51 Indian retail brands
│   ├── jan_aushadhi_seed.json        25 representative stores across 12 states
│   └── insurance_coverage_seed.json  Ayushman / CGHS / ESI scheme + therapeutic-class tables
├── models/
│   ├── medicine.py             brand · salt · strength · form · MRP · Jan Aushadhi · risk · purpose_en/hi
│   ├── jan_aushadhi.py         store_code · lat · lng · address · hours
│   ├── family.py               profile (user_token-keyed)
│   ├── wallet.py               purchase entry · price_paid · cheapest_equivalent · savings_realized
│   └── reminder.py             refill / expiry / dose / appointment
├── services/
│   ├── medupi_database.py      fuzzy brand search · STRICT same-composition lookup · seed_if_empty
│   ├── medupi_pricing.py       savings %, NPPA-ceiling violation, chronic-care projection
│   ├── medupi_risk.py          80+ molecule → H/M/L map + EN/HI symbol/label/warning
│   ├── medupi_alternatives.py  strict matcher · risk-banded response · speak_en/hi · disclaimer_en/hi
│   ├── medupi_jan_aushadhi.py  haversine geo + by-state fallback · seed_if_empty
│   ├── medupi_recognition.py   Anthropic vision (image) + fuzzy text path
│   ├── medupi_family.py        profiles + wallet entries + monthly/annual report
│   ├── medupi_reminders.py     CRUD + Twilio voice stub
│   └── medupi_insurance.py     therapeutic-class coverage lookup
└── routes/
    └── medupi.py               14 endpoints under /api/medupi/* (X-User-Token light auth)
```

**Endpoints (planned):**

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/medupi/scan` | Upload image / PDF → returns recognised medicine + composition + risk |
| GET | `/api/medupi/medicine/{name}` | Lookup by name → composition + alternatives |
| GET | `/api/medupi/alternatives/{molecule}?strength=X&form=Y` | Strict same-composition match list |
| GET | `/api/medupi/jan_aushadhi?lat=&lng=&radius_km=5` | Nearby Jan Aushadhi stores |
| GET | `/api/medupi/risk/{molecule}` | Risk classification (HIGH/MEDIUM/LOW) |
| POST | `/api/medupi/family/profile` | Add family member profile (auth required) |
| GET | `/api/medupi/family/wallet?profile_id=` | Monthly spend + savings report |
| POST | `/api/medupi/reminder` | Schedule a refill / expiry reminder |
| GET | `/api/medupi/insurance/{molecule}?scheme=ayushman` | Whether covered + which |

### 12.3 Master drug database schema

```
Medicine(
  id, brand_name, salt_composition (text), salt_components (jsonb list of {molecule, strength, unit}),
  strength, dosage_form (tablet/syrup/injection/capsule/etc.), pack_size, manufacturer,
  mrp, nppa_ceiling_price, jan_aushadhi_price (nullable), jan_aushadhi_code (nullable),
  risk_class (H/M/L), schedule (H/H1/X/etc.), prescription_required (bool)
)
JanAushadhiStore(
  id, store_code, name, lat, lng, address, district, state, phone, hours, last_verified
)
FamilyProfile(user_id, profile_id, name, dob, relation, conditions [diabetes/BP/etc.])
WalletEntry(profile_id, medicine_id, qty, price_paid, scanned_at, savings_realized)
Reminder(profile_id, medicine_id, kind [refill/expiry], next_due, recurrence)
```

---

## 13. Build Status

### ✅ DONE — v1.4 backend + frontend wiring (2026-05-06)
- **New `chitti-medupi/` folder** at workspace root mirroring `chitti-shares/` shape — `frontend/index.html` + `backend/{main,config,database,routes/,services/,models/,data/}` + `render.yaml` + `runtime.txt` + `requirements.txt` + `.env.example` + `README.md`
- **Master drug DB**: 51-row seeded JSON (`backend/data/medicines_seed.json`) covering top Indian retail brands across paracetamol, antidiabetics, antihypertensives, antibiotics, statins, antacids, thyroid, antiplatelets, NSAIDs, antihistamines, vitamins, asthma, antiemetic, cold-remedy, ORS, insulin — each row with brand · salt · strength · dosage form · MRP · NPPA ceiling · Jan Aushadhi price + code · risk class · schedule · therapeutic class · plain-EN/HI purpose
- **Jan Aushadhi seed**: 25 representative stores across 12 states (`backend/data/jan_aushadhi_seed.json`) with lat/lng for haversine search
- **Insurance seed**: Ayushman / CGHS / ESI scheme metadata + therapeutic-class coverage tables (`backend/data/insurance_coverage_seed.json`)
- **SQLAlchemy models**: `Medicine`, `JanAushadhiStore`, `FamilyProfile`, `WalletEntry`, `Reminder` — registered via `models/__init__.py`
- **Services (all DB-backed, real logic, not stubs)**:
  - `medupi_database.py` — fuzzy brand search via rapidfuzz + STRICT same-composition lookup
  - `medupi_pricing.py` — savings %, NPPA-ceiling violation flag, chronic-care projection
  - `medupi_risk.py` — 80+ molecule → H/M/L map + symbol + EN/HI labels + EN/HI warning text
  - `medupi_alternatives.py` — strict matcher with EN/HI `speak_*`, `caption_*`, `disclaimer_*` baked into every response
  - `medupi_jan_aushadhi.py` — haversine geo lookup + by-state fallback
  - `medupi_recognition.py` — Anthropic Claude vision for image scan (no Tesseract install pain) + text-search path
  - `medupi_family.py` — multi-profile CRUD + wallet entries + monthly/annual report with EN/HI speak text
  - `medupi_reminders.py` — refill / expiry / dose / appointment CRUD + Twilio voice stub
  - `medupi_insurance.py` — coverage lookup keyed on therapeutic class
- **Routes**: `routes/medupi.py` mounting 14 endpoints under `/api/medupi/*` with light auth via `X-User-Token` header for family / wallet / reminders
- **FastAPI app** (`main.py`) with CORS, startup table-create + idempotent seed, `/health`, `/`
- **Risk-class engine** populated for 80+ molecules (top categories of HIGH/MEDIUM/LOW)
- **Frontend wired** — `chitti_medupi.html` + mirror at `chitti-medupi/frontend/index.html`:
  - Scan tab — camera capture (`<input capture=environment>`), gallery upload, voice search (Web Speech API), text search → all hit `/api/medupi/scan` or `/api/medupi/medicine/{name}` and render risk-banded results card with primary medicine + alternatives table + Jan Aushadhi prices + savings % + speak-aloud
  - Jan Aushadhi tab — "Find near me" (geolocation) + "By state" fallback → live results grid with map links
  - Insurance tab — molecule + scheme picker → live coverage answer with EN/HI explainer
  - Family Wallet — add profile, log entry, dashboard with this-month spend / saved + 12-month saved + annual projection + recent entries table
  - Reminders — add reminder, list active, mark done
  - Every result auto-speaks (EN or HI based on `_chittiLang`) — four-user contract honoured
- **Smoke tests**: all 18 backend Python files parse via `ast.parse`; all 3 JSON seeds load; HTML inline script parses via `node -e`

### ✅ DONE — v1.6 real-data loader (2026-05-06, second session)
- **`chitti-medupi/backend/scripts/`** — full loader CLI for replacing the 51-row seed with 2,000+ medicines and 11,000+ Jan Aushadhi stores from government + free public sources. NEVER scrapes Tata 1mg / PharmEasy / NetMeds / Apollo / Amazon Pharmacy (proprietary; ToS risk).
- **One CLI**, six per-source loaders:
  - `scripts/load_real_data.py` — `--source X --file Y --url Z --dry-run --reset --force --verbose`
  - `loaders/jan_aushadhi.py` — full 11,000+ store CSV/XLSX parser (column-name aliases for every common export variant)
  - `loaders/bppi_products.py` — Jan Aushadhi product price list (~2,000 medicines · MRP · drug code · therapeutic class) → upserts a `Jan Aushadhi <generic>` brand per row
  - `loaders/nppa.py` — NPPA ceiling-price list → updates `nppa_ceiling_price` on every existing brand sharing composition+strength+form; falls back to inserting a "Generic <molecule>" row when no brand matches
  - `loaders/cdsco.py` — CDSCO approved-formulations → updates `schedule` (H/H1/X/OTC) + `prescription_required` + `therapeutic_class` on existing rows
  - `loaders/rxnorm.py` — NIH RxNorm REST API enrichment (no key) → walks distinct molecules in DB, writes `data_cache/rxnorm_enrichment.json`
  - `loaders/openfda.py` — OpenFDA REST API enrichment (no key) → US-context warnings, written to `data_cache/openfda_enrichment.json` (cross-reference only — never auto-rendered in UI)
- **Idempotent** — natural-key upserts: `(brand_name_lower, strength_lower, dosage_form_lower)` for medicines, `store_code` for stores. Safe to re-run on the same file.
- **Reset-safe** — `--reset` wipes only `medicines` + `jan_aushadhi_stores` (never family / wallet / reminders).
- **Dry-run** — `--dry-run` parses + logs without writing.
- **Polite REST** — RxNorm 200 ms / OpenFDA 300 ms between calls; both cache locally so re-runs only fetch new molecules.
- **Loader deps** added to `requirements.txt` — `pandas` + `openpyxl` (optional at runtime; only the loader imports them).
- **Documentation** — `scripts/README.md` has the source URLs, the "why government data is better" rationale, the explicit no-scrape policy, the step-by-step download flow, and the validation curl commands.
- **Smoke tests** — all 10 new Python files parse via `ast.parse`; inline JS in `chitti_medupi.html` re-verified with real `node --check` (extracted to .js).

### ✅ DONE — v1.7 automated price update system (2026-05-07)
- **In-process scheduler** (`services/medupi_scheduler.py`) — APScheduler in BackgroundScheduler mode, mirrors chitti-shares pattern. Four cron jobs (Asia/Kolkata):
  - `monthly_jan_aushadhi` — 1st of month, 03:00 IST → downloads BPPI Product Price List, upserts ~2,000 generic rows
  - `weekly_nppa` — Mondays, 04:00 IST → checks NPPA for new ceiling-price notifications
  - `daily_top100_brave` — every day, 02:00 IST → refreshes Brave Search snippets for top-100 most-searched medicines
  - `cache_evict` — daily 02:55 IST → drops expired Brave cache rows
  - Audit log: every run writes a `loader_runs` row (source · status · upserted/skipped/errors · note · started/finished). Toggle: `SCHEDULER_ENABLED` env var (default true).
- **Brave Search live-price service** (`services/medupi_brave_search.py`) — free 2,000 queries/month tier. **Snippet-only** (zero scraping policy honoured: we never visit pharmacy URLs). 24-h cache per (query, source_domain). Allowed domains list: 1mg, pharmeasy, netmeds, apollo, medplus, truemeds + others. Rupee-regex extracts the lowest plausible price from title+description.
- **Community-reported prices** (`services/medupi_community.py` + `models/community_price.py`) — user-submitted "I bought X for ₹Y at <pharmacy> in <city>" rows. Sanity bounds (₹0.50–₹100,000), rate-limit (20/min/device), median + IQR + by-city aggregation. Always rendered with a "User reported — verify before purchase" badge.
- **Search-frequency log** (`services/medupi_search_log.py` + `models/search_log.py`) — every text search bumps `count` + `last_searched_at` for that normalized query. The daily 02:00 IST job reads `top_n(100)` for Brave refresh.
- **Price freshness engine** (`services/medupi_price_freshness.py`) — every API response carries per-price badges: official Jan Aushadhi (🏥 green), NPPA ceiling ("Maximum legal price — no pharmacy can charge more" 🛡️ navy), branded "Last updated X days ago" with amber warning >30 days + red "Verify with pharmacy" >90 days, community 👥 amber. EN + HI captions on every badge.
- **Schema additions** — `medicines.price_source`, `medicines.updated_at` (with `onupdate=`); new tables `price_cache`, `community_prices`, `search_log`, `loader_runs`. Idempotent migration (`services/medupi_migrations.py`) runs on every startup — ALTER TABLE … ADD COLUMN guarded by inspector + backfills `updated_at` for legacy rows. Works on SQLite (local) and Postgres (Railway).
- **Kaggle bulk loader** (`scripts/loaders/kaggle.py`) — A-Z Medicine Dataset of India (~250,000 rows). Merges `short_composition*` columns, infers strength/form from pack labels, batches commits at 500 rows. Stamps `price_source='kaggle'` on every upsert.
- **Auto-update wrappers** (`scripts/auto_update.py`) — `auto_jan_aushadhi()` + `auto_nppa()` invoked by the scheduler. URLs env-overridable via `JAN_AUSHADHI_PRODUCT_URL` / `NPPA_CEILING_URL`. Best-effort against govt URLs that drift between releases — failures log + write audit row, never raise (so next month's run still fires).
- **New routes** (`routes/medupi.py`):
  - `GET  /api/medupi/price/live/{name}` — Brave snippet fetch + 24h cache
  - `POST /api/medupi/community/price` — user reports a price
  - `GET  /api/medupi/community/price?medicine_name=&city=` — list reports + median/IQR/by-city stats
  - `GET  /api/medupi/scheduler/status` — diagnostic (jobs + next run times in IST)
  - `POST /api/medupi/scheduler/trigger/{job_id}` — force-run a job (admin gate todo)
  - `GET /api/medupi/medicine/{name}` now records the search in `search_log`
- **Frontend wiring** (`chitti_medupi.html` + mirror) — every alternative row shows freshness pills next to MRP / NPPA / Jan Aushadhi prices (✓ fresh / ⚠️ stale / ❗ verify). After search results, three async sections render: 👥 community-reported prices (with median + range + by-city), 💰 live pharmacy prices (Brave snippets, on-demand), and a 💬 Report-a-price form. Above-NPPA-ceiling rows get a red `!` flag.
- **Config** — `BRAVE_SEARCH_API_KEY`, `SCHEDULER_ENABLED`, `JAN_AUSHADHI_PRODUCT_URL`, `NPPA_CEILING_URL` added to `config.py` + `.env.example` + `render.yaml` blueprint.
- **Smoke tests** — 43 Python files parse via `ast.parse`; inline JS (769 lines) verified with real `node --check`.

### ✅ DONE — Phase 7 P1 + agentic /ask (2026-05-08)
- **`POST /api/medupi/cart-simulator`** — drop a monthly med list (molecule + strength + dosage_form + qty + current_price), get the cheapest same-composition equivalent cart + monthly + annual savings + per-line risk badge. Service: `services/medupi_cart.py`.
- **`GET /api/medupi/family/wallet`** — per-member preview cards (Self / Spouse / Child / Parent) with monthly spend + savings + chronic-meds chip. Currently SKELETON shape; wires to live data once the family-profile + medupi_log tables ship.
- **`GET /api/medupi/insurance-match?molecule=&scheme=ayushman|cghs|esi|private`** — coverage check chip. Currently SKELETON; full coverage tables seed from the empanelled-medicines list when available.
- **`GET /api/medupi/jan_aushadhi/stock?store_id=&molecule=&strength=&dosage_form=`** — stock check at a Jan Aushadhi store. SKELETON until the BPPI store-level inventory feed is wired.
- **`POST /api/medupi/ask`** — TRUE agentic loop on DeepSeek tool-calling. Tools: `search_medicine`, `find_alternatives`, `classify_risk`, `find_jan_aushadhi_stores`, `simulate_cart`. STRICT same-composition rule baked into the system prompt. Closes with the medical disclaimer. Wired and verified — currently blocked by DeepSeek HTTP 402 (account top-up needed); structured 402 returned to caller, never crashes.
- **Frontend wiring** in `chitti_medupi.html` — Cart Simulator drop-list (with voice IN on molecule, voice OUT on totals); Family Wallet preview (totals strip + per-member cards + chronic-meds chips); 🛡️ Ayushman? chip on every alternative row inside `_renderScanResult`. node --check passes; live on sahayai.in.

### ✅ DONE — v1.8 supplement (parallel session, 2026-05-08)
- **Demo Mode** (commit `2e0cc45`) — 8-step guided walk-through with EN/HI narration, 4-user contract honoured (Blind reads narration aloud · Deaf reads it in the banner · Mute uses Next/Skip buttons · Illiterate sees real visible UI moves at each step). Sample Crocin 650 result + freshness pills + fake wallet stats + sample JA stores rendered without API calls.
- **Flask refactor** (commit `9b55dac`) — chitti-medupi/backend dropped FastAPI + pydantic + httpx, now Flask + flask-cors + gunicorn + requests. Reason: Railway free-tier slim image lacks Rust toolchain, so pydantic-core can never compile from source. Flask is pure Python. All 22 endpoints carried over identically. Same shape, same response keys, frontend wiring unchanged.
- **Schema isolation** (commit `5dc82dd`) — both backends now share the chitti-shares Supabase Postgres but isolate under `medupi.*` and `shares.*` schemas. `models/_schema.py` + `database.ensure_schema()` on each side. Cross-schema FKs via `fk_target()` helper. SQLite local dev still works (schema = None on SQLite).
- **Apollo Pharmacy 259k-row loader** (commit `971191b`) — standalone `scripts/load_apollo_oneshot.py` (psycopg2-only, no backend imports). Auto-bootstraps `medupi` schema + `medicines` table + unique constraint. Reads `chitti-medupi/backend/.env` via stdlib parser (overrides existing env). TCP keepalives + reconnect-on-drop for Neon pooler. Dedup-within-batch on `(brand,strength,form)` to handle Apollo's same-medicine-multiple-URLs rows. Successful run: **211,207 rows in `medupi.medicines` on Neon** (213k upserted from 259k seen, 46k skipped for missing fields, 0 errors, 0 reconnects, ~41 min wall time).
- **QR scanner** (commit `ce0335e`) — 4th button in the Scan tab. Decodes the CDSCO traceability QR / GS1 Datamatrix on Indian medicine packs since 2023. jsQR (~50KB CDN) reads ImageData from a canvas. Three handler paths: GS1 string (shows GTIN, invites brand-name input), URL (opens + extracts guess from path), plain text (feeds into search).
- **Share QR** (commit `ce0335e`) — Settings tab card encoding `https://sahayai.in/chitti_medupi.html`. qrcode-generator (~10KB CDN) renders inline SVG. Copy-link + Save-as-PNG (16px/cell canvas → blob download). Bharat-realistic for community health camps, doctor's clinics, gram panchayat notice boards.
- **Cross-product nav** (this commit) — Chitti News added to all sister pages' headers. MedUPI now has 📈 Technical · 📋 Fundamentals · 📰 News switch buttons. Same pattern across Technical, Fundamentals, News.

### ⚠️ OPEN — production-vs-local DB gap
- **Apollo's 211k rows are in Neon (`ep-delicate-violet-aqny59zg-pooler.c-8.us-east-1.aws.neon.tech/neondb`). The live `chitti-medupi-api-production.up.railway.app` queries Supabase (`medupi.*` schema, 51-row seed only).** Two paths to close:
  - (A) Update Railway's `chitti-medupi-api` env var `DATABASE_URL` to the Neon URL → live API instantly serves 211k rows.
  - (B) Re-run the Apollo loader against Supabase → both DBs match.
- Neither path has been chosen yet; live API still serves the original 51-row seed.

### ⏳ PENDING (next session priority order)
1. **Top up DeepSeek balance** — unblocks `/api/agent/medupi/ask`, `/api/agent/technical/ask`, `/api/agent/fundamental/ask`, `/api/chitti-view/`. One billing action; no code change.
2. **Run the loader on real downloads** — Bryan downloads the four government CSV/XLSX files (BPPI products, Jan Aushadhi stores, NPPA ceiling prices, CDSCO approved formulations), then runs `python scripts/load_real_data.py --source <each> --file <path>` four times. Expected DB after: ~2,000 medicines · ~11,000 stores. Then `python scripts/load_real_data.py --source kaggle --file kaggle.csv` (~250k branded rows · ~5 min batch-committed) + `--source rxnorm` (~7 min) + `--source openfda` (~10 min) for enrichment.
2. **Deploy `chitti-medupi/backend`** to Railway as `chitti-medupi-api-production.up.railway.app` — `render.yaml` is ready. After deploy, set `localStorage.chitti_medupi_api_base` on production frontend OR change the default in `chitti_medupi.html`. Run the loaders once against the production DB (or upload SQLite copy).
3. **Until that ships**, port the upgraded service logic into `chitti-shares/backend/services/medupi_*.py` so the existing `chitti-shares-api` deploy serves the same responses (move the seed JSONs over + add `rapidfuzz` + `anthropic` + `pandas` + `openpyxl` to chitti-shares requirements).
4. **Live verification** — once deployed, curl `/api/medupi/medicine/Crocin%20650`, `/api/medupi/jan_aushadhi?lat=23.26&lng=77.41`, `/api/medupi/insurance/Telmisartan?scheme=ayushman` from production. Bryan verifies on phone before handover (per the verify-on-live memory).
5. **Browser push reminders** — service worker + Notification API on top of the live `/api/medupi/reminder` CRUD.
6. **WhatsApp Business + Twilio voice channels** — `medupi_reminders.send_voice_call` is scaffolded; wire when TWILIO_* env vars are set.
7. **Prescription decoder** — multi-medicine extraction from a full prescription image (loop the vision pipeline + return per-line risk / alternatives).
8. **Optimised Cart simulator** — drag-drop monthly list → cheapest-equivalent cart total.
9. **Insurance coverage** — replace seed therapeutic-class proxy with the official Ayushman empanelled-medicine list when available; consider adding RxCUI-keyed scheme matching once the rxnorm enrichment is folded into the schema.
10. **Compare tab** — currently the Scan-tab results card already shows the equivalents grid; promote that into a dedicated Compare tab landing if Bryan wants a separate flow.
11. **Schema upgrade for RxCUI** — add `rxcui` column to `medicines`, write a one-shot migration that folds `rxnorm_enrichment.json` into the table, then OpenFDA cross-references gain a stable join key.

### 🟡 OUT OF SCOPE (intentionally NOT building)
- ❌ Doctor consultations (not a 1mg / Apollo replacement)
- ❌ E-pharmacy / cart / checkout / order placement
- ❌ Lab tests / diagnostics
- ❌ Selling personal health data (privacy-first; never)
- ❌ Therapeutic alternatives across molecules (NEVER)

---

## 14. Build rules (non-negotiable — copy into every session prompt)

1. **Bharat Premium theme** — saffron `#E86A17` / navy `#0E2344` / gold `#D4AF37` palette + cream `#f8f4ee` background, white cards rounded 18 px, navy gradient header. Same as Chitti Shares.
2. **Hindi UI toggle** — `_chittiLang` localStorage. `data-i18n="key"` + `applyChittiLang()`. Every visible string covered.
3. **Four-user contract** — every control: aria-label · 🔊 speak · ▲▼ + word labels · plain-English caption · 🎤 mic where text input.
4. **Medical disclaimer banner** sticky at top of every screen + modal with full Gold Standard text. Hindi version auto-rendered when `_chittiLang === 'hi'`.
5. **Risk classification BEFORE alternatives** — every alternatives response carries `risk_class` and the frontend gates the UI accordingly (red banner + stop-and-think-prompt for HIGH risk).
6. **Strict matching engine** — same molecule + same strength + same dosage form. EVER. No therapeutic alternatives. No exceptions.
7. **Colours `rgba()` or `#RRGGBB`** only. Never 8-digit hex.
8. **`node --check`** must pass on the main JS block before any commit.
9. **GitHub may be ahead of local** (Bryan's Colab) — fetch + cherry-pick before any push.
10. **`Switch to Chitti Technical / Chitti Fundamentals`** buttons in MedUPI header for cross-product navigation. Mirror in the other two pages.

---

## 15. Closing checklist (every session)

- [ ] `node --check` passes on `chitti_medupi.html`'s main script block
- [ ] `git fetch && git rev-list --count main...origin/main` is `0 0` before push (or cherry-pick recovery)
- [ ] Live URL `https://sahayai.in/chitti_medupi.html` opens, medical disclaimer banner visible at top
- [ ] Hindi toggle switches every marked string and `sp()` voice
- [ ] Bharat theme consistent — same colour palette + card style as the other two pages
- [ ] Three-user lens audit on every new control
- [ ] Disclaimer modal opens, full text readable, "I understand" + "Read aloud" buttons work
- [ ] Update **section 13** (built / pending / out-of-scope) before close
- [ ] Update memory entry `project_chitti_medupi_spec.md` if structure shifts

---

*Living document. Update before every session close.*
