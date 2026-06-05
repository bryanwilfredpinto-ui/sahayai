🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# Confluence Agent

**Judges:** everything together.
**Authority:** the **synthesizer** — produces the BUY / SELL / HOLD verdict and the
confidence band from all other agents' votes.

## Inputs
- Trend, Momentum, Volume, Pattern, Roshan votes — per timeframe in the ladder
- The Risk Agent's validity flag

## Output
`{verdict: BUY|SELL|HOLD, confidence: LOW|MEDIUM|HIGH, score: 0..1, contributing:[...], contradicting:[...]}`

## Weighting model
- **Higher-timeframe agreement weighs heaviest** (Founder Rule #4). The direction
  timeframe gates the side; the trigger timeframe only fires.
- Each agent's vote carries a weight; abstaining indicators/agents do not vote.
- **Disagreement caps confidence** and, past a threshold, forces HOLD.

## Decision table
| Direction TF | Trigger TF | Result |
|---|---|---|
| up | up | **BUY** (confidence by confirmations) |
| down | down | **SELL** |
| up | down (or vice-versa) | **HOLD** — "wait for alignment" |
| sideways | any | **HOLD** — "no clean trend" |
| any | any, but Risk invalid | **HOLD** — "no clean stop" |

## Honest-uncertainty rule
Never average conflicting agents into a "weak BUY." Conflict → **HOLD** with the
conflict named. The confluence score and its components are **always shown**.

## Plain language (Explain)
> *"Four signals say buy, one says wait. The weekly trend and the daily trigger
> agree, volume confirms — medium confidence buy. Here's exactly what would change
> my mind."*

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
