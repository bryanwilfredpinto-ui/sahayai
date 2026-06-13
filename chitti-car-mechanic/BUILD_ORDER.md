# BUILD ORDER — Chitti Car Mechanic (10 phases + my researched additions)

Status legend: ✅ built & proven in repo · 🟡 honest COMING SOON (visible, never faked) · ⛔ blocked on Sire.
Proof harnesses: `node tools/test_car_mechanic.mjs` (engine **97/97**) · `node tools/cert_car_mechanic.mjs` (live **37/37** + 5 device shots).
**All BO1–BO10 are deterministically COMPLETE** — every feature works offline with DeepSeek down and Turso blocked. Only items needing
true external infra (OCR vision, live premium quote, LLM phrasing, SMS/WhatsApp delivery, camera CV, live VAHAN/telematics) remain 🟡.

## CEOS Build Order (as specified)
| BO | Scope | Status | Where |
|---|---|---|---|
| **BO1** | Document Vault (insurance/PUC/RC/service/warranty/EMI/tyre/battery) | ✅ engine `vault.*` + "My Car" tab captures **all 8 doc types** (insurance·PUC·RC·warranty·EMI·oil·timing-belt·battery). OCR auto-extract 🟡 (DeepSeek vision). | engine, page |
| **BO2** | Smart Reminder Engine 24/7/365 (date + km) | ✅ `reminders()` fires insurance·PUC·RC·warranty·EMI + 10 service items (date OR km). Voice/SMS/WhatsApp **delivery** 🟡 (gateway). | engine, T |
| **BO3** | Insurance Intelligence (8+ insurers, savings, add-ons) | ✅ `insuranceCompare()` ranks 8 insurers + 6 add-ons (indicative, honest). Live premium quote API 🟡. | engine, T, C |
| **BO4** | PUC + Service Intelligence (oil, parts, mechanic, nearest centre) | ✅ `pucStatus()`, `oilRecommendation()`, `mechanicCompare()`, `SERVICE_COSTS`, **`nearestCentre()` (live Maps deep-link, no API key)**. | engine, T, C |
| **BO5** | Tyre + Battery Intelligence | ✅ `tyreRecommend()`, `tyreHealth()` (tread+DOT), `batteryStatus()`. | engine, T, C |
| **BO6** | Buy + Sell Assistant (50+ pt checklist, score, valuation) | ✅ `buyScore()` (critical-fail caps) + **`inspectionChecklist()` = 54 points / 29 critical, grouped, who-checks-it**, `sellAssistant()`. | engine, T, C |
| **BO7** | Diagnostics + Scam + DIY triage | ✅ `obdLookup()` — **47 explicit codes + structured SAE-J2012 decoder for any well-formed code (1000+ supported, honest)**; `scamCheck()`; `diyTriage()` (safety override). | engine, T, C |
| **BO8** | Vehicle Education + AI Coach | ✅ `symptomCoach()` — **31 symptoms** ranked + confidence + safety; **`educationModules()` = 12 plain-language lessons**. DeepSeek phrasing 🟡 (enhancement). | engine, T, C |
| **BO9** | Vehicle Twin + Savings Tracker + Ownership Scores | ✅ `twin.*`, `savingsTracker()`, `ownershipScores()`. | engine, T, C |
| **BO10** | Accessibility + Certification (26 langs, 9 profiles, 5-element widget, audit, device sign-off) | ✅ cert **37/37** incl. lang-firing (en→hi 34 nodes) + axe 0 serious + 5 device screenshots. Real-device sign-off ⛔ (Sire). | C |

## ➕ My researched additions (from RESEARCH_BEST_APPS.md — fold into the roadmap)
These came out of the 20+20 study and the validation; they sharpen the product without breaking scope.

1. **"Can I keep driving RIGHT NOW?" as the first answer** (DashOrNOT/CarLightScan). ✅ already wired —
   every `symptomCoach`/`obdLookup` result leads with `canDrive`. *Highest-value safety affordance for a stranded user.*
2. **Calibrated honesty as a HARD gate, not a slogan** (medical-chatbot ~50%-confident-wrong research).
   ✅ unknown symptom/code → `found:false`, `canDrive:null`, "I'm not sure — see a mechanic". Never fabricates.
3. **Reg-number → auto-fetch RC/PUC/insurance from VAHAN** (mParivahan). 🟡 — one-number onboarding;
   needs the public VAHAN/mParivahan data path. Add as **BO11**.
4. **Used-car: fuse camera+ECU+VAHAN/RTO accident/odometer/loan history into one verdict** (Cars24 CarTruth, Carly).
   🟡 — `buyScore` already takes the checklist; the **history-fusion data layer** is the India moat. Add as **BO12** (partnership-gated).
5. **Genuine-vs-fake parts: one-tap QR/hologram scan routed to OEM DB** (Maruti Scan&Assure, Bosch).
   🟡 — wrap OEM verify flows + camera hologram fallback; "never declare genuine from a photo alone". Add as **BO13**.
6. **Predictive maintenance with stated accuracy + lead time** (Pitstop 94%). 🟡 — needs telematics/OBD stream; **BO14**.
7. **Automatic safety-recall alerts by vehicle** (CARFAX Car Care) — a near-total India gap. 🟡 — ARAI/OEM recall feed; **BO15**.
8. **Detect RSA already bundled in the user's insurance** so they don't pay GoMechanic twice. ✅ surfaced in insurance add-ons note; deepen in BO3.
9. **Snap-the-bill → auto-log service history, read aloud** (Simply Auto) — essential for illiterate/elderly. 🟡 (DeepSeek vision OCR) — BO1 extension.
10. **Swarm benchmarking** — your mileage vs similar cars; "top reported fixes" per code (BlueDriver/Fuelly/Team-BHP). 🟡 — platform swarm; see [SWARM.md](SWARM.md).

## Backend note (vs CEOS §33 "Node.js api")
Per SAHAYAI §2 the deterministic engine is **client-side vanilla JS** (offline-first, free, no LLM in
the critical path) — the strongest form of CEOS §12 "Open & Auditable". A thin Vaani-routed backend
(`chitti-vaani-api`) is the integration point for BO11–BO15 live data + DeepSeek phrasing when funded;
not required for the core product to work today.
