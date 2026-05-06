# CHITTI MedUPI — Master Specification

**Version:** 1.4 (consolidated for build)
**Date:** 2026-05-06
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
| **Backend** | `chitti-shares-api.onrender.com` (shared with Shares for now; carve to own service if scale demands) |

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

### 12.2 Backend (`chitti-shares/backend/`)

```
services/
├── medupi_recognition.py    NEW — OCR via cloud OCR API or open-source Tesseract; LLM (Anthropic) for composition extraction from extracted text
├── medupi_database.py       NEW — internal master drug DB (CDSCO molecules + NPPA prices + Jan Aushadhi catalog)
├── medupi_pricing.py        NEW — NPPA ceiling price lookup + market price aggregation
├── medupi_jan_aushadhi.py   NEW — store locator (CSV of all Jan Aushadhi stores)
├── medupi_alternatives.py   NEW — STRICT same-composition matcher (molecule + strength + form ONLY)
├── medupi_risk.py           NEW — risk classification engine (H/M/L per molecule)
├── medupi_family.py         NEW — multi-profile wallet + spend tracking
└── medupi_reminders.py      NEW — refill + expiry reminder scheduling

routes/
└── medupi.py                NEW — public + auth endpoints
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

## 13. Build Status (this session)

### ✅ DONE tonight
- Master Doc (this file) created at workspace root + GitHub
- Frontend skeleton `chitti_medupi.html` shipped with Bharat Premium theme + Hindi UI toggle + all 8 tabs as Coming Soon + medical disclaimer banner & modal + Switch buttons
- Backend stub directory + skeleton service files (TODOs in each)
- Memory entry pointing here

### ⏳ PENDING (next session priority order)
1. **Master drug DB seed** — scrape NPPA price list (public PDF) + Jan Aushadhi catalog (public CSV) + CDSCO molecule list
2. **OCR service** — pick Tesseract (offline, free) vs. paid (Google Vision / AWS Textract); MVP with Tesseract
3. **Anthropic-powered composition extractor** — LLM reads OCR text, extracts brand + salt + strength + form
4. **`POST /api/medupi/scan` endpoint** — receives image, runs OCR + extractor, returns structured response
5. **`GET /api/medupi/alternatives` endpoint** — strict matching engine + risk-class warning
6. **Frontend: Scan tab interactive** — camera capture (`getUserMedia` + canvas), file upload, voice input
7. **Frontend: Compare tab** — equivalent brands list with savings % + risk badge
8. **Jan Aushadhi store locator** — geolocation + radius search
9. **Family Wallet** — auth + multi-profile + monthly spend chart
10. **Reminders** — service worker + browser notifications + WhatsApp / Phone-call channels (via Twilio)
11. **Hindi audio** for every disclaimer + every medicine name
12. **Risk-class engine** — populate H/M/L for top 200 molecules

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
