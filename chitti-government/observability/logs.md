# OBSERVABILITY — Logs & failure modes

Every request writes a `quality_audit` row (kind=http/llm/judge) via
`lib/observability.py`. No PII in logs — Citizen Twin fields are hashed/omitted.

## Failure modes → behaviour
| Failure | Behaviour (honest, never fake) |
|---|---|
| DeepSeek down / unfunded | Deterministic EN/HI verdict served; logged `llm_fallback=deterministic`. No "coming soon." |
| Missing eligibility input | Rule → `unknown`; verdict capped; citizen prompted for the one field. |
| Scheme source link dead | Auto-flag `broken_link`; surface "verify on myscheme.gov.in"; queue for refresh. |
| PIB poll fails | Last good cache served; freshness endpoint shows true age. |
| Nominatim down | Google Maps fallback link (locator). |
| Turso unreachable | Direct-HTTPS shim retries; honest error, never silent write-loss. |

## Incident classes
- **P0** — fabricated scheme / approval guarantee / PII leak ([guardrails/](../guardrails/)).
- **P1** — wrong eligibility verdict on a gold case; broken language dropdown.
- **P2** — stale amount past its `last_verified` cadence.
