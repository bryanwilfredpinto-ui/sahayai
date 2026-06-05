🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# accessibility/blind_user.md — Level 9

> Blind = **voice-first.** No visual-only content, anywhere in the scan→route→recall flow.

## Requirements

- **Voice-guided capture.** "Hold the label steady. Tap anywhere to capture." Camera frame is
  narrated, not shown silently.
- **Route spoken automatically.** "This looks like a medicine. I'm sending it to MedUPI to
  find a cheaper option. Shall I open it?" (confirm-gated).
- **Reason on demand.** 🤖 → "Why? Because I saw a composition and an expiry date."
- **Every error spoken** — never a silent red box.
- **Memory recall by voice** — "When did I scan this?" → spoken answer.
- **Page auto-announce on open** (BLIND profile) — "You are on Chitti Scanner. Tap anywhere
  to start." ([§5c](../../SAHAYAI_MASTER.md)).

## Substrate

`chitti_a11y.js` (`speak`, aria-live) + `feedback-widget.js` (🔊 per box). Route card carries
`data-chitti-response` + `aria-live="polite"`.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
