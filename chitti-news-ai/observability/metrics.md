# Metrics — Chitti News AI

> What we measure, how we send it, and what we never measure.
> All metrics are anonymised per [`../guardrails/privacy.md`](../guardrails/privacy.md).

---

## Surface-level metrics (the dashboards Sire sees)

| Metric | Source | Cadence | Where it surfaces |
|---|---|---|---|
| Per-card 👍 / 👎 | feedback-widget.js → `/api/feedback/collect` | real-time | chitti-founder weekly digest |
| Click-through to course / cert / tool | per-card `🔗` click → `/api/feedback/collect` event=`click` | real-time | chitti-founder weekly digest |
| Classifier confidence distribution | `profession_classifier.py` log line per article | every ingest | grafana-style histogram in /health |
| Per-source RSS ingestion success rate | `rss_fetcher.py` `last_error` field | every 30 min | /health endpoint per source |
| Per-source articles persisted | `streams_ingestor.py` insert count | every 30 min | /health endpoint per source |
| Tab-render latency (frontend) | `chitti_a11y.js` `performance.now()` delta | per tab switch | /api/feedback/collect event=`perf` |
| Unknown-role count | role_mapping fallback path hit | real-time | weekly digest — drives Phase 2 ANY-role priority |
| Language-coverage gap | Language Agent `fallback_used=true` events | real-time | weekly digest |
| Accessibility-mode adoption | `disability_profile` count per modality | daily snapshot | weekly digest |
| Trust strip url_check pass rate | Trust Agent | nightly sweep | /health |

---

## Per-card 👍 / 👎 payload

The single most important signal in this product. Every card carries the widget; every vote is captured.

```json
POST /api/feedback/collect
{
  "event": "vote",
  "card_id": "news-a4b9c2e1",
  "card_kind": "news",                    // news | cert | course | tool | prompt | project | mission
  "vote": "up",                            // up | down
  "reason_text": null,                     // optional, only for "down" with PII-scan applied
  "lang": "en",
  "profession_tag": "software-developer",
  "ip_hash": "sha256(client_ip + daily_salt)",
  "ts": "2026-06-06T07:00:00Z"
}
```

Server stores: `card_id`, `card_kind`, `vote`, `lang`, `profession_tag`, `ip_hash`, `ts`, `reason_text_cleaned`. Server never stores: User-Agent, Referer, client IP raw, any PII detected in `reason_text`.

---

## Click-through payload

```json
POST /api/feedback/collect
{
  "event": "click",
  "card_id": "cert-coursera-ai-for-finance",
  "card_kind": "cert",
  "destination_host": "coursera.org",
  "lang": "en",
  "profession_tag": "accountant",
  "ip_hash": "...",
  "ts": "..."
}
```

The destination_host is captured for url-check trend. We never capture full URLs with query strings (they may carry session IDs from third parties).

---

## Classifier confidence distribution

Every article that goes through `profession_classifier.py` logs:

```
[classify] article_id=a4b9c2e1 source=anthropic-blog
  profession=software-developer confidence=0.87 keywords_hit=4
  source_default_weight=0.3 context_check=passed
```

Aggregated per day into a histogram with buckets [0.0-0.5, 0.5-0.7, 0.7-0.85, 0.85-1.0]. Right-tail is healthy; left-tail spike signals new article types the classifier doesn't recognise.

---

## Per-source ingestion success rate

`rss_fetcher.py` updates a row in `news.source_health`:

```
source_id          last_poll_ok   last_error          consecutive_failures   articles_24h
anthropic-blog     2026-06-06...  null                0                       3
openai-blog        2026-06-06...  null                0                       2
google-ai-blog     2026-06-06...  "timeout"           1                       0
mit-tech-review    2026-06-06...  null                0                       5
...
```

`/health` surfaces a per-source RED / YELLOW / GREEN. Three consecutive failures → RED → email to Sire.

---

## Tab-render latency

Frontend instrumentation (`chitti_news_ai.html`):

```js
const t0 = performance.now();
// ... tab render code ...
const t1 = performance.now();
fetch('/api/feedback/collect', {
  method: 'POST',
  body: JSON.stringify({ event: 'perf', tab: 'news', ms: t1 - t0, ip_hash: '...' })
});
```

P50 / P95 latency surfaced in weekly digest. The Functional Gate (Quality Gate 1) requires P95 < 3s.

---

## What we never measure

- ❌ Dwell time per card (no scroll-tracking beyond tab-switch).
- ❌ Mouse-movement / keystroke patterns.
- ❌ Device fingerprint (canvas, fonts, webgl).
- ❌ Cross-tab session identity.
- ❌ Login state (the product has no login).
- ❌ Geographic IP-to-location lookup (we only hash the IP).
- ❌ Reading speed inference.

---

## Aggregation cadence

- **Real-time**: events stream into Turso `news_ai_feedback.db`.
- **Hourly :15**: chitti-founder escalator job aggregates per-card vote ratios; any card with > 10 downvotes and < 2 upvotes in 24h gets auto-flagged for human review.
- **Daily 07:00 IST**: founder digest assembles top-10 cards + bottom-10 cards + per-source health + language gaps.
- **Weekly Sun 08:00 IST**: trend report — week-over-week changes in vote ratios, ingestion success, language coverage.

---

## Where the dashboard lives

- Production: chitti-founder Railway service, `chitti-founder.up.railway.app/dashboard/news-ai`.
- Source: [`chitti-founder/backend/main.py`](../../chitti-founder/backend/main.py).
- Schema: `news_ai_metrics.db` (Turso, Mumbai region).

---

## CI checks

- `test_feedback_endpoint_anonymises_ip` — assert `ip_hash` is sha256 of (client_ip + daily_salt), not raw IP.
- `test_no_user_agent_in_persistence` — fuzz with planted UAs; assert none in DB.
- `test_pii_drop_counter_increments` — see [`../guardrails/privacy.md`](../guardrails/privacy.md) Principle 3.

---

Last reviewed: 2026-06-06
