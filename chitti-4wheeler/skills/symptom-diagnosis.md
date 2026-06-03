🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SKILL — Symptom Diagnosis (the core reasoner)

Turns a driver's plain-Hinglish symptom (and OBD2 code, when shared) into a
confident-but-honest diagnosis. The flagship skill — it orchestrates the whole
[swarm](../swarm/README.md). Live surface: `POST /api/4w/ask`
([../backend/routes/wheels.py](../backend/routes/wheels.py)).

## Inputs
- Symptom description (voice/typed/tapped picker) — *"start nahi ho rahi, dashboard dim"*
- Car profile (brand/model/year/fuel/odo) + [Vehicle Twin](../memory/vehicle_twin.md) priors
- Optional OBD2 DTC (`GET /api/4w/dtc/<code>`), photo (dashboard/part), or sound description

## Swarm agents invoked
[Symptom](../swarm/symptom-agent.md) (reads the DTC) → [Engine](../swarm/engine-agent.md) +
[Electrical](../swarm/electrical-agent.md) + [Fuel](../swarm/fuel-agent.md) →
[Safety](../swarm/safety-agent.md) → [DIY](../swarm/diy-agent.md) +
[Cost](../swarm/cost-agent.md) → [Trust](../swarm/trust-agent.md) caps confidence.

## The reasoning it returns (always)
- **Why** — the most-likely cause, in plain Hinglish, cheapest check first
- **Severity / Can-I-drive** — 🟢/🟡/🟠/🔴 spoken first
- **DIY tier** — 🟢/🟡/🟠/🔴 + tools/time/savings
- **Cost band** — parts-only + parts+labour (₹ range)
- **Alternatives** — other plausible causes + what rules each in/out
- **Confidence** — Likely/Possible + High/Medium/Low

## Example
> Driver: *"Creta start nahi ho rahi, self slow, dashboard halki, AC blower bhi weak."*
> Chitti: *"**Likely battery discharged — High confidence.** Self slow + dashboard dim +
> battery 4 saal purani — sab battery ki taraf. **Pehle (free):** terminal saaf karo,
> dheela to nahi. **Drive:** 🟢 safe (jab chalu ho). **DIY:** 🟡 terminal clean ghar pe;
> battery badalni ho to ₹4 500–7 500. **Doosra ho sakta hai:** alternator (par yeh
> driving ke time battery light deta — abhi nahi). Mechanic se confirm karwa lo."*

## Confidence handling
Swarm split / thin evidence → Trust Agent forces *"pakka nahi — scan karwao."* A real
DTC is hard evidence, but the *cause* behind it is still a band. Never a bare verdict;
always a band ([../guardrails/never-claim-certainty.md](../guardrails/never-claim-certainty.md)).

## Accessibility
Safety call spoken first; symptom picker is tappable pictures (mute); everything spoken
+ captioned + ISL; "say HAAN or tap" to drill in. `data-chitti-response` + 👍/👎 on the
card (`fw_diagnosis`).

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
