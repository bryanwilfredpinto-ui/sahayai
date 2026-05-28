🎖️ **World Class Chitti 4-Wheeler — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

> Service-due alerts · DTC decoder · document tracker · family-cascade SOS · anti-overcharge guard · fake-part scanner · 26 languages.

| Field | Value |
|---|---|
| Live URL | https://sahayai.in/chitti_4wheeler.html |
| Health | https://chitti-4wheeler-api-production.up.railway.app/health |
| Status | 🟢 GREEN (intentional Railway) |
| 4 Users | 👁️ Blind · 🦻 Deaf · 🤫 Mute · 📖 Illiterate — voice-first, ISL panel |
| Languages | 26 via Voice Factory cascade |
| Companion docs | [SKILLS.md](SKILLS.md) · [SOP.md](SOP.md) · [CHITTI_SOP.md §13](../CHITTI_SOP.md) |

---

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
- **DB**: Turso libSQL (one DB per Chitti — SAHAYAI_MASTER §2 row 2).
  Embedded-replica pattern: local SQLite file at `/tmp/chitti_4wheeler.db`
  + 60-s bg sync. **NOT direct Hrana** — see [[project_turso_embedded_replica_pattern]].
- **Hosting**: Railway free tier; `render.yaml` co-located

## Folder map

```
chitti-4wheeler/
├── README.md                       — this file
├── render.yaml                     — Railway blueprint
├── backend/
│   ├── main.py                     — Flask entrypoint
│   ├── config.py                   — env-var settings (DATABASE_URL + DeepSeek)
│   ├── database.py                 — Turso embedded-replica engine + sync loop
│   ├── requirements.txt
│   ├── runtime.txt                 — pinned Python
│   ├── models/
│   │   ├── __init__.py             — registers SQLAlchemy models
│   │   └── vehicle.py              — CarProfile row
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
  - `GET /health` — for chitti-founder self-ping + Railway
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

### Step 1 — Create the Turso DB (one-time)

```bash
turso db create chitti-4wheeler --group default
turso db show chitti-4wheeler --url        # → libsql://chitti-4wheeler-<org>.turso.io
turso db tokens create chitti-4wheeler     # → eyJ…
```

Compose: `libsql://chitti-4wheeler-<org>.turso.io?authToken=<token>`.

Per [[project_turso_db_inventory]] — DB lives in `aws-ap-south-1`
(Mumbai) under the `bryanwilfredpinto` Turso org.

### Step 2 — Deploy to Railway

1. Push to `main`.
2. Railway dashboard → `New +` → `Blueprint` → pick the `sahayai` repo
   → select `chitti-4wheeler/render.yaml` → `Apply`.
3. In the new service → `Environment`, paste:
   - `DATABASE_URL` = `libsql://…?authToken=…` from Step 1
   - `DEEPSEEK_API_KEY` = your DeepSeek key
4. Service comes up at `https://chitti-4wheeler-api-production.up.railway.app`.
5. `chitti-founder/backend/main.py::run_self_ping` picks it up
   automatically (Business Continuity Plan, §2e).

### Step 3 — Smoke test

```bash
curl https://chitti-4wheeler-api-production.up.railway.app/health
# → {"ok":true,"chitti":"chitti-4wheeler","db_kind":"turso-replica",...}

curl -X POST https://chitti-4wheeler-api-production.up.railway.app/api/4w/profile \
  -H 'Content-Type: application/json' -H 'X-Chitti-Device: smoke-test' \
  -d '{"brand":"Hyundai","model":"i20","fuel":"Petrol","tx":"Manual","odo":45000}'

curl https://chitti-4wheeler-api-production.up.railway.app/api/4w/profile \
  -H 'X-Chitti-Device: smoke-test'
# → confirms row round-tripped through Turso
```

## See also

- [SAHAYAI_MASTER.md](../SAHAYAI_MASTER.md) — single source of truth
- [chitti-2wheeler/](../chitti-2wheeler/) — sibling bike agent
- [chitti-vaani/](../chitti-vaani/) — emergency cascade backend
