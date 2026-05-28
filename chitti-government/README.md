🎖️ **World Class Chitti Government — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

> 30 schemes seeded · PIB poll every 6h · DigiLocker partner-only · honest *"unclear eligibility"* state, never coerced to *"eligible"*.

| Field | Value |
|---|---|
| Live URL | https://sahayai.in/chitti_government.html |
| Health | https://chitti-government-api-production.up.railway.app/health |
| Status | 🟢 GREEN — curl-verified 2026-05-15 |
| 4 Users | 👁️ Blind · 🦻 Deaf · 🤫 Mute · 📖 Illiterate — voice-first, ISL panel, plain-EN/HI |
| Languages | 12 Indian languages |
| Companion docs | [SKILLS.md](SKILLS.md) · [SOP.md](SOP.md) · [CHITTI_SOP.md §5](../CHITTI_SOP.md) · [MASTER_SPEC](../CHITTI_GOVERNMENT_MASTER_SPEC.md) |

---

# Chitti Government

Voice-first AI guide to Indian central + state government schemes, built for
the four-user accessibility contract (blind / deaf / mute / illiterate /
elderly). Tenth product in the Chitti family on [sahayai.in](https://sahayai.in).

> **Disclaimer (sticky banner on every page):**
> "यह government AI है। Official source se confirm karo. Chitti government
> scheme guide hai, sarkari seva nahi."

Full product spec: [`../CHITTI_GOVERNMENT_MASTER_SPEC.md`](../CHITTI_GOVERNMENT_MASTER_SPEC.md).

---

## What it does

1. **Eligibility check** — caller speaks (or picks) a scheme; Chitti runs a
   deterministic rule-engine over the user's local profile (age, gender,
   income, state, BPL, occupation, landholding, caste, disability, rural/urban)
   and returns one of `eligible | partial | ineligible | unknown`, then asks
   DeepSeek to phrase the verdict as an 80–120-word spoken summary.
2. **Catalog** — search + state/category filter across 30 curated central +
   state schemes seeded from [`backend/data/schemes_seed.json`](backend/data/schemes_seed.json).
3. **Document checklist** — per-scheme tickbox stored in `localStorage`.
4. **Form helper** — voice-guided fill auto-completed from the saved profile,
   produces a printable CSC summary sheet.
5. **PIB alerts** — every 6 h the backend polls 10 PIB RSS feeds (English +
   Hindi), keeps scheme-relevant items, and exposes them via `/api/government/alerts`.
6. **Status tracker** — honest deep-link handoff to the official scheme portal
   (no public status API exists for PM-Kisan / PMAY / PMJAY / MGNREGA).
7. **Nearby-office locator** — Nominatim search for CSC, post office,
   Aadhaar Seva Kendra, ration / FPS, Jan Aushadhi, panchayat, bank,
   police; Google Maps fallback when Nominatim is unreachable.
8. **Documents** — local-only file picker + expiry tracker (90 / 30 / 7 day
   alerts) with a DigiLocker deep-link handoff (DigiLocker API integration is
   gated to partner-registered entities — see [CONTEXT.md](CONTEXT.md)).
9. **Profile** — age / DOB, gender, income, state, occupation, caste,
   landholding, BPL, SECC, disability — all in `localStorage`, never sent
   to a server except as anonymous JSON for the eligibility evaluation.

## Folder layout

```
chitti-government/
├── README.md                    ← this file
├── CONTEXT.md                   ← why it exists, accessibility contract
├── ARCHITECTURE.md              ← backend internals
├── CHANGELOG.md                 ← git history + spec milestones
├── TODO.md                      ← outstanding items
├── API.md                       ← every HTTP endpoint
├── DATABASE.md                  ← government.* schema tables
├── PROMPTS.md                   ← DeepSeek prompt templates
├── render.yaml                  ← Railway Blueprint (free tier)
└── backend/
    ├── main.py                  ← Flask app + bootstrap
    ├── config.py                ← env-driven Settings
    ├── database.py              ← SQLAlchemy engine + session
    ├── runtime.txt              ← 3.11.10
    ├── requirements.txt
    ├── data/
    │   └── schemes_seed.json    ← 30 curated schemes
    ├── models/
    │   ├── _schema.py           ← government.* schema isolation
    │   ├── scheme.py
    │   ├── pib_announcement.py
    │   ├── feedback.py
    │   └── ingest_log.py
    ├── routes/
    │   └── government.py        ← /api/government/* blueprint
    └── services/
        ├── government_database.py
        ├── government_deepseek.py
        ├── government_eligibility.py
        ├── government_pib.py
        ├── government_locator.py
        └── government_scheduler.py
```

Frontend (single-file SPA) lives at the workspace root:
[`../chitti_government.html`](../chitti_government.html).

## Local dev

```bash
cd chitti-government/backend
pip install -r requirements.txt
DATABASE_URL=sqlite:///./chitti_government.db \
SCHEDULER_ENABLED=false \
python main.py
# → http://localhost:8003/api/government/health
```

The first boot creates `chitti_government.db`, runs
`Base.metadata.create_all()`, and seeds the 30-scheme catalog from
[`backend/data/schemes_seed.json`](backend/data/schemes_seed.json). When
`SCHEDULER_ENABLED=true` the APScheduler thread starts and fires the
first PIB poll 45 s after boot.

Set `DEEPSEEK_API_KEY` for the voice-first explainer. Without it the service
still ships — the rule engine produces a deterministic English/Hindi reply
so no feature is ever a "coming soon" stub.

## Production (Railway)

The Railway Blueprint at [`render.yaml`](render.yaml) creates a single web
service `chitti-government-api`. Required dashboard envs:

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Shared Supabase Postgres — same instance used by chitti-shares + chitti-medupi. Schema isolation in [`backend/models/_schema.py`](backend/models/_schema.py) keeps tables under `government.*`. |
| `DEEPSEEK_API_KEY` | Optional. Rule-engine fallback ships when missing. |

Health:    <https://chitti-government-api-production.up.railway.app/health>
Endpoints: <https://chitti-government-api-production.up.railway.app/>
Freshness: <https://chitti-government-api-production.up.railway.app/api/government/freshness>

## Companion docs

- [CONTEXT.md](CONTEXT.md) — why this product exists; the four-user contract.
- [ARCHITECTURE.md](ARCHITECTURE.md) — Flask + APScheduler + Nominatim + DeepSeek wiring.
- [API.md](API.md) — every HTTP endpoint with payloads.
- [DATABASE.md](DATABASE.md) — `government.*` schema tables.
- [PROMPTS.md](PROMPTS.md) — DeepSeek prompt templates.
- [CHANGELOG.md](CHANGELOG.md) — version history.
- [TODO.md](TODO.md) — outstanding work (DigiLocker partner integration,
  document expiry sweep, MyScheme nightly refresh, Bhashini handoff).
