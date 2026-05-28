---
name: chitti-vaani
description: Chitti Vaani — voice-first phone/desktop assistant for Bharat. Web Speech API in + DeepSeek out + auto-speak responses + 8-language support (Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, English). Call-summary + read-aloud-text modes. Every response ends with the legal line "Yeh AI ki madad hai. Doctor ya lawyer se confirm zaroor karo." Use on chitti_vaani.html or for any voice-assistant / read-aloud / call-summary question.
---

# Chitti Vaani — top-level skill

This skill describes the **Chitti Vaani product** as a whole. It loads
when the user asks about voice assistance, accessibility (blind / deaf
/ mute / illiterate users), call summaries, or "read this aloud" use
cases.

## Repo layout

```
chitti-vaani/
├── frontend/index.html         mirror of workspace-root chitti_vaani.html
└── backend/
    ├── main.py                 Flask app · CORS · /api/vaani/* registration
    ├── config.py               settings (DEEPSEEK_API_KEY · model · CORS · token caps)
    ├── requirements.txt        flask · flask-cors · gunicorn · httpx
    ├── runtime.txt             Python 3.11
    ├── render.yaml             Railway Blueprint
    ├── services/
    │   └── vaani_service.py    DeepSeek wrapper + CHITTI_VAANI_PROMPT (canonical) + disclaimer enforcer
    └── routes/
        └── vaani.py            Blueprint /api/vaani/*
```

## Endpoint surface (Flask Blueprint, prefix `/api/vaani`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/ask`        | Body `{text, language?, mode?}` → DeepSeek reply with mandatory legal line appended |
| GET  | `/health`     | DeepSeek key configured? |
| GET  | `/languages`  | 9 supported language codes for the frontend selector |
| GET  | `/local/nearby?service=<x>` | Chitti shop directory lookup — preferred over external apps for Order/Book cards |
| GET  | `/local/categories` | Diagnostic: every supported service category + the Chitti shop keys + external-app keys it maps to |

`mode` ∈ `ask` (default), `call` (summarise call notes), `read`
(repeat back clearly), `translate` (translate to user's language).

## Consent gating (T&C modal)

Frontend stores `chitti_vaani_consent_given` in localStorage. Until the
user taps **I AGREE**, only the T&C modal is rendered — every feature
is locked. The 6 T&C sections each have a 🔊 speaker button that
reads that section aloud in the user's language:

  1. What Chitti Vaani Is (and is not)
  2. Legal Compliance (DPDP Act 2023 · TRAI rules · no recording without consent)
  3. Permissions Required (Microphone · Read call logs · Read contacts)
  4. Data Privacy (no selling, no sharing, user owns data)
  5. Emergency and Liability (no guarantee of medical / legal outcomes)
  6. Grievance Redressal (sire@sahayai.in)

## Live URLs
- Frontend: https://sahayai.in/chitti_vaani.html
- Backend:  https://chitti-vaani-api-production.up.railway.app (planned — `render.yaml` ready)

## Cross-product hooks
- UPI Fraud Guard ↔ Vaani: when fraud detected, frontend can deep-link
  to Vaani SOS flow.
- Product Scanner ↔ Vaani: scanner result can be sent to
  `/api/vaani/ask` with `mode=read` so the result is read aloud for
  blind / low-literacy users.
