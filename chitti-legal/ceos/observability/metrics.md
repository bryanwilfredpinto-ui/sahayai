# Observability — metrics

| Metric | Source |
|---|---|
| Per-response 👍/👎 | `feedback-widget.js` → Founder dashboard (07:00 IST) |
| Deadline saves (matters flagged `closing-soon` before expiry) | Twin + limitation engine |
| Free-legal-aid referrals surfaced (moat) | `legalAid` calls with `eligible:true` |
| Scam catches (high-risk before payment) | `scamShield` band=`high-risk` |
| Per-language 👍 + raw-key/English-leak | lang substrate + feedback |
| Accessibility journey completion / axe regressions | `tools/cert_legal_os.mjs` runs |
| Notice-classification confidence distribution | `classifyNotice` outputs |

Production telemetry lights up after the next Railway deploy + DeepSeek funding (BO11).
Cross-origin telemetry is opt-in (no false "Degraded" on static hosting).
