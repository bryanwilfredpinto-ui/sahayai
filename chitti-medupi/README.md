# Chitti MedUPI

> "UPI for your medicine bills — Scan. Compare. Save."

Third Chitti product. Sister to **Chitti Shares (Technical + Fundamentals)**.

## Layout

```
chitti-medupi/
├── frontend/          Single-file HTML SPA (mirror of workspace-root chitti_medupi.html)
└── backend/           FastAPI service — drug DB · OCR · alternatives · Jan Aushadhi · Family Wallet · Reminders · Insurance
```

Same shape as `chitti-shares/` (sibling folder).

## Live URL
- Frontend: https://sahayai.in/chitti_medupi.html (workspace-root file is what's deployed)
- Backend (planned): https://chitti-medupi-api.onrender.com — currently shares `chitti-shares-api.onrender.com` until scale demands a split.

## Master spec
See [CHITTI_MEDUPI_MASTER_SPEC.md](../CHITTI_MEDUPI_MASTER_SPEC.md) at workspace root — every Claude session must read it first.

## Quick start (backend, local)

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env       # set ANTHROPIC_API_KEY for image scan
uvicorn main:app --reload  # http://localhost:8001
```

Then: `curl 'http://localhost:8001/api/medupi/medicine/Crocin%20650'`

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET  | `/health` | Lightweight check |
| POST | `/api/medupi/scan` | Image / PDF upload → recognised medicine + composition + risk |
| GET  | `/api/medupi/medicine/{name}` | Lookup by name → composition + alternatives |
| GET  | `/api/medupi/alternatives` | `?molecule=&strength=&dosage_form=` strict same-composition list |
| GET  | `/api/medupi/jan_aushadhi` | `?lat=&lng=&radius_km=5` nearest stores |
| GET  | `/api/medupi/risk/{molecule}` | HIGH / MEDIUM / LOW classification |
| GET  | `/api/medupi/insurance/{molecule}` | `?scheme=ayushman` whether covered |
| POST | `/api/medupi/family/profile` | Add a family member profile |
| GET  | `/api/medupi/family/wallet` | Monthly spend + savings |
| POST | `/api/medupi/family/wallet` | Add a wallet entry |
| POST | `/api/medupi/reminder` | Schedule refill / expiry reminder |
| GET  | `/api/medupi/reminder` | List reminders for a profile |

## Build rules
Read CHITTI_MEDUPI_MASTER_SPEC.md §14 — non-negotiable.
