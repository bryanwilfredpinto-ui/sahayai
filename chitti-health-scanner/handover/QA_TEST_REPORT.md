**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# 🧪 QA Test Report — Chitti Health Scanner (Guardian Memory)

**QA role:** QA Engineer (performed by Chitti CTO / Claude) · **Date:** 2026-06-05
**Build under test:** `chitti_health_scanner.html` (Guardian Memory) + `/api/health-scanner/*`
**Method:** real automated browser testing — Playwright (Chromium 1223, WebKit, Firefox) against a local server (`http://127.0.0.1:8765`) + axe-core 4.8.2 a11y scan + `cert_all_pages.mjs` regression. Reproducible: `tools/qa_handover_health_scanner.mjs`, `tools/qa_webkit_smoke.mjs`. Raw results: `tools/qa_handover_result.json`, `tools/qa_webkit_result.json`. Screenshots: `tools/qa_handover_shots/`.

> **Honest scope:** real **iOS / Android hardware and the desktop Safari/Firefox apps were NOT available** in this environment. Cross-engine coverage uses the **WebKit (Safari engine)** and **Firefox (Gecko)** engines via Playwright — the same renderers, not Apple/Mozilla hardware. A human screen-share demo cannot be performed by an automated agent; the screenshots + reproducible scripts are the proxy.

---

## C1. Summary & pass rate

| Section | Result |
|---|---|
| **A1 — 20 user journeys** | **20 / 20 PASS** |
| **A2 — edge cases (7)** | **6 / 7 PASS** (1 = the documented 16 MB-i18n 3G load issue, KI-01) |
| **A3 — viewports (375/768/1440 + mobile emulation)** | **4 / 4 PASS** (0 px horizontal overflow) |
| **A4 — accessibility (axe-core)** | **0 violations** (contrast + landmark fixed) |
| **A5 — 9 languages + flicker** | **9 / 9** 97–98% coverage · **0 flicker detected** |
| **A6 — regression cert** | Health Scanner **18/18**, Fashion **18/18** GREEN; 2wheeler/4wheeler 16/18 (pre-existing, unrelated — see Known Issues KI-06) |
| **A7 — performance** | load **~1.0 s** local · JS heap **23 MB** · lang switch **103 ms** — all within targets (3G full-load = KI-01) |
| **Cross-engine** | Chromium ✅ · WebKit/Safari-engine ✅ (functional) · Firefox/Gecko ✅ |

**Overall functional pass rate: 100% of product journeys (20/20).** The single edge "fail" (slow-3G full load) is a platform-wide bottleneck (the 16 MB shared i18n file), documented with workaround — the page is interactive at DOMContentLoaded (~1 s).

---

## A1. User journeys (20) — all timed, all PASS

| # | Journey | Result | ~Time |
|---|---|---|---|
| 01 | Page loads, 13 scan cards, no page-error | ✅ | ~5 s |
| 02 | Disability-profile modal does not block (`?dp_skip=1`) | ✅ | ~3.6 s |
| 03 | Language English → Hindi translates chrome | ✅ | ~4 s |
| 04 | Tap a Scan card → Golden-Rule confirm appears | ✅ | ~4 s |
| 05 | **Nahi keeps camera CLOSED** (Golden Rule) | ✅ | ~4 s |
| 06 | Haan opens camera stage (upload fallback present) | ✅ | ~4.5 s |
| 07 | Upload a photo → result box + thumbnail | ✅ | ~5 s |
| 08 | Save to health memory → memory site card appears | ✅ | ~7 s |
| 09 | Two saves → compare overlay shows 2 images | ✅ | ~12 s |
| 10 | Trend text is honest — **no %, says "not a diagnosis"/"see a doctor"** | ✅ | ~12 s |
| 11 | Add family profile → per-profile memory (new profile empty) | ✅ | ~7 s |
| 12 | Save caregiver → persisted in localStorage | ✅ | ~5 s |
| 13 | Notify caregiver **without number is blocked** | ✅ | ~5 s |
| 14 | Notify **with** number → Golden-Rule confirm before WhatsApp | ✅ | ~5 s |
| 15 | "Scan the medicine" → navigates to MedUPI | ✅ | ~6 s |
| 16 | Health File link navigates | ✅ | ~5 s |
| 17 | **Forget area** (Golden-Rule) removes it — confirm sits above site overlay | ✅ | ~8 s |
| 18 | Forget pending photo → result closes, nothing saved | ✅ | ~6 s |
| 19 | Listen (speaker) — no error | ✅ | ~3.4 s |
| 20 | Per-response widget on result box (data-chitti-response + feedback bar) | ✅ | ~3.9 s |

*Console note:* the only console message during journeys is a **localhost CORS** line for `chitti-vaani-api/health` — a same-origin artifact of testing on `127.0.0.1`; production allows `https://sahayai.in` (verified earlier). It is **not a page error** and does not affect any journey.

## A2. Edge cases & breakage (6/7)

| Case | Result | Detail |
|---|---|---|
| No internet (offline) | ✅ | Local-first: capture→save→memory works fully offline. |
| Slow 3G full load | ❌ | `load` event > 30 s due to the **16 MB `chitti_lang.js`** (KI-01). Page is **interactive at ~1 s** (DOMContentLoaded); only the full-asset `load` is slow. Workaround documented; fix = split the i18n dict (platform-wide). |
| Corrupted image upload | ✅ | Non-image bytes → graceful result, no crash. |
| Large ~9 MB image | ✅ | Handled in ~3.8 s, no crash. |
| Rapid language switch (10× in <5 s) | ✅ | 10 switches in ~1.8 s, final state correct, **no errors, no flicker**. |
| localStorage disabled (Safari private) | ✅ | Page renders + degrades (fixed — all page storage now guarded). |
| JavaScript disabled | ✅ | Static content + medical disclaimer + 13 cards render; interactivity requires JS (documented, expected). |

## A3. Cross-platform / viewports

| Surface | Result |
|---|---|
| 375 px mobile | ✅ 0 px overflow |
| 768 px tablet | ✅ 0 px overflow |
| 1440 px desktop | ✅ 0 px overflow |
| Pixel 5 emulation (Chromium) | ✅ 0 px overflow (engine emulation, **not** real Android) |
| **WebKit (Safari engine)** iPhone-375 + iPad-768 | ✅ render + save→memory + Tamil switch all pass |
| **Firefox (Gecko)** iPhone-375 + iPad-768 | ✅ render + save→memory + Tamil switch all pass |
| Real Chrome-Android / Safari-iOS hardware (2 devices each) | ⛔ **NOT RUN** — no physical device / device cloud in this environment |
| Desktop Chrome | ✅ (Chromium is the engine) · Desktop Firefox/Safari apps | ⛔ engine-proxied, app not run |

## A4. Accessibility

- **axe-core 4.8.2: 0 violations** after fixes (color-contrast ×3 and the missing landmark were fixed — see Bug Report).
- Manual checklist: `lang` attribute set ✅ · 3 `aria-live` regions ✅ · 5 speaker (🔊) read-aloud controls ✅ · icon-first nav (7 controls) ✅ · **0 buttons without a label** ✅ · **0 images without alt** ✅.
- Blind / Deaf / Illiterate flows: voice read-aloud on every box, colour **+ icon + text** urgency, icon-only nav, upload + tap paths — all present and exercised through the journeys above.
- One residual: **76 sub-44px tap targets** flagged — predominantly the **shared `feedback-widget.js` icon buttons** (platform component); the page's own controls meet ≥48 px. Logged as KI-04.

## A5. Languages (all 9 Vaani primary) + flicker

| Lang | Coverage | Switch | Flicker |
|---|---|---|---|
| English | baseline | ~1.4 s | none |
| Hindi | 98% | ~1.6 s | **none** |
| Tamil | 97% | ~1.6 s | **none** |
| Telugu | 97% | ~1.6 s | **none** |
| Malayalam | 97% | ~1.5 s | **none** |
| Kannada | 97% | ~1.5 s | **none** |
| Marathi | 97% | ~1.4 s | **none** |
| Bengali | 98% | ~1.7 s | **none** |
| Gujarati | 98% | ~1.5 s | **none** |

- **Flicker check (the specific Tamil/Telugu/Malayalam concern): NO flicker detected.** A translating element was sampled at 0/60/200/300 ms after each switch — the value settles once and does not flip back to English. The rapid-switch stress (10×) also showed no flicker and no errors.
- The ~2–3% residual per language is intentional brand/technical English (Chitti, DeepSeek, AES-256-GCM…) plus widget-owned labels, and the long "golden line" which honestly Hindi-falls-back for non-Hindi (per the Voice-Strategy contract). **No Hinglish.**
- **Urdu:** not in this page's primary 9-language selector (the page exposes the **Vaani 9**: en/hi/ta/te/bn/mr/gu/kn/ml). Urdu lives in the 26-language substrate (voice-out + dictionary), not the on-page dropdown — documented, not a defect.

## A6. Regression

- `chitti_health_scanner` **18/18 GREEN**, `chitti_fashion` **18/18 GREEN** (cert_all_pages, all 5 frontend gates + 375 px + brand + lang dropdown).
- `chitti_2wheeler` / `chitti_4wheeler` **16/18** — fail G4 (`Chitti.lang.current()` null). **Pre-existing and unrelated** to this change: the Health Scanner loads the *same* `chitti_lang.js` and passes G4, so this is page-specific to those two products. Flagged for their owning team (KI-06). No regression introduced by Guardian Memory.

## A7. Performance

| Metric | Target | Measured | Verdict |
|---|---|---|---|
| Page load (local) | — | DOMContentLoaded ~1.0 s, load ~1.1 s | ✅ fast |
| Page load on 3G | < 3 s | full `load` > 30 s (16 MB i18n) | ❌ KI-01; interactive ~1 s |
| Language switch | < 1 s | **103 ms** | ✅ |
| Image capture/save | < 5 s | sub-second real work (measured value includes deliberate test delays) | ✅ |
| Memory usage | < 100 MB | **23 MB** JS heap | ✅ |

---

*Bug details → `BUG_REPORT.md`. Known issues → `KNOWN_ISSUES.md`. Sign-off → `SIGNOFF.md`. Architecture → `ARCHITECTURE_REVIEW.md`.*
