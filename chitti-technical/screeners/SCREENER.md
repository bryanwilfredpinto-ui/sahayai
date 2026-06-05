🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# SCREENER — full-NSE filtering (F8)

Find stocks across the **entire NSE universe** that match indicator + market-cap +
sector conditions, ranked, each row tappable into a full Scanner run.

## Stock universe — by market-cap tier (Sire's 2026-06-06 definition)

| Tier | Market cap (₹) | Notes |
|---|---|---|
| **Nifty 50** | index constituents | the benchmark large-caps |
| **Large Cap** | **above ₹1,00,000 crore** | |
| **Mid Cap** | **₹50,000 – ₹1,00,000 crore** | |
| **Small Cap** | **₹5,000 – ₹50,000 crore** | |
| **Micro Cap** | **below ₹5,000 crore** | thin liquidity warnings apply |

> **Add ALL stocks.** The screener covers every listed NSE equity, bucketed into
> the tiers above. Market-cap data sourced from **screener.in**
> ([SAHAYAI_MASTER.md §2](../../SAHAYAI_MASTER.md) data-source lock; Yahoo blocked).
> Existing universe seed: [`chitti-shares/backend/config/nifty_universe.json`](../../chitti-shares/backend/config/nifty_universe.json)
> + `services/stock_universe.py` / `universes.py` — extended to the full list.

## Filters

| Filter | Values |
|---|---|
| **Market Cap** | Nifty50 / Large / Mid / Small / Micro (multi-select) |
| **Sector** | NSE sector list (multi-select) |
| **RSI** | oversold (<30) / overbought (>70) / custom range |
| **MACD** | bullish cross / bearish cross / above-zero / below-zero |
| **Supertrend** | BUY / SELL |
| **Roshan** ⭐ | BUY / SELL / WAIT ([../indicators/ROSHAN.md](../indicators/ROSHAN.md)) |
| **Breakout** | Donchian / 52-week high / range breakout |
| **Volume Spike** | volume > N× average |
| *(extensible)* | any catalogue indicator can become a filter |

## Presets (one tap)

- **Oversold large-caps** — Large Cap + RSI<30
- **Roshan buy + volume** — Roshan BUY + Volume Spike
- **Fresh breakouts** — Breakout + Supertrend BUY + above-average volume
- **Momentum mid-caps** — Mid Cap + MACD bullish cross + ADX>25

## Behaviour

- **Manual "Run screen"** button — **no auto-refresh** (Sire's 2026-06-06 rule).
  Results carry the "data as of" stamp.
- Results are **ranked** by confluence strength on the screener's reference
  timeframe (Daily by default), each row showing the tier, the matched filters,
  and a one-line plain-language reason.
- **Tap a row → full Scanner** (F1) with the multi-timeframe analysis.

## Failure / honesty

- **Zero matches** → "No stock matches all filters today" + the nearest-miss
  relaxation suggestion ("relax RSI to <35 → 7 matches"). Never an empty silent screen.
- **Micro-cap liquidity** → rows carry a ⚠️ thin-liquidity label; signals on
  illiquid names down-weight confidence.
- Market-cap tier is recomputed from the latest screener.in pull; a stale tier is
  stamped, never shown as live.

## Accessibility

- Filters are labelled toggles (word + icon), usable by tap only (mute) and
  readable by screen reader (blind).
- Result **count and top matches are spoken**; each row narratable.
- Renders fully in the selected language; indicator names stay English per
  [CTO.md §6](../../chitti-cto/CTO.md).

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
