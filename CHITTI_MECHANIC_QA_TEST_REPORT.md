🎖️ World Class Chitti Mechanic (Chitti Auto OS) — Commando Discipline. Zero Excuses.

# QA TEST REPORT — Chitti Mechanic (Bike + Car Doctor)
**Deliverable 1 of 5 · Pre-handover sign-off (Part A)**

**Date:** 2026-06-05 · **QA Engineer:** Chitti CTO (Claude Opus 4.8, automated + headless testing) ·
**Harness:** [tools/qa_handover.mjs](tools/qa_handover.mjs) (real Playwright across **Chromium + Firefox +
WebKit/Safari**) + standing suites ([cert_mechanic](tools/cert_mechanic.mjs), [test_mechanic](tools/test_mechanic.mjs),
[scan_hinglish](tools/scan_hinglish.mjs), `backend/test_routes.py`).

> **Honesty preface.** Tested by an AI with headless browsers across the three real engines (Chrome=Chromium,
> Firefox=Gecko, Safari/iOS=WebKit). **NOT** done / **not** claimed: physical iOS/Android handsets, real human
> blind/deaf/illiterate AT sessions, automated a11y scanner (WAVE/Lighthouse not installed → manual attribute
> audit instead). See [Known Issues](CHITTI_MECHANIC_KNOWN_ISSUES.md) §9.

## Headline: **41 / 43 PASS.** 2 findings (neither Critical): 1 fixed (img-alt), 1 documented (slow-3G).
Standing gates green: cert **24/24**, frontend tests **18/18**, backend **7/7 + 7/7**, §5 scanner **stable 8–16**.

## A1 — 20 user journeys (10 bike + 10 car) — **20/20 PASS**
| # | Journey | Bike | Car |
|---|---|---|---|
| J1 | Page loads + brand renders, 0 page errors | ✅ 2987ms | ✅ 2445ms |
| J2 | Add vehicle → save → persists to localStorage | ✅ | ✅ |
| J3 | Swarm Diagnosis: symptom → 8-agent confidence verdict | ✅ 640ms | ✅ 554ms |
| J4 | Scam Shield: job + quote → fair-range verdict | ✅ 559ms | ✅ 464ms |
| J5 | Roadside Self-Fix: symptom → cause → SVG diagram + steps | ✅ 1186ms | ✅ 814ms |
| J6 | AI Scanners page (Dashboard/Tire/Sound/Leak) opens | ✅ 442ms | ✅ 336ms |
| J7 | Vehicle Health Score: rate 6 → 0–100 score + band | ✅ 685ms | ✅ 628ms |
| J8 | OBD2 (no Bluetooth → honest fallback) | ✅ 373ms | ✅ 320ms |
| J9 | Tab navigation (home/docs/alerts/ask), 0 errors | ✅ 730ms | ✅ 387ms |
| J10 | Language switch en→ta→te→ml, no raw keys | ✅ 2979ms | ✅ 2965ms |

Screenshots: [handover_bike.png](tools/cert_screenshots/handover_bike.png) · [handover_car.png](tools/cert_screenshots/handover_car.png).

## A2 — Edge cases — **5/6 PASS**
| Test | Result |
|---|---|
| No internet (all network aborted) → offline Self-Fix works | ✅ offline-first deterministic |
| Slow 3G (400 kbps) first-visit load | ❌ **~37s** (BUG-1, Medium; SW-cache mitigates repeats) |
| localStorage disabled → no crash | ✅ graceful |
| Rapid language switch ×10 in <5s | ✅ 3527ms, ends clean |
| 10MB + corrupted image upload | ✅ handled |
| JS disabled → page not blank | ✅ static content shows (SPA needs JS, by design) |

## A3 — Cross-platform — engines **4/4 PASS**; physical devices NOT tested
Chrome (Chromium) ✅ all 20 journeys · **Firefox** ✅✅ (render+diagnose+Tamil) · **Safari/iOS (WebKit)** ✅✅
([handover_safari_bike.png](tools/cert_screenshots/handover_safari_bike.png)) · 375/768/1440 px ✅ no overflow ·
physical iPhone/iPad/Android ❌ **NOT tested** (no device lab).

## A4 — Accessibility — attribute audit **5/5** (after img-alt fix); human-AT sessions NOT done
`<html lang>` ✅ · lang-select aria-label ✅ · all `<img>` alt ✅ (2 fixed) · 21 response boxes ✅ ·
tap targets ≥44×40 ✅ 0 small. Human blind/deaf/illiterate sessions ❌ NOT done. WAVE/Lighthouse ❌ not installed.

## A5 — Language (9 languages) — **PASS, no flicker**
§5 scanner steady-state **stable 8–16** (was racy 99↔2400 pre-legacy-translator-removal). Per-language settle
**~0–5**. **Tamil/Telugu/Malayalam flicker RESOLVED** (verified clean on Chromium/Firefox/WebKit). Dropdown
pruned to the 9 fully-translated languages.

## A6 — Regression — **PASS**: cert 24/24 unchanged; no feature broke.

## A7 — Performance
Load (networkidle) mobile/tablet/desktop = **1234 / 902 / 817 ms** (target <3s ✅). 3G first-load **~37s** ❌
(BUG-1). Lang switch **157 ms** ✅. JS heap **10 MB** ✅.

## A8 — Bugs: Critical **0** · High **0** · Medium **2** (BUG-1 documented+mitigated, BUG-2 FIXED).
See [CHITTI_MECHANIC_BUG_REPORT.md](CHITTI_MECHANIC_BUG_REPORT.md).

---
> **World Class Chitti Mechanic (Chitti Auto OS) — Commando Discipline. Zero Excuses.**
