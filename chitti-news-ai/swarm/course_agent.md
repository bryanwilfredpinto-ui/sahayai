# Agent 3 — Course Agent

> Per COSDF L6 (lines 290-294). Returns free courses for the user's mapped role.
> Difficulty-tagged. Rules-only catalog lookup.

---

## Purpose

Given the Role Mapping Agent's output, return a list of REAL, FREE-first courses for that profession, tagged by difficulty (beginner / intermediate / advanced).

---

## Input

```json
{
  "role_normalised": "teacher",
  "primary_domain": "education",
  "courses_filter": ["edtech", "lesson-plan", "diksha"],
  "lang": "en",
  "experience_band": "3-5",
  "hours_per_week": 5
}
```

---

## Output

```json
{
  "courses": [
    {
      "title": "AI in the Classroom",
      "provider": "Coursera (DeepLearning.AI)",
      "url": "https://www.coursera.org/learn/ai-classroom",
      "is_free": true,
      "free_mode": "audit",
      "duration_hours": 12,
      "difficulty": "beginner",
      "fits_hours_per_week": true,
      "verified_at": "2026-05-30"
    },
    {
      "title": "Prompt Engineering for Teachers",
      "provider": "MagicSchool.ai Academy",
      "url": "https://www.magicschool.ai/academy",
      "is_free": true,
      "free_mode": "fully_free",
      "duration_hours": 4,
      "difficulty": "beginner",
      "fits_hours_per_week": true
    }
  ],
  "free_count": 2,
  "paid_count": 0
}
```

`fits_hours_per_week` is true when `duration_hours / 4 ≤ hours_per_week × 4` (i.e. the user can finish in ≤ 4 weeks at their current pace).

---

## Rules

1. **FREE-first** — sort `is_free=true` before paid, then by `difficulty ASC` matched to user's experience band, then by `duration_hours ASC`.
2. **Difficulty match** — `0-2` years experience → show beginner first; `5-10` → intermediate first; `10+` → advanced first.
3. **Time-budget filter** — courses that wildly exceed `hours_per_week × 16` (4 months) are de-ranked, not removed, with a "long commitment" pill.
4. **Provider allowlist** — Coursera, edX, NPTEL, Skill India, MIT OCW, Stanford Online, DeepLearning.AI, MagicSchool, Diffit, Anthropic Skilljar, Microsoft Learn, Google Skillshop, AWS Educate, IBM SkillsBuild + curated list.
5. **No course-in-disguise marketing pages** — provider must offer the actual course; landing pages with "talk to sales" are rejected at ingest.

---

## Catalog source

- `backend/services/courses_ingestor.py` reads `data/courses_catalog.json`.
- Coverage: 172 entries across 6 Coach Picks sections.
- Weekly refresh; nightly broken-link sweep.
- Hand-curated; community submissions enter via [Community Intelligence Agent (Phase 2)](../../COSDF.md) Level 20.

---

## Difficulty pill rendering

The frontend (`chitti_news_ai.html` line 441-ish card template) renders the difficulty as a colored pill:
- 🟢 Beginner
- 🟡 Intermediate
- 🔴 Advanced

Color is paired with text + emoji per [`../accessibility/deaf_user.md`](../accessibility/deaf_user.md) (never color-only).

---

## Failure mode

| Failure | Behavior |
|---|---|
| Zero courses match `courses_filter` | Fallback to `primary_domain` filter; if still zero, honest_note: *"No courses found for 'X'. Try adjacent skill 'Y'."* |
| Provider domain blocked at upstream | Course removed; logged. |
| `hours_per_week` not in profile | Time-budget filter skipped; all results returned in difficulty order. |

---

## Test

`backend/tests/test_feed_endpoints.py::test_course_agent_difficulty_ordering` asserts:
- For each hub × each experience band, the first course matches the expected difficulty.
- All courses on a deny-list provider are absent from output.
- `fits_hours_per_week` matches the formula for a known fixture.

---

Last reviewed: 2026-06-06
