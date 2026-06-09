🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# OBSERVABILITY — Chitti Technical

What we watch so failures are caught before the user is. Detail in [`observability/`](observability/).

| Signal | Where | Why |
|---|---|---|
| System Signal Journal | every call auto-logged (`logSystemSignal`) → on-device | audit trail + the glass-box track record (CEOS §10, BO17) |
| Per-response feedback | 🔊/🤖/👍/👎/✏️ per box → `feedback.html` → Founder report | catch a bad call/explanation per box |
| Live-data health | `chitti-shares-api` `/health`; serve-last-known-good on Angel rate-limit | never a fake price; "loading"/"unavailable" stated honestly |
| Page errors / axe | `cert_technical.mjs` + `certify_technical.mjs` (0 page errors, axe 0×5 devices) | regression gate before deploy |
| Loss-spiral guard | `detectLossSpiral` >5%/day → cool-down (CEOS §13.4) | protect the user in the moment |

Open item (per `QUALITY_STATUS.md`): the false **"Degraded #OTX9"** badge — `chitti-shares-api` obs/health
needs the CORS header; tracked, not yet closed.
