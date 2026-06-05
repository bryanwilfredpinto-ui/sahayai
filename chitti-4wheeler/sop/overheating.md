🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SOP-003 — Overheating (gauge red → coolant → fan → thermostat)

**COSDF L7 SOP-003.** Trigger: *"temperature meter red ho gaya"* / *"engine se bhaap
nikal rahi hai"* / temperature warning lamp → Safety Agent + Engine Agent. Overheating
destroys engines (warped head, blown gasket, seized pistons) within minutes — the first
action is **STOP**, not diagnose.

> COSDF L7 SOP-003: gauge red → **STOP & cool** → check coolant (COLD only) → check for
> leaks → check the radiator fan → suspect the thermostat. In India the common causes
> are low coolant, a dead radiator fan, a stuck thermostat, and a clogged radiator in
> dusty/traffic conditions.

## Step 0 — STOP. This is a 🔴 red line. (spoken first)
1. Temperature gauge in the red OR steam/coolant smell → **pull over safely now**
   (hazards on, off the carriageway), **turn the engine OFF**. Do not keep driving "to
   reach the next petrol pump" — every minute adds damage.
2. **Turn the cabin heater to MAX** for the short coast to a safe stop (it dumps engine
   heat into the cabin — uncomfortable but buys you margin). Then switch off.
3. If stranded/unsafe → [../guardrails/emergency-protocol.md](../guardrails/emergency-protocol.md)
   family cascade. **NEVER auto-dial cops/100/108/112.**

## Step 1 — Let it cool. DO NOT open the radiator cap hot.
- **Wait 30–45 min** until the engine is cool to the touch. A hot pressurised cooling
  system sprays scalding coolant the instant the cap cracks — this is a P0 burn hazard
  ([../guardrails/safety-rules.md](../guardrails/safety-rules.md)).
- Coolant is checked **COLD only** — at the **overflow/expansion tank** first (you don't
  need to open the radiator cap to read the MIN/MAX line).

## Step 2 — Diagnose (cold), cheapest cause first
| Check | If… | Then |
|---|---|---|
| **Coolant level** (expansion tank, cold) | low / empty | top up with coolant (or clean water in a roadside emergency) → find the leak |
| **Visible leak** — puddle colour/location | green/orange/pink under engine | radiator / hose / water-pump / heater-core leak; *white sweet smoke from exhaust* = head gasket (see [./smoke_color.md](./smoke_color.md)) |
| **Radiator fan** — does it spin when hot/AC on? | not spinning | fan motor / fan fuse / relay / temp-sensor → overheats in **traffic/idle** but cools on the highway = classic fan failure |
| **Hoses** | hard/swollen/soft/cracked | a collapsed or burst hose blocks flow |
| **Thermostat** | overheats then suddenly normal, or never warms | stuck thermostat (stuck-closed = overheat) |
| **Coolant looks oily / "mayonnaise" on oil cap** | yes | 🔴 head-gasket — do not drive, see [./smoke_color.md](./smoke_color.md) |
| **Radiator front** | bugs/mud/plastic blocking fins | clogged radiator core — airflow starved |

**Highway-vs-traffic tell:** overheats **only in slow traffic / at idle**, fine at speed
→ airflow problem → **radiator fan** (or low coolant). Overheats **at speed** too →
coolant flow problem → pump / thermostat / radiator / head gasket.

## Step 3 — Verdict (swarm-synthesised)
Six fields as always: **Why · Severity · Can-I-drive · DIY-or-not · Cost band ·
Alternatives.**
- **DIY 🟢/🟡** — top-up coolant, clear debris off the radiator face, replace a clearly
  burst clamp-on hose (cold) → coach it ([./diy-repair-coach.md](./diy-repair-coach.md)).
- **🟠/🔴** — water pump, thermostat, radiator R&R, fan motor, **head gasket** →
  mechanic; cost band + Scam Shield ([./scam-quote-check.md](./scam-quote-check.md)).
- **Never** clear an overheat to "drive a bit to the shop." If it can't be cooled and
  refilled safely → **tow**.

## Hard rules (LOCKED)
- Gauge red / steam = **STOP & switch off** — never drive on, never crank repeatedly.
- **Never open a hot radiator cap** — P0 burn hazard; coolant checked COLD at the
  expansion tank.
- White sweet exhaust smoke + overheat + oil "mayonnaise" = head gasket → 🔴 **do not
  drive** (cross-check [./smoke_color.md](./smoke_color.md)).
- Tow over "limp it" whenever the engine cannot hold temperature.
- Confidence band on every read; the temperature lamp/overheat call is **100%-stakes**
  safety ([../evals/safety_eval.md](../evals/safety_eval.md)).

## Accessibility
The 🔴 STOP verdict is **spoken first** (blind) and shown as a red flashing symbol +
word (deaf, never colour-only). Coolant level and leak colour answered by photo (mute)
or voice. The cap-burn warning is repeated before any coolant step. `fw_overheating`
widget carries 🔊/🤖/👍/👎.

## Cross-links
[../skills/engine.md](../skills/engine.md) · [./smoke_color.md](./smoke_color.md) (SOP-004) ·
[./dashboard-warning-light.md](./dashboard-warning-light.md) (temperature lamp) ·
[../swarm/engine-agent.md](../swarm/engine-agent.md) · [../swarm/safety-agent.md](../swarm/safety-agent.md) ·
[./breakdown-roadside.md](./breakdown-roadside.md) · [./emergency.md](./emergency.md).

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
