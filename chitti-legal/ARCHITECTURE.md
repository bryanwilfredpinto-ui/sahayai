# Chitti Legal — Architecture

A deliberately tiny surface. One Flask app, one blueprint, one service module, one upstream (DeepSeek). No DB, no scheduler, no auth, no background workers.

## Diagram

```
[ chitti_legal.html ]               (GitHub Pages static page)
        |
        |  POST /api/legal/explain  { text, language?, doc_type? }
        v
[ Flask app — main.py ]             (Railway free tier, gunicorn 2 workers)
        |
        | -> @app.get("/")          banner
        | -> @app.get("/health")    {ok: true}
        | -> blueprint "legal" (url_prefix="/api/legal")
        v
[ routes/legal.py ]
        | -> GET  /api/legal/health
        | -> POST /api/legal/explain
        v
[ services/legal_service.py ]
        | -> CHITTI_LEGAL_PROMPT  (system message)
        | -> httpx -> DeepSeek chat/completions
        | -> _enforce_disclaimer()
        | -> _fallback() on missing key / HTTP error / parse error
        v
        DeepSeek API (deepseek-chat)
```

## Process model

- Single Flask app factory in [main.py](backend/main.py) via `create_app()`.
- Production: `gunicorn main:app --bind 0.0.0.0:$PORT --workers 2 --timeout 60` ([render.yaml](render.yaml)).
- Local: `python main.py` listens on `PORT` env (default `8002`).
- Stateless — every request is independent. Restart is free.

## CORS

Configured in [main.py](backend/main.py) via `flask-cors`. Origins come from the comma-separated `ALLOWED_ORIGINS` env var. Default includes `https://sahayai.in`, `https://www.sahayai.in`, and the two common local-dev hosts on port 5500. Railway production overrides to just the two real hostnames.

## Configuration

All knobs live in [config.py](backend/config.py) as a frozen `Settings` dataclass read from env at import time. Nothing is hot-reloadable; Railway redeploys on env change.

| Env var | Default | Purpose |
|---|---|---|
| `DEEPSEEK_API_KEY` | `""` | Bearer token for DeepSeek. Empty -> fallback path. |
| `DEEPSEEK_MODEL` | `deepseek-chat` | Model name passed to the API |
| `DEEPSEEK_URL` | `https://api.deepseek.com/chat/completions` | Override for staging or self-hosted gateway |
| `ALLOWED_ORIGINS` | dev defaults | Comma-separated CORS allowlist |
| `LEGAL_MAX_TOKENS` | `800` | Reply length cap |
| `LEGAL_TEMPERATURE` | `0.25` | Low — this is a legal explainer, not a creative writer |

## Request lifecycle (`POST /api/legal/explain`)

1. [routes/legal.py](backend/routes/legal.py) parses the JSON body. `text` is required and trimmed; `language` defaults to `"en"`; `doc_type` is optional.
2. Two cheap guards: `missing_text` -> 400; `text_too_long` (`> 8000` chars) -> 413 with `max_chars: 8000`.
3. Hand off to `legal_service.explain(text, language, doc_type)`.
4. If `DEEPSEEK_API_KEY` is empty, return `_fallback(...)` — a stub reply tagged `source: "fallback"`, with the disclaimer already appended.
5. Otherwise build a 2-message conversation: system = `CHITTI_LEGAL_PROMPT`; user = `"(Reply in <Language>)\n(Document type hint: <doc_type>)\n<text>"`.
6. POST to `settings.DEEPSEEK_URL` via `httpx.Client(timeout=30.0)` with `Authorization: Bearer ...`.
7. Extract `choices[0].message.content`, run through `_enforce_disclaimer()`, return with `source: "deepseek"`, `model`, and `tokens.{input,output}`.
8. Any `httpx.HTTPStatusError` is logged and downgraded to a fallback payload with an extra `error: "deepseek_http_<code>"` field — the caller still gets `ok: true` and a disclaimer-tagged reply.
9. Network / parse errors take the same fallback route with `error: <truncated message>`.

## Disclaimer enforcement

`_enforce_disclaimer(text)`:

- Strips the input.
- If empty, returns just the canonical `LEGAL_DISCLAIMER` string.
- If the literal disclaimer is not a substring of the model output, appends `"\n\n" + LEGAL_DISCLAIMER`.
- Returns the result. Every code path that emits a `reply` goes through this function.

## Language mapping

`_LANG_NAMES` covers 12 language codes (`en, hi, ta, te, bn, mr, gu, kn, ml, or, pa, ur`). Unknown codes fall back to the raw code itself, or `"English"` if blank.

## What is intentionally absent

- **No database.** State is the model + the request. See [DATABASE.md](DATABASE.md).
- **No auth.** Public endpoint. Rate limiting is Railway's default + the 8000-char cap.
- **No file upload.** The user pastes text. A photo-OCR path is on [TODO.md](TODO.md).
- **No streaming.** Single-shot POST; the frontend shows a `"asking Chitti Legal…"` status while waiting.
- **No retry logic.** A failed DeepSeek call returns the fallback once; the user can click `Explain` again.
