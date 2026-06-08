# SOP — Chitti Psychology (Level 6 index)

> Standard Operating Procedures. The crisis SOP outranks all others and is the
> single most important procedure in this product.

| SOP | File | Trigger |
|---|---|---|
| **SOP-004 Crisis Escalation** (supreme) | [sop/crisis-escalation.md](sop/crisis-escalation.md) | Any self-harm / harm-to-others / abuse / acute-distress signal. |
| SOP-001 Relationship Conflict | [sop/relationship-conflict.md](sop/relationship-conflict.md) | Conflict with spouse / friend / family. |
| SOP-002 Workplace Conflict | [sop/workplace-conflict.md](sop/workplace-conflict.md) | Conflict / burnout / feedback at work. |
| SOP-003 Parenting Challenge | [sop/parenting-challenge.md](sop/parenting-challenge.md) | Child / teen behaviour concern. |
| SOP-005 Grief Support | [sop/grief-support.md](sop/grief-support.md) | Loss, divorce, breakup, job loss. |
| SOP-006 Exam Stress | [sop/exam-stress.md](sop/exam-stress.md) | Student exam pressure. |
| SOP-007 Loneliness / Eldercare | [sop/loneliness-eldercare.md](sop/loneliness-eldercare.md) | Isolation, senior companionship. |

## Universal step-0 (runs before every SOP)

1. **`detectCrisis()` first.** If level 3 → jump straight to SOP-004. Engagement never
   precedes safety.
2. **Reflect before solve** (Rogers): mirror what the user said, in their language.
3. **Detect emotion**, adjust tone before content.
4. **Check disability profile + language** — adapt mode (voice / symbol / slow).
5. Only then run the matching SOP.

## Universal step-N (ends every SOP)

- Offer **one** small concrete step (never a list of ten).
- Per-response widget for feedback.
- If distress_level ≥ 2 → append the helpline strip (server-enforced; anti-nag: once
  per session unless the user asks again).
- Never diagnose; never promise; never claim feelings.
