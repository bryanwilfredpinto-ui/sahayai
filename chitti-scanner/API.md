# API — Chitti Product Scanner

Base URL (planned): `https://chitti-scanner-api.onrender.com`
Local dev: `http://127.0.0.1:8005`

All endpoints return `application/json`. CORS is locked to `ALLOWED_ORIGINS` (CSV env var, default `*` for local).

## Index

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET`  | [`/`](#get-) | none | Service banner |
| `GET`  | [`/health`](#get-health) | none | Liveness |
| `POST` | [`/api/scanner/analyze`](#post-apiscanneranalyze) | none | Multipart **image** OR JSON `{text, language?}` |
| `POST` | [`/api/scanner/analyze/text`](#post-apiscanneranalyzetext) | none | JSON-only convenience |
| `GET`  | [`/api/scanner/health`](#get-apiscannerhealth) | none | DeepSeek + vision-model status |

---

## `GET /`

**Service banner.** Used for smoke tests.

### Response — `200 OK`

```json
{
  "app": "Chitti Product Scanner API",
  "version": "1.0.0",
  "status": "ok"
}
```

---

## `GET /health`

**Liveness ping** — does not touch DeepSeek.

### Response — `200 OK`

```json
{ "ok": true }
```

---

## `POST /api/scanner/analyze`

**The main entrypoint.** Branches at runtime:

- If the request is `multipart/form-data` and contains a file field named `image`, the image branch fires.
- Otherwise the body is parsed as JSON and treated as the text branch.

Returning the same response shape from both branches lets the frontend stay simple.

### Request — image branch

| Part | Type | Required | Notes |
|---|---|---|---|
| `image` | File (`image/jpeg`, `image/png`, `image/webp`) | yes | Max 8 MB. Anything outside `image/*` returns HTTP 415. |
| `language` | string | no | One of `hi en ta te bn mr gu kn ml`. Default `hi`. Lowercased + trimmed server-side. |

Example `curl`:

```bash
curl -X POST https://chitti-scanner-api.onrender.com/api/scanner/analyze \
  -F "image=@crocin.jpg;type=image/jpeg" \
  -F "language=hi"
```

### Request — text branch

`Content-Type: application/json`

| Field | Type | Required | Notes |
|---|---|---|---|
| `text` | string | yes | The label / bill / doc text. Max 6000 chars; HTTP 413 if exceeded. |
| `language` | string | no | Same set as above. Default `hi`. |

Example:

```bash
curl -X POST https://chitti-scanner-api.onrender.com/api/scanner/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"Crocin Advance 500mg, Paracetamol IP 500mg, Mfg Aug 2025, Exp Jul 2027, MRP Rs 35", "language":"hi"}'
```

### Response — `200 OK` (canonical shape)

```json
{
  "ok": true,
  "source": "deepseek",
  "language": "hi",
  "model": "deepseek-chat",
  "tokens": { "input": 312, "output": 184 },
  "type": "medicine",
  "summary": "Crocin Advance 500mg — paracetamol; expiry Jul 2027; safe; MRP Rs 35.",
  "facts": {
    "brand": "Crocin Advance",
    "composition": "Paracetamol IP 500mg",
    "mfg": "Aug 2025",
    "expiry": "Jul 2027",
    "mrp": "35"
  },
  "key_findings": [
    "Paracetamol IP 500mg — fever / pain relief, very common.",
    "Expiry comfortably far (Jul 2027)."
  ],
  "warnings": [
    "Maximum 4 tablets in 24 hours, never on empty stomach."
  ],
  "savings": [
    "Jan Aushadhi paracetamol 500mg sells for ~Rs 8 for 10 tablets."
  ],
  "speak_hi": "Crocin Advance paracetamol hai. Expiry Jul 2027. Doctor se confirm zaroor karein.",
  "speak_en": "Crocin Advance is paracetamol. Expiry Jul 2027. Please confirm with a doctor.",
  "legal_disclaimer": "Yeh sirf label ki information hai. Doctor se confirm karo pehle.",
  "cross_links": [
    {
      "product": "medupi",
      "label_en": "Find Jan-Aushadhi alternative",
      "label_hi": "जन-औषधि विकल्प देखें",
      "kind": "medupi_lookup",
      "query": "Crocin Advance"
    }
  ]
}
```

### Field reference

| Field | Type | Meaning |
|---|---|---|
| `ok` | bool | Always `true` on a 200; non-2xx returns the error envelope below |
| `source` | string | `deepseek`, `deepseek_vision`, `fallback`, or `fallback_no_vision` |
| `language` | string | Echo of the user's chosen language |
| `model` | string | DeepSeek model id used (omitted in fallback) |
| `tokens` | object | `{input, output}` from DeepSeek `usage` (omitted in fallback) |
| `type` | enum | One of `food`, `medicine`, `legal_doc`, `bill`, `mrp`, `insurance`, `other`. Anything else is coerced to `other` server-side. |
| `summary` | string | One Hinglish line, max 240 chars |
| `facts` | object | Free-form key→value pairs; each value capped at 200 chars |
| `key_findings` | string[] | Max 4 items, each max 200 chars |
| `warnings` | string[] | Max 3 items, each max 200 chars |
| `warnings`'s UI | n/a | Frontend renders these in a red box |
| `savings` | string[] | Max 2 items, each max 200 chars |
| `speak_hi` | string | Hindi read-aloud line, max 300 chars |
| `speak_en` | string | English read-aloud line, max 300 chars |
| `legal_disclaimer` | string | Server-set from `LEGAL_BY_TYPE[type]`; the model cannot override |
| `cross_links` | object[] | Per-type hand-off — see below |

### Cross-link object

| Field | Type | Notes |
|---|---|---|
| `product` | string | `medupi` / `consumer_helpline` / `upi_guard` / `vaani` |
| `label_en` | string | Button label in English (with emoji) |
| `label_hi` | string | Button label in Hindi (with emoji) |
| `kind` | enum | `medupi_lookup` / `tel` / `upi_check` / `vaani_read` |
| `query` | string | Pre-filled hand-off payload — brand/molecule, phone number, or summary |

### Response — error envelope (4xx / 5xx)

```json
{ "error": "bad_request", "detail": "text is required" }
```

| Status | `error` | Trigger |
|---|---|---|
| 400 | `bad_request` | Empty image, empty text, missing both fields |
| 404 | `not_found` | Unknown route |
| 405 | `method_not_allowed` | Wrong HTTP verb |
| 413 | `payload_too_large` | Image > 8 MB or text > 6000 chars |
| 415 | `unsupported_media_type` | Non-image content type on the image field |
| 500 | `internal_server_error` | Caught by global handler; details logged server-side, body says `see server logs` |

### Fallback envelope (still HTTP 200)

When `DEEPSEEK_API_KEY` is unset or DeepSeek is unreachable:

```json
{
  "ok": true,
  "source": "fallback",
  "language": "hi",
  "type": "other",
  "summary": "AI offline — could not analyse this label right now.",
  "facts": {},
  "key_findings": ["AI service unreachable. Please retry, or read the label yourself."],
  "warnings": [],
  "savings": [],
  "speak_hi": "चिट्टी अभी ऑफलाइन है। कुछ देर बाद कोशिश कीजिए।",
  "speak_en": "Chitti is offline right now. Please try again in a moment.",
  "legal_disclaimer": "Yeh AI ki madad hai. Doctor ya lawyer se confirm zaroor karo.",
  "cross_links": [],
  "error": "deepseek_http_429"
}
```

---

## `POST /api/scanner/analyze/text`

JSON-only convenience path with the same request/response shape as the text branch of `/api/scanner/analyze`. Use this when you know there is no image — saves the multipart sniff.

### Request

```json
{ "text": "...", "language": "hi" }
```

### Response

Same as `POST /api/scanner/analyze` text branch.

---

## `GET /api/scanner/health`

DeepSeek + vision diagnostic. Used by the founder dashboard.

### Response — `200 OK`

```json
{
  "ok": true,
  "service": "scanner",
  "deepseek_configured": true,
  "model": "deepseek-chat",
  "vision_model": "off",
  "medupi_api_base": "https://chitti-medupi-api-production.up.railway.app"
}
```

| Field | Meaning |
|---|---|
| `deepseek_configured` | `true` if `DEEPSEEK_API_KEY` is non-empty |
| `model` | Configured chat model |
| `vision_model` | `off` means the image branch will return `fallback_no_vision` |
| `medupi_api_base` | Echoed for cross-product debugging; the frontend reads this independently |

---

## Caveats

- The image branch currently returns `fallback_no_vision` in production because `DEEPSEEK_VISION_MODEL="off"`. Flip this in the Render env once a vision endpoint is live.
- All response strings are trimmed and length-capped server-side in `_normalise()` — never assume the model's raw output reaches the client.
- The `legal_disclaimer` is **not** taken from the model output; it is set from `LEGAL_BY_TYPE[type]` after `type` validation. This is deliberate.
