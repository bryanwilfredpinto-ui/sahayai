🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# SUCCESS_METRICS — Chitti Technical

The single number Sire tracks, plus the supporting telemetry. Everything below is
honest: a metric is only reported once it is **measured** against the eval
harness ([evals/](evals/)) — never claimed from architecture.

## North-star metric

> **Directional signal accuracy** — of the BUY/SELL signals Chitti emits with
> confidence ≥ MEDIUM, what fraction were correct over the signal's stated
> timeframe (entry-to-target vs entry-to-stop)?
>
> **Target: ≥ 70%.** Below this is a defect, not a feature gap.

A signal is "correct" if, before the stop loss was hit, price reached at least
**Target 1**. Measured per trade-type (long-term / positional / swing / intraday)
because a 70% intraday hit-rate and a 70% positional hit-rate are different beasts.

## Supporting metrics

| # | Metric | Target | Why it matters |
|---|---|---|---|
| 1 | **Risk accuracy** — % of signals whose stop loss + RR were structurally valid (SL on the correct side, RR ≥ trade-type floor) | **≥ 90%** | A wrong direction costs one trade; a wrong stop costs the account. |
| 2 | **Explainability** — % of responses that carry a plain-language *why* + invalidation | **= 100%** | Founder Rule #3. A bare verdict is a defect. |
| 3 | **Hallucination rate** — % of responses citing an indicator value / level not in the data | **< 1%** | Trust collapses the first time a number is invented. |
| 4 | **Accessibility pass** — 4-user contract checks per page | **= 100%** | The platform floor. |
| 5 | **Per-response 👍 rate** | **≥ 70%** | The crowd's verdict on whether the explanation landed. |
| 6 | **Time-to-signal** | **< 2 s** per scan | Beginner + 2G patience budget. |
| 7 | **Confidence calibration** — when Chitti says "HIGH confidence," is the realised hit-rate actually higher than MEDIUM? | monotonic | A confidence band that does not predict accuracy is noise. |
| 8 | **Stop-loss adherence telemetry** — of users who set a trade from a signal, how many recorded an exit at/near the stated stop vs blew past it | rising | Measures whether the risk discipline actually transfers to behaviour. |

## Outcome metrics (Portfolio Mode, [portfolio/PORTFOLIO.md](portfolio/PORTFOLIO.md))

Tracked **per user, privately, on-device first** — never sold, never leaderboard:

- Win rate · Loss rate
- Average RR realised vs RR promised
- Open trades · Closed trades · PnL (the user's own ledger)
- Confluence score distribution of taken vs skipped trades

## What we deliberately do NOT optimize for

- **Number of signals shown.** More signals is not better; a quiet "no clean
  trade today" is a valid, valuable answer (Founder Rule #2).
- **Engagement / session length.** Trust over excitement (Founder Rule #5).
- **Auto-refresh frequency.** Refresh is manual by design — we optimise for
  *decision quality per refresh*, not refresh count.

## Measurement cadence

| Metric | Cadence |
|---|---|
| Signal + risk accuracy | Rolling, recomputed when each signal's timeframe elapses against actual NSE close |
| Explainability / hallucination | Per eval run (every release) |
| 👍 rate / feedback | Daily 07:00 IST founder report ([observability/](observability/)) |
| Calibration | Weekly |

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
