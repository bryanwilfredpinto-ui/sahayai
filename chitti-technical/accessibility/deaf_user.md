🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# ACCESSIBILITY — Deaf trader (P6)

> A deaf trader gets a **visual-first** experience: large numbers, symbol + word
> labels, and an ISL panel on every response. Nothing is audio-only.

## Requirements (all mandatory)
- **Large, high-contrast numbers** for entry / stop / target / RR.
- **Symbol + word labels** — 📈 BUY · 🛑 SELL · ⏸️ HOLD · 🎯 TARGET · ⚠️ RISK —
  never colour alone (also serves colour-blind users).
- **ISL panel on every response** (Indian Sign Language, not ASL), auto-injected by
  `chitti_a11y.js` + `chitti_isl_dictionary.json` ([SAHAYAI_MASTER.md §7](../../SAHAYAI_MASTER.md)).
  Unknown terms fingerspell; indicator names fingerspell in English.
- **Every spoken line has a visible caption** — the Audio Trade Summary is also a
  written summary.
- Full visual chart with captioned crosshair readouts.

## ISL specifics for technical terms
- "BUY", "SELL", "STOP LOSS", "TARGET", "RISK" have dictionary signs.
- Indicator names (RSI, MACD) fingerspell the English letters
  ([CTO.md §6](../../chitti-cto/CTO.md)).
- Placeholder animations are honestly labelled "Placeholder ISL — community video
  coming soon"; never claimed as the real sign.

## Anti-patterns (defects)
- An audio-only confirmation with no caption. ❌
- A signal shown only as a colour with no word/symbol. ❌
- A response card with no ISL panel. ❌

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
