# Chitti News AI — IMPORTANCE_SCORING

Importance is the 0–100 axis that decides which news items reach the **daily
briefing**. Separate from the per-user relevance formula in
[`RANKING_FORMULA.md`](RANKING_FORMULA.md).

## Bands

| Score | Meaning | Example |
|---|---|---|
| **90–100** | Critical launch, major model, free-tier earthquake | Google Vids launches with 10 free videos/month; Llama 4 release |
| **80–89** | Important update, significant price drop | ChatGPT adds ads to free tier; Claude Opus 4.7 supports 1M context |
| **70–79** | Useful new tool, community favourite | New open model on Hugging Face passes 1k downloads in a day |
| **60–69** | Minor update, niche tool | Documentation refresh; minor bug fix release |
| **< 60** | Low value, noise, speculation | Opinion piece, unsubstantiated claim |

**Only items scoring ≥ 75 make the daily briefing.** Below 75 they stay
searchable but do not push.

## Signals (additive, capped at 100)

| Signal | Max contribution | Notes |
|---|---|---|
| **Source trust score ≥ 80** | +20 | Trusted sources lift baseline. Sub-60 sources are rejected upstream — never reach this scorer. |
| **Multi-source corroboration** | +25 | +25 if ≥ 3 sources cover within 24 h. +15 if 2 sources. +0 if single source (also tagged "single-source"). |
| **New tool / model / pricing change** | +20 | Detected by `services/scorer.py` keyword + structural classifier. |
| **Free-tier change** | +15 | A free-tier earthquake (cuts or adds) always lifts above the briefing threshold. |
| **Community signal (24 h)** | +15 | HN front page or > 1k stars in 24 h adds. |
| **Vendor official channel** | +5 | OpenAI / Anthropic / DeepMind / DeepSeek blog posts get a small lift. |

## Decay

Importance decays after first surface to avoid stale stories dominating the
briefing:

```
importance_now = importance_at_publish × (1 - 0.1 × days_since_publish)
```

Drops 10 points per day. A 95-importance story is gone from the briefing
after 3 days unless the source recomputes (e.g. follow-up news lifts it
again).

## What the score refuses to do

- **No outrage lift.** Emotionally loaded language is detected and
  *discounted*, not amplified.
- **No vendor weighting** beyond the small +5 for official-channel posts —
  same offer to every vendor.
- **No paywalled-source rescue.** A paid source covering an item does not
  count toward multi-source corroboration. Free sources only.