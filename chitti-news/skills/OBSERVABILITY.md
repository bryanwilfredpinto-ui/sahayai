# OBSERVABILITY — Chitti News

How we know the system is healthy without waiting for Bryan to tell us it broke. Per the [verify-before-handover](../../MEMORY.md) rule, every claim of "live" requires a curled production endpoint first.

## Scheduler logs

[news_scheduler.py](../backend/services/news_scheduler.py) drives two APScheduler jobs:

| Job ID | Schedule | What it does |
|---|---|---|
| `rss_poll` | every `RSS_POLL_MINUTES` (default 30) | walks every enabled row in [sources.json](../backend/data/sources.json), pulls fresh entries, ingests idempotently on `link` |
| `daily_breaking` | 06:00 IST daily | recomputes breaking-news clusters (≥3 distinct sources, 4-hour active window) |

Both jobs log start / end timestamps, per-feed counts (ingested / skipped / errored), and total cycle wall-time. The `/api/news/scheduler/status` endpoint surfaces last-run state for diagnostic curls.

## Per-feed health

Each row in `news.sources` tracks `last_polled_at`, `last_ok_at`, and `consecutive_failures`. When `consecutive_failures ≥ 4` (≈ 2 hours of failed polls at 30-min cadence), the feed gets a `source unavailable` tag for the picker — see fallback policy in [TRUTH_SOURCES.md](TRUTH_SOURCES.md).

## Dedupe rate

Polling logs `ingested_count` vs `skipped_dup_count` per feed per cycle. A healthy steady-state dedupe rate is 60–80% — most feeds re-publish the same ~50 entries on each poll, and only the new ones survive the idempotent insert on `link`. A sudden dedupe-rate drop to < 30% on a single feed signals either a publisher format change or a feed-ID bug.

## Fact-check verdict distribution

Across recent articles, the expected distribution from a healthy feed mix:

| Verdict | Expected share |
|---|---|
| `verified` | 25–40% (large stories cross-reported by ≥ 3 outlets) |
| `partial` | 15–25% (2-source matches) |
| `disputed` | 5–10% (single-source headline divergence) |
| `unverified` | 30–50% (state / vernacular / single-source stories) |

A sudden swing — e.g. `verified` collapsing to < 10% — flags a likely matching bug in [news_factcheck.py](../backend/services/news_factcheck.py) before users notice.

## Cache hit rate

`news.fact_checks` is cached at **6 hours**. Cache hit rate should sit above 80% in steady state. A drop means the cache key shape is wrong or the table is being inadvertently cleared.

## Uptime

UptimeRobot pings `https://chitti-news-api.up.railway.app/health` every **5 minutes**. A `200 {"ok": true}` is required; anything else pages Bryan. Same SLO as the Shares / MedUPI backends.

## What is NOT instrumented (by design)

User reading history. Per-user click paths. Article-level click-through. Search queries. None of these are tracked — see [BOUNDARIES.md](BOUNDARIES.md) and [CONTEXT.md §7](../CONTEXT.md). The privacy posture is the product; we deliberately fly blind on per-user behaviour to keep that promise.

## Founder dashboard

All Chitti-product status visible at [sahayai.in/founder](https://sahayai.in/founder).
