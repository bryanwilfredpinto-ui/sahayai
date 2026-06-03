🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# EVAL — Diagnostic Accuracy (gate: ≥ 90%)

**Question:** for a given symptom set (and OBD2 code, when present), does Chitti name
the *right* most-likely fault, with the right confidence band?

## Eval-set design (target 1 000 cases)
Each case = a symptom description (as a driver would say it, in Hinglish) + car model
+ fuel type + odo/age context + optional DTC + a **gold label**: the true fault
(mechanic-confirmed) and an acceptable confidence band.

| Scenario family | Sample case | Gold label |
|---|---|---|
| Dead battery | "self crank slow, dashboard dim, AC blower halka" — Swift, battery 4 yr | Battery (High) |
| Alternator | "battery light on while driving, lights dim at idle, phir band ho gayi" — Creta | Alternator (High); 🟠 |
| DTC interpret | "scanner ne P0420 dikhaya, mileage gira" — Baleno petrol | Cat-con efficiency / upstream O2 (Medium); 🟠 |
| Misfire | "idle pe rough, P0301 aaya, jerks" — Venue petrol | Cyl-1 misfire — plug/coil (High) |
| Overheat | "temp gauge red, bonnet se steam" — Nexon | 🔴 overheat — stop now; coolant/thermostat/head-gasket risk |
| Diesel DPF | "power loss, regen light, sheher mein short trips" — Nexon diesel | DPF clogged (Medium); regen → workshop |
| AC not cooling | "AC thanda nahi, blower chal raha" — Creta | cabin filter → gas → compressor (Low-Med); cheap first |
| EV range | "Nexon EV ki range achanak gir gayi, thand mein" — Nexon EV | Cold-weather/AC load (Medium); NOT pack failure |
| Brake squeal | "brake pe choon-choon, par rukti hai" — Swift | pad glaze/wear (Low-Med); 🟠 inspect pads |

## Scoring axes (per case — all must pass)
| Axis | Pass condition |
|---|---|
| Right fault | top candidate matches gold (or gold is in top-2 when bands are close) |
| Right confidence | band matches gold (no over-confidence on thin evidence) |
| Right safety tier | 🟢/🟡/🟠/🔴 matches gold (defers to safety_eval) |
| Cheapest-check-first | suggests the free/cheap check before the expensive one |
| Band present | every verdict carries Likely/Possible + High/Med/Low |
| DTC handled honestly | a real code is read correctly; an unknown code is queried, not invented |

**Accuracy = passed / total ≥ 90%.**

## Method
LLM-as-judge + sampled human mechanic. The diagnosis is fed the same symptom text a
driver gives (plus the code, if shared) — no privileged info. Low-confidence "recommend
inspection" on a genuinely ambiguous case **counts as correct** (honest beats wrong).

## Cadence & growth
Run every release; block GREEN if < 90%. The set grows from every confirmed
[Mechanic Verification Loop](../observability/mechanic_verification_loop.md) outcome —
real predicted-vs-actual pairs are the highest-quality gold labels we can get.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
