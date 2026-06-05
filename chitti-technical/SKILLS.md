🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# SKILLS — Chitti Technical

Nine skills. Each is a reasoning capability the engine + swarm exercise, and each
**returns reasoning, not just a verdict** (Founder Rule #3). A skill that outputs
a number without an explanation is a defect.

---

## Skill 1 — Trend Analysis

- **Does:** establish the direction of the controlling (higher) timeframe — up /
  down / sideways — via moving-average structure (EMA stack), higher-highs/
  higher-lows market structure, and Supertrend.
- **Owns:** Founder Rule #4 (higher timeframe first). Sets the *direction* the
  lower-timeframe trigger must agree with.
- **Output:** trend label + strength + which evidence supports it.

## Skill 2 — Momentum Analysis

- **Does:** measure whether the move is strong or tiring.
- **Indicators:** **RSI · MACD · Stochastic · Williams %R** (+ ROC, CCI).
- **Teaches:** oversold ≠ buy, overbought ≠ sell — momentum confirms trend, it
  does not override it.
- **Output:** momentum state + divergence flags + plain-language caution.

## Skill 3 — Volume Analysis

- **Does:** confirm or reject a price move with participation.
- **Indicators:** volume spike vs average, OBV, Force Index, volume-weighted levels (VWAP).
- **Rule:** a breakout without volume is "unconfirmed," never "confirmed."
- **Output:** confirmation strength + warning when price and volume disagree.

## Skill 4 — Market Structure

- **Does:** read the chart's skeleton — swing highs/lows, breaks of structure,
  consolidation vs trend, range vs expansion.
- **Output:** current structure state + where the structure invalidates.

## Skill 5 — Support & Resistance

- **Does:** locate the levels that actually matter — pivots, prior swing levels,
  round numbers, moving-average confluence.
- **Feeds:** the Entry Engine (F3), Stop Engine (F4 support-based stop), Target
  Engine (F5 targets capped at real levels — never invented round numbers).
- **Output:** ranked levels with the reason each matters.

## Skill 6 — Risk Management

- **Does:** the product's spine. For every signal: where is the stop, what is the
  invalidation, what is the RR.
- **Rule:** no stop → no signal ([guardrails/stop_loss_mandatory.md](guardrails/stop_loss_mandatory.md)).
- **Output:** stop (price/%/ATR/structure) + RR per target + the invalidation sentence.

## Skill 7 — Position Sizing

- **Does:** turn risk into quantity — given the user's risk-per-trade budget and
  the stop distance, how many shares keeps the loss within budget.
- **Teaches:** the stop distance, not the conviction, decides the size.
- **Output:** suggested quantity + the rupee risk if stopped out. (Educational;
  the user decides.)

## Skill 8 — Roshan Logic

- **Does:** apply Sire's custom composite indicator ([indicators/ROSHAN.md](indicators/ROSHAN.md)).
- **Role:** a first-class voter in the swarm and a chart overlay; presented in
  plain language like every other signal.

## Skill 9 — Confluence Scoring

- **Does:** combine all of the above into a single weighted score across the
  trade-type timeframe ladder, producing BUY / SELL / HOLD + confidence.
- **Rule:** higher-timeframe agreement is weighted heaviest; contradiction caps
  confidence; the score and its components are always shown.
- **Output:** the verdict + the confluence breakdown (what agreed, what didn't).

---

## How skills compose into a signal

```
Skill 1 Trend ─┐
Skill 2 Momentum ─┤
Skill 3 Volume ─┤        Skill 9
Skill 4 Structure ─┼──▶ Confluence ──▶ BUY/SELL/HOLD + confidence
Skill 5 S/R ─┤        Scoring          │
Skill 8 Roshan ─┘                       ▼
                              Skill 6 Risk + Skill 7 Sizing
                              (entry · stop · target · RR · qty)
```

Skills map 1:1 onto the swarm agents in [swarm/](swarm/) — the skills are the
*capabilities*, the agents are the *voters* that exercise them.

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
