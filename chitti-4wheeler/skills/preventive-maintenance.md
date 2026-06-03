🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SKILL — Preventive Maintenance (catch it before it breaks)

Predicts what's about to need attention from the [Vehicle Twin](../memory/vehicle_twin.md)
and nudges the driver before a failure strands the family — make/model/year/fuel-specific,
never generic. Live surface: `GET /api/4w/maintenance/next`
([../backend/routes/wheels.py](../backend/routes/wheels.py)).

## Inputs
- Vehicle Twin (odo, km/day, battery/tyre/brake age, last service, local climate, fuel type)
- Car profile → brand service intervals (`_BRAND_SCHEDULE` + [MECHANIC_KNOWLEDGE §1-2](MECHANIC_KNOWLEDGE.md))

## Swarm agents invoked
[Symptom](../swarm/symptom-agent.md) (none yet — predictive) → fault agents project wear
→ [Safety](../swarm/safety-agent.md) (prioritise brakes/tyres) → [Cost](../swarm/cost-agent.md)
(what each will cost) → [Trust](../swarm/trust-agent.md) (band, not a hard date).

## The reasoning it returns
- **Why** — what's due and why (interval + age + climate + fuel type)
- **Severity / Can-I-drive** — safety items (brakes/tyres) flagged first
- **DIY tier** — AC cabin filter 🟢; coolant flush 🟠 mechanic
- **Cost band** — for the upcoming service
- **Alternatives** — DIY vs service-centre
- **Confidence** — *"battery 3.8 yr → failure risk High, likely 3–5 months"* (band, not "on date X")

## Example
> *"Creta diesel, 58 200 km. **Due soon:** oil change (~600 km), AC cabin filter (garmi
> aa rahi). **Watch:** battery 3.8 saal — risk High, 3–5 months. Diesel + chhoti trips →
> mahine mein ek lambi drive, DPF clog se bacho. Brake pads ~40k pe — abhi check (safety).
> Confidence Medium-High."*

## Hard rules
- Predictions are **Likely + confidence band** — never "battery WILL die on date X"
  ([../guardrails/never-claim-certainty.md](../guardrails/never-claim-certainty.md)).
- Intervals are **make/model/year/fuel-specific** (FEATURES Q1/C1); surface active
  **recalls** prominently (FEATURES Q3).
- Weather-aware (pre-monsoon brakes/wipers, pre-summer AC/coolant — FEATURES C13).

## Accessibility
Reminders spoken at 06:00 IST (blind/illiterate) + visual card + symbol + ISL (deaf) +
tap-to-snooze (mute); picture menu of "what's due." `fw_maintenance` widget.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
