🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SOP-001 — Bike Won't Start (crank / battery-voltage decision tree)

**COSDF L7 SOP-001.** Trigger: *"meri bike start nahi ho rahi"* / *"chaalu nahi
ho rahi"* / one-tap "Won't Start" button. This is the deterministic decision tree the
swarm grounds on — it runs free checks first, gates on battery voltage, and ships a
confidence band, never a guess. Companion to the broader
[breakdown-roadside SOP](./breakdown-roadside.md) (which adds the safety + location
wrapper) and the [dashboard-warning-light SOP](./dashboard-warning-light.md).

> **Golden Rule:** the cheapest free check is always offered before any "go to mechanic."
> #1 real-world cause in India is an empty reserve tank or a flipped kill-switch — both fixed at ₹0.

## Step 0 — Safety + location first (always)
1. *"Aap safe ho? Bike road se side mein hai?"* — get the rider off the carriageway.
2. Rider hurt / stranded in an unsafe spot → jump to the
   [family-cascade SOS](./emergency.md) (confirm → alarm → family → Chitti relay).
   **NEVER auto-dial 100 / 108 / 112.**

## Step 1 — The crank question (the tree splits here)
Ask one thing first: **"Self-start daba ke kya hota hai?"** (press the self-start — what happens?)

| Crank state | What it means | Go to |
|---|---|---|
| **No crank, lights/horn dead, faint click or nothing** | electrical / battery side | → Step 2 (battery voltage) |
| **No crank, but lights + horn fine** | start-circuit interlock, NOT a flat battery | → Step 3 (interlock checks) |
| **Cranks but won't fire** | fuel or spark, battery is fine | → Step 4 (fire checks) |

## Step 2 — Battery-voltage gate (no crank, lights dead)
If an OBD2/ELM327 link or a multimeter reading is available, gate on resting voltage
(engine off, key off, measured at the terminals):

| Resting voltage | Verdict | Action |
|---|---|---|
| **> 12.4 V** | battery **good** — fault is elsewhere | check terminals (corrosion/loose), main fuse, starter relay; if all clean → starter motor / wiring (🟠 Professional) |
| **11.5 – 12.4 V** | battery **low / discharged** | clean + tighten terminals, **kick-start if available**, push/jump-start, then ride 20+ min to recharge; if it drains again → charging fault (reg-rec) |
| **< 11.5 V** | battery **failed / deeply flat** | needs charge or **replacement** (lead-acid > 2.5 yr in Indian heat almost always failed); kick-start to get home if equipped |

- **No meter / no OBD?** Use proxies: dim headlight that brightens on revving = weak
  battery + working charging; horn weak / no click = flat battery; everything dead +
  bike is old = battery age first. Always state the confidence band — *"battery low
  lag raha hai, par bina voltage ke yeh Possible hai, High nahi."*
- Battery is the most over- AND under-diagnosed part — the
  [Trust Agent](../swarm/trust-agent.md) caps confidence when evidence is thin.

## Step 3 — Start-circuit interlock (no crank, but lights are fine)
This is the **#1 "battery is fine but it won't start" trap** on Indian commuters.
Walk these free checks, in order:

| Check | Bikes | Fix |
|---|---|---|
| **Kill switch** at RUN (not OFF/STOP)? | all with an engine kill switch | flip to RUN — free |
| **Side-stand up?** (sensor cuts starter) | Activa, Splendor BS-VI, most BS-VI | lift the stand — free |
| **Clutch pulled / in neutral?** (clutch-start interlock) | KTM, Pulsar, R15, geared bikes | pull clutch or shift to N — free |
| **Engine kill / immobiliser** (smart-key bikes) | Ather, Ola, TVS iQube, premium | key/app present + paired — free |
| **Main fuse** blown? | all | inspect/replace 7.5–15 A fuse (₹10–30) |
| **Starter relay** clicks? | all | clicks but no crank → relay or starter; no click → relay/wiring |

If every interlock is clear and the relay clicks but the starter doesn't spin →
starter motor / Bendix (🟠 **Professional**). Defers to the
[Electrical Agent](../swarm/electrical-agent.md).

## Step 4 — Won't-fire checks (cranks but doesn't catch)
Battery is fine if it cranks. Now it's **fuel or spark** — free/cheap first:

| Check | If… | Fix / tier |
|---|---|---|
| **Petrol hai? Reserve switched?** | empty / reserve not turned | the #1 cause — ₹0 |
| **Fuel cock / FI on?** (carb = ON/RES; FI = pump primes?) | off / no prime hum | turn cock to ON; no FI prime hum → fuel pump (🟠) |
| **Choke** (carb bikes, cold morning) | not applied | apply choke, retry — free |
| **Spark plug wet / fouled / black?** | yes | dry & clean the plug (🟡 DIY-assisted); gap or replace (₹100–300) |
| **Flooded** (smell of petrol, kicked many times) | yes | full-throttle no-choke cranks to clear, or wait 10 min — free |
| **Recent fuel from a doubtful pump?** | yes | possible bad/watered fuel — drain (🟠) |

## Step 5 — Verdict (the box-element output)
The swarm synthesises into the standard result card carrying the 5 mandatory elements
(🔊 / 🤖 / 👍👎 / ✏️🎙️ / 🌐) and `data-chitti-response="tw_not_starting"`:
- **Weighted likelihood** — e.g. *"Battery 80% / Starter 12% / Fuel 8% → battery discharged, High confidence."*
- **Can-I-ride / can-I-fix** — 🟢 DIY / 🟡 DIY-assisted / 🟠 Professional / 🔴 do-not-ride from the [Safety Agent](../swarm/safety-agent.md).
- **Cost band** + the cheapest sufficient fix first; quote-check via [Scam Shield](./scam-quote-check.md).
- **Confidence band, always** — Likely/Possible × High/Medium/Low. Never a bare "it's the battery."

## Hard rules
- Free checks (fuel, reserve, kill-switch, side-stand, clutch, fuse) **before** any
  "go to mechanic" — every time.
- **Never** declare "engine seized / starter dead" without crank + voltage + click
  evidence — over-diagnosis is a [Trust Agent](../swarm/trust-agent.md) red line.
- Battery voltage gates are **info**; if a rider has no meter, state the lower
  confidence honestly rather than bluffing a number.
- EV (Ather / Ola / iQube / Chetak): a dead HV traction battery or DC-DC fault is
  **never** rider-touchable — route to OEM/Professional, no terminal handling.
- Emergency path = [family cascade](./emergency.md), **never** cops.

## Accessibility
Spoken step-by-step + picture decision tree + tap-to-answer (mute/illiterate). The
crank question and the voltage verdict are **spoken first** (blind) and shown as
symbol + word + flash (deaf), never colour-only. *"Self-start daba ke kya hua? — koi
awaaz, ya bilkul shaant?"* with big tap buttons. Works zone-by-zone on 2G.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
