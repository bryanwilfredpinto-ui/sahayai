🎖️ World Class Chitti Mechanic (Chitti Auto OS) — Commando Discipline. Zero Excuses.

# QA TEST REPORT — Chitti Mechanic (Bike + Car Doctor)
**Deliverable 1 of 5 · Pre-handover sign-off (Part A) · v2 (2026-06-05, re-run)**

**Date:** 2026-06-05 · **QA Engineer:** Chitti CTO (Claude Opus 4.8, automated + headless testing) ·
**Harness:** [tools/qa_handover.mjs](tools/qa_handover.mjs) (real Playwright across **Chromium + Firefox +
WebKit/Safari**) + standing suites ([cert_mechanic](tools/cert_mechanic.mjs), [test_mechanic](tools/test_mechanic.mjs),
[scan_hinglish](tools/scan_hinglish.mjs), [test_rc_scan](tools/test_rc_scan.mjs), [test_rc_langs](tools/test_rc_langs.mjs), `backend/test_routes.py`).

> **What changed in v2 (this session):** (a) new **"Scan your RC → auto-fill"** feature on both pages
> ([chitti_rc_scan.js](chitti_rc_scan.js)); (b) **UI re-skinned to Chitti MedUPI** ([chitti_mechanic_medupi_skin.css](chitti_mechanic_medupi_skin.css));
> (c) **i18n fix** — Car Doctor form title was showing "My Bike" (`mb.form.title`), now `mc.form.title` in all 9
> languages. All three are re-tested below + folded into the standing harness (new journey **J11**).

> **Honesty preface.** Tested by an AI with headless browsers across the three real engines (Chrome=Chromium,
> Firefox=Gecko, Safari/iOS=WebKit). **NOT** done / **not** claimed: physical iOS/Android handsets, real human
> blind/deaf/illiterate AT sessions, automated a11y scanner (WAVE/Lighthouse not installed → manual attribute
> audit instead). See [Known Issues](CHITTI_MECHANIC_KNOWN_ISSUES.md) §9.

## Headline: **44 / 45 PASS.** 1 finding (not Critical): documented (slow-3G first load, BUG-1).
Standing gates green: cert **24/24**, frontend tests **18/18**, backend **7/7 + 7/7**, §5 scanner **stable 8–16**,
RC smoke **20/20**, RC 9-language matrix **54/54**.

## A1 — 22 user journeys (11 bike + 11 car) — **22/22 PASS**
| # | Journey | Bike | Car |
|---|---|---|---|
| J1 | Page loads + brand renders, 0 page errors | ✅ | ✅ |
| J2 | Add vehicle → save → persists to localStorage | ✅ | ✅ |
| J3 | Swarm Diagnosis: symptom → 8-agent confidence verdict | ✅ | ✅ |
| J4 | Scam Shield: job + quote → fair-range verdict | ✅ | ✅ |
| J5 | Roadside Self-Fix: symptom → cause → SVG diagram + steps | ✅ | ✅ |
| J6 | AI Scanners page (Dashboard/Tire/Sound/Leak) opens | ✅ | ✅ |
| J7 | Vehicle Health Score: rate 6 → 0–100 score + band | ✅ | ✅ |
| J8 | OBD2 (no Bluetooth → honest fallback) | ✅ | ✅ |
| J9 | Tab navigation (home/docs/alerts/ask), 0 errors | ✅ | ✅ |
| J10 | Language switch en→ta→te→ml, no raw keys | ✅ | ✅ |
| **J11** | **Scan RC → state/RTO chip + honest auto-fill (no fabrication)** | ✅ | ✅ |

**J11 (new) asserts the honest contract:** typing a reg (`KA05MG7788`) shows the deterministic
**"Registered in: Karnataka · RTO 05"** chip (offline); a captured RC photo is saved **device-local only**;
with no vision endpoint the card shows **"AI auto-read coming soon 👇"** and **never fabricates a make/model**.
Screenshots: [handover_bike.png](tools/cert_screenshots/handover_bike.png) · [handover_car.png](tools/cert_screenshots/handover_car.png) · [RC_bike.png](tools/cert_screenshots/RC_bike.png) · [RC_car.png](tools/cert_screenshots/RC_car.png).

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

## A4 — Accessibility — attribute audit **5/5**; human-AT sessions NOT done
`<html lang>` ✅ · lang-select aria-label ✅ · all `<img>` alt ✅ (incl. new RC preview `alt`) · 22+ response
boxes ✅ (RC card carries `data-chitti-response` → per-response widget) · tap targets ≥44×40 ✅ 0 small (RC
buttons 48px). Human blind/deaf/illiterate sessions ❌ NOT done. WAVE/Lighthouse ❌ not installed.

## A5 — Language — **PASS, no flicker** · **9 shipped languages** (en, hi, ta, te, bn, mr, gu, kn, ml)
§5 scanner steady-state **stable 8–16** (was racy 99↔2400 pre-legacy-translator-removal). Per-language settle
**~0–5**. **Tamil/Telugu/Malayalam flicker RESOLVED** (verified clean on Chromium/Firefox/WebKit). The dropdown
is **pruned to the 9 fully-translated languages** so a user can never select an untranslated one.

**RC + car-title 9-language matrix — [test_rc_langs.mjs](tools/test_rc_langs.mjs) = 54/54** (9 langs × 3 checks ×
2 pages): every new `rc.*` string renders in the **correct script** (Devanagari/Tamil/Telugu/Bengali/Gujarati/
Kannada/Malayalam), the form title is correct car/bike wording, and **zero raw `mb./mc./rc.` keys** are visible.

> **Honest scope note — Urdu.** Your checklist lists "Urdu — FULL test", but the mechanic's **9th shipped
> language is Malayalam, not Urdu**. Urdu (and the wider 22/26-language set: Punjabi, Odia, Assamese, …) is
> **roadmap**, not yet UI-translated — so it is **not tested and not claimed**. Untranslated strings fall back
> to clean English (no garble) per §5. Voice covers 26 via Voice Factory; UI chrome is the 9 above.

## A6 — Regression — **PASS**: cert **24/24** unchanged after the MedUPI skin + RC feature + car-title fix.
The skin is **purely visual** (re-skins existing `sds-*` classes, no renames → harnesses + i18n + feedback
widget unaffected). RC is **additive** (new module + card). Car-title fix is **i18n-only** (`mc.form.title`
added in 9 langs; no other bike/car string bleed found in a full car-page sweep). No prior feature broke.

## A7 — Performance
Load (networkidle) mobile/tablet/desktop = **1234 / 902 / 817 ms** (target <3s ✅). 3G first-load **~37s** ❌
(BUG-1). Lang switch **157 ms** ✅. JS heap **10 MB** ✅.

## A8 — Bugs: Critical **0** · High **0** · Medium **1 open** (BUG-1 slow-3G, documented+mitigated).
BUG-2 (img-alt) FIXED earlier. **v2 finding:** a *test-harness* bug (J11 read a prior journey's leftover demo
`make` value, not an RC fabrication) was found + fixed in the harness — **the product is correct** (RC never
fabricates a make). See [CHITTI_MECHANIC_BUG_REPORT.md](CHITTI_MECHANIC_BUG_REPORT.md).

---
> **World Class Chitti Mechanic (Chitti Auto OS) — Commando Discipline. Zero Excuses.**
