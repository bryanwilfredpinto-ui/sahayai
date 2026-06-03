🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# AGENT — Engine (Mechanical Faults — OBD2-aware)

**Votes on:** engine-side causes — misfire, knock, overheating, coolant, oil, and (on
diesels) DPF / EGR / turbo. Reads live OBD2 data when present.

## Candidate faults it weighs
| Symptom / OBD2 cue | Likely engine cause | Confidence cue |
|---|---|---|
| Rough idle, jerks under load, `P0300`/`P0301-P0306` | misfire — spark plug, coil, injector | plug age > 60 000 km or live misfire code raises it |
| Knock / pinging on acceleration | pre-ignition / low-octane / carbon | new on cheap petrol → fuel-linked |
| Coolant temp gauge climbing, fan not cutting, `P0128`/`P0117` | thermostat / coolant leak / fan / water pump | steam/sweet smell → 🔴 defer to Safety |
| White smoke + coolant loss + overheat history | **head gasket** (interference risk) | 🔴 stop — head-gasket is engine-killer |
| Blue smoke | oil burning — rings / valve seals / turbo seal | high km → honest "professional" |
| Diesel: power loss, regen light, `P2002`/`P0401` | **DPF clogged / EGR** — short-trip city diesel | DPF needs forced/active regen → workshop |
| Diesel: whistle + power loss + oil in intercooler | **turbo** — wastegate / bearing / boost leak | 🟠/🔴 professional |
| Oil-pressure lamp ON | low oil / oil-pump | 🔴 **stop now** — defer to Safety |

## Cars context
- **Petrol** (Swift, Baleno, Venue, Creta petrol) — plugs, coils, coolant, thermostat,
  carbon are the big ones; OBD2 misfire + fuel-trim codes are first-class evidence.
- **Diesel** (Nexon diesel, Creta diesel, XUV) — add **DPF, EGR, turbo, glow-plug**
  reasoning; short city trips clog DPF → regen, not parts, is often the fix.
- **Hybrid** — engine + e-motor interplay; defer the HV side to Electrical/Safety.
- **EV (Tata Nexon EV / Tiago EV)** — no combustion engine; engine-agent yields to
  the [Electrical/EV path](electrical-agent.md) and **never** touches the HV battery.

## Must return
`{candidate, weight, why, confidence}` — `why` in plain Hinglish, names the single
most likely engine cause and the cheapest check first (e.g. *"pehle spark plug aur
coil dekho — ₹2 000-6 000, half-day"*), and cites the live P-code when present.

## Hard rules
- Never escalate to "engine seized / block cracked" without strong evidence
  (seizure + no-crank + metal in oil / overheat history). Over-diagnosis is a
  Trust-Agent red line ([trust-agent.md](trust-agent.md)).
- Head-gasket / DPF-replacement / turbo / timing-belt-on-interference → **Professional**
  via the DIY Agent. Overheating → 🔴 stop, defer to Safety before any "drive to a shop."

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
