🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SKILL (COSDF L5) — Cooling Domain

Owns coolant, radiator, fan, thermostat, water pump, hoses, head-gasket-as-cooling-
symptom, and EV battery/motor thermal management. India's heat (45°C summers, ghat
traffic jams) makes this a first-order safety domain — a missed overheat warps a head.
SOP-003. Aligns with COSDF F0.

## Domain principles
- **STOP if the gauge hits red.** Continued driving while overheating cracks the head
  / warps the block — a cheap fix becomes an engine. Pull over safely, hazards on,
  let it cool ([../guardrails/safety-rules.md](../guardrails/safety-rules.md)).
- **NEVER open a hot radiator cap.** Pressurised scalding coolant erupts → severe
  burns. Wait until cold. P0 guardrail, no exceptions.
- **Check coolant level cold, top with the right coolant** (don't run plain water long
  term in modern cars — corrosion). Order of checks: level → leaks → fan → thermostat.
- **Sweet smell + white sweet smoke + milky oil = head gasket / coolant intrusion** →
  escalate to [engine.md](engine.md) + Safety HIGH (SOP-004).

## Common failure patterns (Indian cars)
| Pattern | Typical on | Tell-tale | Cause band |
|---|---|---|---|
| Overheats in traffic, fine on highway | Swift / WagonR | gauge climbs at idle/jam | radiator fan not cutting in |
| Temp swings high then normal | Baleno / i20 | needle yo-yos | stuck thermostat |
| Coolant low repeatedly, sweet smell | Creta / Verna | refill keeps dropping | hose / radiator / water-pump leak |
| White sweet smoke, milky oil cap | high-km petrol | exhaust steam, mayo oil | head gasket — 🔴 HIGH |
| Heater blows cold, overheats | older cars | no cabin heat + temp rise | low coolant / airlock / pump |
| EV "thermal" / reduced charging | Nexon EV | turtle / slow DC charge in heat | battery thermal de-rate (often normal) |

## Symptom → cause mapping
- *Overheats only in traffic / AC on* → cooling fan / relay. Likely/High. 🟡.
- *Temp needle swings* → thermostat. Likely/Medium. 🟠.
- *Coolant drops, visible drip / dried trail* → hose / radiator / pump leak. Likely/Medium. 🟠.
- *Sweet white smoke + milky oil* → head gasket. Possible/Medium → **Safety HIGH 🔴**.
- *No cabin heat + overheating* → airlock / low coolant / pump. Possible/Medium.
- *EV thermal de-rate in 45°C* → normal protection. Likely/High (reassure, not a fault).

## Outputs this skill must emit
- **Can-I-drive** — gauge red / steam / coolant-warning = 🔴 stop, spoken first.
- **Confidence band** — `Likely/Possible × High/Medium/Low`.
- **DIY-safety tier** — 🟢 (check level COLD, top up correct coolant, spot a drip) /
  🟡 (inspect hoses/fan operation when cold) / 🟠 (thermostat, radiator, water pump) /
  🔴 (head gasket; opening a HOT cap is forbidden; EV thermal system Professional only).
- **Cost band** — coolant flush ₹500–1,500 · thermostat ₹800–2,500 · radiator
  ₹3,000–9,000 · water pump ₹2,500–7,000 · head gasket ₹12,000–40,000.

## Swarm agents fed
Feeds [Engine Agent](../swarm/engine-agent.md) (overheat-as-engine-risk) and the supreme
[Safety Agent](../swarm/safety-agent.md) (overheat = stop). [DIY](../swarm/diy-agent.md)
limited to cold top-up + visual; [Trust](../swarm/trust-agent.md) caps a confident
"head gasket" unless milky-oil/sweet-smoke evidence is present.

## Roadmap (honest stubs — COSDF §3)
- AI coolant-leak detection (colour/location) from photo/video = roadmap (vision).
  Live OBD2 coolant-temp read is LIVE on supported devices; deterministic overheat
  triage + coolant-colour guide is LIVE.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
