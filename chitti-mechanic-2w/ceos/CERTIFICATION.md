🎖️ World Class Chitti Mechanic 2 Wheeler — Commando Discipline. Zero Excuses.

# CERTIFICATION — Chitti Mechanic 2 Wheeler

> A page is **never** called "live" or "GREEN" until cert verifies RENDERED OUTPUT, not
> just DOM existence. Cert is run by the CTO; the Sire only does real-device sign-off.

## Conditional vs Fully Certified

| Level | Criteria |
|---|---|
| **CONDITIONAL** | Deterministic engine passes its gold assertions; all 5 frontend gates present; 5 device screenshots captured; but ≥1 metric is AUTOMATION-LIMITED (e.g. OCR awaiting vision key, DeepSeek-narration accuracy awaiting quota) **or** real iPhone/Android sign-off pending |
| **FULLY CERTIFIED** | Every G0–G10 gate PASS with measured numbers; all 8 EVALS targets met; axe-core 0 critical across 9 profiles × 26 langs; founder audit signed; Production Readiness ≥ 90/100; real-device sign-off received |

A CONDITIONAL cert must name the exact blocker per unmeasured metric. No metric is ever
marked PASS from memory.

## 10-section Product Audit Questionnaire

1. **Should it exist?** Build Score ≥ 80 justified against the 20+20 research.
2. **Determinism** — is every km/₹/date engine-computed and provenance-tagged?
3. **Safety** — are safety-critical jobs (brakes/steering/electrical) hard-routed to
   mechanic, never 🟢 DIY?
4. **Honesty** — does the engine say "I'm not sure" instead of inventing? No
   "guaranteed clean"?
5. **Accessibility** — four users served? 26 langs via `chitti_lang.js`? axe-core 0?
6. **Trust UX** — confidence + risks + sources + 5-element widget on every
   `[data-chitti-response]`?
7. **Privacy** — Vault/Twin local-only? No RC/insurance number to any LLM? "Chitti
   forget" works?
8. **Resilience** — degraded mode on backend down? Honest 501 stubs don't block
   answers?
9. **Coverage** — all 15 features + Twin + Ownership Scores + AI Coach present and
   wired?
10. **Production readiness** — G0–G10 status, with every unmeasured item flagged
    AUTOMATION-LIMITED + blocker.

## What `tools/cert_mechanic_2w.mjs` verifies

- Engine gold assertions: reminders (8 types, off-by-one = fail), service min(km,
  months), OBD code → exact cause, scam >30% threshold, tyre expert pick, buy-score
  determinism + no "guaranteed" string.
- Guardrails: every result object carries `confidence`, `risks[]`, `sources[]`;
  safety-critical never 🟢; unknown OBD/symptom → "I'm not sure".
- Frontend gates (rendered, not DOM-only): `feedback-widget.js` 5 elements on every
  `[data-chitti-response]` card; `chitti_a11y.js` injected; Disability-Profile prompt;
  language auto-detect; ISL panel.
- Visual cert: 5 device screenshots written to `tools/cert_screenshots/`
  (desktop 1920×1080, laptop 1366×768, iPad, iPhone, Android), each > 8 KB, brand logo
  present, rendered background — per the mandatory-visual-screenshot rule.
- Backend: `/api/2w/health` 200; the other `/api/2w/*` routes return honest 501 (not a
  crash) and the client still serves the engine answer.

---
> **World Class Chitti Mechanic 2 Wheeler — Commando Discipline. Zero Excuses.**
