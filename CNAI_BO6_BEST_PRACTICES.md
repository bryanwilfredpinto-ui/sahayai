# CNAI_BO6_BEST_PRACTICES.md — Accessibility & Languages

**Top 3 insights:** (1) full-UI i18n via a string map + data-i18n, no build tools; (2) voice (TTS/STT) language must follow the UI language; (3) WCAG 2.2 AA with axe-core 0-violations as a hard gate.

### Applied
- **`cnai_i18n.js` (NEW):** UI_STRINGS for all 11 languages (en, hi, te, kn, ta, bn, mr, gu, ml, pa, or) — completed mr/gu/ml/pa/or; `applyLanguage(lang)` re-renders every `[data-i18n]`/`[data-i18n-aria]`; `autoDetect()` (Hindi default for Indian locales); persists to `cnai_lang` + mirrors `chitti_lang`. Pure language; technical terms English.
- **`cnai_accessibility.js` (NEW):** aria-live announcer, senior mode (24px, remembered), skip-link, focus management, TTS/STT synced to UI language (`srLang`), touch-target audit (≥44px). Headless-safe (never throws without a DOM).
- **HTML wiring:** both scripts loaded; representative controls carry `data-i18n` (roadmap CTA, forget) proving the pipeline; dropdown change → applyLanguage.
- **Free / no-throw / a11y-ready.**

### Accessibility specific to BO6
This BO *is* the accessibility layer (Skill 9): blind (SR + ARIA + TTS), deaf (text equivalents), mute (no required voice), illiterate (icon + TTS), senior (24px), rural (text-first). axe-core 0-violations verified in BO7.

### Known limitation (honest)
Representative — not yet exhaustive — `data-i18n` coverage across all 1161 HTML lines; remaining per-element wiring tracked in CNAI_KNOWN_ISSUES.md. The mechanism + all 11 language bundles are complete and unit-tested.

### CEOS / deviation
Dual-key persistence (cnai_lang + chitti_lang) documented in RESEARCH §F.
