🎖️ World Class Chitti Fashion — Observability: Logs

# OBSERVABILITY — Logs & Failure Modes

> What we log, why, and how it stays private. Logs are for fixing Chitti, never for
> profiling the user.

## Event log (anonymised)
| Event | Fields (no PII, no photos) |
|---|---|
| `advice_request` | feature (F0…F14), occasion type, profile flags, resolution (own_wardrobe/budget/premium), latency_ms, audit_id |
| `swarm_vote` | 7 agent scores, overall, trend_note_present |
| `phantom_item` | count of model-emitted IDs not in wardrobe (hero-feature integrity) |
| `malformed_swarm_json` | retry count |
| `body_comment_flag` | card id (`fa_shop`), classifier hit (text scrubbed) |
| `accessibility_floor_breach` | agent score < 6, profile, rephrased=true |
| `action_confirm` | action type, confirmed/declined (Golden Rule audit) |
| `forget` | tombstone written |

## Failure-mode catalogue (matches [../ARCHITECTURE.md](../ARCHITECTURE.md))
| Failure | Detection | Response logged |
|---|---|---|
| DeepSeek 5xx | non-200 from /api/vaani/ask | honest message + Layer-5 fallback (surfaced) |
| Location denied | geolocation error | ask-city fallback |
| Empty wardrobe | 0 usable items | guided-add, no fabrication |
| Phantom item | id ∉ wardrobe | drop + recompute + `phantom_item` |
| Offline | fetch fail + SW | cached advice + offline badge |

## Privacy of logs
- No images, ever. No raw user identity. Free-text scrubbed of PII before any aggregate.
- `audit_id` joins to Turso quality audit (CTO/admin only).
- `"Chitti forget"` tombstones the user's contribution.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
