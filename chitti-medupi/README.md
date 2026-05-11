# Chitti MedUPI

> "UPI for your medicine bills — Scan. Compare. Save."

**Medicine Cost Intelligence** for Indian families. The third Chitti product (sister to Chitti Technical + Chitti Fundamentals + Chitti News). A neutral price-and-composition intelligence layer that turns the chaos of branded vs generic pricing into one scan, one number, one saved rupee.

---

## What it does (the one-sentence pitch per feature)

| Pillar | What it does |
|---|---|
| **Strict same-composition matching** | Returns alternatives ONLY where *same molecule + same strength + same dosage form*. No therapeutic substitutions. EVER. |
| **Jan Aushadhi pricing** | Official `jan_aushadhi_price` surfaced on every match — typically 50–90% off branded MRP. Nearest store via haversine geo + by-state fallback. |
| **Cart simulator** | Drop a monthly med list, get the cheapest same-composition equivalent cart + monthly + annual savings + per-line risk badge. |
| **Family wallet** | Multi-profile (self / spouse / child / parent) wallet entries → this-month spend + savings + 12-month total + annual projection. |
| **Insurance match** | Therapeutic-class coverage check across Ayushman Bharat · CGHS · ESI · private — with `covered` boolean + EN/HI reason text. |
| **Live pharmacy snippets** | Brave Search-powered snippet-only price discovery for 1mg / PharmEasy / NetMeds / Apollo / MedPlus / TrueMeds. Never visits the URL. |
| **Community prices** | User-reported "I bought X for ₹Y at <pharmacy> in <city>" with median + IQR + by-city aggregation. |
| **Risk classification** | Every molecule is H / M / L. HIGH-risk categories (antibiotics, cardiac, diabetes, psych meds) get a red banner + stop-and-think warning before any alternative shows. |
| **Refill / expiry reminders** | CRUD per family profile. Browser-push wiring + Twilio voice + WhatsApp planned. |
| **QR scanner** | Decodes CDSCO traceability QR + GS1 Datamatrix on Indian medicine packs (since 2023). |
| **Demo mode** | 8-step guided walk-through honouring the four-user contract (Blind reads aloud · Deaf reads banner · Mute uses Next · Illiterate sees real UI moves). |

---

## Live deployment

| Surface | URL | Status |
|---|---|---|
| Frontend | https://sahayai.in/chitti_medupi.html | Live |
| Backend API | https://chitti-medupi-api.onrender.com | Live (Flask + gunicorn on Render free tier) |
| Database | Neon Postgres — `neondb` on `ep-delicate-violet-aqny59zg-pooler.c-8.us-east-1.aws.neon.tech` | Live, **211,207 rows in `medupi.medicines`** from Apollo Pharmacy dataset |
| Schema isolation | All tables under `medupi.*` schema | Shared host with Chitti Shares (which lives under `shares.*`) |

---

## Layout

```
chitti-medupi/
├── frontend/            Single-file HTML SPA (mirror of workspace-root chitti_medupi.html)
├── backend/
│   ├── main.py          Flask app factory + bootstrap (ensure_schema → create_all → migrate → seed → scheduler)
│   ├── config.py        Env-driven settings (no pydantic)
│   ├── database.py      SQLAlchemy engine + SessionLocal + Base
│   ├── models/          9 tables: medicine, jan_aushadhi, family, wallet, reminder,
│   │                              price_cache, community_price, search_log, loader_run
│   ├── services/        Strict matcher, risk engine, Jan Aushadhi geo,
│   │                    Anthropic vision, family wallet, reminders, insurance,
│   │                    Brave Search, community prices, search-frequency log,
│   │                    price freshness, scheduler, migrations
│   ├── routes/
│   │   └── medupi.py    20+ endpoints under /api/medupi/*
│   ├── scripts/         Real-data loaders (Jan Aushadhi · NPPA · CDSCO · Kaggle · RxNorm · OpenFDA · Apollo one-shot)
│   ├── data/            seed JSON (51 meds + 25 stores + insurance coverage)
│   ├── requirements.txt Flask · SQLAlchemy · APScheduler · Anthropic · rapidfuzz
│   └── runtime.txt      python-3.11
└── render.yaml          Blueprint
```

---

## Quick start (local)

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env       # set DATABASE_URL (Neon) + ANTHROPIC_API_KEY for image scan
python main.py             # http://localhost:8001
```

Verify:
```bash
curl 'http://localhost:8001/api/medupi/medicine/Crocin%20650'
curl 'http://localhost:8001/api/medupi/jan_aushadhi?lat=23.26&lng=77.41'
curl 'http://localhost:8001/api/medupi/risk/Metformin'
```

---

## The non-negotiables

1. **STRICT matching only** — `services/medupi_alternatives.py` returns same-molecule + same-strength + same-dosage-form matches. The rule is repeated three times in [CHITTI_MEDUPI_MASTER_SPEC.md](../CHITTI_MEDUPI_MASTER_SPEC.md) §5, §12, §14.
2. **Medical disclaimer always visible** — sticky amber banner at the top of every page + full Gold Standard modal text. Hindi version auto-rendered when `_chittiLang === 'hi'`.
3. **Risk classification BEFORE alternatives** — every response carries `risk: {class, symbol, label_en, label_hi, warning_en, warning_hi}`. Frontend gates the UI: red banner for HIGH, amber for MEDIUM, green for LOW.
4. **Four-user contract** — every control has aria-label · 🔊 speak · plain-English caption · 🎤 voice input. Blind/Deaf/Mute/Illiterate all usable.
5. **Zero scraping of pharmacy sites** — Brave Search snippets only. We never visit 1mg/PharmEasy/NetMeds/Apollo URLs programmatically.

---

## Documentation set

| File | What it covers |
|---|---|
| [README.md](README.md) | This file — overview, deployment, quick start |
| [CONTEXT.md](CONTEXT.md) | Why MedUPI exists, four-user contract, strict-match guardrail |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Backend stack, boot order, schema isolation, scheduler |
| [API.md](API.md) | Every HTTP endpoint with request/response |
| [DATABASE.md](DATABASE.md) | All 9 tables under `medupi.*` — columns, indexes, the unique constraint |
| [CHANGELOG.md](CHANGELOG.md) | Phase-grouped git history |
| [TODO.md](TODO.md) | Outstanding work + the Anthropic → DeepSeek vision migration |
| [PROMPTS.md](PROMPTS.md) | The verbatim vision-extraction prompt |
| [../CHITTI_MEDUPI_MASTER_SPEC.md](../CHITTI_MEDUPI_MASTER_SPEC.md) | Living spec — read first every session |
