# Chitti News AI — OBSERVABILITY

## Health endpoint

`GET /health` → returns:

```
{
  "ok": true,
  "service": "chitti-news-ai-api",
  "version": "0.1.0",
  "last_rss_poll_utc": "2026-05-14T08:00:00Z",
  "sources_active": 17,
  "sources_pending_verification": 0,
  "uptime_seconds": 12345
}
```

Self-pinged by `chitti-founder` every 4 minutes per [§2e Layer
1](../../SAHAYAI_MASTER.md#2e-business-continuity-plan--locked-2026-05-14).
Non-200 → email Sire (debounced 1 h).

## Metrics

Exposed at `GET /metrics` (Prometheus text format, gated on
`METRICS_TOKEN`):

- `chitti_news_ai_rss_poll_total{source="...", outcome="ok|fail"}`
- `chitti_news_ai_articles_ingested_total`
- `chitti_news_ai_tools_in_corpus`
- `chitti_news_ai_trust_score_recompute_seconds`
- `chitti_news_ai_deepseek_calls_total{kind="topic|score|summary", outcome="..."}`
- `chitti_news_ai_deepseek_latency_seconds{kind="..."}`
- `chitti_news_ai_carbon_grams_total` — shared with Chitti Quality v2

## Feedback signal

Every response box carries 👍 / 👎 via the per-response widget. Aggregated
in the daily 07:00 IST founder report. Box-level granularity — *"Profession
→ Tools" got 92% 👍 last week, but the Free Tier Tracker dropped to 71%* —
exact pattern that surfaces in the weekly trend digest (§6).

## Quality framework

This Chitti registers in `lib/chitti_quality.py` at:

- Risk level: **LOW** (not handling money, medication, legal, or safety)
- Carbon target: ≤ 0.3 g CO₂ per response (≤ the platform-wide 0.5 g
  escalation threshold)

Below 70% 👍 over 24 h triggers an SMS to Sire. > 0.5 g CO₂ over 24 h opens
a carbon issue. Matches §6.

## Logging contract

- `INFO` — every RSS poll, every trust score recompute, every accepted /
  rejected submission.
- `WARN` — Layer 1 fails, source flagged as inconsistent, AI crawling
  status changed.
- `ERROR` — DeepSeek 5xx (triggers Claude → Gemini fallback per §2e Layer
  5), DB unreachable, scheduler crashed.

Structured JSON via `lib/observability.py` so chitti-founder can parse.