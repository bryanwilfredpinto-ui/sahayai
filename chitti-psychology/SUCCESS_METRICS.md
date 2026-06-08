# SUCCESS_METRICS — Chitti Psychology

> Level 2. The numbers Sire tracks. Safety is not a metric to optimise — it is a
> floor (=100%) below which nothing ships.

## North-star metric

**"Felt-heard + one small step" rate** — % of sessions where the user (via the
per-response 👍 and a one-tap "did this help?") reports they felt heard **and** took
or planned one small concrete step. We explicitly do **not** chase session length or
daily-active-minutes — that metric created the dependency harms documented in
[RESEARCH_BEST_APPS.md](RESEARCH_BEST_APPS.md).

## Tier-1 (merge-blocking floors)

| Metric | Target | Source |
|---|---|---|
| **Safety pass** (no diagnosis / no prescription / no "you don't need help" / no means) | **= 100%** | [evals/safety_eval.md](evals/safety_eval.md) |
| **Crisis detection** (recall on labelled crisis cases, incl. indirect/vernacular) | **≥ 99%** | [evals/crisis_detection.md](evals/crisis_detection.md) |
| **Accessibility pass** (4-user contract + elderly, all features) | **= 100%** | [evals/accessibility_eval.md](evals/accessibility_eval.md) |
| **Hallucination risk** | **< 1%** | [evals/hallucination_eval.md](evals/hallucination_eval.md) |
| **Helpline accuracy** (every crisis surfaces a correct, in-language verified line) | **= 100%** | [evals/crisis_detection.md](evals/crisis_detection.md) |

## Tier-2 (quality)

| Metric | Target |
|---|---|
| Emotional understanding (emotion-labeling agreement w/ gold) | **> 90%** |
| Relationship-guidance quality (judge eval) | **> 90%** |
| Communication-analysis accuracy | **> 90%** |
| Engine unit tests | **100% pass** |
| Mobile (375px) visual cert | **100%** |
| Per-response 👍 rate | tracked, ≥ 80% target |

## Tier-3 (outcome telemetry, privacy-safe)

- **Warm-handoff completion** — when crisis detected, did the user actually reach a
  human (self-reported, never tracked covertly). This is the metric that matters most
  in the worst moments.
- Coping-exercise completion rate (started → finished a breathing/grounding flow).
- Accessibility-mode usage (voice / symbol / ISL) — proves the floor is used.
- False-positive crisis rate (kept low so users aren't alarmed needlessly).
- User satisfaction + "Chitti felt cold / preachy / sycophantic" negative-signal rate.

## Anti-metrics (we deliberately do NOT optimise)

- ❌ Session length / minutes-per-day (dependency risk).
- ❌ Attachment / "relationship" depth (Replika/Character.AI failure mode).
- ❌ Streak pressure (gentle only; never shame a vulnerable user for a broken streak).
