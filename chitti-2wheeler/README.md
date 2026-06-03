🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# Chitti Bike Doctor (Chitti 2-Wheeler)

**Voice-first digital mechanic companion for every Indian 2-wheeler owner — the
honest layer between the rider and the workshop. Children to seniors, every income
group, including blind, deaf, mute and illiterate riders.**

> *"My bike has a problem — do I really need a mechanic, or can I fix it myself,
> and is this quote fair?"* — that one question, answered by voice, for 22 crore
> bikes.

## What I do

- **Diagnose by symptom, sound, photo or dashboard** — describe it, record it, or
  show it; I tell you what's wrong with the six fields: Why · Severity · Can-I-drive
  · DIY-or-not · Cost band · Alternatives.
- **Never claim certainty** — I speak in *Likely / Possible* and *High / Medium /
  Low* confidence, and show the weighted vote (*"Battery 85% / Starter 10% / Fuel 5%"*).
- **Catch overcharges** — show me the quote; I give the fair band and a Fair / High / Scam verdict.
- **Coach safe DIY** — for the 🟢/🟡 jobs, step-by-step with tools, time, difficulty
  and the saving. I **never** coach a 🟠/🔴 brake/fuel/steering job — that goes to a human.
- **Remember your bike** — a vehicle twin that predicts what fails next.
- **Keep you safe** — breakdown coach + family-cascade SOS. I **never** auto-dial cops.

Full capability surface: [skills/FEATURES.md](skills/FEATURES.md).

## Who I serve (always the 4 users)

| User | Challenge | How Chitti Bike Doctor serves them |
|------|-----------|-------------------------------------|
| 👁️ Blind | Cannot see UI / dashboard | "Chitti, mera dashboard padho" reads every warning light; diagnose by engine sound |
| 🦻 Deaf | Cannot hear | Visual severity cards + text + ISL; Sound Doctor shows a waveform, never audio-only |
| 🤫 Mute | Cannot speak | Photograph the leak / dashboard / bill — full diagnosis by tap + photo |
| 📖 Illiterate | Cannot read | Voice-everything, picture-icon menus, 2G-ready |

## How it works

- **Interface:** reached through **Chitti Vaani** (sole user surface).
  `chitti_2wheeler.html` is the dev/debug + parity page.
- **Reasoning:** **DeepSeek** only, via `chitti-vaani-api` `POST /api/vaani/ask`
  (canonical) and `chitti-2wheeler-api` `/api/2w/*` (parity + deterministic routes).
- **Swarm:** 8 agents vote before any diagnosis shows (Symptom, Engine, Electrical,
  Fuel, Safety, DIY, Cost, Trust). Safety can only *lower* the can-I-drive
  confidence; Trust prevents over-diagnosis.
- **Two modes:** Mode 1 (no device — voice/photo/sound/dashboard) serves the 90%;
  Mode 2 (OBD2 / ELM327 Web-Bluetooth) is an additive power-up.
- **Privacy:** photos and audio are processed on-device and **never** leave it —
  only short text descriptions reach the model. DPDP Act 2023 compliant.

## Live URL

- Page: `https://sahayai.in/chitti_2wheeler.html`
- Canonical: routed via `https://sahayai.in/chitti_vaani.html`

## Health endpoint

- `https://chitti-2wheeler-api-production.up.railway.app/health`

## Status

🟡 **YELLOW** — full C2WOS operating-system doc set (ROLE / VISION / PERSONAS /
SUCCESS_METRICS / PRD / ARCHITECTURE) authored 2026-06-03; production functional
cert pending next deploy. Substrate 5-gate inherited 🟢. **Turso env blocked on
Sire** — `chitti-2wheeler-api` runs on the local SQLite fallback until
`DATABASE_URL` (libsql:// composed form) is set on Railway (see
[ARCHITECTURE.md §env-blocker](ARCHITECTURE.md)).

## Document map

| Area | File(s) |
|---|---|
| Constitution | [ROLE.md](ROLE.md) |
| Vision / metrics | [PRODUCT_VISION.md](PRODUCT_VISION.md) · [SUCCESS_METRICS.md](SUCCESS_METRICS.md) |
| Users | [PERSONAS.md](PERSONAS.md) |
| Spec | [PRD.md](PRD.md) · [ARCHITECTURE.md](ARCHITECTURE.md) |
| Operating profile | [SOP.md](SOP.md) · [../CHITTI_SOP.md §12](../CHITTI_SOP.md) |
| Capabilities | [SKILLS.md](SKILLS.md) · [skills/](skills/) (+ [skills/FEATURES.md](skills/FEATURES.md)) |
| Knowledge corpus | [skills/MECHANIC_KNOWLEDGE.md](skills/MECHANIC_KNOWLEDGE.md) |
| Voting agents | [swarm/](swarm/) |
| Tests | [evals/](evals/) |
| Real backend | [backend/routes/wheels.py](backend/routes/wheels.py) |
| Sibling | [chitti-4wheeler/](../chitti-4wheeler/) (Car Doctor — shared family fleet) |

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
