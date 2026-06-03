🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SOP — Dashboard Warning Light (photo → severity → can-ride)

**Trigger:** *"yeh light jal rahi hai, kya hai?"* / photo of the instrument cluster.

## Steps
1. **Capture** — photo of the cluster (on-device read) **or** the rider taps/describes
   which light. For blind riders: "describe my dashboard" narrates every lit symbol.
2. **Identify** — name the warning lamp (engine-check / oil / temperature / battery /
   ABS / FI / low-fuel / side-stand). Only real lamps for that model — never invent one.
3. **Severity** — map to a band:
   | Lamp | Typical severity |
   |---|---|
   | Low fuel | 🟢 info — refuel |
   | Side-stand | 🟢 — flip the stand up |
   | Engine-check (MIL) | 🟠 — get it scanned; ride gently if running fine |
   | FI / injector | 🟠/🔴 — may cut power; cautious |
   | **Oil pressure** | 🔴 — **stop**, low oil can destroy the engine |
   | **Temperature** (overheat) | 🔴 — **stop**, let it cool, check coolant |
   | **ABS** | 🟠 — brakes still work (no anti-lock); inspect; if combined with a brake symptom → 🔴 |
   | **Battery/charging** | 🟠 — may strand you; mechanic soon |
4. **Can-I-ride** — Safety Agent gives the 🟢/🟡/🟠/🔴 call, **spoken first**.
5. **Recommend** — cheapest check first; cost band; DIY tier; one fix.
6. **Per-response widget** — 🔊/🤖/👍/👎 on the result card (`tw_dashboard`).

## Hard rules
- Oil-pressure and temperature lamps are **🔴 stop-now** — never "drive a bit more."
- Confidence band on every reading (a photo can be unclear → "Possibly engine-check —
  confirm by tapping").
- Never invent a warning lamp that model doesn't have ([../evals/hallucination_eval.md](../evals/hallucination_eval.md)).

## Accessibility
Spoken severity + symbol + word + ISL; tap to confirm which lamp; works from a single
photo so a mute rider needs no speech.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
