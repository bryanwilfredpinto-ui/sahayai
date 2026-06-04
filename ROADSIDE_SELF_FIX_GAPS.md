🎖️ World Class Chitti Mechanic (Chitti Auto OS) — Commando Discipline. Zero Excuses.

# ROADSIDE SELF-FIX — what's NOT delivered (master-mechanic gap report)

**Date:** 2026-06-04 · **Author:** Chitti CTO, as a 20-year 2- & 4-wheeler master mechanic ·
**Companion:** [ROADSIDE_SELF_FIX_SPEC.md](ROADSIDE_SELF_FIX_SPEC.md) · [CHITTI_MECHANIC_CONTROL_PANEL.md](CHITTI_MECHANIC_CONTROL_PANEL.md)

> **Honest verdict:** what shipped is a strong, real **v1** — 9 breakdowns, 9 languages, offline,
> voice, safety-gated. But "**never go to a mechanic**" is a much bigger promise. Below is what a
> master mechanic knows is still missing for that promise to be true. Sorted by how badly a
> stranded user feels each gap.

---

## 1. 🔴 The "I can't SEE where that is" gap (biggest real-world failure)
A mechanic **points**: *"that switch, there."* The wizard is **text + voice only**. A first-time
or illiterate user told *"turn the fuel tap to RES"* often **cannot find the fuel tap, the fuse
box, the kill switch, the jacking point, the battery terminals.** This single gap sinks more
self-fixes than any missing scenario.
- ❌ No labelled **photo / diagram per step** ("the reserve switch is here ↓").
- ❌ No **30-second how-to video** (the CEOS DIY-coach promised "video + voice"; only voice shipped).
- ❌ No **per-vehicle visual** (where the fuse box is on an Activa ≠ a Splendor ≠ a Swift).

## 2. 🔴 Breakdown coverage is ~50% of the planned set
The spec listed 10 bike + 10 car scenarios. **Shipped: 5 bike + 4 car.** Missing the ones that
strand people just as often:
- **Bike — not delivered:** stalls/cuts-out while riding · **chain off / jammed / snapped** ·
  all-electrics-dead (fuse/main relay) · clutch cable snapped / **stuck in gear** · **smoke by
  colour** (white=coolant, blue=oil, black=rich) · self-clicks-but-no-crank (solenoid) ·
  **water/dirt in fuel** · throttle/cable stuck · headlight/indicator out.
- **Car — not delivered:** **cranks-but-won't-fire** (fuel pump / filter / immobiliser / spark) ·
  **won't move** (auto shift-lock / parking pawl / handbrake seized / clutch) · **warning-light
  deep-dive** (each light → meaning → drive/stop) · **smoke by colour** · **locked out / key-fob
  battery dead / immobiliser** · **serpentine belt snapped** (battery light + overheat + heavy
  steering together) · wipers/lights die in rain (fuse) · **power-steering loss** · stuck
  accelerator / hard brake pedal (vacuum) · diesel **limp mode / DPF / turbo**.

## 3. 🔴 EV breakdowns — named in scope, ZERO coverage (and a safety hole)
Ola, Ather, Tata EVs are explicitly named, but there is **no EV-specific scenario**:
- ❌ EV **won't power on** · **12 V auxiliary battery dead** (the #1 EV "won't start" — the traction
  battery is fine, the small 12 V is flat) · charging-port stuck · range-zero / thermal cutback ·
  controller/throttle-sensor cutout · regen-only limp.
- ❌ **The critical safety rule is missing:** an EV must be **flat-bed towed, never flat-towed** —
  towing an EV on its drive wheels can **destroy the motor/transmission**. A user following generic
  "tow it" advice could wreck a ₹1–2 lakh drivetrain. This MUST be added.

## 4. 🟠 No hardware/sensor truth — it still only "asks", never "measures"
A real diagnosis on a modern vehicle reads data. The backends exist; the **wizard doesn't use them**:
- ❌ **OBD2 live read** not wired to the UI — no Web-Bluetooth ELM327 pairing, no live coolant/RPM/
  fuel-trim, no freeze-frame, no real DTC pull. (Backend `/obd/snapshot` is ready; the cockpit isn't.)
- ❌ **Sound Doctor** can't actually record + classify a noise (needs the audio model — LLM-blocked).
- ❌ **Dashboard/part/leak photo** auto-detect not built (needs vision — LLM-blocked).
- ❌ No tyre-pressure (TPMS) read, no **battery-voltage** check, no fuel-level cross-check.

## 5. 🟠 Generic, not make/model/year specific
The KB is **one-size** per vehicle type. A master mechanic's advice is model-specific.
- ❌ Steps don't branch on the user's saved **make/model/year** (carb vs FI, kick vs self-only,
  tubeless vs tube, liquid- vs air-cooled, AT vs MT, petrol vs diesel vs EV).
- ❌ No model-specific **part numbers/specs** (which spark plug, fuse rating, tube size, torque).
- ❌ **Triage is shallow** — a ranked list, not the true interactive narrowing tree a mechanic runs
  (ask → answer → re-rank). The spec described triage questions; the wizard skips them.

## 6. 🟠 Roadside reality a mechanic plans for — not handled
- ❌ **"DIY failed — now where?"**: no GPS list of the **nearest open mechanic / petrol pump /
  puncture shop / hospital** with distance (Vaani has the geo substrate; it isn't wired here).
- ❌ No **mobile-mechanic dispatch** ("send someone to me").
- ❌ No **insurance RSA reminder** — most car owners have free roadside assistance they forget.
- ❌ No **out-of-fuel delivery** path.
- ❌ **Night / highway safety drill missing**: hazard-triangle distance, where passengers stand
  (behind the barrier, not on the shoulder), reflective gear — this is how people get killed.
- ❌ No **"limp-home" judgment** per fault ("safe to crawl 10 km to the next town?" vs "stop now").

## 7. 🟡 Trust & validation (CQOS) — content is authored, not proven
- ❌ Fix steps are **not yet reviewed/signed-off by a certified mechanic**, and not validated against
  real breakdown outcomes (the **mechanic-verification loop** has no field data yet).
- ❌ **Accuracy is unmeasured** — no eval run on real cases (diagnostic ≥90% / safety =100% are
  *targets*, not measured numbers; blocked on the live-LLM + dataset run, MECH-4).
- ❌ No explicit **self-repair injury disclaimer** beyond the general one (jacking a car, hot engine,
  fuel — real injury risk; needs a stronger, per-action acknowledgement).
- ❌ No **"did it work?"** feedback wired back from the wizard to learn (the page widget exists; the
  wizard's own outcome capture doesn't).

## 8. 🟡 Known platform blockers (carried from the Control Panel)
- Live Vaani-routed **Swarm Diagnosis** answers + real eval numbers → DeepSeek funding + relevance-rail (Sire).
- **Turso** persistence (Vehicle Twin / Passport survive restart) → `DATABASE_URL` env (Sire).
- Fleet substrate: disability-onboarding modal still defaults to one language; 22-language chrome incomplete (9 done).

---

## Priority order to actually reach "don't go to a mechanic"
1. **Step diagrams/photos per fix** (§1) — the highest-impact single fix; without it, half the steps fail in practice.
2. **EV scenarios + flat-bed-tow safety** (§3) — named scope + a genuine safety hole.
3. **Finish the breakdown set** to 10+10, incl. chain, won't-move, smoke-by-colour, locked-out (§2).
4. **Make/model branching + interactive triage** (§5).
5. **OBD2 live (Web-Bluetooth)** wired to the cockpit (§4).
6. **"DIY failed → nearest help" GPS + RSA + night-safety drill** (§6).
7. **Certified-mechanic review + verification-loop data** (§7).

None of items 1–4 and 6 need Sire or the LLM — they are CTO-buildable now. Items 5/7 partly need
hardware/field data; the live-answer + eval numbers (§8) are Sire-blocked.

---
> **World Class Chitti Mechanic (Chitti Auto OS) — Commando Discipline. Zero Excuses.**
