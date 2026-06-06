# SKILL 2 — Eligibility Calculation

Deterministic rule-engine: evaluate each scheme's criteria (age, gender, income,
state, occupation, category, BPL/SECC, landholding, disability, rural/urban) against
the Citizen Digital Twin → `eligible | partial | ineligible | unknown` + per-rule
trace. Runs offline; DeepSeek only phrases. **Never guesses** — missing input → the
rule is `unknown` and the verdict cannot be `eligible`
([guardrails/no_guess_eligibility.md](../guardrails/no_guess_eligibility.md)). **Never
guarantees approval.** Backed by [Eligibility Agent](../swarm/eligibility-agent.md).
