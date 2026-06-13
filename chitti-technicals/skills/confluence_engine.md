🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# Confluence Engine — multi-timeframe verdict (higher TF governs)

> The brain of the verdict. **In the engine today** (`confluence`, `scan`, `LADDERS`, `tfVerdict`, `trendOf`). Cross-links: [risk_engine.md](risk_engine.md) · [roshan.md](roshan.md) · [../ARCHITECTURE.md](../ARCHITECTURE.md).

---

## The core rule — the higher timeframe governs the trigger

You do not trade a 1-hour signal against a falling weekly chart. The engine encodes this in `LADDERS` — each trade style names its **direction** timeframe(s) and its **trigger** timeframe, plus a reward-to-risk floor:

```
LADDERS = {
  longterm:   { dir: ['monthly','weekly'], trigger: 'daily', rr: 3   },
  positional: { dir: ['weekly'],           trigger: 'daily', rr: 3   },
  swing:      { dir: ['daily'],            trigger: '4h',    rr: 2   },
  intraday:   { dir: ['4h'],               trigger: '1h',    rr: 1.5 }
}
```

`tradeType ∈ longterm / positional / swing / intraday` (passed to `scan(candlesByTf, {tradeType})`) picks the ladder.

## How it decides (real — `confluence(candlesByTf, tradeType)`)

1. **Per-TF read** — `tfVerdict(candles)` runs `trendOf()` (EMA20/50/200 + ADX gate) and a ±1 vote across the 39-indicator `indicatorSet()`, returning `{ trend, verdict, lean }` for each timeframe.
2. **Direction side** — the higher (direction) timeframes must **all agree** (`up`/`down`); any disagreement → `mixed` → **HOLD** ("wait for alignment").
3. **Trigger confirms** — only if the trigger TF's verdict matches the higher-TF direction is a BUY/SELL allowed; otherwise **HOLD**.
4. **Confidence + score** — from average higher-TF trend strength × trigger lean → `LOW / MEDIUM / HIGH` and a 0–1 `confluence_score`.
5. **Contributing / contradicting** — every trigger indicator is bucketed as agreeing or disagreeing with the verdict (the Danelfin "tap-to-explain" data).

`scan()` then calls [risk_engine.md](risk_engine.md): **no clean stop / RR below the ladder floor → the verdict is downgraded to HOLD** (`risk_downgraded: true`). The Roshan read is attached as `result.roshan`.

## The 5-state verdict surface (the [STEAL] bundle)

The raw engine verdict is `BUY / SELL / HOLD`; the page presents the industry-standard **5-state band** (TradingView gauge math) plus three trust-builders:

| Surface | Source | Rendering |
|---|---|---|
| **5-state gauge** | confluence verdict + score | Strong Buy ▲▲ · Buy ▲ · Neutral ■ · Sell ▼ · Strong Sell ▼▼ |
| **Vote tally** | `contributing` vs `contradicting` counts | "11 say Buy, 2 say Sell" (Investing.com steal — trust > a needle) |
| **MMI mood dial** | average trend strength + lean | a fear↔greed "where are we?" dial (Tickertape steal) |
| **Confluence score** | `confluence_score` 0–1 | "how many timeframes agree" |
| **Honesty rail** | always | "most short-term traders lose — SEBI" on every verdict |

## Accessibility mapping (Art. 2 — never colour-only)

| Channel | Rendering |
|---|---|
| 🔊 Voice | one-sentence verdict + the *why* ("weekly is up, the 4-hour confirms") + the rail |
| 🔡 Text | verdict word + vote tally + score + confidence band |
| 🔺 Icon+shape | the ▲▲/▲/■/▼/▼▼ grammar — shape carries the state, gauge needle reinforces |
| 🤟 ISL/visual | gauge with a labelled needle position (word, not colour zone) + concept panel |
| 👁️ Blind | the gauge sonified as a single pitch (low=sell, high=buy); the tally and score spoken; "show data as table" lists every contributing/contradicting indicator |

## Honesty rail

Confluence raises the odds; it never removes risk. A HOLD is a valid, frequent, *correct* answer — Chitti is rewarded for saying "wait," not for manufacturing a trade. *NOT SEBI REGISTERED — analysis, not advice.*

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
