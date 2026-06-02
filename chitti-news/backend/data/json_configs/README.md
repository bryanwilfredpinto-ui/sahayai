# `json_configs/` — per-source mapping for app-API ingestion

Holds one JSON file per `json+`-prefixed source in
[`sources.json`](../sources.json). Activated by
[`news_ingest._fetch_source_json`](../../services/news_ingest.py).

## When to use this

When a publisher (Eenadu / Daily Thanthi / Sakshi / Sandesh / Divya Bhaskar)
has **no public RSS** but its mobile app pulls articles from a JSON API.
You capture that endpoint with a network proxy
(mitmproxy, Proxyman, Charles), paste the URL into `sources.json` with a
`json+` prefix, and drop a config here that tells the ingester how to map
JSON fields → article fields.

This is the *app-based research* path Sire called out 2026-06-02.

## Schema

Filename: `<source-slug>.json`, where `<source-slug>` matches the `slug`
field of the source row in `sources.json`.

```json
{
  "articles_path": "data.items",
  "title": "headline",
  "link": "url",
  "summary": "subtitle",
  "image": "media.image_url",
  "published": "published_at",
  "headers": {
    "x-api-key": "...",
    "Accept-Language": "te"
  }
}
```

| Field | Meaning |
|---|---|
| `articles_path` | Dot-path into the response JSON to reach the list of articles. Use `""` if the root is already the list. Supports list indexing: `data.items.0.children`. |
| `title` / `link` / `summary` / `image` / `published` | Dot-paths from each article object to the corresponding field. All optional except `title` and `link`. |
| `headers` | Optional HTTP headers — useful for app-specific API keys or `Accept-Language` overrides. |

## sources.json entry shape

```json
{
  "slug": "eenadu-app-te",
  "display_name": "ఈనాడు · Andhra Pradesh",
  "rss_url": "json+https://www.eenadu.net/api/v2/articles?category=ap&page=1",
  "homepage_url": "https://www.eenadu.net",
  "state": "ap",
  "language": "te",
  "category": "state",
  "enabled": 1,
  "note": "App-API capture 2026-06-XX via mitmproxy"
}
```

The `json+` prefix on `rss_url` is the only switch needed — the ingester
strips it before fetching and dispatches through the JSON path.

## How to capture an app-API endpoint

1. Install **mitmproxy** (`pip install mitmproxy`) on your laptop. Or use
   Proxyman / Charles if you prefer a GUI.
2. On your phone, set the WiFi proxy to the laptop's IP + port 8080.
3. Install the mitmproxy CA on the phone
   (`mitm.it` from the phone's browser while connected).
4. Open the target news app and pull-to-refresh the home feed.
5. In mitmproxy, filter by host (e.g. `eenadu.net`). Look for requests with
   `Content-Type: application/json` returning an article list.
6. Copy the full URL (including query string).
7. Paste into `sources.json` with `json+` prefix.
8. Build the config file here using the JSON structure you observed.
9. Commit + push — next deploy will pick it up.

## Verify before commit

```bash
cd chitti-news/backend
python -c "from services.news_ingest import _fetch_source_json
from models.source import Source
src = Source(slug='eenadu-app-te', rss_url='json+https://...',
             display_name='Test', state='ap', language='te',
             category='state', homepage_url='https://www.eenadu.net')
out = _fetch_source_json(src)
print(f'fetched {len(out)} items'); print(out[:2])"
```

A working config returns a list of dicts with `title` and `link` populated.
