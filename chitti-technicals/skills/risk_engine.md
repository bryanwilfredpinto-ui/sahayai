🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# Risk Engine — NO stop → NO signal (the commando rule)

> The article that makes us a guardian, not a croupier. **In the engine today** (`riskBlock`). Enforces CONSTITUTION Art. 5 (stop mandatory) + Art. 3 (paper only). Cross-links: [confluence_engine.md](confluence_engine.md) · [bollinger.md](bollinger.md) · [../PRD.md](../PRD.md).

---

## The law

**No BUY/SELL read is ever presented without a calculated stop. No clean stop → no signal.** The risk number is shown **before** the reward number. This is not a setting — it is wired into `scan()`: if `riskBlock()` returns invalid, the verdict is **downgraded to HOLD** with the reason spoken.

## How the engine computes it (real — `riskBlock(candles, side, rrFloor, riskBudget)`)

```
price   = last close
atr     = ATR(14)            // volatility unit (falls back to 1% of price if unavailable)
swingLow/High = min low / max high over the last 20 bars   // structure

BUY:  stopStruct = min(swingLow, price − atr)
      stopAtr    = price − 1.5×atr
      stop       = min(stopStruct, stopAtr)        // the safer (lower) stop
SELL: mirror of the above (stop above price)

targets T1/T2/T3 at  rr = { floor, floor+1.5, floor+3 }  × risk-unit
qty        = floor(riskBudget / risk-unit)          // position sizing
risk %     = (risk-unit / price) × 100
```

**Validity gates (any failure → `valid:false` → `scan()` HOLDs):**
- `no_clean_stop` — the computed stop is on the wrong side of price (no structure to lean on).
- `rr_below_floor` — first target's reward-to-risk is below the ladder's `rr` floor (2 swing, 3 positional/longterm, 1.5 intraday). *"reward does not justify the risk — skip this trade."*

On success `scan()` attaches `entry { ideal, aggressive, conservative, zone }`, `stop { price, pct, atr, structure, recommended:'structure' }`, `targets[]`, `position_size { qty, rupee_risk }`, and `invalidation` ("wrong if price closes below ₹X").

## Risk-first presentation order

Chitti **always speaks the stop first**: *"If you were to take this, your stop is ₹X — that risks ₹Y. Only then: the first target is ₹Z."* Reward is never dangled before risk.

## Paper only (Art. 3)

The position size is for a **paper journal**, never a live order. Logging a paper trade is a side-effect → gates through `chittiConfirmAndDo()` (speaks "Log this as a paper trade?", waits for explicit *haan*, never defaults to yes).

## Accessibility mapping (Art. 2)

| Channel | Rendering |
|---|---|
| 🔊 Voice | "Stop ₹X, risk ₹Y. First target ₹Z. You decide the size that fits your risk." |
| 🔡 Text | a risk-first card: `STOP ₹X (−n%) → entry ₹E → T1 ₹Z (1:rr)` |
| 🔺 Icon+shape | 🛡️ stop · 🎯 target — icons paired with the numbers, never colour-coded bars alone |
| 🤟 ISL/visual | concept panel "the price where you admit you were wrong"; stop line drawn distinctly (bold dashed) |
| 👁️ Blind | stop announced first via `aria-live`; "show data as table" lists stop, entry, all targets, qty, rupee-risk |

## Honesty rail

A stop limits the loss; it does not guarantee one will be filled at that price (gaps happen). The whole engine refuses to manufacture a trade where the math doesn't justify the risk — *waiting is a valid decision.* *NOT SEBI REGISTERED — analysis, not advice. Most short-term traders lose money (SEBI).*

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
