🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# Volume Agent

**Judges:** is the price move backed by participation?
**Authority:** can veto a "confirmed" label; cannot manufacture a signal.

## Inputs
- Volume vs average (volume spike), OBV, Force Index, Chaikin Money Flow,
  Accumulation/Distribution, VWAP relationship

## Output
`{confirmation: confirmed|unconfirmed|distribution, votes: {...}}`

## Rules
- A breakout **without** volume is **"unconfirmed"** — never "confirmed."
- Rising price + falling OBV / negative CMF → distribution warning, caps confidence.
- Volume can downgrade a setup; it can only *upgrade* an already-valid setup's
  confidence (e.g. breakout + spike → HIGH).

## Plain language (Explain)
> *"Price broke out, but volume is below average — the move is not yet confirmed.
> Better to wait for a volume push than to chase."*

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
