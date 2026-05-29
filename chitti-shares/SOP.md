🎖️ **World Class Chitti Technical AI — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

# Chitti Technical AI — Standard Operating Procedure

> *"How Chitti must work."* — 10 steps, every analysis, no shortcuts.

## Objective
Multilingual technical stock-market intelligence + AI coaching. Technical analysis only — no fundamentals, no macro, no auto-trading. Plain-English / user's-language explanations.

## Primary User
Retail / new investor in Indian equities — building first conviction, not a professional trader.

## Success Metric
- Technical accuracy vs raw OHLC (≥ 95% indicator math match)
- Hallucination rate 0%
- Multi-timeframe alignment accuracy (≥ 90% agreement when 3 TFs all signal same direction)
- User satisfaction 👍 / (👍 + 👎) ≥ 85%
- Educational clarity — "Was this clear?" 👍 ≥ 85%

---

## The 10 Steps

### Step 1 — Detect User Language
- Auto-detect from browser locale (`navigator.language`) and user-profile preference
- Adapt UI labels via `chitti_lang.js` baked T-table + `chitti_lang_runtime.js` LLM fallback
- Adapt voice output via Chitti Voice Factory cascade
- Indicator names + stock tickers stay English; verdicts + explanations translate

### Step 2 — Receive Stock Input

Accept any of:
- Stock symbol (text input with autocomplete — Tier 1 prefix `RELI` → `RELIANCE`)
- Timeframe (Monthly / Weekly / Daily / 4 Hour / 1 Hour)
- Chart screenshot upload (vision → DeepSeek vision endpoint → indicator extraction)
- Voice utterance via 🎤 mic ("Chitti, show me Reliance daily")

### Step 3 — Technical Validation

Compute against the verified Angel SmartAPI candles (NOT LLM memory):

- **RSI** (14-period default, configurable)
- **MACD** (12 / 26 / 9)
- **EMA / SMA** (20 / 50 / 200 default)
- **Volume** (relative volume, OBV)
- **Candlestick patterns** (Doji · Hammer · Engulfing · Marubozu · Star · Harami)
- **Trend strength** (ADX + price-action confirmation)
- **Support / Resistance** auto-anchor

All values use `iloc[-2]` (last *closed* candle). Never `iloc[-1]` (in-progress).

### Step 4 — Multi-Timeframe Alignment

Cross-check the same indicator across:
- Monthly trend
- Weekly trend
- Daily trend
- Intraday alignment (4H / 1H)

Decision logic:
- All higher TFs agree → boost confidence by +15%
- Higher TFs conflict (Weekly down, Daily up) → reduce confidence by -20%, flag "MTF conflict" in response
- Counter-trend signal in lower TF → lower confidence further, surface as "counter-trend, higher risk"

### Step 5 — Hallucination Prevention

Before the final response leaves the rail, the Verification Agent (`agent_runtime.py::verify_response`) must:
- Verify every indicator value referenced exists in the OHLC frame
- Cross-check calculations (re-compute RSI from raw closes, compare to stated value)
- Refer to [SKILLS.md](SKILLS.md) — refuse anything not in the capability list
- Refer to [README.md §Constraints](README.md#constraints-non-negotiable) — refuse guaranteed-profit phrasing
- Ensure no fake claims (no fabricated candle patterns, no invented support levels, no imagined news catalysts)

A failed verification returns an honest "I cannot verify that from the data" via the Compliance INJECT path — not a fabricated retry.

### Step 6 — Risk Analysis

Generate:
- **Volatility level** — ATR-derived, mapped to Low / Medium / High
- **Stop-loss zone** — ATR × 1.5 below entry for BUY, above for SHORT
- **Support / Resistance** — nearest levels with distance from current price
- **Drawdown guard** — flag if recent 5-day drawdown > 8% (caution beginner)

### Step 7 — Educational Layer

For every signal, explain in user's language:
- **Why did this signal form?** — link to the specific candles / volume / divergence
- **What does the indicator mean?** — plain language definition
- **Beginner-friendly framing** — analogies, simple comparisons, no jargon-only
- Available via 💡 **Simplify** button (re-renders the explanation at a lower reading level) and 📘 **Learn More** button (opens coaching mode for that specific indicator)

### Step 8 — UI Rendering

Every response card MUST include (no exceptions):

- 🤖 Chitti avatar (identity)
- 🔊 Speaker button (hear response)
- 🎤 Mic feedback button
- ✏️ Pencil feedback button (text)
- 👍 👎 (rating)
- Confidence meter (visual %)
- Risk meter (Low / Med / High pill)
- Language toggle (auto-detected default, manual override)
- 💡 Simplify button
- 📘 Learn More button
- Trend · Risk Level · Confidence % · Indicator Summary · Support / Resistance · Educational Explanation · Risk Disclaimer

Sticky `NOT SEBI REGISTERED` bar at top of page; per-section warning inside every analysis card. Never demoted to footer.

### Step 9 — Feedback Capture

If user:
- 👎 dislikes the answer → prompt for one-tap reason
- ✏️ edits the response → store correction text against `box_id`
- 🎤 voice correction → transcribe + store
- 💡 taps Simplify → log "explanation too complex" signal

Then:
- Store feedback in `shares.feedback` (Turso) with `box_id` + `user_id` + `correction_text`
- Create audit log row in `shares.audit_log`
- Flow into swarm-intelligence pipeline (≥ 100 corroborations → human review → `skills/*.md` update)
- Same-prompt re-ask comparison job validates whether the next response improved

### Step 10 — Audit & Observability

Store every:
- Prompt (hashed)
- Output (full text)
- Errors (stack + request_id)
- Confidence level (stated + Verification-Agent-adjusted)
- User feedback (👍 / 👎 / ✏️ / 🎤)
- Hallucination event (Verification Agent rejection)
- DeepSeek cost per call
- Latency P50 / P95 / P99

Retention: 90 days hot in `shares.audit_log`; 7 years cold in `shares.audit_log_archive`. Access gated to Sire via `ADMIN_MOBILE` env var.

---

## Operating Rules

1. **SEBI disclaimer is sticky.** Top of every page, full modal behind it. NEVER demoted to footer.
2. **Agentic loop is rail-gated.** Rails on first user message → every tool turn writes `record_tool_call(phase="after")` → final assistant reply through `after_model` Compliance INJECT.
3. **No trading actions.** Chitti EXPLAINS; user TRADES via their own broker.
4. **Yahoo is dev-only.** Production data: Angel SmartAPI candles. Yahoo BLOCKED from Railway.
5. **Roshan is directional, not prescriptive.** Composite signal indicates trend; never frame as buy/sell.
6. **Golden Rule on every action.** Watchlist add/remove, scan saves, story-mode subscriptions — all confirm before fire.
7. **Indicator names + tickers stay English.** When a user picks Telugu / Bengali / Tamil, RSI/MACD/EMA/Roshan/RELIANCE remain English; verdict/explanation/UI translates.
8. **Technical only.** Never wander into fundamentals / management lens / macro. That's [Chitti Fundamentals'](https://sahayai.in/chitti_fundamentals.html) job.
9. **Verification Agent rejection = honest refusal.** A response that cannot be verified against OHLC returns "I cannot verify that from the data," never a fabricated retry.
10. **Honest universe counts.** Dropdown labels show actual counts (Nifty50·50 / Largecap·107 / Midcap·110 / Smallcap·113 / Microcap·52), not inflated promises.

## Per-stock Analysis SOP (every Ask-Chitti tap)

1. Resolve symbol via autocomplete (Tier 1 NSE prefix, Tier 2 contains, Tier 3 name match)
2. Resolve timeframe from selector or voice utterance
3. Fetch Angel candles for that symbol + timeframe (200 candles default)
4. Run indicator stack (Step 3)
5. Run MTF alignment (Step 4 — Daily + Weekly + Monthly minimum)
6. Verification Agent re-check (Step 5)
7. Risk Agent stop-loss + target derivation (Step 6)
8. Education layer composition (Step 7)
9. Render response card with full widget panel (Step 8)
10. Wire feedback handlers (Step 9) + write audit row (Step 10)

## Indicator usage (all 43 — technical only)

- **Trend** — EMA 20/50/200, SMA, Supertrend, Ichimoku, SAR, Aroon, ADX, DMI
- **Momentum** — RSI, MACD, Stochastic, StochRSI, Williams %R, MOM, TRIX, ROC, CCI
- **Volatility** — Bollinger Bands, Keltner, Donchian, ATR
- **Volume** — VWAP, VWMA, OBV, MFI
- **Pivot / Fib** — Pivot Points, Fibonacci, Camarilla, Woodie
- **Modern** — TTM Squeeze, Hull MA, Chande Kroll Stop, Heikin-Ashi
- **Multi-TF confluence** — Daily / Weekly / Monthly agreement boost
- **Roshan composite** — Sire's proprietary weighted blend

## Error Handling

- Angel candles unavailable → degrade to last close + honest "intraday unavailable"
- Agentic rail BLOCK → short-circuit with OpenAI-shaped refusal message
- DeepSeek 5xx → fallback canned Story Mode with disclaimer
- Verification Agent rejection → honest "I cannot verify that from the data"
- Voice TTS failure → text-only response with retry prompt

## Escalation to CTO

- Any response shipped without SEBI bar (cert defect)
- Hallucination rate > 0% in weekly judge eval (P0)
- Roshan directional accuracy drops below 55% on judge eval
- Yahoo accidentally re-enabled in production (deploy defect)
- Verification Agent disabled or short-circuited (rail integrity broken)
- Universe dropdown labels diverge from actual counts (return of the lie)

## Stale Data Rule

Angel candles refreshed at market-session close (15:30 IST); intraday refreshed per `chat_with_tools` request. **Yahoo BLOCKED from Railway** — `yahoo_client` is local-dev fallback only.

## Evolution Owner

[chitti-shares/skills/](skills/) + Angel SmartAPI candles. New indicators reviewed by Sire before promotion. Coaching evolution stages (Stage 1 → Stage 2 → Stage 3) follow swarm-intelligence cadence: daily collect · weekly validate · monthly push · quarterly review.

## 9-Layer Architecture
See [`README.md`](README.md) — Agent · README · SKILLS · SOP · Quality Measures · Guardrails · Observability · Audit · Swarm Intelligence.

---

> **World Class Chitti Technical AI — Commando Discipline. Zero Excuses.**
