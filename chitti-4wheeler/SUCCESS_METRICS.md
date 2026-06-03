🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SUCCESS_METRICS — Chitti Car Doctor

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

## How metrics are computed

All counters are anonymised, on-device-first. Aggregates follow the
[Camera Intelligence](../SAHAYAI_MASTER.md) + [Swarm](../SAHAYAI_MASTER.md)
ownership contract: user-token stripped, GPS rounded to pincode, `"Chitti forget"`
tombstones every row. Photos, audio and OBD2 streams never leave the device — only
text descriptions and the anonymised outcome are aggregated.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
