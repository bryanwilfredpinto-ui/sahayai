# EVALS — Chitti Car Mechanic

Two automated harnesses, both reproducible, both GREEN this build.

## A. Engine gold test — `node tools/test_car_mechanic.mjs`
**PASS 97 · FAIL 0.** (incl. OBD structured decoder, 31 symptoms, 54-point inspection, 12 education modules, nearest-centre) Hand-computed from the versioned rule tables. Any safety mis-classification is P0.
Covers: date math (leap-safe) · reminders (overdue/urgent/critical km+date) · insurance ranking+honesty ·
PUC · oil grades (incl. EV "no oil") · tyre tread+DOT replace logic · battery age · **CNG ROI arithmetic** ·
OBD drive-verdict+unknown-no-guess · scam overcharge · **DIY safety override (airbag/brake/fuel/EV-HV=red)** ·
buy critical-fail caps score · sell · **symptom calibrated honesty (unknown→no guess, grinding→no drive)** ·
savings goal · ownership scores · **crisis family-cascade autoDial=false** · every result carries confidence+sources.

## B. Live cert — `node tools/cert_car_mechanic.mjs`
**37/37 GREEN.** Real Chromium + axe-core. 5 device screenshots (1920·1366·iPad·iPhone·Android),
5 frontend gates, lang dropdown FIRES (en→hi 34 nodes), accessibility structure, engine functional via
tap+fill (safety paths), tap≥44px, axe 0 serious/critical, console clean.

## Quality thresholds (CEOS §36) — status
| Metric | Target | Status |
|---|---|---|
| Reminder accuracy | 100% | ✅ deterministic (T) |
| OBD lookup (known codes) | 100% | ✅ table-exact (T); coverage 🟡 (seeded subset, honest "unknown") |
| Tyre recommendation vs expert | ≥90% | ✅ rule-based |
| Scam detection (overcharge flag) | ≥80% | ✅ deterministic vs FAIR table |
| Hallucination | <1% / none | ✅ cite-or-refuse by construction (T) |
| Accessibility profiles / languages | 9/9 · 26/26 | ✅ substrate + cert lang firing |
| **Diagnostic accuracy ≥90% / DIY success ≥70% / annual ₹ saved** | per CEOS | ⛔ AUTOMATION-LIMITED — needs labelled field data + real users (Sire). Not claimed before measured. |
