🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SKILL (COSDF L5) — OBD2 / DTC Domain (hard evidence)

The only domain that reads the car's own brain. Owns the OBD2 / ELM327 connection,
DTC (P/B/C/U-code) interpretation, live PIDs (RPM, coolant, fuel-trim, battery V),
freeze-frame, and emissions/Mode-6 readiness. A confirmed P-code is **hard evidence**
that outranks any described symptom in the swarm. COSDF F3 — **LIVE** on supported
devices via Web-Bluetooth. Live surface: `GET /api/4w/dtc/<code>`.

## Domain principles
- **A code is hard evidence; the cause behind it is still a band.** `P0420` proves the
  catalyst-efficiency monitor failed — it does NOT prove you need a ₹30,000 cat. The
  cause could be an O2 sensor or an exhaust leak. Read the code, then reason the cause.
- **Freeze-frame tells you the conditions** the fault appeared in (RPM, load, temp) —
  use it to separate intermittent from active.
- **Live PIDs confirm or kill a theory cheaply** — fuel-trim, coolant temp, battery
  voltage, O2 response. Prefer a live PID over a guess.
- **No OBD2 ≠ no diagnosis.** When the dongle/port isn't available, fall back to the
  symptom/sound/photo swarm ([symptom-diagnosis.md](symptom-diagnosis.md), F4) — never
  block the user.

## Common DTC families (Indian cars)
| Code family | Meaning | Typical on | First honest read |
|---|---|---|---|
| P0300–P0304 | misfire (random / cyl 1–4) | Creta/Venue/Verna petrol | coil/plug/injector → [engine.md](engine.md) |
| P0420 / P0430 | catalyst below threshold | any BS4/BS6 petrol | O2 sensor or weak cat → [exhaust.md](exhaust.md) |
| P0171 / P0174 | system too lean | Swift/Baleno | vacuum leak / MAF / fuel → [fuel](../swarm/fuel-agent.md) |
| P0401 / P0402 | EGR flow fault | diesel Nexon/Harrier | EGR soot clog |
| P2002 / DPF codes | DPF efficiency | diesel | regen drive, then service |
| C-codes (ABS) | brake/ABS module | Venue/Seltos | → [brakes.md](brakes.md), Safety |
| B/U-codes | body / network (CAN) | feature-rich cars | wiring / module / earth |

## Symptom → cause mapping (code-led)
- *P0300 + rough idle + flashing MIL* → active misfire. Likely/High. 🔴 stop (catalyst).
- *P0420 only, runs fine* → O2 sensor or weak cat. Possible/Medium — test O2 before cat.
- *P0171 lean + idle hunt* → vacuum/MAF/fuel. Possible/Medium.
- *ABS C-code lit* → brake/ABS module → escalate to Safety. 🔴.
- *Pending vs confirmed code* → pending = monitor; confirmed = act.
- *Readiness monitors not ready* → drive cycle needed before PUC/emissions test.

## Outputs this skill must emit
- **Plain-language code translation** — "P0420 = the converter isn't cleaning exhaust
  well enough" — never raw jargon dumped at the user.
- **Confidence band** — code = hard evidence (raises confidence) but the **cause** band
  is `Likely/Possible × High/Medium/Low`.
- **DIY-safety tier** — 🟢 (read/clear a non-safety code, run a drive-cycle) /
  🟡 (interpret freeze-frame) / 🟠 (replace the implicated sensor) / 🔴 (clearing a
  brake/airbag code to "make the light go away" — forbidden; Professional).
- **Can-I-drive** — ABS/SRS/misfire-flashing codes force Safety 🔴.

## Swarm agents fed
This is the swarm's evidence layer: a confirmed P-code makes the relevant fault agent
([Engine](../swarm/engine-agent.md) / [Electrical](../swarm/electrical-agent.md) /
[Fuel](../swarm/fuel-agent.md)) read it as hard evidence — a code outranks a described
symptom (per [../swarm/README.md](../swarm/README.md)). [Safety](../swarm/safety-agent.md)
escalates B/C/U safety codes; [Trust](../swarm/trust-agent.md) prevents "code = expensive
part" over-diagnosis; [Cost](../swarm/cost-agent.md) bands the real fix.

## Roadmap (honest stubs — COSDF §3)
- Web-Bluetooth ELM327 live read (DTC + freeze-frame + PIDs) = **LIVE** on supported
  devices. Auto-scan + continuous logging dashboard + per-make proprietary codes = roadmap.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
