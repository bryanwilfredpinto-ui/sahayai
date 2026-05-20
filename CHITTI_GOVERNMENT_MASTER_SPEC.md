# Chitti Government — Master Spec

**Version 1.0 · 2026-05-09 · Bryan Wilfred Pinto**

Voice-first AI guide to Indian government schemes for blind / deaf / mute /
illiterate / elderly users. Tenth product in the Chitti family.

---

## At a glance

| Field | Value |
| --- | --- |
| Product slug | `chitti-government` |
| Frontend | [`chitti_government.html`](chitti_government.html) → `https://sahayai.in/chitti_government.html` |
| Backend | `chitti-government/backend/` → `https://chitti-government-api-production.up.railway.app` |
| Database | Shared Supabase Postgres, isolated under `government.*` schema |
| LLM | DeepSeek (`deepseek-chat`) — falls back to deterministic rule-engine reply when key missing |
| External data | PIB RSS (10 feeds, every 6 h) · Nominatim (locator) · MyScheme (deep-link only) |
| Schemes seeded | 30 popular central + state schemes (data/schemes_seed.json) |
| DigiLocker | **NOT integrated** in v1 — partner registration gated; UI uses honest local-upload flow with deep-link to digilocker.gov.in |
| Disclaimer | "यह government AI है। Official source se confirm karo. Chitti government scheme guide hai, sarkari seva nahi." |

---

## Architecture

```
chitti-government/
├── render.yaml                       # Render Blueprint (free tier)
└── backend/
    ├── main.py                       # Flask app · bootstraps schema + seeds + scheduler
    ├── config.py                     # env-driven Settings (no pydantic)
    ├── database.py                   # SQLAlchemy engine + session
    ├── runtime.txt                   # 3.11.10
    ├── requirements.txt              # flask, sqlalchemy, feedparser, apscheduler, httpx, rapidfuzz
    ├── data/
    │   └── schemes_seed.json         # 30 curated schemes — first-boot seed
    ├── models/
    │   ├── _schema.py                # `government.*` schema isolation
    │   ├── scheme.py                 # main catalog row + eligibility predicates
    │   ├── pib_announcement.py       # ingested PIB items (deduped by GUID)
    │   ├── feedback.py               # anonymous up/down + optional note
    │   └── ingest_log.py             # one row per scheduler run
    ├── routes/
    │   └── government.py             # /api/government/* blueprint
    └── services/
        ├── government_database.py    # ensure_schema + seed_if_empty + list_schemes
        ├── government_eligibility.py # pure-python rule engine (eligible/partial/ineligible)
        ├── government_pib.py         # PIB RSS poller (real UA, dedup, scheme-keyword filter)
        ├── government_locator.py     # Nominatim search w/ Google Maps fallback
        ├── government_deepseek.py    # voice-first explainer wrapper around the verdict
        └── government_scheduler.py   # APScheduler — pib_poll every 6 h + cleanup + heartbeat
```

---

## API surface (`/api/government/*`)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | DeepSeek configured + service banner |
| GET | `/schemes` | Catalog list (filters: `state`, `category`, `q`, `limit`) |
| GET | `/schemes/<slug>` | Single scheme detail |
| GET | `/schemes/<slug>/checklist` | Document checklist (per-scheme) |
| GET | `/schemes/<slug>/status_link` | Deep-link + voice handoff to official portal |
| POST | `/eligibility/check` | One scheme → verdict + DeepSeek voice reply |
| POST | `/eligibility/scan` | All schemes → ranked list (eligible → partial → ineligible) |
| GET | `/alerts` | Recent PIB scheme announcements |
| POST | `/alerts/poll` | Force-run PIB poller (idempotent) |
| GET | `/locator/kinds` | Office kinds (CSC, post-office, Aadhaar, Jan-Aushadhi…) |
| GET | `/locator` | Nominatim search near `lat,lng,radius_km` |
| POST | `/feedback` | Anonymous up/down + optional note (≤240 chars) |
| GET | `/feedback/summary` | Aggregated counts by feature |
| GET | `/scheduler/status` | APScheduler job state |
| GET | `/freshness` | Last-synced + last-ingest-log per job |

---

## Frontend tabs

Eight features, all production-live, no "coming soon" stubs:

1. **🎯 Eligibility** — pick or speak a scheme → rule-engine verdict + DeepSeek voice reply.
2. **📚 Schemes** — search + category filter over the 30-row catalog.
3. **📑 Checklist** — per-scheme document tickbox (state in localStorage).
4. **📝 Form Helper** — voice-guided fill, auto-fills from saved profile, prints a CSC summary.
5. **🔔 Alerts** — PIB feed, browser Notification API opt-in, "force-poll PIB now" button.
6. **🔍 Track Status** — honest deep-link handoff to the official scheme portal.
7. **📍 Nearby Office** — Nominatim + Google Maps fallback for CSC, post-office, Aadhaar, ration, Jan-Aushadhi, panchayat, bank, police.
8. **📂 Documents** — local file picker (no upload), expiry tracker w/ 90/30/7-day alerts, DigiLocker handoff link.
9. **👤 Profile** — age, gender, income, state, occupation, caste, landholding, BPL, SECC, disability — stored in `localStorage` only.

Always-visible:
- Disclaimer bar (sticky top).
- Six-button accessibility plugin toolbar (read-aloud, captions, voice-in, icons, sign, call-support) + language toggle.
- Footer with the 6-line privacy promise + freshness link.

One-time onboarding modal (5 steps): welcome → plugins → terms → pledge → profile + final consent. State persisted via `chitti.gov.onboarded`.

---

## Eligibility rule-engine semantics

`services/government_eligibility.py::evaluate(scheme, profile)` returns:

```jsonc
{
  "verdict": "eligible | partial | ineligible | unknown",
  "rules": [
    { "rule": "age", "label": "Age >= 18", "verdict": "pass | fail | unknown" },
    /* one entry per constrained predicate */
  ],
  "exclusions": [ "income-tax payer", "..." ],
  "scheme_slug": "pm-kisan",
  /* + scheme metadata */
}
```

Predicate vocabulary: `age_min/age_max`, `gender`, `income_max_annual_inr`,
`bpl_required`, `secc_deprivation_required`, `occupation[]`,
`landholding_min_ha/landholding_max_ha`, `caste[]`, `disability_required`,
`rural_urban`, plus a free-text `exclusions[]` list rendered to the user.

Aggregation: ANY `fail` → ineligible. ALL `pass` → eligible. ELSE if any
`unknown` → partial. ELSE eligible.

Why pure-Python: deterministic verdicts the user can dispute. The DeepSeek
explainer wraps the verdict in a 80-120-word spoken summary but cannot
overrule it.

---

## External-data honesty ledger

| Source | v1 status | Reason |
| --- | --- | --- |
| PIB RSS (10 feeds) | ✅ live | Public XML, real UA, no key |
| MyScheme.gov.in | 🟡 deep-link | No public API; partner-only. Catalog seeded from curated 30-row list |
| DigiLocker API | 🔴 deferred | Partner registration gated to GST/incorporated entities; UI uses honest local-upload flow |
| Status APIs | 🔴 deep-link only | No public API exists for any of PM-Kisan / PMAY / PMJAY / MGNREGA |
| CSC locator | ✅ Nominatim + Google Maps | Official locator does not expose an API |
| Geocoding | ✅ Nominatim | 1 req/s policy honoured (250 ms server sleep) |

This is the spec the no-coming-soon rule audits against — every feature
is shipped at the highest fidelity the public API surface allows. When
DigiLocker partner approval lands the local-upload flow becomes a
one-tap fetch without any UI rework.

---

## Deploy

1. Push to `main`. Render Blueprint at `chitti-government/render.yaml`
   creates the `chitti-government-api` web service on first sync.
2. In the Render dashboard set:
   - `DATABASE_URL` — same Supabase URL used by chitti-shares + chitti-medupi.
   - `DEEPSEEK_API_KEY` — optional; rule-engine fallback ships when missing.
3. First boot creates `government` schema, the 4 tables, and seeds 30
   schemes. APScheduler kicks off the first PIB poll 45 s later.
4. Add the row to [`index.html`](index.html) (already done in this
   commit) so users find it from the home page.

Health: <https://chitti-government-api-production.up.railway.app/health>
Freshness: <https://chitti-government-api-production.up.railway.app/api/government/freshness>

---

## Future ramp (post-v1)

- DigiLocker partner registration (Setu / Signzy aggregator route as the
  fast path while waiting for direct partner status).
- MyScheme nightly scrape into `schemes` (sitemap-driven; HF dataset for
  cold-start backfill of ~2,300 rows).
- State-wise CSC list ingest from `data.gov.in` (free key, no GST gate).
- Bhashini / AI4Bharat handoff for non-EN/HI voice output (the four-user
  contract holds; Voice Factory wires this in).
