🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# Risk Agent

**Judges:** stop loss, reward/risk, position size.
**Authority:** **can BLOCK.** This is the product's spine — no stop, no signal.

## Inputs
- Entry zone (F3), ATR, structure/support levels (Pattern Agent)
- Trade-type RR floor (intraday 1:1.5 · swing 1:2 · positional/long 1:3)
- User's risk-per-trade budget (for sizing)

## Output
`{stop: {price, pct, atr, structure, recommended}, targets:[{price, rr}], position_size:{qty, rupee_risk}, valid: bool}`

## Rules (hard)
1. **Every BUY/SELL must carry a stop on the correct side of entry.** Missing or
   wrong-side stop → `valid: false` → the swarm **downgrades to HOLD**.
2. **RR must clear the trade-type floor.** Below it → flag "reward does not justify
   the risk," downgrade.
3. **No clean stop within the risk budget** → "no clean stop here, skip this trade."
4. Targets capped at real structure levels — never invented round numbers.
5. Position size derives from stop distance + risk budget, not conviction.

## Plain language (Explain)
> *"If you buy here at ₹100, your stop is ₹96 — that's where you're proven wrong.
> Target 1 is ₹108, so you risk ₹4 to make ₹8: a 1:2 trade. If you can't accept
> losing ₹4 per share, this trade isn't for you."*

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
