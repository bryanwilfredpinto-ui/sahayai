🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# MEMORY — Vehicle Twin / Garage Twin (on-device, private)

> Chitti keeps a living digital twin of the rider's bike. It doesn't just answer
> questions — it **predicts** what's about to fail, before it strands the rider on a
> highway. The twin lives **on the device**, is user-owned, and never reaches the
> server except as anonymised aggregates.

## Store
- **IndexedDB** database `chitti_2w_twin`, object store `vehicles` keyed by `vehicle_id`.
- Multi-bike households share with [Family Fleet](../skills/FEATURES.md) (W20).

## Twin schema
| Field | Source |
|---|---|
| `make` / `model` / `year` | onboarding (voice-buildable) |
| `odo` + `km_per_day` | rolling from fuel/trip logs |
| `battery_age` | install date (voice/tap) — drives failure prediction |
| `tyre_age` + tread checks | log |
| `brake_age` (pads/shoes) | last replacement log |
| `chain_km_since_set` | drive-tracker |
| `last_service` (oil/air/plug) | log + maintenance schedule |
| `local_climate` | pincode → IMD (monsoon/dust season) |
| `road_conditions` | rider-set (city / highway / rural / pothole-heavy) |
| `usage_profile` | commuter / tourer / delivery (delivery = 3× wear) |

## What the twin predicts
| Signal | Prediction | Example |
|---|---|---|
| Battery age 3.8 yr (Indian heat) | failure risk **High**, likely 3–5 months | *"battery purani — agle monsoon se pehle badalna soch lo"* |
| Chain at 22 000 km since set | replacement due soon | *"chain-sprocket set 18–25k pe — abhi check karwao"* |
| Monsoon arriving + chain log | tighten interval | *"barsaat mein chain lube har 300 km, 500 nahi"* |
| Tyre 24 000 km, tread checks | replace window | *"tyre life end ke paas — long ride se pehle dekho"* |
| Dusty season + air-filter km | service sooner | *"dhool ka mausam — air filter 2× zyada check"* |

## How the twin powers diagnosis
The swarm reads the twin as **prior evidence**: a 3-year-old battery raises the
Electrical Agent's battery weight; a fresh battery lowers it. This is what lets Chitti
say "Likely battery — High confidence" instead of guessing.

## Forget
`"Chitti forget"` (voice or button) clears the twin and tombstones any anonymised
aggregate. The rider owns every byte. Predictions are **Likely/Possible + confidence
band** — never "your battery WILL die on date X" ([../guardrails/never-claim-certainty.md](../guardrails/never-claim-certainty.md)).

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
