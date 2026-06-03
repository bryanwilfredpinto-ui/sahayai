# Opportunity Radar (Phase 2)

> **"You should learn Agentic AI because job postings for it increased 45 % in your state this quarter."**

---

## What it does

Detects per-profession-per-state SIGNAL → suggests learning paths from the existing 7 streams.

## Rules-only design (no LLM in critical path)

| Signal source | What it counts | Aggregation |
|---|---|---|
| Job stream ingest | Per-(profession, state, skill_keyword) postings count | weekly rolling sum vs 90-day baseline |
| Course stream ingest | New courses tagged with skill_keyword | new-arrivals rate |
| Cert stream | New certs with skill_keyword | new-arrivals rate |
| Tools stream | New tools with skill_keyword | new-arrivals rate |
| Research stream (Phase 2) | arXiv paper count with skill_keyword | new-arrivals rate |

Trigger: any skill_keyword with `(current_week_count / 90day_baseline) ≥ 1.30` AND `current_week_count ≥ 5` → surface as Opportunity Radar item.

## Output shape

```json
{
  "kind": "opportunity_radar",
  "skill_keyword": "agentic-ai",
  "profession": "software-developer",
  "state": "ka",
  "signal_strength": 0.45,
  "signal_source": "job_postings",
  "evidence": {
    "current_week_postings": 87,
    "90day_baseline_postings": 60,
    "delta_pct": 45
  },
  "next_action": {
    "stream": "courses",
    "top_items": [<course_id>, <course_id>, <course_id>]
  },
  "rule_version": "opportunity-radar-v1"
}
```

## Why this is rules-only

- Counts + ratios are deterministic
- Top-items come from existing classified streams (no generation)
- "Signal" is a real arithmetic value, never an LLM's judgment

## Fail-open

If job/course/cert ingest is partial → Radar surfaces fewer opportunities. Never invents.

## Surface

Pinned card at top of For You tab. Per profession × per state. Refreshed weekly.

---

**World Class CNAIOS — Commando Discipline. Zero Excuses.**
