🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# MEMORY — COSDF L9 · Digital Vehicle Twin

**COSDF Level 9 ([../CHITTI_MECHANIC_COSDF.md](../CHITTI_MECHANIC_COSDF.md) §L9) applied to Chitti
Bike Doctor.** This file is the **index + contract** for Chitti's cross-session memory of a rider's
bike. It does not duplicate the detail docs — it points to them and pins the platform locks.

> Chitti doesn't just answer the question in front of it. It keeps a **living digital twin** of every
> bike in the rider's garage — so it can *predict* the failure three days before it strands them on a
> highway, recognise a repeat fault ("3rd time this month"), and grow a permanent service history that
> becomes a resale Trust Score. The twin lives **on the device**, is **user-owned**, and never reaches
> the server except as anonymised aggregates ([SAHAYAI_MASTER.md §2b](../SAHAYAI_MASTER.md)).

## The two memory surfaces (index — detail lives in `memory/`)

| Surface | Purpose | Detail doc | Store |
|---|---|---|---|
| **Vehicle Twin** | living state of each bike → drives **prediction** & primes the swarm as prior evidence | [memory/vehicle_twin.md](memory/vehicle_twin.md) | IndexedDB `chitti_2w_twin`, store `vehicles` keyed by `vehicle_id` |
| **Vehicle Health Passport** | append-only, tamper-evident history of every service/repair/invoice → **resale Trust Score** | [memory/vehicle_health_passport.md](memory/vehicle_health_passport.md) | IndexedDB `chitti_2w_passport`, append-only store `events` |

The machine-readable per-vehicle shape lives in
**[memory/vehicle_twin_schema.json](memory/vehicle_twin_schema.json)** (the COSDF L9 schema, adapted to
the platform §2b on-device / user-owned / "Chitti forget" contract).

## What COSDF L9 asks the twin to hold (mapped to our schema)

| COSDF L9 field | Our twin field(s) | Notes |
|---|---|---|
| `id`, `make/model/year/type` | `vehicle_id`, `make`, `model`, `year`, `type` | `type` ∈ scooter / motorcycle / moped / EV-2W |
| `odometer`, `last_service` | `odo`, `km_per_day`, `last_service{}` | odo rolls from fuel/trip logs |
| `maintenance_history[]` | Passport `events[]` of `type: service` | append-only ([passport](memory/vehicle_health_passport.md)) |
| `repair_history[]` | Passport `events[]` of `type: repair` | each carries fair-band check |
| `component_status{}` (health %) | `component_status{battery, tyres, brake_pads, engine_oil, chain}` | 0–100 health per part |
| `fault_history[]` | `fault_history[]` (predicted + verified) | feeds [verification loop](observability/mechanic_verification_loop.md) |
| `user_preferences{}` | `user_preferences{garage, budget_tier, language, accessibility_mode}` | drives DIY tier + modality |

## What the twin powers
- **Predictive maintenance (F9, [PRD.md](PRD.md)):** "battery 3.8 yr in Indian heat → High failure risk,
  ~3–5 months", "chain at 22 000 km since set → replace window now". Always a **Likely/Possible +
  confidence band** — never "your battery WILL die on date X"
  ([guardrails/never-claim-certainty.md](guardrails/never-claim-certainty.md)).
- **Swarm prior evidence:** a 3-year-old battery raises the [Electrical Agent](swarm/electrical-agent.md)
  weight; a fresh one lowers it. This is what lets Chitti say "Likely battery — High" instead of guessing.
- **Repeat-fault recognition:** "yeh teesri baar is mahine — pakka root cause dhoondhna hai."
- **Resale Trust Score (Passport):** a full Chitti history makes an honest seller's bike worth more.
- **Vehicle Health Score (F10):** 0–100 composite (engine/brakes/tyres/electrical/fluids/body) —
  **roadmap**, extends the Passport Trust Score; not yet computed, not claimed.

## Platform locks on memory (LOCKED — §2b)
- **On-device first.** The twin and passport live in IndexedDB on the rider's phone. Nothing about a
  specific bike, plate, or location leaves the device.
- **User-owned.** The rider owns every byte. They choose to share a read-only resale card; it is never
  auto-uploaded or sold.
- **"Chitti forget"** (voice or button) wipes the twin + passport and tombstones any anonymised
  aggregate. See [memory/vehicle_twin.md §Forget](memory/vehicle_twin.md) and
  [memory/vehicle_health_passport.md §Privacy](memory/vehicle_health_passport.md).
- **Anonymised aggregates only.** Only the tuple {predicted, actual, cost-band} — with no identity, no
  plate, no GPS — may leave, and only via the [verification loop](observability/mechanic_verification_loop.md),
  feeding Swarm Intelligence ([§2f](../SAHAYAI_MASTER.md)).
- **DeepSeek-only:** any LLM use over twin context routes through DeepSeek (the on-device ML predictor
  is **roadmap** — today's predictions are deterministic age/interval rules).

## Status
🟡 **YELLOW** — schema + contract authored; the twin/passport IndexedDB stores ride the
`chitti_a11y.js` substrate + `chitti_2wheeler.html`. The ML failure-predictor (F9 advanced) and the
0–100 Vehicle Health Score (F10) are **COMING SOON / roadmap** — deterministic age-and-interval
prediction is LIVE; the learned predictor is funding-gated ([../CHITTI_MECHANIC_COSDF.md §L9](../CHITTI_MECHANIC_COSDF.md)).
No predictive number is printed as measured until the eval run (MECH-4, Sire-gated).

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
