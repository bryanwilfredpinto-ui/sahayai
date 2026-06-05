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

> **Built on COSDF v1.0** — the Complete Operating System Development Framework
> for Chitti Mechanic. See [../CHITTI_MECHANIC_COSDF.md](../CHITTI_MECHANIC_COSDF.md)
> for the 16 canonical LEVELs (L0 Constitution → L15 World-Class Features) this
> product's doc set, swarm, SOPs and evals implement.

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

## Document map (COSDF v1.0 — full doc set)

Every doc below maps to a COSDF LEVEL in
[../CHITTI_MECHANIC_COSDF.md](../CHITTI_MECHANIC_COSDF.md).

| COSDF LEVEL | Area | File(s) |
|---|---|---|
| L0 Constitution | Role / charter | [ROLE.md](ROLE.md) |
| L1 Vision | Product vision | [PRODUCT_VISION.md](PRODUCT_VISION.md) |
| L2 Personas | Users (P1–P10 + 4-user floor) | [PERSONAS.md](PERSONAS.md) |
| L3 Success metrics | Targets (unmeasured until eval run) | [SUCCESS_METRICS.md](SUCCESS_METRICS.md) |
| L4 PRD | Features F0–F12 | [PRD.md](PRD.md) · [ARCHITECTURE.md](ARCHITECTURE.md) |
| L5 Skills | Capability files | [SKILLS.md](SKILLS.md) · [skills/](skills/) (engine · electrical · brakes · tyres · cooling · transmission + more) · [skills/FEATURES.md](skills/FEATURES.md) · [skills/MECHANIC_KNOWLEDGE.md](skills/MECHANIC_KNOWLEDGE.md) |
| L6 Swarm | 8-agent pipeline | [swarm/agents.yaml](swarm/agents.yaml) · [swarm/](swarm/) (engine · electrical · fuel · symptom · safety[VETO] · diy · cost · trust) |
| L7 SOPs | Decision-tree runbooks | [sop/](sop/) — [not_starting.md](sop/not_starting.md) (SOP-001) · [brake_noise.md](sop/brake_noise.md) (SOP-002) · [overheating.md](sop/overheating.md) (SOP-003) · [smoke_color.md](sop/smoke_color.md) (SOP-004) · [used_inspection.md](sop/used_inspection.md) (SOP-005) · [emergency.md](sop/emergency.md) (SOP-006) · plus [breakdown-roadside](sop/breakdown-roadside.md) · [dashboard-warning-light](sop/dashboard-warning-light.md) · [used-bike-inspection](sop/used-bike-inspection.md) · [diy-repair-coach](sop/diy-repair-coach.md) · [preventive-maintenance](sop/preventive-maintenance.md) · [scam-quote-check](sop/scam-quote-check.md) · [accessibility-diagnosis](sop/accessibility-diagnosis.md) |
| L8 Guardrails | P0/P1/P2 rules | [GUARDRAILS.md](GUARDRAILS.md) · [guardrails/](guardrails/) (emergency-protocol · safety-rules · diy-safety · never-claim-certainty · scam-shield-rules) |
| L9 Memory | Digital Vehicle Twin | [MEMORY.md](MEMORY.md) · [memory/](memory/) (vehicle_twin · vehicle_twin_schema.json · vehicle_health_passport) |
| L10 Observability | Metrics + verification loop | [OBSERVABILITY.md](OBSERVABILITY.md) · [observability/](observability/) |
| L11 Evals | Gold-set tests | [EVALS.md](EVALS.md) · [evals/](evals/) (diagnostic_accuracy · safety_eval · accessibility_eval · hallucination_eval · cost_accuracy · sound_eval · diy_safety_eval) |
| L12 Accessibility | Modality matrix | [ACCESSIBILITY.md](ACCESSIBILITY.md) · [accessibility/](accessibility/) |
| L13 Quality gates | 10 ship gates | [QUALITY.md](QUALITY.md) |
| L14 Certification | Pre-release scorecard | [CERTIFICATION.md](CERTIFICATION.md) |
| L15 World-class features | Ambition layer | [WORLD_CLASS_FEATURES.md](WORLD_CLASS_FEATURES.md) |
| — Operating profile | 7-field SOP | [SOP.md](SOP.md) · [../CHITTI_SOP.md §12](../CHITTI_SOP.md) |
| — Real backend | Parity + deterministic routes | [backend/routes/wheels.py](backend/routes/wheels.py) |
| — Sibling | Car Doctor (shared family fleet) | [chitti-4wheeler/](../chitti-4wheeler/) |

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
