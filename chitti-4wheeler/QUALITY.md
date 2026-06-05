🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# QUALITY.md — Chitti Car Doctor (COSDF Level 13)

**The 10 quality gates. No feature of Chitti Car Doctor ships until ALL 10 pass.**
This is [COSDF Level 13](../CHITTI_MECHANIC_COSDF.md) applied to the 4-wheeler product, and
it is **mapped onto the platform's two existing gate systems** — the [8 CTO gates](../chitti-cto/SOP.md)
and the [5 frontend gates](../QUALITY_STATUS.md) — so there is one quality bar, not three.

> A gate is **PASS** only with proof — curl output, a 375px screenshot, an eval number, or a
> swarm log. "Looks done" is not done. A diagnosis product that is wrong, unsafe, or unusable
> by a blind/illiterate driver is a defect even if the code runs. ([SOP.md](../chitti-cto/SOP.md): "No GREEN without proof.")

---

## The mapping at a glance

| COSDF L13 gate | Maps onto CTO gate(s) ([SOP.md](../chitti-cto/SOP.md)) | Maps onto frontend gate(s) ([QUALITY_STATUS.md §1a](../QUALITY_STATUS.md)) |
|---|---|---|
| 1 Functional | CTO 1, 2, 4, 5 | — |
| 2 Safety | CTO 1 (+ this product's [GUARDRAILS.md](./GUARDRAILS.md)) | — |
| 3 Accessibility | CTO 7 | **G1–G5 (all five)** |
| 4 Accuracy | CTO 1 | — |
| 5 Swarm review | CTO 1 | — |
| 6 Observability | CTO 4, 8 | — |
| 7 Privacy | CTO 1 (locks) | — |
| 8 Evals | CTO 1, 5 | — |
| 9 Documentation | CTO 8 | — |
| 10 Founder review | CTO 6, 7, 8 | UI/badge gates |

> The 8 CTO gates (code+test → integration → deploy → /health 200 → curl proof → 375px
> visual cert → 5 UI elements → daily report) are the **delivery** spine. The 5 frontend
> gates (G1 feedback-widget · G2 chitti_a11y.js · G3 disability-profile prompt · G4
> language auto-detect · G5 ISL plugin) are the **accessibility** spine. COSDF L13 wraps
> both and adds the diagnosis-specific gates (Safety, Accuracy, Swarm, Evals) a car-doctor
> needs above a generic app.

---

## Gate 1 — Functional
**Works, no critical bugs, edge cases handled, latency budget met.**
- The diagnosis flow (symptom → swarm → answer) runs end-to-end; OBD2 code path, no-OBD Q&A path, scam-quote-check path, DIY-coach path all return a structured answer.
- Edge cases: empty input, unknown make/model, contradictory symptoms, off-topic query → graceful, honest fallback (never a crash, never a fake answer).
- Latency target **< 3 s** per [COSDF L13](../CHITTI_MECHANIC_COSDF.md) (p95 < 5 s — [CERTIFICATION.md](./CERTIFICATION.md)).
- **CTO map:** Gate 1 (code+unit test 80%), Gate 2 (integration), Gate 4 (/health 200), Gate 5 (curl proof on live Vaani-routed answer).
- **Proof:** `/health` 200 + curl of a live diagnosis answer. *Live-answer curl is blocked on §G#1 (Vaani allowlist + DeepSeek) → [CERTIFICATION.md](./CERTIFICATION.md) MECH-4.*

## Gate 2 — Safety
**No unsafe action is possible; the emergency path works; warnings are prominent; the veto is tested.**
- Every P0 NEVER in [GUARDRAILS.md](./GUARDRAILS.md) is unreachable through any path (brakes-in-motion, airbag bypass, fuel work, hot radiator cap, jack-without-stands, **EV/HV DIY**, **flashing-CEL ignore**, auto-dial cops).
- 🔴 DO-NOT-DRIVE warnings render prominently (icon + word + voice, never colour-only).
- The [family-cascade emergency protocol](./guardrails/emergency-protocol.md) runs and **never** auto-dials 100/108/112.
- The [Safety Agent](./swarm/safety-agent.md) veto is exercised by red-team cases.
- **CTO map:** Gate 1 (the locks). **This is the highest gate — a Safety fail is an automatic RED in [CERTIFICATION.md](./CERTIFICATION.md), no override.**
- **Proof:** [evals/safety_eval.md](./evals/safety_eval.md) red-team run = **0 unsafe** (number pending MECH-4).

## Gate 3 — Accessibility
**Blind / deaf / mute / illiterate paths all work, in the required languages. This gate IS the 5 frontend gates.**

| Frontend gate | What must be true on the car-doctor surface |
|---|---|
| **G1** — feedback-widget + `data-chitti-response` | Every diagnosis card carries `data-chitti-response="<box-id>"`; widget attaches 🔊 / 🤖 / 👍 / 👎 + per-box feedback. |
| **G2** — `chitti_a11y.js` loaded | Substrate active: language selector, Voice-Required marker, Braille mode, Read-page, `window.Chitti.a11y.*`. |
| **G3** — Disability Profile prompt | First visit fires the multi-select (blind/deaf/mute/ISL/illiterate/elderly/limited-mobility/cognitive); saved locally, synced across Chittis. |
| **G4** — Language auto-detect | `<html lang>` + `window.Chitti.a11y.lang.current` set from profile or `navigator.language`; Voice Factory picks the right voice. |
| **G5** — ISL plugin active | `window.Chitti.isl` defined; ISL panel + tap-word-to-sign render next to every response. |

- Per-persona ([accessibility/](./accessibility/), [COSDF L12](../CHITTI_MECHANIC_COSDF.md)): blind = voice-only diagnosis + haptic confirm; deaf = visual+text+ISL; mute = presets + readback; illiterate = icon + voice, no reading required.
- Languages: **9 primary live** (en, hi, ta, te, bn, mr, gu, kn, ml), tested in **Hindi + Tamil + Bengali** minimum per [CTO.md](../chitti-cto/CTO.md); 26-voice substrate for voice-out.
- **CTO map:** Gate 7 (5 UI elements verified). **Frontend map:** G1–G5.
- **Proof:** 375px screenshot + [tools/cert_mechanic.mjs](../tools/cert_mechanic.mjs) 5-gate run (the page is GREEN on the [§1b matrix](../QUALITY_STATUS.md)).

## Gate 4 — Accuracy
**Evals above threshold; no hallucination on the test set; confidence is calibrated.**
- Diagnostic accuracy targets ([SUCCESS_METRICS.md](./SUCCESS_METRICS.md)): engine > 90%, electrical > 85%, **brakes > 95%**, sound > 85%, dashboard-code 100% (database), cost ± 10%.
- Every verdict carries a calibrated likelihood word + confidence band ([never-claim-certainty.md](./guardrails/never-claim-certainty.md)); no bare "definitely" on thin evidence.
- **CTO map:** Gate 1. **Proof:** [evals/diagnostic_accuracy.md](./evals/diagnostic_accuracy.md) + [evals/hallucination_eval.md](./evals/hallucination_eval.md) (numbers pending MECH-4).

## Gate 5 — Swarm review
**All agents ran, no veto stands, consensus reached, Safety gave final approval.**
- The [8-agent pipeline](./swarm/) ran: symptom → engine → electrical → fuel → cost → diy → trust → **safety (final, can veto anyone)**.
- Final confidence = `min(swarm, trust_cap)` ([trust-agent.md](./swarm/trust-agent.md) can only lower).
- **CTO map:** Gate 1. **Proof:** swarm log shows all agents fired + no open veto.

## Gate 6 — Observability
**Every diagnosis logs a structured, anonymised event; metrics are tracked.**
- JSON event per diagnosis (timestamp, persona, vehicle, input_type, symptom, diagnosis, confidence, safety_check, output_mode, feedback, latency_ms) — anonymised per [SAHAYAI_MASTER.md §2b/§2f](../SAHAYAI_MASTER.md).
- Metrics tracked per [observability/](./observability/): accuracy-by-symptom, blocked-unsafe-attempts, emergency-trigger / false-emergency, blind/deaf/illiterate success, 👎 rate, hallucination flags.
- **CTO map:** Gate 4 (/health), Gate 8 (reporting). **Proof:** [observability/metrics.md](./observability/metrics.md) + [observability/logs.md](./observability/logs.md) + [mechanic_verification_loop.md](./observability/mechanic_verification_loop.md).

## Gate 7 — Privacy
**No needless PII; consent for location; deletion works; offline data encrypted.**
- Location/GPS only on the consented emergency path ([emergency-protocol.md](./guardrails/emergency-protocol.md)).
- The [Digital Vehicle Twin](./memory/) is on-device, user-owned; "Chitti forget" wipes it ([SAHAYAI_MASTER.md §2b](../SAHAYAI_MASTER.md)).
- Camera/audio intelligence captures are anonymised, never sold ([SAHAYAI_MASTER.md §2b](../SAHAYAI_MASTER.md)).
- **CTO map:** Gate 1 (locks). **Proof:** schema review of [memory/](./memory/) — no PII beyond what the user enters; deletion path exercised.

## Gate 8 — Evals
**Gold set updated, regression run, no accuracy decrease vs the last release.**
- Gold dataset per [COSDF L11](../CHITTI_MECHANIC_COSDF.md) (4-wheeler share: engine-4w 1000, electrical 800, brakes 600, tyres/susp 500, trans 400, exhaust 300, audio, accessibility, cost).
- Cadence: diagnosis weekly · safety red-team real-time · accessibility monthly · hallucination weekly · sound bi-weekly · cost monthly.
- Human-in-the-loop: confidence < 70% → flag → mechanic/user correction → back into the gold set ([evals/README.md](./evals/README.md)).
- **CTO map:** Gate 1, Gate 5. **Proof:** [evals/](./evals/) regression run, no metric below its [SUCCESS_METRICS.md](./SUCCESS_METRICS.md) threshold (pending MECH-4).

## Gate 9 — Documentation
**The artifact chain is complete, consistent, and self-linking.**
- The COSDF chain exists and cross-links: [ROLE.md](./ROLE.md) · [PRODUCT_VISION.md](./PRODUCT_VISION.md) · [PERSONAS.md](./PERSONAS.md) · [PRD.md](./PRD.md) · [SUCCESS_METRICS.md](./SUCCESS_METRICS.md) · [skills/](./skills/) · [swarm/](./swarm/) · [sop/](./sop/) · [GUARDRAILS.md](./GUARDRAILS.md) · [memory/](./memory/) · [observability/](./observability/) · [evals/](./evals/) · QUALITY.md · [CERTIFICATION.md](./CERTIFICATION.md).
- Every `.md` carries the World Class Commando identity line (top + closing blockquote); no doc contradicts another ([CTO.md](../chitti-cto/CTO.md) rule 3).
- **CTO map:** Gate 8. **Proof:** link-check passes; identity-line grep passes on every file.

## Gate 10 — Founder review
**Mission alignment + the Trust principle + Sire's sign-off.**
- Does it serve the mission ([PRODUCT_VISION.md](./PRODUCT_VISION.md)): safe diagnosis for farmers, drivers, seniors, blind/deaf/mute/illiterate, fleet, used-buyers?
- Does it honour **Trust over everything** and the locks (DeepSeek-only, Vaani-sole-surface, family-cascade, No-Hinglish)?
- World Class badge visible; 375px mobile; 2G-compatible; the illiterate-villager test passes.
- **CTO map:** Gate 6 (visual cert), Gate 7 (UI elements), Gate 8 (report). **Proof:** Sire sign-off recorded in [CERTIFICATION.md](./CERTIFICATION.md) (blocked on the live-answer unlock §G#1 / MECH-4).

---

## Status snapshot (2026-06-05)

| Gate | State | Blocker |
|---|---|---|
| 1 Functional | 🟡 renders + honest fallback; **live-answer curl** pending | §G#1 (Vaani allowlist + DeepSeek) → MECH-4 |
| 2 Safety | 🟡 guardrails authored + wired; **red-team number** pending | eval run MECH-4 |
| 3 Accessibility | 🟢 5 frontend gates pass on `chitti_4wheeler.html` ([§1b](../QUALITY_STATUS.md)) | — |
| 4 Accuracy | 🟡 targets set; **measured numbers** pending | eval run MECH-4 |
| 5 Swarm review | 🟢 8-agent pipeline + Safety veto defined | live wiring proof at MECH-4 |
| 6 Observability | 🟡 schema + metrics defined; **live events** pending | live answers |
| 7 Privacy | 🟢 on-device Twin + consent + deletion locked | — |
| 8 Evals | 🟡 gold-set design done; **run** pending | MECH-4 |
| 9 Documentation | 🟢 artifact chain complete + self-linking | — |
| 10 Founder review | 🚧 blocked on the live-answer unlock | §G#1 / Sire |

> **All quality work a CTO can deliver without Sire is done.** The remaining 🟡/🚧 gates
> all converge on a single unlock — §G#1 (Vaani allowlist + DeepSeek funding) — which turns
> "renders + honest fallback" into "live answers + real eval numbers," closing Gates 1, 2, 4,
> 6, 8, and 10. We do **not** print a gate GREEN on an unmeasured number. See [CERTIFICATION.md](./CERTIFICATION.md).

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
