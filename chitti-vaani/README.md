🎖️ **World Class Chitti Vaani — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

> One dost. Every capability. One conversation.

| Field | Value |
|---|---|
| Live URL | https://sahayai.in/chitti_vaani.html |
| Health | https://chitti-vaani-api-production.up.railway.app/health |
| Status | 🟡 YELLOW — health unverified today |
| 4 Users | 👁️ Blind · 🦻 Deaf · 🤫 Mute · 📖 Illiterate — all served via voice-first |
| Languages | 9 first-class · 26 via Voice Factory cascade |
| Companion docs | [SKILLS.md](SKILLS.md) · [SOP.md](SOP.md) · [CHITTI_SOP.md §1](../CHITTI_SOP.md) |

---

# Chitti Vaani

Voice-first conversational guide for Bharat — built around the **four-user accessibility contract** (blind / deaf / mute / illiterate / elderly). Tap mic, speak, get a DeepSeek-powered reply that the phone reads aloud in the user's language. Phase 1 is deployed on Railway as a Flask backend + static HTML frontend; Phase 2 is the Android client that adds OS-level capabilities (lock screen, call screening, on-device emergency keyword spotting).

## What ships today (Phase 1 / 1.5 / 1.6)

| Capability | Status | Where it lives |
|---|---|---|
| Voice in / voice out, 9 Indian languages | Live | [vaani.py](backend/routes/vaani.py) + Web Speech API on frontend |
| DeepSeek-powered conversational replies (`mode = ask` / `call` / `read` / `translate`) | Live | [vaani_service.py](backend/services/vaani_service.py) |
| "Send email as Chitti" — Gmail OAuth + send-as-user with the Chitti AI signature | Live | [email.py](backend/routes/email.py) + [email_service.py](backend/services/email_service.py) + [email_db.py](backend/services/email_db.py) |
| 24/7 emergency cascade — family only, never cops; Chitti-to-Chitti relay across paired devices | Live | [emergency.py](backend/routes/emergency.py) + [emergency_service.py](backend/services/emergency_service.py) + [relay_db.py](backend/services/relay_db.py) |
| WhatsApp / UPI / `tel:` deep-link pro actions | Frontend | `chitti_vaani.html` |
| Order & book — Chitti business directory first (Zomato / Swiggy / Ola / Uber / Rapido / BookMyShow / IRCTC / BigBasket / Blinkit fallback) | Live | [local.py](backend/routes/local.py) + [local_chitti_service.py](backend/services/local_chitti_service.py) + `chitti_vaani.html` |
| Federated voice-sample collection (opt-in IndexedDB) | Frontend | `chitti_vaani.html` |
| Cross-product feedback widget (`/api/feedback/collect`) | Live | [feedback.py](backend/routes/feedback.py) + [feedback_db.py](backend/services/feedback_db.py) |
| Sahay AI Admin Dashboard (product Gmail OAuth + monthly keep-alive) | Live (WIP) | [admin.py](backend/routes/admin.py) + [admin_db.py](backend/services/admin_db.py) + [admin_oauth.py](backend/services/admin_oauth.py) + [admin_scheduler.py](backend/services/admin_scheduler.py) |
| Phone lock / silent toggle / call screening / on-device keyword spotting | Spec only — Phase 2 | `CHITTI_VAANI_PHASE2_ANDROID_SPEC.md` at repo root |

## Languages supported by `/api/vaani/languages`

`hi`, `en`, `ta`, `te`, `bn`, `mr`, `gu`, `kn`, `ml`. The Vaani frontend can target 26 languages via the shared Chitti Voice Factory substrate; the conversational API exposes 9 first-class names. Anything else falls through to the language code passed in.

## Run locally

```bash
cd backend
pip install -r requirements.txt
GEMINI_API_KEY=... python main.py   # http://127.0.0.1:8003
```

Open `../frontend/index.html?api=http://127.0.0.1:8003` (or any of the `chitti_vaani.html` siblings at repo root that point to this API).

## Deploy

[`render.yaml`](render.yaml) is a Railway Blueprint. Push the repo, "New → Blueprint" on Railway, set `DEEPSEEK_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_SECRET`, `ADMIN_DATABASE_URL`, and `FEEDBACK_IP_SALT` in the dashboard.

## Endpoints (full surface)

- `GET  /` — service banner
- `GET  /health` — liveness
- `POST /api/vaani/ask` — `{text, language?, mode?}` → `{ok, reply, source, language, model, tokens}`
- `GET  /api/vaani/health`
- `GET  /api/vaani/languages`
- `/api/vaani/email/*` — Gmail OAuth + send-as-user (status / auth/start / auth/callback / send / disconnect)
- `/api/vaani/emergency/*` — trigger / check-in / pair/issue / pair/accept / pair/unpair / pair/list / poll
- `/api/vaani/local/*` — Chitti business directory lookup (`nearby?service=` + `categories`) — the "Order & book" cards consult this before opening any external app
- `/api/admin/products/*` — product Gmail dashboard backend (gated by `ADMIN_SECRET`)
- `/api/feedback/*` — cross-product feedback collect + admin report

See [API.md](API.md) for the full method × path × body table.

## Consent gate

Every feature is locked behind a 6-section T&C modal in `chitti_vaani.html`. Acceptance lives in `localStorage.chitti_vaani_consent_given`. Each section has a speaker button that reads it in the user's language. Per the master memory, the SEBI banner and full legal modal stay sticky on every Chitti page.

## Companion docs in this folder

- [CONTEXT.md](CONTEXT.md) — why Vaani exists, the four-user contract, emergency-keyword protocol
- [ARCHITECTURE.md](ARCHITECTURE.md) — backend layout, Phase 1 vs Phase 2 split, admin panel
- [CHANGELOG.md](CHANGELOG.md) — commit-ordered shipping history
- [TODO.md](TODO.md) — outstanding Phase 2 + admin/feedback items
- [API.md](API.md) — every endpoint, method, body, response
- [DATABASE.md](DATABASE.md) — SQLite + Postgres schemas
- [PROMPTS.md](PROMPTS.md) — the canonical DeepSeek system prompt and modes
