🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# KNOWN ISSUES — Chitti Fashion (CFOS v2.1) — HONEST LIST

> **Date:** 2026-06-05. Nothing hidden. Every item has a severity, the exact trigger, and a workaround.
> **Critical = 0. High = 0.** The list is Medium / Low / external-dependency only.

## Language flicker — explicitly tested, NONE found

The handover template flagged "Malayalam/Tamil/Telugu flicker." **We tested for it directly**
(switch language, measure label state at 150 ms and again at 1550 ms across all 9 languages):

| Language | Flicker observed? |
|---|---|
| Tamil | ❌ **None** — 0 raw keys, 0 blank labels, stable across the settle window |
| Telugu | ❌ **None** |
| Malayalam | ❌ **None** |
| en/hi/kn/mr/bn/gu | ❌ **None** |

**No flicker in any of the 9 languages.** The MutationObserver guard + the self-contained
`chitti_fashion_i18n.js` bundle hold every label stable. If a flicker is ever seen in the field,
re-run `node tools/fashion_handover_audit.mjs` and check the `flicker[]` block — `stable:true` for all 9 today.

## Issues by priority

### 🟠 MEDIUM (Must / Should fix — none block core use)

**KI-01 — 3G page load is 6.8 s (target < 3 s).** *Must fix.*
- **Trigger:** first load on a throttled 3G link (400 kbps, 400 ms RTT).
- **Cause:** the shared `strings.js` is 561 KB (whole-platform string table loaded by every page); the
  MedUPI-aligned font pair (Inter + JetBrains Mono) adds ~0.6 s vs the prior single-font skin.
- **Workaround today:** fonts use `display=swap` so text paints immediately; after first load the app is
  fully cached and instant; the deterministic engine works even offline. Repeat visits are fast.
- **Fix:** split `strings.js` per page / lazy-load non-active languages; optionally self-host or subset the
  fonts. Effort: M.

**KI-02 — No `<noscript>` fallback.** *Should fix.*
- **Trigger:** JavaScript disabled in the browser.
- **Behavior:** static HTML renders but the app is non-functional, with no message explaining why.
- **Workaround:** none needed for ~99% of users (JS on by default).
- **Fix:** add a `<noscript>` banner ("Please enable JavaScript / open in the Chitti app"). Effort: S.

**KI-06 — No wardrobe export/import.** *Should fix.*
- **Trigger:** user switches device or clears browser storage → wardrobe is lost (device-local by design).
- **Workaround:** re-add items; photos are quick to recapture.
- **Fix:** add JSON export/import (still on-device, privacy-preserving). Effort: M.

**KI-07 — Optional API calls have no explicit timeout/retry.** *Should fix.*
- **Trigger:** the optional LLM endpoint is slow/hung.
- **Behavior:** the call is wrapped in `try/catch` and the app already degrades to the engine, but a hung
  socket could delay the *AI-explain* path specifically.
- **Workaround:** core features never call the API, so the user is never blocked.
- **Fix:** add `AbortController` with a 6–8 s timeout on `faAsk`. Effort: S.

**KI-08 — No CI test-gate.** *Should fix.*
- **Trigger:** a push could in principle ship without the suite running.
- **Workaround:** the full suite is run locally before every push (this pack is the evidence).
- **Fix:** GitHub Action running `fashion_engine_test` + `fashion_qa` + `fashion_eval_harness` on PR. Effort: M.

### 🟡 LOW (Nice to fix)

**KI-05 — localStorage is unencrypted.** *Nice to fix.*
- **Data class:** non-sensitive — style prefs, learning counters, impact ledger, size in cm. No PII, no
  credentials, no photos (photos are in IndexedDB, never transmitted).
- **Fix:** optional obfuscation; low value given the data class. Effort: S.

## 🔵 EXTERNAL DEPENDENCIES (not bugs — honest scope limits)

**KI-03 — Physical device lab not run.** *Must do before final HUMAN handover.*
- Cross-engine testing covered **Chromium, Firefox, and WebKit (the exact Safari/iOS engine)** across
  375/768/1440 px with **0 JS errors** — the strongest automated proxy. But real Chrome-on-Android (2
  devices) and iOS-Safari (2 devices) hardware — touch, camera capture, on-device TalkBack/VoiceOver —
  was **not** run from this environment. **Recommendation:** a short human device-lab pass before sign-off to a human owner.

**KI-04 — Human screen-reader pass not run.** *Must do before final HUMAN handover.*
- Accessibility is **107/107** on the DOM/ARIA suite, **axe-core 0 violations** (the WCAG engine behind
  WAVE/Lighthouse — now run as a gate, `fashion_axe_scan.mjs`), plus 5/5 four-user journeys. **The automated
  scanner is now DONE.** What remains is a **human** pass with NVDA (Windows) / VoiceOver (iOS) / TalkBack
  (Android) — recommended before human-owner sign-off. (axe initially found 3 real WCAG issues; all fixed — BUG-F5/F6/F7.)

**LLM-dependent features capped (by design, awaiting the DeepSeek key — Sire's one unblock):**
- **Garment vision** (auto-detect garment/damage from a photo) → today the user taps a category/damage chip (complete).
- **Conversational voice** (free-flowing "dost") → today voice reads the deterministic text (works).
- **Vaani routing** (fashion via the sole-interface) → needs the relevance-rail allowlist fix (pre-writable; one CTO deploy).
- These are **honest stubs, not failures.** The app is standalone-complete without them during the testing period.

## Scope note — products in this pack

This handover covers **Chitti Fashion** only. **Chitti Mechanic** and **Chitti Health Scanner** are
separate products with their own handover packs and were **not** tested here — do not infer their status from this document.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
