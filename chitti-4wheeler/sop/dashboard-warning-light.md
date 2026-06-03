🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SOP — Dashboard Warning Light (photo → severity → can-drive)

**Trigger:** *"yeh light jal rahi hai, kya hai?"* / photo of the instrument cluster /
a check-engine light → optional OBD2 code via `GET /api/4w/dtc/<code>`.

## Steps
1. **Capture** — photo of the cluster (on-device read) **or** the driver taps/describes
   which light. For blind drivers: "describe my dashboard" narrates every lit symbol.
2. **Identify** — name the warning lamp (check-engine/MIL · oil pressure · temperature ·
   battery/charging · ABS · airbag/SRS · brake · EPS/power-steering · low-fuel · DPF
   (diesel) · EV-ready/HV). Only real lamps for that model — never invent one.
3. **Severity** — map to a band:
   | Lamp | Typical severity |
   |---|---|
   | Low fuel | 🟢 info — refuel |
   | Check-engine (MIL) steady | 🟠 — get it scanned; drive gently if running fine |
   | **Oil pressure** | 🔴 — **stop**, low oil can destroy the engine |
   | **Temperature** (overheat) | 🔴 — **stop now**, let it cool, check coolant |
   | **Brake** (+ pedal soft) | 🔴 — brake fault, do not drive |
   | **ABS** | 🟠 — base brakes work (no anti-lock); 🔴 if + a brake symptom |
   | **Airbag / SRS** | 🟠 — fault; never DIY; 🔴 if post-crash non-deploy |
   | **Battery/charging** | 🟠 — alternator; may strand you; mechanic soon |
   | **EPS / power steering** | 🟠/🔴 — heavy/locking wheel = 🔴 |
   | **DPF** (diesel) flashing | 🟠 — regen needed; long drive or workshop |
4. **DTC overlay** — if a code is shared, read its plain meaning + cost band from the
   library; a code not in the library → route to `/api/4w/ask`, never invent a meaning.
5. **Can-I-drive** — Safety Agent gives the 🟢/🟡/🟠/🔴 call, **spoken first**.
6. **Recommend** — cheapest check first; cost band; DIY tier; one fix.
7. **Per-response widget** — 🔊/🤖/👍/👎 on the result card (`fw_dashboard` / `fw_dtc`).

## Hard rules
- Oil-pressure and temperature lamps are **🔴 stop-now** — never "drive a bit more."
- Confidence band on every reading (a photo can be unclear → "Possibly check-engine —
  confirm by tapping").
- Never invent a warning lamp or DTC the model doesn't have ([../evals/hallucination_eval.md](../evals/hallucination_eval.md)).

## Accessibility
Spoken severity + symbol + word + ISL; tap to confirm which lamp; works from a single
photo so a mute driver needs no speech.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
