# Chitti 4-Wheeler

Bharat's voice-first agent for car owners. Predicts engine problems,
decodes DTCs in plain Hinglish, tracks documents, raises family-cascade
SOS, anti-overcharge guard, fake-part scanner. 26 languages. Four-user
accessibility. Camera-intelligence-ready. Never auto-dials cops.

## Stack

- **LLM**: DeepSeek (sole provider per SAHAYAI_MASTER §2 row 1)
- **Voice**: Chitti Voice Factory (26 languages, swappable)
- **Frontend**: [`chitti_4wheeler.html`](../chitti_4wheeler.html) at
  repo root (Bharat theme, mirror of MedUPI)
- **Backend**: Flask + gunicorn (chitti-medupi pattern)
- **DB**: in-memory today; Turso row in P1 (per FEATURES.md row C3)
- **Hosting**: Render free tier; `render.yaml` co-located

## Folder map

```
chitti-4wheeler/
├── README.md                       — this file
├── render.yaml                     — Render blueprint
├── backend/
│   ├── main.py                     — Flask entrypoint
│   ├── config.py                   — env-var settings
│   ├── requirements.txt
│   ├── runtime.txt                 — pinned Python
│   ├── routes/wheels.py            — ask · dtc · breakdown · maintenance · profile
│   └── services/deepseek_client.py — single DeepSeek call helper + disclaimer
└── skills/
    ├── FEATURES.md                 — capability surface (parsed live by chitti_features.js)
    ├── SKILL.md                    — persona + tool-use rules
    └── MECHANIC_KNOWLEDGE.md       — depth corpus for DeepSeek grounding
```

## What ships in this commit

- Frontend skeleton with full feature surface (26 feature cards on the
  Home tab; LIVE / COMING SOON badges).
- Skills folder with FEATURES, SKILL, MECHANIC_KNOWLEDGE markdown.
- Backend stub:
  - `GET /health` — for chitti-founder self-ping + Render
  - `POST /api/4w/ask` — DeepSeek Hinglish Q&A grounded in
    MECHANIC_KNOWLEDGE
  - `GET /api/4w/dtc/<code>` — 16 most-common codes today
  - `POST /api/4w/breakdown` — deterministic decision tree
  - `GET /api/4w/maintenance/next` — brand-schedule next-due
  - `POST /api/4w/profile` — in-memory profile store
  - everything else → honest 501 *"coming_soon"*.
- `render.yaml` so the service is reconstitutable from `main`.

## What does NOT ship in this commit

Everything marked PLANNED / FUTURE in
[`skills/FEATURES.md`](skills/FEATURES.md). See §2 / §3 there.

## Deploy

1. Push to `main`.
2. In Render dashboard → New + → Blueprint → pick repo and select
   `chitti-4wheeler/render.yaml`.
3. Set `DEEPSEEK_API_KEY` in the dashboard env vars.
4. Service comes up at `https://chitti-4wheeler-api.onrender.com`.
5. `chitti-founder/backend/main.py::run_self_ping` picks it up
   automatically (Layer 1 of the Business Continuity Plan, §2e).

## See also

- [SAHAYAI_MASTER.md](../SAHAYAI_MASTER.md) — single source of truth
- [chitti-2wheeler/](../chitti-2wheeler/) — sibling bike agent
- [chitti-vaani/](../chitti-vaani/) — emergency cascade backend
