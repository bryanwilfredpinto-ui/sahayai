🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# observability/logs.md

## Per-scan log row (anonymised before aggregation)

```
ts · category · sub_type · confidence · signals[] · route_target · route_state ·
handoff_mode · safety_veto(bool) · user_profile_flags · thumbs · pincode_centroid
```

- **No raw image, no raw text, no user token** in aggregated logs (privacy guardrail).
- KYC fragments masked (last-4) before any log write.
- "Chitti forget" tombstones the rows.

## Failure-mode logging

| Event | Logged as |
|---|---|
| Confidence < threshold | `route_state=unknown` (not an error — a safe outcome) |
| Specialist not built | `route_state=coming_soon` |
| Backend down | `route_state=failed`, `source=text-rules-offline` |
| Wrong route reported (👎) | `wrong_route_candidate=true` → Learning agent |
| Safety override | `safety_veto=true` + original vs final route |

## What "good" looks like in the logs

A healthy day has a *high* `unknown` + `coming_soon` share and a *near-zero* `wrong_routes`
share — honesty over false confidence. A spike in `wrong_routes` is a P1; a single
`safety_veto=false` on a known fraud case is a P0.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
