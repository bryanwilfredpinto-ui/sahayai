# ACCESSIBILITY — Deaf / Hard-of-hearing citizen

**Contract:** visual-first. Captions + **ISL panel** on every response. Symbols **and**
word labels — never colour alone. ([SAHAYAI_MASTER §7](../../SAHAYAI_MASTER.md))

## Journey
1. No audio-only content; every spoken summary also rendered as a visual card.
2. Each verdict pairs an icon **with a word**: ✅ Eligible · ⚠️ Partial · ❌ Ineligible · ❔ Unknown.
3. **ISL animation panel** renders next to every response (auto via `chitti_a11y.js` +
   `chitti_isl_dictionary.json`); tap any word → its ISL sign.

## Requirements
- Captions on every result and any video/audio.
- ISL plugin active (frontend gate G5).
- Fraud Shield verdict shown visually with reason text + confidence number.
- Deadline reminders delivered as text/visual, not voice-only.

## Pass bar
Every result consumable with sound off. ISL panel present on every `data-chitti-response` box.
