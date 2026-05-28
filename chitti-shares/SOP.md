🎖️ **World Class Chitti Shares — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

# Chitti Shares — Standard Operating Procedure

## Objective
Bharat-themed agentic technical + fundamental analysis for Indian equities (NSE / BSE), with plain-English *Story Mode* and a Roshan composite signal.

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
3. **No trading actions.** Shares EXPLAINS; user TRADES via their own broker.
4. **Yahoo is dev-only.** Production data: screener.in (fundamentals) + Angel (prices). Yahoo BLOCKED from Railway.
5. **Roshan is directional, not prescriptive.** Composite signal indicates trend; never frame as buy/sell.
6. **Golden Rule on every action.** Watchlist add/remove, scan saves, story-mode subscriptions — all confirm before fire.

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

---

> **World Class Chitti Shares — Commando Discipline. Zero Excuses.**
