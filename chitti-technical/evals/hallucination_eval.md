🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# EVAL — Hallucination

**Target: < 1%** of responses contain a number, level, or indicator value that is
**not present in the deterministic engine output.**

## Why this is the most important LLM eval here
The engine is deterministic; the only place a fabricated number can enter is the
**Chitti Explain Agent** (DeepSeek). One invented price in a trade signal destroys
trust permanently. So every explanation is verified against the data.

## Method
1. For each response, extract every numeric claim (prices, %, RR, indicator values).
2. Cross-check each against the engine output for that scan.
3. Any number not traceable to the engine = a hallucination → fail.
4. Also flag: an indicator described as BUY when the engine said SELL/WAIT;
   a timeframe asserted that wasn't computed.

## Enforcement
- This is a **Trust Agent** gate, not just an offline eval — the check runs
  **before** the explanation ships. A hallucinated number → block + regenerate or
  fall back to the deterministic template.
- `assert_no_invented_numbers()` cert hook runs the same check on rendered output.

## Fallback design (prevention, not just detection)
- Chitti Explain receives the numbers and is instructed to *only rephrase*. The
  templated fallback (DeepSeek-down path) is hallucination-proof by construction —
  it interpolates engine values into fixed sentences.

## Honesty
- Reported in [RESULTS.md](RESULTS.md) after the harness runs.

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
