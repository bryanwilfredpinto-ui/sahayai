🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SKILL — Preventive Maintenance (catch it before it breaks)

Predicts what's about to need attention from the [Vehicle Twin](../memory/vehicle_twin.md)
and nudges the rider before a failure strands them — make/model/year-specific, never generic.

## Inputs
- Vehicle Twin (odo, km/day, battery/tyre/brake/chain age, last service, local climate)
- Bike profile → OEM service intervals ([MECHANIC_KNOWLEDGE §1](MECHANIC_KNOWLEDGE.md))

## Swarm agents invoked
[Symptom](../swarm/symptom-agent.md) (none yet — predictive) → fault agents project wear
→ [Safety](../swarm/safety-agent.md) (prioritise brakes/tyres) → [Cost](../swarm/cost-agent.md)
(what each will cost) → [Trust](../swarm/trust-agent.md) (band, not a hard date).

## The reasoning it returns
- **Why** — what's due and why (interval + age + climate)
- **Severity / Can-I-ride** — safety items (brakes/tyres) flagged first
- **DIY tier** — chain lube 🟢 ₹0; brake check 🟠 mechanic
- **Cost band** — for the upcoming service
- **Alternatives** — DIY vs service-centre
- **Confidence** — *"battery 3.8 yr → failure risk High, likely 3–5 months"* (band, not "on date X")

## Example
> *"Activa, 18 200 km. **Due soon:** oil change (~400 km), air filter (dhool ka mausam
> — abhi). **Watch:** battery 3.8 saal — risk High, 3–5 months mein badalni pad sakti.
> Chain lube ghar pe ₹0. Confidence Medium-High."*

## Hard rules
- Predictions are **Likely + confidence band** — never "battery WILL die on date X"
  ([../guardrails/never-claim-certainty.md](../guardrails/never-claim-certainty.md)).
- Intervals are **make/model/year-specific** (FEATURES Q1); surface active **recalls**
  prominently (FEATURES Q3).
- Weather-aware (monsoon chain, dust air-filter — FEATURES W13).

## Accessibility
Reminders spoken at 06:00 IST (blind/illiterate) + visual card + symbol + ISL (deaf) +
tap-to-snooze (mute); picture menu of "what's due." `tw_maintenance` widget.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
