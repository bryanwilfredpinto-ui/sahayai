🎖️ **World Class Chitti Technical AI — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

# Chitti Technical AI — Skills

> *"What powers Chitti has."* — Primary skills + multi-timeframe + coaching + voice/UI + feedback learning + hallucination prevention + output format.

Sticky `NOT SEBI REGISTERED` bar on every page. Technical-only — no fundamentals, no macro, no auto-trading.

---

## Primary Skills

### Technical Analysis
- RSI interpretation (overbought / oversold zones, divergence)
- MACD analysis (crossover, histogram momentum, zero-line tests)
- EMA / SMA crossover detection (20/50/200 + custom periods)
- Bollinger Band analysis (squeeze, breakout, walk)
- Volume breakout detection (relative volume, OBV, MFI)
- Candlestick pattern recognition (Doji · Hammer · Engulfing · Marubozu · Star · Harami)
- Fibonacci retracement analysis (auto-anchor + key levels)
- Support / Resistance auto-detection
- Trendline drawing

### Multi-Timeframe Analysis

Can analyse: **Monthly · Weekly · Daily · 4 Hour · 1 Hour**.

Can detect:
- Timeframe alignment (all 3 trends agree → boost confidence)
- Conflicting signals (Daily up, Weekly down → lower confidence + flag uncertainty)
- Trend strength (ADX-derived + price-action confirmation)

### Coaching Skills

**Can**:
- Explain indicators in simple English (or the user's language)
- Teach beginners (Duolingo-style micro-lessons via `📘 Learn More`)
- Generate trading lessons (curated drills based on user's Journal mistakes)
- Explain *why* signals formed (link the formation to the underlying price action)

**Cannot** (hard refusal):
- Guarantee profits
- Execute trades automatically
- Provide financial guarantees

### Voice & UI Skills

Supports:
- Multilingual TTS (26 langs via Chitti Voice Factory — Bhashini + community voices)
- Multilingual UI adaptation (auto-detect + manual override; indicator names + tickers stay English)
- Speech feedback capture (🎤 mic → transcribed → stored in `shares.feedback`)
- Conversational coaching (multi-turn `chat_with_tools`, rail-gated)

### Feedback Learning

Can:
- Collect 👍 / 👎 per response box (`box_id` anchored)
- Capture voice feedback (🎤)
- Capture text correction notes (✏️)
- Store correction → audit log → swarm-intelligence pipeline (≥ 100 corroborations → human review → `skills/*.md` update)
- Improve future responses (same-prompt re-ask comparison job validates the lift)

### Hallucination Prevention Rules

**MUST**:
- Refer to [SOP.md](SOP.md) before analysis (10-step procedure)
- Validate indicators from chart data (Angel candles, never LLM memory)
- Mention uncertainty levels (confidence %, MTF conflicts flagged)
- Refuse unsupported claims ("I cannot verify that from the data")

**NEVER**:
- Invent chart patterns
- Fake indicator values
- Give false confidence

Enforced by Verification Agent in `services/agent_runtime.py::verify_response`. A response that names an indicator value / candle / pattern not present in the OHLC frame is rejected before the rail returns it.

### Output Format

Every response card MUST include:

| Field | Description |
|---|---|
| **Trend** | Up / Down / Sideways · per timeframe |
| **Risk Level** | Low / Medium / High (ATR-derived volatility + drawdown guard) |
| **Confidence %** | 0–100, lowered if MTF signals conflict |
| **Indicator Summary** | RSI · MACD · EMA · Vol at a glance (compact chips) |
| **Support / Resistance** | Nearest levels with price + distance |
| **Educational Explanation** | Plain language: why this signal formed, what it means for a beginner |
| **Risk Disclaimer** | `NOT SEBI REGISTERED` per-section bar |

Plus the universal widget panel:
- 🤖 Chitti avatar
- 🔊 Speaker (hear response)
- 🎤 Mic (voice feedback)
- ✏️ Pencil (text feedback)
- 👍 👎 (rating)
- Confidence meter (visual %)
- Risk meter (Low / Med / High pill)
- Language toggle
- 💡 Simplify button (beginner re-explain)
- 📘 Learn More button (open coaching mode for that indicator)

---

## Feature Ledger

| # | Feature | Status | Tested By | Date |
|---|---------|--------|-----------|------|
| 1 | 43 technical indicators (RSI · MACD · Bollinger · ATR · ADX · Stoch · VWAP · OBV · MFI · CCI · ROC · TRIX · Aroon · SAR · Ichimoku · Supertrend · …) | ✅ | CTO | 2026-05-15 |
| 2 | Roshan composite multi-timeframe signal (Sire's proprietary) | ✅ | CTO | 2026-05-15 |
| 3 | Story Mode — plain-English narrative of indicators | ✅ | CTO | 2026-05-15 |
| 4 | Watchlist | ✅ | CTO | 2026-05-15 |
| 5 | Sticky `NOT SEBI REGISTERED` bar + full legal modal | ✅ | CTO | 2026-05-15 |
| 6 | Agentic `chat_with_tools` rail-gated (rails on first user message, every tool turn writes audit row, final reply through Compliance INJECT) | ✅ | CTO | 2026-05-15 |
| 7 | FastAPI quality stack — `app.state.chitti_obs` + `app.state.chitti_hooks` | ✅ | CTO | 2026-05-15 |
| 8 | Per-request audit row in `_chitti_timing_mw` (Starlette middleware) | ✅ | CTO | 2026-05-15 |
| 9 | Per-response widget — 🔊 / 🤖 / 👍 / 👎 / ✏️🎙️ | ✅ | CTO | 2026-05-27 |
| 10 | Golden Rule confirm gate on every side-effecting action | ✅ | CTO | 2026-05-23 |
| 11 | NSE / BSE candles refreshed at market-session close (15:30 IST) | ✅ | CTO | 2026-05-15 |
| 12 | Angel prices feed | ✅ | CTO | 2026-05-15 |
| 13 | Yahoo BLOCKED from Railway (local-dev fallback only) | ✅ | CTO | 2026-05-15 |
| 14 | Indicator-name + ticker English protection in translation runtime | ✅ | CTO | 2026-05-29 |
| 15 | Verdict / explanation translates to user's language (26 langs) | ✅ | CTO | 2026-05-29 |
| 16 | Honest universe counts in dropdown (Nifty50·50 · Largecap·107 · Midcap·110 · Smallcap·113 · Microcap·52 — no lying) | ✅ | CTO | 2026-05-29 |
| 17 | Ask-Chitti per-stock surface (symbol input → AI technical card with all widget elements) | 🟡 | CTO | 2026-05-29 — UI rebuild in flight |
| 18 | Confidence meter + Risk meter visual elements on response card | 🟡 | CTO | 2026-05-29 — design + wire in flight |
| 19 | 💡 Simplify button + 📘 Learn More coaching mode | ⬜ | — | — |
| 20 | Verification Agent — re-check signals from raw OHLC before reply leaves rail | 🟡 | CTO | 2026-05-29 — agent scaffolded in `agent_runtime.py::verify_response` |
| 21 | Multi-timeframe alignment confidence boost / penalty | 🟡 | CTO | 2026-05-29 — logic in `agent_runtime.py::compose_confidence` |
| 22 | DeepSeek → Claude → Gemini Layer-5 fallback chain | ⬜ | — | — |
| 23 | Coaching evolution Stage 2 (learning assistant — adapt to user level) | ⬜ | — | — |
| 24 | Coaching evolution Stage 3 (personalised technical trading coach — Journal-driven drills) | ⬜ | — | — |
| 25 | Hallucination-rate dashboard (% responses with fake indicator values — target 0%) | ⬜ | — | — |
| 26 | Universe expansion to NSE official (Midcap 150 · Smallcap 250 · Microcap 250) | ⬜ | — | tracked in TODO.md |

---

## Translation Contract (Sire 2026-05-29 — LOCKED)

When user picks Telugu / Bengali / Tamil / any of 26 languages:

| Item | Stays English | Translates |
|---|:---:|:---:|
| Indicator names — RSI, MACD, EMA, SMA, Bollinger, Roshan, Supertrend, Ichimoku, ADX, VWAP, ATR, Stochastic, … | ✅ | — |
| Stock tickers — RELIANCE, TCS, INFY, HDFCBANK, … | ✅ | — |
| Brand names — Chitti, Vaani, SEBI, NSE, BSE, NPPA, Angel, Zerodha | ✅ | — |
| BUY / SELL / SHORT / HOLD / LONG / EXIT / SL / TP | ✅ | — |
| Verdict explanation — "Strong upward momentum with RSI above 60 and MACD bullish crossover" | — | ✅ |
| Story Mode narrative | — | ✅ |
| UI labels (Universe, Timeframe, Target, Stop Loss, Confidence, etc.) | — | ✅ |
| Disclaimer text (`Not SEBI Registered`, `Educational tool only`) | — | ✅ |

**Enforced by**: `chitti_lang_runtime.js` skip-list (`brands` + `indicators` + ticker regex + BUY/SELL regex) + `translate="no"` / `data-chitti-no-translate` ancestor honoured by `chitti_lang.js` TreeWalker.

---

## Indian User Support

- Retail / new investor in Indian equities
- Tier-2 / Tier-3 first-time portfolio builder
- Family member helping a senior parse a stock chart
- User who wants conviction + education without paying a research subscription

## Language Support

26 Indian languages with auto-detect (browser locale) + manual dropdown override. Voice IN + Voice OUT across all 26.

## Commando Standard

- Sticky `NOT SEBI REGISTERED` bar + full legal modal — NEVER demoted to footer
- NEVER brokers trades
- NEVER holds positions
- NEVER generates buy / sell orders for the user
- NEVER gives registered investment advice
- Roshan composite is directional signal, NOT recommendation
- Yahoo data feed BLOCKED from Railway — local-dev only
- Angel SmartAPI is the sole production price feed

---

> **World Class Chitti Technical AI — Commando Discipline. Zero Excuses.**
