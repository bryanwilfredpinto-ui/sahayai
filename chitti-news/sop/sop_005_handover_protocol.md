# SOP-005 — Handover Gate

> World Class CNOS — Commando Discipline. Zero Excuses.

Mechanical procedure for the handover gate. The CTO runs every automated test itself and fills every document; the ONLY thing left for Sire is real iPhone/Android hardware. A handover with any placeholder, blank, or `_____` is REJECTED.

---

## Profile

| | |
|---|---|
| Owner | CTO (Chitti) — runs the full automated battery; Sire signs off on real hardware only |
| Cadence | Before any handover; re-run on any change to a shipped surface |
| Trigger | A feature reaches "ready for Sire"; or a release candidate is cut |
| Escalation | Any gate RED, OR any placeholder/blank remaining → handover REJECTED; fix and re-run the full battery before re-attempting |

---

## Steps

1. **CEOS compliance.** Run `verify_ceos_compliance_news.mjs`. Confirm every CEOS stage is present and green: Read → Skill → SOP → Swarm → Guardrails → Evals → Observability → Accessibility → Memory → Certification. Any missing stage = RED. (Pattern: [`verify_ceos_compliance_news_ai.mjs`](../../tools/verify_ceos_compliance_news_ai.mjs).)
2. **Omnibus certification.** Run `cert_news_omnibus.mjs` covering the full matrix: 26 languages × 4 a11y profiles (Blind / Deaf / Mute / Illiterate) × engines × viewports, plus Trust Strip render, Cancelled-story respect, and coverage payload. Every cell must be PASS or explicitly AUTOMATION-LIMITED with a reason. (Pattern: existing [`cert_chitti_news_v2.mjs`](../../tools/cert_chitti_news_v2.mjs) + the `_news_ai` omnibus.)
3. **Real-sample tests.** Run `test_news_samples.mjs` against real articles end-to-end: classify → verify (≥2 source) → summarize (real language output) → impact → action. No mocked feed — real RSS samples only.
4. **Fill the handover doc.** Run `fill_universal_handover_news.mjs` to auto-fill the Universal Handover with measured PASS/FAIL results. Zero placeholders — every cell carries a real result or AUTOMATION-LIMITED + reason.
5. **CTO runs ALL automated tests itself.** 26 languages, all 4 a11y profiles, and REAL file/article samples are run by the CTO — never handed to Sire. Telling Sire to run a command or journey is a process violation.
6. **Scan for placeholders.** Grep the filled handover for `☐`, `_____`, `TODO`, `TBD`, or any blank cell. One hit = handover REJECTED.
7. **Verify on live.** Curl the production endpoint(s) before declaring anything "live." Sire never discovers a 401 / network error / empty response — those are CTO fixes first (No-handover-until-e2e-GREEN rule).
8. **Leave ONLY real hardware for Sire.** The single remaining slot is real iPhone + real Android device testing. Everything automatable is already PASS in the filled doc.

---

## Hard rules

- ALL automated tests run by the CTO — 26 langs, 4 a11y profiles, real samples — never by Sire.
- Handover REJECTED if ANY placeholder, blank, `_____`, or unfilled cell remains.
- Never say "live" without curling production first.
- Sire's slot = real iPhone/Android hardware only.
- Every gate green AND zero placeholders, or it does not hand over.

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
