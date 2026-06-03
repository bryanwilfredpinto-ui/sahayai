🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SKILL — Dashboard Doctor (photo / DTC → warning-light read)

Reads the instrument cluster from a photo (or a tapped/described lamp, or an OBD2 code)
and tells the driver what's lit, how serious it is, and whether they can drive.

## Inputs
- Photo of the cluster (on-device read) **or** tap/describe which lamp **or** a DTC
  (`GET /api/4w/dtc/<code>` — ~16 codes in the local library today, rest via `/ask`)
- Car profile (so Chitti knows which lamps + codes that model/fuel actually has)

## Swarm agents invoked
[Symptom](../swarm/symptom-agent.md) (which lamp / which code) → [Engine](../swarm/engine-agent.md) /
[Electrical](../swarm/electrical-agent.md) / [Fuel](../swarm/fuel-agent.md) (what it
implies) → [Safety](../swarm/safety-agent.md) (can-drive) → [Trust](../swarm/trust-agent.md)
(don't invent a lamp/code this model lacks).

## The reasoning it returns
- **Why** — which lamp / what the code means
- **Severity / Can-I-drive** — oil/temp = 🔴 stop; check-engine = 🟠; low-fuel = 🟢
- **DIY tier** + **Cost band** (if a fix is implied)
- **Alternatives** — if the photo/code is ambiguous, the candidate causes + how to confirm
- **Confidence** — a blurry photo → "Possibly check-engine — tap to confirm"

## Example
> *"Scanner ne **P0420** dikhaya (🟠). Iska matlab cat-con efficiency kam — par wajah
> aksar upstream **O2 sensor** ya fuel mixture hoti hai, hamesha cat-con nahi. **Drive:**
> 🟠 dheere chal sakte ho, par scan karwao. Pehle O2 sensor + fuel-trim check (₹2 000–6 000),
> tab ₹15k+ ka cat-con. Confidence Medium."*

## Hard rules
- **Oil-pressure & temperature lamps = 🔴 stop-now** — never "thoda aur chala lo."
- Never invent a lamp or DTC the model doesn't have; an unknown code → confirm where it
  came from, route to `/ask`, never fabricate a meaning ([../evals/hallucination_eval.md](../evals/hallucination_eval.md)).
- Confidence band on every read (photos + codes can be ambiguous about the *cause*).

## Accessibility
"Describe my dashboard" narrates every lit lamp + code for blind drivers; works from a
single photo (mute); severity = symbol + word + ISL + flash for 🔴 (deaf); spoken for
illiterate. `fw_dashboard` / `fw_dtc` widget.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
