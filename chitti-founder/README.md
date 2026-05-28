🎖️ **World Class Chitti Founder — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

> Aggregator + Business Continuity. Self-pings every Chitti every 4 min. Daily/weekly/hourly quality reports. LLM-fallback shim chain. This is also the CTO seat per [chitti-cto/CTO.md](../chitti-cto/CTO.md).

| Field | Value |
|---|---|
| User-facing URL | None — aggregator only |
| Health | https://chitti-founder-api.up.railway.app/health |
| Status | 🟡 YELLOW by design — libsql direct, no SQLAlchemy Observability engine; aggregator-only |
| Primary user | Sire (Bryan) — founder dashboard + CTO inbox |
| BCP target | 72 hours autonomous uptime |
| Crons (Asia/Kolkata) | DAILY 07:00 · WEEKLY Sun 08:00 · HOURLY :15 · Sunday 09:00 Swarm · 4-min self-ping |
| Companion docs | [SKILLS.md](SKILLS.md) · [SOP.md](SOP.md) · [CHITTI_SOP.md §15](../CHITTI_SOP.md) · [chitti-cto/CTO.md](../chitti-cto/CTO.md) |

---

# Chitti Founder — Aggregator + Business Continuity

Chitti Founder is the **only Chitti without a user-facing surface**. It aggregates every other Chitti's quality signals (audit, feedback, swarm, carbon), runs the 5-layer BCP, sends daily/weekly/hourly reports to Sire, and shims the DeepSeek → Claude → Gemini fallback chain across the platform.

It's also where the CTO seat lives (per [chitti-cto/CTO.md](../chitti-cto/CTO.md)) — the aggregator and the platform engineer are the same role.

## What it does
- **BCP Layer 1**: self-ping every 4 min — hits every Chitti `/health`, emails Sire on non-200 (debounced 1h/Chitti), logs to Turso `chitti-founder` DB. NOT UptimeRobot.
- **BCP Layer 2**: health-check ground truth surfaces on Founder dashboard.
- **BCP Layer 3**: per-response widget signals from every Chitti aggregated daily.
- **BCP Layer 4**: 07:00 IST quality email + Sunday 08:00 trend digest + hourly :15 escalator pass.
- **BCP Layer 5**: LLM fallback shim chain (DeepSeek → Claude → Gemini) — currently 0/15 wired.
- **Swarm Intelligence pass**: Sunday 09:00 IST `run_swarm_pass` — anonymised pattern detection across all Chittis; HIGH-risk patches require Sire's approval.

## What it does NOT do
- No user-facing endpoints
- No LLM responses originated
- No per-Chitti producer role (its own HTTP rows in `quality_audit` would be circular)
- No swallowing of failures silently

## Why YELLOW (by design)
Founder uses libsql directly (per [[project_turso_embedded_replica_pattern]]) — no SQLAlchemy `Observability` engine. The libsql-backed self-ping logs cover Founder's own observability surface. Flips to 🟢 only if/when Founder gains a user-facing LLM endpoint.

## Companion docs
- [SKILLS.md](SKILLS.md) — 20-row feature checklist
- [SOP.md](SOP.md) — operating rules
- [CHITTI_SOP.md §15](../CHITTI_SOP.md) — 7-field standard operating profile
- [chitti-cto/CTO.md](../chitti-cto/CTO.md) — CTO seat lives here; this is the same Chitti
