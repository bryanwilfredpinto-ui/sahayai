🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# PRD — Chitti Bike Doctor (C2WOS v1.0)

> Governs every feature. Each feature carries: **User story · UX flow · A11y review ·
> Failure modes · DIY-safety class · Test/Eval ref · Backend route status.** A
> feature missing any of these is not built (ROLE.md "Required documentation").
> Personas referenced as P1–P10 from [PERSONAS.md](PERSONAS.md). Backend routes
> are the real ones in [backend/routes/wheels.py](backend/routes/wheels.py);
> anything not there is marked **COMING SOON** honestly.

## DIY-safety classification (the spine of every diagnosis)

Every fix Chitti returns is stamped with exactly one class. This is a **hard
safety gate** — misclassifying a brake/fuel/steering job as DIY is a P0 incident.

| Class | Meaning | Example |
|---|---|---|
| 🟢 **DIY Allowed** | Safe for a beginner with basic tools | spark-plug swap, chain lube, air-filter clean, tyre-pressure, fuse |
| 🟡 **DIY Assisted** | Doable but Chitti coaches every step; some risk | engine-oil change, clutch-cable adjust, battery swap, headlight bulb |
| 🟠 **Professional Required** | Must go to a mechanic — but Chitti arms with fair price | carburettor tune, valve clearance, fuel-injector, wiring fault |
| 🔴 **Emergency Required** | Do not ride · safety-critical · may need SOS | brake failure, steering play, fuel leak near hot engine, fork/frame |

## Global contracts (apply to every feature below)

- **Swarm vote before display** — 8 agents ([swarm/](swarm/)) score; frontend shows
  the synthesized confidence-weighted verdict (*"Battery 85% / Starter 10% / Fuel 5%"*)
  + a per-agent breakdown the rider can expand.
- **Six fields, always** — Why · Severity · Can-I-drive · DIY class · Cost band · Alternatives.
- **Never claim certainty** — Likely / Possible / Unlikely + High / Medium / Low confidence.
- **Per-response widget** — every card has `data-chitti-response` (🔊 / 🤖 / 👍 / 👎 + feedback). No card ships without it.
- **Privacy** — photos/audio processed on-device; only short *text descriptions* reach DeepSeek. ([ARCHITECTURE.md](ARCHITECTURE.md), [§2b](../SAHAYAI_MASTER.md).)
- **Golden Rule** — Bike Doctor takes no side-effecting action (RSA call, SOS, WhatsApp booking, document share) without `chittiConfirmAndDo()` ([§2g](../SAHAYAI_MASTER.md)).
- **Emergency = family cascade** — **NEVER** auto-dials 100 / 108 / 112.
- **Server-enforced disclaimer** — every DeepSeek answer carries the [mechanic disclaimer](skills/FEATURES.md#disclaimer) footer, never client-controlled.
- **Honest empty states** — never a fabricated diagnosis; if Chitti cannot tell, it says so and routes to a human.

---

## F0 — Symptom Doctor (HERO) — `POST /api/2w/ask` ✅ LIVE
- **Story (P1/P2/P8):** *As a rider, I want to describe what's wrong in my own words and get a clear diagnosis so that I know if I really need a mechanic.*
- **UX flow:** Home → big primary "🩺 Meri bike ka problem bataao" → rider speaks/types/photos → Symptom Agent maps to candidate faults → 8-agent swarm vote → card with the six fields + confidence-weighted verdict.
- **DIY class:** per fault, stamped by the DIY Agent.
- **A11y:** blind → fully spoken, sound-first; deaf → visual severity card + ISL; mute → photo-first; illiterate → voice + picture icons.
- **Failure modes:** symptom too vague → Chitti asks one clarifying question, never guesses; DeepSeek malformed → honest "phir se try karo," no fabricated score; fault not in corpus → "isko mechanic dikhao" + fair-price band, never invents.
- **Eval:** [evals/diagnostic_accuracy.md](evals/diagnostic_accuracy.md), [evals/hallucination_eval.md](evals/hallucination_eval.md).
- **Route:** real — `deepseek_client.ask(q, profile)`, disclaimer injected server-side.

## F1 — Onboarding / Bike Profile — `POST /GET /api/2w/profile` ✅ LIVE
- **Story (all):** *I want Chitti to remember my exact bike so its advice is specific, not generic.*
- **UX:** brand · model · year · fuel · odometer · reg — voice-buildable ("Chitti, meri Splendor hai, 2019, 42 000 km"). Keyed by `X-Chitti-Device`.
- **A11y:** picture-menu brand picker; odometer spoken; never requires typing.
- **Why it matters:** Quality rule Q1 — service intervals are make/model/year-specific, never generic.
- **Route:** real — persisted to Turso (see ARCHITECTURE.md env-blocker note).

## F2 — Dashboard Doctor — COMING SOON (routes via F0 today)
- **Story (P5/P7/all):** *I want to photograph my dashboard warning lights and be told what each means and whether I can ride.*
- **UX flow:** snap dashboard → on-device detect lit symbols → per-light card: name · severity · can-I-drive · recommended action.
- **DIY class:** per light (oil-pressure red = 🔴 Emergency "do not ride"; ABS amber = 🟠 Professional "ride gently to mechanic").
- **A11y:** blind → "Chitti, mera dashboard padho" reads every lit light aloud (P5 hero); deaf → captioned cards; mute → pure photo flow.
- **Failure modes:** glare/blur → ask to re-shoot, never guess a light; unknown symbol → describe shape, route to F0.
- **Eval:** dashboard-light read accuracy ≥ 92%.
- **Status:** photo-to-light detection COMING SOON; today the rider describes the light to F0.

## F3 — Sound Doctor — `POST /api/2w/listen` → 501 COMING SOON
- **Story (P5/P6/all):** *I want to record my engine sound and have Chitti tell me what the noise is.*
- **UX flow:** record 10 s → on-device feature extraction → compare to sound library (misfire / bearing whine / chain rattle / tappet noise / valve tick) → ranked candidates with confidence + the six fields.
- **A11y:** blind → primary surface, fully spoken (P5); **deaf → MUST show a visual waveform + result card, never rely on hearing** (P6); mute → tap to record.
- **Failure modes:** noisy environment → low-confidence band shown honestly, "phir se record karo, engine ke paas"; never claims certainty from a bad clip.
- **DIY class:** per candidate (chain rattle → 🟢 lube; tappet → 🟡 assisted adjust; bearing whine → 🟠 professional).
- **Eval:** sound-diagnosis top-3 hit rate ≥ 80%.
- **Status:** route returns 501 today — honest stub per platform rule; audio classifier queued (W12).

## F4 — DIY Coach — COMING SOON (guidance via F0 today)
- **Story (P2/P8):** *Don't send me to a mechanic for a five-minute job — teach me to do it.*
- **UX flow:** for any 🟢/🟡 fault → step-by-step card: **level** (Beginner/Intermediate) · **tools needed** · **time** · **difficulty /10** · **video + voice walk-through** · **DIY saving vs quote**.
- **DIY class gate:** only 🟢 DIY Allowed and 🟡 DIY Assisted ever reach the Coach. 🟠/🔴 are *never* coached — they route to a human. This is the unsafe-DIY = 0 gate.
- **A11y:** illiterate → voice-only walk-through with picture icons; deaf → captioned video + text steps; blind → spoken steps with confirm-after-each.
- **Failure modes:** rider stuck mid-step → "ruk jao, mechanic ko dikhao" (stop, see a mechanic) rather than push an unsafe continuation.
- **Eval:** [evals/diy_safety_eval.md](evals/diy_safety_eval.md) — unsafe DIY recs = 0.

## F5 — Scam Shield — `POST /api/2w/quote/check` → 501 COMING SOON
- **Story (P1/P4/P9):** *Mechanic ne ₹1 800 maanga — kya theek hai?*
- **UX flow:** type/photo the quote or invoice → Chitti returns the **fair band** (median + 25/75 percentile, city-adjusted) vs the **quoted** number → verdict **Fair ✅ / High ⚠️ / Scam 🚩** + "what to say to the mechanic" coaching line.
- **A11y:** photo the bill (mute/illiterate); verdict spoken with ✅/⚠️/🚩 icons (deaf/blind).
- **Failure modes:** item not in fair-price table → honest "iska band abhi nahi hai" + DeepSeek opinion flagged as low-confidence; never fabricates a band.
- **Eval:** scam-quote catch rate ≥ 90%; cost accuracy ≥ 85% ([evals/scam_shield_eval.md](evals/scam_shield_eval.md)).
- **Status:** 501 today; fair-price table from [MECHANIC_KNOWLEDGE.md §5](skills/MECHANIC_KNOWLEDGE.md) + community seed queued (W7).

## F6 — Vehicle Twin — `GET /api/2w/maintenance/next` ✅ LIVE (twin partial)
- **Story (P3):** *Remember my bike's full history and predict what fails next.*
- **UX:** model · service history · **tyre age · battery age · brake age · chain age** → predict next failure + km-remaining per component.
- **A11y:** spoken summary ("agle 800 km mein brake shoe khatam"); picture-icon component list.
- **Failure modes:** no odometer → ask for it; missing a part's install date → ask, never assume.
- **Route:** `maintenance/next` (oil/air/plug/chain km-remaining) is **real**; the full age-based twin (tyre/battery/brake age) is COMING SOON, layered on the same profile.

## F7 — Parts Life Predictor — COMING SOON
- **Story (P3):** *Tell me how much life is left in my chain, tyres, battery, brake pads.*
- **UX:** per-part remaining-life bar from install date + odometer + usage pattern + (Mode 2) sensor trend.
- **DIY class:** lube/clean 🟢; replacement 🟡/🟠 per part.
- **Status:** Mode-1 odometer projection layered on F6; Mode-2 sensor trend needs ELM327 (W5).

## F8 — Used Vehicle Inspector — COMING SOON
- **Story (P10):** *Run a 100-point inspection before I buy this used bike.*
- **UX flow:** guided 100-point checklist (engine start, smoke colour, chain slack, clutch slip, brake feel, tyre tread, electricals, frame, documents, odometer-tamper signs) → photo/video/sound per point → overall buy-confidence + a "negotiate ₹X off" estimate from flagged issues.
- **A11y:** voice-guided point-by-point (illiterate/blind); visual checklist with icons (deaf); photo-only path (mute).
- **Failure modes:** never declares a bike "perfect" — always lists what it could not verify.
- **Cross-link:** reads the seller's **Vehicle Health Passport** (F10) when present.

## F9 — Emergency Mode + Roadside SOS — `POST /api/2w/breakdown` ✅ LIVE
- **Story (P1/P9/all):** *My bike won't move and I'm stranded — guide me, and if it's serious alert my family.*
- **UX flow:** **"Can the vehicle move?"** → if yes: deterministic breakdown decision tree (hazard lights → fuel/reserve → battery/horn test → side-stand sensor → rest 5 min → retry; if it starts, ride < 40 km/h straight to a mechanic). If no / unsafe → **SOS tab → family cascade**.
- **SOS contract:** confirm-with-master → ring alarm bypassing silent → spouse → family → Chitti-to-Chitti relay. **NEVER auto-dials 100/108/112.** Brand RSA number surfaced (not auto-called). GPS + RC plate added to payload.
- **A11y:** spoken step-by-step (blind/illiterate); visual cards (deaf); tap-through (mute). SOS button is the largest, most prominent affordance for P9.
- **Failure modes:** GPS denied → ask landmark; brand unmatched → generic 1033 RSA shown.
- **Route:** real — returns the 8-step tree + brand RSA + the explicit Vaani-protocol line.

## F10 — Vehicle Health Passport — COMING SOON
- **Story (P3/P10):** *Keep a lifelong, portable record of my bike's health that proves its condition at resale.*
- **UX:** every symptom, diagnosis, repair, part age and cost appended to one rider-owned record; exportable PDF; readable by the Used Vehicle Inspector (F8) of the next buyer.
- **Privacy:** lives on-device; shared only via `chittiConfirmAndDo()` (Golden Rule).
- **Patent-level:** the trust artifact that survives the sale — proof against a lying seller *and* a lying buyer.

## F11 — Preventive Maintenance — `GET /api/2w/maintenance/next` ✅ LIVE (base) + weather COMING SOON
- **Story (P3/all):** *Warn me before a part fails, not after.*
- **UX:** odometer-aware reminders (oil/air/plug/chain) via cron 06:00 IST → Vaani read-aloud. **Weather-aware** layer (W13): monsoon → chain lube every 300 km not 500; dust season → air-filter 2× check.
- **A11y:** spoken reminders; picture-icon component cards.
- **Route:** odometer schedule is **real**; weather-feed layer COMING SOON.

## F12 — Document Vault — COMING SOON (W3)
- **Story (P4/P8/all):** *Remember my RC, insurance, PUC, DL and warn me before they expire.*
- **UX:** camera-capture → OCR → encrypted row → auto-expiry alerts 30/7/1 days before. Expired PUC = ₹10 000 fine — this is legal-compliance P0 (S2/S3).
- **A11y:** photo-capture (mute); spoken expiry warnings (blind/illiterate); state-aware PUC validity.
- **Privacy:** encrypted on-device; never shared without confirm.

## F13 — DTC Plain-English Library — `GET /api/2w/dtc/<code>` ✅ LIVE (~12 codes)
- **Story (Mode 2 riders):** *Translate this trouble code into language I understand + a cost band.*
- **UX:** code → Hinglish meaning + severity + fair-cost band. ~12 common codes live; ~600 queued (W6).
- **Failure:** unknown code → honest 404 + "POST /ask se DeepSeek pe pucho," never fabricates a meaning.
- **Route:** real — local `_DTC` table; full library is `dtc_codes_2w.json` (P1).

## F14 — Anti-Overcharge Guard — folds into Scam Shield (F5)
- The fair-price band ([MECHANIC_KNOWLEDGE.md §5](skills/MECHANIC_KNOWLEDGE.md)) powering F5 also surfaces inline on any repair diagnosis: every 🟠/🔴 fix shows the fair band so the rider walks into the workshop pre-armed (the **Mechanic Copilot** idea).

---

## Out of scope (v1.0)

- Booking/holding service slots · selling spare parts · taking any commission ·
  live VAHAN/PARIVAHAN deep-link (partnership-blocked) · DigiLocker pull
  (partner-only OAuth) · manufacturer telematics SDK · camera-based ISL detection
  (Phase 2, platform-wide).

## Roadmap markers

`COMING SOON` (visible, never hidden) for: Dashboard Doctor photo-detect, Sound
Doctor classifier, DIY Coach video library, Scam Shield fair-price table, Vehicle
Twin part-age model, Used Vehicle Inspector, Vehicle Health Passport, Document
Vault OCR, weather-aware reminders, full ~600-code DTC library, OBD2/ELM327 Mode 2.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
