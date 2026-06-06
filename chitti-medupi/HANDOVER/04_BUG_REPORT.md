# 04 — BUG REPORT · Chitti MedUPI

**Date:** 2026-06-06 · **Build:** `f9ec517` · QA found **2 real bugs**, both **serious WCAG violations**, both **fixed at the substrate (fleet-wide)** and re-verified to 0.

## BUG-1 — Insufficient colour contrast on the per-response "Chitti" button (WCAG 1.4.3, serious)

| Field | Value |
|---|---|
| Found by | `tools/medupi_a11y.mjs` → axe-core, all 9 disability profiles |
| Symptom | `.chitti-fb-bbtn.demo .chitti-fb-bbtn-text` ("Chitti" demo label) rendered `#E07B1D` saffron on the `#fff5eb` cream bar = **2.77:1** (WCAG AA requires 4.5:1 for small bold text). 2 nodes per page. |
| Root cause | `chitti_theme.css` line 449 forced `color: var(--chitti-saffron-deep)` (#E07B1D) with `!important`, overriding the widget's own accessible `#7c2d12`. |
| Scope | **Fleet-wide** — every Chitti page that loads the per-response widget + theme. Not MedUPI-specific. |
| Fix | `chitti_theme.css`: `color: #9a4a07 !important;` — a deeper saffron that keeps brand warmth and clears 4.5:1 (**measured 5.8:1**). |
| Re-verify | axe-core re-run: 0 color-contrast violations across all 9 profiles. |
| Severity | High (serious WCAG; breaks low-vision users) → **FIXED** |

## BUG-2 — Nested interactive controls inside scan-action buttons (WCAG 4.1.2 nested-interactive, serious)

| Field | Value |
|---|---|
| Found by | `tools/medupi_a11y.mjs` → axe-core (+ `tools/medupi_axe_detail.mjs`, `tools/_nested_probe.mjs` for root-cause) |
| Symptom | `#btn-camera-scan`, `#btn-image-upload`, `#btn-voice-scan`, `#btn-qr-scan` (4 `<button class="scan-action">`) each contained a `.chitti-card-widget` bar with `role="button" tabindex="0"` spans → **interactive controls nested inside a button** (4 nodes). Breaks screen-reader + keyboard navigation. |
| Root cause | `chitti_card_widget.js` matched `.scan-action` (in its default selector) and `appendChild`-ed its 5-icon widget **inside** the element. When the matched "card" is itself a `<button>`, that nests interactives. It was also wrong by contract: feedback belongs on **response** cards, not on **action triggers**. |
| Scope | **Fleet-wide** — any page where the card-widget selector matches an interactive element. |
| Fix | `chitti_card_widget.js`: added `isInteractiveEl()` + an early return in `buildWidget()` — the widget never attaches inside `<button>/<a href>/<input>/<select>/<textarea>/[role=button…]/[contenteditable]`. |
| Re-verify | axe-core re-run: 0 nested-interactive violations across all 9 profiles. |
| Severity | High (serious WCAG; breaks blind/keyboard users) → **FIXED** |

## Fleet-wide impact analysis (regression safety of the 2 fixes)

Both fixes are **strictly safer** and were reviewed for collateral impact:

- **BUG-1** only darkens one button-text colour (`#E07B1D` → `#9a4a07`) on the per-response demo button. No layout, no behaviour change; contrast strictly improves. Other uses of `--chitti-saffron-deep` (hover gradients, larger text) are untouched — the change is scoped to the single `.chitti-fb-bbtn.demo` rule.
- **BUG-2** makes the card-widget *skip* interactive elements it previously (incorrectly) decorated. Action buttons lose a feedback bar that should never have been there; genuine **response cards** (`[data-chitti-response]`, `.chitti-response`, content cards) are unaffected — they are not interactive elements. This also removes a real a11y defect from every page, not just MedUPI.

No other Chitti page was re-certified in this pass (out of scope), but the change cannot *introduce* a violation — it only removes nesting and improves contrast. Recommended follow-up: opportunistic re-cert of Fashion/Mechanic/News-AI on their next touch (they share both substrates).

## Bug tally

| Severity | Count | Status |
|---|---|---|
| Critical | 0 | — |
| High (serious WCAG) | 2 | ✅ both FIXED + re-verified 0 |
| Medium | 0 new | (Slow-3G load + lang-switch timing tracked in 03_KNOWN_ISSUES, pre-existing characteristics not regressions) |
| Low | 0 | — |

**Bug report verdict: 0 open bugs. 2 found, 2 fixed, both re-verified to 0 across 9 profiles.**
