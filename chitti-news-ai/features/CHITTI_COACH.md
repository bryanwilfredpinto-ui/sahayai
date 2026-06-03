# Chitti Coach (Phase 2)

> **"30-day learning plan."** Sequenced from the 9 streams.

---

## What it does

Builds a 30-day personalised plan: which course on day 1, which cert exam on day 14, which job to apply by day 30.

## Rules-only design

Inputs:
- `profession`
- `top_3_skill_gaps` (from Skill Gap Radar)
- `time_per_day_minutes` (user-specified)
- `learning_style` (course-first / project-first / cert-first)

Algorithm:
1. Sort top-3 skills by in-demand signal × user_priority
2. For each skill, sequence: fundamentals course → applied course → cert study → cert exam → first job application
3. Pack into 30-day timeline respecting `time_per_day_minutes`
4. Render as daily checklist

## Output

```json
{
  "kind": "chitti_coach_plan",
  "profession": "software-developer",
  "duration_days": 30,
  "time_per_day_min": 45,
  "plan": [
    {"day": 1, "stream": "course", "item_id": <id>, "estimated_min": 45, "skill": "prompt-engineering"},
    {"day": 2, "stream": "course", "item_id": <id>, "estimated_min": 45, "skill": "prompt-engineering"},
    ...
    {"day": 14, "stream": "cert", "item_id": <id>, "estimated_min": 60, "action": "schedule exam"},
    ...
    {"day": 30, "stream": "job", "item_id": <id>, "action": "apply"}
  ],
  "rule_version": "chitti-coach-v1"
}
```

## Surface

Dedicated page; downloadable as PDF; daily reminder via Chitti PA (Phase 3).

## Fail-open

If stream gaps prevent a full 30-day plan → return what's possible + flag missing stream. Never invent items.

---

**World Class CNAIOS — Commando Discipline. Zero Excuses.**
