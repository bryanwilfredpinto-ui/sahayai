🎖️ World Class Chitti MedUPI — Commando Discipline. Zero Excuses.

# CEOS Level 4 — PRD (Chitti MedUPI)

Authored 2026-06-06

> Governs every feature. Each feature carries: **ID · Name · User story ·
> Acceptance criteria · Status · A11y · Failure modes.** A feature missing any of
> these is not built. Personas referenced P1–P9 from [PERSONAS.md](PERSONAS.md).
> Bounded by [CONSTITUTION.md](CONSTITUTION.md) (L0). Endpoints cross-referenced
> to [API.md](API.md) and `backend/routes/medupi.py`.
>
> **Status key:** **LIVE** = endpoint + UI shipped, curl-verified · **PARTIAL** =
> core works, fan-out/wiring queued · **COMING SOON** = honest stub / blocked on
> a key, partnership, or funding (never a fake demo).

## Global contracts (apply to every feature)

- **Strict same-composition only** — same molecule + strength + form; never
  therapeutic, never inferred from brand. Cross-molecule leakage = hard 0.
- **Risk band BEFORE alternatives** — every response carries `risk:{class,symbol,
  label,warning}`; HIGH = red stop-and-think gate.
- **NPPA ceiling = hard cap** — over-ceiling prices surface a violation chip + a
  complaint draft, never a footnote.
- **Server-enforced disclaimer** on every response (sticky banner + modal +
  per-card caption), Hindi when `_chittiLang==='hi'`.
- **Golden Rule** — no side-effecting action (reminder, wallet write, community
  post, price alert, scheduler trigger) without `chittiConfirmAndDo()`. HIGH-risk:
  confirm every time.
- **Per-response widget** — every card carries `data-chitti-response`
  (🔊 / 🤖 / 👍 / 👎 + feedback). No card ships without it.
- **Four-user floor + honest empty states** — voice + caption + symbol + plain
  Hindi; never colour-only; never a fake result.

---

## F0 — Same-Composition Compare Engine (HERO)

- **ID:** F0 · **Status:** **LIVE**
- **Story (P1/P2/P4/P5/P8):** *As a caregiver on a fixed budget, I want every
  same-molecule + same-strength + same-form generic for what my doctor
  prescribed, so I pay the lowest honest price without changing the medicine.*
- **Endpoints:** `GET /api/medupi/medicine/<name>` (fuzzy brand lookup) ·
  `GET /api/medupi/alternatives?molecule&strength&dosage_form` (strict).
  Engine: `services/medupi_alternatives.py` →
  `medupi_database.search_by_composition()` over `ix_medicines_strict_match`.
- **Acceptance criteria:**
  - Returns alternatives ONLY where molecule **and** strength **and** dosage form
    match exactly. Cross-molecule/strength/form leakage = **0** (sample battery
    `leaks=0` on 25/25).
  - Each result carries `mrp`, `jan_aushadhi_price`, `savings_pct`, risk band, and
    `speak_en/hi` + `caption_en/hi`.
  - `cheapest` + `max_savings_pct` computed; ≥2 alternatives surfaced where they
    exist (`min_alternatives>=2` on 25/25).
- **A11y:** every result spoken + captioned; `purpose_hi` per medicine for P4;
  risk banner auto-speaks before price for P1.
- **Failure modes:** no DB match → honest `ok:false` "no same-composition match
  found", never a fabricated row; unknown molecule → risk defaults LOW **and is
  logged**.

## F1 — Jan Aushadhi Pricing + Savings + Store Locator

- **ID:** F1 · **Status:** **LIVE**
- **Story (P4/P5/P7):** *As a family far from a big city, I want the official Jan
  Aushadhi price and the nearest Kendra, so I know the cheapest place to buy.*
- **Endpoints:** `GET /api/medupi/jan_aushadhi?lat&lng&radius_km&limit` (haversine
  geo) · `GET /api/medupi/jan_aushadhi/state?state` (by-state fallback). Pricing
  in `services/medupi_jan_aushadhi.py` + `medupi_pricing.py`.
- **Acceptance criteria:**
  - `jan_aushadhi_price` present on every match; savings typically 50–90% off
    branded MRP, shown as a big bold spoken number.
  - Geo search returns stores within `radius_km` (default 5 km, 0.1–50) with
    `distance_km`; falls back to by-state list when geolocation is denied/empty.
  - Brand · Generic · Jan Aushadhi prices all shown; empty value renders `—`
    honestly, never silently dropped (Quality item Q1/Q2).
- **A11y:** store count + savings spoken ("5 किलोमीटर के अंदर 1 जन औषधि स्टोर");
  honest "tell me your city" when location denied.
- **Failure modes:** no store in radius → by-state fallback, then honest empty
  state for P7; never a phantom store.

## F2 — Strip / Prescription Scan (DeepSeek Vision)

- **ID:** F2 · **Status:** **PARTIAL** (text path LIVE; vision honest-degrades
  until `DEEPSEEK_API_KEY` funded)
- **Story (P1/P3/P5):** *As a user who can't read the label, I want to photograph
  the strip and get the medicine, the composition, and cheaper options.*
- **Endpoints:** `POST /api/medupi/scan` (multipart image ≤8 MB) · text path via
  `recognise_text`. Vision in `services/medupi_recognition.py` → DeepSeek-VL
  (OpenAI-compatible), strict JSON `{brand,salt,strength,form,pack,expiry,
  confidence}` → master-DB lookup.
- **Acceptance criteria:**
  - On match: returns `extracted` + `primary` + strict `alternatives` + risk +
    voice text (same shape as F0).
  - Confidence surfaced; **<70% renders "I am not fully sure, please verify with
    pharmacist"** via `renderConfidence` (Quality Q5).
  - When `DEEPSEEK_API_KEY` unset / HTTP 402 → **honest text-only fallback**,
    never a fabricated extraction (CONSTITUTION Article 8).
  - Errors: 400 no image · 413 >8 MB · 415 non-image.
- **A11y:** file-picker upload for P3 (mute, no camera-voice step); result spoken
  + captioned.
- **Failure modes:** extraction OK but no DB match → `ok:false, stub:false` with
  honest message; low confidence → verify hint.

## F3 — NPPA Ceiling Cross-Check

- **ID:** F3 · **Status:** **LIVE** (compare + violation chip) / **PARTIAL**
  (auto-complaint draft UI)
- **Story (P7/P8):** *As a patient/pharmacist, I want to know if a price is above
  the NPPA-notified ceiling, so I'm not overcharged on an NLEM medicine.*
- **Engine:** `medupi_pricing.py` + `weekly_nppa` loader (NPPA NLEM list);
  ceiling enforced as a hard cap (CONSTITUTION Article 4).
- **Acceptance criteria:**
  - Every pricing payload carries `nppa_ceiling_violation` (boolean).
  - Sample battery `nppa_ceiling_respected` → `over_ceiling=0` on 25/25.
  - Over-ceiling result renders a red `⚠️ Above NPPA ceiling` chip + a
    copy-to-clipboard complaint draft pre-addressed to the NPPA grievance portal
    (Quality Q3).
- **A11y:** violation announced with symbol + word + voice, never colour alone.
- **Failure modes:** no ceiling on file for a non-NLEM molecule → no violation
  claim (absence ≠ "within ceiling"), stated honestly.

## F4 — Family Medicine Wallet

- **ID:** F4 · **Status:** **LIVE** (`X-User-Token` required)
- **Story (P5/P6):** *As a caregiver, I want a per-person wallet of what we
  bought and saved, so I see this month's and the year's spend across the family.*
- **Endpoints:** `GET/POST/DELETE /api/medupi/family/profile[s]` ·
  `GET/POST /api/medupi/family/wallet`. Logic in `services/medupi_family.py`.
- **Acceptance criteria:**
  - Multi-profile (self / spouse / child / parent) with conditions list.
  - Wallet report returns `this_month_spend/saved`, `last_12_months_spend/saved`,
    `annual_projection`, spoken + captioned.
  - `savings_realized` = `(price_paid − cheapest_equivalent) × qty`, computed
    server-side only when `price_paid > cheapest`.
  - Auth: `X-User-Token` ≥8 chars; profile ops 404 if not owned by caller.
- **A11y:** voice-buildable; every write through `chittiConfirmAndDo()`.
- **Failure modes:** `profile_id` not owned → 404; no entries → honest ₹0 state.

## F5 — Expiry / Refill Reminders

- **ID:** F5 · **Status:** **LIVE** (CRUD + daily scan) / **PARTIAL** (push /
  WhatsApp / Twilio fan-out stubbed)
- **Story (P6):** *As an elderly patient, I want to be reminded before a strip
  expires and before I run out, so I never take an expired dose or miss a refill.*
- **Endpoints:** `GET/POST/PATCH/DELETE /api/medupi/reminder`. Logic in
  `services/medupi_reminders.py`; daily 08:00 IST expiry scan.
- **Acceptance criteria:**
  - `kind ∈ {refill, expiry, dose, appointment}`; `recurrence`; ISO-8601
    `next_due`; `status ∈ {active, done, dismissed}`.
  - Expiry buckets EXPIRED / EXPIRING_SOON (≤7d) / EXPIRING (≤30d) / OK, each with
    a voice-readable phrase + symbol + word label (never colour alone).
  - Notification channels stubbed honestly (`_notify` logs intended channel) —
    surface "wiring next session", never a fake "sent".
- **A11y:** spoken in the user's language; symbol + word for P2/P4; large text for
  P6.
- **Failure modes:** notification channel unconfigured → in-app reminder still
  fires; honest "channel pending".

## F6 — Price Alerts

- **ID:** F6 · **Status:** **PARTIAL** (matcher LIVE; notification fan-out stub)
- **Story (P5/P7):** *As a chronic-care buyer, I want "tell me when Telmisartan
  drops below ₹X", so I buy at the best price.*
- **Engine:** `services/medupi_price_alerts.py`; `daily_price_alert_scan`
  09:00 IST. Endpoint `POST /api/medupi/alerts` (queued in master spec P1).
- **Acceptance criteria:**
  - Three honest signals, in priority order: (1) NPPA ceiling drop ≤ threshold;
    (2) Jan Aushadhi MRP ≤ threshold; (3) **≥2 independent** community reports in
    the user's pincode within 30 days. **One report alone never fires** (same
    trust contract as the news fact-checker).
  - Fires at most once per matched threshold; clears the row after `_notify`.
  - Respects Vaani quiet rules — never wakes the user at night for a price drop.
- **A11y:** alert read aloud in the user's language via Vaani.
- **Failure modes:** single-source price → no fire; no channel → logged intent,
  honest pending.

## F7 — Insurance Match

- **ID:** F7 · **Status:** **LIVE** (seed coverage) / **COMING SOON** (official
  empanelled-list API)
- **Story (P9):** *As an Ayushman-enrolled patient, I want to know if a medicine
  is covered by my scheme before I pay cash.*
- **Endpoints:** `GET /api/medupi/insurance/schemes` ·
  `GET /api/medupi/insurance/<molecule>?scheme`. Logic in
  `services/medupi_insurance.py` over `data/insurance_coverage_seed.json`.
- **Acceptance criteria:**
  - `scheme ∈ {ayushman, cghs, esi, private}`; returns `covered` boolean +
    `therapeutic_class` + `reason_en/hi` + `speak_en/hi`.
  - Coverage by **therapeutic class**, never a prescribing claim.
  - Seed-data provenance disclosed; cross-links to Chitti Government PMJAY checker.
- **A11y:** coverage spoken + captioned, EN + Hindi.
- **Failure modes:** seed missing a class → honest "not in our coverage data,
  check with the scheme", never a guessed "covered".

## F8 — Risk Classification (cross-cutting safety layer)

- **ID:** F8 · **Status:** **LIVE**
- **Story (all, esp. P6/P8):** *As any user, I want a clear stop-and-think warning
  before I consider switching a serious medicine.*
- **Endpoint:** `GET /api/medupi/risk/<molecule>`; engine
  `services/medupi_risk.py` (curated top-200 RISK_MAP).
- **Acceptance criteria:**
  - Returns `class ∈ {H,M,L}` + `symbol ⛔/⚠️/✅` + `label_en/hi` + `warning_en/hi`.
  - HIGH (antibiotics, cardiac, diabetes, BP, psychiatric, anticoagulant, thyroid,
    anti-cancer, asthma) → red banner gate *before* any alternative is shown.
  - Unknown molecule → defaults LOW **and is logged** so the map expands; never
    silently treated as safe.
- **A11y:** symbol + word + voice; HIGH banner auto-speaks for P1.
- **Failure modes:** the only "failure" is silently mis-banding HIGH as LOW —
  prevented by the curated map + logged-unknown policy; HIGH-risk swarm updates
  to the map require Sire's approval.

## F9 — Multilingual Voice-First Delivery (substrate)

- **ID:** F9 · **Status:** **LIVE** — 26/26 languages verified
- **Story (P1–P4, P7):** *As a vernacular user, I want every answer spoken and
  captioned in my language, so I never depend on English or sight.*
- **Engine:** `chitti_a11y.js` + Voice Factory cascade; `speak_*`/`caption_*` in
  every payload; `_chittiLang` toggle; ISL panel.
- **Acceptance criteria:**
  - **26/26 languages pass** at 99–100% string coverage, 0 raw keys, no overflow
    (`tools/medupi_lang26_result.json`).
  - Every response box carries `data-chitti-response` (🔊 / 🤖 / 👍 / 👎),
    ISL panel, Disability Profile prompt on first visit (5-gate audit).
  - axe-core 0 serious / 0 critical (target); mobile @375px pass.
- **A11y:** this **is** the four-user floor made concrete.
- **Failure modes:** a language below threshold surfaces honestly via the Voice
  Factory ledger — never a silent fallback to Hindi.

---

## Community prices + live pharmacy snippets (supporting)

- `POST/GET /api/medupi/community/price` — **LIVE.** User-reported "I bought X for
  ₹Y at <pharmacy> in <city>" → median + IQR + by-city stats; `price_paid` in
  `[0.5, 100000]`; rate-limit 20/min/token; every item carries a 👥 freshness
  badge. Reports flow only on `chittiConfirmAndDo()`.
- `GET /api/medupi/price/live/<name>` — **PARTIAL.** Brave Search **snippet-only**
  (zero-scrape policy — never visits pharmacy URLs); 24 h cache. Returns
  `source:"unconfigured"` honestly when `BRAVE_SEARCH_API_KEY` is unset.

## Demo mode

- **LIVE.** 8-step guided walk-through honouring the four-user contract — Blind
  reads aloud · Deaf reads the banner · Mute advances by Next · Illiterate sees
  real UI moves.

## Blocked / future (honest)

| Item | Status | Blocked on |
|---|---|---|
| `POST /api/medupi/ask` agentic loop | COMING SOON | DeepSeek HTTP 402 (funding) |
| Medicine-interaction checker | COMING SOON | curated seed + **HIGH-risk swarm gate** (Sire approval) |
| Cart-simulator endpoint (`/cart-simulator`) | PARTIAL | route wiring (logic exists in master spec) |
| Live Jan Aushadhi store inventory / stock | FUTURE | PMBI partnership |
| ABDM-linked medication history | FUTURE | ABDM HFR/HPR enrolment |
| Pharmacist-confirmed substitution audit trail | FUTURE | a Chitti Pharmacy shop product (doesn't exist yet) |

> Every "blocked" item is surfaced to the user as an honest COMING SOON via the
> Feature Discovery Box (`chitti_features.js`), never a fake demo
> ([CONSTITUTION.md](CONSTITUTION.md) Article 11).
