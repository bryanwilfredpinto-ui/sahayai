# API — Chitti Legal

Base URL (prod): `https://chitti-legal-api.up.railway.app`
Base URL (local): `http://localhost:8002`

All routes live in [main.py](backend/main.py) (`/`, `/health`) and [routes/legal.py](backend/routes/legal.py) (`/api/legal/*`).

CORS allowlist comes from the `ALLOWED_ORIGINS` env var ([config.py](backend/config.py)).

---

## `GET /`

Service banner. Defined in [main.py](backend/main.py).

**Request:** no body.

**Response 200:**

```json
{
  "name": "chitti-legal",
  "version": "1.0",
  "deepseek_configured": true,
  "endpoints": [
    "GET /",
    "GET /health",
    "GET /api/legal/health",
    "POST /api/legal/explain"
  ]
}
```

`deepseek_configured` is `bool(DEEPSEEK_API_KEY)`.

---

## `GET /health`

Liveness probe used by Render. Defined in [main.py](backend/main.py).

**Response 200:**

```json
{ "ok": true }
```

Always 200 as long as the process is up. Does **not** call DeepSeek.

---

## `GET /api/legal/health`

Service-level health with model info. Defined in [routes/legal.py](backend/routes/legal.py), delegates to `legal_service.health()`.

**Response 200:**

```json
{
  "ok": true,
  "service": "legal",
  "deepseek_configured": true,
  "model": "deepseek-chat",
  "disclaimer": "AI explanation only. Not a substitute for a licensed lawyer. Consult a lawyer before signing or replying."
}
```

The `disclaimer` field is the canonical string; frontends can use it for verification.

---

## `POST /api/legal/explain`

The one endpoint that matters. Defined in [routes/legal.py](backend/routes/legal.py), delegates to `legal_service.explain()`.

**Request body (JSON):**

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `text` | string | yes | — | The clause / notice / contract to explain. 1–8000 chars after `strip()`. |
| `language` | string | no | `"en"` | One of `en, hi, ta, te, bn, mr, gu, kn, ml, or, pa, ur`. Unknown codes are echoed to the model verbatim. |
| `doc_type` | string | no | `null` | Free-form hint, e.g. `"rent agreement"`, `"FIR copy"`, `"NDA"`. The 8 chips in [chitti_legal.html](../chitti_legal.html) define the common ones. |

**Example request:**

```json
{
  "text": "The Tenant shall not assign or sublet the Premises without the prior written consent of the Landlord.",
  "language": "hi",
  "doc_type": "rent agreement"
}
```

**Response 200 (DeepSeek path):**

```json
{
  "ok": true,
  "source": "deepseek",
  "language": "hi",
  "reply": "<plain-language explanation, ending with the disclaimer>",
  "model": "deepseek-chat",
  "tokens": { "input": 312, "output": 247 }
}
```

**Response 200 (fallback path — no key, or upstream failure):**

```json
{
  "ok": true,
  "source": "fallback",
  "language": "hi",
  "reply": "Chitti Legal is offline right now (no DEEPSEEK_API_KEY configured). What you pasted: ...\n\nAI explanation only. Not a substitute for a licensed lawyer. Consult a lawyer before signing or replying.",
  "model": null,
  "error": "deepseek_http_502"
}
```

The `error` field is present only when the fallback was triggered by an actual upstream failure; the pure no-key fallback omits it.

**Response 400 — missing text:**

```json
{ "ok": false, "error": "missing_text" }
```

Returned when `text` is empty or whitespace-only after `strip()`.

**Response 413 — text too long:**

```json
{ "ok": false, "error": "text_too_long", "max_chars": 8000 }
```

Returned when `len(text) > 8000`.

**Invariants:**

- Every successful response has `ok: true` and a `reply` string that contains the literal disclaimer line at the end (enforced by `_enforce_disclaimer()` in [services/legal_service.py](backend/services/legal_service.py)).
- `source` is always one of `"deepseek"` or `"fallback"`.
- `model` is the DeepSeek model string on the happy path, `null` on the fallback path.
- `tokens` is present only on the DeepSeek path.
