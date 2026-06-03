🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SUCCESS_METRICS — Chitti Bike Doctor

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
