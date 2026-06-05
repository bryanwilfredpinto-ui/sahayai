🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SKILL (COSDF L5) — Exhaust & Emissions Domain

Owns the exhaust path — manifold, catalytic converter, O2/lambda sensors, DPF
(diesel), muffler — plus emissions readiness and the smoke-colour diagnosis that
maps straight to engine health. Tied to India's mandatory **PUC** (Pollution Under
Control) certificate and BS6 after-treatment. SOP-004. Aligns with COSDF F0/F2/F3.

## Domain principles
- **Smoke colour is a fast, honest diagnosis** (SOP-004): thin white at start =
  condensation (none) · thick sweet white = coolant/head-gasket (🔴 HIGH) · blue =
  oil burning (🟠 MED) · black = running rich / clogged filter (🟡 LOW).
- **The flashing-MIL rule is an exhaust rule too** — raw fuel from a misfire melts the
  catalyst. A flashing check-engine light = stop ([engine.md](engine.md), P0).
- **PUC fails have findable causes** — rich mixture, bad O2 sensor, weak cat, or a
  diesel DPF that needs a regen run. Don't just "re-test"; find the cause.
- **A loud exhaust isn't always the muffler** — a manifold/joint leak (ticking that
  grows with revs) can leak CO toward the cabin → Safety relevance.

## Common failure patterns (Indian cars)
| Pattern | Typical on | Tell-tale | Cause band |
|---|---|---|---|
| Blue smoke on start / accel | high-km petrol (Alto/WagonR) | hazy blue, oil drops | valve seals / rings burning oil |
| Black smoke + poor mileage | diesel Creta/Nexon | sooty puffs under load | rich / clogged air or DPF |
| Thick white sweet smoke | any | steam that smells sweet | head gasket / coolant 🔴 HIGH |
| Loud drone + ticking, grows with revs | older cars | rasp from underbody | manifold / pipe / muffler leak |
| PUC test failed | any petrol | high HC/CO reading | O2 sensor / rich / weak cat |
| DPF light + power loss | diesel | dash DPF icon, sluggish | DPF saturated — regen drive needed |

## Symptom → cause mapping
- *Thin white wisp on cold start, clears* → condensation. Likely/High. 🟢 normal.
- *Thick sweet white, milky oil* → head gasket. Possible/Medium → **Safety HIGH 🔴**.
- *Blue smoke* → oil burning (seals/rings). Likely/Medium. 🟠.
- *Black smoke + load* → rich / clogged DPF or air filter. Likely/Medium. 🟡→🟠.
- *Loud + ticking joint* → exhaust leak (CO risk). Possible/Medium. 🟠.
- *PUC fail* → O2/rich/cat. Likely/Medium. 🟠 (find cause, don't just retest).

## Outputs this skill must emit
- **Confidence band** — `Likely/Possible × High/Medium/Low`.
- **DIY-safety tier** — 🟢 (read smoke colour, replace cabin/air filter, run a DPF regen
  highway drive) / 🟡 (locate a leak by sound/sight) / 🟠 (O2 sensor, exhaust joint,
  muffler — mechanic) / 🔴 (catalytic converter, head gasket, DPF replacement).
- **Can-I-drive** — sweet-white smoke / flashing-MIL / strong cabin exhaust smell → 🔴.
- **PUC linkage** — when a smoke/emissions cause is found, surface "this is likely why
  PUC failed" + the fix, not a generic "go re-test."
- **Cost band** — O2 sensor ₹1,500–4,000 · muffler ₹2,000–6,000 · cat converter
  ₹8,000–35,000 · DPF clean/replace ₹5,000–60,000.

## Swarm agents fed
Feeds [Engine Agent](../swarm/engine-agent.md) (smoke ↔ combustion) and [Fuel
Agent](../swarm/fuel-agent.md) (rich/lean trims, O2). Sweet-white smoke and cabin-CO
risk escalate to the supreme [Safety Agent](../swarm/safety-agent.md). [Cost](../swarm/cost-agent.md)
+ [Trust](../swarm/trust-agent.md) guard the classic "you need a new catalytic converter"
overcharge — a frequent scam target ([scam-shield.md](scam-shield.md)).

## Roadmap (honest stubs — COSDF §3)
- AI smoke-colour classification from tailpipe video = roadmap (vision). Deterministic
  smoke-colour guide + O2/readiness read via OBD2 are LIVE.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
