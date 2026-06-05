🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# QA_TEST_REPORT — Chitti Universal Scanner (CUSOS) · Part A

**Tester:** Chitti CTO (Claude Opus 4.8) · **Date:** 2026-06-05 ·
**Build:** chitti_scanner.html @ commit on `main` after CUSOS router.
**Environment:** headless Chromium (Playwright) + Node, repo served at `http://127.0.0.1:8770`.
**Live backend:** `chitti-scanner-api-production.up.railway.app` (`/health` 200).

> Pass rate is computed only over tests **actually executed**. Tests requiring hardware I
> don't have are listed under "NOT TESTED" and excluded from the rate — not counted as pass.

## A1. User journey testing

Automated journeys executed (router + resilience + eval). Time = wall-clock of the automated step.

| # | Journey | Result | ~Time |
|---|---|---|---|
| 1 | Medicine label → detect `medicine` 85% → route MedUPI | ✅ PASS | <50ms |
| 2 | Food label → detect `food` 85% → in-page + Vaani | ✅ PASS | <50ms |
| 3 | Car symptom → detect `vehicle_4w` 85% → Car Doctor | ✅ PASS | <50ms |
| 4 | Bike symptom → detect `vehicle_2w` → Bike Doctor | ✅ PASS | <50ms |
| 5 | Clothing tag → detect `fashion` → Fashion | ✅ PASS | <50ms |
| 6 | Aadhaar/scheme → detect `government_doc` → Government | ✅ PASS | <50ms |
| 7 | Legal notice → detect `legal_doc` → Legal (prefill) | ✅ PASS | <50ms |
| 8 | UPI/OTP/prize → detect `fraud_signal` 96% → Fraud Guard (safety) | ✅ PASS | <50ms |
| 9 | Fraud hidden in invoice → fraud wins (precedence) | ✅ PASS | <50ms |
| 10 | Crop/leaf → detect `crop` → Farmer **COMING SOON** (honest) | ✅ PASS | <50ms |
| 11 | Appliance → `appliance` → Home-Repair COMING SOON | ✅ PASS | <50ms |
| 12 | Resume → `career_doc` → Career COMING SOON | ✅ PASS | <50ms |
| 13 | News → `news` → News | ✅ PASS | <50ms |
| 14 | Gibberish → `unknown` → picture-menu (9 tiles), no guess | ✅ PASS | <50ms |
| 15 | Empty input → `unknown` (honest) | ✅ PASS | <50ms |
| 16 | Pick-a-category tile → re-route | ✅ PASS (rendered) | <50ms |
| 17 | "Why?" explanation read-back | ✅ PASS (speaks reason) | — |
| 18 | Universal Memory timeline renders with category icons | ✅ PASS | — |
| 19 | **Resilience:** live backend BLOCKS label → router still routes medicine→MedUPI | ✅ PASS | ~6s (live RT) |
| 20 | Language switch en→ta→te→ml, router re-renders, no error | ✅ PASS | <1s total |

**Journeys executed: 20/20 PASS** (automated). These cover the router decision surface.
**NOT covered (manual, requires a human + camera):** real camera capture→analyse→route on a
physical phone; gallery upload of a real photo; live MedUPI Jan-Aushadhi inline panel content.

## A2. Edge cases & breakage

| Case | Result |
|---|---|
| No internet / backend unreachable | ✅ Router routes from typed text; honest "server isn't available, but from your text…" (proven against live failure) |
| Relevance-rail blocks the label | ✅ Router still routes (resilience fix); summary shows ⚠️ honestly |
| Empty / gibberish input | ✅ `unknown` + picture menu, never a guess |
| Rapid language switching (en→ta→te→ml) | ✅ no pageerror, router re-renders each time |
| Slow connection (3G) | ⛔ **NOT TESTED** — no network throttle run |
| Corrupted image upload | ⛔ **NOT TESTED** — needs manual file fuzzing |
| 10MB+ image | ⚠️ backend caps at 8MB (documented); frontend behaviour NOT manually tested |
| localStorage full/disabled | ⚠️ history/memory wrapped in try/catch; full-disable path NOT manually tested |
| JavaScript disabled | ⛔ No JS fallback (SPA) — documented limitation |

## A3. Cross-platform

| Platform | Result |
|---|---|
| Chromium (Playwright headless) @ 375/768/1280 | ✅ PASS (screenshots saved) |
| Chrome desktop (real) | ⛔ NOT TESTED (Playwright Chromium ≈ Chrome, not identical) |
| Firefox desktop | ⛔ NOT TESTED |
| Safari desktop | ⛔ NOT TESTED |
| Chrome Android (2 devices) | ⛔ NOT TESTED (needs devices/BrowserStack) |
| Safari iOS (2 devices) | ⛔ NOT TESTED (needs devices) |
| 375px mobile | ✅ PASS (cert screenshot) |
| 768px tablet | ✅ PASS (cert screenshot) |
| 1280/1440px desktop | ✅ PASS @1280 (cert screenshot) |

## A4. Accessibility (re-test)

| Check | Result |
|---|---|
| axe-core WCAG 2A/2AA — NEW violations from CUSOS router | ✅ **0** |
| axe-core page-wide | ⚠️ **8 pre-existing** (substrate + original capture buttons) — see [KNOWN_ISSUES.md](KNOWN_ISSUES.md) |
| Router card carries `data-chitti-response` (feedback widget attaches) | ✅ |
| `aria-live` route announcement + spoken route (blind) | ✅ (speakText fires on route) |
| Router buttons ≥ 44×40 tap target | ✅ |
| Picture-menu for illiterate/mute disambiguation | ✅ (9 tiles, spoken on tap) |
| Blind / Deaf / Illiterate full manual journeys (5 each) | ⛔ NOT TESTED manually (substrate gates pass; human pass pending) |
| Lighthouse a11y score | ⛔ NOT TESTED |

## A5. Language testing (9 languages)

| Lang | Result |
|---|---|
| English | ✅ router labels + reasons authored EN; renders |
| Hindi | ✅ router labels + reasons authored HI; renders |
| Tamil / Telugu / Malayalam | ✅ **switch tested, no flicker/crash, router re-renders**; UI labels via substrate; router reason text falls back to EN with native TTS (documented) |
| Kannada / Marathi / Bengali / Urdu | ⚠️ switch path same as above; per-language **content audit NOT done** |

> Honest: router `reason` strings are authored in EN + HI only. Other languages get EN reason
> text + native voice via the Voice Factory cascade. Full per-language reason translation is a
> tracked item, not a claim.

## A6. Regression testing

| Check | Result |
|---|---|
| Existing label-reader flow intact (capture/upload/type/result/history) | ✅ unchanged (router is additive) |
| 5 platform frontend gates (G1–G5) | ✅ all pass in cert |
| Feature flag OFF reverts to certified label-reader | ✅ by construction |
| Page previously certified GREEN 18/18 (2026-05-27) | ✅ base gates still green |
| New a11y violations introduced | ✅ **0** (axe) |

## A7. Performance

| Metric | Result |
|---|---|
| Deterministic router decision | ✅ <50ms (no network, no LLM) |
| Language switch response | ✅ <1s (cert: 4 switches well under) |
| Page load < 3s on 3G | ⛔ NOT TESTED (no throttle) |
| Image capture/save < 5s | ⛔ NOT TESTED (needs device/vision) |
| Memory < 100MB | ⛔ NOT TESTED (no profiling run) |

## A8. Bug report

See [BUG_REPORT.md](BUG_REPORT.md). Summary: **1 HIGH found & FIXED** (router dead-end on
backend block), **0 new Medium/Low introduced**, **8 pre-existing axe (Medium)** documented,
**2 P1 backend blockers** (rail + DeepSeek) documented as not-mine-to-fix-here.

## Pass rate (executed tests only)

- Automated journeys: **20/20 (100%)**
- Playwright cert: **16/16 (100%)**
- Router eval: **33/33 (100%)**, wrong-routing 0%, safety 4/4, honest-unknown 3/3
- **Excluded (NOT TESTED, flagged):** real cross-browser/device, 3G, large-image, Lighthouse,
  full 9-lang content audit, manual a11y journeys, production re-cert.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
