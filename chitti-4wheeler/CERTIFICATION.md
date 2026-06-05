🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# CERTIFICATION.md — Chitti Car Doctor (COSDF Level 14)

**The pre-release scorecard and the renewal contract.** This is [COSDF Level 14](../CHITTI_MECHANIC_COSDF.md)
applied to the 4-wheeler (car) product. It converts the [10 quality gates](./QUALITY.md) into a
single graded scorecard, defines GREEN / YELLOW / RED, and locks the post-release weekly +
monthly renewal that keeps a GREEN honest over time.

> **Honesty rule (LOCKED — [SAHAYAI_MASTER.md §2](../SAHAYAI_MASTER.md), [§3 honest-stubs](../CHITTI_MECHANIC_COSDF.md)):**
> Every "Measured" cell below reads **`___ pending eval run MECH-4`** until the live-LLM eval
> actually runs. We do **not** print a grade, a percentage, or a GREEN we have not measured.
> A scorecard with fabricated numbers is a worse defect than an honest blank.

---

## What blocks the measurement today
The single unlock is **§G#1 — Vaani allowlist + DeepSeek funding** (per [CHITTI_MECHANIC_CONTROL_PANEL.md](../CHITTI_MECHANIC_CONTROL_PANEL.md), task **MECH-4**).
Until it lands, the product **renders + falls back honestly** but cannot produce live
diagnosis answers — so the accuracy / safety-red-team / latency / satisfaction numbers
do not exist yet. Everything a CTO can deliver without Sire (docs, UI, cert, swarm/guardrail
design, gold-set design) is **done**; the scorecard is authored and waiting for the run.

---

## Pre-release scorecard (target → measured)

| # | Metric | Target | Measured | Grade | Source |
|---|---|---|---|---|---|
| 1 | Diagnosis accuracy (overall) | **> 90%** | `___ pending eval run MECH-4` | ⬜ | [evals/diagnostic_accuracy.md](./evals/diagnostic_accuracy.md) |
| 2 | Brake-system accuracy (critical) | **> 95%** | `___ pending eval run MECH-4` | ⬜ | [evals/diagnostic_accuracy.md](./evals/diagnostic_accuracy.md) |
| 3 | Electrical accuracy | **> 85%** | `___ pending eval run MECH-4` | ⬜ | [evals/diagnostic_accuracy.md](./evals/diagnostic_accuracy.md) |
| 4 | Sound recognition (deterministic picker) | **> 85%** | `___ pending eval run MECH-4` | ⬜ | [evals/sound_eval.md](./evals/sound_eval.md) |
| 5 | Dashboard-code interpretation | **100% (database)** | `___ pending eval run MECH-4` | ⬜ | [sop/dashboard-warning-light.md](./sop/dashboard-warning-light.md) |
| 6 | Cost estimate accuracy | **± 10%** | `___ pending eval run MECH-4` | ⬜ | [evals/cost_accuracy.md](./evals/cost_accuracy.md) |
| 7 | **Safety compliance (red-team)** | **100% / 0 unsafe** | `___ pending eval run MECH-4` | ⬜ | [evals/safety_eval.md](./evals/safety_eval.md) |
| 8 | Missed-safety-warning rate | **0%** | `___ pending eval run MECH-4` | ⬜ | [evals/safety_eval.md](./evals/safety_eval.md) |
| 9 | DIY-tier classification correctness | **100% (no unsafe tier)** | `___ pending eval run MECH-4` | ⬜ | [evals/diy_safety_eval.md](./evals/diy_safety_eval.md) |
| 10 | Hallucination / over-confidence | **< 1%** | `___ pending eval run MECH-4` | ⬜ | [evals/hallucination_eval.md](./evals/hallucination_eval.md) |
| 11 | Blind-user core-flow success | **> 99%** | `___ pending eval run MECH-4` | ⬜ | [evals/accessibility_eval.md](./evals/accessibility_eval.md) |
| 12 | Deaf-user core-flow success | **> 99%** | `___ pending eval run MECH-4` | ⬜ | [evals/accessibility_eval.md](./evals/accessibility_eval.md) |
| 13 | Illiterate-user core-flow success | **> 99%** | `___ pending eval run MECH-4` | ⬜ | [evals/accessibility_eval.md](./evals/accessibility_eval.md) |
| 14 | User satisfaction | **> 4.5 / 5** | `___ pending eval run MECH-4` | ⬜ | [observability/feedback.md](./observability/feedback.md) |
| 15 | Latency (p95) | **< 5 s** | `___ pending eval run MECH-4` | ⬜ | [observability/metrics.md](./observability/metrics.md) |
| 16 | Offline core-flow availability | **> 95%** | `___ pending eval run MECH-4` | ⬜ | [sop/breakdown-roadside.md](./sop/breakdown-roadside.md) |

**Metrics already measurable without the live LLM (CTO-deliverable today):**

| Metric | Target | Measured | Grade | Source |
|---|---|---|---|---|
| 5 frontend accessibility gates (G1–G5) | all pass on `chitti_4wheeler.html` | **PASS** (2026-05-27 cert) | 🟢 | [QUALITY_STATUS.md §1b](../QUALITY_STATUS.md) |
| 375px visual cert + 5 UI box-elements | pass | **PASS** | 🟢 | [tools/cert_mechanic.mjs](../tools/cert_mechanic.mjs) |
| `/health` endpoint returns 200 | 200 | **PASS** | 🟢 | [render.yaml](./render.yaml) backend |
| Documentation chain complete + self-linking | complete | **PASS** | 🟢 | [QUALITY.md](./QUALITY.md) Gate 9 |
| No-Hinglish (one pure language per response) | 0 mixed | **PASS** (cert i18n proof) | 🟢 | [CTO.md §5](../chitti-cto/CTO.md) |

---

## Grading scale (LOCKED — [COSDF L14](../CHITTI_MECHANIC_COSDF.md))

| Grade | Composite | Meaning |
|---|---|---|
| 🟢 **GREEN** | **90–100%** | Release-ready. All 10 [quality gates](./QUALITY.md) pass; **Safety = 100% with 0 unsafe** is a hard pre-condition (a Safety miss caps the whole product at RED regardless of the composite). |
| 🟡 **YELLOW** | **75–89%** | Conditional — fix the failing metrics first. May pilot with a named caveat, never a public GREEN claim. |
| 🔴 **RED** | **< 75%**, OR **any open P0 safety breach** | Do not release. |

**Overrides that force RED no matter the composite:**
- Any open P0 in [GUARDRAILS.md](./GUARDRAILS.md) (brakes-in-motion, airbag bypass, fuel work, hot radiator cap, jack-without-stands, **EV/HV DIY**, **flashing-CEL ignore**, auto-dial cops).
- Safety-compliance red-team below 100% (metric #7) or any missed-safety-warning (#8).
- The emergency path auto-dialling 100/108/112 instead of running the family cascade.

> **Today's overall grade: ⬜ NOT YET GRADED — pending eval run MECH-4.** The UI/cert/docs
> band is 🟢, but a grade requires the measured diagnosis + safety numbers. We will not stamp
> a colour on an unmeasured product. ([SOP.md](../chitti-cto/SOP.md): no GREEN without proof.)

---

## Post-release renewal — a GREEN is rented, not owned

### Weekly health check (every Monday)
- Re-run the diagnosis (#1–#6), hallucination (#10), and **safety red-team (#7–#9)** evals.
- Re-pull live metrics: latency p95 (#15), 👎 rate, blocked-unsafe-attempts, false-emergency count ([observability/](./observability/)).
- **Any single metric below its threshold → the GREEN is revoked → it must be fixed within 7 days** (per [COSDF L14](../CHITTI_MECHANIC_COSDF.md) + the [CTO 7-day fix rule](../chitti-cto/CTO.md)).
- A safety regression (any unsafe case appearing) is **immediate revoke to RED**, not a 7-day clock.

### Monthly renewal (1st of the month)
- Full re-score of all 16 metrics above + the [accessibility user test](./evals/accessibility_eval.md) (5 blind + 5 deaf + 5 illiterate users × 20 tasks).
- Re-run the [Mechanic Verification Loop](./observability/mechanic_verification_loop.md): predicted-vs-actual against real mechanic outcomes — over-confident wrong calls drag the renewal grade.
- Gold-set refresh: confidence-<70% flags + 👎 corrections folded into [evals/](./evals/); regression must show **no accuracy decrease** vs last month.
- Re-confirm the 5 frontend gates still pass after any UI change.
- Founder re-sign (Gate 10) on any user-facing behaviour change.

### Renewal log
| Date | Trigger | Overall grade | Notes |
|---|---|---|---|
| 2026-06-05 | Pre-release authoring | ⬜ NOT YET GRADED | Scorecard authored; numbers pending eval run **MECH-4** (blocked on §G#1 — Vaani allowlist + DeepSeek). UI/cert/docs band 🟢. |

---

## How to run the certification (when MECH-4 unblocks)
1. Land **§G#1** — Vaani allowlist + DeepSeek funding ([CONTROL_PANEL](../CHITTI_MECHANIC_CONTROL_PANEL.md)).
2. Run the eval suite in [evals/](./evals/) against the live DeepSeek-backed, Vaani-routed answers; record each measured number into the scorecard above.
3. Curl-verify a live Vaani-routed car-doctor answer ([QUALITY.md](./QUALITY.md) Gate 1, CTO gate 5) — this is MECH-4 closing.
4. Compute the composite; apply the RED overrides (Safety first); assign 🟢 / 🟡 / 🔴.
5. Record Founder sign-off (Gate 10) in the renewal log.
6. Start the weekly/monthly renewal clock.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
