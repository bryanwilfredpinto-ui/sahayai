🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# MEMORY — Vehicle Twin / Garage Twin (on-device, private)

> Chitti keeps a living digital twin of the driver's car. It doesn't just answer
> questions — it **predicts** what's about to fail, before it strands the family on a
> highway. The twin lives **on the device**, is user-owned, and never reaches the
> server except as anonymised aggregates.

## Store
- **IndexedDB** database `chitti_4w_twin`, object store `vehicles` keyed by `vehicle_id`.
- Multi-vehicle households share with [Family Fleet](../skills/FEATURES.md) (C22) — a
  shared `family_fleet` table spans both [chitti-2wheeler](../../chitti-2wheeler/) and 4W.
- Authoritative profile fields mirror `CarProfile` in [../backend/routes/wheels.py](../backend/routes/wheels.py)
  (`brand · model · year · fuel · tx · odo · reg`).

## Twin schema
| Field | Source |
|---|---|
| `brand` / `model` / `year` / `fuel` (Petrol/Diesel/EV/Hybrid) / `tx` (MT/AT/CVT/AMT) | onboarding (voice-buildable) |
| `odo` + `km_per_day` | rolling from fuel/trip logs |
| `battery_age` (12V) | install date (voice/tap) — drives failure prediction |
| `tyre_age` + tread checks | log |
| `brake_age` (pads/discs) | last replacement log |
| `last_service` (oil/air/plug/coolant/AC) | log + brand maintenance schedule |
| `coolant_age` / `brake_fluid_age` | time-based |
| `dpf_regen_history` (diesel) | short-trip ratio → DPF clog risk |
| `ev_soh` (Tata EV) | charge-cycle + range trend (on-device) |
| `local_climate` | pincode → IMD (monsoon/dust/heat season) |
| `usage_profile` | commuter / highway / cab/commercial (commercial = higher wear) |

## What the twin predicts
| Signal | Prediction | Example |
|---|---|---|
| 12V battery age 3.8 yr (Indian heat) | failure risk **High**, likely 3–5 months | *"battery purani — agle thand se pehle badalna soch lo"* |
| Diesel, mostly short city trips | DPF clog risk rising | *"chhoti trips zyada — DPF block ho sakta, mahine mein ek lambi drive lo"* |
| Coolant 2.5 yr + summer | flush due | *"garmi aa rahi — coolant flush ka time, overheat se bacho"* |
| Brake pads at 35 000 km | replacement window | *"brake pads ~40k pe — abhi check karwao (safety)"* |
| EV range trending down + winter | range dip (not pack failure) | *"thand mein range girti hai — yeh normal, pack theek hai"* |
| Dusty season + air-filter km | service sooner | *"dhool ka mausam — air filter 2× zyada check"* |

## How the twin powers diagnosis
The swarm reads the twin as **prior evidence**: a 4-year-old 12V battery raises the
Electrical Agent's battery weight; a diesel + short-trip profile raises DPF weight; a
fresh battery lowers it. This is what lets Chitti say "Likely alternator — High
confidence" instead of guessing.

## Forget
`"Chitti forget"` (voice or button) clears the twin and tombstones any anonymised
aggregate. The driver owns every byte. Predictions are **Likely/Possible + confidence
band** — never "your battery WILL die on date X" ([../guardrails/never-claim-certainty.md](../guardrails/never-claim-certainty.md)).

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
