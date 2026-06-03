🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# OBSERVABILITY — Metrics

> What we measure — and what we pointedly don't. All metrics anonymised,
> on-device-first, tombstoned on "Chitti forget."

## North Star
- **Rupees saved per rider** — money kept in the rider's pocket through correct
  diagnoses, fair-price checks, and safe DIY (vs being over-charged or sold a fault
  they didn't have).

## Tracked (Tier-1)
| Metric | Target | Source |
|---|---|---|
| Diagnosis accuracy (eval) | ≥ 90% | release eval + verification loop |
| **Safety accuracy** | **100%** | safety eval + verification loop |
| **Critical safety errors** | **0** | safety eval (release blocker) |
| Mechanic-confirmation rate (predicted = actual) | ≥ 85% | [verification loop](mechanic_verification_loop.md) |
| DIY success rate (rider fixed it, didn't make it worse) | ≥ 90% | post-DIY 👍/👎 |
| Cost band hit-rate (real ∈ band) | ≥ 85% | quote-check + invoices |
| Per-response 👍 rate | ≥ 80% | feedback-widget per box |
| ₹ saved / rider (Scam Shield + DIY) | rising | quote-check deltas + DIY savings |
| CO₂ per reply | falling | request carbon accounting |
| Accessibility pass | 100% | cert + eval |
| Median response time | < 3 s | request timing |

## Counter-metrics (kept LOW)
| Counter-metric | Target |
|---|---|
| False-positive (said unsafe, was fine) | low, **but always preferred over a false-negative** |
| **False-negative on safety** (said safe, was dangerous) | **0** — the error we never make |
| Over-diagnosis (expensive fault pushed when cheap one fit) | 0 |
| Mechanic-defamation flags (named-and-accused) | 0 |
| Unsafe-DIY recommendations | 0 |

## Explicitly NOT tracked
Time-in-app, session count, "engagement." A rider who fixes the bike and leaves fast
is a **success**, not a churn event. Their absence is intentional (Founder Rule).

## Trust signals shown on the page ([§6 part 7](../../SAHAYAI_MASTER.md))
Risk badge, CO₂/reply, last audit, "riders helped today" — via the feedback-widget
trust strip. Confidence chip on every diagnosis (`Chitti.a11y.renderConfidence`).

## Plumbing
Rides chitti-vaani-api observability (`wrap_llm` + request timing) → Turso aggregates
via the direct-HTTPS shim. CTO/admin-only quality strips per
[chitti-cto/CTO.md](../../chitti-cto/CTO.md) (hidden from riders).

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
