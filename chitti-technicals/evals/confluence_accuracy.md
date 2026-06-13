🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# Confluence Accuracy Eval — does the multi-timeframe verdict match gold?

> Subordinate to [../EVALS.md](../EVALS.md) and [../CONSTITUTION.md](../CONSTITUTION.md) Articles 4, 6, 7.
> **Hard target: 100% deterministic.** The 5-state confluence verdict must be reproducible from the per-timeframe votes — no LLM judgement.
> **Status: 🔵 PENDING** — to be filled when `node tools/test_confluence.mjs` runs (BO6).

---

## What confluence is

A single timeframe lies. The confluence engine (BO6) reads the deterministic signal on **multiple timeframes** (e.g. 15m · 1h · 1D · 1W), casts a **±1 vote per timeframe**, and resolves a **5-state verdict**:

| State | Icon+shape (Article 2, never colour-only) | Meaning |
|---|---|---|
| Strong Buy | ▲▲ | most timeframes agree up |
| Buy | ▲ | net up |
| Neutral | ■ | mixed / no edge |
| Sell | ▼ | net down |
| Strong Sell | ▼▼ | most timeframes agree down |

The **confluence score** (how many timeframes agree) is shown alongside the verdict (Article 4: honest confidence, never a fabricated %). The verdict always carries the **ATR stop** (Article 5) and the **"most short-term traders lose — SEBI" rail** (Article 8).

## What this eval proves

That the verdict is a **pure deterministic function** of the per-timeframe signals — same votes in, same verdict out, every time, no LLM. This is the line between "a guardian's honest read" and "a black-box signal a blind user can't audit."

## Gold cases

Cases live in [datasets/confluence_cases.json](datasets/confluence_cases.json). Each case is **per-timeframe signal set → expected verdict + expected confluence score**, including at least:
- unanimous up → Strong Buy,
- unanimous down → Strong Sell,
- split decision → Neutral,
- 3-up / 1-down → Buy (net),
- 1-up / 3-down → Sell (net).

## Method

1. `node tools/test_confluence.mjs` loads each case.
2. Feeds the per-timeframe signals into the confluence engine.
3. Asserts the **5-state verdict** equals the fixture.
4. Asserts the **confluence score** (agree-count) equals the fixture.
5. Asserts the **icon+shape token** matches (the deaf/colour-blind channel — [accessibility_eval.md](accessibility_eval.md)).
6. Asserts an **ATR stop is attached** on every Buy/Sell verdict (Article 5).
7. Re-runs each case → identical output (determinism).

## Pass criteria (target — not yet measured)

- **100%** of gold cases: verdict + confluence score + icon both correct.
- **0** Buy/Sell verdicts missing an ATR stop.
- Determinism: re-run identical.

## Results

| Metric | Target | Measured | Status |
|---|---|---|---|
| Verdict matches gold | 100% | _to be filled_ | 🔵 PENDING |
| Confluence score matches | 100% | _to be filled_ | 🔵 PENDING |
| Icon+shape token matches | 100% | _to be filled_ | 🔵 PENDING |
| Buy/Sell carries ATR stop | 100% | _to be filled_ | 🔵 PENDING |
| Determinism (re-run identical) | yes | _to be filled_ | 🔵 PENDING |

Output + date + commit go to [RESULTS.md](RESULTS.md) when the gate runs. Cross-checks: [indicator_accuracy.md](indicator_accuracy.md) (feeds this) · [safety_eval.md](safety_eval.md) (stop-loss presence).

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
