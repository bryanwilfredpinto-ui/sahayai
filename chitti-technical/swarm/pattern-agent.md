🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# Pattern Agent

**Judges:** chart patterns and market structure.
**Authority:** contributes structure-based evidence and the levels the risk
engine needs.

## Inputs
- Swing highs/lows, breaks of structure, ranges vs trends
- Classic patterns (breakout/breakdown, double top/bottom, flag, triangle,
  consolidation) — detected conservatively
- Support/resistance, pivots, Donchian/52-week extremes

## Output
`{structure: trending|ranging|breakout|breakdown, key_levels: [...], pattern: name|none}`

## Rules
- Patterns are reported with a confidence; a low-confidence pattern is **not**
  asserted as fact (hallucination guardrail).
- The key levels feed the Entry (F3), Stop (F4 structure stop) and Target (F5,
  capped at real levels) engines — **targets are never invented round numbers.**
- Structure decides whether a trade is even appropriate (no clean structure → HOLD).

## Plain language (Explain)
> *"Price is consolidating just under resistance at ₹X. A daily close above ₹X is
> a breakout; until then this is a range, not a trade."*

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
