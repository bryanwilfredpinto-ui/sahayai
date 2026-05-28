# Chitti News AI — RANKING_FORMULA

Tool ranking is **dynamic**. Computed on every user request, recomputed in
background every 6 hours. Never hardcoded.

## Formula

```
Relevance = (Keyword Overlap × 0.4)
          + (Community Signal × 0.3)
          + (Freshness × 0.2)
          + (Free Generosity × 0.1)
```

All terms normalised to 0–100. Final score is also 0–100.

### Keyword Overlap (40%)

Percentage of the user's extracted topics that appear in the tool's
description / tags / community-curated tag set.

- DeepSeek extracts topics from the user's profession sentence (no hardcoded
  profession list).
- Topics are vectorised + matched against the tool's tag corpus + first
  paragraph of its description.
- Score = (matched_topics / extracted_topics) × 100.

### Community Signal (30%)

A normalised composite:

- GitHub stars (log-scaled)
- Hacker News upvotes on the launch thread
- Reddit mentions in `r/LocalLLaMA`, `r/MachineLearning`, `r/ChatGPTPro`
- Hugging Face downloads (for models)

All scaled to 0–100 using log-rank normalisation across the current corpus.
Recomputed every 6 hours alongside the RSS poll.

### Freshness (20%)

```
freshness = max(0, 100 - days_since_launch * (100/365))
```

A tool released today scores 100. A tool released 365 days ago scores 0.
Older tools are not penalised below 0.

### Free Generosity (10%)

Manual + DeepSeek-classified, on a 1–10 scale × 10 for the formula:

| Tier | Score | Example |
|---|---|---|
| Unlimited free | 10 | Truly unlimited usage on a free plan |
| Very generous | 8 | High monthly quota, no card required |
| Standard free | 5 | Typical free tier (e.g. 5,000 tokens / day) |
| Limited | 3 | 100 / day or single trial |
| Very limited | 1 | One-time trial only |

## Worked example

User: *"I am a teacher in a Tamil-medium school. Tell me AI tools."*

DeepSeek extracts topics: `[teaching, lesson-plan, regional-language,
worksheet, low-bandwidth]`.

Candidate tools (sample):

| Tool | KW overlap | Community | Freshness | Free gen | Score |
|---|---|---|---|---|---|
| **Khanmigo Lite** | 80 | 60 | 70 | 8 (×10=80) | 32 + 18 + 14 + 8 = **72** |
| **Eduaide** | 70 | 55 | 60 | 5 (×10=50) | 28 + 16.5 + 12 + 5 = **61.5** |
| **MagicSchool AI** | 75 | 70 | 65 | 6 (×10=60) | 30 + 21 + 13 + 6 = **70** |

Railwayed order: Khanmigo Lite → MagicSchool AI → Eduaide. The bands reflect
real preferences for a teacher (keyword fit + free tier > raw popularity).

## Importance vs Relevance — different axes

- **Relevance** (this file) — how well a tool matches *this* user.
- **Importance** ([`IMPORTANCE_SCORING.md`](IMPORTANCE_SCORING.md)) — how
  consequential a news item is for the daily briefing. 0–100, independent of
  the user.

A high-relevance tool is in the *Tools for Me* feed. A high-importance
launch is in the *Daily Briefing* feed. They use different scores; never
conflate.

## What the formula refuses to do

- **No paid-tier bias.** A paid tool with a stingy free tier scores low on
  the 10% term; cannot win by overpowering the other 90%.
- **No vendor weighting.** OpenAI / Anthropic / Google get no head start;
  the formula sees only the public signals.
- **No popularity-only.** Community signal is 30% — never enough alone.
- **No staleness reward.** A tool released 18 months ago with no updates
  scores 0 on freshness; community signal must compensate.