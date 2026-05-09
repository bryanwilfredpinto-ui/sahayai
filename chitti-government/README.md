# Chitti Government

Voice-first AI guide to Indian government schemes for blind / deaf / mute /
illiterate / elderly users. The full spec lives in
[`../CHITTI_GOVERNMENT_MASTER_SPEC.md`](../CHITTI_GOVERNMENT_MASTER_SPEC.md).

```
chitti-government/
├── README.md            # this file
├── render.yaml          # Render Blueprint (free tier)
└── backend/             # Flask + SQLAlchemy + APScheduler
    ├── main.py
    ├── config.py
    ├── database.py
    ├── runtime.txt
    ├── requirements.txt
    ├── data/schemes_seed.json
    ├── models/
    ├── routes/
    └── services/
```

## Local dev

```bash
cd chitti-government/backend
pip install -r requirements.txt
DATABASE_URL=sqlite:///./chitti_government.db SCHEDULER_ENABLED=false \
  python main.py
# → http://localhost:8003/api/government/health
```

The first boot creates `chitti_government.db`, seeds the 30-scheme
catalog from `data/schemes_seed.json`, and (when SCHEDULER_ENABLED=true)
fires the PIB poller every 6 hours.

## Production

Render Blueprint creates a `chitti-government-api` web service. Set
`DATABASE_URL` in the dashboard to the shared Supabase URL — the schema
isolation in `models/_schema.py` keeps every table under `government.*`,
so it coexists with `public.*` (chitti-shares) and `medupi.*`
(chitti-medupi) without collisions.

Frontend lives at the workspace root: [`../chitti_government.html`](../chitti_government.html).
