# Chitti Mentor (Phase 2)

> **"What should I learn next?"** — single next-best-action.

---

## What it does

Given user's profession × completed-skills × time-budget, returns ONE item to learn next.

## Rules-only design

Inputs:
- `profession` (from localStorage)
- `completed_skills[]` (from localStorage opt-in)
- `time_budget_minutes` (user-specified, default 60)
- Live state of all 7 streams

Algorithm:
1. From Skill Gap Radar → top 3 missing skills
2. Filter courses + certs in those skills
3. Filter by `duration_minutes ≤ time_budget`
4. Rank by: provider trust × in-demand signal × profession confidence
5. Return TOP 1

## Output

```json
{
  "kind": "chitti_mentor_next",
  "profession": "doctor",
  "time_budget_min": 60,
  "recommendation": {
    "stream": "course",
    "item_id": <id>,
    "title": "Introduction to Clinical Decision Support",
    "provider": "AIIMS CME",
    "duration_minutes": 45,
    "why_this_one": "Top in-demand skill (clinical-decision-support) + AIIMS provider trust = 0.95 + fits your 60-min budget",
    "next_action": "Start now (45 min)"
  },
  "rule_version": "chitti-mentor-v1"
}
```

## Surface

Single-card on home of For You. Refreshes daily.

## Privacy

`completed_skills` per-device only. Mentor recommendations never logged.

## Fail-open

If no item fits → "Here are 3 in-demand skills; pick one to mark in-progress" (still useful, never silent).

---

**World Class CNAIOS — Commando Discipline. Zero Excuses.**
