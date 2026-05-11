# API — Chitti News

Every HTTP endpoint served by the Chitti News backend. Implemented as a Flask Blueprint in [`routes/news.py`](backend/routes/news.py) (prefix `/api/news`) plus two top-level routes (`/`, `/health`) registered in [`main.py`](backend/main.py).

- **Base URL (planned production):** `https://chitti-news-api.onrender.com`
- **Base URL (local dev):** `http://localhost:8002`
- **Authentication:** none for read paths. Per-device `X-User-Token` header (UUID kept in `localStorage`) for Read Later / Cancelled folder routes.
- **CORS:** allowlist read from `ALLOWED_ORIGINS` (defaults include `sahayai.in` + localhost).

---

## Conventions

| Convention | Detail |
|---|---|
| Method casing | UPPER (`GET`, `POST`, `DELETE`) |
| Content-Type | `application/json` for both request and response |
| Error envelope | `{"error": "<code>", "detail": "<message>"}` |
| Error codes | `bad_request` (400) · `not_found` (404) · `method_not_allowed` (405) · `internal_server_error` (500) |
| Pagination | `limit` query param (1–100, default 30 for `/feed`, 10 for `/breaking`) |
| Case-insensitivity | `state`, `language`, `category` are lowercased server-side |
| Token header | `X-User-Token: <UUID>` — required for `/save*`; must be ≥8 chars |

---

## Top-level (registered in `main.py`)

### `GET /`

Service identity ping.

**Response 200**
```json
{
  "app": "Chitti News API",
  "version": "1.0.0",
  "status": "ok"
}
```

### `GET /health`

Render health-check probe.

**Response 200**
```json
{"ok": true}
```

---

## Feed

### `GET /api/news/feed`

Main feed with query-param filtering.

**Query params**

| Name | Type | Default | Range | Purpose |
|---|---|---|---|---|
| `state` | string | `india` | any registered state slug | filter (state-specific OR national fallback) |
| `language` | string | `en` | `en`, `hi`, `bn`, `te`, `ta`, `mr`, `kn`, `od`, `ml`, `gu`, `pa`, `ur` | exact match |
| `category` | string | `national` | `national`, `state`, `business`, `tech`, `sports`, `entertainment`, `politics`, `science`, `breaking`, `all` | exact match (`all` skips the filter) |
| `limit` | int | `30` | 1–100 | clamp on row count |

**Response 200**
```json
{
  "items": [
    {
      "id": 42,
      "title": "Indian markets close higher amid IT rally",
      "link": "https://...",
      "summary": "Sensex gained 412 points...",
      "source_slug": "moneycontrol",
      "source_name": "Moneycontrol · Markets",
      "image_url": "https://...",
      "state": "india",
      "language": "en",
      "category": "business",
      "is_breaking": false,
      "importance": 6,
      "published_at": "2026-05-08T11:30:00",
      "fetched_at": "2026-05-08T11:35:12"
    }
  ],
  "count": 1,
  "state": "india",
  "language": "en",
  "category": "business",
  "speak_en": "1 business stories from India.",
  "speak_hi": "india से 1 business खबरें।",
  "caption_en": "india · en · business · 1 stories",
  "caption_hi": "india · en · business · 1 खबरें",
  "disclaimer_en": "Chitti News aggregates headlines from public RSS feeds. We do not write the news — we deliver it. Verify with the source link before sharing.",
  "disclaimer_hi": "चिट्टी न्यूज़ सार्वजनिक RSS फ़ीड से शीर्षक एकत्र करता है। हम खबरें नहीं लिखते — हम पहुँचाते हैं। शेयर करने से पहले मूल स्रोत पर पुष्टि करें।"
}
```

**Sort order**
1. `is_breaking DESC`
2. `importance DESC`
3. `published_at DESC`
4. `fetched_at DESC`

### `GET /api/news/<state>/<language>/<category>`

Pretty alias for the feed. Same response shape as `/api/news/feed` but with path-style params.

**Examples**
- `/api/news/india/en/national`
- `/api/news/mh/hi/sports`
- `/api/news/ka/en/business`

**Query params**

| Name | Type | Default | Range |
|---|---|---|---|
| `limit` | int | `30` | 1–100 |

---

## Breaking

### `GET /api/news/breaking`

Active breaking-news alerts. Surfaced as a red dismissable ribbon in the frontend.

**Query params**

| Name | Type | Default |
|---|---|---|
| `state` | string | `india` |
| `language` | string | `en` |

**Response 200**
```json
{
  "items": [
    {
      "id": 7,
      "headline": "RBI cuts repo rate by 25 bps",
      "article_id": 412,
      "sources_count": 5,
      "expires_at": "2026-05-08T16:30:00",
      "created_at": "2026-05-08T12:30:00"
    }
  ],
  "count": 1,
  "state": "india",
  "language": "en"
}
```

Filters: `expires_at > now` AND `state IN (requested_state, "india")` AND `language == requested_language`. Hard limit 10.

---

## Single article

### `GET /api/news/article/<id>`

One article by primary key.

**Response 200** — same row shape as a `feed` item.

**Response 404**
```json
{"error": "not_found", "detail": "article not found"}
```

---

### `GET /api/news/article/<id>/take`

**Chitti's Take** — 3-bullet AI summary.

**Query params**

| Name | Type | Default |
|---|---|---|
| `language` | string | `en` |

**Response 200 (Anthropic path)**
```json
{
  "ok": true,
  "source": "anthropic",
  "bullets": [
    "What happened: ...",
    "Why it matters: ...",
    "What's next: ..."
  ],
  "language": "en",
  "model": "claude-sonnet-4-6"
}
```

**Response 200 (fallback path — `ANTHROPIC_API_KEY` unset or call failed)**
```json
{
  "ok": true,
  "source": "fallback",
  "bullets": ["RSS summary sentence 1", "RSS summary sentence 2", "..."],
  "language": "en",
  "note_en": "Chitti's Take is unavailable (Anthropic key not configured) — showing the source's own summary instead.",
  "note_hi": "चिट्टी की टेक उपलब्ध नहीं (Anthropic कुंजी सेट नहीं) — मूल स्रोत का सारांश दिखा रहा हूँ।"
}
```

**Response 200 (article missing)**
```json
{"ok": false, "error": "article not found"}
```

Implementation: [`services/news_summary.py:chittis_take()`](backend/services/news_summary.py).

---

### `POST /api/news/article/<id>/factcheck`

Cross-source fact-check verdict. Cached 6h in `news.fact_checks`.

**Query params**

| Name | Type | Default | Purpose |
|---|---|---|---|
| `force` | string (`"1"` to enable) | unset | bypass the 6h cache and recompute |

**Response 200**
```json
{
  "ok": true,
  "article_id": 42,
  "verdict": "verified",
  "symbol": "✅",
  "color": "green",
  "confidence": 84,
  "matched_sources": ["hindu-business", "moneycontrol", "ndtv-business"],
  "rationale_en": "3 other trusted sources are running this story; key facts agree.",
  "rationale_hi": "3 अन्य भरोसेमंद स्रोतों ने यही खबर दी है। ज़्यादातर ब्योरे मेल खाते हैं।",
  "checked_at": "2026-05-08T12:45:00",
  "matched_articles": [
    {"id": 41, "title": "...", "source_slug": "...", "source_name": "...", "score": 88, "link": "..."}
  ]
}
```

**Verdict map**

| `verdict` | `symbol` | `color` | Trigger |
|---|---|---|---|
| `verified` | `✅` | `green` | ≥3 distinct other sources matched |
| `partial` | `🟡` | `amber` | 2 other sources matched |
| `disputed` | `⚠️` | `red` | 1 other source matched |
| `unverified` | `❔` | `muted` | 0 other sources matched |

Implementation: [`services/news_factcheck.py:factcheck()`](backend/services/news_factcheck.py).

### `GET /api/news/article/<id>/factcheck`

Idempotent read of the fact-check. Returns cached if present, else recomputes. Same response shape as the POST.

---

## Sources

### `GET /api/news/sources`

Source registry slice, useful for the picker UI and for monitoring `last_error`.

**Query params**

| Name | Type | Default | Purpose |
|---|---|---|---|
| `state` | string | unset (no filter) | exact OR `"india"` match |
| `language` | string | unset (no filter) | exact match |

Only `enabled == 1` sources are returned.

**Response 200**
```json
{
  "items": [
    {
      "slug": "moneycontrol",
      "display_name": "Moneycontrol · Markets",
      "homepage_url": "https://www.moneycontrol.com",
      "state": "india",
      "language": "en",
      "category": "business",
      "last_fetched_at": "2026-05-08T12:00:00",
      "last_error": null
    }
  ],
  "count": 1
}
```

Ordered by `state, language, category, slug`.

---

## Per-device folders

These three endpoints require an `X-User-Token` header (UUID generated client-side, kept in `localStorage`). Token must be ≥8 chars or you get a 400.

### `POST /api/news/save`

Add an article to a folder.

**Request body**
```json
{
  "article_id": 42,
  "folder": "saved",
  "note": "Read on commute"
}
```

| Field | Required | Allowed values |
|---|---|---|
| `article_id` | yes (int) | must reference an existing `news.articles.id` |
| `folder` | optional | `saved` (default) or `cancelled` |
| `note` | optional | string, clamped to 240 chars |

**Upsert** by `(token, article_id, folder)` — re-posting refreshes `added_at` and overwrites `note`.

**Response 200**
```json
{"ok": true, "folder": "saved", "article_id": 42}
```

**Errors**
- 400 — missing token / wrong type / bad folder.
- 404 — article not found.

### `GET /api/news/save`

List a folder's contents.

**Query params**

| Name | Default | Allowed |
|---|---|---|
| `folder` | `saved` | `saved`, `cancelled` |

**Response 200**
```json
{
  "items": [
    {
      "entry_id": 17,
      "added_at": "2026-05-08T12:00:00",
      "note": "Read on commute",
      "article": {
        "id": 42, "title": "...", "link": "...", "summary": "...",
        "source_name": "...", "source_slug": "...", "image_url": "...",
        "category": "business", "language": "en", "state": "india",
        "published_at": "2026-05-08T11:30:00"
      }
    }
  ],
  "count": 1,
  "folder": "saved"
}
```

Limit 200 rows, ordered by `added_at DESC`.

### `DELETE /api/news/save/<entry_id>`

Remove one entry from a folder. Scoped by `X-User-Token` — you can only delete your own entries.

**Response 200**
```json
{"ok": true}
```

**404** if entry not found or owned by a different token.

---

## Scheduler diagnostics

### `GET /api/news/scheduler/status`

Returns the live scheduler state. Useful for "is the poller alive?" health checks.

**Response 200 (scheduler running)**
```json
{
  "running": true,
  "tz": "Asia/Kolkata",
  "jobs": [
    {"id": "rss_poll",      "next_run": "2026-05-08T13:00:00+05:30", "trigger": "interval[0:30:00]"},
    {"id": "daily_breaking","next_run": "2026-05-09T06:00:00+05:30", "trigger": "cron[hour='6', minute='0']"}
  ]
}
```

**Response 200 (scheduler disabled or not yet started)**
```json
{"running": false, "jobs": []}
```

### `POST /api/news/scheduler/trigger/<job_id>`

Force-run a scheduler job synchronously. Light auth via `X-User-Token` (any valid token ≥8 chars — not user-scoped).

**Path params**
- `job_id` — `rss_poll` or `daily_breaking`.

**Response 200 (success)**
```json
{"ok": true, "job_id": "rss_poll"}
```

**Response 200 (scheduler not running)**
```json
{"ok": false, "error": "scheduler not running"}
```

**Response 200 (unknown job)**
```json
{"ok": false, "error": "unknown job: foo"}
```

Note: even on error this endpoint returns HTTP 200 — the JSON body's `ok` flag is the signal.

---

## Endpoint summary table

| Method | Path | Purpose | Auth |
|---|---|---|---|
| `GET` | `/` | service identity | none |
| `GET` | `/health` | Render probe | none |
| `GET` | `/api/news/feed` | filtered feed | none |
| `GET` | `/api/news/<state>/<language>/<category>` | pretty-URL feed | none |
| `GET` | `/api/news/breaking` | breaking-news ribbon | none |
| `GET` | `/api/news/article/<id>` | one article | none |
| `GET` | `/api/news/article/<id>/take` | Chitti's Take | none |
| `POST` | `/api/news/article/<id>/factcheck` | fact-check (may recompute) | none |
| `GET` | `/api/news/article/<id>/factcheck` | cached fact-check | none |
| `GET` | `/api/news/sources` | source registry | none |
| `POST` | `/api/news/save` | add to folder | `X-User-Token` |
| `GET` | `/api/news/save` | list folder | `X-User-Token` |
| `DELETE` | `/api/news/save/<entry_id>` | remove from folder | `X-User-Token` |
| `GET` | `/api/news/scheduler/status` | scheduler state | none |
| `POST` | `/api/news/scheduler/trigger/<job_id>` | force-run job | `X-User-Token` |
