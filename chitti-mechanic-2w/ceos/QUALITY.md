🎖️ World Class Chitti Mechanic 2 Wheeler — Commando Discipline. Zero Excuses.

# QUALITY — Chitti Mechanic 2 Wheeler (CQOS lens)

> Quality is its own pillar. This file is the merge-blocker bar; [EVALS.md](EVALS.md)
> is how it's measured. All numeric targets are **to be measured**, never pre-claimed.

## The CQOS quality layers

| Layer | Bar | Enforcement |
|---|---|---|
| **1. Deterministic correctness** | Critical errors = 0; reminders 100%, OBD lookup 100%, insurance ±5% | `tools/cert_mechanic_2w.mjs` gold assertions; provenance tag on every km/₹/date |
| **2. Safety / no-guarantee** | 0 safety-critical jobs marked 🟢 DIY; 0 "guaranteed clean" claims | guardrail tests; every result carries `risks[]`; safety class hard-coded to 🔴 |
| **3. Accessibility** | 100% — four users + 26 langs + axe-core 0 critical | `chitti_a11y.js` + `chitti_lang.js` + 9-profile audit |
| **4. Honesty / anti-hallucination** | <1%; "I'm not sure" when unverifiable; honest 501/stub | engine computes, DeepSeek narrates only; honest stub on 429/offline |
| **5. Trust UX** | confidence + risks + sources on every answer; 5-element widget on every box | per-response `feedback-widget.js` (🔊/🤖/👍/👎/✏️) |

## Quality Gates G0–G10 (merge-blockers)

| Gate | Name | Pass threshold |
|---|---|---|
| **G0** | Should-this-exist | **Build Score ≥ 80** |
| **G1** | CEOS Compliance | full CEOS doc set present + consistent |
| **G2** | UI Cert | 5 device screenshots: desktop 1920×1080, laptop 1366×768, iPad, iPhone, Android |
| **G3** | Button Audit | every button wired to an engine fn or honest stub; no dead controls |
| **G4** | 8 User Journeys | all 8 pass end-to-end |
| **G5** | Accessibility | 9 profiles × 26 langs; **axe-core 0 critical** |
| **G6** | Research | **20 + 20 apps** cited (see RESEARCH_BEST_APPS.md) |
| **G7** | Devil's Advocate | **20 weaknesses** documented + addressed/accepted |
| **G8** | Hallucination Audit | **< 1%**; no invented number/diagnosis |
| **G9** | Founder Audit | founder sign-off |
| **G10** | Production Readiness | **≥ 90 / 100** |

## SUCCESS-metric pass/fail thresholds

Derived from EVALS targets: Reminder 100% · Insurance ±5% · Tyre ≥90% · Scam ≥80% ·
DIY ≥70% · OCR ≥95% · OBD 100% · Hallucination <1%. A gate fails if its metric is below
target **or unmeasured** — "unmeasured" is reported as AUTOMATION-LIMITED with the
specific blocker (e.g. vision key for OCR, DeepSeek quota for narration accuracy), never
as a pass.

## Honest status

The quality **contract** exists (G0–G10 gates, eval designs, deterministic engine with
provenance, every result `{confidence, risks[], sources[]}`). Engine numbers are
measured by `tools/cert_mechanic_2w.mjs` once gold cases are seeded. Live
DeepSeek-narration accuracy and OCR/vision remain AUTOMATION-LIMITED (DeepSeek funding +
vision key) — never claimed before measured.

---
> **World Class Chitti Mechanic 2 Wheeler — Commando Discipline. Zero Excuses.**
