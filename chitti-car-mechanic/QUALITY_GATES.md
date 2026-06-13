# QUALITY_GATES (G0–G10) — Chitti Car Mechanic

The merge-blocker gates. Full evidence + status table lives in [CERTIFICATION.md](CERTIFICATION.md);
this file is the contract.

| Gate | Pass condition | Harness |
|---|---|---|
| **G0** | Build Score ≥ 80 (should it exist?) | PRODUCT_JUSTIFICATION (82.5) |
| **G1** | Every CEOS §1–§42 mapped to real code/UI | CEOS_TRACEABILITY.md |
| **G2** | 5 device screenshots (1920·1366·iPad·iPhone·Android) | cert_car_mechanic.mjs |
| **G3** | Every flow/button works via tap | cert engine-functional checks |
| **G4** | Four-user journeys pass (tap-only + read-aloud + lang) | cert |
| **G5** | 9 profiles · 26 langs · **axe-core 0 serious/critical** | cert (lang fires, axe clean) |
| **G6** | 20 apps + 20 AI apps researched & cited | RESEARCH_BEST_APPS.md |
| **G7** | Devil's advocate — 20 weaknesses, none fatal | PRODUCT_JUSTIFICATION Phase 7 |
| **G8** | Hallucination audit — no fabricated verdict/number | engine cite-or-refuse; gold test |
| **G9** | Founder audit (real-device, would-you-ship) | ⛔ Sire |
| **G10** | Production readiness ≥ 90 | 🟡 core GREEN; live-data/LLM/Turso pending |

**Pass policy:** any RED on a safety gate (G5 axe, G8 hallucination, or a DIY/can-drive
mis-classification in the gold test) blocks merge. G9/G10 are Sire/infra-owned and do not block the
in-repo deterministic product.
