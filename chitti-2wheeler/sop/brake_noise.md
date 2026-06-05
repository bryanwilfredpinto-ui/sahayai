🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SOP-002 — Brake Noise (when-it-happens decision tree)

**COSDF L7 SOP-002.** Trigger: *"brake mein awaaz aa rahi hai"* / *"brake choo-choo
karta hai"* / *"brake dabane par ghisne ki awaaz"*. Brakes are the **supreme safety
system** — the [Safety Agent](../swarm/safety-agent.md) outranks every other agent here,
and **metal-on-metal grinding = STOP DRIVING** (🔴, no exceptions). Brake accuracy
target is the strictest in COSDF (**>95%**, critical safety errors **0**).

> **Hard floor:** a grinding (metal-on-metal) noise or a brake that doesn't bite is a
> 🔴 red line. Chitti says **DO NOT RIDE** before it says anything about cost.

## Step 0 — The one question that splits the tree
**"Awaaz kab aati hai?"** (when does the noise happen?)

| When | Most likely cause | First tier |
|---|---|---|
| **Only when you brake** | brake **pads** worn / glazed / dusty | 🟠 → Step 1 |
| **Constant, all the time (braking or not)** | wheel **bearing** or debris dragging on disc | 🟠/🔴 → Step 2 |
| **When turning / over bumps (not braking)** | **suspension / fork / wheel** play, not brakes | 🟠 → Step 3 |
| **Squeal that stops after a few brakes (morning damp)** | surface rust / dust on disc | 🟢 usually harmless → Step 4 |

## Step 1 — Braking-only noise → pads
| Noise | Reading | Action / tier |
|---|---|---|
| High squeal / chirp on light braking | dust, glaze, or wear-indicator touching | inspect pad thickness; clean; if < 2 mm → replace (🟠) |
| **Harsh grinding, scraping metal** | **pads gone — metal backing on disc** | 🔴 **STOP DRIVING** — do not ride, push/tow; grooves the disc, can fail to stop |
| Soft/spongy lever **and** noise | air / fluid leak / worn pads | 🔴 — brake hydraulics are Professional; do not ride |
| Drum brake squeal (rear, commuters) | shoes glazed or dust in drum | inspect; adjust/clean; replace shoes if thin (🟠) |

- **Visual pad + rotor check** (spoken walk-through): pad friction material left? disc
  scored/grooved/bluish? Any metal-on-metal mark = 🔴.
- Brake **pad replacement on a disc** is a careful 🟡/🟠 job; **bleeding/hydraulics**
  is **always 🟠 Professional** — the [DIY Agent](../swarm/diy-agent.md) may not coach it.

## Step 2 — Constant noise → bearing / drag
| Symptom | Cause | Tier |
|---|---|---|
| Hum/growl that changes with **wheel speed**, worse leaning | wheel **bearing** worn | 🟠 — wobble risk; inspect by rocking the wheel for play |
| Rhythmic scrape every wheel rotation | warped disc, stuck caliper, or stone/debris | 🟠; if caliper stuck (pulls/heats) → do not ride far |
| Wheel hot after a short ride | caliper dragging / seized piston | 🟠 — overheating brake, ride only to nearest help |
| **Free play when you rock the wheel** | bearing failing | 🔴 if severe — wheel can wobble/lock |

## Step 3 — Turning / bump noise → suspension, not brakes
Re-route to fork/suspension reasoning (Safety Agent owns the red lines): clunk over
bumps = worn fork bush / loose axle / head-bearing; **fork oil leaking onto the brake
disc = 🔴** (contaminated pads can't stop the bike). See the
[breakdown-roadside SOP](./breakdown-roadside.md) for the safe-stop wrapper.

## Step 4 — Harmless morning squeal
Light surface rust/dust on the disc after a damp night squeals for the first few
stops, then clears. 🟢 — reassure, no repair. **But** if it persists past the first km,
treat as Step 1.

## Step 5 — Verdict (box-element output)
Standard result card (🔊 / 🤖 / 👍👎 / ✏️🎙️ / 🌐), `data-chitti-response="tw_brake_noise"`:
- **Safety tier first, spoken first** — 🔴 DO NOT RIDE always sits at the top, above
  any "likely cheap pad" finding ([Safety Agent](../swarm/safety-agent.md)).
- Weighted cause + confidence band (Likely/Possible × High/Med/Low).
- Cost band + cheapest sufficient fix; quote-check via [Scam Shield](./scam-quote-check.md)
  (brake-pad overcharge is common). DIY tier from the [DIY Agent](../swarm/diy-agent.md).

## Hard rules
- **Metal-on-metal grinding → 🔴 STOP DRIVING.** Never "ride a little more, it's just
  dust." Never coach a hydraulic brake repair (bleed/seals) as DIY ([GUARDRAILS P0](../GUARDRAILS.md)).
- **Spongy lever / no bite / fluid leak → 🔴** do not ride, even if quiet.
- When a noise *could* be a brake or bearing hazard but evidence is thin, the Safety
  Agent errs to **caution** ("get it inspected before riding"), never "probably fine."
- Contaminated pads (oil/fork fluid on disc) cannot be cleaned reliably → 🔴 / replace.

## Accessibility
Spoken "when does it happen?" with big tap buttons (only-on-braking / always /
turning). Each verdict **spoken first** (blind) + symbol + word + ISL + screen flash
(deaf); 🔴 is an audible alert **and** a flashing red border, never colour alone.
Mute riders answer by tap + a photo of the pad/disc. Works on 2G.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
