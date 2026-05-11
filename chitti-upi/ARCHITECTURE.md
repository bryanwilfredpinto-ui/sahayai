# Chitti UPI Fraud Guard — Architecture

## 1. High-level

```
                  ┌──────────────────────────────────┐
                  │   chitti_upi.html  (root)        │
                  │   = chitti-upi/frontend/         │
                  │     index.html (mirror)          │
                  │                                  │
                  │  - Consent gate (localStorage)   │
                  │  - Mic input  (Voice Factory STT)│
                  │  - Sample-card buttons (4 scams) │
                  │  - Verdict band (red/orng/green) │
                  │  - Speech output (Voice Factory) │
                  │  - 4 RBI 2026 rule cards         │
                  └────────────┬─────────────────────┘
                               │ JSON over HTTPS
                               │ CORS: sahayai.in only (prod)
                               ▼
        ┌─────────────────────────────────────────────┐
        │  Flask app  (main.py)                       │
        │  gunicorn  --workers 2  --timeout 60        │
        │                                             │
        │   /                       banner            │
        │   /health                 liveness          │
        │   Blueprint: /api/upi/*                     │
        │      POST /check                            │
        │      GET  /rules                            │
        │      GET  /health                           │
        └───────────────┬─────────────────────────────┘
                        │
                        ▼
        ┌─────────────────────────────────────────────┐
        │  services/upi_service.py                    │
        │                                             │
        │   check(text, language)                     │
        │     ├─ if no DEEPSEEK_API_KEY → _fallback() │
        │     │     returns MEDIUM (never LOW)        │
        │     │                                       │
        │     ├─ httpx.post(DeepSeek)                 │
        │     │     model: deepseek-chat              │
        │     │     response_format: json_object      │
        │     │     temp: 0.2  max_tokens: 500        │
        │     │                                       │
        │     ├─ _safe_parse() — strip ``` fences     │
        │     │                  + regex fallback     │
        │     │                                       │
        │     └─ _normalise() — clamp risk to         │
        │            {HIGH,MEDIUM,LOW}, defaults to   │
        │            MEDIUM if unknown                │
        │                                             │
        │   rbi_2026_rules() — static dict            │
        │   health()         — diagnostic             │
        └─────────────────────────────────────────────┘
                        │
                        ▼
              ┌────────────────────────┐
              │  DeepSeek API          │
              │  api.deepseek.com      │
              │  /chat/completions     │
              └────────────────────────┘
```

## 2. Stack

| Layer        | Choice                       | Why                                                      |
|--------------|------------------------------|----------------------------------------------------------|
| Runtime      | Python 3.11.10 (`runtime.txt`) | Pinned for Render reproducibility                       |
| Framework    | Flask 3.0.3                  | Tiny surface; no template engine needed                  |
| CORS         | flask-cors 4.0.1             | Lock to `sahayai.in` + `www.sahayai.in` in prod          |
| HTTP server  | gunicorn 22.0.0              | 2 workers, 60s timeout — fits Render free plan           |
| LLM client   | httpx 0.27.2                 | Sync; 30s per-call timeout in `upi_service.py`           |
| LLM          | DeepSeek `deepseek-chat`     | Project-wide switch from Anthropic (memory entry)        |
| Persistence  | **none**                     | Stateless by design — see `DATABASE.md`                  |
| Frontend     | Single static HTML           | No build step; mirrored from `../chitti_upi.html`        |

## 3. Request lifecycle — `POST /api/upi/check`

1. **CORS pre-flight.** `flask-cors` answers OPTIONS using the allow-list
   from `ALLOWED_ORIGINS` env (comma-separated). Empty → `*` (dev only).
2. **Body parse.** `request.get_json(silent=True)` → must contain `text`.
   - Missing → `abort(400, "text is required")` → JSON `{error:"bad_request"}`.
   - `len(text) > 4000` → `abort(413, "text too long ...")`.
3. **Language hint.** `language` defaults to `"hi"`. Mapped to a human
   language name via `_LANG_NAMES` (hi/en/ta/te/bn/mr/gu/kn/ml).
4. **Key check.** If `DEEPSEEK_API_KEY` is empty, jump straight to
   `_fallback()` and return a `MEDIUM` "AI offline" verdict.
5. **DeepSeek call.**
   - `messages: [{system: CHITTI_UPI_FRAUD_PROMPT}, {user: ...}]`
   - `response_format: {type: "json_object"}` — forces strict JSON.
   - `temperature: 0.2`, `max_tokens: 500`, `timeout: 30s`.
6. **Safe parse.** `_safe_parse()` strips accidental ``` fences and falls
   back to a regex extraction `\{[\s\S]*\}` if `json.loads` fails.
7. **Normalise.** `_normalise()` enforces:
   - `risk ∈ {HIGH, MEDIUM, LOW}`, else **defaults to MEDIUM** (never LOW).
   - `reason` clamped to 240 chars.
   - `warning` clamped to 300 chars; falls back to a hard-coded
     Hinglish line per risk if model omits it.
   - `indicators[]` ≤ 6, each ≤ 120 chars.
   - `actions[]` ≤ 5, each ≤ 160 chars.
8. **Envelope.** Final dict:
   ```json
   {
     "ok": true,
     "source": "deepseek",
     "language": "hi",
     "model": "deepseek-chat",
     "risk": "HIGH",
     "reason": "...",
     "warning": "...",
     "indicators": [...],
     "actions": [...],
     "legal_lines": ["...1930...", "...warning tool only..."],
     "tokens": {"input": 312, "output": 188}
   }
   ```
9. **Failure modes.**
   - `httpx.HTTPStatusError` → log + `_fallback(error="deepseek_http_<n>")`.
   - `httpx.RequestError | KeyError | ValueError` → log + `_fallback(error=str)`.
   - Any 500 → global error handler returns `{error:"internal_server_error"}`.

## 4. Voice-IO via Voice Factory

The frontend is the voice surface; the backend is text-only.

- **Voice IN.** `chitti_upi.html` uses Web Speech API for dictation
  (microphone button next to the textarea). The transcript is dropped
  into the textarea, then sent to `/api/upi/check` as `text`. No raw
  audio leaves the device.
- **Voice OUT.** After the verdict renders, the frontend speaks, in
  order:
  1. `risk` band label (e.g. "High risk")
  2. `warning` (the model's exact words)
  3. each item of `legal_lines`
- **Language.** The Voice Factory cascade (memory entry _Chitti Voice
  Factory master spec_) picks the supplier for the chosen language.
  Tier-A langs use real TTS; Tier-C langs (Sanskrit, Oraon) currently
  surface "voice unavailable" rather than silently fall back.

## 5. Fallback policy (safety-first)

When DeepSeek is unreachable, `_fallback()` returns:

```json
{
  "risk":   "MEDIUM",
  "reason": "AI offline — defaulting to caution. Confirm with merchant.",
  "warning":"Dhyaan se! Chitti AI offline hai. Khud merchant se confirm karo.",
  "indicators": ["AI service unreachable"],
  "actions": [
    "Call the merchant on a number you already trust.",
    "Do NOT click any link in the SMS / WhatsApp."
  ],
  "source": "fallback",
  "legal_lines": [...]
}
```

`MEDIUM` is chosen deliberately. `LOW` would be a false reassurance — the
PWD user contract forbids that. `HIGH` would be a false alarm — also
forbidden because it trains the user to dismiss alarms.

## 6. Sub-agent skill

`skills/chitti-upi/SKILL.md` (one skill at the moment) wires the product
into the agentic surface. Frontmatter:

- `name: chitti-upi`
- `description: Bharat-themed UPI fraud-risk classifier ... use on
  chitti_upi.html or for any UPI fraud / scam SMS / suspicious caller
  question.`

The skill body documents the repo layout, the endpoint surface, the
consent gate, the cross-product hooks (→ Vaani on HIGH, ← Scanner on
insurance docs), and the live URL plan.

There are **no** sibling sub-skills yet (no `chitti-upi-merchant`,
`chitti-upi-rbi`, etc.). All routing is handled by the one top-level
skill.

## 7. Security posture

- **No PII at rest.** Body is processed and discarded.
- **No payment metadata.** The user never types a VPA or amount in v1
  (they paste the scam **text**, not their own payment).
- **CORS allow-list.** Prod restricts to sahayai.in + www.sahayai.in.
- **Payload cap.** `MAX_CONTENT_LENGTH = 1 MB` at Flask level; `text`
  clamp `4000 chars` at route level.
- **API key.** `DEEPSEEK_API_KEY` is `sync: false` in `render.yaml` —
  must be set in Render dashboard, never committed.
- **No session, no cookie, no auth.** The user is anonymous.

## 8. Deploy

- `render.yaml` is a Render Blueprint, free plan, Python runtime, rootDir
  `backend`.
- `startCommand: gunicorn main:app --bind 0.0.0.0:$PORT --workers 2 --timeout 60`.
- Free plan implies cold-start latency (~30s). Acceptable for a paste-and-
  classify flow; the `/api/upi/health` endpoint is what the founder
  dashboard pings to confirm liveness.
