🎖️ **World Class Chitti Stock AI — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

# Chitti Stock AI — Standard Operating Procedure (repo: `chitti-shares`)

## Objective
Bharat-themed agentic technical + fundamental analysis for Indian equities (NSE / BSE), with plain-English *Story Mode* and **Roshan Indicator** (Sire's proprietary multi-timeframe composite). Angel One / Zerodha-class skeleton with retail-investor UX.

## Primary User
Retail / new investor in Indian equities — building first conviction, not a professional trader.

## Success Metric
(a) Roshan composite directional accuracy (vs. eventual N-day price move) · (b) *Story Mode* comprehension 👍 (user understood the explanation) · (c) judge-eval scores on indicator interpretation.

## Quality Standard
- **Sticky `NOT SEBI REGISTERED` bar + full legal modal on every page** — never demoted to footer
- 43 indicators + multi-timeframe Roshan composite
- Agentic `chat_with_tools` loop now rail-gated (rails on first user message, every tool turn writes audit row, final reply goes through Compliance INJECT)
- Per-response widget on every response box (🔊 / 🤖 / 👍 / 👎 / ✏️🎙️)

## Operating Rules
1. **SEBI disclaimer is sticky.** Top of every page, full modal behind it. NEVER demoted to footer.
2. **Agentic loop is rail-gated.** Rails on first user message → every tool turn writes `record_tool_call(phase="after")` → final assistant reply through `after_model` Compliance INJECT.
3. **No trading actions.** Stock AI EXPLAINS; user TRADES via their own broker.
4. **Yahoo is dev-only.** Production data: screener.in (fundamentals) + Angel (prices). Yahoo BLOCKED from Railway.
5. **Roshan is directional, not prescriptive.** Composite signal indicates trend; never frame as buy/sell.
6. **Golden Rule on every action.** Watchlist add/remove, scan saves, story-mode subscriptions — all confirm before fire.
7. **Indicator names + tickers stay English.** When a user picks Telugu / Bengali / Tamil, RSI/MACD/EMA/Roshan/RELIANCE remain English; verdict/explanation/UI translates. Enforced by `chitti_lang_runtime.js` skip-list.
8. **Roshan hero card on Calls tab.** First card the user sees. One-tap `⚡ Run Roshan` → top BUY/SHORT pick with Entry · SL · Target · Confidence · spoken readout in user's language.

## Scan SOP (every Run Roshan tap)

1. Resolve `universe` + `timeframe` from hero selects.
2. POST to `/api/scan/roshan?call=Positional&universe=…&timeframe=…&force=true&max_stocks=30`.
3. Receive `buys[]` + `shorts[]`; for each, fetch ATR-based trade setup via `_buildTradeSetupFromATR`.
4. Pick top-confidence verdict → render in hero card (ticker English, verdict English, explanation translated).
5. Speaker readout via `speechSynthesis` in `document.documentElement.lang` locale.
6. 👍/👎 widget on hero card → `/api/feedback/collect` with `box_id=roshan-hero`.
7. Append to `shares.audit_log` via `_chitti_timing_mw`.

## Indicator usage (all 43)

Roshan composite combines (weights tuned per timeframe):
- **Trend** — EMA 20/50/200, Supertrend, Ichimoku, SAR, Aroon, ADX, DMI
- **Momentum** — RSI, MACD, Stochastic, StochRSI, Williams %R, MOM, TRIX, ROC, CCI
- **Volatility** — Bollinger Bands, Keltner, Donchian, ATR
- **Volume** — VWAP, VWMA, OBV, MFI
- **Pivot / Fib** — Pivot Points, Fibonacci, Camarilla, Woodie
- **Modern** — TTM Squeeze, Hull MA, Chande Kroll Stop, Heikin-Ashi
- **Multi-TF confluence** — Daily / Weekly / Monthly agreement boost

## Error Handling
- screener.in scrape fails → fall back to last-good DB row + honest "data is N days stale"
- Angel prices unavailable → degrade to last close + honest "intraday unavailable"
- Agentic rail BLOCK → short-circuit with OpenAI-shaped refusal message; `agent_runtime.py` doesn't need a special case
- DeepSeek 5xx → fallback canned Story Mode with disclaimer

## Escalation to CTO
- Any response shipped without SEBI bar (cert defect)
- Roshan directional accuracy drops below 55% on judge eval
- Yahoo accidentally re-enabled in production (deploy defect)
- screener.in scrape sustained failures > 24h
- Agentic tool turn fails to write audit row (rail-gating broken)

## Stale Data Rule
NSE / BSE candles refreshed at market-session close (15:30 IST); intraday refreshed per `chat_with_tools` request. screener.in fundamentals refreshed quarterly per company results filing. **Yahoo BLOCKED from Railway** — `yahoo_client` is local-dev fallback only.

## Evolution Owner
[chitti-shares/skills/](skills/) + screener.in / Angel data feeds. New indicators reviewed by Sire before promotion to composite.

## 9-Layer Architecture
See [`README.md` §9-Layer Architecture](README.md#chitti-stock-ai--9-layer-architecture-sire-2026-05-29) — Agent · README · SKILLS · SOP · Quality Measures · Guardrails · Observability · Audit · Swarm Intelligence.

---

> **World Class Chitti Stock AI — Commando Discipline. Zero Excuses.**
