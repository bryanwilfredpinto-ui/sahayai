🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# WORLD_CLASS_FEATURES — Chitti Car Doctor (C4WOS v1.0)

> COSDF [LEVEL 15](../CHITTI_MECHANIC_COSDF.md) applied to the 4-wheeler. These are the
> ten differentiators that take Chitti Car Doctor from "a diagnosis chatbot" to "the
> car's guardian." Each carries an **honest status** verified against the real backend
> ([backend/routes/wheels.py](backend/routes/wheels.py),
> [backend/routes/doctor.py](backend/routes/doctor.py),
> [backend/lib/swarm.py](backend/lib/swarm.py)) and shipped substrate
> ([../chitti_ai_scanners.js](../chitti_ai_scanners.js),
> [../chitti_breakdown_ui.js](../chitti_breakdown_ui.js),
> [../chitti_obd_ble.js](../chitti_obd_ble.js)). Companion docs:
> [PRD.md](./PRD.md) (the COSDF F0–F12 crosswalk), [skills/FEATURES.md](skills/FEATURES.md),
> [../SAHAYAI_MASTER.md §2](../SAHAYAI_MASTER.md) (platform locks).

## Platform locks honoured (read first)

These never move — where a world-class feature exceeds them, the **excess is ROADMAP,
honestly stubbed, never faked** ([SAHAYAI_MASTER §2](../SAHAYAI_MASTER.md),
[CHITTI_MECHANIC_COSDF §3](../CHITTI_MECHANIC_COSDF.md)):

- **LLM:** DeepSeek only. Sound / vibration / vision **ML auto-detect = ROADMAP**; the
  deterministic pick / colour-match / coin-test versions are **LIVE**.
- **Interface:** [Chitti Vaani](../chitti_vaani.html) is the sole user surface; the 4W
  HTML page ([../chitti_4wheeler.html](../chitti_4wheeler.html)) is dev/debug/parity.
- **Emergency:** family cascade, **NEVER** auto-dial 100 / 108 / 112. The brand RSA
  number is *surfaced, never auto-called* (Golden Rule §2g).
- **Languages:** 9 primary live (en, hi, ta, te, bn, mr, gu, kn, ml) + 26-voice
  substrate. The wider COSDF language list (Portuguese, Swahili, Arabic, Yoruba…) = ROADMAP.
- **Metrics:** any number (accuracy %, DAU, hit-rate) is a **TARGET until the eval
  harness measures it** (CONTROL_PANEL MECH-4, Sire-gated). Never printed as achieved.

> **Status legend** — ✅ **LIVE** · 🟡 **PARTIAL** (deterministic core LIVE, AI/ML layer ROADMAP) · 🔵 **ROADMAP**.

---

## 1. Predictive failure alerts 🟡 PARTIAL

*"Brake pads in ~500 km. Battery 70% — replace in ~6 months. DPF regen due."* Catch the
failure before the breakdown — for cars the wedge is the seize / catalytic-damage /
DPF-clog that costs ₹40 000 if missed.

- **LIVE:** odometer-aware projection — `GET /api/4w/maintenance/next` returns
  km-remaining for oil / air filter / spark plugs / brake pads / coolant flush / AC cabin
  filter against the brand service schedule (`_BRAND_SCHEDULE`, 8 brands: Maruti / Hyundai /
  Tata / Mahindra / Honda / Toyota / Kia / MG); the 06:00 IST cron reads reminders aloud
  through Vaani. The [Vehicle Health Passport](skills/FEATURES.md) (`/api/4w/passport*`)
  persists the history the predictor consumes.
- **ROADMAP:** part-**age** model (tyre / battery / brake-pad / coolant age → component-level
  countdown), the **diesel DPF-regen** + weather-aware layer (pre-monsoon wiper/brake/tyre,
  pre-winter battery/coolant, pre-summer AC gas), and the ML sensor-trend predictor
  (fuel-trim drift, voltage drop, misfire frequency, **EV battery SoH**) off the ELM327
  Mode-2 stream. The odometer projection ships today; the age / weather / sensor model is
  funding/data-gated.
- **A11y:** spoken countdown ("agle 3 000 km mein brake pads khatam"), picture-icon
  component list. Never colour-only.

## 2. Mechanic honesty score 🔵 ROADMAP — **[highest-value money-saver for cars]**

The owner walks into the service centre already knowing the fair price — the single
biggest trust lever for a market where an AC compressor is quoted ₹35 000 against an
₹18–24k fair band. Authorised dealers are often the worst overchargers; the community
keeps them honest.

- **Target:** quote-vs-fair-band verdict — **Fair ✅ / High ⚠️ / Scam 🚩** — plus a
  community honesty rating per mechanic / service centre (fair-price + on-time +
  genuine-parts). Endpoint `POST /api/4w/quote/check` is **501 today** (honest stub via the
  catch-all in [wheels.py](backend/routes/wheels.py); [PRD F5](./PRD.md#f5--scam-shield--post-api4wquotecheck--501-coming-soon)).
  The fair-price band table ([skills/MECHANIC_KNOWLEDGE.md §6](skills/MECHANIC_KNOWLEDGE.md))
  + the service-centre rating table are queued (C7 / C10 / C26).
- **Honest line:** until the band table is seeded we render no verdict — a DeepSeek opinion
  is shown flagged low-confidence, never as a measured fair price. Today, per-fault ₹ cost
  bands DO surface inline on `dashboard/check` + `sound/check` (the Mechanic Copilot idea),
  so the owner is already pre-armed for the common repairs.
- **A11y:** verdict spoken with ✅/⚠️/🚩 icons; photograph the bill (mute/illiterate path).

## 3. Sound diagnosis 🟡 PARTIAL

*"Record 10 seconds near the engine — what's that noise?"* For the owner who can't
diagnose by ear, and the **blind owner for whom sound is the primary channel** (P5).

- **LIVE:** Sound Doctor catalogue — `GET /api/4w/sound/catalogue` (9 car sounds:
  knocking / belt squeal-chirp / wheel-bearing whine / tappet tick / misfire / brake squeal /
  AC-compressor rattle / suspension knock / exhaust blow) + `POST /api/4w/sound/check
  {sound_key}` → 2–4 ranked candidate causes summing ~100% + DIY tier + car ₹ band + safety
  note. The **Engine Sound Analysis** scanner ([../chitti_ai_scanners.js](../chitti_ai_scanners.js))
  records the clip for real (on-device), then the owner picks the closest match.
- **ROADMAP:** the 10-s clip **auto-classifier** (audio model) — funding-gated;
  `{audio:true}` returns honest `mode:"pick_or_describe"`, never a fabricated waveform verdict.
- **A11y (P5/P6):** blind → fully spoken; **deaf → must show a visual result card +
  waveform, never rely on hearing.**

## 4. Vibration diagnosis 🔵 ROADMAP

Phone accelerometer → misfire / wheel imbalance / loose engine mount / bent rim — a
sensor every owner already carries, validated by smartphone-sensor road-monitoring
precedent ([appendix](#appendix--research--best-practices-validating-precedents): DRIMS).

- **Target:** mount the phone in the cabin, idle / drive a set pattern, read the
  accelerometer FFT, flag the dominant frequency band to a likely component (engine-order
  vibration = misfire / mount; wheel-order = imbalance / bent rim / tyre).
- **Honest status:** not built. No fake vibration verdict ships. Requires an on-device
  signal-processing module + a 4-wheeler vibration reference set — both ROADMAP. Pairs
  naturally with #3 in the multi-modal fusion (#10).

## 5. Used-vehicle inspector ✅ LIVE (deterministic) · 🔵 camera-AI ROADMAP — **[HUGE for cars — resale]**

The pre-purchase 100-point inspection — protects the buyer from a lying seller in India's
₹50 000-crore used-car market, run for the buyer not the dealer, and arms a
"negotiate ₹X off" number.

- **LIVE:** `GET /api/4w/inspect/checklist` (~100-point sheet across 11 categories — engine
  start / smoke / coolant + oil condition / AC cooling / gear + clutch / brake feel /
  suspension / tyres + DOT age / electricals / ABS + airbag lights / body + accident-repair
  signs / frame / documents / odometer-tamper / OBD2 DTC scan — safety + title points marked
  `critical`) + `POST /api/4w/inspect/score {answers}` → weighted score % + verdict
  (**buy / caution / avoid**) + named critical fails + expected repair band. **Any critical
  fail caps the verdict — never "buy".** Reads the seller's [Vehicle Health Passport](#8-digital-service-book--live)
  (F10) when present.
- **ROADMAP:** walk-around **camera AI** (paint inconsistency = accident, panel-gap, tyre DOT
  date, underbody rust auto-flag, oil-cap mayonnaise = coolant mix) — vision model
  funding-gated. Today the buyer answers guided yes/no points; the camera auto-read is the
  roadmap layer.
- **Honest rule:** never declares a car "perfect" — always lists what it could not verify;
  flags a *suspiciously cleared* check-engine code (seller wiped the DTC) as a red flag.

## 6. Tractor / generator / water-pump mode 🔵 ROADMAP

The rural differentiator — diesel, hydraulics, PTO, **offline-first** for the farmer (P1)
with no mechanic within 50 km and no field internet. The 4-wheeler product is the **right
home** for this (diesel + heavy-equipment logic), unlike the 2-wheeler
([2W vehicle-class note](../chitti-2wheeler/WORLD_CLASS_FEATURES.md)).

- **Target:** Mahindra / John Deere / Massey Ferguson / Escorts / Sonalika fault trees;
  diesel injection + hydraulics + PTO + 3-point-hitch diagnosis; generator (DG set) + water-pump
  no-prime / cavitation / overheat diagnosis; fully offline, voice-first low-literacy.
- **Honest status:** not built. No car-class diagnosis is presented as tractor knowledge.
  Lands here + a shared rural-equipment module so neither vehicle page pretends to know
  tractors it hasn't been built for. Listed for COSDF L15 completeness; built where it belongs.

## 7. Family garage ✅ scaffold LIVE · 🔵 unified view ROADMAP

One household, every vehicle — the car, the second car, the family bike — in one place.

- **LIVE:** per-device car profile (`/api/4w/profile`) + per-vehicle
  [Vehicle Health Passport](#8-digital-service-book--live) already key every record to the
  device, so a household can hold multiple cars today.
- **ROADMAP:** the **shared `family_fleet` table** surfaced on both the 4W and
  [chitti-2wheeler](../chitti-2wheeler/) pages (one dashboard across car + bike), the fleet
  view for the taxi/delivery owner (P9 — "is my taxi roadworthy for the airport run?"), and
  the cross-product flywheel (C22 / F15). The data model is ready; the unified view is queued.
- **A11y:** spoken per-vehicle summary; picture tiles per vehicle.

## 8. Digital service book ✅ LIVE

No more lost paper service history — an owner-owned, lifelong record that proves the car's
condition at resale (the trust artifact that survives the sale, against a lying seller
*and* a lying buyer).

- **LIVE:** `POST /api/4w/passport/event` records service / repair / diagnosis / inspection /
  doc events; `GET /api/4w/passport` returns the timeline newest-first + a deterministic
  **Trust Score** (`GET /api/4w/passport/trust-score`, 0–100, green ≥80 / amber 50–79 /
  red <50) computed from service history, breadth/recency, unresolved critical repairs, and
  missing docs. Honest empty state when no events.
- **ROADMAP:** exportable PDF + the cross-sale handshake (the next buyer's Used-Vehicle
  Inspector #5 reads this passport) + the weighted per-system **Vehicle Health Score**
  (engine / brakes / tyres / electrical / fluids / body — [PRD F10](./PRD.md)).
- **Privacy:** lives on-device (Turso, per-device); shared only via `chittiConfirmAndDo()`
  ([Golden Rule §2g](../SAHAYAI_MASTER.md)).

## 9. Emergency copilot ✅ LIVE

Chitti stays on voice until the owner is **safe** — then escalates to family, never cops.

- **LIVE:** `POST /api/4w/breakdown` returns the 9-step deterministic decision tree (hazards
  ON → car to the side, everyone behind the barrier → reflective triangle 50 m back → fuel
  check → battery / dim-lights / weak-horn → check-engine light → DTC tab → starter sound
  (click-click = battery/starter; cranks-no-start = fuel/spark/sensor) → rest 5 min, retry;
  if it starts, drive < 40 km/h straight to a mechanic, hazards on) + the brand RSA number
  (Maruti 1800-102-1800, Hyundai 1800-102-4645, Tata 1800-209-8282, …; generic 1033 —
  *surfaced, not auto-called*) + the explicit family-cascade line. The offline
  [Roadside Self-Fix wizard](../chitti_breakdown_ui.js) (`ChittiSelfFix.open('4w')`) runs
  with **no network and no LLM**. SOS reuses Vaani's cascade (confirm-with-master → alarm
  bypassing silent → spouse → family → Chitti-to-Chitti relay). **NEVER auto-dials
  100 / 108 / 112.** GPS + RC plate added to the payload.
- **ROADMAP:** richer offline nearest-help POI cache; crash-g-force auto-trigger; live-location
  auto-share UX polish; cross-link to [Chitti MedUPI](../chitti_medupi.html) for the nearest
  hospital + family blood-group/allergy after an accident-SOS confirm.
- **A11y:** spoken step-by-step (blind/illiterate), visual cards (deaf), tap-through (mute).
  SOS is the largest, most prominent affordance for the stranded / fleet persona (P9).

## 10. Multi-modal diagnosis 🔵 ROADMAP

Sound **+** image **+** OBD **+** the owner's answers → one compounding-confidence verdict.
Each modality alone is a guess; fused, they converge.

- **Target:** the 8-agent swarm vote ([swarm/](swarm/), [COSDF L6](../CHITTI_MECHANIC_COSDF.md) —
  Symptom · Engine · Electrical · Fuel · Safety-veto · Cost · DIY · Trust) fuses every
  available signal into a single confidence-weighted verdict with a per-agent breakdown the
  owner can expand.
- **Honest status:** the agent specs exist; **per-diagnosis fusion is not yet invoked** —
  `POST /api/4w/ask` is a single profile-aware DeepSeek call today (see the
  [PRD swarm note](./PRD.md#global-contracts-apply-to-every-feature-below)). The individual
  deterministic modalities (`dashboard/check`, `sound/check`, `obd/snapshot`, `inspect/score`)
  ARE live and DO emit ranked causes + confidence; the *fusion engine* across modalities is
  ROADMAP. We never render a per-agent score breakdown the backend did not compute.
- **Cross-instance learning IS wired:** [backend/lib/swarm.py](backend/lib/swarm.py)
  (SAHAYAI_MASTER §2f) runs as a weekly cron — every Car Doctor instance learns from every
  other (≥100 confirmations, ≥70% 👍 → `skills/SWARM_LEARNED.md`; HIGH-risk →
  `SWARM_PROPOSED.md` for Sire's review), distinct from the per-diagnosis vote above.

---

## Status roll-up (honest)

| # | World-class feature | Status |
|---|---|---|
| 1 | Predictive failure alerts | 🟡 PARTIAL (odometer LIVE; age / weather / DPF / ML ROADMAP) |
| 2 | Mechanic honesty score | 🔵 ROADMAP (route 501; per-fault ₹ bands LIVE inline) |
| 3 | Sound diagnosis | 🟡 PARTIAL (9-sound catalogue LIVE; auto-classify ROADMAP) |
| 4 | Vibration diagnosis | 🔵 ROADMAP |
| 5 | Used-vehicle inspector | ✅ LIVE deterministic (~100-point; camera-AI ROADMAP) |
| 6 | Tractor / generator / water-pump | 🔵 ROADMAP (rural differentiator — built where it belongs) |
| 7 | Family garage | ✅ scaffold LIVE (unified fleet view ROADMAP) |
| 8 | Digital service book | ✅ LIVE (Passport + Trust Score) |
| 9 | Emergency copilot | ✅ LIVE (family-cascade; never auto-dials cops) |
| 10 | Multi-modal diagnosis | 🔵 ROADMAP (modalities LIVE; fusion ROADMAP) |

*No accuracy / hit-rate / DAU number is printed as achieved — all are TARGETS pending the
eval run (MECH-4, Sire-gated, [CHITTI_MECHANIC_COSDF L11/L14](../CHITTI_MECHANIC_COSDF.md)).*

---

## Appendix — research & best practices (validating precedents)

The precedents below ([CHITTI_MECHANIC_COSDF L15 appendix](../CHITTI_MECHANIC_COSDF.md))
validate that each world-class feature is achievable and point to where the bar sits.
These are external references, not Chitti claims.

- **Edge-AI predictive maintenance** — SMART-PDM, STM32-class on-device inference: offline,
  rural-viable vibration / sound failure prediction. Validates #1 (predictive alerts) and
  #4 (vibration) running without cloud — critical for the farmer (P1) and the diesel /
  tractor mode (#6).
- **Multimodal accessibility** — LinguoBridge (speech ↔ sign ↔ text): the technical proof
  that a single product can serve blind, deaf and mute users through parallel modalities.
  Validates the four-user contract under every feature.
- **Voice-guided UI demonstration** — HandHold ("show me"): voice-driven step-by-step
  guidance for low-literacy users. Validates the DIY Coach + Emergency Copilot (#9) spoken
  walk-through for illiterate / blind owners.
- **AI vehicle-damage-detection market** — ~$2.79B → ~$6.66B; players Ravin, Tractable,
  Inspektlabs, DeGould; Ravin RepairIQ; Ride-N-Repair (India, 2025). Validates #5
  (used-vehicle inspector camera-AI) and the F0 camera auto-detect — the ROADMAP vision
  layer has a proven market and a reference accuracy bar (used-car inspection is a real,
  funded product category in India).
- **Smartphone-sensor road monitoring** — DRIMS (UNIDO, 11+ countries): proves
  phone-accelerometer sensing is reliable enough for field deployment. Directly validates
  #4 (vibration diagnosis) on commodity phones.
- **Context adaptation** — Algiers deployments (dust, Arabic/French): validates the need to
  adapt to local conditions + language — maps to our 9-primary + 26-substrate language tiers
  and the weather-aware maintenance layer (monsoon / dust season / pre-summer AC).
- **Automotive-AI repair market** — ~$790M, ~16.55% CAGR, predictive maintenance the largest
  segment. Validates the overall thesis: predictive (#1) is the highest-value wedge — and for
  cars the overcharge surface (#2) is the biggest money-saver (₹35 000 → ₹2 000 outcomes).

**Next steps (per COSDF L15):** validate the fault trees + fair-price bands with real
mechanics (India / Nigeria / Brazil) · build a **4-wheeler sound dataset** to unblock #3
auto-classify · seed the Scam Shield fair-price table (#2) to flip `quote/check` off its 501
stub · test the offline Roadside Self-Fix + maintenance flows in rural areas · pilot the
Used-Vehicle Inspector + Digital Service Book + Vehicle Health Passport with fleet operators (P9).

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
