🎖️ World Class Chitti Mechanic (Chitti Auto OS) — Commando Discipline. Zero Excuses.

# ROADSIDE SELF-FIX ENGINE — reverse-engineered master-mechanic process

**Created:** 2026-06-04 · **Goal (Sire):** *"Build it so users don't have to go to a mechanic
when the vehicle breaks down."* · **Companion:** [CHITTI_MECHANIC_MASTER_SPEC.md](CHITTI_MECHANIC_MASTER_SPEC.md).

> A breakdown happens on a highway, in the rain, at night, with one bar of signal. So the #1
> engineering decision: **this engine is 100% offline and deterministic.** No LLM round-trip,
> no network, no waiting. The knowledge lives in [`chitti_breakdown_kb.js`](chitti_breakdown_kb.js)
> (service-worker cached), runs entirely in the browser, speaks every step aloud, and works in
> 9 languages. The LLM (Swarm Diagnosis) is the *online* deep-dive; this is the *offline lifeline*.

---

## 1. How a 20-year mechanic actually thinks (the process, reverse-engineered)

A master roadside mechanic does **not** start with "what's the fault." They run a fixed loop:

1. **SAFETY FIRST — can we even work here?** Off the road? Hazards on? Engine cool enough to touch?
   Fuel smell / smoke / sparks → *stop, move away, this is not a DIY moment.* A wrong "open the
   radiator now" scalds someone. Safety is the supreme gate (mirrors [swarm safety-agent](chitti-2wheeler/swarm/safety-agent.md)).
2. **TRIAGE by the cheapest signal.** Before touching anything, ask the questions that split the
   tree fastest:
   - *Does it crank/turn over?* (no-crank → electrical/battery; cranks-no-fire → fuel/spark)
   - *Lights / horn working?* (dead → battery/earth; fine → starter/ignition)
   - *Is there fuel?* (the #1 "breakdown" that isn't one)
   - *Any smell / smoke / noise / colour?* (burning, petrol, white/blue/black smoke)
3. **MOST-LIKELY-FIRST, ordered by `likelihood × ease-of-check`.** A pro checks the 30-second free
   things before the 30-minute ones. Battery terminal before starter motor. Reserve switch before
   carburettor. This is Bayesian triage: cheap, high-probability checks first.
4. **CAN THE OWNER DO IT, SAFELY, WITH WHAT THEY HAVE?** Every cause carries a verdict:
   - 🟢 **DIY now** (reserve switch, loose terminal, kill-switch, side-stand, fuse, push-start, plug clean)
   - 🟡 **DIY with care** (jump-start, spare-tyre change, chain re-seat, plug swap)
   - 🔴 **Do NOT attempt — tow / family cascade** (brake failure, overheating engine, fuel leak, HV-EV)
5. **TEACH THE FIX in short, spoken, tappable steps** — never a paragraph. Each step is one
   imperative ("Reserve switch ON → kick 5 times"), spoken aloud, with the tool + time + difficulty.
6. **IF IT STILL FAILS → honest exit:** *"This needs a workshop. Here's the likely part, the fair
   price band so you're not overcharged, and the family-cascade SOS."* Never auto-dial cops
   ([emergency-protocol](chitti-2wheeler/guardrails/emergency-protocol.md)).

The app encodes this loop verbatim. Nobody is sent to a mechanic for a reserve switch or a loose
terminal — and nobody is told to bleed their own brakes on the shoulder of a highway.

---

## 2. Architecture (offline-first)

| Layer | What | Why |
|---|---|---|
| **Knowledge** | [`chitti_breakdown_kb.js`](chitti_breakdown_kb.js) — pure-data module, per-string 9-language fields, no network | Roadside = no connectivity; deterministic = no hallucination |
| **Runtime** | embedded in `chitti_2wheeler.html` / `chitti_4wheeler.html` as a 🆘 **Roadside Self-Fix** wizard | One tap on the SOS surface → symptom grid → ranked causes → step-by-step fix |
| **Voice** | every step spoken via Voice Factory / `speakText` in the active language | Blind / illiterate / hands-greasy users (four-user contract) |
| **Offline cache** | `chitti_offline.js` service-worker caches the KB + page | Survives the highway dead-zone |
| **Online deep-dive** | falls through to **Swarm Diagnosis** (LLM) only when the offline tree says "inspection / confidence low" and there IS signal | Best of both: instant offline triage, deep online reasoning |

---

## 3. Coverage — the breakdowns that strand people (≈80% of real roadside calls)

### 2-Wheeler (`chitti_breakdown_kb.js` → `bike[]`)
1. Won't start — no crank / no kick response (electrical)
2. Won't start — cranks/kicks but won't fire (fuel / spark)
3. Stalls / cuts out while riding
4. Overheating (liquid-cooled + air-cooled)
5. Flat tyre / puncture (tubeless plug + tube)
6. Chain came off / chain jammed / chain too loose
7. All electrics dead — no lights, no horn
8. Won't move — clutch / gear stuck
9. Smoke from engine / exhaust (white / blue / black)
10. 🔴 Brake failure — DO NOT RIDE

### 4-Wheeler (`chitti_breakdown_kb.js` → `car[]`)
1. Won't start — no crank / single click (battery / starter / immobiliser / not-in-P)
2. Won't start — cranks but won't fire (fuel / pump / immobiliser)
3. 🔴 Overheating — temp gauge red / steam (STOP)
4. Flat tyre — safe stepney change
5. Battery dead — safe jump-start sequence
6. Won't move — auto in gear / clutch / handbrake / parking-lock
7. Warning light on dash (severity by behaviour)
8. Smoke colour (white / blue / black)
9. 🔴 Brake failure / spongy pedal — STOP / tow
10. Locked out / key-fob dead (fob battery + mechanical key)

---

## 4. Data schema (per scenario)

```js
{
  id:'bike_no_start_crank', v:'2w', icon:'🔋',
  name:{en, hi, ta, te, bn, mr, gu, kn, ml},
  safety:{ red:false, warn:{...9} },            // when NOT to attempt; red=true → tow only
  causes:[{
    name:{...9}, pct:0-100,                       // ordered most-likely-first
    tier:'green'|'amber'|'red',                   // DIY / DIY-care / tow
    tools:{...9}, timeMin:Number, diff:1-10,
    check:{...9},                                 // the one question that confirms it
    steps:[{...9}, ...],                          // short spoken imperatives
    ifFails:{...9},                               // next cause or honest tow
    mechCost:'₹band'                              // fair price if a shop does it (anti-overcharge)
  }],
  towMsg:{...9}                                   // the honest "now call family / tow" exit
}
```

Quality gates inherited: never-claim-certainty (the list is *likely* causes), safety=100%
(red-line scenarios never get DIY steps), §5 no-Hinglish (every visible string is in the 9-language
bag), four-user contract (voice-out on every step, icon + word, tap-only).

---
> **World Class Chitti Mechanic (Chitti Auto OS) — Commando Discipline. Zero Excuses.**
