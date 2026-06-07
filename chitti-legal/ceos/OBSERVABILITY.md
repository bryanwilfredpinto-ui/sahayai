🎖️ World Class Chitti Legal OS — Commando Discipline. Zero Excuses.

# OBSERVABILITY — Chitti Legal OS

## What we track (CEOS §11)

- **Incorrect explanations** — flagged via 👎 + free-text on the per-response widget.
- **User corrections** — when a user corrects a right/deadline; feeds the Swarm (HIGH-risk → Sire review).
- **Broken legal references** — any citation that no longer resolves / was superseded.
- **Language quality** — per-language 👍 rate; raw-key / English-leak detection.
- **Accessibility success rate** — four-user journey completion, axe regressions.
- **Deadline saves** — matters flagged `closing-soon` before expiry (prevention signal).
- **Free-legal-aid referrals** — the moat metric (free help surfaced).
- **Scam catches** — high-risk scam scenarios flagged before payment.

## Where it lives

- Per-response signals: `feedback-widget.js` → Founder dashboard daily (07:00 IST).
- Metrics + feedback detail: [observability/metrics.md](observability/metrics.md),
  [observability/feedback.md](observability/feedback.md).
- Backend telemetry (when wired): `chitti-legal/backend` Observability + quality_audit
  rows; cross-origin telemetry is opt-in (no false "Degraded" on static hosting).

## Honest note

Production curl/telemetry numbers light up after the next Railway deploy + DeepSeek
funding (BO11). Until then, observability is design-complete and the deterministic core
is fully test-instrumented (engine 60/60, cert 27/27).

---
> **World Class Chitti Legal OS — Commando Discipline. Zero Excuses.**
