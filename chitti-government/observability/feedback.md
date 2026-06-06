# OBSERVABILITY — Feedback loop

## Per-response widget (mandatory, every box)
🔊 read · 🤖 explain-further · 👍 / 👎 · per-box feedback window — via
[`feedback-widget.js`](../../feedback-widget.js), attached to every
`data-chitti-response` element. 👎 opens a voice/type window tagged to the box ID,
POSTed to `/api/feedback` → Founder daily 07:00 IST digest.

## What feedback feeds
- 👎 on an eligibility verdict → candidate gold-case for [evals/](../evals/).
- Reported wrong scheme/amount → Scheme Agent re-verifies → corpus fix (Sire approves,
  Government is HIGH-risk).
- Confirmed fraud report → Fraud Agent pattern DB (≥100 confirmations → skill update).

## Swarm cycle
Daily collect → weekly validate (≥100 confirmations) → monthly push to `skills/*.md`
→ quarterly review. **Government is HIGH-risk: Sire approves every skill change.**
([SAHAYAI_MASTER §2f](../../SAHAYAI_MASTER.md))
