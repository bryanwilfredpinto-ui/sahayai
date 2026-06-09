🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# Indicator Accuracy Eval — the math must be reproducible, not approximate

> Subordinate to [../EVALS.md](../EVALS.md) and [../CONSTITUTION.md](../CONSTITUTION.md) Articles 6 & 7 ("Deterministic Safety Over LLM" · "Rules Are the Product").
> **Hard target: 100% deterministic.** The engine (`chitti_technical_engine.js`) must reproduce every fixture exactly — no rounding drift, no LLM in the loop.
> **Status: 🔵 PENDING** — to be filled when `node tools/test_technical_engine.mjs` runs (BO6).

---

## What this eval proves

Article 7 says **the rules are the product**. This eval is how we prove the rules are *correct* and *reproducible*. We feed the engine known candle arrays whose indicator values we can verify by hand (or against a reference implementation), and assert the engine returns exactly those values. If a single fixture drifts, BO6 is **not done**.

The LLM is **out of scope here** — DeepSeek only phrases the result downstream (Article 6). This eval touches the deterministic engine only.

## Indicators under test

| Indicator | What we assert | Source of truth |
|---|---|---|
| **RSI(14)** | exact value + band (oversold ≤30 / neutral / overbought ≥70) | Wilder smoothing, hand-verified |
| **Roshan composite** | RSI14 vs SMA20 → band (Strong/Weak/Neutral) | engine's documented rule |
| **MACD(12,26,9)** | line, signal, histogram sign + cross event | standard EMA math |
| **ATR(14)** | exact value (drives the mandatory stop — Article 5) | Wilder true-range |
| **EMA / SMA** | exact value at the close | textbook |
| **Bollinger(20,2)** | upper/mid/lower + %B | mean ± 2σ |
| **Stochastic / Williams %R** | %K/%D / %R + band | textbook |

## Gold cases

Cases live in [datasets/indicator_cases.json](datasets/indicator_cases.json). Each case is a **known candle array → expected indicator output**, including at least:
- a clean uptrend (RSI rising, Roshan = Strong),
- a clean downtrend (RSI falling, Roshan = Weak),
- a flat/choppy series (RSI ≈ 50, Roshan = Neutral),
- an oversold extreme (RSI ≤ 30 earcon trigger — see [accessibility_eval.md](accessibility_eval.md) BO2 earcons),
- an overbought extreme (RSI ≥ 70).

## Method

1. `node tools/test_technical_engine.mjs` loads each case.
2. Runs the candle array through `chitti_technical_engine.js`.
3. Asserts every numeric field equals the fixture (exact match; tolerance documented per-field only where float representation requires it).
4. Asserts the **band/state label** matches (this is what the four-channel verdict renders).
5. Re-runs each case twice → asserts identical output (determinism check).

## Pass criteria (target — not yet measured)

- **100%** of gold cases match exactly.
- Re-run produces byte-identical output (no nondeterminism).
- **0** cases where a band label disagrees with its numeric value.
- ATR is present and non-null on every case (Article 5: no stop → no signal).

## Results

| Metric | Target | Measured | Status |
|---|---|---|---|
| Cases matching exactly | 100% | _to be filled_ | 🔵 PENDING |
| Determinism (re-run identical) | yes | _to be filled_ | 🔵 PENDING |
| Band ↔ value agreement | 100% | _to be filled_ | 🔵 PENDING |
| ATR present every case | 100% | _to be filled_ | 🔵 PENDING |

Run output, date, and commit get pasted into [RESULTS.md](RESULTS.md) when the gate runs. Cross-checks: [confluence_accuracy.md](confluence_accuracy.md) (multi-TF) · [hallucination_eval.md](hallucination_eval.md) (LLM never re-computes these).

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
