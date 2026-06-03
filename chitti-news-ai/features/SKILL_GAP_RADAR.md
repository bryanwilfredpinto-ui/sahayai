# Skill Gap Radar (Phase 2)

> **"Your profession: HR. Missing skill: AI Interviewing. Recommended: Google · Microsoft · NPTEL."**

---

## What it does

Per profession, surfaces 1–3 skill-gaps based on the gap between (skills appearing in fresh job postings for that profession) AND (skills the user has demonstrably learned).

## Rules-only design

| Input | Source |
|---|---|
| In-demand skills | from job stream — top-K skill keywords by posting frequency over 90 days |
| User's learned skills | (Phase 2 opt-in) user-marked "Completed" on courses / certs |
| User's profession | localStorage |
| Course / cert / tool that teaches the skill | from existing rule-classified streams |

Calculation: `missing_skills = in_demand_top_K - user_completed`. Sort by `in_demand_frequency`. Top 3 = Skill Gap Radar.

## Output shape

```json
{
  "kind": "skill_gap_radar",
  "profession": "hr-professional",
  "missing_skills": [
    {
      "skill_keyword": "ai-interviewing",
      "in_demand_count_90d": 142,
      "recommended_paths": [
        {"stream": "course", "id": <id>, "provider": "Google AI Education"},
        {"stream": "course", "id": <id>, "provider": "Microsoft Learn"},
        {"stream": "course", "id": <id>, "provider": "NPTEL"}
      ]
    }
  ],
  "rule_version": "skill-gap-radar-v1"
}
```

## Privacy

User's "Completed" list is **localStorage only**. NEVER synced. `Chitti.forget()` wipes.

## Fail-open

If user hasn't marked anything Completed → falls back to "Top in-demand skills for HR right now" (still useful).

---

**World Class CNAIOS — Commando Discipline. Zero Excuses.**
