🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# OBSERVABILITY — Feedback

> Every response box carries the per-response widget. Feedback — plus the
> [Mechanic Verification Loop](mechanic_verification_loop.md) — is how Chitti Bike
> Doctor learns, within strict guardrails.

## The widget (per box — no box ships without it)
🔊 speaker · 🤖 Chitti-explain · 👍 / 👎 · ✏️ type / 🎙️ voice feedback. Tagged to the
card id; POST `/api/feedback` with `{chitti:'chitti_2wheeler', card, message}` —
card name + text only, **never images, never plate**.

## Cards
`tw_ask` · `tw_diagnosis` · `tw_breakdown` · `tw_dashboard` · `tw_sound` ·
`tw_diy` · `tw_scam_shield` · `tw_maintenance` · `tw_verify` (verification loop).

## The most-watched signals
| Signal | Why it's top-priority |
|---|---|
| 👎 *"DIY se kharab ho gaya"* on `tw_diy` | safety — a DIY tier was too aggressive → P0 same-day review |
| 👎 *"safe bola tha par dangerous tha"* on `tw_diagnosis` | safety false-negative → P0, regression case forever |
| Predicted ≠ actual (High confidence) | over-confidence → biggest quality penalty |
| 👎 *"galat part bata diya"* | possible hallucination → check Trust Agent path |
| `scam_shield_defamation_flag` | named-mechanic accusation slipped → scrub + review |

**Escalation:** any safety 👎 (DIY-went-wrong / said-safe-was-dangerous) → hourly :15
escalator → **Sire same-day review.** Safety feedback never waits for the daily slice.

## Learning loop (Swarm, [§2f](../../SAHAYAI_MASTER.md))
| Cadence | Step |
|---|---|
| Daily | collect 👍/👎 + 👎→👍 reversals + verification-loop outcomes |
| Weekly | validate patterns (≥100 confirmed predicted=actual, cross-region sanity) |
| Monthly | push validated diagnostic patterns to [../skills/](../skills/) (provenance comment) |
| Quarterly | review for drift / stale price bands / guardrail conflicts |

## Never learnable
Unsafe-DIY patterns, "you're being cheated by [named mechanic]", over-confidence on
thin evidence, or any locked-guardrail pattern can **never** be promoted to a skill.

## Founder dashboard
Daily 07:00 IST aggregate (chitti-founder) surfaces 👍 rate, top 👎 cards, the
**safety-feedback watch**, mechanic-confirmation rate, and accessibility-pass status.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
