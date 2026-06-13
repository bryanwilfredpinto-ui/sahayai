# CNAI_KNOWN_ISSUES.md — Chitti News AI (as of 2026-06-13)

Honest list of what is NOT done or NOT verified. No issue hidden.

## Open — verification gaps (need live/browser/human; not code defects)
1. **axe-core 0-violations** not yet run on the rendered page (needs Playwright/axe). Markup is a11y-ready; not certified.
2. **NVDA / VoiceOver** real screen-reader journeys (audit §4) — not recorded.
3. **Lighthouse perf** (LCP/TTFB/Slow-3G, §12/§15) — not run.
4. **Live Flask routes + news classifier F1 + 7 streams** (§5/§8) — backend not exercised this session.
5. **5 real users + Founder persona tests** (§9/§10) — human-only, pending.
6. **Real Jio device @360px + offline PWA** (§15) — pending.

## Open — code/scope limitations (honest)
7. **`data-i18n` coverage is representative, not exhaustive** across the 1161-line `chitti_news_ai.html`. The i18n engine + all 11 language bundles are complete and tested; remaining per-element wiring (every heading/placeholder/label) is a finishing task. *Owner: BO6 follow-up.*
8. **News relevance labeling (SOP7/Skill6)** is verified as a *contract* (4-label vocabulary) at the engine-test layer; the live per-article classifier lives in `news_ai.py` + frontend and is not exercised by the JS unit tests.
9. **Profession & cohort seed data** (BO5 `PATTERNS`, BO1 `PROFESSIONS`) are seeds; real counts come from Turso `swarm_data` once adoption begins. Below-50 cohorts are correctly suppressed.
10. **"Chitti Learns" auto-registration** (BO2 plan) is intentionally a consent-gated *plan* only — never auto-creates accounts or sits exams. The legal review of even the assisted-registration flow (flagged in validation risk #5) is still pending before that path ships in the UI.
11. **TTS/STT** rely on Web Speech API availability per browser; Bhashini substrate is the fallback path but not wired to live ULCA creds (matches repo-wide Voice Factory status).

## Closed this build (fixed in testing)
- Plural "pigs" not resolving to Farmer → fixed (plural-tolerant alias).
- Plural "hours" missing the scam timeline regex → fixed.

## Not bugs (by design — do not "fix")
- Topic roadmap (`generate(goal)`) returns a *variable* stage count (knowledge DAG); the *profession* path returns exactly 5. Two shapes, intentional.
- localStorage-only storage (no cross-device sync) — DPDP/privacy choice.
- No LLM in classification/tab-filter path — CI-enforced constraint.
