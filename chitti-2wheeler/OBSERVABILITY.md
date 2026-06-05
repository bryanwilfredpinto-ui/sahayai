🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# OBSERVABILITY — COSDF L10 · Metrics + Per-Diagnosis Event Log

**COSDF Level 10 ([../CHITTI_MECHANIC_COSDF.md](../CHITTI_MECHANIC_COSDF.md) §L10) applied to Chitti
Bike Doctor.** This file is the **index + contract** for what we measure, the per-diagnosis JSON event,
and the privacy rules over both. Detail docs in [observability/](observability/) own the specifics —
this file does not duplicate them.

> What we measure — and what we pointedly **don't**. A rider who fixes the bike and leaves fast is a
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
| **Diagnosis** — requests, accuracy-by-symptom, confidence distribution, user-correction-rate, mechanic-disagreement | ✅ diagnosis accuracy ≥90%, confidence band present, mechanic-confirmation ≥85% | [metrics.md](observability/metrics.md) · [mechanic_verification_loop.md](observability/mechanic_verification_loop.md) |
| **Safety** — blocked unsafe attempts, emergency-trigger, false-emergency | ✅ unsafe-DIY blocks, safety false-negative **= 0**, action-confirm audit (Golden Rule) | [logs.md](observability/logs.md) · [metrics.md](observability/metrics.md) |
| **Accessibility** — mode usage, blind/deaf/illiterate success | ✅ accessibility-pass 100% (release blocker) | [metrics.md](observability/metrics.md) · [ACCESSIBILITY.md](ACCESSIBILITY.md) |
| **Business** — retention-by-persona, DIY-success, escalation, used-inspections | ✅ ₹ saved/rider (North Star), DIY success ≥90%; retention/used-inspection = **roadmap** | [metrics.md](observability/metrics.md) |
| **Quality** — hallucination flags, low-confidence outputs, 👎 rate, repair-follow-up | ✅ hallucination flag, low-confidence inspection, per-box 👎, verification follow-up | [feedback.md](observability/feedback.md) · [logs.md](observability/logs.md) |

## The per-diagnosis JSON event (COSDF L10)
Every diagnosis logs **one anonymised event**. COSDF L10 names the fields; ours maps them onto the
existing [logs.md](observability/logs.md) event family — **no PII, no plate, no GPS, free-text scrubbed**:

```json
{
  "audit_id": "uuid",
  "timestamp": "2026-06-05T08:14:03Z",
  "persona": "P2_student_2w",
  "vehicle": { "make_model_band": "Activa-class scooter", "year_band": "2018-2020", "odo_band": "20-30k" },
  "input_type": "symptom | photo | sound | dashboard | obd2",
  "symptom_tags": ["slow_crank", "dim_light"],
  "diagnosis": "battery",
  "confidence": { "label": "high", "vote": { "battery": 0.85, "starter": 0.10, "fuel": 0.05 } },
  "safety_check": { "tier": "yellow", "red_lines": [], "ride_decision": "ride_gently" },
  "diy_tier": { "tier": "green", "capped_by_safety": false },
  "cost_band": { "item": "battery", "parts": [1300, 2700], "parts_labour": [1500, 2900] },
  "output_mode": "voice_first | visual_first | icon_first | haptic",
  "feedback": { "thumb": null, "verified_actual": null },
  "latency_ms": 1840,
  "model": "deepseek",
  "lang": "hi"
}
```

- **Mapping:** this single event decomposes into the existing log families in
  [observability/logs.md](observability/logs.md) — `diagnosis_request` · `swarm_vote` · `safety_verdict`
  · `diy_tier` · `cost_band` · `outcome` (from the verification loop). One row per diagnosis, joinable by
  `audit_id` to the Turso quality audit (CTO/admin only — never shown to riders, per
  [chitti-cto/CTO.md §3-4](../chitti-cto/CTO.md)).
- **`feedback.verified_actual`** is filled later by the
  [verification loop](observability/mechanic_verification_loop.md) — the predicted-vs-actual ground
  truth that turns Chitti from a guesser into a learner.

## Privacy of observability (LOCKED — §2b)
- No images stored server-side; camera scans follow Camera Intelligence §2b (community-anonymised,
  user-owned, "Chitti forget" wipes).
- No raw identity, no plate, no GPS in any aggregate. Free-text scrubbed of PII before it leaves device.
- **Explicitly NOT tracked:** time-in-app, session count, "engagement." Their absence is intentional
  (Founder Rule, [metrics.md §Explicitly NOT tracked](observability/metrics.md)).
- All LLM observability rides DeepSeek via `chitti-vaani-api` `wrap_llm` + request timing → Turso
  aggregates over the direct-HTTPS shim. Layer-5 fallback events are **surfaced, never silent**
  ([logs.md failure-mode catalogue](observability/logs.md)).

## Trust signals shown ON the page (§6 part 7)
Risk badge · CO₂/reply · last audit · "riders helped today" — via the feedback-widget trust strip.
A confidence chip rides every diagnosis (`Chitti.a11y.renderConfidence`). The CTO/admin quality +
observability overlays ([CTO.md §3-4](../chitti-cto/CTO.md)) are **hidden from riders** by DOM gate.

## Status
🟡 **YELLOW** — metric registry + per-diagnosis event contract authored; log plumbing rides
`chitti-vaani-api` observability. Accuracy / safety / accessibility figures are **targets pending the
eval run** (MECH-4, Sire-gated, [EVALS.md](EVALS.md)) — no grade is printed before it is measured.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
