---
name: chitti-news-factcheck
description: Fact Checker Agent — cross-references a news article against ≥2 other trusted RSS sources in our DB and returns a verdict (verified / partial / disputed / unverified) with rationale. Use when the user asks "is this true", "fact check this", "how reliable", "any other sources covering this".
---

# Chitti News — Fact Checker Agent

## When to invoke
- User asks: "is this true", "fact check", "any other sources", "how reliable", "trustworthy"
- The frontend's 🛡️ Fact Check button is tapped
- A backend route in `routes/news.py:article_factcheck` is called

## Verdicts (4 tiers)

| Verdict | Symbol | Color | Meaning |
|---|---|---|---|
| `verified` | ✅ | green | ≥3 distinct trusted sources agree on the headline + key facts |
| `partial` | 🟡 | amber | 2 sources cover it; broad facts match, details differ |
| `disputed` | ⚠️ | red | 1 other source found, headline diverges OR contradicts |
| `unverified` | ❔ | muted | No cross-source corroboration yet (single-source story — could be hyperlocal or just-breaking) |

## Algorithm (v1, no LLM required for matching)

1. **Normalize** the article title: lowercase, collapse whitespace.
2. **Window** to the last 48 hours of articles in the same language.
3. **Score** with `rapidfuzz.fuzz.token_set_ratio()`.
4. **Cluster** at score ≥ 70.
5. **Count** distinct `source_slug` values among matches (excluding the original).
6. **Cache** result in `news.fact_checks` for 6 hours; re-running returns the cache.

The rationale (one-line EN + one-line HI explanation of the verdict)
is template-rendered in v1 and stored alongside the verdict. A v2
upgrade to DeepSeek-generated rationale is planned for ambiguous
match scores only — see [TODO.md](../../TODO.md) and
[PROMPTS.md §2](../../PROMPTS.md).

## Trust assumption
Every source we ingest from `data/sources.json` is treated as "trusted"
(public RSS feeds from established Indian news outlets). The fact-check
verdict is about **agreement among sources**, NOT about whether any one
source is correct — Chitti News does not editorialise.

## Implementation
- `backend/services/news_factcheck.py` → `factcheck(db, article_id, force=False)`
- DB cache key: `(article_id)` unique
- Returns `{ok, verdict, symbol, color, confidence, matched_sources, rationale_en, rationale_hi, checked_at}`

## Caveats
- Title-similarity matching can yield false negatives when two outlets
  use very different wordings for the same event (e.g. "RBI cuts repo
  rate" vs "Central bank lowers benchmark"). v2 plans: switch to entity
  + verb extraction via DeepSeek.
- "verified" is **not** a truth claim — it's a "many outlets are saying
  this" claim. Always render with the disclaimer "verify on the original
  source link before sharing".
