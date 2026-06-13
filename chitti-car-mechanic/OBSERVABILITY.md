# OBSERVABILITY — Chitti Car Mechanic

## Metrics (what we watch)
| Metric | Where |
|---|---|
| Reminder fire / CTR | per-response widget + (future) reminder delivery log |
| Insurance indicative saving accepted | Savings Tracker entries |
| Scam flagged vs confirmed | swarm (anonymised) |
| DIY completion | per-response 👍/👎 + follow-up |
| Diagnostic 👍 rate | `feedback-widget.js` per box |
| Error / response time | page-local; remote telemetry **opt-in** only |

## Logging & privacy
- Page-local first. Remote telemetry is **opt-in** (`window.CHITTI_OBS_API` / `OBS_REMOTE`) — the
  fleet-wide fix from QUALITY_STATUS (no cross-origin POST by default; no false "Degraded").
- No PII in any aggregate; "Chitti forget" honoured.

## Alerts
| Condition | Severity | Action |
|---|---|---|
| Live-data API down (BO11+) | warn | degrade to offline engine (honest "using offline data") |
| OBD/symptom "unknown" rate high | info | candidate for swarm KB expansion |
| Safety mis-classification reported | **critical** | P0 — fix `RULES`/`diyTriage`, re-run gold test |

## Mechanic Verification Loop (CEOS spirit)
When a user later tells Chitti what the mechanic actually fixed, store predicted-vs-actual (anonymised) →
feeds diagnostic-accuracy measurement + swarm. 🟡 needs the feedback round-trip wired post-launch.
