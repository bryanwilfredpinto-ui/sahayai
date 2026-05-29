🎖️ **World Class Chitti PA — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

> *"Jo seva sirf PM ko milti thi — ab har Indian ko milegi. Free. WhatsApp pe. Chitti ke saath."*

| Field | Value |
|---|---|
| Live URL | TBD (Phase 1 WhatsApp MVP launches 2026-05-01) |
| Health | `/health` on `chitti-pa-api` (not yet deployed) |
| Status | 🟡 YELLOW — skeleton, honest 501 stubs, no live deploy |
| 4 Users | 👁️ Blind · 🦻 Deaf · 🤫 Mute · 📖 Illiterate — served via voice-first WhatsApp + Voice Factory cascade |
| Languages | 10 Phase 1: Hindi · Telugu · Tamil · Kannada · Malayalam · Marathi · Bengali · Gujarati · Punjabi · Odia |
| Master spec | [CHITTI_PA_MASTER.md](../CHITTI_PA_MASTER.md) at repo root |
| Companion docs | [SKILLS.md](SKILLS.md) · [SOP.md](SOP.md) · [CHITTI_SOP.md](../CHITTI_SOP.md) |

---

# Chitti PA

The world's first emotionally intelligent Personal Assistant for every Indian — farmer, driver, student, homemaker, professional, elder. **Free. On WhatsApp. In their language. 24/7.** Routed through Chitti Vaani per the [Vaani sole-interface lock](../SAHAYAI_MASTER.md).

This folder is the **backend service skeleton**. The product is defined in
[CHITTI_PA_MASTER.md](../CHITTI_PA_MASTER.md) — 19 features across 6 phases.
Today's scaffold exposes the Phase 1 surface as honest `501 not_implemented`
stubs so the API contract is committed, deployable, and inviting calls from
Vaani / WhatsApp gateway. Each stub graduates to GREEN when its service
ships, never before.

## What ships today

| Capability | Phase | Endpoint | Status |
|---|---|---|---|
| Health | — | `GET /health` | ✅ Live (skeleton) |
| Service banner | — | `GET /` | ✅ Live (skeleton) |
| Morning brief (07:00 IST personalised) | 1 | `POST /api/pa/morning-brief` | 🚧 501 honest stub |
| Call segregation (Personal / Work / Spam / Recruiter) | 1 | `POST /api/pa/calls/segregate` | 🚧 501 honest stub |
| Document vault (on-device, profile-based) | 1 | `GET/POST /api/pa/vault` | 🚧 501 honest stub |
| Govt scheme scanner (delegates to `chitti-government`) | 1 | `POST /api/pa/schemes/scan` | 🚧 501 honest stub |
| Daily-life reminders (medicines · bills · licences · appts) | 1 | `POST /api/pa/dailylife/reminders` | 🚧 501 honest stub |
| Product Truth Engine (delegates to `chitti-scanner` + `chitti-medupi`) | 1 | `POST /api/pa/truth/check` | 🚧 501 honest stub |
| Safety Guardian (SafeWalk + UPI fraud + elder shield) | 1 | `POST /api/pa/safety/sos` | 🚧 501 honest stub |
| "Chitti forget" — DPDP Act 2023 erase | — | `POST /api/pa/forget` | 🚧 501 honest stub |

## Locked rules (from [CHITTI_PA_MASTER.md](../CHITTI_PA_MASTER.md))

- **Postman Principle** — Chitti never reads / stores / analyses private data passed between users. Sealed letter only.
- **Language auto-detect** — never force Hindi on non-Hindi users.
- **Permission first** — always asks before any action.
- **Data on user's phone** — documents stored on USER'S PHONE ONLY.
- **Free forever** — free tier always fully functional; no ads ever.
- **Postman Principle is absolute** — no exceptions.

## Run locally

```bash
cd backend
pip install -r requirements.txt
gunicorn main:app --bind 0.0.0.0:8011 --workers 2 --timeout 60
# or for dev: python main.py
curl -s http://127.0.0.1:8011/health
# {"ok": true}
```

## Deploy

`railway.json` declares the build + healthcheck. Procfile gives the Render/Heroku-style start command. Both target Python 3.11.

```bash
# from chitti-pa/backend
railway up
```

CTO owns deploy per [CTO.md Authority](../chitti-cto/CTO.md). Set `DATABASE_URL` to a real `libsql://<db>-<org>.<region>.turso.io?authToken=<jwt>` once the Turso DB is provisioned — the skeleton falls back to local SQLite until then.

---

**World Class Chitti PA — Commando Discipline. Zero Excuses.**
