**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# 🐞 Bug Report — Chitti Health Scanner (Guardian Memory)

**Found by:** automated QA suite (`tools/qa_handover_health_scanner.mjs`) + axe-core 4.8.2, 2026-06-05.
**Status:** all Critical = 0, all High = **FIXED**. Evidence screenshots in `tools/qa_handover_shots/`.

Priority key: **Critical** (blocks use / safety) · **High** (breaks a journey or accessibility) · **Medium** (degraded but usable) · **Low** (cosmetic / edge).

---

## Bugs FOUND and FIXED in this pass

### BUG-01 — [HIGH] "Forget this area" confirm opened BEHIND the compare overlay
- **Found by:** Journey 17 (timeout — could not click Haan).
- **Root cause:** `.confirm-overlay` had `z-index:9000`, but the site/compare overlay is `z-index:9100`. The Golden-Rule confirm rendered *under* the open overlay, so the user could not confirm deleting an area → the "Chitti forget this area" action was unusable while the area was open.
- **Fix:** `.confirm-overlay` → `z-index:9500` (always above the site overlay).
- **Verified:** Journey 17 now PASS — "area forgotten". Screenshot `qa_handover_shots/J_17*.png`.

### BUG-02 — [HIGH] Page threw a pageerror when localStorage is disabled (Safari private mode)
- **Found by:** Edge case "localStorage disabled".
- **Root cause:** `var CURRENT_LANG = ... || localStorage.getItem('chitti_lang')` and `currentProfile()`/profile writes accessed `localStorage` **without a guard**; in Safari private mode (and the test's blocked-storage simulation) the property access throws → uncaught pageerror.
- **Fix:** wrapped `CURRENT_LANG` init in try/catch; added guarded `lsGetRaw`/`lsSetRaw` and routed `currentProfile`, `switchProfile`, `addProfile` through them. All page storage access is now guarded.
- **Verified:** edge case now PASS — "page renders with localStorage blocked".

### BUG-03 — [MEDIUM] Three WCAG AA colour-contrast failures
- **Found by:** axe-core (`color-contrast`, serious).
- **Details:** legend "Normal" green `#138808` on tinted bg = 4.03; legend "Seek care" red `#dc2626` = 4.13; shared `.obs-pill.active` green = 4.19 (all below 4.5:1).
- **Fix:** darkened legend text (`#0a5a04` / `#7a4a0c` / `#a31515`) and the shared `chitti_observability.js` `.obs-pill.active` to `#0a5a04`.
- **Verified:** axe-core now reports **0 violations**.

### BUG-04 — [MEDIUM] Sticky disclaimer bar was outside any landmark
- **Found by:** axe-core (`region`, moderate).
- **Fix:** `med-bar` given `role="region" aria-label="Medical disclaimer"` (named landmark).
- **Verified:** axe-core now reports **0 violations**.

### (Test-harness corrections — NOT product bugs, logged for honesty)
- **TH-01:** Journey 10 initially flagged "diagnosis language" — the regex matched the word *diagnosis* inside the honest line *"This is not a diagnosis."* The product text is correct; the test regex was tightened to flag only positive disease claims.
- **TH-02:** the flicker probe initially sampled the brand element (`.hero h1`, always English) → inconclusive. Retargeted to a translating element; result: **no flicker**.
- **TH-03:** Journey 17 was non-deterministic (fixed-delay race); hardened with explicit `waitForSelector('#confirm-overlay.shown')`. Now 20/20 stable.

---

## Open bugs at handover

**Critical: 0  ·  High: 0.**

The remaining items are **Known Issues** (Medium/Low/tech-debt/by-design), documented with workarounds in `KNOWN_ISSUES.md` — chiefly the platform-wide 16 MB i18n file (3G load) and unencrypted local photos. None block the Guardian Memory (local-first) release.

---

## Evidence index (`tools/qa_handover_shots/`)
- `J_01..J_20*.png` — one screenshot per user journey.
- `VP_mobile-375 / VP_tablet-768 / VP_desktop-1440 / VP_pixel5_emulation.png` — viewports.
- `LANG_en/hi/ta/te/ml/kn/mr/bn/gu.png` — each language rendered.
- `WEBKIT_*_iphone-375 / *_ipad-768.png` — Safari-engine renders.
- Raw machine-readable results: `tools/qa_handover_result.json`, `tools/qa_webkit_result.json`.
