🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# EVAL — Signal accuracy

**Target: ≥ 70%** directional accuracy on signals emitted at confidence ≥ MEDIUM
(the [SUCCESS_METRICS.md](../SUCCESS_METRICS.md) north star).

## Definition of "correct"
A BUY/SELL is **correct** if, within its stated timeframe, price reaches **Target 1
before the stop loss is hit**. A HOLD is "correct" if no clean trade existed (a
range that stayed a range). Measured **per trade-type** — intraday, swing,
positional, long-term — because their base rates differ.

## Method (honest, forward-tested)
1. Every emitted signal is logged with its full output (entry/stop/target/TF/
   confidence) and a timestamp ([../observability/logs.md](../observability/logs.md)).
2. When the signal's timeframe elapses, the engine replays actual NSE candles and
   scores the outcome (target-first vs stop-first). **No look-ahead** — scoring
   uses only data after the signal time.
3. Accuracy is reported rolling, split by trade-type and confidence band.

## Backtest harness (pre-launch sanity)
- A historical backtest over N years of NSE candles across the cap tiers, running
  the deterministic engine on past data, to sanity-check the engine *before* live
  signals exist. Backtest ≠ live accuracy and is labelled as such (no overfitting
  claims; honest stubs over fake demos).

## Calibration sub-eval
HIGH-confidence signals must out-perform MEDIUM. If they don't, confidence is
miscalibrated → defect ([../guardrails/overconfidence.md](../guardrails/overconfidence.md)).

## Honesty
- **No accuracy number is claimed until this harness has run on real elapsed
  signals.** Until then, status is "not yet measured." See [RESULTS.md](RESULTS.md).

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
