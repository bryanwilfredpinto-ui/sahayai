# Chitti CA — AI tax assistant for Indian small businesses

Flask + DeepSeek. Same shape as `chitti-vaani/backend/`.

**Disclaimer enforced server-side** so the frontend can never strip it:

> "This is AI-generated guidance. Consult a registered CA for your actual filings."

## Run locally

```bash
cd backend
pip install -r requirements.txt
$env:DEEPSEEK_API_KEY="sk-..."          # PowerShell
python main.py                           # http://localhost:8001
```

## API

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/` | — | service banner |
| GET | `/health` | — | `{ok: true}` |
| GET | `/api/ca/health` | — | service health + deepseek_configured |
| POST | `/api/ca/ask` | `{text, language?, topic?}` | `{ok, source, language, reply, model, tokens}` |

`reply` is guaranteed to end with the disclaimer (server enforces it even if the model forgets).

## Deploy

`render.yaml` ready. Set `DEEPSEEK_API_KEY` in Render env vars; everything else has defaults.
