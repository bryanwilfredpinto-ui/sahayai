🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# QUALITY — Chitti Bike Doctor (COSDF Level 13)

> **No feature ships until ALL 10 gates pass.** This is the COSDF L13 quality-gate
> checklist ([../CHITTI_MECHANIC_COSDF.md](../CHITTI_MECHANIC_COSDF.md) §LEVEL 13)
> bound to the 2-wheeler product, and mapped explicitly onto the platform's two
> existing gate systems so there is **one combined gate, not three competing ones**:
> - the **8 CTO gates** — [../chitti-cto/SOP.md](../chitti-cto/SOP.md) "QUALITY GATE — Nothing Ships Without This"
> - the **5 frontend gates** — [../QUALITY_STATUS.md](../QUALITY_STATUS.md) §1a (feedback-widget + `data-chitti-response` · chitti_a11y.js · Disability-Profile prompt · language auto-detect · ISL plugin)
>
> A feature is **GREEN** only when every COSDF gate passes **and** its mapped CTO +
> frontend gates pass. Any single failure = 🔴 RED — fix before moving on. We never
> print a number we have not measured (eval-backed gates stay `pending MECH-4` until
> the [Sire-gated eval run](../CHITTI_MECHANIC_CONTROL_PANEL.md) lands).

---

## The 10 COSDF L13 gates → platform-gate mapping

| # | COSDF L13 Gate | What it checks (2-wheeler) | Maps onto CTO gate(s) | Maps onto frontend gate(s) |
|---|---|---|---|---|
| 1 | **Functional** | Works end-to-end, no critical bugs, edge cases handled, **< 3 s** median latency | CTO G1 (code + unit tested 80%) · G2 (integration) · G3 (deployed) · G4 (/health 200) · G5 (live curl) | — |
| 2 | **Safety** | No unsafe action possible; emergency path reachable; 🔴 warnings shown first; **Safety-Agent veto tested** | CTO G1/G2 (the veto path is unit + integration tested) | — |
| 3 | **Accessibility** | Blind / deaf / mute / illiterate paths complete; required languages present | CTO G6 (375px screenshot) · G7 (all 5 UI elements) | **ALL 5**: feedback-widget · chitti_a11y.js · Disability-Profile · language auto-detect · ISL panel |
| 4 | **Accuracy** | Evals **≥ 90%** diagnostic; no hallucination on the test set; **calibrated confidence bands** | — (eval-backed, not a deploy gate) | — |
| 5 | **Swarm review** | All 8 agents ran; no veto outstanding; consensus reached; **Safety Agent gave final approval** | CTO G2 (integration of the swarm pipeline) | — |
| 6 | **Observability** | Every diagnosis logs the JSON event ([observability/metrics.md](observability/metrics.md)); accuracy-by-symptom + 👎-rate dashboards live | CTO G8 (daily report updated) | feedback-widget 👍👎 wired into the dashboard |
| 7 | **Privacy** | No needless PII; consent for location/photo; "Chitti forget" deletion works; offline data encrypted | — (verified in code review + memory schema) | Disability-Profile stored locally, never synced |
| 8 | **Evals** | Gold set updated; regression run; **no accuracy regression** vs last release | — (eval-backed, MECH-4) | — |
| 9 | **Documentation** | ROLE / VISION / PERSONAS / PRD / SKILLS / SOP / GUARDRAILS / this file current; World-Class header on every `.md` | CTO G8 (docs current) | — |
| 10 | **Founder review** | Mission + the **Trust** North Star honoured; Sire sign-off before GREEN | CTO G8 + the CTO non-negotiable "never GREEN without verification" | — |

> **Coverage check:** CTO gates G1–G8 all map (G1–G5 → Functional/Safety/Swarm;
> G6–G7 → Accessibility; G8 → Observability/Documentation/Founder). All 5 frontend
> gates map onto COSDF gate 3 (Accessibility). COSDF gates 4 & 8 (Accuracy, Evals)
> have **no deploy-time CTO equivalent** — they are the eval-harness gates that the
> platform's 8+5 did not previously cover, and they stay `pending MECH-4`.

---

## Gate-by-gate detail (the bar each must clear)

### Gate 1 — Functional
- Every PRD feature ([PRD.md](PRD.md) F0–F12) that is marked **LIVE** works on a real
  device; every **roadmap / COMING SOON** item renders an honest stub, never a fake
  result (§3 honest-stubs).
- Median response time **< 3 s**; p95 **< 5 s** (CERTIFICATION latency row).
- Edge cases: empty input, unknown bike model, contradictory symptoms, offline mode,
  2G bandwidth — each returns a graceful, honest answer (Low-confidence + clarifying
  question, never a crash or a confident guess).
- **CTO proof required:** G3 deploy + G4 `/health` 200 + G5 live-URL curl output.

### Gate 2 — Safety
- The [Safety Agent](swarm/safety-agent.md) **can veto any output and is never
  overruled** — this veto path is unit-tested and integration-tested.
- Every 🔴 DO-NOT-RIDE red line ([guardrails/safety-rules.md](guardrails/safety-rules.md))
  is in the regression set; the two COSDF-named P0s — **EV/HV thermal event** and
  **flashing CEL/MIL** — each have a dedicated test ([GUARDRAILS.md](GUARDRAILS.md) P0-8, P0-9).
- Emergency path is reachable and is **family-cascade only — never auto-dials
  100/108/112** ([guardrails/emergency-protocol.md](guardrails/emergency-protocol.md)).
- Safety warnings render **first**, before the cheap/likely diagnosis.

### Gate 3 — Accessibility (the full 5-frontend-gate block lives here)
A page is accessibility-GREEN only when **all five** frontend gates pass, verified by
CTO visual cert at **375px** with a saved screenshot, plus the two CTO UI gates:

| Frontend gate | What is verified | Source |
|---|---|---|
| feedback-widget.js + `data-chitti-response` | Every AI-response box carries 🔊 / 🤖 / 👍👎 / ✏️+🎙️ tagged to a box ID | [../QUALITY_STATUS.md §1a](../QUALITY_STATUS.md) |
| chitti_a11y.js | Language selector, Voice-Required marker, Braille toggle, aria-live region injected | [project memory: a11y substrate](../SAHAYAI_MASTER.md) |
| User Disability Profile prompt | One-time multi-select on first visit; saved locally; never re-asked | §7 accessibility contract |
| Language auto-detect | Active language detected + honoured; **9 primary live** + 26-voice substrate | [../chitti-cto/CTO.md §5](../chitti-cto/CTO.md) |
| ISL plugin | ISL panel present on **every** response (Phase-1 honest placeholder animation) | [project memory: ISL spec](../SAHAYAI_MASTER.md) |

- CTO G6 (375px screenshot saved to `tools/cert_screenshots/`) + G7 (all 5 UI
  elements verified) are part of this gate.
- Modality matrix ([accessibility/blind_user.md](accessibility/blind_user.md),
  [deaf_user.md](accessibility/deaf_user.md), [mute_user.md](accessibility/mute_user.md),
  [illiterate_user.md](accessibility/illiterate_user.md)) — each user's **core flow
  completes with no sighted / audio / reading dependency.**
- *Substrate-presence is cert-checkable today; the >99% four-user success **rate**
  needs the COSDF L12 user panel (5 blind + 5 deaf + 5 illiterate × 20 tasks) and
  stays `pending` until the panel runs.*

### Gate 4 — Accuracy (eval-backed; `pending MECH-4`)
- Diagnostic accuracy **≥ 90%** ([evals/diagnostic_accuracy.md](evals/diagnostic_accuracy.md)).
- Brake diagnosis **≥ 95%** ([evals/safety_eval.md](evals/safety_eval.md)).
- Hallucination **< 1%** on the test set ([evals/hallucination_eval.md](evals/hallucination_eval.md)).
- Confidence bands **calibrated** — a "High confidence" answer is right ≥ 90% of the
  time, a "Medium" answer's stated range holds.
- **Measured:** `___ pending eval run MECH-4` (Sire-gated). No GREEN on this gate
  until the live-LLM eval runs; printing a number here before that is a §3 violation.

### Gate 5 — Swarm review
- The full 8-agent pipeline ran ([swarm/README.md](swarm/README.md)): Symptom →
  Engine → Electrical → Fuel → **Safety (veto)** → Cost → DIY → Trust → QA.
- No veto is outstanding; consensus reached; the **Safety Agent's final approval** is
  logged on the response (joinable to the audit ID).

### Gate 6 — Observability
- Every diagnosis writes the JSON event (timestamp, persona, vehicle, input_type,
  symptom, diagnosis, confidence, safety_check, output_mode, feedback, latency_ms),
  anonymised per [§2b/§2f](../SAHAYAI_MASTER.md) ([observability/logs.md](observability/logs.md)).
- Dashboards live for accuracy-by-symptom, confidence distribution, 👎 rate, and the
  [mechanic-verification loop](observability/mechanic_verification_loop.md).

### Gate 7 — Privacy
- No needless PII collected; **photos + audio never leave the device** — only the
  text description and anonymised outcome are aggregated ([memory/](memory/)).
- Consent gates location-share and camera; "Chitti forget" tombstones every row;
  GPS rounded to pincode; offline data encrypted at rest.

### Gate 8 — Evals (eval-backed; `pending MECH-4`)
- Gold set updated with any new confirmed pattern from the mechanic-verification loop.
- Full regression run; **no accuracy regression** vs the previous release.
- **Measured:** `___ pending eval run MECH-4`.

### Gate 9 — Documentation
- ROLE · PRODUCT_VISION · PERSONAS · PRD · SKILLS · SOP · ARCHITECTURE ·
  SUCCESS_METRICS · GUARDRAILS · this QUALITY.md · CERTIFICATION.md all current and
  non-contradicting.
- Every `.md` opens and closes with the World-Class line (CTO non-negotiable #8).

### Gate 10 — Founder review
- The **Trust** North Star ([SUCCESS_METRICS.md](SUCCESS_METRICS.md): "rupees the
  rider kept") is honoured — the feature does not push a workshop routing when a safe
  DIY / no-action answer existed.
- Sire sign-off recorded before any GREEN grade is printed (CTO non-negotiable #2).

---

## Pass / fail ledger (filled at cert time, not now)

| Gate | Status | Proof | Notes |
|---|---|---|---|
| 1 Functional | ⬜ pending | curl + `/health` | — |
| 2 Safety | ⬜ pending | veto-path test log + regression run | EV/HV + flashing-CEL tests must pass |
| 3 Accessibility | ⬜ pending | 375px screenshot + 5-gate check | substrate cert today; >99% rate needs panel |
| 4 Accuracy | ⬜ pending | `___ pending MECH-4` | eval-backed |
| 5 Swarm review | ⬜ pending | safety-approval log | — |
| 6 Observability | ⬜ pending | JSON-event sample + dashboard | — |
| 7 Privacy | ⬜ pending | code review + memory schema | — |
| 8 Evals | ⬜ pending | `___ pending MECH-4` | no regression |
| 9 Documentation | ⬜ pending | doc audit | header on every `.md` |
| 10 Founder review | ⬜ pending | Sire sign-off | — |

**Status: NOT YET CERTIFIED.** No GREEN may be claimed until this ledger is filled
with proof and the [CERTIFICATION.md](CERTIFICATION.md) scorecard grades GREEN.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
