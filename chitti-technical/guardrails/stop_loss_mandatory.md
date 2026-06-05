🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# Guardrail — Stop loss is mandatory (No stop → No signal)

## The rule
**Every BUY and SELL signal carries a stop loss on the correct side of entry, with
a stated RR.** A signal without a valid stop is **never shown** — it is downgraded
to HOLD with the reason "no clean stop here, skip this trade."

This is the product's spine and Founder Rule #1 (Risk First) made executable.

## What "valid stop" means
1. **Correct side** — below entry for a BUY, above entry for a SELL.
2. **Anchored** — to ATR, structure/support, or a % band — not a guessed number.
3. **Within budget** — the resulting rupee risk fits the user's risk-per-trade.
4. **Paired with RR** — and that RR clears the trade-type floor
   (intraday ≥ 1:1.5 · swing ≥ 1:2 · positional/long ≥ 1:3).

## Enforcement
- [Risk Agent](../swarm/risk-agent.md) computes the stop; if invalid → `valid:false`.
- [Confluence Agent](../swarm/confluence-agent.md) downgrades an invalid-stop
  BUY/SELL to HOLD.
- [Trust Agent](../swarm/trust-agent.md) blocks any BUY/SELL output missing a stop.
- `assert_stop_present_on_directional_signal()` cert hook — directional verdict
  without a stop field **blocks GREEN**.

## Plain language
> *"There's no clean place to put a stop near here without risking too much. So I
> won't call this a trade — protecting your capital comes first."*

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
