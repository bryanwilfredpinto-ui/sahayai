🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# Chitti Car Doctor (Chitti 4-Wheeler)

**Voice-first digital mechanic companion for every Indian car owner — the honest
layer between the owner and the service centre. Family-car owners to taxi drivers
to fleet managers, every income group, including blind, deaf, mute and illiterate
drivers.**

> *"My car has a problem — do I really need a service centre, can I fix it myself,
> and is this quote fair?"* — that one question, answered by voice, across Petrol,
> Diesel, EV and Hybrid.

## What I do

- **Diagnose by symptom, sound, photo, dashboard or OBD2** — describe it, record
  it, show it, or plug in a ₹400 reader; I tell you what's wrong with the six
  fields: Why · Severity · Can-I-drive · DIY-or-not · Cost band · Alternatives.
- **Never claim certainty** — I speak in *Likely / Possible* and *High / Medium /
  Low* confidence, and show the weighted vote (*"Misfire 80% / Coil 12% / Fuel 8%"*).
- **Catch overcharges** — show me the quote; I give the fair band and a Fair / High
  / Scam verdict. (*"AC compressor ₹35 000? Fair band ₹18-24k — pehle ₹2 000 ka gas check."*)
- **Coach safe DIY** — for the 🟢/🟡 jobs, step-by-step with tools, time, difficulty
  and the saving. I **never** coach a 🟠/🔴 brake / fuel / airbag / HV-EV job — that goes to a human.
- **Read your OBD2 codes** — every car since 2010 has the port; I decode P-codes,
  live coolant/RPM/fuel-trim and the freeze-frame, in Hinglish.
- **Remember your car** — a vehicle twin that predicts what fails next.
- **Inspect used cars** — a 100-point pre-purchase inspection for the *buyer*.
- **Keep you safe** — breakdown coach + family-cascade SOS. I **never** auto-dial cops.

Full capability surface: [skills/FEATURES.md](skills/FEATURES.md).

## Who I serve (always the 4 users)

| User | Challenge | How Chitti Car Doctor serves them |
|------|-----------|-------------------------------------|
| 👁️ Blind | Cannot see UI / dashboard | "Chitti, mera dashboard padho" reads every warning light; diagnose by engine sound |
| 🦻 Deaf | Cannot hear | Visual severity cards + text + ISL; Sound Doctor shows a waveform, never audio-only |
| 🤫 Mute | Cannot speak | Photograph the leak / dashboard / bill — full diagnosis by tap + photo |
| 📖 Illiterate | Cannot read | Voice-everything, picture-icon menus, 2G-ready |

## How it works

- **Interface:** reached through **Chitti Vaani** (sole user surface).
  `chitti_4wheeler.html` is the dev/debug + parity page.
- **Reasoning:** **DeepSeek** only, via `chitti-vaani-api` `POST /api/vaani/ask`
  (canonical) and `chitti-4wheeler-api` `/api/4w/*` (parity + deterministic routes).
- **Swarm:** 8 agents vote before any diagnosis shows (Symptom, Engine, Electrical,
  Fuel, Safety, DIY, Cost, Trust). Safety can only *lower* the can-I-drive
  confidence; Trust prevents over-diagnosis.
- **Two modes:** Mode 1 (no device — voice/photo/sound/dashboard) serves everyone;
  Mode 2 (OBD2 / ELM327 Web-Bluetooth) is **first-class for cars** — every car
  since 2010 has the port; standard DTC P-codes, live PIDs, freeze-frame.
- **Privacy:** photos, audio and OBD2 streams are processed on-device and **never**
  leave it — only short text descriptions reach the model. DPDP Act 2023 compliant.

## Live URL

- Page: `https://sahayai.in/chitti_4wheeler.html`
- Canonical: routed via `https://sahayai.in/chitti_vaani.html`

## Health endpoint

- `chitti-4wheeler-api` `/health`

## Status

🟡 **YELLOW** — full C4WOS operating-system doc set (ROLE / VISION / PERSONAS /
SUCCESS_METRICS / PRD / ARCHITECTURE / SOP / SKILLS) + CQOS layers authored
2026-06-03; production functional cert pending next deploy. Substrate 5-gate
inherited 🟢. **Turso env blocked on Sire** — `chitti-4wheeler-api` runs on the
local SQLite fallback until `DATABASE_URL` (libsql:// composed form) is set (see
[ARCHITECTURE.md §env-blocker](ARCHITECTURE.md), QUALITY_STATUS 2026-05-29).

## Document map

**Built on COSDF v1.0 — see [../CHITTI_MECHANIC_COSDF.md](../CHITTI_MECHANIC_COSDF.md).**
This doc set is the per-product application of the canonical Complete Operating System
Development Framework; the LEVEL each file realises is noted below.

| COSDF level | Area | File(s) |
|---|---|---|
| L0 | Constitution | [ROLE.md](ROLE.md) |
| L1 | Product vision | [PRODUCT_VISION.md](PRODUCT_VISION.md) |
| L2 | Personas | [PERSONAS.md](PERSONAS.md) |
| L3 | Success metrics | [SUCCESS_METRICS.md](SUCCESS_METRICS.md) |
| L4 | PRD (features F0–F12) | [PRD.md](PRD.md) · [ARCHITECTURE.md](ARCHITECTURE.md) |
| L5 | Skills (capabilities) | [SKILLS.md](SKILLS.md) · [skills/](skills/) (+ [skills/FEATURES.md](skills/FEATURES.md)) · [skills/MECHANIC_KNOWLEDGE.md](skills/MECHANIC_KNOWLEDGE.md) |
| L6 | Swarm (8-agent pipeline) | [swarm/](swarm/) · **[swarm/agents.yaml](swarm/agents.yaml)** (COSDF L6 encoded) · [swarm/README.md](swarm/README.md) |
| L7 | SOPs | [sop/](sop/) — SOP-001 [not_starting.md](sop/not_starting.md) · SOP-002 [brake_noise.md](sop/brake_noise.md) · SOP-003 [overheating.md](sop/overheating.md) · SOP-004 [smoke_color.md](sop/smoke_color.md) · SOP-005 [used_inspection.md](sop/used_inspection.md) · SOP-006 [emergency.md](sop/emergency.md) · plus [breakdown-roadside.md](sop/breakdown-roadside.md), [dashboard-warning-light.md](sop/dashboard-warning-light.md), [diy-repair-coach.md](sop/diy-repair-coach.md), [scam-quote-check.md](sop/scam-quote-check.md), [used-car-inspection.md](sop/used-car-inspection.md) (full 100-point), [preventive-maintenance.md](sop/preventive-maintenance.md), [accessibility-diagnosis.md](sop/accessibility-diagnosis.md) |
| L8 | Guardrails | [GUARDRAILS.md](GUARDRAILS.md) · [guardrails/](guardrails/) |
| L9 | Memory (Vehicle Twin) | [MEMORY.md](MEMORY.md) · [memory/](memory/) (+ [memory/vehicle_twin_schema.json](memory/vehicle_twin_schema.json)) |
| L10 | Observability | [OBSERVABILITY.md](OBSERVABILITY.md) · [observability/](observability/) (+ [observability/metrics.yaml](observability/metrics.yaml)) |
| L11 | Evals | [EVALS.md](EVALS.md) · [evals/](evals/) |
| L12 | Accessibility | [ACCESSIBILITY.md](ACCESSIBILITY.md) · [accessibility/](accessibility/) |
| L13 | Quality gates | [QUALITY.md](QUALITY.md) |
| L14 | Certification | [CERTIFICATION.md](CERTIFICATION.md) |
| L15 | World-class features | [WORLD_CLASS_FEATURES.md](WORLD_CLASS_FEATURES.md) |
| — | Operating profile | [SOP.md](SOP.md) · [../CHITTI_SOP.md](../CHITTI_SOP.md) |
| — | Real backend | [backend/routes/wheels.py](backend/routes/wheels.py) (`/api/4w/*`) |
| — | Sibling | [chitti-2wheeler/](../chitti-2wheeler/) (Bike Doctor — shared family fleet) |

> Subtree dirs (`swarm/` `guardrails/` `evals/` `observability/` `memory/`
> `accessibility/` `sop/` `skills/`) are built by another agent. This doc set
> (the 9 CEOS core files) links them; it does not own them.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
