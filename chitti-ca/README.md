🎖️ **World Class Chitti CA — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

> Plain-Hindi tax help at CA Final + PhD grade — for the 99% of Indians without a CA on retainer.

| Field | Value |
|---|---|
| Live URL | https://sahayai.in/chitti_ca.html |
| Health | https://chitti-ca-api-production.up.railway.app/health |
| Status | 🟢 GREEN — curl-verified 2026-05-15 |
| Risk | 🔴 HIGH — server-enforced disclaimer on every response, never client-controlled |
| 4 Users | 👁️ Blind · 🦻 Deaf · 🤫 Mute · 📖 Illiterate — voice-first, ISL panel, plain-EN/HI |
| Languages | 12 Indian languages on backend |
| Companion docs | [SKILLS.md](SKILLS.md) · [SOP.md](SOP.md) · [CHITTI_SOP.md §3](../CHITTI_SOP.md) · [CA_KNOWLEDGE.md](skills/CA_KNOWLEDGE.md) |

---

# Chitti CA

AI tax assistant for Indian small businesses, freelancers, and salaried individuals. DeepSeek-powered Q&A on ITR, GST, TDS, deductions, and tax notices in plain Hindi or English (12 Indian languages supported on the backend).

This product is an **honest stub**. Chitti CA does not file anything, does not look at your books, and never gives a binding number. Every reply is closed by a server-enforced disclaimer that points the user at a registered Chartered Accountant for actual filings.

## What it does

- Plain-language guidance on which ITR form to use (ITR-1 / 2 / 3 / 4)
- GST thresholds, return frequencies (GSTR-1, GSTR-3B, GSTR-9), composition scheme explainers
- TDS, advance tax, presumptive taxation (Sec 44AD / 44ADA / 44AE)
- Allowable deductions (80C, 80D, 80G, 80E, HRA, home-loan interest)
- Reads CBDT / CBIC notices in plain Hindi or English when the user pastes them in

## What it deliberately does **not** do

- It does not file returns.
- It does not give a final number ("you owe Rs X") or a binding "you don't need to file".
- It does not store PAN, Aadhaar, or bank numbers — the system prompt forbids the model from repeating them.
- It is not a substitute for a Chartered Accountant. Every reply ends with the disclaimer.

## Shape

Tiny Flask app, no database. One backend route file ([routes/ca.py](backend/routes/ca.py)), one service file ([services/ca_service.py](backend/services/ca_service.py)), one config file ([config.py](backend/config.py)), one entrypoint ([main.py](backend/main.py)).

Same shape as `chitti-vaani/backend/`.

## Run locally

```bash
cd backend
pip install -r requirements.txt
$env:DEEPSEEK_API_KEY="sk-..."          # PowerShell
python main.py                           # http://localhost:8001
```

If `DEEPSEEK_API_KEY` is unset the service still answers — it returns a `source: "fallback"` reply that includes the disclaimer, so the four-user contract never breaks.

## Deploy

[render.yaml](render.yaml) is ready. Set `DEEPSEEK_API_KEY` in Railway env vars; everything else has defaults.

Live URL: https://chitti-ca-api-production.up.railway.app

## Frontend

User-facing page is `chitti_ca.html` at the repo root. It shows a permanent sticky disclaimer bar, a language selector (12 Indian languages), topic chips (ITR / GST / TDS / 80C-80D / 44AD-44ADA / Notice received), Web Speech mic-in, and SpeechSynthesis read-aloud out — honouring the four-user accessibility contract (blind / deaf / mute / illiterate).

## See also

- [CONTEXT.md](CONTEXT.md) — why this product exists and the accessibility contract
- [ARCHITECTURE.md](ARCHITECTURE.md) — how it's wired
- [API.md](API.md) — endpoint reference
- [PROMPTS.md](PROMPTS.md) — the system prompt verbatim
- [TODO.md](TODO.md) — known gaps
