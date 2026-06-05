🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# WORLD_CLASS_FEATURES — Chitti Bike Doctor (C2WOS v1.0)

> COSDF [LEVEL 15](../CHITTI_MECHANIC_COSDF.md) applied to the 2-wheeler. These are the
> ten differentiators that take Chitti Bike Doctor from "a diagnosis chatbot" to
> "the bike's guardian." Each carries an **honest status** verified against the
> real backend ([backend/routes/wheels.py](backend/routes/wheels.py),
> [backend/routes/doctor.py](backend/routes/doctor.py)) and shipped JS
> ([../chitti_ai_scanners.js](../chitti_ai_scanners.js),
> [../chitti_breakdown_ui.js](../chitti_breakdown_ui.js),
> [../chitti_obd_ble.js](../chitti_obd_ble.js)). Companion docs:
> [PRD.md](./PRD.md) (the COSDF F0–F12 crosswalk), [skills/FEATURES.md](skills/FEATURES.md),
> [../SAHAYAI_MASTER.md §2](../SAHAYAI_MASTER.md) (platform locks).

## Platform locks honoured (read first)

These never move — where a world-class feature exceeds them, the **excess is ROADMAP,
honestly stubbed, never faked** ([SAHAYAI_MASTER §2](../SAHAYAI_MASTER.md),
[CHITTI_MECHANIC_COSDF §3](../CHITTI_MECHANIC_COSDF.md)):

- **LLM:** DeepSeek only. Sound/vibration/vision **ML auto-detect = ROADMAP**; the
  deterministic pick/match/coin-test versions are **LIVE**.
- **Interface:** [Chitti Vaani](../chitti_vaani.html) is the sole user surface; the 2W
  HTML page is dev/debug/parity.
- **Emergency:** family cascade, **NEVER** auto-dial 100 / 108 / 112.
- **Languages:** 9 primary live (en, hi, ta, te, bn, mr, gu, kn, ml) + 26-voice
  substrate. Wider COSDF language list = ROADMAP.
- **Metrics:** any number (accuracy %, DAU, hit-rate) is a **TARGET until the eval
  harness measures it** (CONTROL_PANEL MECH-4, Sire-gated). Never printed as achieved.

> **Status legend** — ✅ **LIVE** · 🟡 **PARTIAL** (deterministic core LIVE, AI/ML layer ROADMAP) · 🔵 **ROADMAP**.

---

## 1. Predictive failure alerts 🟡 PARTIAL

*"Brake shoe in ~500 km. Battery 70% — replace in ~6 months."* Catch the failure
before the breakdown.

- **LIVE:** odometer-aware projection — `GET /api/2w/maintenance/next` returns
  km-remaining for oil / air filter / spark plug / chain against the brand service
  schedule; the 06:00 IST cron reads reminders aloud through Vaani. The
  [Vehicle Health Passport](skills/FEATURES.md) (`/api/2w/passport*`) persists the
  history the predictor consumes.
- **ROADMAP:** part-**age** model (tyre / battery / brake-shoe age → component-level
  countdown) and the ML trend predictor (Mode-2 sensor trend off ELM327). The
  odometer projection ships today; the age + sensor model is funding/data-gated.
- **A11y:** spoken countdown ("agle 800 km mein brake shoe khatam"), picture-icon
  component list. Never colour-only.

## 2. Mechanic honesty score 🔵 ROADMAP

The rider walks into the workshop already knowing the fair price — the single biggest
trust lever for low-literacy / rural riders who get overcharged the most.

- **Target:** quote-vs-fair-band verdict — **Fair ✅ / High ⚠️ / Scam 🚩** — plus a
  community honesty rating per mechanic (fair-price + on-time). Endpoint
  `POST /api/2w/quote/check` is **501 today** (honest stub, [PRD F5](./PRD.md)); the
  fair-price table seed + mechanic-rating table are queued (W7 / W10).
- **Honest line:** until the band table is seeded we render no verdict — a DeepSeek
  opinion is shown flagged low-confidence, never as a measured fair price.
- **A11y:** verdict spoken with ✅/⚠️/🚩 icons; photograph the bill (mute/illiterate path).

## 3. Sound diagnosis 🟡 PARTIAL

*"Record 10 seconds near the engine — what's that noise?"* For the rider who can't
diagnose by ear, and the **blind rider for whom sound is the primary channel**.

- **LIVE:** Sound Doctor catalogue — `GET /api/2w/sound/catalogue` (~8 bike sounds:
  knock / bearing whine / tappet tick / misfire / chain rattle / exhaust blow / brake
  squeal) + `POST /api/2w/sound/check {sound_key}` → ranked candidate causes + DIY-tier
  + ₹ band + safety note. The **Engine Sound Analysis** scanner records the clip for
  real (on-device), then the rider picks the closest match.
- **ROADMAP:** the 10-s clip **auto-classifier** (audio model) — funding-gated;
  `{audio:true}` returns honest `pick_or_describe`, never a fabricated waveform verdict.
- **A11y (P5/P6):** blind → fully spoken; **deaf → must show a visual result card +
  waveform, never rely on hearing.**

## 4. Vibration diagnosis 🔵 ROADMAP

Phone accelerometer → misfire / wheel imbalance / loose mount — a sensor every rider
already carries, validated by smartphone-sensor road-monitoring precedent
([appendix](#appendix--research--best-practices-validating-precedents): DRIMS).

- **Target:** strap the phone to the bike, idle/ride a set pattern, read the
  accelerometer FFT, flag the dominant frequency to a likely component.
- **Honest status:** not built. No fake vibration verdict ships. Requires an
  on-device signal-processing module + a 2-wheeler vibration reference set — both
  ROADMAP. Pairs naturally with #3 in the multi-modal fusion (#10).

## 5. Used-vehicle inspector ✅ LIVE (deterministic) · 🔵 camera-AI ROADMAP

The pre-purchase 100-point inspection — protects the buyer from a lying seller and
arms a "negotiate ₹X off" number.

- **LIVE:** `GET /api/2w/inspect/checklist` (Engine · Transmission/Chain · Electrical ·
  Brakes · Tyres/Wheels · Suspension/Fork · Frame/Rust · Documents · Service history ·
  Test-ride — safety/title points marked `critical`) + `POST /api/2w/inspect/score
  {answers}` → score % + verdict (buy / caution / avoid) + named critical fails +
  expected repair band. **Any critical fail caps the verdict — never "buy".** Reads the
  seller's [Vehicle Health Passport](skills/FEATURES.md) when present.
- **ROADMAP:** walk-around **camera AI** (paint inconsistency = accident, panel-gap,
  tyre DOT date, underbody rust auto-flag) — vision model funding-gated. Today the rider
  answers guided yes/no points; the camera auto-read is the roadmap layer.
- **Honest rule:** never declares a bike "perfect" — always lists what it could not verify.

## 6. Tractor / generator / water-pump mode 🔵 ROADMAP

The rural differentiator — diesel, hydraulics, PTO, **offline-first** for the farmer
(P1) with no mechanic within 50 km and no field internet.

- **Target:** Mahindra / John Deere / Massey Ferguson / Escorts / Sonalika fault trees;
  generator + water-pump diagnosis; fully offline.
- **Honest status:** not built. **Vehicle-class note:** a 2-wheeler product is the
  wrong home for tractor/diesel logic — this lands primarily in
  [chitti-4wheeler](../chitti-4wheeler/) + a shared rural-equipment module so the 2W
  page doesn't pretend to know tractors. Listed here for COSDF L15 completeness; built
  where it belongs.

## 7. Family garage ✅ scaffold LIVE · 🔵 unified view ROADMAP

One household, every vehicle — the bike, the scooter, the family car — in one place.

- **LIVE:** per-device bike profile (`/api/2w/profile`) + per-vehicle
  [Vehicle Health Passport](skills/FEATURES.md) already key every record to the device,
  so a household can hold multiple bikes today.
- **ROADMAP:** the **shared `family_fleet` table** surfaced on both the 2W and
  [chitti-4wheeler](../chitti-4wheeler/) pages (one dashboard across bike + car), and
  the cross-product flywheel (W20). The data model is ready; the unified view is queued.
- **A11y:** spoken per-vehicle summary; picture tiles per vehicle.

## 8. Digital service book ✅ LIVE

No more lost paper service history — a rider-owned, lifelong record that proves the
bike's condition at resale.

- **LIVE:** `POST /api/2w/passport/event` records service / repair / diagnosis /
  inspection / doc events; `GET /api/2w/passport` returns the timeline newest-first +
  a deterministic **Trust Score** (`GET /api/2w/passport/trust-score`, 0–100, green ≥80
  / amber 50–79 / red <50) from service history, breadth/recency, unresolved critical
  repairs, and missing docs. Honest empty state when no events.
- **ROADMAP:** exportable PDF + the cross-sale handshake (the next buyer's Used-Vehicle
  Inspector reads this passport — the trust artifact that survives the sale).
- **Privacy:** lives on-device (Turso, per-device); shared only via `chittiConfirmAndDo()`
  ([Golden Rule §2g](../SAHAYAI_MASTER.md)).

## 9. Emergency copilot ✅ LIVE

Chitti stays on voice until the rider is **safe** — then escalates to family, never cops.

- **LIVE:** `POST /api/2w/breakdown` returns the 8-step deterministic decision tree
  (hazards → fuel/reserve → battery/horn → side-stand sensor → rest → retry; if it
  starts, ride < 40 km/h straight to a mechanic) + the brand RSA number (surfaced, not
  auto-called) + the explicit family-cascade line. The offline
  [Roadside Self-Fix wizard](../chitti_breakdown_ui.js) (`ChittiSelfFix.open('2w')`)
  runs with **no network and no LLM**. SOS reuses Vaani's cascade
  (confirm-with-master → alarm bypassing silent → spouse → family → Chitti-to-Chitti
  relay). **NEVER auto-dials 100 / 108 / 112.** GPS + RC plate added to the payload.
- **ROADMAP:** richer offline nearest-help POI cache; live-location auto-share UX polish.
- **A11y:** spoken step-by-step (blind/illiterate), visual cards (deaf), tap-through
  (mute). SOS is the largest affordance for the fleet/stranded persona (P9).

## 10. Multi-modal diagnosis 🔵 ROADMAP

Sound **+** image **+** OBD **+** the rider's answers → one compounding-confidence
verdict. Each modality alone is a guess; fused, they converge.

- **Target:** the 8-agent swarm vote ([swarm/](swarm/), [COSDF L6](../CHITTI_MECHANIC_COSDF.md))
  fuses every available signal into a single confidence-weighted verdict with a
  per-agent breakdown the rider can expand.
- **Honest status:** the agent specs exist; **per-diagnosis fusion is not yet invoked**
  — `ask()` is a single profile-aware DeepSeek call today (see the
  [PRD swarm note](./PRD.md)). The individual modalities are LIVE/PARTIAL above; the
  *fusion engine* is ROADMAP. We never render a per-agent score breakdown the backend
  did not compute.
- **Cross-instance learning IS wired:** [backend/lib/swarm.py](backend/lib/swarm.py)
  (SAHAYAI_MASTER §2f) runs as a cron — every Bike Doctor instance learns from every
  other (≥100 confirmations → skills/*.md), distinct from the per-diagnosis vote.

---

## Status roll-up (honest)

| # | World-class feature | Status |
|---|---|---|
| 1 | Predictive failure alerts | 🟡 PARTIAL (odometer LIVE; age/ML ROADMAP) |
| 2 | Mechanic honesty score | 🔵 ROADMAP (route 501) |
| 3 | Sound diagnosis | 🟡 PARTIAL (catalogue LIVE; auto-classify ROADMAP) |
| 4 | Vibration diagnosis | 🔵 ROADMAP |
| 5 | Used-vehicle inspector | ✅ LIVE deterministic (camera-AI ROADMAP) |
| 6 | Tractor / generator / water-pump | 🔵 ROADMAP (belongs in 4W + rural module) |
| 7 | Family garage | ✅ scaffold LIVE (unified view ROADMAP) |
| 8 | Digital service book | ✅ LIVE |
| 9 | Emergency copilot | ✅ LIVE |
| 10 | Multi-modal diagnosis | 🔵 ROADMAP (modalities LIVE; fusion ROADMAP) |

*No accuracy / hit-rate / DAU number is printed as achieved — all are TARGETS pending
the eval run (MECH-4, Sire-gated).*

---

## Appendix — research & best practices (validating precedents)

The precedents below ([CHITTI_MECHANIC_COSDF L15 appendix](../CHITTI_MECHANIC_COSDF.md))
validate that each world-class feature is achievable and points to where the bar sits.
These are external references, not Chitti claims.

- **Edge-AI predictive maintenance** — SMART-PDM, STM32-class on-device inference:
  offline, rural-viable vibration/sound failure prediction. Validates #1 (predictive
  alerts) and #4 (vibration) running without cloud — critical for the farmer (P1).
- **Multimodal accessibility** — LinguoBridge (speech ↔ sign ↔ text): the technical
  proof that a single product can serve blind, deaf and mute users through parallel
  modalities. Validates the four-user contract under every feature.
- **Voice-guided UI demonstration** — HandHold ("show me"): voice-driven step-by-step
  guidance for low-literacy users. Validates the DIY Coach + Emergency Copilot (#9)
  spoken walk-through for illiterate / blind riders.
- **AI vehicle-damage detection market** — ~$2.79B → ~$6.66B; players Ravin, Tractable,
  Inspektlabs, DeGould; Ravin RepairIQ; Ride-N-Repair (India, 2025). Validates #5
  (used-vehicle inspector camera-AI) and F0 camera auto-detect — the ROADMAP layer has
  a proven market and reference accuracy bar.
- **Smartphone-sensor road monitoring** — DRIMS (UNIDO, 11+ countries): proves
  phone-accelerometer sensing is reliable enough for field deployment. Directly
  validates #4 (vibration diagnosis) on commodity phones.
- **Context adaptation** — Algiers deployments (dust, Arabic/French): validates the
  need to adapt to local conditions + language — maps to our 9-primary + 26-substrate
  language tiers and weather-aware maintenance (monsoon / dust season).
- **Automotive-AI repair market** — ~$790M, ~16.55% CAGR, predictive maintenance the
  largest segment. Validates the overall thesis: predictive (#1) is the highest-value
  wedge.

**Next steps (per COSDF L15):** validate fault trees with real mechanics
(India / Nigeria / Brazil) · build a **2-wheeler sound dataset** to unblock #3
auto-classify · test the offline Roadside Self-Fix + maintenance flows in rural areas ·
pilot the Used-Vehicle Inspector + Digital Service Book with fleet operators (P9).

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
