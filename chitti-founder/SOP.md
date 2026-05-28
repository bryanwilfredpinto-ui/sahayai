🎖️ **World Class Chitti Founder — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

# Chitti Founder — Standard Operating Procedure

## Objective
Aggregate every Chitti's quality signals (audit, feedback, swarm, carbon) and run the BCP layers — self-ping every 4 min, daily / weekly / hourly reports to Sire, LLM-fallback chain shim.

## Primary User
Sire (Bryan), as the founder dashboard. Also the CTO seat per [chitti-cto/CTO.md](../chitti-cto/CTO.md).

## Success Metric
(a) 72-h autonomous uptime (BCP target) · (b) on-time delivery of DAILY 07:00 / WEEKLY Sun 08:00 / HOURLY :15 reports · (c) alert dispatch latency from non-200 → Sire's inbox (debounced 1h per Chitti).

## Quality Standard
- BCP Layer 1 self-ping every 4 min — **NOT UptimeRobot, NOT any external monitor**
- Honest stub returning `False` on unset SMTP / SMS / GH-token / Claude / Gemini env (cron stays green)
- Aggregator-only — never a per-Chitti producer (its own HTTP rows in `quality_audit` would be circular)
- 72-hour autonomous uptime target — every BCP layer runs unattended for ≥72h

## Operating Rules
1. **4-min self-ping is sacrosanct.** NOT UptimeRobot, NOT any external monitor. Doubles as Railway free-tier keep-alive.
2. **No silent fallbacks.** Layer-5 surfaces *"falling back to Claude because DeepSeek 5xx-d 3× in a row"*, never silent.
3. **Honest stub on unset env.** SMTP/SMS/GH-token unset → helper logs intent, returns False, cron stays green.
4. **Aggregator-only.** Founder never originates LLM responses. Its own HTTP rows do NOT land in `quality_audit` (circular).
5. **CTO seat dual-role.** Founder is also where CTO operates per [chitti-cto/CTO.md](../chitti-cto/CTO.md). Same Chitti, different hats.
6. **Swarm Intelligence cadence.** Sunday 09:00 IST `run_swarm_pass`. HIGH-risk patches land in `SWARM_PROPOSED.md` only — Sire approves before merge.

## Error Handling
- Railway service down → Layer-1 self-ping logs gap + emails Sire on first non-200 (debounced 1h)
- SMTP env unset → helper returns False (cron stays green); Sire-email path no-op
- LLM fallback chain all-providers fail → Layer-5 surfaces honest failure, never silent degradation
- Turso libsql sync fails → log to founder DB; the absence of new rows IS the alert

## Escalation to CTO (self-escalation — CTO is Founder)
- 72-h uptime breached (any Chitti down > 72h)
- Daily/weekly/hourly cron misses delivery window
- Swarm pass identifies HIGH-risk Chitti pattern → Sire approval required
- LLM fallback chain not wired on any Chitti (0/15 today — open defect)
- Email delivery sustained failure > 24h (SMTP credential rotation needed)

## Stale Data Rule
Quality slices recomputed per cron tick (no caching of stale slices). Self-ping log retained 30 days, then rolled up to weekly aggregates. Aggregator never caches user data. "Chitti forget" tombstones honoured across every aggregate.

## Evolution Owner
[chitti-founder/backend/main.py](backend/main.py), [lib/founder_report.py](../lib/founder_report.py), [lib/chitti_quality.py](../lib/chitti_quality.py). Sire approves every new cron + report column.

---

> **World Class Chitti Founder — Commando Discipline. Zero Excuses.**
