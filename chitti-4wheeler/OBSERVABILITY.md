🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# OBSERVABILITY — COSDF L10 · Metrics + Per-Diagnosis Event Log

**COSDF Level 10 ([../CHITTI_MECHANIC_COSDF.md](../CHITTI_MECHANIC_COSDF.md) §L10) applied to Chitti
Car Doctor.** This file is the **index + contract** for what we measure, the per-diagnosis JSON event,
and the privacy rules over both. Detail docs in [observability/](observability/) own the specifics —
this file does not duplicate them.

> What we measure — and what we pointedly **don't**. A driver who fixes the car and leaves fast is a
> **success**, not a churn event. Every metric is anonymised, on-device-first, and tombstoned on
> "Chitti forget" ([SAHAYAI_MASTER.md §2b](../SAHAYAI_MASTER.md)). Numbers below are **targets** until
> measured by the eval run (MECH-4, Sire-gated) — we never print an unmeasured metric as achieved.

## The observability surfaces (index — detail in `observability/`)

| Surface | What it owns | Detail doc |
|---|---|---|
| **Metrics** | North Star, Tier-1 metrics, counter-metrics, what we refuse to track | [observability/metrics.md](observability/metrics.md) |
| **Logs & failure modes** | the anonymised event log + the failure-mode catalogue | [observability/logs.md](observability/logs.md) |
| **Feedback** | the per-response widget, most-watched signals, the learning loop | [observability/feedback.md](observability/feedback.md) |
| **Mechanic Verification Loop** | predicted-vs-actual ground truth — *the* secret weapon | [observability/mechanic_verification_loop.md](observability/mechanic_verification_loop.md) |
| **Machine-readable metrics** | the COSDF L10 metric registry (targets + thresholds) | [observability/metrics.yaml](observability/metrics.yaml) |

## COSDF L10 metric families (mapped to our docs)

| COSDF family | Tracked here | Owner doc |
|---|---|---|
| **Diagnosis** — requests, accuracy-by-symptom, confidence distribution, user-correction-rate, mechanic-disagreement | ✅ diagnosis accuracy ≥90%, DTC interpretation ≥90%, confidence band present, mechanic-confirmation ≥85% | [metrics.md](observability/metrics.md) · [mechanic_verification_loop.md](observability/mechanic_verification_loop.md) |
| **Safety** — blocked unsafe attempts, emergency-trigger, false-emergency | ✅ unsafe-DIY blocks, safety false-negative **= 0**, action-confirm audit (Golden Rule), "overheat → keep driving" never | [logs.md](observability/logs.md) · [metrics.md](observability/metrics.md) |
| **Accessibility** — mode usage, blind/deaf/illiterate success | ✅ accessibility-pass 100% (release blocker) | [metrics.md](observability/metrics.md) · [ACCESSIBILITY.md](ACCESSIBILITY.md) |
| **Business** — retention-by-persona, DIY-success, escalation, used-inspections | ✅ ₹ saved/driver (North Star), DIY success ≥90%; retention/used-inspection = **roadmap** | [metrics.md](observability/metrics.md) |
| **Quality** — hallucination flags, low-confidence outputs, 👎 rate, repair-follow-up | ✅ hallucination flag, low-confidence inspection, per-box 👎, verification follow-up, scam-shield defamation flag | [feedback.md](observability/feedback.md) · [logs.md](observability/logs.md) |

## The per-diagnosis JSON event (COSDF L10)
Every diagnosis logs **one anonymised event**. COSDF L10 names the fields; ours maps them onto the
existing [logs.md](observability/logs.md) event family — **no PII, no plate, no GPS, free-text scrubbed**:

```json
{
  "audit_id": "uuid",
  "timestamp": "2026-06-05T08:14:03Z",
  "persona": "P3_professional_driver_car",
  "vehicle": { "make_model_band": "Creta-class SUV", "year_band": "2020-2022", "fuel": "diesel", "odo_band": "40-60k" },
  "input_type": "symptom | photo | sound | dashboard | obd2",
  "symptom_tags": ["battery_light_while_driving", "dim_at_idle"],
  "dtc_code": null,
  "diagnosis": "alternator",
  "confidence": { "label": "high", "vote": { "alternator": 0.85, "battery": 0.10, "wiring": 0.05 } },
  "safety_check": { "tier": "orange", "red_lines": [], "drive_decision": "drive_gently_mechanic_soon" },
  "diy_tier": { "tier": "yellow", "capped_by_safety": false },
  "cost_band": { "item": "alternator", "parts": [6500, 12000], "parts_labour": [8000, 14000] },
  "output_mode": "voice_first | visual_first | icon_first | haptic",
  "feedback": { "thumb": null, "verified_actual": null },
  "latency_ms": 1980,
  "model": "deepseek",
  "lang": "hi"
}
```

- **Mapping:** this single event decomposes into the existing log families in
  [observability/logs.md](observability/logs.md) — `diagnosis_request` · `dtc_lookup` · `swarm_vote` ·
  `safety_verdict` · `diy_tier` · `cost_band` · `outcome` (from the verification loop). One row per
  diagnosis, joinable by `audit_id` to the Turso quality audit (CTO/admin only — never shown to drivers,
  per [chitti-cto/CTO.md §3-4](../chitti-cto/CTO.md)).
- **`feedback.verified_actual`** is filled later by the
  [verification loop](observability/mechanic_verification_loop.md) — the predicted-vs-actual ground
  truth that turns Chitti from a guesser into a learner.

## North Star
**Rupees saved per driver** — money kept in the driver's pocket through correct diagnoses, fair-price
checks, and safe DIY (vs being over-charged or sold a fault they didn't have). One avoided ₹35k AC
compressor swap is a month's salary saved ([metrics.md §North Star](observability/metrics.md)).

## Privacy of observability (LOCKED — §2b)
- No images stored server-side; camera scans (dashboard / fake-part / document) follow Camera
  Intelligence §2b (community-anonymised, user-owned, "Chitti forget" wipes).
- No raw identity, no plate, no GPS in any aggregate. Free-text scrubbed of PII before it leaves device.
- **Explicitly NOT tracked:** time-in-app, session count, "engagement." Their absence is intentional
  (Founder Rule, [metrics.md §Explicitly NOT tracked](observability/metrics.md)).
- All LLM observability rides DeepSeek via `chitti-vaani-api` `wrap_llm` + request timing → Turso
  aggregates over the direct-HTTPS shim. Endpoints live under `/api/4w/`
  ([backend/routes/wheels.py](backend/routes/wheels.py)). Layer-5 fallback events are **surfaced, never
  silent** ([logs.md failure-mode catalogue](observability/logs.md)).

## Trust signals shown ON the page (§6 part 7)
Risk badge · CO₂/reply · last audit · "drivers helped today" — via the feedback-widget trust strip.
A confidence chip rides every diagnosis (`Chitti.a11y.renderConfidence`). The CTO/admin quality +
observability overlays ([CTO.md §3-4](../chitti-cto/CTO.md)) are **hidden from drivers** by DOM gate.

## Status
🟡 **YELLOW** — metric registry + per-diagnosis event contract authored; log plumbing rides
`chitti-vaani-api` observability. Accuracy / DTC / safety / accessibility figures are **targets pending
the eval run** (MECH-4, Sire-gated, [EVALS.md](EVALS.md)) — no grade is printed before it is measured.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
