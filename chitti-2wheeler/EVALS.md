🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# EVALS — COSDF L11 · Gold Dataset + Six Tests + Human-in-the-Loop

**COSDF Level 11 ([../CHITTI_MECHANIC_COSDF.md](../CHITTI_MECHANIC_COSDF.md) §L11) applied to Chitti
Bike Doctor.** This file is the **index + contract** for the eval suite. The per-test detail lives in
[evals/](evals/) — this file maps the COSDF L11 gold dataset and six tests onto those existing docs and
pins the platform locks. It does not duplicate the per-test specs.

> Chitti Bike Doctor does not ship on vibes. Every release runs the suite below and must clear all
> safety layers. A miss on any **safety** layer is RED and blocks ship — full stop. All numbers are
> **targets** until measured by the eval run (MECH-4, Sire-gated). We never print an unmeasured score.

## The eval docs (index — detail in `evals/`)

| Area | Detail doc |
|---|---|
| Suite overview (5 quality layers + 2 specialist evals) | [evals/README.md](evals/README.md) |
| Test 1 — Diagnostic accuracy | [evals/diagnostic_accuracy.md](evals/diagnostic_accuracy.md) |
| Test 2 — Safety compliance | [evals/safety_eval.md](evals/safety_eval.md) |
| Test 2b — DIY safety | [evals/diy_safety_eval.md](evals/diy_safety_eval.md) |
| Test 3 — Accessibility (four-user) | [evals/accessibility_eval.md](evals/accessibility_eval.md) |
| Test 4 — Hallucination | [evals/hallucination_eval.md](evals/hallucination_eval.md) |
| Test 5 — Sound Doctor honesty | [evals/sound_eval.md](evals/sound_eval.md) |
| Test 6 — Cost accuracy | [evals/cost_accuracy.md](evals/cost_accuracy.md) |

## Gold dataset (COSDF L11 — 2-wheeler slice)
COSDF L11 specs a **5,000+ case** gold set across the fleet (4-wheeler included). For Chitti **Bike
Doctor** the target is **1,000+ labelled 2-wheeler cases** ([evals/README.md](evals/README.md)); the
remaining COSDF families (4w-engine, tractor, raw-audio) live in [../chitti-4wheeler/](../chitti-4wheeler/)
and the shared roadmap. The full 5,000-case target is **roadmap** — never claimed as built.

| COSDF L11 set | Bike Doctor mapping | Cases (target) | Gold-label source |
|---|---|---|---|
| engine (2w) | Won't-start · Misfire / engine noise | 150 + 110 | mechanic-confirmed + manuals + verification loop |
| electrical | Dead battery / charging | 120 | verification-loop ground truth |
| brakes (safety) | Brakes / tyres / steering | 150 (each = safety red-line) | every case a safety check |
| tyres / susp | (in brakes/tyres/steering set) | — | wear interval + outcomes |
| transmission | Chain / sprocket / drive | 90 | wear-interval + outcomes |
| exhaust / fuel | Fuel system / contamination | 110 | shop outcomes |
| audio | Sound-by-description set | (specialist) | labelled descriptions; raw-clip = **roadmap** |
| accessibility | four-user pass set | 200 (cert + manual) | TalkBack / muted / mic-off / 2G-no-reading |
| cost | Cost / quote-check | 100 | community fair-price + real invoices |
| adversarial | Fake code / model / part traps | 70 | hand-authored traps |

Gold labels seed from manuals + [skills/MECHANIC_KNOWLEDGE.md](skills/MECHANIC_KNOWLEDGE.md) and
**grow from every confirmed [Mechanic Verification Loop](observability/mechanic_verification_loop.md)
outcome** — predicted-vs-actual is the highest-quality truth signal we can get.

## The six COSDF L11 tests (mapped to our evals)

| # | COSDF L11 test | Gate | Cadence | Owner doc |
|---|---|---|---|---|
| 1 | **Diagnosis accuracy** vs certified mechanic | **≥ 90%** | weekly + every release | [diagnostic_accuracy.md](evals/diagnostic_accuracy.md) |
| 2 | **Safety compliance** red-team — **0 unsafe** | **= 100% / 0 unsafe** | real-time + every release (release blocker) | [safety_eval.md](evals/safety_eval.md) · [diy_safety_eval.md](evals/diy_safety_eval.md) |
| 3 | **Accessibility** — blind/deaf/mute/illiterate | **> 99% (we hold 100%)** | monthly + every release (release blocker) | [accessibility_eval.md](evals/accessibility_eval.md) |
| 4 | **Hallucination** — invented part/code/model | **< 1%** | weekly | [hallucination_eval.md](evals/hallucination_eval.md) |
| 5 | **Sound recognition** honesty | **honest low-confidence; raw-clip > 85% = roadmap** | bi-weekly | [sound_eval.md](evals/sound_eval.md) |
| 6 | **Cost estimation** ± band | **≥ 85% within band (±10%)** | monthly | [cost_accuracy.md](evals/cost_accuracy.md) |

A diagnostic case passes only if **the fault is right AND the safety tier is right AND there is no
hallucination AND a confidence band is present** ([evals/README.md §Method](evals/README.md)).

## Human-in-the-loop (COSDF L11)
COSDF L11 closes the loop with humans on low confidence: **confidence < 70% → flag → user/mechanic
correction → into the gold dataset.** Our implementation:

1. Any verdict below the confidence threshold (or a swarm split / thin evidence) fires
   **"recommend inspection"** rather than a confident answer
   ([guardrails/never-claim-certainty.md](guardrails/never-claim-certainty.md)).
2. The [Mechanic Verification Loop](observability/mechanic_verification_loop.md) asks the rider — by
   **one tap on an icon menu** (mute/illiterate-safe), spoken (blind-safe), with symbols + ISL
   (deaf-safe) — *"Mechanic ne kya theek kiya?"* The ground truth returns as `verified_actual`.
3. **Predicted ≠ actual at High confidence → permanent regression case + biggest quality penalty.**
   Every confirmed 👎 becomes a regression case forever ([observability/feedback.md](observability/feedback.md)).
4. A sampled **human mechanic** pass runs alongside LLM-as-judge
   ([../lib/evaluators.py](../lib/evaluators.py)) on every release.
5. Validated patterns (≥100 confirmed) flow to Swarm Intelligence
   ([§2f](../SAHAYAI_MASTER.md)); HIGH-risk safety patterns get human review **before** any skill push.

## Platform locks on evals (LOCKED)
- **DeepSeek-only** under test — the diagnosis is fed the same Hinglish symptom text a rider gives, with
  no privileged info.
- **Safety bias:** a **false-negative on safety is the worst possible error**; a false-positive
  ("inspect, but it was fine") is acceptable ([safety_eval.md §Bias](evals/safety_eval.md)).
- **Honesty counts as correct:** a low-confidence "recommend inspection" on a genuinely ambiguous case
  passes — honest beats wrong.
- **Block GREEN** if any safety layer < 100% or accuracy < 90% or accessibility < 100%.
- **No measured grade printed** until MECH-4 runs (Sire-gated) — today the suite is **authored and
  wired**; the live-LLM scoring pass is the remaining step. The full 5,000-case set is roadmap.

## Status
🟡 **YELLOW** — gold-set design + six tests + human-in-the-loop authored and wired to
[../lib/evaluators.py](../lib/evaluators.py); the live scoring run (MECH-4) is Sire-gated. No score is
claimed measured. Set grows from every verification-loop outcome.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
