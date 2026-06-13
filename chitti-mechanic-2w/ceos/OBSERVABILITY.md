🎖️ World Class Chitti Mechanic 2 Wheeler — Commando Discipline. Zero Excuses.

# OBSERVABILITY — Chitti Mechanic 2 Wheeler

> What we watch in production and when we wake someone up. Privacy first: metrics are
> anonymised aggregates; no RC/insurance number, no Vehicle Twin contents ever leave the
> device for telemetry. "Chitti forget" tombstones the user's aggregate contribution.
> All numeric values below are **to be measured** in production, not baked-in claims.

## Metrics

| Metric | What it tells us | Source |
|---|---|---|
| **Reminder CTR** | % of fired reminders the user acted on (per channel: voice/SMS/WhatsApp/push) | reminders journal |
| **Insurance saving** | aggregate ₹ saved via `insure.compare` vs prior premium | savings journal |
| **Scam detection** | count + ₹ of quotes flagged >30% above expected; user-confirmed true-positives | scam events |
| **DIY completion** | % of 🟢 triage jobs reported completed by the user | triage journal |
| **Error rate** | engine exceptions + backend 5xx (excluding honest 501 stubs) | client + Flask logs |
| **Response time** | engine compute latency (client) + `/api/2w/*` narration latency (backend) | timers |

Secondary: OCR success rate, OBD lookup hit/miss, savings-tracker progress toward
₹10k goal, per-feature 👍/👎 ratio (feedback-widget), per-language usage split.

## Alerts

| Condition | Severity | Action |
|---|---|---|
| `/api/2w/health` down **> 5 min** | **CRITICAL** | Page on-call; client enters **degraded mode** — engine still serves deterministic answers offline, DeepSeek narration suppressed with honest banner |
| OCR failure rate **> 10%** | **WARNING** | Investigate vision pipeline; fall back to manual entry; do not block the Vault |
| Scam event detected | **USER ALERT** | Fire scam alert to the affected user (in-app + chosen channel, Golden-Rule confirmed) |
| Engine exception spike | WARNING | Capture inputs (anonymised), reproduce in `cert_mechanic_2w.mjs` |
| Backend 5xx (non-501) | WARNING | Honest 501 stubs are expected and NOT alerted; real 5xx is |

## Degraded mode contract

When the backend is unreachable, the client **never shows an error to the user for a
computable answer** — the engine runs offline, returns the deterministic result with
`{confidence, risks[], sources[]}`, and shows an honest "narration unavailable, showing
verified numbers" banner. This is the §2e Business-Continuity contract applied to 2W.

---
> **World Class Chitti Mechanic 2 Wheeler — Commando Discipline. Zero Excuses.**
