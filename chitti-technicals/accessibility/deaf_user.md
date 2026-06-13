🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# ACCESSIBILITY — Deaf User (Persona: Priya, ~6 crore Indians)

> The deaf user's first language is **ISL (Indian Sign Language)**, not written English or Hindi.
> Voice-first finance apps lock her out entirely. Every spoken cue must have a **visible, text +
> shape + ISL** twin. Implements [CONSTITUTION.md](CONSTITUTION.md) Art. 1–2 and [ACCESSIBILITY.md](../ACCESSIBILITY.md).

## What she needs
- Every spoken word mirrored as **on-screen text** — captions for the whole conversation.
- The verdict carried by **shape, not colour** (▲▲/▲/■/▼/▼▼) so red/green never matters.
- **ISL** for the meaning-bearing words; technical proper-nouns **fingerspelled**, never faked.
- No information that exists only as audio (no alert that is a beep-only).

## How Chitti Technicals serves her
| Need | Implementation |
|---|---|
| Text twin of all audio | Every `aria-live` spoken line is also rendered as visible text; the whole Vaani exchange is captioned |
| Non-colour shape verdict | 5-state ladder **▲▲ Strong Buy / ▲ Buy / ■ Neutral / ▼ Sell / ▼▼ Strong Sell** — shape carries state (WCAG 1.4.1) |
| RSI / MACD as visuals | RSI gauge with a labelled "overbought 70 / oversold 30" band marker; MACD ✕-cross glyph + text "bearish cross 2d ago" |
| ISL panel | `chitti_isl.js` signs "sell / buy / careful / high / low"; **fingerspells R-S-I, M-A-C-D, N-S-E** (no native sign exists → fingerspell + explain the concept, **never invent a sign** — ISL spec Phase 1) |
| Earcon → visual twin | Every audio earcon (RSI 70, MACD cross) has a synchronized visual flash + text label + optional haptic pulse |
| Per-box widget | 👍/👎 and ✏️ type-feedback work fully without voice (`feedback-widget.js`) |

## Failure modes to prevent
- Any alert, verdict, or disclaimer that exists **only as audio** (a beep, a spoken-only warning) → defect.
- A **fabricated ISL sign** for RSI/MACD/a stock name → defect. Fingerspell + explain, never fake (ISL law).
- Verdict distinguishable **only by colour** (red/green candles, red/green text) → defect — use shape + word.
- ISL panel that animates a generic placeholder while claiming accuracy → defect (honest placeholders only).
- The "most short-term traders lose" rail + NOT-SEBI line missing from the **text** channel → defect.

## Test procedure (part of [../EVALS.md](../EVALS.md) + BO3 gate)
**Device on MUTE, sound completely off.** Full journey with **zero** audio:
1. Vaani text-in → "Reliance technical" → caption + text verdict appears.
2. Confirm the 5-state shape ladder shows the correct glyph (▼) and the RSI/MACD text + glyphs match.
3. Open the ISL panel → "sell/careful" signed; "RSI"/"MACD" fingerspelled, not faked.
4. Force greyscale → verdict still distinguishable by **shape + word** alone (colour-blind pass).
5. Confirm the disclaimer rail is present in the text channel.
**Pass = the verdict is 100% recoverable with sound off** (the [ACCESSIBILITY.md](../ACCESSIBILITY.md) gate).

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
