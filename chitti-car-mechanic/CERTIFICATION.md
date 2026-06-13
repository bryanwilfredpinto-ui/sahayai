# CERTIFICATION — Chitti Car Mechanic

## Quality Gates (CEOS §35) — G0–G10
| Gate | Name | Status | Evidence |
|---|---|---|---|
| G0 | Should this exist? (Build ≥80) | ✅ **82.5/100** | [PRODUCT_JUSTIFICATION.md](PRODUCT_JUSTIFICATION.md) |
| G1 | CEOS compliance (all sections) | ✅ | [CEOS_TRACEABILITY.md](CEOS_TRACEABILITY.md) maps §1–§42 → code/UI |
| G2 | UI certification (device screenshots) | ✅ **5/5** | `../tools/cert_screenshots/chitti_car_mechanic_{desktop_1920x1080,laptop_1366x768,ipad,iphone,android}.png` |
| G3 | Button/flow audit | ✅ | cert taps every primary flow (diagnose/OBD/triage/scam/buy/tyre/fuel/reminders) |
| G4 | User journeys (four-user) | ✅ | tap-only journeys + read-aloud + lang switch in cert |
| G5 | Accessibility (9 profiles, 26 langs, axe 0) | ✅ | cert: lang fires (34 nodes), tap≥44px, **axe 0 serious/critical** |
| G6 | Research (20+20 cited) | ✅ | [RESEARCH_BEST_APPS.md](RESEARCH_BEST_APPS.md) |
| G7 | Devil's advocate (20 weaknesses) | ✅ | PRODUCT_JUSTIFICATION Phase 7 (20 reasons, none fatal) |
| G8 | Hallucination audit (no fabricated data) | ✅ | engine cite-or-refuse; T proves unknown→no-guess |
| G9 | Founder audit | 🟡 | Sire's call (real-device + would-you-ship) |
| G10 | Production readiness ≥90 | 🟡 | core GREEN; live-data/DeepSeek/Turso pending (BO11–BO15) |

## Certification status
**CONDITIONAL CERTIFIED** — engine 106/106, live cert 41/41, 5 device screenshots, axe-clean, lang firing.
All deterministic value works offline with DeepSeek down and Turso blocked.

**FULLY CERTIFIED** pending (Sire-owned): real iPhone + Android hardware sign-off; DeepSeek funding
(plain-language phrasing); VAHAN/RTO + OEM-parts + telematics data partnerships (BO11–BO15);
Turso quota for cross-device Twin sync. None of these block today's product.

## Product Audit (CEOS §37) — quick pass
- **60-second understandable?** Hero + How-to-use + emoji tabs; each button self-labels. ✅
- **Every feature demoable without account?** Yes — no sign-up, runs offline. ✅
- **Trust: can the user verify *why*?** Every result shows `confidence`, `risks`, **Source:** line. ✅
- **Language audit (hi/te/ta/kn/bn/mr)?** `chitti_lang.js` translates whole UI; cert proves en→hi/ta. ✅
- **Adoption (5 real owners)?** ⛔ Sire — observe-only field test.

## Sign-off (CEOS §42)
| Role | Name | Status | Date |
|---|---|---|---|
| AI Architect / CTO (Claude) | Claude Opus 4.8 | ✅ Built + self-certified (106/106 + 41/41) | 2026-06-13 |
| Sire (Product Owner) | Bryan Wilfred Pinto | ☐ real-device sign-off pending | — |
