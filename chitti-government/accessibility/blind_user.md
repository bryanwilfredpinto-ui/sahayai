# ACCESSIBILITY — Blind / Low-Vision citizen

**Contract:** voice-first. Nothing visual-only. ([SAHAYAI_MASTER §7](../../SAHAYAI_MASTER.md))

## Journey (eligibility check, by voice)
1. Page **auto-announces** on open: "You are on Chitti Government. Say or tap what you need."
2. Citizen says *"Main kisaan hoon, Maharashtra se"* → STT → Citizen Twin.
3. Rule-engine runs; DeepSeek phrases verdict; **`🔊` auto-reads** the result aloud.
4. Each scheme card has a 🔊 speaker (per-response widget) to re-read that card.

## Requirements
- `🔊 Read page` button present + working (a11y substrate).
- Every error **spoken**, never colour/icon-only.
- The 26-language dropdown is **operable by voice + keyboard**; selection re-reads page.
- Verdict communicated in words ("You appear ELIGIBLE"), never colour alone.
- Document checklist items spoken with state ("Aadhaar: you have it. Voter ID: missing").
- Focus order is logical; all controls have `aria-label`.

## Pass bar
Blind-user task success ≥ **95%** ([evals/accessibility_eval.md](../evals/accessibility_eval.md)).
A blind farmer must complete an eligibility check + hear her document gaps by voice alone.
