🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# PRD — Chitti Car Doctor (C4WOS v1.0)

> Governs every feature. Each feature carries: **User story · UX flow · A11y review ·
> Failure modes · DIY-safety class · Test/Eval ref · Backend route status.** A
> feature missing any of these is not built (ROLE.md "Required documentation").
> Personas referenced as P1–P10 from [PERSONAS.md](PERSONAS.md). Backend routes
> are the real ones in [backend/routes/wheels.py](backend/routes/wheels.py) +
> [backend/routes/doctor.py](backend/routes/doctor.py)
> (prefix `/api/4w/`); anything not there is marked **COMING SOON** honestly.
> The COSDF F0–F12 crosswalk below maps the canonical
> [CHITTI_MECHANIC_COSDF.md LEVEL 4](../CHITTI_MECHANIC_COSDF.md) feature set onto
> this product's real surface; the product's own F0–F15 spec follows it.

## COSDF F0–F12 crosswalk (canonical → this product)

[COSDF LEVEL 4](../CHITTI_MECHANIC_COSDF.md) names twelve canonical features.
Each is mapped here to the **real** 4-wheeler route(s) and an **honest status**,
verified against [backend/routes/doctor.py](backend/routes/doctor.py) +
[backend/routes/wheels.py](backend/routes/wheels.py) and the shipped substrate
([../chitti_ai_scanners.js](../chitti_ai_scanners.js),
[../chitti_breakdown_ui.js](../chitti_breakdown_ui.js),
[../chitti_obd_ble.js](../chitti_obd_ble.js),
[backend/lib/swarm.py](backend/lib/swarm.py)). Status legend:
✅ **LIVE** · 🟡 **PARTIAL** (deterministic core LIVE, AI/ML auto-detect ROADMAP) · 🔵 **ROADMAP**.

| COSDF | Feature | This product | Real route / surface | Status |
|---|---|---|---|---|
| **F0** | Camera Diagnosis | Dashboard / Tire / Leak scanners ([§F2](#f2--dashboard-doctor--coming-soon-routes-via-f0-today), AI Scanners) | `chitti_ai_scanners.js` (photo captured on-device) + `POST /api/4w/dashboard/check` | 🟡 deterministic pick/colour-match LIVE; vision auto-detect ROADMAP |
| **F1** | Audio Diagnosis | Sound Doctor / Engine Sound Analysis ([§F3](#f3--sound-doctor--post-api4wlisten--501-coming-soon)) | `GET /api/4w/sound/catalogue` + `POST /api/4w/sound/check` | 🟡 sound-picker (9 sounds) LIVE; audio auto-classify ROADMAP |
| **F2** | Dashboard Scanner | Dashboard Doctor ([§F2](#f2--dashboard-doctor--coming-soon-routes-via-f0-today)) | `GET /api/4w/dashboard/lights` (14-telltale KB) + `POST /api/4w/dashboard/check` | 🟡 light-picker + severity/can-drive LIVE; photo auto-read ROADMAP |
| **F3** | OBD2 Integration | OBD2 snapshot interpreter ([§F13](#f13--dtc-plain-hinglish-library-obd2--get-api4wdtccode--live-16-codes)) + BLE pair | `POST /api/4w/obd/snapshot` + `chitti_obd_ble.js` (Web-Bluetooth ELM327) | 🟡 snapshot decode + live-param flags LIVE; full live-PID stream PARTIAL |
| **F4** | No-OBD Mode | Symptom Doctor + Roadside Self-Fix ([§F0](#f0--symptom-doctor-hero--post-api4wask--live), [§F9](#f9--emergency-mode--roadside-sos--post-api4wbreakdown--live)) | `POST /api/4w/ask` + `ChittiSelfFix.open('4w')` (offline, no LLM) | ✅ LIVE (single DeepSeek call; swarm fusion ROADMAP) |
| **F5** | Cost Estimator + quote verification | Scam Shield / Anti-Overcharge Guard ([§F5](#f5--scam-shield--post-api4wquotecheck--501-coming-soon), [§F14](#f14--anti-overcharge-guard--folds-into-scam-shield-f5)) | `POST /api/4w/quote/check` → **501 today**; cost bands inline in `dashboard/check` + `sound/check` | 🔵 fair-price band table ROADMAP; per-fault ₹ cost bands LIVE |
| **F6** | DIY Repair Mode | DIY Coach ([§F4](#f4--diy-coach--coming-soon-guidance-via-f0-today)) | guidance via `POST /api/4w/ask`; DIY tier stamped on every diagnosis | 🟡 voice guidance LIVE; step-card + video library ROADMAP |
| **F7** | Emergency Breakdown Mode | Emergency Mode + Roadside SOS ([§F9](#f9--emergency-mode--roadside-sos--post-api4wbreakdown--live)) | `POST /api/4w/breakdown` (9-step tree + brand RSA) + `ChittiSelfFix` + Vaani cascade | ✅ LIVE (family-cascade only; **NEVER auto-dials 100/108/112**) |
| **F8** | Used-Vehicle Inspector | Used Vehicle Inspector ([§F8](#f8--used-vehicle-inspector-100-point--coming-soon--huge-for-cars)) | `GET /api/4w/inspect/checklist` (~100-point, 11 cats) + `POST /api/4w/inspect/score` | ✅ deterministic LIVE; walk-around camera AI ROADMAP |
| **F9** | Predictive Maintenance | Vehicle Twin + Parts Life Predictor ([§F6](#f6--vehicle-twin--get-api4wmaintenancenext--live-twin-partial), [§F7](#f7--parts-life-predictor--coming-soon)) | `GET /api/4w/maintenance/next` (brand schedule) | 🟡 odometer projection LIVE; part-age + ML trend ROADMAP |
| **F10** | Vehicle Health Score | Vehicle Health Passport Trust Score ([§F10](#f10--vehicle-health-passport--coming-soon--huge-for-cars--resale)) | `GET /api/4w/passport/trust-score` (0–100, green/amber/red) | ✅ Trust Score LIVE; weighted per-system Health Score (engine/brakes/tyres…) ROADMAP |
| **F11** | Tractor / Generator / Water-Pump | Rural-equipment mode | — (shared rural module, lands here per [2W vehicle-class note](../chitti-2wheeler/WORLD_CLASS_FEATURES.md)) | 🔵 ROADMAP (rural differentiator — built where it belongs: 4W + shared module) |
| **F12** | Sound Library & Education | Sound catalogue + DTC library ([§F3](#f3--sound-doctor--post-api4wlisten--501-coming-soon), [§F13](#f13--dtc-plain-hinglish-library-obd2--get-api4wdtccode--live-16-codes)) | `GET /api/4w/sound/catalogue` + `GET /api/4w/dtc/<code>` (~16 codes) | 🟡 catalogue + ~16-code library LIVE; full ~2 000-code library + tutorials ROADMAP |

> **Cross-instance learning IS wired** ([backend/lib/swarm.py](backend/lib/swarm.py), [§2f](../SAHAYAI_MASTER.md)) —
> every Car Doctor instance learns from every other via a weekly cron (≥100 confirmations,
> ≥70% 👍 → `skills/SWARM_LEARNED.md`; HIGH-risk → `SWARM_PROPOSED.md` for Sire). This is
> distinct from the **per-diagnosis** 8-agent fusion vote ([swarm/](swarm/)), which is
> ROADMAP — `ask()` is a single profile-aware DeepSeek call today (see *Global contracts*).
> See the world-class differentiators in [WORLD_CLASS_FEATURES.md](WORLD_CLASS_FEATURES.md) (COSDF L15).

## DIY-safety classification (the spine of every diagnosis)

Every fix Chitti returns is stamped with exactly one class. This is a **hard
safety gate** — misclassifying a brake / fuel / airbag / high-voltage-EV job as
DIY is a P0 incident.

| Class | Meaning | Example |
|---|---|---|
| 🟢 **DIY Allowed** | Safe for a beginner with basic tools | tighten fuel cap (P0455), cabin/air filter, washer fluid, 12V jump-start, fuse, tyre pressure |
| 🟡 **DIY Assisted** | Doable but Chitti coaches every step; some risk | engine-oil + filter change, 12V battery swap, headlight bulb, wiper blade, coolant top-up (cold engine) |
| 🟠 **Professional Required** | Must go to a mechanic — but Chitti arms with fair price | misfire/coil/injector, AC compressor, alternator, ABS sensor, DPF regen, suspension knock, transmission |
| 🔴 **Emergency Required** | Do not drive · safety-critical · may need SOS | brake failure, coolant leak overheating, steering play, fuel leak, airbag fault, **any HV-EV / orange-cable work** |

> **EV hard rule:** anything touching the high-voltage battery, inverter, or
> orange cabling is **always 🔴 Emergency / Professional** — never DIY-coached. The
> HV system kills. Only 12V-side and cabin work is ever DIY for an EV.

## Global contracts (apply to every feature below)

- **Swarm vote before display (ROADMAP)** — the 8 agent specs ([swarm/](swarm/)) define a
  confidence-weighted verdict (*"Misfire 80% / Coil 12% / Fuel 8%"*) + a per-agent
  breakdown the owner can expand. **Honest status:** the per-diagnosis fusion engine is
  **not yet invoked** — `POST /api/4w/ask` is a single profile-aware DeepSeek call today.
  The deterministic Doctor routes (`dashboard/check`, `sound/check`, `obd/snapshot`,
  `inspect/score`) DO emit ranked causes + confidence; the multi-agent *fusion* across
  modalities is the roadmap layer. We never render a per-agent score the backend did not compute.
- **Six fields, always** — Why · Severity · Can-I-drive · DIY class · Cost band · Alternatives.
- **Never claim certainty** — Likely / Possible / Unlikely + High / Medium / Low confidence.
- **Per-response widget** — every card has `data-chitti-response` (🔊 / 🤖 / 👍 / 👎 + feedback). No card ships without it.
- **Privacy** — photos/audio/OBD2 streams processed on-device; only short *text descriptions* reach DeepSeek. ([ARCHITECTURE.md](ARCHITECTURE.md), [§2b](../SAHAYAI_MASTER.md).)
- **Golden Rule** — Car Doctor takes no side-effecting action (RSA call, SOS, WhatsApp booking, document share) without `chittiConfirmAndDo()` ([§2g](../SAHAYAI_MASTER.md)).
- **Emergency = family cascade** — **NEVER** auto-dials 100 / 108 / 112.
- **Server-enforced disclaimer** — every DeepSeek answer carries the [mechanic disclaimer](skills/FEATURES.md#disclaimer) footer, never client-controlled.
- **Honest empty states** — never a fabricated diagnosis; if Chitti cannot tell, it says so and routes to a human.

---

## F0 — Symptom Doctor (HERO) — `POST /api/4w/ask` ✅ LIVE
- **Story (P1/P2/P8):** *As an owner, I want to describe what's wrong in my own words and get a clear diagnosis so that I know if I really need a service centre.*
- **UX flow:** Home → big primary "🩺 Meri car ka problem bataao" → owner speaks/types/photos → Symptom Agent maps to candidate faults → 8-agent swarm vote → card with the six fields + confidence-weighted verdict.
- **DIY class:** per fault, stamped by the DIY Agent.
- **A11y:** blind → fully spoken, sound-first; deaf → visual severity card + ISL; mute → photo-first; illiterate → voice + picture icons.
- **Failure modes:** symptom too vague → Chitti asks one clarifying question, never guesses; DeepSeek malformed → honest "phir se try karo," no fabricated score; fault not in corpus → "isko mechanic dikhao" + fair-price band, never invents.
- **Eval:** [evals/diagnostic_accuracy.md](evals/diagnostic_accuracy.md), [evals/hallucination_eval.md](evals/hallucination_eval.md).
- **Route:** real — `deepseek_client.ask(q, profile)`, disclaimer injected server-side, profile loaded by `X-Chitti-Device`.

## F1 — Onboarding / Car Profile — `POST·GET /api/4w/profile` ✅ LIVE
- **Story (all):** *I want Chitti to remember my exact car so its advice is specific, not generic.*
- **UX:** brand · model · year · **fuel (Petrol/Diesel/EV/Hybrid)** · transmission (MT/AT/CVT/AMT) · odometer · reg — voice-buildable ("Chitti, meri Creta hai, diesel, 2021, 40 000 km"). Keyed by `X-Chitti-Device`.
- **A11y:** picture-menu brand picker; fuel-type icons; odometer spoken; never requires typing.
- **Why it matters:** service intervals + DTC relevance + DPF (diesel) / SoH (EV) logic are make/model/year/fuel-specific, never generic.
- **Route:** real — persisted to Turso `CarProfile` (see ARCHITECTURE.md env-blocker note).

## F2 — Dashboard Doctor — COMING SOON (routes via F0 today)
- **Story (P5/P7/all):** *I want to photograph my dashboard warning lights and be told what each means and whether I can drive.*
- **UX flow:** snap dashboard → on-device detect lit symbols → per-light card: name · severity · can-I-drive · recommended action. Covers check-engine (MIL), ABS, battery/charging, oil-pressure, coolant-temp, airbag/SRS, TPMS, DPF (diesel), EV-ready/charge.
- **DIY class:** per light (oil-pressure red = 🔴 Emergency "do not drive"; coolant-temp red = 🔴 "pull over, engine seize"; ABS amber = 🟠 Professional "drive gently to mechanic").
- **A11y:** blind → "Chitti, mera dashboard padho" reads every lit light aloud (P5 hero); deaf → captioned cards; mute → pure photo flow.
- **Failure modes:** glare/blur → ask to re-shoot, never guess a light; unknown symbol → describe shape, route to F0.
- **Eval:** dashboard-light read accuracy ≥ 92%.
- **Status:** photo-to-light detection COMING SOON; today the owner describes the light to F0.

## F3 — Sound Doctor — `POST /api/4w/listen` → 501 COMING SOON
- **Story (P5/P6/all):** *I want to record my engine sound and have Chitti tell me what the noise is.*
- **UX flow:** record 10 s → on-device feature extraction → compare to sound library (misfire, engine knock/pinging, belt squeal, wheel-bearing whine, brake squeal, AC-compressor rattle, suspension knock) → ranked candidates with confidence + the six fields.
- **A11y:** blind → primary surface, fully spoken (P5); **deaf → MUST show a visual waveform + result card, never rely on hearing** (P6); mute → tap to record.
- **Failure modes:** noisy environment → low-confidence band shown honestly, "phir se record karo, engine ke paas"; never claims certainty from a bad clip.
- **DIY class:** per candidate (belt squeal → 🟡 tension/replace; brake squeal → 🟠 pad check; knock → 🔴 stop, professional).
- **Eval:** sound-diagnosis top-3 hit rate ≥ 80%.
- **Status:** route returns 501 today — honest stub per platform rule; audio classifier queued.

## F4 — DIY Coach — COMING SOON (guidance via F0 today)
- **Story (P2/P8):** *Don't send me to a service centre for a five-minute job — teach me to do it.*
- **UX flow:** for any 🟢/🟡 fault → step-by-step card: **level** (Beginner/Intermediate) · **tools needed** · **time** · **difficulty /10** · **video + voice walk-through** · **DIY saving vs quote**.
- **DIY class gate:** only 🟢 DIY Allowed and 🟡 DIY Assisted ever reach the Coach. 🟠/🔴 are *never* coached — they route to a human. **All brake / fuel / airbag / HV-EV work is excluded by construction.** This is the unsafe-DIY = 0 gate.
- **A11y:** illiterate → voice-only walk-through with picture icons; deaf → captioned video + text steps; blind → spoken steps with confirm-after-each.
- **Failure modes:** owner stuck mid-step → "ruk jao, mechanic ko dikhao" (stop, see a mechanic) rather than push an unsafe continuation.
- **Eval:** [evals/diy_safety_eval.md](evals/diy_safety_eval.md) — unsafe DIY recs = 0.

## F5 — Scam Shield — `POST /api/4w/quote/check` → 501 COMING SOON
- **Story (P1/P2/P4):** *Service centre ne ₹35 000 maanga AC compressor ke liye — kya theek hai?*
- **UX flow:** type/photo the quote or invoice → Chitti returns the **fair band** (median + 25/75 percentile, city-adjusted) vs the **quoted** number → verdict **Fair ✅ / High ⚠️ / Scam 🚩** + "what to say to the service advisor" coaching line. Example: AC compressor ₹35 000 quoted vs **₹18-24k** fair band → 🚩, "pehle gas pressure + cabin filter check karwao (₹2 000)."
- **A11y:** photo the bill (mute/illiterate); verdict spoken with ✅/⚠️/🚩 icons (deaf/blind).
- **Failure modes:** item not in fair-price table → honest "iska band abhi nahi hai" + DeepSeek opinion flagged as low-confidence; never fabricates a band.
- **Eval:** scam-quote catch rate ≥ 90%; cost accuracy ≥ 85% ([evals/scam_shield_eval.md](evals/scam_shield_eval.md)).
- **Status:** 501 today; fair-price table from [MECHANIC_KNOWLEDGE.md §6](skills/MECHANIC_KNOWLEDGE.md) + community seed queued. **Highest-value feature for cars** — the overcharge surface is huge.

## F6 — Vehicle Twin — `GET /api/4w/maintenance/next` ✅ LIVE (twin partial)
- **Story (P3):** *Remember my car's full history and predict what fails next.*
- **UX:** model · fuel · service history · **tyre age · battery age · brake age · coolant age** → predict next failure + km-remaining per component. Today returns oil / air filter / spark plugs / brake pads / coolant flush / AC cabin filter next-due-km from the brand schedule (`_BRAND_SCHEDULE`).
- **A11y:** spoken summary ("agle 3 000 km mein brake pads khatam"); picture-icon component list.
- **Failure modes:** no odometer → ask for it; missing a part's install date → ask, never assume.
- **Route:** `maintenance/next` (oil/air/plug/brake/coolant/AC km-remaining per brand) is **real**; the full age-based twin (tyre/battery/brake age) is COMING SOON, layered on the same profile.

## F7 — Parts Life Predictor — COMING SOON
- **Story (P3):** *Tell me how much life is left in my tyres, battery, brake pads, coolant, DPF (diesel), HV battery SoH (EV).*
- **UX:** per-part remaining-life bar from install date + odometer + usage pattern + (Mode 2) OBD2 sensor trend (fuel-trim drift, voltage drop, misfire frequency, EV SoH).
- **DIY class:** clean/top-up 🟢; replacement 🟡/🟠 per part; HV-EV battery 🔴 professional.
- **Status:** Mode-1 odometer projection layered on F6; Mode-2 sensor trend needs ELM327.

## F8 — Used Vehicle Inspector (100-point) — COMING SOON  **[HUGE for cars]**
- **Story (P10):** *Run a 100-point inspection before I buy this used Creta.*
- **UX flow:** guided 100-point checklist (engine start, smoke colour, OBD2 DTC scan + freeze-frame, cleared-code check, coolant condition, oil condition, AC cooling, gear/clutch, brake feel, suspension knock, tyre tread + age, electricals, ABS/airbag lights, body/accident-repair signs, frame, documents, odometer-tamper signs, EV SoH where applicable) → photo/video/sound/OBD2 per point → overall buy-confidence + a "negotiate ₹X off" estimate from flagged issues.
- **A11y:** voice-guided point-by-point (illiterate/blind); visual checklist with icons (deaf); photo-only path (mute).
- **Failure modes:** never declares a car "perfect" — always lists what it could not verify; flags a *suspiciously cleared* check-engine code (seller wiped the DTC) as a red flag.
- **Cross-link:** reads the seller's **Vehicle Health Passport** (F10) when present. **This is the headline used-car feature** — India's ₹50 000-crore resale market, run for the buyer not the dealer.

## F9 — Emergency Mode + Roadside SOS — `POST /api/4w/breakdown` ✅ LIVE
- **Story (P2/P9/all):** *My car won't move and I'm stranded — guide me, and if it's serious alert my family.*
- **UX flow:** deterministic breakdown decision tree → hazard lights ON → car to the side, everyone behind the barrier → reflective triangle 50 m back → fuel check (empty?) → battery (dim lights / weak horn?) → check-engine light? → DTC tab → starter sound (click-click = battery/starter; cranks-no-start = fuel/spark/sensor) → rest 5 min, retry → if it starts, drive < 40 km/h straight to a mechanic, hazards on → else SOS tab → family cascade.
- **SOS contract:** confirm-with-master → ring alarm bypassing silent → spouse → family → Chitti-to-Chitti relay. **NEVER auto-dials 100/108/112.** Brand RSA number surfaced (Maruti 1800-102-1800, Hyundai 1800-102-4645, Tata 1800-209-8282, …; generic 1033) — surfaced, **not auto-called**. GPS + RC plate added to payload.
- **A11y:** spoken step-by-step (blind/illiterate); visual cards (deaf); tap-through (mute). SOS button is the largest, most prominent affordance for P9.
- **Failure modes:** GPS denied → ask landmark; brand unmatched → generic 1033 RSA shown.
- **Route:** real — returns the 9-step tree + brand-matched RSA + the explicit Vaani-protocol line ("Family cascade only. Chitti never auto-dials 100/108/112.").

## F10 — Vehicle Health Passport — COMING SOON  **[HUGE for cars — resale]**
- **Story (P3/P10):** *Keep a lifelong, portable record of my car's health that proves its condition at resale.*
- **UX:** every symptom, diagnosis, repair, DTC, part age and cost appended to one owner-owned record; exportable PDF; readable by the Used Vehicle Inspector (F8) of the next buyer.
- **Privacy:** lives on-device; shared only via `chittiConfirmAndDo()` (Golden Rule).
- **Patent-level:** the trust artifact that survives the sale — proof against a lying seller *and* a lying buyer in India's huge used-car market.

## F11 — Preventive Maintenance — `GET /api/4w/maintenance/next` ✅ LIVE (base) + weather COMING SOON
- **Story (P3/all):** *Warn me before a part fails, not after.*
- **UX:** odometer-aware reminders per brand schedule (oil 7.5-10k km · air filter 25-30k · spark plugs 60k · brake pads 40k · coolant flush 40k · AC cabin filter 20k) via cron 06:00 IST → Vaani read-aloud. **Weather-aware** layer: pre-monsoon → wiper/brake-pad/tyre-tread; pre-winter → battery/coolant; pre-summer → AC gas; **diesel** → DPF regen reminder.
- **A11y:** spoken reminders; picture-icon component cards.
- **Route:** odometer schedule is **real** (`_BRAND_SCHEDULE`, 8 brands); weather-feed + diesel-DPF layer COMING SOON.

## F12 — Document Vault — COMING SOON
- **Story (P3/P4/all):** *Remember my RC, insurance, PUC, DL, road tax, FASTag and warn me before they expire.*
- **UX:** camera-capture → OCR → encrypted row → auto-expiry alerts 30/7/1 days before. Expired PUC = ₹10 000 fine; expired insurance = uninsured liability — legal-compliance P0.
- **A11y:** photo-capture (mute); spoken expiry warnings (blind/illiterate); state-aware PUC validity.
- **Privacy:** encrypted on-device; never shared without confirm.

## F13 — DTC Plain-Hinglish Library (OBD2) — `GET /api/4w/dtc/<code>` ✅ LIVE (~16 codes)
- **Story (Mode 2 owners — every car since 2010):** *Translate this trouble code into language I understand + a cost band.*
- **UX:** code → Hinglish meaning + severity (H/M/L) + fair-cost band. ~16 common generic P-codes live (P0101, P0117, P0128, P0131, P0171/0172, P0300/0301/0302, P0401, P0420, P0455, P0500, P0560, P0606, P0700); full ~2 000-code library (`dtc_codes_4w.json`) queued P1.
- **Standardised** — generic P-codes mean the same across Swift / Creta / Nexon, so the library is portable across every car. This is the car's first-class advantage.
- **Failure:** unknown code → honest 404 + "POST /api/4w/ask se DeepSeek pe pucho," never fabricates a meaning.
- **Route:** real — local `_DTC` table; full library is P1.

## F14 — Anti-Overcharge Guard — folds into Scam Shield (F5)
- The fair-price band ([MECHANIC_KNOWLEDGE.md §6](skills/MECHANIC_KNOWLEDGE.md)) powering F5 also surfaces inline on any repair diagnosis: every 🟠/🔴 fix shows the fair band so the owner walks into the service centre pre-armed (the **Mechanic Copilot** idea). For cars this is the single biggest money-saver — the difference between a ₹35 000 and a ₹2 000 outcome.

## F15 — Family / Fleet View — COMING SOON
- **Story (P3):** *One dashboard for all my vehicles — which is due service, which has an open fault, which document expires when.*
- **UX:** single household/fleet of cars + bikes ([chitti-2wheeler](../chitti-2wheeler/) shared `family_fleet`) → per-vehicle health + service-due + document-expiry at a glance; "is my taxi roadworthy for the airport run?" answered per vehicle.
- **A11y:** spoken per-vehicle summary; picture-icon vehicle tiles.
- **Cross-product:** shared `family_fleet` table surfaced on both 2W + 4W pages.

---

## Out of scope (v1.0)

- Booking/holding service slots · selling spare parts · taking any commission ·
  dispatching a mechanic · issuing a fitness/roadworthy cert · live VAHAN/PARIVAHAN
  deep-link (partnership-blocked) · DigiLocker pull (partner-only OAuth) ·
  manufacturer telematics SDK (BlueLink / iRA / i-SMART) · FASTag balance API ·
  camera-based ISL detection (Phase 2, platform-wide) · ECU coding/customisation.

## Roadmap markers

`COMING SOON` (visible, never hidden) for: Dashboard Doctor photo-detect, Sound
Doctor classifier, DIY Coach video library, Scam Shield fair-price table, Vehicle
Twin part-age model, Used Vehicle Inspector (100-point), Vehicle Health Passport,
Document Vault OCR, weather-aware + diesel-DPF reminders, full ~2 000-code DTC
library, Family/Fleet view, OBD2/ELM327 live-PID Mode 2 streaming.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
