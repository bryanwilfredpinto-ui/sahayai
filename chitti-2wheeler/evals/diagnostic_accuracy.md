🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# EVAL — Diagnostic Accuracy (gate: ≥ 90%)

**Question:** for a given symptom set, does Chitti name the *right* most-likely fault,
with the right confidence band?

## Eval-set design (target 1 000 cases)
Each case = a symptom description (as a rider would say it, in Hinglish) + bike model
+ odo/age context + a **gold label**: the true fault (mechanic-confirmed) and an
acceptable confidence band.

| Scenario family | Sample case | Gold label |
|---|---|---|
| Dead battery | "self-start click karta, light dim, kal raat thik thi" — Activa, battery 3 yr | Battery (High) |
| Flat / slow puncture | "subah tyre baith gaya tha, pump kiya, phir baith gaya" — Splendor | Tube puncture (High); 🟠 inspect before riding |
| Fuel contamination | "naye pump se petrol bhara, ab jhatke de rahi" — Pulsar 150 | Contaminated fuel (Medium); drain |
| Chain issue | "peeche se khat-khat, chain dheeli dikh rahi" — RE Classic | Chain slack/worn (High); 🟠 |
| Misfire | "load pe dhak-dhak, mileage gira" — Pulsar 220, plug 14k km | Spark plug/coil (Medium) |
| Won't-start (cranks) | "self chalta hai par start nahi hoti, petrol hai" — R15 | Spark/FI (Medium); rule plug→coil |
| Brake squeal | "brake pe choon-choon awaaz, par rukti hai" — Activa | Pad glaze/dust (Low–Med); 🟠 inspect pads |

## Scoring axes (per case — all must pass)
| Axis | Pass condition |
|---|---|
| Right fault | top candidate matches gold (or gold is in top-2 when bands are close) |
| Right confidence | band matches gold (no over-confidence on thin evidence) |
| Right safety tier | 🟢/🟡/🟠/🔴 matches gold (defers to safety_eval) |
| Cheapest-check-first | suggests the free/cheap check before the expensive one |
| Band present | every verdict carries Likely/Possible + High/Med/Low |

**Accuracy = passed / total ≥ 90%.**

## Method
LLM-as-judge + sampled human mechanic. The diagnosis is fed the same symptom text a
rider gives — no privileged info. Low-confidence "recommend inspection" on a genuinely
ambiguous case **counts as correct** (honest beats wrong).

## Cadence & growth
Run every release; block GREEN if < 90%. The set grows from every confirmed
[Mechanic Verification Loop](../observability/mechanic_verification_loop.md) outcome —
real predicted-vs-actual pairs are the highest-quality gold labels we can get.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
