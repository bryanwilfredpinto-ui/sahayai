🎖️ **World Class Chitti Stock AI — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

# Chitti Stock AI — Skills (repo: `chitti-shares`)

> Bharat-themed agentic technical + fundamental analysis for Indian equities (NSE / BSE) with plain-English *Story Mode* and **Roshan Indicator** (Sire's proprietary composite). Sticky `NOT SEBI REGISTERED` bar on every page. Angel One / Zerodha-class skeleton, retail-investor UX.

---

## The 4 Users I Serve

| User | How Shares serves them |
|------|-------------------------|
| 👁️ Blind | Roshan composite + indicator read aloud; Story Mode narrates explanation |
| 🦻 Deaf | Full text + ISL panel + chart described in symbols |
| 🤫 Mute | Tap-led indicator filter, watchlist, scan |
| 📖 Illiterate | Story Mode in own language; Roshan symbol-based directional pill |

---

## Features

| # | Feature | Status | Tested By | Date |
|---|---------|--------|-----------|------|
| 1 | 43 technical indicators (RSI · MACD · Bollinger · etc.) | ✅ | CTO | 2026-05-15 |
| 2 | Roshan composite multi-timeframe signal | ✅ | CTO | 2026-05-15 |
| 3 | Story Mode — plain-English narrative of indicators | ✅ | CTO | 2026-05-15 |
| 4 | Buffett / Munger / Graham / Kedia / RKD lens (Fundamentals) | ✅ | CTO | 2026-05-15 |
| 5 | 25+ filters on Nifty 500 (Fundamentals scanner) | ✅ | CTO | 2026-05-15 |
| 6 | Watchlist | ✅ | CTO | 2026-05-15 |
| 7 | Sticky `NOT SEBI REGISTERED` bar + full legal modal | ✅ | CTO | 2026-05-15 |
| 8 | Agentic `chat_with_tools` rail-gated | ✅ | CTO | 2026-05-15 |
| 9 | Rails on first user message, every tool turn writes audit row | ✅ | CTO | 2026-05-15 |
| 10 | Final reply goes through Compliance INJECT | ✅ | CTO | 2026-05-15 |
| 11 | FastAPI quality stack — `app.state.chitti_obs` + `app.state.chitti_hooks` | ✅ | CTO | 2026-05-15 |
| 12 | Per-request audit row in `_chitti_timing_mw` (Starlette middleware) | ✅ | CTO | 2026-05-15 |
| 13 | Per-response widget — 🔊 / 🤖 / 👍 / 👎 / ✏️🎙️ | ✅ | CTO | 2026-05-27 |
| 14 | Golden Rule confirm gate on every side-effecting action | ✅ | CTO | 2026-05-23 |
| 15 | NSE / BSE candles refreshed at market-session close (15:30 IST) | ✅ | CTO | 2026-05-15 |
| 16 | screener.in fundamentals refreshed quarterly | ✅ | CTO | 2026-05-15 |
| 17 | Angel prices feed | ✅ | CTO | 2026-05-15 |
| 18 | Yahoo BLOCKED from Railway (local-dev fallback only) | ✅ | CTO | 2026-05-15 |
| 19 | DeepSeek → Claude → Gemini Layer-5 fallback chain | ⬜ | — | — |
| 20 | Roshan composite directional accuracy dashboard | ⬜ | — | — |
| 21 | Chitti Stock AI hero card (Vaani-style Roshan call on Calls tab) | ✅ | CTO | 2026-05-29 |
| 22 | Indicator-name + ticker English protection in translation runtime (RSI / MACD / EMA / Bollinger / Roshan / RELIANCE → stay English in Telugu/Bengali/Hindi UI) | ✅ | CTO | 2026-05-29 |
| 23 | Calls / Story Mode explanation translates to user's language (26 langs) | ✅ | CTO | 2026-05-29 |
| 24 | 9-Layer Agentic Stack (Agent · README · SKILLS · SOP · Quality · Guardrails · Observability · Audit · Swarm) documented in README §9-Layer | ✅ | CTO | 2026-05-29 |
| 25 | Swarm Intelligence — News + Technical + Macro + Risk + Fundamentals sub-agents → weighted Combine verdict | 🟡 | CTO | 2026-05-29 — composer scaffolded, weights tunable in `services/agent_runtime.py::compose_verdict` |

---

## Translation contract (Sire 2026-05-29 — LOCKED)

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

**Enforced by**: `chitti_lang_runtime.js` skip-list (`brands` + `indicators` + ticker regex + BUY/SELL regex) + `translate="no"` attribute on hero card indicator chips.

---

## Indian User Support

- Retail / new investor in Indian equities
- Tier-2/3 first-time portfolio builder
- User who wants conviction without paying a research subscription
- Family member helping a senior parse a stock recommendation

## Language Support

English + 9 Indian languages — Story Mode honours user's chosen language end-to-end.

## Mandatory 5-element widget on every response box

🔊 Speaker · 🤖 Chitti icon · 👍👎 Thumbs · ✏️🎙️ Pencil+Mic · 🌐 Language selector — verified live on `chitti_complete_technical.html` + `chitti_fundamentals.html` per [CERT_LOG.md](../CERT_LOG.md).

## Commando Standard

- Sticky `NOT SEBI REGISTERED` bar + full legal modal — NEVER demoted to footer
- NEVER brokers trades
- NEVER holds positions
- NEVER generates buy/sell orders
- NEVER gives registered investment advice
- Roshan composite is directional signal, NOT recommendation
- Yahoo data feed BLOCKED from Railway — local-dev only
- screener.in (fundamentals) + Angel (prices) are sole production data feeds

---

> **World Class Chitti Stock AI — Commando Discipline. Zero Excuses.**
