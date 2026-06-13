# CEOS Traceability — every section → exact code/UI location

Sire's rule: *"For each CEOS section, show me where it exists in code or UI. No 'implied' or 'coming soon' for anything claimed done."*
Engine = [`../chitti_car_mechanic_engine.js`](../chitti_car_mechanic_engine.js) (E). Page = [`../chitti_car_mechanic.html`](../chitti_car_mechanic.html) (P).
Tests = [`../tools/test_car_mechanic.mjs`](../tools/test_car_mechanic.mjs) (T). Cert = [`../tools/cert_car_mechanic.mjs`](../tools/cert_car_mechanic.mjs) (C).

| CEOS § | Section | Where it exists | Proof |
|---|---|---|---|
| 1 | Preamble & Vision | P hero + [PRODUCT_VISION.md](PRODUCT_VISION.md) | C: hero renders |
| 2 | Constitution (12 articles) | [CONSTITUTION.md](CONSTITUTION.md); enforced in E (`RULES.never_diy`, `crisisCheck`, vault local-only) | T |
| 3 | Personas & archetypes (9) | [PERSONAS.md](PERSONAS.md); P a11y via `chitti_a11y.js` | C: G3 |
| 4 | Research (20+20) | [RESEARCH_BEST_APPS.md](RESEARCH_BEST_APPS.md) | file |
| 5 | Complete feature suite (15) | P 9 tabs / 17 cards | C: tabs=9, boxes=15 |
| 6 | Document Vault | E `vault.{load,save,set,forget}`; P "My Car" tab | T (forget), C |
| 7 | Smart Reminder Engine (24/7/365) | E `reminders()` (date+km math) | T (overdue/urgent/critical), C reminders renders |
| 8 | Pre-Purchase Inspection & Buy | E `buyScore()` (weighted, critical-fail caps) | T (good_buy/avoid), C |
| 9 | Insurance Intelligence | E `insuranceCompare()` (8 insurers, CSR, add-ons) | T (ranking+confidence), C |
| 10 | PUC Intelligence | E `pucStatus()` | T (expired/valid), C `cmPuc` |
| 11 | Service Intelligence (oil/parts/fluids) | E `oilRecommendation()`, `mechanicCompare()`, `SERVICE_COSTS` | T (grades), C `cmOil` |
| 12 | Tyre Intelligence | E `tyreRecommend()`, `tyreHealth()` (tread+DOT) | T (replace logic), C 1.5mm→replace |
| 13 | Battery Intelligence | E `batteryStatus()` | T (age→status), C `cmBattery` |
| 14 | Fuel Intelligence (Petrol→Diesel→CNG→EV→Hybrid) | E `fuelCompare()`, `fuelROI()` | T (CNG payback math), C ROI |
| 15 | Vehicle Education | P diagnose copy + symptom firstSteps; education modules COMING SOON | P |
| 16 | Diagnostics & OBD Doctor | E `obdLookup()` (code table, drive verdict) | T (P0300/B0100/unknown), C misfire |
| 17 | Repair Cost & Scam Detector | E `scamCheck()` (FAIR table, overcharge %) | T (overpriced/fair), C |
| 18 | DIY vs Mechanic Triage | E `diyTriage()` (SAFETY override) | T (airbag/brake=red), C |
| 19 | Sell Assistant | E `sellAssistant()` | T (listing>likely), C `cmSell` |
| 20 | Savings Tracker (₹10k goal) | E `savingsTracker()` | T (total/goal), C `cmSavings` |
| 21 | Vehicle Twin (full history) | E `twin.{load,save,set,forget}`; P "My Car" | T, C forget |
| 22 | Ownership Scores | E `ownershipScores()` (maint/safety/resale 0–100) | T (0–100), C `cmScores` |
| 23 | AI Coach Layer | E `symptomCoach()` (ranked causes+confidence+tier) | T (calibrated honesty), C grinding→no-drive |
| 24 | Guardrails (Safety) | E `RULES.never_diy`, `diyTriage` red override, `crisisCheck` (family cascade, **no auto-dial**) | [GUARDRAILS.md](GUARDRAILS.md); T crisis autoDial=false |
| 25 | Evals | [EVALS.md](EVALS.md) + T (79 assertions) | `node tools/test_car_mechanic.mjs` |
| 26 | Observability | [OBSERVABILITY.md](OBSERVABILITY.md); page-local; remote opt-in (fleet `chitti_observability.js`) | doc |
| 27 | Swarm Intelligence | [SWARM.md](SWARM.md); platform `lib/swarm.py` + per-Chitti type | doc |
| 28 | Memory (state) | E `vault`/`twin` localStorage; "Chitti forget" | T |
| 29 | Accessibility (26 langs, 9 profiles) | P + `chitti_a11y.js` + `chitti_lang.js` #lang-select; 5-element widget via `feedback-widget.js` | C: lang fires en→hi (34 nodes), 9 tabs, tap≥44px, axe clean |
| 30 | Role | [ROLE.md](ROLE.md) | doc |
| 31 | Skills (12) | [SKILLS.md](SKILLS.md) → E functions | T |
| 32 | SOP (10) | [SOP.md](SOP.md) | doc |
| 33 | Technical Architecture | [ARCHITECTURE.md](ARCHITECTURE.md) | doc |
| 34 | Build Order (10 phases) | [BUILD_ORDER.md](BUILD_ORDER.md) (+ my additions) | doc |
| 35 | Quality Gates (G0–G10) | [QUALITY_GATES.md](QUALITY_GATES.md) | C |
| 36 | Quality Metrics | [EVALS.md](EVALS.md) thresholds | T/C |
| 37 | Product Audit Questionnaire | [CERTIFICATION.md](CERTIFICATION.md) §audit | doc |
| 38 | Certification Criteria | [CERTIFICATION.md](CERTIFICATION.md) | C 41/41 |
| 39 | Deliverables | this folder + 4 root artifacts (engine/page/test/cert) | repo |
| 40 | Success Metrics | [SUCCESS_METRICS.md](SUCCESS_METRICS.md) | doc |
| 41 | Risk Disclosure & Legal | P sticky `.disc` bar + footer | C: disclaimer present |
| 42 | Sign-off | [CERTIFICATION.md](CERTIFICATION.md) §sign-off | doc |

**Note on §24 reconciliation:** the CEOS draft said crisis → "Call 108/100". SAHAYAI_MASTER §2 +
CHITTI_SOP lock **family cascade, never auto-dial cops/ambulance**. The lock wins: `crisisCheck()`
returns `autoDial:false` and a family-first cascade; emergency numbers are offered as **user-confirmed**
options only (Golden Rule). See [GUARDRAILS.md](GUARDRAILS.md).
