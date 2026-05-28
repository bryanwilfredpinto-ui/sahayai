🎖️ **World Class Chitti Legal — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

> Plain-Hindi legal help at LL.M + PhD grade — for Indians facing a notice or contract without a lawyer.

| Field | Value |
|---|---|
| Live URL | https://sahayai.in/chitti_legal.html |
| Health | https://chitti-legal-api-production.up.railway.app/health |
| Status | 🟢 GREEN — curl-verified 2026-05-15 |
| Risk | 🔴 HIGH — server-enforced "this is not legal advice" disclaimer on every response |
| 4 Users | 👁️ Blind · 🦻 Deaf · 🤫 Mute · 📖 Illiterate — voice-first, ISL panel, plain-EN/HI |
| Languages | 12 Indian languages |
| Companion docs | [SKILLS.md](SKILLS.md) · [SOP.md](SOP.md) · [CHITTI_SOP.md §4](../CHITTI_SOP.md) · [LEGAL_KNOWLEDGE.md](skills/LEGAL_KNOWLEDGE.md) |

---

# Chitti Legal

Plain-language explainer for Indian legal documents. A citizen pastes any clause, notice, contract, FIR copy, or affidavit; Chitti reads it back in plain Hindi / English / 10 other Indian languages, flags what to watch out for, and tells the user what to ask a lawyer.

DeepSeek-powered. Stateless. One backend endpoint that matters: `POST /api/legal/explain`.

## The disclaimer is not optional

Every reply is post-processed server-side to end with the exact line:

> AI explanation only. Not a substitute for a licensed lawyer. Consult a lawyer before signing or replying.

If DeepSeek returns text without it, [legal_service.py](backend/services/legal_service.py) appends it. If DeepSeek is down, the fallback message also carries it. The disclaimer is also rendered as a sticky red bar at the top of [chitti_legal.html](../chitti_legal.html), and as a "what Chitti will never do" red card before the input box.

## Hard rules baked into the system prompt

- Never DRAFTS a binding contract, agreement, affidavit, or notice. Only EXPLAINS what such a document typically contains.
- Never gives a yes/no opinion on liability, validity, or who will win.
- Never tells the user to ignore a notice or skip a court date.
- Never invents statute numbers, case citations, or judgments.
- Never stores or repeats Aadhaar / PAN / account numbers the user pastes in.
- For time-sensitive notices (eviction, Sec 138, court summons) the reply opens with the typical response window so the user does not miss the deadline.

The full prompt is in [PROMPTS.md](PROMPTS.md).

## Run locally

```bash
cd backend
pip install -r requirements.txt
$env:DEEPSEEK_API_KEY="sk-..."
python main.py     # http://localhost:8002
```

Without `DEEPSEEK_API_KEY` set, the service still runs and returns a fallback payload (`source: "fallback"`) so the frontend can render something usable.

## Production

Deployed on Railway as `chitti-legal-api` per [render.yaml](render.yaml). Frontend [chitti_legal.html](../chitti_legal.html) hits `https://chitti-legal-api-production.up.railway.app/api/legal/explain`.

## Project shape

| File | Role |
|---|---|
| [main.py](backend/main.py) | Flask app factory, CORS, `/` banner, `/health` |
| [config.py](backend/config.py) | env-driven `Settings` dataclass (DeepSeek key, model, URL, CORS, max_tokens, temperature) |
| [routes/legal.py](backend/routes/legal.py) | `/api/legal/health`, `/api/legal/explain` |
| [services/legal_service.py](backend/services/legal_service.py) | DeepSeek call, disclaimer enforcement, fallback path |
| [requirements.txt](backend/requirements.txt) | flask, flask-cors, gunicorn, httpx |
| [render.yaml](render.yaml) | Railway free-tier service definition |

That is the entire backend. No database, no scheduler, no auth.

## See also

- [CONTEXT.md](CONTEXT.md) — why this product exists, who it serves, the four-user contract
- [ARCHITECTURE.md](ARCHITECTURE.md) — how the pieces fit together
- [API.md](API.md) — every endpoint, request, response
- [PROMPTS.md](PROMPTS.md) — the verbatim DeepSeek system prompt
- [TODO.md](TODO.md) — known gaps between frontend and backend
- [CHANGELOG.md](CHANGELOG.md) — git history
- [DATABASE.md](DATABASE.md) — N/A
