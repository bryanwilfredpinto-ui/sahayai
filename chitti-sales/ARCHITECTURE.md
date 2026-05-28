# Chitti Sales — Architecture

## TL;DR

**Nothing is built yet.** This file is a proposal. The intended shape mirrors [chitti-ca/ARCHITECTURE.md](../chitti-ca/ARCHITECTURE.md): a tiny, stateless Flask service. One entrypoint, one blueprint, one service module that talks to DeepSeek over HTTPS. No database, no queue, no cache, no scheduler.

```
chitti_sales.html  ── POST /api/sales/ask ──►  Flask (main.py)
                                                │
                                                ▼
                                        routes/sales.py  (blueprint, validates input)
                                                │
                                                ▼
                                      services/sales_service.py
                                                │
                                                ├──► DeepSeek /chat/completions  (httpx, sync)
                                                │
                                                ▼
                                        _enforce_disclaimer(reply)
                                                │
                                                ▼
                                             JSON response
```

## Proposed files

| File                                              | Purpose                                                                                         |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `backend/main.py`                                 | Flask app factory. Registers the sales blueprint. Exposes `GET /` (banner) and `GET /health`.    |
| `backend/config.py`                               | Env-driven `Settings` dataclass. DeepSeek key / model / URL, CORS origins, max-tokens, temperature. |
| `backend/routes/sales.py`                         | Blueprint `bp` under `/api/sales`. Two routes: `GET /health` and `POST /ask`.                    |
| `backend/services/sales_service.py`               | DeepSeek wrapper. Holds the system prompt, the disclaimer string, the language map, the topic map, and the disclaimer enforcer. |
| `backend/requirements.txt`                        | flask 3.0.3, flask-cors 4.0.1, gunicorn 22.0.0, httpx 0.27.2.                                    |
| `backend/runtime.txt`                             | `python-3.11.10` (pinned for Railway).                                                            |
| `render.yaml`                                     | Railway blueprint. `gunicorn main:app --workers 2 --timeout 60`. Free plan.                       |
| `chitti_sales.html` (at repo root)                | Voice-first frontend. Topic chips + mic button + SpeechSynthesis. Includes [feedback-widget.js](../feedback-widget.js). |

## Proposed request flow

1. Browser POSTs `{text, language?, topic?}` to `/api/sales/ask`.
2. `routes/sales.py` validates: non-empty `text`, length <= 4000. Rejects with 400 / 413 otherwise.
3. `services/sales_service.py` `ask()`:
   - If `DEEPSEEK_API_KEY` is missing, returns a fallback reply with the disclaimer appended.
   - Otherwise builds a chat-completions request with the `CHITTI_SALES_PROMPT` system message (see [PROMPTS.md](PROMPTS.md)) and a user message prefixed with `(Reply in <LangName>)` and an optional `(Topic hint: …)` line.
   - Calls `https://api.deepseek.com/chat/completions` with `httpx.Client(timeout=30.0)`.
   - Wraps the reply in `_enforce_disclaimer()` before returning.
4. Errors (HTTP errors, network errors, JSON shape errors) fall through to the same fallback path so the client always sees a disclaimer-bearing reply.

## State

**None.** The service holds no per-user state, no chat history, no rate-limit table, no cache. Every call is independent. See [DATABASE.md](DATABASE.md).

## Concurrency (proposed)

- Local: Flask dev server (single thread, debug off).
- Production: `gunicorn` with 2 workers, 60 s timeout. DeepSeek calls are synchronous `httpx` with a 30 s timeout, so a single hung upstream call cannot deadlock the worker.

## CORS (proposed)

`flask_cors.CORS` configured from `ALLOWED_ORIGINS` env var (comma-separated). Defaults to `https://sahayai.in,https://www.sahayai.in,http://localhost:5500,http://127.0.0.1:5500`.

## Failure modes & their fallbacks (proposed)

| Failure                                  | Behaviour                                                              |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| `DEEPSEEK_API_KEY` unset                  | Returns `source: "fallback"` with a stub coaching message + disclaimer. |
| DeepSeek returns non-2xx                  | Logs, falls back, sets `error: "deepseek_http_<code>"`.                |
| Network error / JSON parse error          | Logs, falls back, sets `error` to the truncated exception message.     |
| Empty model reply                         | `_enforce_disclaimer("")` returns just the disclaimer line.            |

In every case the response shape stays `{ok, source, language, reply, model, book_cited?, ...}` so the frontend never needs to branch on success vs. failure to render a useful message.

## What is intentionally **not** here

- No DB / ORM (stateless wrapper). If user feedback or per-user history is added, it lives in a separate, isolated schema — see [DATABASE.md](DATABASE.md).
- No auth / login (free, no sign-up — part of the accessibility contract).
- No streaming.
- No multi-turn history (each ask is independent; this is a coaching tool, not a chat companion).
- No CRM ingestion, no contact-list parser, no WhatsApp Business hookup, no autodialer.
- No Bhashini / voice on the backend (voice IO is handled in-browser via Web Speech API initially; proxy through [Chitti Voice Factory](../chitti-voice-factory/) is on the roadmap).

## Why this shape

It is the same shape that worked for [chitti-ca](../chitti-ca/) and [chitti-legal](../chitti-legal/): the minimum viable LLM wrapper with a server-enforced disclaimer. The product gets to ship in days, the safety story (disclaimer + boundaries + truth sources) is the same audit-friendly pattern across the three coaching Chittis, and there is no DB to leak.
