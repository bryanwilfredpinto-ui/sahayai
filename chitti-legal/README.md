# Chitti Legal — plain-language Indian legal-document explainer

Flask + DeepSeek. Same shape as `chitti-ca/backend/`.

**Disclaimer enforced server-side:**

> "AI explanation only. Not a substitute for a licensed lawyer. Consult a lawyer before signing or replying."

## Run locally

```bash
cd backend
pip install -r requirements.txt
$env:DEEPSEEK_API_KEY="sk-..."
python main.py                           # http://localhost:8002
```

## API

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/` | — | service banner |
| GET | `/health` | — | `{ok: true}` |
| GET | `/api/legal/health` | — | service health + deepseek_configured |
| POST | `/api/legal/explain` | `{text, language?, doc_type?}` | `{ok, source, language, reply, model, tokens}` |

`reply` always ends with the legal disclaimer.

## Hard rules baked into the system prompt

- Never DRAFTS a binding contract, agreement, affidavit, notice. Only EXPLAINS.
- Never gives a yes/no liability opinion.
- Never invents statute numbers or case citations.
- For time-sensitive notices, opens with the typical response window so the user does not miss a deadline.
