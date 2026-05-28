# Chitti News AI — API

Base: `https://chitti-news-ai-api.onrender.com`

All responses include `disclaimer` (server-enforced). Endpoints not yet
implemented return **HTTP 501** with a structured COMING SOON payload —
matches the §3 "Honest stubs over fake demos" rule.

## `GET /health` — LIVE

Self-ping target. Returns:

```json
{
  "ok": true,
  "service": "chitti-news-ai-api",
  "version": "0.1.0",
  "chitti_slug": "chitti-news-ai",
  "now_utc": "2026-05-14T08:00:00Z",
  "sources_active": 17,
  "sources_pending_verification": 0,
  "scheduler_enabled": true,
  "rss_poll_minutes": 360
}
```

## `GET /api/news-ai/languages` — LIVE

Returns the 26-language list. `default` is **always `null`** — the user
must pick.

## `GET /api/news-ai/disclaimer` — LIVE

Server-enforced disclaimer text. The frontend renders this; never inlines.

## `GET /api/news-ai/today` — COMING SOON

Daily AI briefing, top stories with importance ≥ 75.

```json
{
  "ok": true,
  "language": "ta",
  "items": [
    {
      "headline": "...",
      "summary": "...",
      "importance": 92,
      "trust_score": 88,
      "source_url": "...",
      "source_name": "..."
    }
  ],
  "disclaimer": "..."
}
```

## `GET /api/news-ai/launches` — COMING SOON

New tools / models from the last 7 days.

## `POST /api/news-ai/tools-for-me` — COMING SOON

Profession → ranked tools. `language` is **required** (400 otherwise).

```json
POST /api/news-ai/tools-for-me
{
  "profession": "I am a teacher in a Tamil-medium school.",
  "language": "ta"
}
```

Returns ranked list (top 5–10) with relevance / community / freshness /
free-tier breakdown.

## `GET /api/news-ai/free-tier-tracker` — COMING SOON

Tools whose free tier changed in the last 30 days.

## `POST /api/news-ai/trust-check` — COMING SOON

Run the 4-layer trust verification on a URL.

```json
POST /api/news-ai/trust-check
{ "url": "https://example.com/article", "language": "ta" }
```

## `GET /api/news-ai/sources` — COMING SOON

All approved sources + their trust scores. Public — no auth.

## `POST /api/news-ai/sources/submit` — COMING SOON

Community source submission. Lands in `discovery_queue` with
`status=pending_layer_1`.

```json
POST /api/news-ai/sources/submit
{
  "url": "https://example.com/feed",
  "submitter_handle": "optional",
  "language": "ta",
  "one_line": "Why this source matters."
}
```

## `GET /api/news-ai/leaderboard` — COMING SOON

Top tools by importance × community signal. Filterable by task (writing /
code / image / video / voice / data) via `?task=`.

## `GET /api/news-ai/models` — COMING SOON

Model tracker — LLM / SLM / vision / audio. Filterable by `?kind=`,
`?free=true`, `?vendor=`.

## Errors

All errors return JSON:

```json
{
  "ok": false,
  "error": "language_required",
  "message": "Chitti News AI has no default language. Pass `language`."
}
```

| HTTP | When |
|---|---|
| `400` | Missing required field (e.g. `language`) |
| `404` | Unknown source / tool / article ID |
| `429` | Rate-limit (per-IP, see Railway limits) |
| `501` | Endpoint not yet implemented — honest COMING SOON payload |
| `5xx` | Backend error — Layer 5 fallback may have engaged |
