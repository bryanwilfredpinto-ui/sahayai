🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SKILL — Dashboard Doctor (photo → warning-light read)

Reads the instrument cluster from a photo (or a tapped/described lamp) and tells the
rider what's lit, how serious it is, and whether they can ride.

## Inputs
- Photo of the cluster (on-device read) **or** tap/describe which lamp
- Bike profile (so Chitti knows which lamps that model actually has)

## Swarm agents invoked
[Symptom](../swarm/symptom-agent.md) (which lamp) → [Engine](../swarm/engine-agent.md) /
[Electrical](../swarm/electrical-agent.md) / [Fuel](../swarm/fuel-agent.md) (what it
implies) → [Safety](../swarm/safety-agent.md) (can-ride) → [Trust](../swarm/trust-agent.md)
(don't invent a lamp this model lacks).

## The reasoning it returns
- **Why** — which lamp, what it means
- **Severity / Can-I-ride** — oil/temp = 🔴 stop; engine-check/FI = 🟠; low-fuel/side-stand = 🟢
- **DIY tier** + **Cost band** (if a fix is implied)
- **Alternatives** — if the photo is unclear, the candidate lamps + how to confirm
- **Confidence** — a blurry photo → "Possibly engine-check — tap to confirm"

## Example
> *"Yeh ✅ pehchaana — **oil-pressure light** (🔴). Iska matlab oil pressure kam.
> **Bike abhi mat chalao** — chalu rakhi to engine kharab ho sakta. Side mein lagao,
> oil level check karo. Confidence High."*

## Hard rules
- **Oil-pressure & temperature lamps = 🔴 stop-now** — never "thoda aur chala lo."
- Never invent a lamp the model doesn't have ([../evals/hallucination_eval.md](../evals/hallucination_eval.md)).
- Confidence band on every read (photos can be unclear).

## Accessibility
"Describe my dashboard" narrates every lit lamp for blind riders; works from a single
photo (mute); severity = symbol + word + ISL + flash for 🔴 (deaf); spoken for
illiterate. `tw_dashboard` widget.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
