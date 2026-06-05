🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SOP-001 — Car Won't Start (crank / battery-voltage decision tree)

**COSDF L7 SOP-001.** Trigger: *"gaadi start nahi ho rahi"* / *"chaabi ghumai par
kuch nahi"* / one-tap **Start Problem** → `POST /api/4w/breakdown`
([../backend/routes/wheels.py](../backend/routes/wheels.py)). Companion to the roadside
flow in [./breakdown-roadside.md](./breakdown-roadside.md) — that SOP runs *first* if
the car is stranded on a live road; this SOP is the precise crank/voltage diagnosis.

> COSDF L7 SOP-001 maps the won't-start question to a deterministic tree. The big
> branch is **"does the engine crank?"** — that single answer splits battery/starter
> faults (no crank) from fuel/spark faults (cranks, won't fire). Free checks before
> any "go to mechanic" ([../guardrails/scam-shield-rules.md](../guardrails/scam-shield-rules.md)).

## Step 0 — Safety + location first
- If the car is stranded in traffic or the driver is unsafe → jump to
  [./breakdown-roadside.md](./breakdown-roadside.md) Step 0 +
  [../guardrails/emergency-protocol.md](../guardrails/emergency-protocol.md)
  (confirm → alarm → **family cascade**, NEVER auto-dial cops/100/108/112).
- Otherwise: handbrake on, gear in P/Neutral, then diagnose.

## Step 1 — The one question that splits everything: does it CRANK?
"Self-start dabaane par engine **ghoom-ghoom** karta hai (crank), ya sirf **click /
khamoshi**?"

| Crank state | What it means | Go to |
|---|---|---|
| **No crank** — dim/dead dash, no sound | battery / terminal / earth | Branch A |
| **No crank** — dash fine, single *click* | starter solenoid / starter motor | Branch B |
| **No crank** — dash fine, no click, immobiliser light blinks | immobiliser / key / ECU | Branch C |
| **Cranks** (engine spins) but **won't fire** | fuel + spark + crank/cam sensor | Branch D |
| Cranks **slow / labouring** then dies | weak battery OR cold diesel glow-plug | Branch A + diesel note |

## Branch A — No crank, battery suspected (voltage gates)
Free checks first: headlights/horn — strong or weak? Dome light dims on cranking?
Then the **battery-voltage gate** (multimeter or OBD2 `GET /api/4w/dtc` voltage PID,
key OFF, engine off):

| Resting voltage | Verdict | Action |
|---|---|---|
| **> 12.4 V** | battery is good | look elsewhere — terminals/earth, starter (Branch B) |
| **11.5 – 12.4 V** | low / discharged | clean + tighten terminals → **jump-start** → drive 30 min to recharge → load-test |
| **< 11.5 V** | flat / failing | jump may not hold; likely **replace battery** (3–5 yr life) |
| Drops **< 10 V while cranking** | battery can't deliver | replace battery (failed under load) |

- **Terminals first** — white/green powder = corrosion; clean, tighten, retry. This is
  the #1 free fix. A loose earth strap mimics a dead battery.
- **Battery-light came on while driving earlier?** → alternator not charging → the
  battery slowly drained. Jump to reach a shop, then test the charging system
  ([../swarm/electrical-agent.md](../swarm/electrical-agent.md)).
- **Diesel, cold morning, slow crank** → wait for the **glow-plug** light to go out
  before cranking; repeated slow cranks flatten the battery.

## Branch B — No crank, dash fine, single click
- One loud *click*, no spin → starter solenoid engaging but motor not turning →
  **starter motor** (worn brushes / stuck) or a bad main earth.
- Rapid *click-click-click* → battery too weak to hold the solenoid → back to Branch A
  voltage gate (often a weak battery, not the starter).
- Tap-test (older starters): a gentle tap on the starter body sometimes frees a stuck
  motor enough for one more start — *to reach a shop, not a fix*. Confidence band stays
  on the verdict.

## Branch C — No crank, no click, immobiliser
- Immobiliser/key symbol blinking → the ECU isn't recognising the key →
  spare key, clean the key chip, check the key battery (some smart keys).
- Steering lock + "key won't turn" → wiggle the wheel while turning the key.
- Aftermarket alarm fitted? → it may be cutting the starter; check its valet mode.
- No fix here is DIY beyond the spare key → route to dealer/auto-electrician; never
  invent an ECU fault ([../evals/hallucination_eval.md](../evals/hallucination_eval.md)).

## Branch D — Cranks but won't fire (fuel + spark)
| Check (free first) | If… | Then |
|---|---|---|
| Fuel gauge / smell of petrol | empty or faulty gauge | the #1 "won't fire" cause — refuel / emergency fuel delivery |
| Check-engine light / stored DTC | a crank/cam/sensor code | `GET /api/4w/dtc/<code>` → plain meaning; never invent a code |
| Recent fuel fill at a cheap pump | jerk + no-fire after | contaminated / watered fuel → drain (workshop) |
| Petrol: any spark / cranks longer when cold | weak spark | plugs / coil / crank sensor |
| Diesel: cranks fine, no fire, no smoke | fuel delivery | air in lines / lift pump / blocked filter |

## Step 2 — Verdict (swarm-synthesised)
The [8-agent swarm](../swarm/README.md) returns a weighted vote, e.g. *"Battery 80 /
Starter 12 / Charging 8 → **Battery, High confidence**."* Output always carries the
six fields: **Why · Severity · Can-I-drive · DIY-or-not · Cost band · Alternatives**.
- **DIY 🟢/🟡** (jump-start, clean terminals, refuel, spare key) → coach step-by-step
  ([./diy-repair-coach.md](./diy-repair-coach.md)).
- **🟠/🔴** (starter R&R, immobiliser/ECU, fuel-system) → human mechanic; show the
  cost band + Scam Shield fair band ([./scam-quote-check.md](./scam-quote-check.md)).
- **Disagreement floor** — if the top two are within ~15 points → "diagnosis confidence
  low — let's confirm with a voltage reading", never bluff.

## Hard rules
- Free checks (terminals, fuel, kill the warning, read the code) **before** "go to a
  mechanic" — Scam Shield discipline.
- Voltage gates are the spine of the no-crank branch; state the band, not "battery dead."
- Never crank repeatedly with the temperature lamp red, or on a fuel-contamination
  suspicion (you push bad fuel further in).
- Never auto-dial cops/ambulance — family cascade only
  ([../guardrails/emergency-protocol.md](../guardrails/emergency-protocol.md)).

## Accessibility
Spoken decision tree + picture branches + tap answers (mute/illiterate). The
crank-vs-click question is asked **by sound description** so a blind driver answers by
voice; the verdict is spoken first, then symbol+word+flash for deaf drivers. Voltage
reading can be entered by voice ("twelve point one"). `fw_not_starting` widget carries
🔊/🤖/👍/👎 (CTO §2 feedback strip).

## Cross-links
[./breakdown-roadside.md](./breakdown-roadside.md) ·
[./dashboard-warning-light.md](./dashboard-warning-light.md) ·
[./emergency.md](./emergency.md) (SOP-006) ·
[../swarm/electrical-agent.md](../swarm/electrical-agent.md) ·
[../skills/electrical.md](../skills/electrical.md) · [../skills/engine.md](../skills/engine.md).

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
