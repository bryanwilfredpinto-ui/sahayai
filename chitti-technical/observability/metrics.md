🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# OBSERVABILITY — Metrics

What Chitti Technical tracks so its quality is provable, not asserted. Feeds the
founder daily report (07:00 IST) via `lib/observability.py` + `lib/founder_report.py`
([SAHAYAI_MASTER.md §6](../../SAHAYAI_MASTER.md)).

## Signal funnel
| Metric | Meaning |
|---|---|
| **Signals generated** | total scans that produced a directional verdict |
| **Signals accepted** | user logged a trade off the signal (Portfolio Mode) |
| **Signals rejected** | user dismissed / 👎 |
| **HOLD rate** | % of scans that honestly returned no-trade |
| **Blocked-by-Trust rate** | % downgraded by the Trust Agent (no stop / hallucination / guardrail) |

## Outcome (after timeframe elapses)
| Metric | Meaning |
|---|---|
| **Win rate · Loss rate** | target-first vs stop-first |
| **Average RR — promised vs realised** | did trades honour their plan? |
| **Accuracy by trade-type** | intraday / swing / positional / long-term |
| **Confidence calibration** | HIGH should out-perform MEDIUM |
| **Confluence-score distribution** | of taken vs skipped trades |

## Quality / experience
| Metric | Meaning |
|---|---|
| **Per-response 👍 rate** | crowd verdict on the explanation |
| **Time-to-signal (p50/p95)** | target < 2 s |
| **DeepSeek-Explain fallback rate** | how often the templated fallback fired |
| **Hallucination catches** | Trust-gate blocks of invented numbers |
| **Language distribution** | which languages users actually use |

## Performance / cost (honest 2G)
| Metric | Meaning |
|---|---|
| **Refresh count per session** | manual-refresh model — we optimise decisions/refresh |
| **Payload size per scan** | 2G budget |
| **CO₂ per reply** | platform carbon tracker (§6) |

## Rule
Every metric is **measured**, never estimated. Where a metric has no data yet, the
dashboard says "no data yet," never a placeholder number.

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
