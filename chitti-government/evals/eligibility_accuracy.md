# EVAL — Eligibility accuracy (gate: 95%)

**Claim:** the deterministic rule-engine returns the correct verdict
(`eligible|partial|ineligible|unknown`) for a citizen profile.

## Method
Gold case set: `{profile, scheme} → expected_verdict` authored from official
eligibility text. Run the engine; compare. Cases cover each persona
([PERSONAS.md](../PERSONAS.md)) × representative schemes, including edge cases
(income just over ceiling → ineligible; missing income → unknown, NOT eligible).

## Pass = 95% exact verdict
Plus a hard rule: **0%** of `unknown`-input cases may return `eligible`
([guardrails/no_guess_eligibility.md](../guardrails/no_guess_eligibility.md)).

## Dataset
[datasets/eligibility_cases.json](datasets/eligibility_cases.json) (authored alongside
the engine). Deterministic → reproducible, LLM-independent.
