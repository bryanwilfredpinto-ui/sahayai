🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# OBSERVABILITY — Logs & Failure Modes

> What we log, why, and how it stays private. Logs are for fixing Chitti — never for
> profiling a rider.

## Event log (anonymised — no PII, no plate, no location in aggregate)
| Event | Fields |
|---|---|
| `diagnosis_request` | symptom tags, bike make/model/year band, odo band, latency_ms, audit_id |
| `swarm_vote` | per-agent {candidate, weight, confidence}, final candidate, final confidence |
| `safety_verdict` | tier (🟢/🟡/🟠/🔴), red_lines[], ride_decision |
| `diy_tier` | tier, difficulty, capped_by_safety (bool) |
| `cost_band` | item, parts_band, labour_band |
| `outcome` | predicted vs actual fix (from [verification loop](mechanic_verification_loop.md)), real_cost_band |
| `low_confidence_inspection` | swarm split / thin evidence → recommend-inspection fired |
| `hallucination_flag` | dropped claim type (phantom_part / fake_dtc / fake_model) |
| `unsafe_diy_block` | rider asked to DIY a 🔴 job; Chitti held the line |
| `scam_shield_check` | item, quote vs band position (within/above/well-above) |
| `scam_shield_defamation_flag` | a named-mechanic accusation was caught + scrubbed |
| `action_confirm` | action type (SOS call / RSA dial / alarm), confirmed/declined (Golden-Rule audit) |
| `forget` | tombstone written |

## Failure-mode catalogue
| Failure | Detection | Response logged |
|---|---|---|
| DeepSeek 5xx | non-200 from /api/2w/ask | honest message + Layer-5 fallback (surfaced, never silent) |
| Malformed swarm JSON | parse fail | honest retry, never a fabricated verdict |
| Unknown bike model | model ∉ lineup | ask to confirm, never invent a diagnosis |
| Location denied | geolocation error | ask-pincode fallback (RSA / mechanic finder) |
| Empty profile | no bike onboarded | guided onboarding, no assumptions |
| Offline | fetch fail + SW | cached maintenance/breakdown tree + offline badge |
| OBD2 adapter not paired | Web-Bluetooth error | fall back to symptom-only diagnosis (works for 90% of bikes) |

## Privacy of logs
- No images stored server-side; camera scans (fake-part) follow Camera Intelligence
  §2b — community-anonymised, user-owned, "Chitti forget" wipes.
- No raw identity, no plate, no GPS in any aggregate. Free-text scrubbed of PII.
- `audit_id` joins to the Turso quality audit (CTO/admin only).

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
