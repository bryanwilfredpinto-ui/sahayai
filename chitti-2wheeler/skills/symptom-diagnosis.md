🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SKILL — Symptom Diagnosis (the core reasoner)

Turns a rider's plain-Hinglish symptom into a confident-but-honest diagnosis. The
flagship skill — it orchestrates the whole [swarm](../swarm/README.md).

## Inputs
- Symptom description (voice/typed/tapped picker) — *"start nahi ho rahi, light dim"*
- Bike profile (make/model/year/odo) + [Vehicle Twin](../memory/vehicle_twin.md) priors
- Optional photo (dashboard/part) or sound description

## Swarm agents invoked
[Symptom](../swarm/symptom-agent.md) → [Engine](../swarm/engine-agent.md) +
[Electrical](../swarm/electrical-agent.md) + [Fuel](../swarm/fuel-agent.md) →
[Safety](../swarm/safety-agent.md) → [DIY](../swarm/diy-agent.md) +
[Cost](../swarm/cost-agent.md) → [Trust](../swarm/trust-agent.md) caps confidence.

## The reasoning it returns (always)
- **Why** — the most-likely cause, in plain Hinglish, cheapest check first
- **Severity / Can-I-ride** — 🟢/🟡/🟠/🔴 spoken first
- **DIY tier** — 🟢/🟡/🟠/🔴 + tools/time/savings
- **Cost band** — parts-only + parts+labour (₹ range)
- **Alternatives** — other plausible causes + what rules each in/out
- **Confidence** — Likely/Possible + High/Medium/Low

## Example
> Rider: *"Activa start nahi ho rahi, self click karta hai, light bhi halki."*
> Chitti: *"**Likely battery discharged — High confidence.** Self slow + light dim +
> battery 3 saal purani — sab battery ki taraf ishaara. **Pehle (free):** terminal
> saaf karo, dheela to nahi. **Ride:** 🟢 safe (jab chalu ho). **DIY:** 🟡 terminal
> clean ghar pe; battery badalni ho to ₹1 300–2 700. **Doosra ho sakta hai:** starter
> (par light dim battery zyada kehta hai). Mechanic se confirm karwa lo."*

## Confidence handling
Swarm split / thin evidence → Trust Agent forces *"pakka nahi — inspect karwao."*
Never a bare verdict; always a band ([../guardrails/never-claim-certainty.md](../guardrails/never-claim-certainty.md)).

## Accessibility
Safety call spoken first; symptom picker is tappable pictures (mute); everything
spoken + captioned + ISL; "say HAAN or tap" to drill in. `data-chitti-response` +
👍/👎 on the card (`tw_diagnosis`).

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
