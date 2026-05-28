# Chitti Sales — HTTP API (Proposal)

**Status: proposal.** No backend code exists yet. The endpoint surface below mirrors [chitti-ca/API.md](../chitti-ca/API.md) and [chitti-legal/API.md](../chitti-legal/API.md) so the three coaching Chittis share a single audit-friendly shape.

Base URL (production, proposed): `https://chitti-sales-api-production.up.railway.app`
Base URL (local, proposed): `http://localhost:8003`

All endpoints return JSON. CORS will be enabled for the origins listed in the `ALLOWED_ORIGINS` env var (defaults include `https://sahayai.in`, `https://www.sahayai.in`, and `localhost:5500`).

---

## App-level routes (proposed)

Will be defined in `backend/main.py`.

### `GET /`

Service banner.

**Response 200**

```json
{
  "name": "chitti-sales",
  "version": "0.1-docs-only",
  "deepseek_configured": false,
  "endpoints": ["GET /", "GET /health", "GET /api/sales/health", "POST /api/sales/ask"]
}
```

### `GET /health`

Liveness probe.

**Response 200**

```json
{ "ok": true }
```

---

## Blueprint routes (`/api/sales/*`, proposed)

Will be defined in `backend/routes/sales.py`.

### `GET /api/sales/health`

Service-level health that also reports whether the upstream DeepSeek key is configured.

**Response 200**

```json
{
  "ok": true,
  "service": "sales",
  "deepseek_configured": true,
  "model": "deepseek-chat",
  "disclaimer": "This is sales coaching from distilled books, not a guarantee. Your results depend on your product, price, market, and effort."
}
```

The `disclaimer` field is the canonical string the server will enforce on every `/ask` reply — clients can render it ahead of time as a banner.

### `POST /api/sales/ask`

Ask Chitti Sales a coaching question.

**Request body**

```json
{
  "text": "Mere paas customers aate hain lekin wapas nahi aate. Kya karoon?",
  "language": "hi",
  "topic": "customer_retention"
}
```

| Field      | Type   | Required | Notes                                                                                          |
| ---------- | ------ | -------- | ---------------------------------------------------------------------------------------------- |
| `text`     | string | **yes**  | The user's question. 1 to 4000 characters after trimming.                                       |
| `language` | string | no       | One of `en, hi, ta, te, bn, mr, gu, kn, ml, or, pa, ur`. Defaults to `en`. Unknown values pass through verbatim. |
| `topic`    | string | no       | One of `lead, follow_up, pricing, objection, referral, cold_call, customer_retention, upsell`. Free-text hint also accepted. |

**Response 200 (success — DeepSeek answered)**

```json
{
  "ok": true,
  "source": "deepseek",
  "language": "hi",
  "topic": "customer_retention",
  "reply": "<one-tactic coaching answer>\n\nThis week, try: <one concrete action>.\n\n— Tactic adapted from <Book Title> by <Author>.\n\nThis is sales coaching from distilled books, not a guarantee. Your results depend on your product, price, market, and effort.",
  "model": "deepseek-chat",
  "book_cited": "How to Win Friends and Influence People",
  "tokens": { "input": 312, "output": 188 }
}
```

The `reply` is **guaranteed** to end with the canonical disclaimer string. If the model forgets to include it, the server appends it before sending. See [PROMPTS.md](PROMPTS.md).

`book_cited` is a hint extracted (best-effort) from the reply to enable per-book citation frequency observability. It is not load-bearing — the reply itself already names the source.

**Response 200 (fallback — DeepSeek key missing or upstream failed)**

```json
{
  "ok": true,
  "source": "fallback",
  "language": "hi",
  "reply": "Chitti Sales is offline right now (no DEEPSEEK_API_KEY configured). Your question was: <first 200 chars>\n\nThis is sales coaching from distilled books, not a guarantee. Your results depend on your product, price, market, and effort.",
  "model": null,
  "error": "deepseek_http_500"
}
```

The `error` key is only present when the fallback was triggered by an upstream failure; it is absent when the fallback was triggered because no API key was configured. Either way `ok` is `true` and the reply still carries the disclaimer.

**Response 400 — missing text**

```json
{ "ok": false, "error": "missing_text" }
```

**Response 413 — text too long**

```json
{ "ok": false, "error": "text_too_long", "max_chars": 4000 }
```

---

## Future routes (not in v1)

These are sketched in [TODO.md](TODO.md) and not part of the v1 proposal:

- `POST /api/sales/stt` — proxy to [Chitti Voice Factory](../chitti-voice-factory/) STT.
- `POST /api/sales/tts` — proxy to Voice Factory TTS.
- `POST /api/sales/rehearse` — multi-turn roleplay flow for pitch practice (stateful — would require the schema sketched in [DATABASE.md](DATABASE.md)).

---

## Curl examples (when live)

```bash
# Banner
curl https://chitti-sales-api-production.up.railway.app/

# Health
curl https://chitti-sales-api-production.up.railway.app/api/sales/health

# Ask (Hindi)
curl -X POST https://chitti-sales-api-production.up.railway.app/api/sales/ask \
  -H "Content-Type: application/json" \
  -d '{"text":"Mere paas customers aate hain lekin wapas nahi aate. Kya karoon?","language":"hi","topic":"customer_retention"}'
```
