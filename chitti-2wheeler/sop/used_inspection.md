🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SOP-005 — Used-Bike Inspection (10-point pre-purchase)

**COSDF L7 SOP-005.** Trigger: *"yeh second-hand bike le lun? check kar do"* /
*"used bike inspection"*. This is the disciplined **10-point** walk-through Chitti runs
before a rider buys a used 2-wheeler. It is the deterministic core; the fuller
zone-by-zone walk-through and price band live in the
[used-bike-inspection SOP](./used-bike-inspection.md) — this SOP-005 is its checklist
spine, ordered **safety-critical first**, ending in a GREEN / YELLOW / RED buy call.

> **Hard floor:** a 🔴 safety item (brakes / tyres / steering / fork / chain / frame)
> = **walk away or fix-before-ride**. Chitti never says "looks fine, buy it" over a
> brake or steering red line, no matter how good the price.

## Before you start
Capture **model, year, odometer, asking price** → pull the fair resale band (so the
final call has a number). If a [Vehicle Health Passport](../memory/vehicle_health_passport.md)
exists for that bike, surface its Trust Score — a verified history beats any visual check.

## The 10 points (safety-critical first)
| # | Point | What to check | A 🔴 here = |
|---|---|---|---|
| **1** | **Walk-around / panel gaps** | uneven panel gaps, mismatched paint shade, overspray, fresh weld marks on frame = past accident | accident-repaired frame |
| **2** | **Tyres + DOT/date** | tread depth, cuts/cracks/bulges, age (manufacture week-year on sidewall — > 5 yr is hard rubber) | cord showing / cracked sidewall |
| **3** | **Brakes** | lever/pedal firm bite, no spongy travel, pad/shoe left, disc not deeply scored, no fluid leak | no bite / fluid leak / metal-on-metal |
| **4** | **Steering + fork** | bars centre freely, no notchy head-bearing, fork doesn't leak oil onto brake, no bottoming | steering free play / fork oil on disc |
| **5** | **Chain + sprocket** | chain slack within spec, no kink/tight-spot/rust, sprocket teeth not hooked | kinked chain about to snap |
| **6** | **Underbody / frame rust** | rust under tank, near welds, swingarm, centre stand mounts | structural rust / cracked frame |
| **7** | **Cold-start engine bay** | start it **cold** (a warm engine hides smoke + hard-start); steady idle? smoke colour ([SOP-004](./smoke_color.md))? knock? | blue/white smoke + knock |
| **8** | **Oil filler cap** | open it: creamy "mayonnaise" residue = coolant mixing (head gasket) on liquid-cooled bikes; gritty/black sludge = neglect | mayonnaise / coolant in oil |
| **9** | **Startup warning lights + electrical** | all cluster lamps light then clear; self-start crisp; lights/horn/indicators work; battery age | FI/engine lamp stuck on |
| **10** | **Documents + test ride** | RC, valid insurance, valid PUC, no pending challan, **chassis number = RC**; test-ride for sounds, gear shifts, pulling to one side, OBD2 scan if equipped | chassis ≠ RC / pending challan / no papers |

## Scoring → buy call
1. **Each point → spoken verdict + symbol** ✅ / ⚠️ / 🔴 (never colour alone).
2. **Sum to a buy/skip read** with a cost-to-fix and a negotiated price, e.g.:
   *"Engine aur brakes theek (✅), par chain set jald badalna padega (~₹2,500) aur tyres
   purane (⚠️). Asking ₹45,000 — ₹41,000 tak baat karo."*
3. **GREEN / YELLOW / RED** overall:
   | Grade | Meaning |
   |---|---|
   | 🟢 **GREEN** | no safety red lines; minor wear only; fair price → buy / negotiate |
   | 🟡 **YELLOW** | fixable issues that lower the price; buy only after factoring repair cost |
   | 🔴 **RED** | a safety red line, accident frame, doc mismatch, or coolant-in-oil → **walk away** (or fix-before-ride if seller fixes it) |

## Verdict (box-element output)
Standard result card (🔊 / 🤖 / 👍👎 / ✏️🎙️ / 🌐), `data-chitti-response="tw_used_inspection"`:
- Overall GREEN/YELLOW/RED **spoken first**, with the safety items weighted highest.
- Confidence band on the overall read (a visual inspection is Possible, not certain) —
  the [Trust Agent](../swarm/trust-agent.md) caps confidence and never accuses the seller.
- Price **band**, not a single "right" number; cost-to-fix per flagged item.
- Quote-check on any repair via [Scam Shield](./scam-quote-check.md).

## Hard rules
- **Safety zones (points 1–6) inspected first and weighted highest** ([safety-rules](../guardrails/safety-rules.md));
  a 🔴 there overrides a great engine + great price.
- **Bands, not a single price**; always a confidence band on the overall read.
- **Never accuse the seller of fraud** — *"yeh weld accident ka ho sakta hai, confirm
  karo"*, not *"seller aapko dhokha de raha hai."*
- Cold-start point 7 is non-negotiable — never grade an engine that's already warm.
- Document mismatch (chassis ≠ RC, no insurance, pending challan) = 🔴 regardless of bike condition.

## Accessibility
Picture checklist + spoken walk-through, **one point at a time**. Tap ✅/⚠️/🔴 per
point (mute); each verdict spoken (blind) + symbol + word + ISL (deaf). The buyer can
photograph each zone instead of describing it. Works zone-by-zone on 2G — no need to
finish all 10 in one connection.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
