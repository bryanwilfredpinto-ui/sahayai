🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# EVAL — Risk accuracy

**Target: ≥ 90%** of emitted BUY/SELL signals have a **structurally valid risk
block**. This is graded higher than directional accuracy because a wrong direction
costs one trade; a wrong stop costs the account (Founder Rule #2).

## What is scored (per signal)
1. **Stop on the correct side** of entry (below for BUY, above for SELL). — pass/fail
2. **Stop anchored** to ATR / structure / % band, not a guessed number. — pass/fail
3. **RR clears the trade-type floor** (intraday 1:1.5 · swing 1:2 · positional/long 1:3). — pass/fail
4. **Targets at real structure levels** (no invented round numbers). — pass/fail
5. **Position size** keeps rupee risk within the stated budget. — pass/fail
6. **Invalidation present** — one checkable sentence. — pass/fail

A signal passes only if **all six** pass. A directional signal that fails any check
should never have shipped — that is a guardrail breach, not just an eval miss.

## Method
- Static analysis of every logged signal's risk block (deterministic — no LLM, no
  market replay needed). Runs every release + continuously on live signals.

## Failure handling
- Any failing directional signal is a **block-worthy defect** — the
  [Risk Agent](../swarm/risk-agent.md)/[Trust Agent](../swarm/trust-agent.md) should
  have downgraded it to HOLD. A failure here means the gate leaked → fix the gate.

## Honesty
- Number reported in [RESULTS.md](RESULTS.md) only after the harness runs on real signals.

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
