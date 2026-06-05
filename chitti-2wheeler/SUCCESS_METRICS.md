🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SUCCESS_METRICS — Chitti Bike Doctor

> Imports the canonical COSDF Level 3 success metrics
> ([../CHITTI_MECHANIC_COSDF.md](../CHITTI_MECHANIC_COSDF.md) §LEVEL 3) and binds
> them to this product. See the [COSDF L3 metric tables](#cosdf-level-3-metric-tables--bike-doctor-targets)
> below for the business / AI-accuracy / accessibility / safety breakdown — all
> **TARGETS**, unmeasured until the eval harness runs (Sire-gated MECH-4).

The North Star is chosen to be **un-gameable by engagement**. We do not measure
time-in-app, sessions, or bookings generated; those reward funnels and addiction,
not the rider's outcome (Founder Rule).

## North Star

> **Rupees the rider kept — money saved versus the workshop quote, per active
> rider per month.**

Every time Chitti catches an overcharge, enables a safe DIY fix, or prevents a
breakdown, the rider keeps money. That is the product working. It cannot be
inflated by ads, parts sales, or service bookings — Chitti earns nothing on any
of those.

## Tier-1 metrics (Sire tracks)

| Metric | Target | Why | Proven by |
|---|---|---|---|
| **Diagnostic accuracy** | **≥ 90%** | Top predicted fault matches the real fix | [evals/diagnostic_accuracy.md](evals/diagnostic_accuracy.md) |
| **Safety accuracy** | **= 100%** (critical-safety errors **= 0**) | A wrong "drive it" can kill | [evals/safety_eval.md](evals/safety_eval.md) |
| **Hallucination risk** | **< 1%** | No invented faults, no false certainty | [evals/hallucination_eval.md](evals/hallucination_eval.md) |
| **Repair-cost accuracy** | **≥ 85%** | Fair-band must straddle the real fair price | [evals/cost_accuracy.md](evals/cost_accuracy.md) |
| **Unsafe-DIY recommendations** | **= 0** (hard) | Never DIY a brake/fuel/steering job | [evals/diy_safety_eval.md](evals/diy_safety_eval.md) |
| **Per-response 👍 rate** | **≥ 80%** | Rider felt helped | feedback-widget per box |

## Tier-2 metrics (supporting telemetry)

| Metric | Target | How measured |
|---|---|---|
| **Scam-quote catch rate** | ≥ 90% of quotes ≥ 1.5× fair band flagged High | Scam Shield verdict vs seeded quote set ([evals/scam_shield_eval.md](evals/scam_shield_eval.md)) |
| **₹ saved vs workshop** (the North Star, per-event) | tracked, growing | (workshop quote − DIY/fair cost) logged per diagnosis |
| **Mechanic-verification confirmation rate** | ≥ 90% | Predicted fault vs *what the mechanic actually fixed* — rider confirms post-repair ([evals/mechanic_loop.md](evals/mechanic_loop.md)) |
| **Can-I-drive correctness** | 100% on the unsafe class | Safety-Agent verdict vs labelled scenarios |
| **Dashboard-light read accuracy** | ≥ 92% | Dashboard Doctor vs labelled warning-light image set |
| **Sound-diagnosis top-3 hit rate** | ≥ 80% | Sound Doctor candidate list vs labelled audio library |
| **Median response time** | < 3 s | Observability metrics |
| **Mobile pass @375px** | 100% | CTO visual cert |
| **ISL panel present on every response** | 100% | substrate gate |

## Counter-metrics (we want these LOW)

| Counter-metric | Ceiling |
|---|---|
| Workshop routings when a safe DIY/no-action answer existed | → 0 |
| Over-diagnoses caught by the Trust Agent that reached the rider anyway | → 0 |
| Critical-safety errors (told to ride an unsafe bike) | **0** (hard) |
| Auto-dials to 100 / 108 / 112 | **0** (hard — family cascade only) |
| False-certainty statements ("this IS the problem") | 0 |
| Sessions ending in 👎 with no recovery turn | < 5% |

## Leading indicators of trust

- **% of diagnoses where the rider chose DIY/no-action over the workshop** — rises
  as trust builds.
- **% of quotes checked through Scam Shield** — riders bringing Chitti to the
  workshop is the moat working.
- **Repeat use before a breakdown** (preventive reminders acted on) vs after — we
  want preventive to dominate over time.
- **Vehicle Health Passport adoption** — riders building a lifelong record is the
  deepest trust signal.

## COSDF Level 3 metric tables — Bike Doctor TARGETS

These four tables import the canonical COSDF L3 success metrics
([../CHITTI_MECHANIC_COSDF.md](../CHITTI_MECHANIC_COSDF.md) §LEVEL 3) and bind
them to **this product**. They sit **on top of** the North Star and Tier-1/2
tables above — they do not replace them; the Tier-1 rows here are the same
metrics, restated in the canonical COSDF grouping so the two documents can be
diffed line-for-line.

> **READ THIS FIRST — every number below is a TARGET, not a measurement.**
> Nothing in these tables has been measured. The figures are unblocked only when
> the **eval harness runs against the live LLM** — gated on **MECH-4** in
> [CHITTI_MECHANIC_CONTROL_PANEL.md](../CHITTI_MECHANIC_CONTROL_PANEL.md), which
> is **Sire-gated** (requires Sire to fund/enable the DeepSeek run). Until then
> the "Measured" column reads `— (pending MECH-4)` and **no GREEN grade may be
> printed** (COSDF L14 certification rule · CTO non-negotiable #2 "never mark
> GREEN without verification"). Printing any of these as achieved is a §3
> honest-stubs violation.

### L3.1 — Business (TARGETS)

| Metric | Target | Measured | Eval / source |
|---|---|---|---|
| Diagnoses served / day | growing (COSDF 500K/day is the fleet-wide ambition, not a 2-wheeler claim) | — (pending MECH-4) | Observability counter ([observability/metrics.md](observability/metrics.md)) |
| DIY-success rate (safe fix completed at home) | **≥ 70%** | — (pending MECH-4) | DIY follow-up confirm ([sop/diy-repair-coach.md](sop/diy-repair-coach.md)) |
| Mechanic-escalation rate | **< 30%** | — (pending MECH-4) | Counter-metric (workshop routings) |
| D30 retention by persona | **> 40%** | — (pending MECH-4) | Observability retention-by-persona |
| **₹ saved vs workshop / active rider / month** (North Star) | tracked, growing | — (pending MECH-4) | (workshop quote − DIY/fair cost) per diagnosis |

*DAU 1M / Y1 is the COSDF fleet ambition across 2W+4W+tractor; the Bike Doctor
does not claim it as a measured 2-wheeler number.*

### L3.2 — AI accuracy (TARGETS)

| Metric | Target | Measured | Eval / source |
|---|---|---|---|
| Diagnostic accuracy (top fault = real fix) | **≥ 90%** | — (pending MECH-4) | [evals/diagnostic_accuracy.md](evals/diagnostic_accuracy.md) |
| Brake diagnosis accuracy (safety-critical) | **≥ 95%** | — (pending MECH-4) | [evals/safety_eval.md](evals/safety_eval.md) |
| Electrical diagnosis accuracy | **≥ 85%** | — (pending MECH-4) | [evals/diagnostic_accuracy.md](evals/diagnostic_accuracy.md) |
| Sound-diagnosis top-3 hit rate | **≥ 80%** *(deterministic sound-picker LIVE; audio AI auto-detect = roadmap)* | — (pending MECH-4) | [evals/sound_eval.md](evals/sound_eval.md) |
| Dashboard warning-light read accuracy | **≥ 92%** *(deterministic light-picker LIVE; vision auto-detect = roadmap)* | — (pending MECH-4) | [sop/dashboard-warning-light.md](sop/dashboard-warning-light.md) |
| Repair-cost / fair-band accuracy | **±10%** (COSDF) — Bike Doctor commits **≥ 85% band-straddle** | — (pending MECH-4) | [evals/cost_accuracy.md](evals/cost_accuracy.md) |
| Hallucination rate (invented fault / false certainty) | **< 1%** | — (pending MECH-4) | [evals/hallucination_eval.md](evals/hallucination_eval.md) |

### L3.3 — Accessibility (TARGETS)

| Metric | Target | Measured | Eval / source |
|---|---|---|---|
| Blind-user task success (P5, voice-only + haptic) | **> 99%** | — (pending MECH-4 + user panel) | [evals/accessibility_eval.md](evals/accessibility_eval.md) · [accessibility/blind_user.md](accessibility/blind_user.md) |
| Deaf-user task success (P6, visual + ISL) | **> 99%** | — (pending MECH-4 + user panel) | [accessibility/deaf_user.md](accessibility/deaf_user.md) |
| Illiterate-user task success (P8, voice + icons, 2G) | **> 99%** | — (pending MECH-4 + user panel) | [accessibility/illiterate_user.md](accessibility/illiterate_user.md) |
| Mute-user flow completion (P7, tap/photo only) | **> 99%** | — (pending MECH-4 + user panel) | [accessibility/mute_user.md](accessibility/mute_user.md) |
| Voice-command success | **> 95%** | — (pending MECH-4) | Voice Factory telemetry |
| Offline core flow availability | **100%** of cached SOPs | — (pending field test) | [sop/breakdown-roadside.md](sop/breakdown-roadside.md) |
| ISL panel present on every response | **100%** | — (substrate gate, cert-checkable) | CTO frontend gate (chitti_a11y.js) |
| Mobile pass @375px | **100%** | — (cert-checkable) | CTO visual cert |
| Language coverage | **9 primary live** (en, hi, ta, te, bn, mr, gu, kn, ml) + 26-voice substrate | — | [CTO.md §5 No-Hinglish](../chitti-cto/CTO.md). Wider COSDF list (Portuguese, Swahili, Arabic…) = **roadmap**. |

*The four-user success targets require a real disability-user panel (COSDF L12 —
5 blind + 5 deaf + 5 illiterate × 20 tasks). Substrate-presence gates (ISL panel,
375px, every-box widget) are cert-checkable today; user-success rates are not —
they stay `pending` until the panel runs.*

### L3.4 — Safety (CRITICAL — TARGETS, hard zeros)

| Metric | Target | Measured | Eval / source |
|---|---|---|---|
| Unsafe-recommendation rate | **= 0%** (hard) | — (pending MECH-4 red-team) | [evals/diy_safety_eval.md](evals/diy_safety_eval.md) |
| Missed safety-warning rate (told to ride an unsafe bike) | **= 0%** (hard) | — (pending MECH-4 red-team) | [evals/safety_eval.md](evals/safety_eval.md) |
| Unsafe-DIY recommendations (brake/fuel/steering as DIY) | **= 0** (hard) | — (pending MECH-4) | [evals/diy_safety_eval.md](evals/diy_safety_eval.md) |
| Can-I-drive correctness on the unsafe class | **= 100%** | — (pending MECH-4) | Safety-Agent verdict vs labelled scenarios |
| Emergency-path reachability | **= 100%** | — (cert-checkable; family-cascade only) | [sop/breakdown-roadside.md](sop/breakdown-roadside.md) |
| Auto-dials to 100 / 108 / 112 | **= 0** (hard) | — (cert-checkable) | [guardrails/emergency-protocol.md](guardrails/emergency-protocol.md) — **family cascade only, NEVER cops** |

The Safety table is the one COSDF marks **CRITICAL**: a single unsafe
"drive it" can kill. Its zeros are non-negotiable and outrank every business and
accuracy number above (ROLE.md priority order: Safety > Accuracy > everything).

---

## How the mechanic-verification loop closes

This is the metric no competitor has: after a Professional-Required diagnosis, the
rider tells Chitti *what the mechanic actually fixed*. That confirmation
(predicted vs real) feeds:

1. **Diagnostic accuracy** (Tier-1) — ground truth, not self-reported confidence.
2. **Swarm learning** ([§2f](../SAHAYAI_MASTER.md)) — confirmed patterns (≥ 100
   confirmations, HIGH-risk human review) push to [skills/](skills/).
3. **Cost accuracy** — the real bill refines the fair-price band by city.

## How metrics are computed

All counters are anonymised, on-device-first. Aggregates follow the
[Camera Intelligence](../SAHAYAI_MASTER.md) + [Swarm](../SAHAYAI_MASTER.md)
ownership contract: user-token stripped, GPS rounded to pincode, `"Chitti forget"`
tombstones every row. Photos and audio never leave the device — only text
descriptions and the anonymised outcome are aggregated.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
