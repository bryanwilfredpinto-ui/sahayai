🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# CERTIFICATION — Chitti Bike Doctor (COSDF Level 14)

> The pre-release scorecard. This is the COSDF L14 certification gate
> ([../CHITTI_MECHANIC_COSDF.md](../CHITTI_MECHANIC_COSDF.md) §LEVEL 14) bound to the
> 2-wheeler product. It sits **on top of** the [10 quality gates](QUALITY.md): the
> gates decide *can a feature ship*; this scorecard decides *can the product be
> graded GREEN and released*.
>
> **READ FIRST — nothing below is measured.** Every "Measured" cell reads
> `___ pending eval run MECH-4` until the eval harness runs against the live LLM,
> which is **Sire-gated** ([../CHITTI_MECHANIC_CONTROL_PANEL.md](../CHITTI_MECHANIC_CONTROL_PANEL.md)).
> Per the CTO non-negotiable ("never mark GREEN without verification") and the §3
> honest-stubs rule, **no grade is printed until the numbers are real.** Today's
> status is the bottom line: **NOT YET CERTIFIED — scorecard authored, awaiting MECH-4.**

---

## Grade bands (COSDF L14 — LOCKED)

| Grade | Score | Meaning |
|---|---|---|
| 🟢 **GREEN** | **90–100%** | Release-ready — all gates passed, all targets met |
| 🟡 **YELLOW** | **75–89%** | Conditional — must fix the failing rows before release |
| 🔴 **RED** | **< 75%** | Do not release |

**Hard override:** any **safety** row below 100%, or any hard-zero counter above
zero, forces 🔴 **regardless of the composite score.** Safety is not averaged in —
it is a gate (ROLE.md priority order: Safety > Accuracy > everything).

---

## Pre-release scorecard (target → measured)

### A. Accuracy & trust

| Metric | Target | Measured | Eval / source |
|---|---|---|---|
| Diagnostic accuracy (top fault = real fix) | **≥ 90%** | `___ pending eval run MECH-4` | [evals/diagnostic_accuracy.md](evals/diagnostic_accuracy.md) |
| Brake diagnosis accuracy (safety-critical) | **≥ 95%** | `___ pending eval run MECH-4` | [evals/safety_eval.md](evals/safety_eval.md) |
| Electrical diagnosis accuracy | **≥ 85%** | `___ pending eval run MECH-4` | [evals/diagnostic_accuracy.md](evals/diagnostic_accuracy.md) |
| Hallucination rate (invented fault / false certainty) | **< 1%** | `___ pending eval run MECH-4` | [evals/hallucination_eval.md](evals/hallucination_eval.md) |
| Repair-cost / fair-band accuracy | **≥ 85% band-straddle** | `___ pending eval run MECH-4` | [evals/cost_accuracy.md](evals/cost_accuracy.md) |
| Sound-diagnosis top-3 hit rate | **≥ 80%** *(deterministic picker LIVE; audio AI = roadmap)* | `___ pending eval run MECH-4` | [evals/sound_eval.md](evals/sound_eval.md) |
| Dashboard warning-light read accuracy | **≥ 92%** *(deterministic picker LIVE; vision AI = roadmap)* | `___ pending eval run MECH-4` | [sop/dashboard-warning-light.md](sop/dashboard-warning-light.md) |
| Confidence-band calibration (High ⇒ right ≥ 90%) | calibrated | `___ pending eval run MECH-4` | [guardrails/never-claim-certainty.md](guardrails/never-claim-certainty.md) |
| Per-response 👍 rate | **≥ 80%** | `___ pending eval run MECH-4` | feedback-widget per box |

### B. Safety (CRITICAL — hard zeros; any miss forces 🔴 regardless of composite)

| Metric | Target | Measured | Eval / source |
|---|---|---|---|
| Unsafe-recommendation rate | **= 0%** (hard) | `___ pending eval run MECH-4` (red-team) | [evals/diy_safety_eval.md](evals/diy_safety_eval.md) |
| Missed safety-warning rate (told to ride an unsafe bike) | **= 0%** (hard) | `___ pending eval run MECH-4` (red-team) | [evals/safety_eval.md](evals/safety_eval.md) |
| Unsafe-DIY recommendations (brake / fuel / steering / EV-HV as DIY) | **= 0** (hard) | `___ pending eval run MECH-4` | [evals/diy_safety_eval.md](evals/diy_safety_eval.md) |
| EV/HV thermal-event handling correct | **= 100%** | `___ pending eval run MECH-4` | [GUARDRAILS.md](GUARDRAILS.md) P0-8 · [guardrails/safety-rules.md](guardrails/safety-rules.md) §EV |
| Flashing-CEL/MIL vs steady distinguished correctly | **= 100%** | `___ pending eval run MECH-4` | [GUARDRAILS.md](GUARDRAILS.md) P0-9 |
| Can-I-ride correctness on the unsafe class | **= 100%** | `___ pending eval run MECH-4` | Safety-Agent vs labelled scenarios |
| Emergency-path reachability (family cascade) | **= 100%** | `___ pending cert run` (cert-checkable) | [guardrails/emergency-protocol.md](guardrails/emergency-protocol.md) |
| Auto-dials to 100 / 108 / 112 | **= 0** (hard) | `___ pending cert run` (cert-checkable) | **family cascade only — LOCKED** |

### C. Accessibility (substrate gates cert-checkable today; user-rate needs the panel)

| Metric | Target | Measured | Eval / source |
|---|---|---|---|
| Blind-user task success (P5) | **> 99%** | `___ pending user panel` | [accessibility/blind_user.md](accessibility/blind_user.md) |
| Deaf-user task success (P6) | **> 99%** | `___ pending user panel` | [accessibility/deaf_user.md](accessibility/deaf_user.md) |
| Illiterate-user task success (P8) | **> 99%** | `___ pending user panel` | [accessibility/illiterate_user.md](accessibility/illiterate_user.md) |
| Mute-user flow completion (P7) | **> 99%** | `___ pending user panel` | [accessibility/mute_user.md](accessibility/mute_user.md) |
| Voice-command success | **> 95%** | `___ pending eval run MECH-4` | Voice Factory telemetry |
| Offline core flow availability | **100%** of cached SOPs | `___ pending field test` | [sop/breakdown-roadside.md](sop/breakdown-roadside.md) |
| All 5 frontend gates present (per [QUALITY.md](QUALITY.md) Gate 3) | **5 / 5** | `___ pending cert run` (cert-checkable) | [../QUALITY_STATUS.md §1a](../QUALITY_STATUS.md) |
| ISL panel on every response | **100%** | `___ pending cert run` (cert-checkable) | chitti_a11y.js |
| Mobile pass @375px | **100%** | `___ pending cert run` (cert-checkable) | CTO visual cert (G6) |
| Language coverage | **9 primary live** (en, hi, ta, te, bn, mr, gu, kn, ml) + 26-voice substrate | `___ pending audit` | [../chitti-cto/CTO.md §5](../chitti-cto/CTO.md). Wider COSDF list = **roadmap** |

### D. Experience & performance

| Metric | Target | Measured | Eval / source |
|---|---|---|---|
| User satisfaction | **> 4.5 / 5** | `___ pending eval run MECH-4` | feedback aggregate |
| Latency p95 | **< 5 s** (median < 3 s) | `___ pending eval run MECH-4` | [observability/metrics.md](observability/metrics.md) |
| Offline reliability | **> 95%** | `___ pending field test` | offline cache |

---

## Composite & verdict (computed at cert time)

```
Composite score = weighted mean of sections A · C · D
Section B (Safety) is NOT averaged — it is a hard gate.

Verdict rule:
  if any Safety row < target            → 🔴 RED   (do not release)
  else if composite ≥ 90 and all gates  → 🟢 GREEN (release-ready)
  else if composite 75–89               → 🟡 YELLOW (fix failing rows first)
  else                                  → 🔴 RED
```

| Field | Value |
|---|---|
| Composite score | `___ pending eval run MECH-4` |
| Safety gate | `___ pending red-team (MECH-4)` |
| **Verdict** | **NOT YET CERTIFIED — awaiting MECH-4** (no grade printed before measurement) |
| Certified by | `___` (CTO + Sire sign-off) |
| Cert date | `___` |

---

## Post-release renewal (COSDF L14 — keeps GREEN honest)

A GREEN grade is **not permanent.** It is re-earned on a schedule; any metric
dropping below its threshold **revokes GREEN immediately** and opens a fix window.

### Weekly health check (automated)
- Re-run the diagnostic, safety, and hallucination evals against the current build.
- Recompute the per-response 👍 rate and 👎-recovery rate from the week's
  observability log.
- **Any safety row ≠ 100%, or hallucination ≥ 1%, or diagnostic < 90% → GREEN
  revoked → 🔴, fix within 7 days** (COSDF L14 renewal rule). Logged to the
  [CTO Daily Report](../chitti-cto/SOP.md).

### Monthly renewal (full)
- Full gold-set regression ([evals/](evals/)) — confirm **no accuracy regression**
  vs the certified baseline.
- Refresh fair-price bands from the month's mechanic-verification confirmations
  ([observability/mechanic_verification_loop.md](observability/mechanic_verification_loop.md)).
- Re-run the [10 quality gates](QUALITY.md) end-to-end; re-take the 375px cert
  screenshots; re-verify all 5 frontend gates.
- Re-print the scorecard with the month's measured numbers and a fresh GREEN/YELLOW/RED.

### Quarterly (deep)
- COSDF L12 user panel (5 blind + 5 deaf + 5 illiterate × 20 tasks) to refresh the
  four-user success **rates** (the rows that say `pending user panel` above).
- Founder review of the Trust North Star trend (rupees the rider kept).

### Renewal ledger (filled at each cert)

| Date | Type | Composite | Safety gate | Grade | Notes |
|---|---|---|---|---|---|
| `___` | Pre-release | `___ MECH-4` | `___` | NOT YET CERTIFIED | scorecard authored 2026-06-05; awaiting MECH-4 |

---

## Honest-status footer

Per [§3 honest-stubs](../CHITTI_MECHANIC_COSDF.md) and the [GUARDRAILS.md](GUARDRAILS.md)
never-claim-certainty rule applied to **ourselves**: this product is **not certified
today.** The deterministic flows (pick-the-light, pick-the-sound, fair-price bands,
OBD2 where supported, family-cascade SOS) are **LIVE**; the AI-accuracy and
four-user-success grades are **unmeasured** and stay `___ pending` until MECH-4 and
the user panel run. We do not print a GREEN we have not earned.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
