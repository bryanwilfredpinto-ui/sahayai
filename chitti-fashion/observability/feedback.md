🎖️ World Class Chitti Fashion — Observability: Feedback

# OBSERVABILITY — Feedback

> Every response box carries the per-response widget. Feedback is how Chitti
> Fashion learns — within strict guardrails.

## The widget (per box — no box ships without it)
🔊 speaker · 🤖 Chitti-explain · 👍 / 👎 · ✏️ type / 🎙️ voice feedback. Tagged to the
card id; POST `/api/feedback` (card name + text only — **never images**).

## Cards
`fa_almari` · `fa_shop` · `fa_today` (dress-me) · `fa_trends` · `fa_tools` ·
`fa_certs` · `fa_review` · `fa_occasion`. Each 👎 carries `{chitti:'chitti_fashion',
card, message}`.

## The most-watched signal — body-comment slip
- 👎 on `fa_shop` with body-comment text is the highest-priority feedback.
- **5× in 24h → hourly :15 escalator → Sire same-day review** ([../guardrails/body_shaming.md](../guardrails/body_shaming.md)).
- Slip rate target = 0.

## Learning loop (Swarm, [§2f](../../SAHAYAI_MASTER.md))
| Cadence | Step |
|---|---|
| Daily | collect 👍/👎 + 👎→👍 reversals + multi-turn success |
| Weekly | validate patterns (≥100 confirmations, cross-region sanity) |
| Monthly | push validated styling patterns to [../skills/](../skills/) (provenance comment) |
| Quarterly | full review for drift / stale trends / guardrail conflicts |

## Never learnable
Body-comment, bias, or any locked-guardrail pattern can never be promoted to a
skill — the swarm is forbidden from learning them.

## Founder dashboard
Daily 07:00 IST aggregate (chitti-founder) surfaces Fashion's 👍 rate, top 👎
cards, body-comment watch, and accessibility-pass status.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
