🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SUCCESS_METRICS — Chitti Car Doctor

Canonical framework: [../CHITTI_MECHANIC_COSDF.md](../CHITTI_MECHANIC_COSDF.md)
**LEVEL 3 — SUCCESS METRICS**. This file is the Car-Doctor instance of that level.
The COSDF L3 target tables (business / AI-accuracy / accessibility / safety) are
near the end of this file, **clearly marked TARGETS** — unmeasured until the eval
harness runs (Sire-gated **MECH-4**). The Tier-1 / Tier-2 tables below are *how* the
Car Doctor measures against that ambition.

The North Star is chosen to be **un-gameable by engagement**. We do not measure
time-in-app, sessions, or bookings generated; those reward funnels and addiction,
not the owner's outcome (Founder Rule).

## North Star

> **Rupees the owner kept — money saved versus the service-centre quote, per
> active owner per month.**

Every time Chitti catches an overcharge (the ₹35 000 AC compressor that should be
₹18-24k, often a ₹2 000 gas top-up), enables a safe DIY fix, or prevents a
breakdown, the owner keeps money. That is the product working. It cannot be
inflated by ads, parts sales, or service bookings — Chitti earns nothing on any of
those. Because car bills are 5-20× a bike's, every catch is worth more here.

## Tier-1 metrics (Sire tracks)

| Metric | Target | Why | Proven by |
|---|---|---|---|
| **Diagnostic accuracy** | **≥ 90%** | Top predicted fault matches the real fix | [evals/diagnostic_accuracy.md](evals/diagnostic_accuracy.md) |
| **Safety accuracy** | **= 100%** (critical-safety errors **= 0**) | A wrong "drive it" can kill a family | [evals/safety_eval.md](evals/safety_eval.md) |
| **Hallucination risk** | **< 1%** | No invented faults, no false certainty | [evals/hallucination_eval.md](evals/hallucination_eval.md) |
| **Repair-cost accuracy** | **≥ 85%** | Fair-band must straddle the real fair price (car ₹ ranges) | [evals/cost_accuracy.md](evals/cost_accuracy.md) |
| **Unsafe-DIY recommendations** | **= 0** (hard) | Never DIY a brake/fuel/airbag/HV-EV job | [evals/diy_safety_eval.md](evals/diy_safety_eval.md) |
| **Per-response 👍 rate** | **≥ 80%** | Owner felt helped | feedback-widget per box |

## Tier-2 metrics (supporting telemetry)

| Metric | Target | How measured |
|---|---|---|
| **Scam-quote catch rate** | ≥ 90% of quotes ≥ 1.5× fair band flagged High | Scam Shield verdict vs seeded quote set ([evals/scam_shield_eval.md](evals/scam_shield_eval.md)) |
| **₹ saved vs service centre** (the North Star, per-event) | tracked, growing | (quote − DIY/fair cost) logged per diagnosis |
| **Mechanic-verification confirmation rate** | ≥ 90% | Predicted fault vs *what the service centre actually fixed* — owner confirms post-repair ([evals/mechanic_loop.md](evals/mechanic_loop.md)) |
| **Can-I-drive correctness** | 100% on the unsafe class | Safety-Agent verdict vs labelled scenarios |
| **Dashboard-light read accuracy** | ≥ 92% | Dashboard Doctor vs labelled warning-light image set |
| **DTC P-code decode accuracy** | ≥ 95% | OBD2 decode vs standard SAE J2012 generic-code reference |
| **Sound-diagnosis top-3 hit rate** | ≥ 80% | Sound Doctor candidate list vs labelled audio library |
| **EV SoH / range-estimate honesty** | 100% labelled "estimate" | every EV range answer carries the estimate footer |
| **Median response time** | < 3 s | Observability metrics |
| **Mobile pass @375px** | 100% | CTO visual cert |
| **ISL panel present on every response** | 100% | substrate gate |

## Counter-metrics (we want these LOW)

| Counter-metric | Ceiling |
|---|---|
| Service-centre routings when a safe DIY/no-action answer existed | → 0 |
| Over-diagnoses caught by the Trust Agent that reached the owner anyway | → 0 |
| Critical-safety errors (told to drive an unsafe car) | **0** (hard) |
| Auto-dials to 100 / 108 / 112 | **0** (hard — family cascade only) |
| HV-EV / airbag / brake jobs ever coached as DIY | **0** (hard) |
| False-certainty statements ("this IS the problem") | 0 |
| Sessions ending in 👎 with no recovery turn | < 5% |

## Leading indicators of trust

- **% of diagnoses where the owner chose DIY/no-action over the service centre** —
  rises as trust builds. For cars, a single avoided upsell can be ₹30 000+.
- **% of quotes checked through Scam Shield** — owners bringing Chitti to the
  service centre is the moat working; the highest-value signal for cars.
- **Used Vehicle Inspector runs before purchase** — buyers trusting Chitti over
  the seller's "all-OK" word, in India's giant used-car market.
- **Vehicle Health Passport adoption** — owners building a lifelong record (and
  using it at resale) is the deepest trust signal.

## How the mechanic-verification loop closes

This is the metric no competitor has: after a Professional-Required diagnosis, the
owner tells Chitti *what the service centre actually fixed*. That confirmation
(predicted vs real) feeds:

1. **Diagnostic accuracy** (Tier-1) — ground truth, not self-reported confidence.
2. **Swarm learning** ([§2f](../SAHAYAI_MASTER.md)) — confirmed patterns (≥ 100
   confirmations, HIGH-risk human review) push to [skills/](skills/).
3. **Cost accuracy** — the real bill refines the fair-price band by city.

## COSDF LEVEL-3 metric tables (TARGETS — unmeasured)

These four tables are the canonical COSDF **LEVEL 3 — SUCCESS METRICS**
([../CHITTI_MECHANIC_COSDF.md](../CHITTI_MECHANIC_COSDF.md)), adapted to the Car
Doctor. They sit **above** the Tier-1/Tier-2 tables — those define *how* we measure
on this product; these define the *ambition we are measured against*.

> **EVERY NUMBER BELOW IS A TARGET, NOT AN ACHIEVED RESULT.** Nothing here is
> measured until the **eval harness runs the live-LLM pass** — Sire-gated
> **MECH-4** ([../CHITTI_MECHANIC_CONTROL_PANEL.md](../CHITTI_MECHANIC_CONTROL_PANEL.md)).
> Per [../SAHAYAI_MASTER.md §2](../SAHAYAI_MASTER.md) and COSDF §3 (honest-stubs),
> we never print an unmeasured metric as achieved. The "Measured" column stays
> `— (pending MECH-4)` until the gold-set run lands. DAU/scale numbers are Y1
> ambitions for the **whole Mechanic line** (2w + 4w), not a measured Car-Doctor figure.

### L3.1 — Business (TARGETS)

| Metric | Target | Measured | Notes |
|---|---|---|---|
| Daily active users (Mechanic line, Y1) | 1M+ | — (pending MECH-4) | Line-level ambition; Vaani-routed, not a Car-Doctor-only count |
| D30 retention | > 40% | — (pending MECH-4) | Per-persona retention tracked at [OBSERVABILITY](../CHITTI_MECHANIC_COSDF.md) |
| Diagnoses / day (line) | 500K+ | — (pending MECH-4) | Aggregate across 2w + 4w |
| DIY-success rate | > 70% | — (pending MECH-4) | Safe DIY fixes completed without escalation |
| Mechanic-escalation rate | < 30% | — (pending MECH-4) | Counter-metric; lower is better |
| **₹ saved vs service centre** (North Star) | tracked, growing | — (pending MECH-4) | The un-gameable North Star; per-event log |

### L3.2 — AI accuracy (TARGETS)

| Metric | Target | Measured | Proven by |
|---|---|---|---|
| Engine diagnosis | > 90% | — (pending MECH-4) | [evals/diagnostic_accuracy.md](evals/diagnostic_accuracy.md) |
| Electrical diagnosis | > 85% | — (pending MECH-4) | [evals/diagnostic_accuracy.md](evals/diagnostic_accuracy.md) |
| **Brakes diagnosis** | **> 95%** | — (pending MECH-4) | safety-critical; [evals/safety_eval.md](evals/safety_eval.md) |
| Sound recognition (top-3 hit) | > 85% | — (pending MECH-4) | Sound Doctor vs labelled car-audio library |
| Dashboard warning-light ID | 100% (DB-backed) | — (pending MECH-4) | deterministic light DB, not a guess |
| DTC P-code decode | > 95% | — (pending MECH-4) | vs SAE J2012 generic-code reference |
| Cost estimation | ± 10% | — (pending MECH-4) | car ₹ ranges; [evals/cost_accuracy.md](evals/cost_accuracy.md) |
| Hallucination rate | < 1% | — (pending MECH-4) | [evals/hallucination_eval.md](evals/hallucination_eval.md) |

### L3.3 — Accessibility (TARGETS)

| Metric | Target | Measured | Notes |
|---|---|---|---|
| Blind-user task success | > 99% | — (pending MECH-4) | P5 Anand flow, no visual dependency |
| Deaf-user task success | > 99% | — (pending MECH-4) | P6 Imran flow, no audio-only step |
| Illiterate-user task success | > 99% | — (pending MECH-4) | P8 Bhola flow, no reading dependency |
| Voice-command success | > 95% | — (pending MECH-4) | Vaani is the sole user surface |
| Offline core flow | 100% | — (pending MECH-4) | P11 Devendra field scenario; offline-cached SOPs |
| Languages live (primary) | 9 (en,hi,ta,te,bn,mr,gu,kn,ml) | **LIVE** | substrate; wider COSDF list = roadmap |
| Voice substrate (Voice Factory) | 26 voices | **LIVE** | voice-out coverage; not a per-string UI claim |

### L3.4 — Safety (CRITICAL — TARGETS, hard zeros)

| Metric | Target | Measured | Notes |
|---|---|---|---|
| Unsafe-recommendation rate | **0%** (hard) | — (pending MECH-4) | Safety-Agent veto; [evals/diy_safety_eval.md](evals/diy_safety_eval.md) |
| Missed safety-warning rate | **0%** (hard) | — (pending MECH-4) | e.g. metal-on-metal brake → STOP DRIVING |
| Can-I-drive correctness (unsafe class) | 100% | — (pending MECH-4) | wrong "drive it" can kill a family |
| Emergency-response success | 100% | — (pending MECH-4) | family cascade only; **never** 100/108/112 |
| HV-EV / airbag / brake jobs coached as DIY | **0** (hard) | — (pending MECH-4) | hard refusal, code-level |

These map onto the existing Tier-1 hard gates above (Safety accuracy = 100%,
Unsafe-DIY = 0, Auto-dials = 0). The L3 tables are the COSDF-canonical phrasing;
the Tier-1/Tier-2 tables are how the Car Doctor operationalises them.

## How metrics are computed

All counters are anonymised, on-device-first. Aggregates follow the
[Camera Intelligence](../SAHAYAI_MASTER.md) + [Swarm](../SAHAYAI_MASTER.md)
ownership contract: user-token stripped, GPS rounded to pincode, `"Chitti forget"`
tombstones every row. Photos, audio and OBD2 streams never leave the device — only
text descriptions and the anonymised outcome are aggregated.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
