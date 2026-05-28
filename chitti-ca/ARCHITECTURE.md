# Chitti CA — Architecture

## TL;DR

Tiny, stateless Flask service. One entrypoint, one blueprint, one service module that talks to DeepSeek over HTTPS. No database, no queue, no cache, no scheduler.

```
chitti_ca.html  ── POST /api/ca/ask ──►  Flask (main.py)
                                          │
                                          ▼
                                  routes/ca.py  (blueprint, validates input)
                                          │
                                          ▼
                                services/ca_service.py
                                          │
                                          ├──► DeepSeek /chat/completions  (httpx, sync)
                                          │
                                          ▼
                                  _enforce_disclaimer(reply)
                                          │
                                          ▼
                                       JSON response
```

## Files

| File                                                  | Purpose                                                                                         |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [backend/main.py](backend/main.py)                    | Flask app factory. Registers the CA blueprint. Exposes `GET /` (banner) and `GET /health`.       |
| [backend/config.py](backend/config.py)                | Env-driven `Settings` dataclass. DeepSeek key / model / URL, CORS origins, max-tokens, temperature. |
| [backend/routes/ca.py](backend/routes/ca.py)          | Blueprint `bp` under `/api/ca`. Two routes: `GET /health` and `POST /ask`.                       |
| [backend/services/ca_service.py](backend/services/ca_service.py) | DeepSeek wrapper. Holds the system prompt, the disclaimer string, the language map, and the disclaimer enforcer. |
| [backend/requirements.txt](backend/requirements.txt)  | flask 3.0.3, flask-cors 4.0.1, gunicorn 22.0.0, httpx 0.27.2. That's it.                         |
| [backend/runtime.txt](backend/runtime.txt)            | `python-3.11.10` (pinned for Railway).                                                            |
| [render.yaml](render.yaml)                            | Railway blueprint. `gunicorn main:app --workers 2 --timeout 60`. Free plan.                       |

## Request flow

1. Browser POSTs `{text, language?, topic?}` to `/api/ca/ask`.
2. [routes/ca.py](backend/routes/ca.py) validates: non-empty `text`, length <= 4000. Rejects with 400 / 413 otherwise.
3. [services/ca_service.py](backend/services/ca_service.py) `ask()`:
   - If `DEEPSEEK_API_KEY` is missing, returns a fallback reply with the disclaimer appended.
   - Otherwise builds a chat-completions request with the `CHITTI_CA_PROMPT` system message and a user message prefixed with `(Reply in <LangName>)` and an optional `(Topic hint: …)` line.
   - Calls `https://api.deepseek.com/chat/completions` with `httpx.Client(timeout=30.0)`.
   - Wraps the reply in `_enforce_disclaimer()` before returning.
4. Errors (HTTP errors, network errors, JSON shape errors) fall through to the same fallback path so the client always sees a disclaimer-bearing reply.

## State

**None.** The service holds no per-user state, no chat history, no rate-limit table, no cache. Every call is independent. See [DATABASE.md](DATABASE.md).

## Concurrency

- Local: Flask dev server (single thread, debug off).
- Production: `gunicorn` with 2 workers, 60 s timeout (from [render.yaml](render.yaml)). DeepSeek calls are synchronous `httpx` with a 30 s timeout, so a single hung upstream call cannot deadlock the worker.

## CORS

`flask_cors.CORS` is configured from the `ALLOWED_ORIGINS` env var (comma-separated). Defaults to `https://sahayai.in,https://www.sahayai.in,http://localhost:5500,http://127.0.0.1:5500`. The Railway env override narrows this to the two production domains only.

## Failure modes & their fallbacks

| Failure                                  | Behaviour                                                              |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| `DEEPSEEK_API_KEY` unset                  | Returns `source: "fallback"` with a stub message + disclaimer.         |
| DeepSeek returns non-2xx                  | Logs, falls back, sets `error: "deepseek_http_<code>"`.                |
| Network error / JSON parse error          | Logs, falls back, sets `error` to the truncated exception message.     |
| Empty model reply                         | `_enforce_disclaimer("")` returns just the disclaimer line.            |

In every case the response shape stays `{ok, source, language, reply, model, ...}` so the frontend never needs to branch on success vs. failure to render a useful message.

## What is intentionally **not** here

- No DB / ORM (stateless wrapper).
- No auth / login (free, no sign-up — part of the accessibility contract).
- No streaming (DeepSeek chat completions called as a single POST; reply size is bounded by `CA_MAX_TOKENS = 700`).
- No multi-turn history (each ask is independent; this is a triage tool, not a chat).
- No Bhashini / voice on the backend (voice IO is handled in-browser via Web Speech API).
