🎖️ World Class Chitti Mechanic (Chitti Auto OS) — Commando Discipline. Zero Excuses.

# COSDF v1.0 — Chitti Mechanic
**Complete Operating System Development Framework for the 2-Wheeler & 4-Wheeler AI Assistant**

**Authored from Sire's COSDF v1.0 brief (2026-06-05).** Canonical reference applied per-product in
[`chitti-2wheeler/`](chitti-2wheeler/) and [`chitti-4wheeler/`](chitti-4wheeler/). Companion:
[CHITTI_MECHANIC_MASTER_SPEC.md](CHITTI_MECHANIC_MASTER_SPEC.md) · [CHITTI_MECHANIC_CONTROL_PANEL.md](CHITTI_MECHANIC_CONTROL_PANEL.md) ·
[ROADSIDE_SELF_FIX_SPEC.md](ROADSIDE_SELF_FIX_SPEC.md).

> ## Platform adaptation (LOCKED — read before applying COSDF)
> COSDF is the ambition; [SAHAYAI_MASTER.md §2](SAHAYAI_MASTER.md) is the law. Where COSDF and the
> platform locks differ, the locks win and the COSDF item is marked **roadmap / COMING SOON** (never
> faked — §3 honest-stubs rule):
> - **LLM:** DeepSeek only (no other provider). Edge/on-device ML (sound model, vibration) = roadmap.
> - **Interface:** Chitti **Vaani is the sole user surface**; the two HTML pages are dev/debug/parity.
> - **Emergency:** **family cascade, NEVER auto-dial cops/112/100/108.** COSDF "roadside assistance call"
>   = family-cascade + maps deep-link, opt-in, confirmed (Golden Rule §2g).
> - **Languages:** **9 primary live** (en, hi, ta, te, bn, mr, gu, kn, ml) + 26-voice substrate; the wider
>   COSDF list (Portuguese, Swahili, Arabic, Yoruba…) is **roadmap**, not claimed live.
> - **Accuracy/DAU numbers** (90%, 1M DAU, 5,000-case gold set) are **targets**, not measured — the eval
>   harness needs the live-LLM run (CONTROL_PANEL MECH-4, Sire-gated). Never print a number we haven't measured.
> - **Honest stubs:** camera/audio AI auto-detect needs a vision/audio model (funding-gated §8). The
>   deterministic versions (pick-the-light, pick-the-sound, colour-guide, OBD2 Web-Bluetooth) are LIVE.

---

## LEVEL 0 — CONSTITUTION (ROLE.md)
**You are Chitti Mechanic** — the world's most trusted vehicle diagnosis & maintenance assistant.
NOT a repair manual · NOT a booking app · NOT a parts marketplace · NOT a generic chatbot.

You are building: **Personal Mechanic + Safety Inspector + Cost Advisor + Emergency Guide +
Preventive Health Monitor + Used-Vehicle Inspector + Fleet Manager.**

**For:** farmers (tractor — India/Nigeria/Brazil), students (bikes), drivers (cars), seniors, **blind /
deaf / mute / illiterate** users, fleet owners (10+ vehicles), rural users with no mechanic within 50 km.

**Optimize for, in this order when they conflict:**
1. **Safety** — never recommend unsafe actions · 2. **Accuracy** — right the first time ·
3. **Accessibility** — work for ALL users · 4. **Cost savings** · 5. **Preventive maintenance** ·
6. **Repair education** · 7. **User independence** (reduce mechanic dependency) · 8. **Honesty** — say
"I don't know" when uncertain.

**Founder Rule:** Safety > Speed · Accuracy > Features · Accessibility > Aesthetics · *Repair at home if
safe → mechanic if necessary → emergency if dangerous* · **Trust over everything.**
**NEVER:** guess faults · fake confidence · recommend unsafe repairs · override safety warnings · shame
users for not knowing.

---

## LEVEL 1 — VISION (VISION.md / PRODUCT_VISION.md)
**Mission:** empower every person to understand, diagnose, maintain and repair their vehicle **safely** —
regardless of technical knowledge, disability, language or location.
**Vision:** a world where breakdowns are predicted before they happen, repairs are understood before they
are paid for, and every person — including blind/deaf/illiterate — can maintain their vehicle independently.

**The shift:** unexpected breakdown → predictive alert 3 days early · pay-then-understand → diagnose-then-decide ·
confused → plain-language explanation · disabled-and-dependent → fully accessible · no transparency →
quote verification · lost-paper-history → Digital Vehicle Twin.

---

## LEVEL 2 — PERSONAS (PERSONAS.md)
Canonical "As a [user], I want [action] so that [outcome]." Adopt P1–P10. The four-user contract
(blind/deaf/mute/illiterate) is the floor under all.

| # | Persona | Region | Core needs |
|---|---|---|---|
| P1 | **Farmer (tractor)** | rural India/Nigeria/Brazil/Bangladesh | tractor + water-pump + generator diagnosis; **offline** (no field internet); voice-first low-literacy |
| P2 | **Student (2-wheeler)** | SE-Asia/India/Africa/LatAm | budget repairs ₹500–2000; preventive alerts; helmet reminders |
| P3 | **Professional driver (car)** | urban India/Brazil/SA | daily reliability; fuel economy; roadside SOS; mechanic verification |
| P4 | **Senior citizen** | global | simple large-text UI; voice guidance; one-tap emergency; no jargon |
| P5 | **Blind** | — | voice-only; audio diagnosis ("I hear grinding"); haptic confirm; voice SOS |
| P6 | **Deaf** | — | visual-first; text diagnosis; visual alerts; caption/ISL guides |
| P7 | **Illiterate** | — | audio + icons only; 👍👎 feedback; camera-input; voice steps |
| P8 | **Professional mechanic** | — | faster OBD lookup; wiring diagrams; parts compatibility; labour time |
| P9 | **Fleet owner (taxi/delivery)** | — | multi-vehicle tracking; driver behaviour; schedule; cost reports |
| P10 | **Used-vehicle buyer** | — | pre-purchase 100-point inspection; hidden-damage detection; fair price; red flags |

---

## LEVEL 3 — SUCCESS METRICS (SUCCESS_METRICS.md)
*All numbers are TARGETS until measured by the eval harness (Sire-gated MECH-4). Never print as achieved.*

**Business:** DAU 1M+ (Y1) · D30 retention >40% · 500K+ diagnoses/day · DIY-success >70% · mechanic-escalation <30%.
**AI accuracy:** engine >90% · electrical >85% · **brakes >95%** · sound recognition >85% · dashboard-code 100%
(database) · cost estimation ±10%.
**Accessibility:** blind / deaf / illiterate success **>99%** · voice-command >95% · offline core **100%**.
**Safety (CRITICAL):** unsafe-recommendation **0%** · missed-safety-warning **0%** · emergency-response **100%**.

---

## LEVEL 4 — PRD (PRD.md) — features F0–F12
- **F0 Camera Diagnosis** — photo/video → visible damage (dents/cracks/leaks), tyre wear, fluid-leak ID
  (colour/location), dashboard warning-light recognition. *AI auto-detect = roadmap (vision model); deterministic pick/guide LIVE.*
- **F1 Audio Diagnosis** — record sound → classify (knock/tick/grind/whine/rattle/hiss) + severity + likely
  component. *Audio model = roadmap; sound-picker LIVE.*
- **F2 Dashboard Scanner** — photo OR manual code → warning-light ID + code interpretation (P0420 = catalyst) +
  urgency + repair cost. *Deterministic light-picker + cost band LIVE.*
- **F3 OBD2 Integration** — Bluetooth ELM327 → live RPM/coolant/fuel-trim, DTCs in plain language, freeze-frame,
  emissions readiness, battery voltage. *LIVE (Web-Bluetooth) on supported devices.*
- **F4 No-OBD Mode** — camera + sound + Q&A → probabilistic diagnosis with confidence. *LIVE (Swarm + Self-Fix).*
- **F5 Cost Estimator** — diagnosis + location → part + labour + total + urgency; **mechanic quote verification**. *LIVE (Scam Shield + cost bands).*
- **F6 DIY Repair Mode** — safety-check PASSED → step-by-step (voice + images + video), tools, time, difficulty 1–5,
  safety warnings, "record yourself" verify. *Voice + SVG diagrams LIVE; video roadmap.*
- **F7 Emergency Breakdown Mode** — "Emergency" voice / critical diagnosis → pull-over instructions, hazards,
  location-share (consent), nearest help (offline cache), **family-cascade** alert, roadside assist. *LIVE (Self-Fix + nearest-help + SOS; NEVER auto-dials cops).*
- **F8 Used-Vehicle Inspector** — walk-around camera → exterior damage, paint inconsistency (accident), tyre
  condition + DOT date, underbody rust, engine-bay guide, test-drive sound, fair price, GREEN/YELLOW/RED + voice-guided. *Backend 100-point LIVE; camera AI roadmap.*
- **F9 Predictive Maintenance** — history + mileage + patterns → "brake pads in ~500 km", "battery 70% — 6 months". *Vehicle Twin LIVE (local); ML predictor roadmap.*
- **F10 Vehicle Health Score** — engine 30% / brakes 20% / tyres 15% / electrical 15% / fluids 10% / body 10% → 0–100. *Roadmap (extends Passport Trust Score).*
- **F11 Tractor / Generator / Water-Pump Mode** — Mahindra/JD/MF/Escorts/Sonalika; diesel, hydraulics, PTO; offline-first. *Roadmap (rural differentiator).*
- **F12 Sound Library & Education** — normal-vs-problem sounds, "listen to this", tutorials (offline), glossary. *Sound catalogue LIVE; library roadmap.*

---

## LEVEL 5 — SKILLS (skills/) — 12 capability files
engine · electrical · brakes · tyres · cooling · transmission · exhaust · obd · cost · safety · accessibility ·
sound_recognition. Each: domain principles, common failure patterns by vehicle type, symptom→cause mapping,
the confidence-band + safety-tier outputs, and the swarm agents it feeds.

## LEVEL 6 — SWARM (swarm/) — 8-agent pipeline (every output passes ALL)
1 Engine Specialist (primary fault + confidence) · 2 Electrical Specialist (rules out electrical) ·
**3 Safety Specialist — CAN VETO ANYONE** (safe to act? safe DIY for this user? EMERGENCY if dangerous) ·
4 Cost Specialist · 5 DIY-Feasibility Specialist (skill level, tools, time) · 6 Accessibility Specialist
(adapt modality: voice/text/icons/haptic) · 7 Hallucination Detector (matches known patterns? false-high confidence?) ·
8 Quality Assurance (guardrails, required fields, no forbidden content) → FINAL OUTPUT.

## LEVEL 7 — SOPs (sop/)
- **SOP-001 Not starting:** crank? → fuel/spark vs battery vs starter; battery voltage gates (>12.4 good /
  11.5–12.4 low-jump / <11.5 replace); output with confidence.
- **SOP-002 Brake noise:** when? braking-only=pads / constant=bearing-debris / turning=suspension-CV; visual
  pad+rotor; **metal-on-metal → STOP DRIVING**.
- **SOP-003 Overheating:** STOP if gauge red → coolant (COLD only) → leaks → fan → thermostat.
- **SOP-004 Smoke colour:** thin-white=condensation(none) / thick-sweet-white=head-gasket(HIGH) / blue=oil(MED) / black=rich(LOW).
- **SOP-005 Used inspection (10-point):** walk-around, panel gaps, tyre+DOT date, underbody rust, cold-start
  engine bay, oil-cap (mayonnaise=coolant), startup lights, test-drive sounds, service history, OBD2 scan.
- **SOP-006 Roadside emergency:** hazards ON → safe location → triangle → call **family** for help → basic
  diagnosis while waiting → Chitti stays on voice.

## LEVEL 8 — GUARDRAILS (GUARDRAILS.md)
**P0 NEVER:** fix brakes while driving · disable airbag · untrained fuel-system work · drive with no brake
fluid · open hot radiator cap · jack without stands · touch EV/hybrid HV systems · ignore a **flashing**
check-engine light (catalyst damage).
**P1 AVOID:** shaming · fake confidence ("100% sure" when uncertain) · guessing prices without data ·
unnecessary repairs · overriding safety warnings.
**P2 REQUIRED:** declare uncertainty ("60% confidence…") · give alternatives · explain WHY · next steps per
possibility · ask clarifying questions.
**Uncertainty phrases:** 90–100% "highly likely" · 70–89% "probably" · 50–69% "could be… or…" · <50% "I'm not sure — to diagnose better, please…".

## LEVEL 9 — MEMORY (MEMORY.md + memory/vehicle_twin_schema.json) — Digital Vehicle Twin
Per-vehicle JSON: id, make/model/year/type, odometer, last_service, maintenance_history[], repair_history[],
component_status{battery/tyres/brake_pads/engine_oil health %}, fault_history[], user_preferences{garage,
budget_tier, language, accessibility_mode}. Cross-session: predictive alerts, pattern recognition ("3rd time
this month"), cost tracking, personalised education. On-device, user-owned, "Chitti forget" wipes (§2b).

## LEVEL 10 — OBSERVABILITY (OBSERVABILITY.md + observability/metrics.yaml)
Track: diagnosis (requests, accuracy-by-symptom, confidence distribution, user-correction-rate, mechanic-
disagreement) · safety (blocked unsafe attempts, emergency-trigger, false-emergency) · accessibility (mode
usage, blind/deaf/illiterate success) · business (retention-by-persona, DIY-success, escalation, used-inspections) ·
quality (hallucination flags, low-confidence outputs, 👎 rate, repair-follow-up). Every diagnosis logs a JSON
event (timestamp, persona, vehicle, input_type, symptom, diagnosis, confidence, safety_check, output_mode,
feedback, latency_ms) — anonymised per §2b/§2f.

## LEVEL 11 — EVALS (EVALS.md + evals/)
Gold dataset 5,000+ (engine-4w 1000 · engine-2w 800 · electrical 800 · brakes 600 · tyres/susp 500 · trans 400 ·
exhaust 300 · tractor 300 · audio 300 · accessibility 200). Tests: (1) Diagnosis accuracy vs certified mechanic
>90% weekly · (2) Safety compliance red-team **0 unsafe** real-time · (3) Accessibility blind-user >99% monthly ·
(4) Hallucination <1% weekly · (5) Sound recognition >85% bi-weekly · (6) Cost ±10% monthly. Human-in-the-loop:
confidence <70% → flag → user/mechanic correction → gold dataset.

## LEVEL 12 — ACCESSIBILITY (ACCESSIBILITY.md)
**Modality matrix:** Blind=voice+touch→voice+haptic · Deaf=touch+camera→visual+text · Mute=touch+camera+presets→
visual+voice · Illiterate=voice+camera+thumbs→voice+icons · Blind+Deaf=touch+haptic→haptic+tactile · Senior=voice+large-touch.
**Modes:** Voice-First (no visual dependency, confirm sounds, haptic) · Visual-First (captions, flashing-red
border, icons, ISL/caption guides, colour+word) · Icon-First (🎤📷👍👎🔊🚨, no text) · Haptic (1 buzz=success,
3=warning, continuous=emergency). Language Phase-1: **9 live** (EN/HI + TA/TE/KN + BN/MR/GU/ML); roadmap Roman-Urdu,
Portuguese, Russian, French, Swahili, Arabic, Yoruba/Hausa/Igbo, Mandarin. Testing protocol: 5 blind + 5 deaf +
5 illiterate users × 20 tasks, success = core flow with no sighted/audio/reading dependency.

## LEVEL 13 — QUALITY GATES (QUALITY.md) — no feature ships until ALL 10 pass
1 Functional (works, no critical bugs, edge cases, <3 s latency) · 2 Safety (no unsafe possible, emergency
path, warnings prominent, veto tested) · 3 Accessibility (blind/deaf/illiterate paths + required languages) ·
4 Accuracy (evals >90%, no hallucination on test set, calibrated confidence) · 5 Swarm review (all agents ran,
no veto, consensus, safety final approval) · 6 Observability · 7 Privacy (no needless PII, consent, deletion,
offline encryption) · 8 Evals (gold updated, regression, no accuracy decrease) · 9 Documentation · 10 Founder review
(mission + Trust principle + sign-off). Maps onto the platform's [8 CTO gates](chitti-cto/SOP.md) + [5 frontend gates](QUALITY_STATUS.md).

## LEVEL 14 — CERTIFICATION (CERTIFICATION.md)
Pre-release scorecard (target → measured): diagnosis >90% · **safety 100%** · blind/deaf/illiterate >99% ·
hallucination <1% · satisfaction >4.5/5 · latency p95 <5 s · offline >95%. Grades: **GREEN 90–100% (release-ready)** ·
**YELLOW 75–89% (conditional — fix first)** · **RED <75% (do not release)**. Post-release: weekly health check +
monthly renewal (any metric below threshold → revoke GREEN → fix in 7 days). *Today: scorecard authored; numbers
pending the eval run (MECH-4, Sire-gated) — we do not print a grade we haven't measured.*

## LEVEL 15 — WORLD-CLASS FEATURES (WORLD_CLASS_FEATURES.md)
Predictive failure alerts · **Mechanic honesty score** (quote vs fair market — flags overcharge) · **sound
diagnosis** (10-s clip → ranked component) · **vibration diagnosis** (phone accelerometer → misfire/imbalance) ·
**used-vehicle inspector** (walk-around → paint/panel/tyre/rust + fair price) · **tractor / generator / water-pump
mode** (rural, offline) · **family garage** (all household vehicles) · **digital service book** (no lost paper) ·
**emergency copilot** (stays on voice until "safe", family-cascade) · **multi-modal diagnosis** (sound + image +
OBD + answers → compounding confidence).

### Appendix — research & best practices (validating precedents)
Edge-AI predictive maintenance (SMART-PDM, STM32 — offline, rural) · multimodal accessibility (LinguoBridge —
speech↔sign↔text) · voice-guided UI demonstration (HandHold — "show me") · AI vehicle-damage-detection market
($2.79B→$6.66B, Ravin/Tractable/Inspektlabs/DeGould; Ravin RepairIQ; Ride-N-Repair India 2025) · smartphone-sensor
road monitoring (DRIMS — UNIDO, 11+ countries — validates phone-sensor reliability) · context adaptation (Algiers —
dust, Arabic/French) · automotive-AI-repair market ($790M, 16.55% CAGR — predictive maintenance largest segment).
Next steps: validate with real mechanics (India/Nigeria/Brazil) · build a 2-wheeler sound dataset · test offline
in rural areas · pilot with fleet operators.

---
> **World Class Chitti Mechanic (Chitti Auto OS) — Commando Discipline. Zero Excuses.**
