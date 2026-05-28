# Chitti UPI Fraud Guard — HTTP API

Base URL (planned prod): `https://chitti-upi-api-production.up.railway.app`
Local dev: `http://127.0.0.1:8004`

All endpoints return JSON. No authentication. CORS in prod is locked to
`https://sahayai.in` + `https://www.sahayai.in` via the `ALLOWED_ORIGINS`
env var.

---

## 1. App-level routes (defined in [`backend/main.py`](./backend/main.py))

### `GET /`

Service banner — used to confirm the build is up.

**Response 200**
```json
{
  "app": "Chitti UPI Fraud Guard API",
  "version": "1.0.0",
  "status": "ok"
}
```

---

### `GET /health`

Liveness probe. Always returns 200 if the Flask process is up; does **not**
verify DeepSeek connectivity (use `GET /api/upi/health` for that).

**Response 200**
```json
{ "ok": true }
```

---

### Global error envelopes

Handlers are registered in `main.py` for these HTTP statuses:

| Status | `error` code              | When                                                        |
|--------|---------------------------|-------------------------------------------------------------|
| 400    | `bad_request`             | Missing / invalid body (e.g. `text` empty)                  |
| 404    | `not_found`               | Unknown route                                               |
| 405    | `method_not_allowed`      | Wrong verb (e.g. GET on `/api/upi/check`)                   |
| 413    | `payload_too_large`       | Body > 1 MB or `text` > 4000 chars                          |
| 500    | `internal_server_error`   | Unhandled exception (logged, opaque detail to caller)       |

**Example 400**
```json
{ "error": "bad_request", "detail": "text is required" }
```

---

## 2. Blueprint `/api/upi/*` (defined in [`backend/routes/upi.py`](./backend/routes/upi.py))

### `POST /api/upi/check`

Classify a piece of free-text (SMS body, WhatsApp message, "what the
caller told me", dictated speech, merchant prompt) into HIGH / MEDIUM /
LOW fraud risk.

**Request body (JSON)**

| Field       | Type   | Required | Default | Notes                                                                            |
|-------------|--------|----------|---------|----------------------------------------------------------------------------------|
| `text`      | string | yes      | —       | The suspicious text to classify. Trimmed. Max 4000 chars (else 413).             |
| `language`  | string | no       | `"hi"`  | Lowercased ISO code. Recognised: `hi`, `en`, `ta`, `te`, `bn`, `mr`, `gu`, `kn`, `ml`. Anything else falls back to Hindi. |

**Example request**
```http
POST /api/upi/check
Content-Type: application/json

{
  "text": "Dear customer, your SBI YONO account will be blocked at 6pm. Update KYC at http://sbi-update-secure.in/kyc — call 9XXXXXXXXX",
  "language": "hi"
}
```

**Response 200 — DeepSeek path**
```json
{
  "ok": true,
  "source": "deepseek",
  "language": "hi",
  "model": "deepseek-chat",
  "risk": "HIGH",
  "reason": "Phishing — fake SBI KYC update link with non-bank domain.",
  "warning": "Ruko! Yeh fraud ho sakta hai. Link mat kholo, paisa mat bhejo.",
  "indicators": [
    "Suspicious domain (sbi-update-secure.in is NOT a bank domain)",
    "Urgency tactic — account will be blocked",
    "Asks user to dial unknown number"
  ],
  "actions": [
    "Do NOT click the link.",
    "Call your bank only on the number printed on the back of your card.",
    "Forward this SMS to 1909 (DoT)."
  ],
  "legal_lines": [
    "Fraud hone par turant 1930 pe call karo ya cybercrime.gov.in pe report karo.",
    "Chitti ek AI warning tool hai — yeh payment block nahi kar sakta."
  ],
  "tokens": { "input": 312, "output": 188 }
}
```

**Response 200 — fallback path (DeepSeek unreachable or key missing)**
```json
{
  "ok": true,
  "source": "fallback",
  "language": "hi",
  "risk": "MEDIUM",
  "reason": "AI offline — defaulting to caution. Confirm with merchant.",
  "warning": "Dhyaan se! Chitti AI offline hai. Khud merchant se confirm karo.",
  "indicators": ["AI service unreachable"],
  "actions": [
    "Call the merchant on a number you already trust.",
    "Do NOT click any link in the SMS / WhatsApp."
  ],
  "legal_lines": [
    "Fraud hone par turant 1930 pe call karo ya cybercrime.gov.in pe report karo.",
    "Chitti ek AI warning tool hai — yeh payment block nahi kar sakta."
  ],
  "error": "deepseek_http_502"
}
```

**Field guarantees (enforced by `_normalise()` in `services/upi_service.py`)**

| Field         | Type                       | Constraint                                                           |
|---------------|----------------------------|----------------------------------------------------------------------|
| `risk`        | `"HIGH"|"MEDIUM"|"LOW"`    | Unknown / missing → coerced to `"MEDIUM"` (never `"LOW"`).            |
| `reason`      | string                     | Trimmed, max 240 chars. Default: "Could not classify cleanly ...".    |
| `warning`     | string                     | Trimmed, max 300 chars. Default per-risk Hinglish line.               |
| `indicators`  | string[]                   | ≤ 6 items, each ≤ 120 chars. Non-list coerced to `[str(value)]`.      |
| `actions`     | string[]                   | ≤ 5 items, each ≤ 160 chars. Non-list coerced to `[str(value)]`.      |
| `legal_lines` | string[2]                  | Always exactly the two `LEGAL_LINES` constants.                       |
| `source`      | `"deepseek"|"fallback"`    | Diagnostic; frontend may colour the verdict differently if `fallback`. |
| `tokens`      | `{input, output}` (DeepSeek path only) | From DeepSeek `usage` block. Absent in fallback.          |

**Response errors**

| Status | Body                                                                  | Cause                  |
|--------|-----------------------------------------------------------------------|------------------------|
| 400    | `{"error":"bad_request","detail":"text is required"}`                 | `text` empty / missing |
| 413    | `{"error":"payload_too_large","detail":"text too long (max 4000 chars)"}` | `len(text) > 4000`  |
| 500    | `{"error":"internal_server_error","detail":"see server logs"}`        | Unhandled exception    |

---

### `GET /api/upi/rules`

Static educational cards — the RBI 2026 framework. Used by the frontend to
render the 4-card grid below the verdict band. Stable, no LLM call.

**Response 200**
```json
{
  "ok": true,
  "items": [
    {
      "key": "2fa",
      "icon": "...",
      "title_en": "Two-factor authentication",
      "title_hi": "...",
      "body_en":  "Every UPI debit needs PIN + device. No PIN, no payment.",
      "body_hi":  "...",
      "speak_hi": "..."
    },
    { "key": "1hr_lag",       "...": "1-hour cooling lag (new payee)" },
    { "key": "trusted_person","...": "Trusted Person" },
    { "key": "kill_switch",   "...": "Kill Switch" }
  ]
}
```

Each item has `key`, `icon`, `title_en`, `title_hi`, `body_en`, `body_hi`,
`speak_hi`. (Non-Hindi `speak_xx` / `title_xx` / `body_xx` are P1 work —
see `TODO.md`.)

---

### `GET /api/upi/health`

Diagnostic — does the server have a DeepSeek key, and which model is it
configured for? Safe to expose; does **not** call DeepSeek.

**Response 200**
```json
{
  "ok": true,
  "service": "upi_fraud_guard",
  "deepseek_configured": true,
  "model": "deepseek-chat"
}
```

---

## 3. Summary table

| Method | Path                  | Defined in                          | Auth | Calls LLM? |
|--------|-----------------------|-------------------------------------|------|------------|
| GET    | `/`                   | `main.py`                           | no   | no         |
| GET    | `/health`             | `main.py`                           | no   | no         |
| POST   | `/api/upi/check`      | `routes/upi.py` → `upi_service.check` | no | yes (DeepSeek, with fallback) |
| GET    | `/api/upi/rules`      | `routes/upi.py` → `upi_service.rbi_2026_rules` | no | no |
| GET    | `/api/upi/health`     | `routes/upi.py` → `upi_service.health` | no | no    |
