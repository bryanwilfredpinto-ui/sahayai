# GUARDRAILS — Chitti News

Things that **must never hallucinate** and must always render verbatim from source.

## Source attribution

Every article card renders the **byline + outlet display name** exactly as stored in [data/sources.json](../backend/data/sources.json). The `display_name` field is the source of truth — never paraphrased, never abbreviated. Examples: "Times of India · Top Stories", "दैनिक भास्कर · राष्ट्रीय", "ഏഷ്യാനെറ്റ് ന്യൂസ്".

## Publication date / time

Pulled from the RSS `pubDate` (or `published_parsed`) and stored in UTC. Rendered in IST on the card. Never inferred. Never rewritten. If the feed doesn't expose a date, the article is tagged `published_at = null` and surfaces an "Undated" badge — it is **not** stamped with ingest time.

## URL

The `link` field from the RSS entry, stored verbatim, used both for the "Open original" tap target and for idempotent deduplication during polling ([news_ingest.py](../backend/services/news_ingest.py)). Never shortened, never wrapped through a redirect.

## Language

The `language` field is set from `sources.json`, not auto-detected. A Telugu article from `news18-telugu-ap` is tagged `te` because the source registry says so. The picker filters strictly on this tag — there is no language-detection guesswork.

## Category

One of: `national`, `state`, `business`, `tech`, `sports`, `entertainment`. Set from the source registry. The user-facing folders `saved` and `cancelled` are per-device state, not categories.

## Article summary

The `summary` rendered on the card is **only** what the RSS feed provided, clamped to 1500 chars before any LLM call ([PROMPTS.md §1](../PROMPTS.md)). The Anthropic-generated "Chitti's Take" is rendered as a **separate panel** below the original summary so the reader can compare. If Anthropic fails or is unconfigured, the Take panel surfaces the verbatim fallback string ([news_summary.py:_fallback](../backend/services/news_summary.py)) — never silently substituted.

## Fact-check verdict

Never inferred from the article body alone. Always computed from cross-source agreement on the title via `rapidfuzz.fuzz.token_set_ratio` ≥ 70 ([news_factcheck.py](../backend/services/news_factcheck.py)). The rationale is template-rendered in v1 — no LLM hallucination surface.

## Disclaimer

The aggregator disclaimer (EN + HI) is appended to every feed response by [news_db.py:feed()](../backend/services/news_db.py). It is not optional and not removable.
