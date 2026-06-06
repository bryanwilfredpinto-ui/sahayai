# GUARDRAIL — Never guess eligibility

**Rule:** When an eligibility input is missing, that rule is `unknown` and the verdict
caps at `partial` / `unknown`. It is **never** silently coerced to `eligible`.

## Behaviour
- Per-rule trace shows `pass ✓ / fail ✗ / unknown ❔` for every criterion.
- A verdict with any `unknown` rule cannot be `eligible` — it is `partial` ("looks
  promising, but Chitti needs your income to be sure") or `unknown`.
- `unknown` routes the citizen to the district office / CSC — a feature, not a failure.

## Why
Guessing produces false hope (citizen travels to office, gets rejected) or false
despair (citizen skips a scheme they qualify for). Honest `unknown` is the
[CONSTITUTION](../CONSTITUTION.md) contract.

## Enforcement
[Eligibility Agent](../swarm/eligibility-agent.md) + [Trust Agent](../swarm/trust-agent.md).
Deterministic engine returns `unknown`; no LLM override permitted.
