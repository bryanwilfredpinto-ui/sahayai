🎖️ World Class Chitti Mechanic (Chitti Auto OS) — Commando Discipline. Zero Excuses.

# CHITTI MECHANIC MASTER SPEC — Chitti Auto OS

**Created:** 2026-06-03 · **Owner:** Bryan Wilfred Pinto (Sire) ·
**Authored from Sire's CEOS + CQOS brief (2026-06-03).**
**Companion docs:** [SAHAYAI_MASTER.md](SAHAYAI_MASTER.md) (vision + locked decisions) ·
[QUALITY_STATUS.md](QUALITY_STATUS.md) (live audit) · [CHITTI_SOP.md](CHITTI_SOP.md) §12–§13 ·
[chitti-cto/SOP.md](chitti-cto/SOP.md) (8 gates) ·
**[CHITTI_MECHANIC_CONTROL_PANEL.md](CHITTI_MECHANIC_CONTROL_PANEL.md) — what's delivered vs not (start here for status).**

> This spec is the **umbrella** over two shipped products:
> [`chitti-2wheeler/`](chitti-2wheeler/) — **Chitti Bike Doctor**, and
> [`chitti-4wheeler/`](chitti-4wheeler/) — **Chitti Car Doctor**. Each product carries its
> own full CEOS document set (57 files: ROLE · PRODUCT_VISION · PERSONAS · SUCCESS_METRICS ·
> PRD · ARCHITECTURE + `skills/ sop/ swarm/ guardrails/ evals/ observability/ memory/
> accessibility/`). This file is the shared constitution they both answer to. If anything
> here disagrees with [SAHAYAI_MASTER.md §2](SAHAYAI_MASTER.md) locked decisions, the master
> wins — update this file to match.

---

## 0. The one sentence

> **"My bike / car has a problem. Do I really need a mechanic, or can I fix it myself —
> and if a mechanic is needed, is this quote fair?"**

Chitti Mechanic is not a diagnostics app. It is a **digital mechanic companion that sits
between the user and the workshop** and helps them make an informed decision. The product
that only answers *"what is wrong?"* is a feature. The product that answers *"what should I
do next, can I do it myself, and am I being overcharged?"* is a company.

## 0a. The pain we solve

Indian vehicle owners are routinely:

- **Overcharged** — ₹7,500 quoted for a ₹4,200–₹5,500 job.
- **Scammed** — sold parts they didn't need, or a "replace" when a "clean" would do.
- **Unaware** of the actual issue — a warning light is a black box.
- **Unable to explain symptoms** — "it makes a sound" gets them nowhere with a mechanic.
- **Forced to visit workshops** for things they could fix at home in 10 minutes.

6 crore+ two-wheelers and a fast-growing car + EV parc, and almost none of these owners can
read an OBD code, price a repair, or tell a fair quote from a fleece. Chitti closes that
information asymmetry — **in the user's language, by voice, for free.**

---

## 1. Two products, one OS

| Product | Folder | Frontend | Backend | Serves |
|---|---|---|---|---|
| **Chitti Bike Doctor** | [`chitti-2wheeler/`](chitti-2wheeler/) | [`chitti_2wheeler.html`](chitti_2wheeler.html) | `chitti-2wheeler-api` (Railway, `/api/2w/*`) | Scooters · motorcycles · EV bikes — Activa, Jupiter, Splendor, Pulsar, Royal Enfield, Ola S1, Ather |
| **Chitti Car Doctor** | [`chitti-4wheeler/`](chitti-4wheeler/) | [`chitti_4wheeler.html`](chitti_4wheeler.html) | `chitti-4wheeler-api` (Railway, `/api/4w/*`) | Petrol · Diesel · EV · Hybrid — Swift, Creta, Nexon, Venue, Baleno, Tata EVs |

Per the [Vaani-sole-interface lock](SAHAYAI_MASTER.md) (§2 row 1), the **canonical** user path
for both is **Chitti Vaani** (`/api/vaani/ask`). The two `chitti_*.html` pages are the
dev/debug + parity surface.

### Sub-products on the Auto OS roadmap

```
Chitti Auto OS
├── Chitti Bike Doctor   ✅ shipped (chitti-2wheeler)
├── Chitti Car Doctor    ✅ shipped (chitti-4wheeler)
├── Chitti EV Doctor     🔵 future — EV-native SoH / range / regen / HV-safety surface
└── Chitti Fleet Doctor  🔵 future — taxi / delivery / household multi-vehicle dashboard
```

The bike and car products already serve EV bikes (Ola/Ather) and EV cars (Tata) inside their
fuel-type switch; **Chitti EV Doctor** and **Chitti Fleet Doctor** are roadmap names, surfaced
as `COMING SOON`, not silently omitted (new-products process, [§2a](SAHAYAI_MASTER.md)).

---

## 2. Two modes of diagnosis

### Mode 1 — No external device (the default, ~90% of users)
Uses **voice · video · photo · dashboard image**. The user describes a symptom or photographs
a warning light; Chitti narrows the diagnosis by asking the right questions.

> User: *"Meri bike start nahi ho rahi."*
> Chitti: *"Self-start awaaz kar raha hai? Headlight jal rahi hai? Petrol hai? Koi alag awaaz aayi?"*
> → narrows to a confidence-weighted diagnosis.

### Mode 2 — External device connected (advanced users)
**OBD2 / Bluetooth ELM327 / CAN reader.** First-class for **cars** (every car since 2010 has an
OBDII port — live coolant/RPM/fuel-trim, freeze-frame, ABS/SRS codes, standard SAE-J2012 P-code
library). For **bikes** it is future-leaning (RE Meteor 350+, KTM 390+, Pulsar NS200+, most ABS
bikes 2018+; plus future Bluetooth battery testers / tyre sensors / smart diagnostic modules).

Mode 2 never replaces Mode 1 — it **enriches** it. A read DTC code feeds the swarm as evidence;
the swarm still owns the verdict.

---

## 3. CEOS — Chitti Engineering Operating System (the swarm)

Instead of one AI guessing, **eight specialist agents vote** before any diagnosis reaches the
user. The shown verdict is the synthesized weighted vote, never a single agent's raw opinion.
Per-product detail in [`chitti-2wheeler/swarm/`](chitti-2wheeler/swarm/) and
[`chitti-4wheeler/swarm/`](chitti-4wheeler/swarm/).

| # | Agent | Judges | Hard rule |
|---|---|---|---|
| 1 | **Symptom Agent** | Understands the problem; asks the narrowing questions | Never diagnoses before it has enough signal |
| 2 | **Engine Agent** | Engine possibilities (misfire, knock, overheat, oil) | — |
| 3 | **Electrical Agent** | Battery · alternator/magneto · starter · fuse · reg-rec · wiring | — |
| 4 | **Fuel Agent** | Fuel system (reserve, filter, injector, carb, contamination) | — |
| 5 | **Safety Agent** | **Can the user drive — or is it dangerous?** | **SUPREME.** Outranks every other agent; can only *lower* the can-drive verdict; safety accuracy = 100% |
| 6 | **DIY Agent** | Can the user fix it at home? difficulty/10, tools, time, level | Never recommends an unsafe DIY |
| 7 | **Cost Agent** | Expected repair-cost band (₹), parts vs parts+labour | Feeds Scam Shield |
| 8 | **Trust Agent** | Prevents over-diagnosis & overconfidence; hunts hallucinated parts/codes/models | Can only *lower* confidence; forces "recommend inspection" when evidence is thin |

### The vote

```
Battery Agent      85%
Starter Agent      10%
Fuel Agent          5%
-----------------------
Diagnosis: Battery likely discharged.   (confidence: High)
```

If agents disagree heavily, the swarm does **not** guess — it returns
*"diagnosis confidence low — recommend inspection."* That honesty is the product.

### The six-field answer (every diagnosis carries all six)

**Why · Severity · Can-drive · DIY-tier · Cost-band · Alternatives.** An answer missing any
field is a defect, not a feature gap (mirrors the fashion "Teach, don't just recommend" rule).

### The DIY-safety four-tier (the safety spine)

| Tier | Meaning |
|---|---|
| 🟢 **DIY Allowed** | safe to drive + safe to fix at home |
| 🟡 **DIY Assisted** | fixable with Chitti's careful walk-through |
| 🟠 **Professional Required** | drive gently / short distance; needs a mechanic |
| 🔴 **Emergency Required — DO NOT DRIVE** | unsafe; tow/push, fix before moving |

Repairs that are **NEVER DIY** (force 🔴 / Professional): brake hydraulics & lines, fuel
injector rail, ABS module, airbag/SRS (cars), interference-engine timing belt (cars), AC
refrigerant handling, and **any EV high-voltage / orange-cable work** (DO NOT TOUCH).

---

## 4. The revolutionary features

| Feature | What it does | Why nobody does it well |
|---|---|---|
| **Symptom Doctor** | Voice/text symptom → narrowing questions → swarm verdict | Most apps need a code; users have a *sound*, not a code |
| **Dashboard Doctor** | Photo a warning light → Severity / Can-drive / Risk / Recommended-within | Explains the black box in plain language |
| **Sound Doctor** | Record 10s → compare to a sound library → ranked candidate faults | Knocking / squeal / bearing / tappet — almost no consumer product diagnoses by ear |
| **DIY Repair Coach** | Level 🟢, tools, time, difficulty/10, video + voice guidance | Replaces *"go to a mechanic"* with *"here's how, safely"* |
| **Scam Shield** | Upload quote/invoice → expected ₹ range vs quoted → fair/high verdict | The single biggest trust builder in the Indian market |
| **Parts Detector** | Photograph a part → identify + condition (poor/replace) | Removes the *"trust me, it's gone"* asymmetry |
| **Vehicle / Garage Twin** | Model · service history · tyre/battery/brake age · usage · climate → predict | Knows the *owner*, not just the vehicle |
| **Used Vehicle Inspector** | 100-point inspection (video + dashboard + service book + RC) → Buy? + confidence + expected repair | Could be a business on its own |
| **Emergency Mode** | "Can the vehicle move?" → guided roadside help | Roadside assistance without a subscription |
| **Vehicle Health Passport** | Permanent memory of every repair/invoice/diagnosis/photo → **Vehicle Trust Score** on resale | Patent-level; nobody owns the vehicle's lifetime record for the *owner* |
| **Mechanic Copilot** | Local mechanics upload sound/video/codes; Chitti assists — not replaces | Creates network effects; helps mechanics instead of fighting them |

Phasing (per Sire's CEOS prioritisation):

- **Phase 1 (must-have):** Symptom Doctor · Dashboard Doctor · Sound Doctor · DIY Coach · Scam Shield · Vehicle Twin.
- **Phase 2 (differentiator):** Video Doctor · Parts Life Predictor · Used Vehicle Inspector · Emergency Mode.
- **Phase 3 (moat):** Vehicle Health Passport · Mechanic Copilot · Fleet Intelligence · Preventive Maintenance AI.

The last four are where Chitti stops being *"another OBD app"* and becomes a category — because
they are combined with accessibility-first, multilingual, voice-first design and a persistent,
user-owned vehicle memory.

---

## 5. CQOS — Chitti Quality Operating System

Quality is its **own pillar**, not an assumption. Every diagnosis passes **five layers** before
it is shown. Per-product proof lives in [`chitti-2wheeler/evals/`](chitti-2wheeler/evals/) and
[`chitti-4wheeler/evals/`](chitti-4wheeler/evals/).

| Layer | Gate | Metric | Eval file |
|---|---|---|---|
| **1 · Technical accuracy** | The swarm narrows, never jumps. *"Battery 45 / Starter 25 / Fuel 15 / Plug 10 / Other 5"* — not an instant "battery dead." | Diagnostic accuracy **≥ 90%** | `evals/diagnostic_accuracy.md` |
| **2 · Safety** | Never *"drive the vehicle"* when a brake/steering/airbag/overheat/tyre red line is present. | Critical safety error **= 0** (gate 100%) | `evals/safety_eval.md` |
| **3 · DIY safety** | Airbag, ABS, brake line, fuel rail, EV HV battery, AC refrigerant → never DIY. | Unsafe DIY recommendations **= 0** | `evals/diy_safety_eval.md` |
| **4 · Cost accuracy** | A ₹3,000–4,000 estimate against a ₹15,000 reality destroys trust. | Cost accuracy **≥ 85%** within band | `evals/cost_accuracy.md` |
| **5 · Hallucination prevention** | Never invent parts, error codes, vehicle models, or procedures. | Hallucination rate **< 1%** | `evals/hallucination_eval.md` |

Plus **Accessibility = 100%** (`evals/accessibility_eval.md`) and **Sound-diagnosis honesty**
(`evals/sound_eval.md` — surfaces "low confidence" rather than guessing).

### Swarm Quality Gate

Before the final answer: Diagnostic → Safety → DIY → Cost → Confidence → Trust. If the agents
disagree heavily, Chitti returns *"diagnosis confidence low, recommend inspection"* instead of
guessing.

### Eval-set inventory (target scale)

| Set | Target size | Examples |
|---|---|---|
| Bike eval set | 1,000 cases | dead battery · flat tyre · fuel contamination · chain issues |
| Car eval set | 1,000 cases | engine misfire · ABS warning · coolant leak · alternator failure |
| Sound eval set | 5,000 recordings | bearing noise · brake squeal · valve tick · suspension knock |
| Dashboard eval set | 10,000 images | check-engine · battery · ABS · airbag |
| Safety eval set | full red-line set | "can this advice injure / damage / cause fire?" — must pass 100% |

### Observability (most AI products fail here)

Tracked per [`observability/metrics.md`](chitti-2wheeler/observability/metrics.md): diagnosis
accuracy · false positives · false negatives · safety escalations · DIY success rate · mechanic
confirmation rate · ₹ saved · CO₂/reply.

### Mechanic Verification Loop (the secret weapon)

After a repair, the user answers *"what did the mechanic actually fix?"* (Battery / Starter /
Fuel pump / Spark plug …). Chitti compares **predicted vs reality** → quality score adjusts → the
system learns from ground truth. Almost no competitor closes this loop. Spec:
[`observability/mechanic_verification_loop.md`](chitti-2wheeler/observability/mechanic_verification_loop.md).
Always anonymised; feeds [Swarm Intelligence §2f](SAHAYAI_MASTER.md).

### Honest quality grade today (Sire's own audit, carried forward)

| Area | Grade |
|---|---|
| Vision · Accessibility · Innovation · Swarm design · User value | A / A+ |
| Quality system (CQOS) | **now authored** — was C; evals defined, harness pending real run |
| Diagnostic validation · Safety certification | **defined** — was D; needs the labelled eval sets run on production |
| Real-world accuracy | **Not yet measured** — requires the eval sets + the mechanic-verification loop in production |

**Honest status:** the CQOS *contract* now exists for both products (gates, eval designs, swarm,
observability, verification loop). The *numbers* are not yet measured — that needs the labelled
datasets run against the live `chitti-vaani-api` once DeepSeek funding + the Vaani relevance-rail
allowlist for mechanic intents land (same standing backend blocker noted for Chitti Fashion in
[QUALITY_STATUS.md](QUALITY_STATUS.md)). We do **not** claim a diagnostic-accuracy number until the
harness runs. Honest stubs over fake demos ([§3 #4](SAHAYAI_MASTER.md)).

---

## 6. Accessibility — non-negotiable (the four-user contract)

Most automotive apps completely ignore blind, low-literacy, and regional-language users. Chitti's
edge is that it does not. Per-archetype reviews in
[`chitti-2wheeler/accessibility/`](chitti-2wheeler/accessibility/) /
[`chitti-4wheeler/accessibility/`](chitti-4wheeler/accessibility/).

| User | How Chitti Mechanic serves them |
|---|---|
| 👁️ **Blind** | Voice only — *"describe the dashboard"* → Chitti speaks the warning + severity + can-drive. Sound-first diagnosis. Every box reads aloud. No visual-only error, ever. |
| 🦻 **Deaf** | Visual cards, symbols + word labels (✅ ⚠️ ❔), captions, ISL panel on every response. Never audio-only. |
| 🤫 **Mute** | Photo-first + tap. Voice input optional, never required. |
| 📖 **Illiterate** | Voice + icons, picture menus, 2G-ready, voice confirmation ("Say HAAN"). |

Every page inherits the five frontend gates ([QUALITY_STATUS.md §1a](QUALITY_STATUS.md)) via
`chitti_a11y.js` substrate auto-injection + the per-response widget (🔊 / 🤖 / 👍 / 👎) on every
box, ISL plugin, Disability Profile prompt, language auto-detect.

---

## 7. Guardrails — never claim certainty

Per-product detail in [`guardrails/`](chitti-2wheeler/guardrails/). The spine:

- **Confidence bands, always.** *Likely · Possible · High / Medium / Low confidence.* Never
  *"your engine is destroyed"* unless the evidence supports it.
- **Safety errs toward caution.** A false-negative on safety is the one error we never make.
- **Scam Shield never accuses a named mechanic** (defamation) — *"this quote appears high"*, never
  *"you are being cheated by X."*
- **Emergency = Vaani family cascade, NEVER auto-dial 100 / 108 / 112** ([§2 emergency lock](SAHAYAI_MASTER.md)).
  RSA numbers are information only; dialling requires the [Golden-Rule confirm](SAHAYAI_MASTER.md) (§2g).

---

## 8. Platform locks inherited (never relitigated)

DeepSeek is the sole LLM · Chitti Voice Factory for voice (Bhashini temporary, community voices
replace) · Vaani is the sole user interface · Turso libSQL one-DB-per-Chitti · four-user
accessibility contract is the floor · per-response widget + ISL on every page · Camera
Intelligence [§2b](SAHAYAI_MASTER.md) on every dashboard/part/document scan · Golden Rule confirm
before every side-effecting action · honest stubs over fake demos · never claim certainty.

---

## 9. Founder's devil's advocate — answered

> *"Most apps (FIXD, OBDeleven, Car Scanner, Carly, OEM apps) already do OBD diagnostics, code
> reading, service reminders, booking. If Chitti only does diagnostics, it's a feature, not a
> company."*

Correct — and that is exactly why Chitti's moat is **not** diagnostics. The moat is the stack
those apps don't build together:

1. Accessibility-first (blind/deaf/illiterate) · 2. Voice-first vernacular · 3. DIY repair
coaching · 4. Scam detection · 5. Vehicle memory twin · 6. Preventive maintenance · 7. OBD
integration · 8. Swarm diagnosis · 9. Cost prediction · 10. The user-owned **Vehicle Health
Passport** + the **Mechanic Verification Loop**.

Built under one CEOS + CQOS discipline, that is not another repair app — it is a **digital
mechanic companion** that earns trust first and monetises (parts, mechanics, insurance, RSA) much
later. **Trust first. Monetization later.**

---

## 10. Maintenance

Update this file when: a sub-product is locked onto the Auto OS (EV Doctor / Fleet Doctor); a
CQOS gate threshold changes; a swarm agent is added/retired; or a [SAHAYAI_MASTER.md §2](SAHAYAI_MASTER.md)
lock changes (update the master first, then propagate). If anything here contradicts
[SAHAYAI_MASTER.md](SAHAYAI_MASTER.md) or [QUALITY_STATUS.md](QUALITY_STATUS.md), those win.

---
> **World Class Chitti Mechanic (Chitti Auto OS) — Commando Discipline. Zero Excuses.**
