🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# GUARDRAIL 2 — Hallucination (the engine is the only source of truth)

> Enforces [CONSTITUTION.md](../CONSTITUTION.md) Art. 4, 6 & 7. In a market app a hallucinated number is not a typo — it is a loss. So the rule is absolute: **the deterministic engine originates every number and every call; DeepSeek only phrases what the engine already decided.**

---

## The rule
`chitti_technical_engine.js` is the **single source of truth** for every number, level, signal, stop, and confidence band. **DeepSeek never originates a value** — not an RSI reading, not a price target, not a "this looks like a head-and-shoulders." If the engine cannot compute it, Chitti says *"I cannot read this from the data, Sire"* — honesty over fabrication. **No accuracy percentage is ever stated that the engine cannot reproduce on demand.**

---

## Forbidden → Allowed

| ❌ Forbidden | ✅ Allowed |
|---|---|
| LLM: "RSI is around 65, looks strong." (no engine value) | Engine: `RSI14 = 58.2` → LLM: "RSI is 58 — leaning up, not yet overbought." |
| "Our AI is 92% accurate" / "95% win rate" (Tickeron / Incite pattern) | "I don't quote an accuracy number I can't reproduce. Here is the confluence: 4 of 6 timeframes agree." |
| LLM invents a support at "₹3,900" not in engine output | "Nearest computed support (S1, daily) is ₹3,915 (Camarilla)." — cites the indicator |
| "The chart shows a clear breakout" (no rule fired) | Engine fired no breakout rule → "No breakout rule triggered. The chart is range-bound right now." |
| Filling a data gap with a plausible-sounding guess | "Angel One returned no candles for this symbol/timeframe. I cannot read this." |

---

## Enforcement
- **LLM is phrasing-only:** the DeepSeek prompt receives the engine's structured verdict object and is instructed to **narrate, not compute**. The prose is regenerated; the numbers are passed through verbatim.
- **Number-provenance check:** every numeric token in the rendered narration must trace back to a field in the engine output (post-filter rejects orphan numbers).
- **Citation requirement:** each claim cites the indicator behind it ([CONSTITUTION.md](../CONSTITUTION.md) Art. 4) — Danelfin's "tap-to-explain" gold standard.
- **Accuracy-% killer:** any string matching a win-rate / accuracy claim is stripped and replaced with the confluence count. The [Honesty agent](../swarm/honesty-agent.md) owns this at the panel.
- **Data-gap honesty:** missing candles → deterministic *"I cannot read this"*; the LLM is never asked to improvise.

---

## Slip-rate target
- **LLM-originated number reaching the user: 0 slips** (provenance check is cert-blocking).
- **Fabricated accuracy % in any output: 0 slips, forever** (rejected Tickeron-80% / Incite-95% anti-pattern).
- **"I cannot read this" correctly fired on data gap: 100%** of gap cases in the eval set.

---

## Cross-links
[GUARDRAILS.md](../GUARDRAILS.md) · [not_financial_advice.md](not_financial_advice.md) · [Honesty agent](../swarm/honesty-agent.md) · [SWARM.md](../SWARM.md)

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
