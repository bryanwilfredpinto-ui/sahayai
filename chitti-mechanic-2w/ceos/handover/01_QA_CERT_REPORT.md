# 01 — QA & Certification Report — Chitti Mechanic 2 Wheeler

**Date:** 2026-06-13 · **By:** Chitti CTO (Claude Opus 4.8) · **Status:** CONDITIONAL CERTIFIED (CTO gates GREEN; real-device sign-off = Sire's slot).

All results below were produced by the CTO running the automated harnesses itself (never handed to Sire). Reproduce: `node tools/test_mechanic_2w.mjs && node tools/cert_mechanic_2w.mjs`.

## Gate results

| Gate | Result | Evidence |
|---|---|---|
| **G0 Should this exist?** | ✅ PASS — Build Score **87/100** | [../../../CHITTI_2W_MECHANIC_PRODUCT_JUSTIFICATION.md](../../../CHITTI_2W_MECHANIC_PRODUCT_JUSTIFICATION.md) |
| **G1 CEOS compliance** | ✅ PASS — 44 docs across all canonical sections | [../](../) |
| **G2 UI certification (5 device screenshots)** | ✅ PASS — desktop 1920×1080, laptop 1366×768, iPad, iPhone, Android | `tools/cert_screenshots/chitti_mechanic_2w_*.png` |
| **G3 Button/feature audit** | ✅ PASS — all 15 feature tabs render real engine output | `cert_mechanic_2w.mjs` |
| **G4 User journeys** | ✅ PASS — 15 tab journeys + lang-switch journey | `cert_mechanic_2w.mjs` |
| **G5 Accessibility (axe-core 0, 26 langs, taps ≥44px)** | ✅ PASS — axe **0 serious/critical**, #lang-select 26 langs (en→hi 29 nodes), 0 sub-44px controls | `cert_mechanic_2w.mjs` |
| **G6 Research (20+20 apps)** | ✅ PASS | [../../../CHITTI_2W_MECHANIC_RESEARCH.md](../../../CHITTI_2W_MECHANIC_RESEARCH.md) |
| **G7 Devil's advocate (20 weaknesses)** | ✅ PASS — 20-reason kill attempt survived | PRODUCT_JUSTIFICATION Phase 4/7 |
| **G8 Hallucination audit** | ✅ PASS — engine refuses unknown OBD codes, never invents premiums/prices; every result carries confidence/risks/sources | `test_mechanic_2w.mjs` |
| **G9 Founder audit** | ✅ PASS — serves delivery rider / student / rural / senior; neutral (no transaction monetization) | PERSONAS.md |
| **G10 Production readiness** | 🟡 CONDITIONAL — code GREEN; live APIs + real-device pending (see COMING SOON) | BUILD_ORDER.md |

## Automated test results
- **Engine gold tests:** `82 passed, 0 failed` (`GOLD_RESULT:{"pass":82,"fail":0}`)
- **Live Playwright cert:** `34 passed, 0 failed` (`CERT_RESULT:{"pass":34,"fail":0}`)
- **Backend:** `/health` 200 · `/api/2w/health` 200 · 6 honest 501 stubs · local-SQLite fallback
- **Screenshots:** 5 device PNGs, 270 KB–1.13 MB (real renders, visually confirmed)

## Honest known limitations (COMING SOON — not faked)
Live mParivahan/DigiLocker/insurer-premium APIs · document OCR · damage-photo/sound vision · DeepSeek symptom narration (DeepSeek funding + Vaani relevance-rail) · SMS/WhatsApp delivery · server-side Vehicle-Twin persistence (org-wide Turso read-block 2026-06-13). The deterministic core delivers value with all of these off.

## Remaining for Sire
Real physical iPhone + Android device sign-off (only thing the CTO cannot automate).
