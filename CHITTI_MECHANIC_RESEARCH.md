🎖️ World Class Chitti Mechanic (Bike + Car Doctor) — Commando Discipline. Zero Excuses.

# RESEARCH — world's best vehicle + accessibility apps (BO0)

> Sire's rule (2026-06-06): *"Do a research of the best apps in the world FIRST, then
> prepare a build order, then execute."* This file is **BO0** of
> [CHITTI_MECHANIC_BUILD_ORDER.md](CHITTI_MECHANIC_BUILD_ORDER.md). Every finding maps to a
> Chitti Mechanic PRD feature ([chitti-2wheeler/PRD.md](chitti-2wheeler/PRD.md) ·
> [chitti-4wheeler/PRD.md](chitti-4wheeler/PRD.md)) and a build order, marked **BUILT /
> ADD / ROADMAP** — honestly. No number or capability is claimed before it is measured.

Shared across **Chitti 2-Wheeler (Bike Doctor)** and **Chitti 4-Wheeler (Car Doctor)** —
the two products are mirror builds; vehicle deltas are noted inline.

---

## 1. Symptom-first diagnosis (the HERO)

| App / precedent | What it does well | Chitti takes | PRD / BO | Status |
|---|---|---|---|---|
| **RepairPal** symptom checker | symptom → likely causes + severity, plain language | symptom → ranked causes with **confidence**, not certainty | F0 · BO4 | **BUILT** (Swarm Diagnosis, 8 agents) |
| **AutoMD** question-based diagnosis | guided Q&A narrows the cause | guided + free-text + **voice** symptom entry | F0 · BO4 | **BUILT** (deterministic KB + voice) |
| **YourMechanic** "why is my car…" articles | cause → fix → cost in one flow | cause → **SVG diagram + steps + cost band** | F0 · BO5 | **BUILT** (Roadside Self-Fix) |

> **Chitti's differentiator:** an **8-agent confidence swarm** (Symptom · Engine · Electrical ·
> Fuel · Safety[veto] · DIY · Cost · Trust[anti-overconfidence]) votes before any verdict
> shows — *Likely / Possible*, never "it is definitely X". Most apps state a single guess.

## 2. OBD2 / dashboard / fault-code reading

| App / precedent | Strength | Chitti takes | PRD / BO | Status |
|---|---|---|---|---|
| **FIXD**, **BlueDriver**, **Carly**, **OBD Fusion**, **Torque Pro** | ELM327 BLE → live DTCs + plain-English | Web-Bluetooth ELM327 → DTC decode; honest fallback when no adapter | F13 · BO10 | **BUILT** (OBD BLE + ~12 DTC codes) |
| **CarMD** | DTC → likely fix + cost + severity | DTC → plain-English library, no fabricated fix | F13 · BO10 | **BUILT (seed)** · wider code DB **ROADMAP** |
| **Dashboard warning-light guides** (OEM manuals) | icon → meaning → urgency | **Dashboard Doctor**: pick/scan light → meaning + can-I-ride | F2 · BO8 | **BUILT (deterministic)** · photo-AI **ROADMAP** |

## 3. Anti-overcharge / fair price (trust moat)

| App / precedent | Strength | Chitti takes | PRD / BO | Status |
|---|---|---|---|---|
| **RepairPal Fair Price Estimator** | locality-aware parts+labour band | job + quote → **fair band** + "is this a scam?" verdict | F5 / F14 · BO7 | **BUILT** (Scam Shield) |
| **Kelley Blue Book / KBB repair** | trusted cost reference | fair-cost band per job, India-localised | F5 · BO7 | **BUILT (band)** · live regional DB **ROADMAP** |

> **Anti-persona honored:** Chitti's best answer is often *"kuch mat karo, theek hai"* (do
> nothing, it's fine). It never becomes a parts-lead funnel ([PERSONAS.md](chitti-2wheeler/PERSONAS.md) anti-persona).

## 4. Maintenance log / digital service book / preventive

| App / precedent | Strength | Chitti takes | PRD / BO | Status |
|---|---|---|---|---|
| **Drivvo**, **Fuelio**, **Simply Auto**, **aCar** | fuel + service + cost history, reminders | **Vehicle Twin** + **Digital Service Book** on-device | F6 / F8 · BO9 | **BUILT** (twin partial, service log) |
| **OEM service schedules** (Honda/TVS/Maruti) | model-exact intervals | preventive reminders by odo + time | F11 · BO9 | **BUILT (base)** · weather-aware **ROADMAP** |
| **Vehicle Health Score** (insurer telematics) | one 0–100 number | rate-6 → 0–100 health band | F10 · BO9 | **BUILT** |

## 5. Used-vehicle inspection

| App / precedent | Strength | Chitti takes | PRD / BO | Status |
|---|---|---|---|---|
| **CARS24 / Spinny PDI**, 200-point checklists | structured independent inspection | deterministic multi-point inspector, hidden-fault flags | F8 · BO9 | **BUILT (deterministic)** · camera-AI **ROADMAP** |
| **VAHAN / mParivahan** | RC → make/model/owner/age | **Scan-your-RC** → reg parsed to State+RTO offline; make/model via vision/VAHAN | F1 · BO3 | **BUILT (reg→state)** · make/model auto-read **ROADMAP** (vision/VAHAN API) |

## 6. Sound / vibration / multi-modal AI

| App / precedent | Strength | Chitti takes | PRD / BO | Status |
|---|---|---|---|---|
| **Bosch sound-based diagnostics**, OtoMate, Aural Analytics | mic → fault signature | **Sound Doctor**: record → visual waveform + pick-the-sound | F3 · BO8 | **BUILT (deterministic picker + waveform)** · audio-AI **ROADMAP** |
| **OEM connected telematics** (TVS/Honda/Maruti connect) | live engine telemetry | OBD BLE today; telematics partnership | F7 · BO10 | **ROADMAP** |

## 7. Roadside assistance / emergency

| App / precedent | Strength | Chitti takes | PRD / BO | Status |
|---|---|---|---|---|
| **AAA**, **urgent.ly**, OEM RSA | one-tap roadside help | **Roadside SOS** — but **family cascade, NEVER auto-dials 100/108/112** | F9 · BO6 | **BUILT** |
| Maps deep-links | nearest fuel/garage | nearest-help as a plain map query (no paid funnel) | F9 · BO6 | **BUILT** |

## 8. Accessibility precedents (the four users are the floor, not a tier)

| Precedent | Strength | Chitti takes | Persona / BO | Status |
|---|---|---|---|---|
| **Be My Eyes** (volunteer + "Be My AI") | blind user → describe-my-photo | blind: describe-my-dashboard, voice-everything, haptic confirm | Arjun P5 · BO11 | **BUILT (voice/ISL substrate)** · live photo-AI **ROADMAP** |
| **Microsoft Seeing AI**, **Google Lookout** | scene / text / product read-aloud | dashboard + bill read-aloud (deterministic today) | Arjun P5 · BO8/BO11 | **BUILT (read-aloud)** |
| **ISL dictionaries / ISH News** | sign-language delivery | per-response **ISL panel** for deaf users + waveform Sound Doctor | Imran P6 · BO11 | **BUILT (ISL Phase-1)** |
| **Android Voice Access / Sound Amplifier** | hands-free + audio aids | voice-in + voice-out everywhere; mute → tap/photo only | Pooja P7 / Babu P8 · BO11 | **BUILT** |
| **Government accessibility (WCAG 2.2, GIGW)** | contrast, tap size, alt text, lang | ≥48px taps, alt on all img, `<html lang>`, never colour-only, 9 langs | all · BO12 | **BUILT (attribute audit)** · human-AT sessions **ROADMAP** |

---

## Research → gaps the build order MUST close (honest)

1. **Make/model auto-read from RC photo** — every precedent (VAHAN, Seeing AI) proves it's
   expected. Vision-gated → wired (`CHITTI_RC_VISION_URL`), honest "coming soon" today. (BO3)
2. **Photo/sound/vibration AI** (Be My Eyes / Bosch) — deterministic versions live; the AI
   verdict is an honest stub until a funded vision/audio model. **Never fabricated.** (BO8)
3. **Human assistive-technology sessions** — no precedent ships a11y without real blind/deaf
   users; ours is attribute-verified, **human-AT testing is ROADMAP** before mass launch. (BO11)
4. **Live regional parts/labour DB** (RepairPal locality) — band is seeded; live DB ROADMAP. (BO7)

> Everything marked BUILT below is **proven by a test in the build order** — not by the fact
> that earlier code happened to exist. Reuse is earned by passing the BO's CEOS test.

---
> **World Class Chitti Mechanic (Bike + Car Doctor) — Commando Discipline. Zero Excuses.**
