🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# Accessibility Agent — "How should the answer be delivered?"

## Job

Shape **how** the routed result reaches the user, based on the User Disability Profile
([§7](../../SAHAYAI_MASTER.md)). It does not change the *destination* — it changes the
*delivery*.

## Delivery adaptations

| Profile | Delivery |
|---|---|
| 👁️ Blind | Route + reason spoken automatically; voice-guided capture; no visual-only step. |
| 🦻 Deaf | Caption + symbol (✅/⚠️/❔) + ISL panel on the route card; never audio-only. |
| 🤫 Mute | Whole flow by tap/camera; voice input optional, never required. |
| 📖 Illiterate | Picture-menu category pick; every label spoken; emoji glyphs. |
| 👵 Elderly | Slow speech, large text, repeat button. |
| 🤟 ISL | ISL animation on every route card + result box. |

## Hard rules

- **Accessibility is the floor.** A route card that can't be heard, captioned, *and*
  signed is broken — redesign, don't ship with an asterisk.
- Inherits the substrate (`chitti_a11y.js` + `feedback-widget.js`); never hand-rolled.
- Delivery shaping **never** suppresses the safety/escalation content.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
