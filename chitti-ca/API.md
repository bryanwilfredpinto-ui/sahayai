# Chitti CA — HTTP API

Base URL (production): `https://chitti-ca-api.onrender.com`
Base URL (local): `http://localhost:8001`

All endpoints return JSON. CORS is enabled for the origins listed in the `ALLOWED_ORIGINS` env var (defaults include `https://sahayai.in`, `https://www.sahayai.in`, and `localhost:5500`).

---

## App-level routes

Defined in [backend/main.py](backend/main.py).

### `GET /`

Service banner. Useful for a quick "is this thing up and what does it expose?" check.

**Response 200**

```json
{
  "name": "chitti-ca",
  "version": "1.0",
  "deepseek_configured": true,
  "endpoints": ["GET /", "GET /health", "GET /api/ca/health", "POST /api/ca/ask"]
}
```

### `GET /health`

Liveness probe. Always returns 200 if the Flask process is up.

**Response 200**

```json
{ "ok": true }
```

---

## Blueprint routes (`/api/ca/*`)

Defined in [backend/routes/ca.py](backend/routes/ca.py).

### `GET /api/ca/health`

Service-level health that also reports whether the upstream DeepSeek key is configured.

**Response 200**

```json
{
  "ok": true,
  "service": "ca",
  "deepseek_configured": true,
  "model": "deepseek-chat",
  "disclaimer": "This is AI-generated guidance. Consult a registered CA for your actual filings."
}
```

The `disclaimer` field is the canonical string the server enforces on every `/ask` reply — clients can render it ahead of time as a banner if they wish.

### `POST /api/ca/ask`

Ask Chitti CA a tax question.

**Request body**

```json
{
  "text": "मैं फ्रीलांसर हूँ — मेरी आय 8 लाख है — कौन सा ITR भरूँ?",
  "language": "hi",
  "topic": "ITR filing"
}
```

| Field      | Type   | Required | Notes                                                                                          |
| ---------- | ------ | -------- | ---------------------------------------------------------------------------------------------- |
| `text`     | string | **yes**  | The user's question. 1 to 4000 characters after trimming.                                       |
| `language` | string | no       | One of `en, hi, ta, te, bn, mr, gu, kn, ml, or, pa, ur`. Defaults to `en`. Unknown values pass through verbatim. |
| `topic`    | string | no       | Free-text hint (e.g. `"GST"`, `"TDS"`, `"reading a tax notice"`). Used as a topic hint in the user message. |

**Response 200 (success — DeepSeek answered)**

```json
{
  "ok": true,
  "source": "deepseek",
  "language": "hi",
  "reply": "<plain-language answer>\n\nThis is AI-generated guidance. Consult a registered CA for your actual filings.",
  "model": "deepseek-chat",
  "tokens": { "input": 312, "output": 188 }
}
```

The `reply` is **guaranteed** to end with the canonical disclaimer string. If the model forgets to include it, the server appends it before sending. See [PROMPTS.md](PROMPTS.md).

**Response 200 (fallback — DeepSeek key missing or upstream failed)**

```json
{
  "ok": true,
  "source": "fallback",
  "language": "hi",
  "reply": "Chitti CA is offline right now (no DEEPSEEK_API_KEY configured). Your question was: <first 200 chars>\n\nThis is AI-generated guidance. Consult a registered CA for your actual filings.",
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

## Curl examples

```bash
# Banner
curl https://chitti-ca-api.onrender.com/

# Health
curl https://chitti-ca-api.onrender.com/api/ca/health

# Ask (Hindi)
curl -X POST https://chitti-ca-api.onrender.com/api/ca/ask \
  -H "Content-Type: application/json" \
  -d '{"text":"मैं फ्रीलांसर हूँ — मेरी आय 8 लाख है — कौन सा ITR भरूँ?","language":"hi","topic":"ITR filing"}'
```
