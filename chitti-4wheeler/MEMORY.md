🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# MEMORY — COSDF L9 · Digital Vehicle Twin

**COSDF Level 9 ([../CHITTI_MECHANIC_COSDF.md](../CHITTI_MECHANIC_COSDF.md) §L9) applied to Chitti
Car Doctor.** This file is the **index + contract** for Chitti's cross-session memory of a driver's
car. It does not duplicate the detail docs — it points to them and pins the platform locks.

> Chitti doesn't just answer the question in front of it. It keeps a **living digital twin** of every
> car in the driver's garage — so it can *predict* the failure three days before it strands the family
> on a highway, recognise a repeat fault ("3rd time this month"), and grow a permanent service history
> that becomes a resale Trust Score. Car repairs are bigger-ticket than bikes — one avoided ₹35k AC
> compressor swap is a month's salary saved. The twin lives **on the device**, is **user-owned**, and
> never reaches the server except as anonymised aggregates ([SAHAYAI_MASTER.md §2b](../SAHAYAI_MASTER.md)).

## The two memory surfaces (index — detail lives in `memory/`)

| Surface | Purpose | Detail doc | Store |
|---|---|---|---|
| **Vehicle Twin** | living state of each car → drives **prediction** & primes the swarm as prior evidence | [memory/vehicle_twin.md](memory/vehicle_twin.md) | IndexedDB `chitti_4w_twin`, store `vehicles` keyed by `vehicle_id` |
| **Vehicle Health Passport** | append-only, tamper-evident history of every service/repair/invoice → **resale Trust Score** | [memory/vehicle_health_passport.md](memory/vehicle_health_passport.md) | IndexedDB `chitti_4w_passport`, append-only store `events` |

The machine-readable per-vehicle shape lives in
**[memory/vehicle_twin_schema.json](memory/vehicle_twin_schema.json)** (the COSDF L9 schema, adapted to
the platform §2b on-device / user-owned / "Chitti forget" contract). Authoritative profile fields mirror
`CarProfile` in [backend/routes/wheels.py](backend/routes/wheels.py) (`brand · model · year · fuel · tx ·
odo · reg`).

## What COSDF L9 asks the twin to hold (mapped to our schema)

| COSDF L9 field | Our twin field(s) | Notes |
|---|---|---|
| `id`, `make/model/year/type` | `vehicle_id`, `make`, `model`, `year`, `type` | `type` ∈ hatchback / sedan / suv / muv / ev_4w |
| `odometer`, `last_service` | `odometer{km, km_per_day}`, `last_service{}` | odo rolls from fuel/trip logs |
| `maintenance_history[]` | Passport `events[]` of `type: service` | append-only ([passport](memory/vehicle_health_passport.md)) |
| `repair_history[]` | Passport `events[]` of `type: repair` | each carries a fair-price band check |
| `component_status{}` (health %) | `component_status{battery, tyres, brake_pads, engine_oil, coolant, brake_fluid}` | 0–100 health per part |
| `fault_history[]` | `fault_history[]` (predicted + verified) | feeds [verification loop](observability/mechanic_verification_loop.md) |
| `user_preferences{}` | `user_preferences{garage, budget_tier, language, accessibility_mode}` | drives DIY tier + modality |

## What the twin powers
- **Predictive maintenance (F9, [PRD.md](PRD.md)):** "12V battery 3.8 yr in Indian heat → High failure
  risk, ~3–5 months", "diesel + mostly short city trips → DPF clog risk rising — take one long drive a
  month", "coolant 2.5 yr + summer → flush due before overheat". Always a **Likely/Possible + confidence
  band** — never "your battery WILL die on date X"
  ([guardrails/never-claim-certainty.md](guardrails/never-claim-certainty.md)).
- **Swarm prior evidence:** a 4-year-old 12V battery raises the [Electrical Agent](swarm/electrical-agent.md)
  weight; a diesel + short-trip profile raises DPF weight; a fresh battery lowers it. This is what lets
  Chitti say "Likely alternator — High" instead of guessing.
- **Repeat-fault recognition:** "yeh teesri baar is mahine — pakka root cause dhoondhna hai."
- **EV (Tata Nexon EV) state-of-health:** charge-cycle + range trend on-device → "thand mein range girti
  hai — yeh normal, pack theek hai" (NOT pack failure). HV cells are **never** a DIY surface.
- **Resale Trust Score (Passport):** India's used-car market is ≈1.4× the new-car market — a full Chitti
  history makes an honest seller's car worth more, and feeds the 100-point used-car inspection
  ([sop/used-car-inspection.md](sop/used-car-inspection.md)) and the Resale advisor.
- **Vehicle Health Score (F10):** 0–100 composite (engine 30 / brakes 20 / tyres 15 / electrical 15 /
  fluids 10 / body 10) — **roadmap**, extends the Passport Trust Score; not yet computed, not claimed.

## Platform locks on memory (LOCKED — §2b)
- **On-device first.** The twin and passport live in IndexedDB on the driver's phone. Nothing about a
  specific car, plate, or location leaves the device.
- **User-owned.** The driver owns every byte. They choose to share a read-only resale card; it is never
  auto-uploaded or sold.
- **"Chitti forget"** (voice or button) wipes the twin + passport and tombstones any anonymised
  aggregate. See [memory/vehicle_twin.md §Forget](memory/vehicle_twin.md) and
  [memory/vehicle_health_passport.md §Privacy](memory/vehicle_health_passport.md).
- **Anonymised aggregates only.** Only the tuple {predicted, actual, cost-band} — with no identity, no
  plate, no GPS — may leave, and only via the [verification loop](observability/mechanic_verification_loop.md),
  feeding Swarm Intelligence ([§2f](../SAHAYAI_MASTER.md)).
- **Multi-vehicle households** share with [Family Fleet (C22)](skills/FEATURES.md) — a shared
  `family_fleet` table spans both [chitti-2wheeler](../chitti-2wheeler/) and 4W, on-device.
- **DeepSeek-only:** any LLM use over twin context routes through DeepSeek (the on-device ML predictor
  is **roadmap** — today's predictions are deterministic age/interval rules).

## Status
🟡 **YELLOW** — schema + contract authored; the twin/passport IndexedDB stores ride the
`chitti_a11y.js` substrate + `chitti_4wheeler.html`. The ML failure-predictor (F9 advanced) and the
0–100 Vehicle Health Score (F10) are **COMING SOON / roadmap** — deterministic age-and-interval
prediction is LIVE; the learned predictor is funding-gated ([../CHITTI_MECHANIC_COSDF.md §L9](../CHITTI_MECHANIC_COSDF.md)).
No predictive number is printed as measured until the eval run (MECH-4, Sire-gated).

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
