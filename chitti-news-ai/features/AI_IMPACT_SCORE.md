# AI Impact Score (Phase 2)

> **"How AI will impact YOUR career in the next 12 months."**

---

## What it does

Per profession × per geography, computes a 0-100 score showing the likely AI impact on that profession's job market over the next year.

## Rules-only design

| Component | Weight | Source |
|---|---:|---|
| Job postings mentioning AI / automation / ML / agent | 30 % | job stream, 90-day rolling |
| Job postings being deprecated (companies hiring for automation tools displacing role) | 20 % | job stream signal of "displacing" / "automating" keywords |
| Cert / course launches for this profession × AI | 20 % | cert + course streams |
| Government scheme launches targeting this profession's reskilling | 15 % | scheme stream |
| AI tool launches relevant to this profession | 10 % | tool stream |
| Research paper count for this profession × AI | 5 % | research stream (Phase 2) |

Score in [0, 100]. Honest interpretation:
- **0–25:** Low immediate AI impact
- **26–50:** Moderate — emerging tools relevant
- **51–75:** High — substantial reskilling opportunity (and risk)
- **76–100:** Very high — career disruption + opportunity window

## Output shape

```json
{
  "kind": "ai_impact_score",
  "profession": "hr-professional",
  "geo": "india",
  "score": 67,
  "band": "high",
  "components": {
    "job_ai_mentions": 73,
    "job_displacement_signal": 51,
    "cert_course_launches": 82,
    "govt_scheme_launches": 45,
    "tool_launches": 88,
    "research_papers": 33
  },
  "interpretation_en": "Substantial reskilling opportunity. HR roles with AI-interviewing skills are seeing 45% posting growth.",
  "rule_version": "ai-impact-score-v1"
}
```

## Why this is rules-only

Every component is a count or ratio. The "interpretation" line is a template that fills in the highest-weight signal — not LLM generation.

## Surface

Header card on profession-selected For You view. Re-computed monthly.

## Fail-open

If a component's stream is unavailable → its weight is set to 0 and the remaining weights re-normalise. Score still computes.

---

**World Class CNAIOS — Commando Discipline. Zero Excuses.**
