🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# OBSERVABILITY — how we watch the guardian in the field

> Level: Quality. Subordinate to [CONSTITUTION.md](CONSTITUTION.md) — observability never logs anything that violates user-ownership of data (camera/journal data is user-owned, anonymised, "Chitti forget" deletes all).
> **Honesty rule:** no dashboard number below is real yet. This is the *strategy*; live metrics flip from 🔵 PENDING once BO11/BO12 ship and the engine runs in production.

---

## Why we observe

Chitti Technicals is a guardian for blind/illiterate first-time investors. If a verdict goes silent, a stop-loss goes missing, or a scam tip slips through, **we must know before the user is hurt** — not when Sire finds it broken ([feedback_verify_before_handover]). Observability is how the commando keeps watch.

## The four signals we watch (priority order)

| Signal | Watches for | Doc |
|---|---|---|
| **Safety-rail health** | stop-loss missing · crisis-redirect fired · loss-spiral cool-down · NOT-SEBI present | [observability/metrics.md](observability/metrics.md) |
| **Determinism / hallucination** | engine ↔ narration drift · fabricated number rate | [observability/logs.md](observability/logs.md) |
| **User feedback** | per-response 👍/👎 + voice/type feedback per box | [observability/feedback.md](observability/feedback.md) |
| **Accessibility uptime** | four-channel verdict reachable · axe regressions · ISL/voice availability | [observability/quality_dashboard.md](observability/quality_dashboard.md) |

## What we deliberately do NOT log (privacy locks)

- ❌ No raw user audio retained beyond the turn.
- ❌ No journal/paper-trade data sold or de-anonymised (Article 11 + camera-intelligence lock: user-owned).
- ❌ No per-user feedback synced to a backend without consent (mirrors Chitti News For-You privacy).
- ✅ "Chitti forget" deletes all observability traces tied to a user on demand.

## Principles

1. **Every narration is logged for audit** (Article 11 — journal everything), so a hallucination is traceable to a turn.
2. **Safety events page loudly** — a stopless signal or a missed crisis redirect is a SEV-1, surfaced on the quality dashboard immediately.
3. **Feedback is per-box, never page-footer** ([per_response_widget_locked]) — granularity matters for a tool with many response boxes.
4. **Reports route to Vaani / CTO inbox**, never mid-session chat ([chitti_cto_autonomous_mode]).

## Status

| Stream | Wired | Live data | Status |
|---|---|---|---|
| Safety-rail health | BO9 (todo) | — | 🔵 PENDING |
| Determinism/hallucination | BO7/BO12 (todo) | — | 🔵 PENDING |
| Per-box feedback | BO10 (todo) | — | 🔵 PENDING |
| Accessibility uptime | BO11 (todo) | — | 🔵 PENDING |

See [QUALITY.md](QUALITY.md) for the gate targets these streams feed, and [evals/RESULTS.md](evals/RESULTS.md) for the eval scoreboard.

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
