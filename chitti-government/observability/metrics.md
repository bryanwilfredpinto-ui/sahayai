# OBSERVABILITY — Metrics

Tracked per [SUCCESS_METRICS.md](../SUCCESS_METRICS.md). Backend audit via
`lib/observability.py` (`x-chitti-response-time-ms` header + per-request `quality_audit`
row); frontend per-response 👍/👎 via `feedback-widget.js` → Founder dashboard.

## Release-gate metrics
| Metric | Bar |
|---|---|
| Scheme accuracy | 99% |
| Eligibility accuracy | 95% |
| Document detection | 95% |
| Fraud detection | 95% |
| Accessibility coverage | 100% |
| Hallucination | < 1% |
| Privacy compliance | 100% |
| Per-response 👍 | > 90% |

## Operational telemetry (CEOS §13)
- failed applications · missing documents (top gaps) · broken official links
- citizen satisfaction · scheme usage (most searched/claimed) · fraud reports
- language distribution (26 langs) · per-disability-profile task completion
- p50/p95 latency · DeepSeek availability (deterministic-fallback rate)

## Honest reporting
Numbers are reported only after the harness runs. LLM-phrasing metrics gated on
DeepSeek funding + Vaani relevance-rail are marked `AUTOMATION-LIMITED`, never faked.
