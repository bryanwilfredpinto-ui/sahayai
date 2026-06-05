🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# OBSERVABILITY — Logs & failure modes

## What every signal logs (for the accuracy eval + audit)
```
signal_id · timestamp · instrument · trade_type · verdict · confidence ·
confluence_score · per-timeframe sub-verdicts · contributing/contradicting ·
entry · stop · targets+RR · position_size · invalidation · data_as_of ·
explain_source (deepseek|template) · request_id · user_lang
```
PII-stripped before any cross-user aggregate ([../portfolio/PORTFOLIO.md](../portfolio/PORTFOLIO.md)
ownership contract). Joinable to the Turso audit log via `request_id`.

## Failure modes → behaviour (honest surfaces, never silent)
| Failure | Surface |
|---|---|
| Data feed down / refresh failed | "Data as of <old> — refresh failed; signal withheld." Never a stale verdict shown as fresh. |
| Too few candles for a timeframe | "Not enough history to judge the <TF> for this stock." |
| Indicator NaN / warmup | indicator **abstains**; logged as `abstain`, never `0`. |
| Timeframes disagree | HOLD + the disagreement logged + explained. |
| No clean stop | HOLD + "no clean stop" + logged as Risk-block. |
| DeepSeek Explain down/slow | `explain_source = template`; deterministic explanation; logged. |
| Trust Agent block | logged with `blocked_reason`; user sees honest no-trade. |
| Micro-cap illiquidity | confidence down-weighted; ⚠️ liquidity flag logged. |

## Audit trail
- Every scan writes a `quality_audit` row (latency, request_id, verdict).
- Every Explain call goes through `wrap_llm` (rails + compliance), inheriting the
  shared substrate ([QUALITY_STATUS.md §2](../../QUALITY_STATUS.md)).
- "Chitti forget" tombstones the user's rows (counts stay honest).

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
