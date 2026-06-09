🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# ACCESSIBILITY — Low-Vision User (Persona: Dinesh, ~5 crore Indians)

> Partial sight from cataract, diabetic retinopathy, glaucoma, or refractive error — extremely
> common in India, especially with diabetes prevalence. He can see *some*, but tiny candlesticks and
> **red/green-only** signals are useless to him. The fix is **never colour-only** + **zoom/reflow
> safe**. Implements [CONSTITUTION.md](CONSTITUTION.md) Art. 1–2 and [ACCESSIBILITY.md](../ACCESSIBILITY.md).

## What he needs
- **Zoom to 200%+** without losing content or breaking layout (reflow at 320px-equivalent, WCAG 1.4.10).
- **High contrast** text and verdict (WCAG 1.4.3 ≥4.5:1) — no faint grey-on-white.
- Verdict by **shape + word + voice**, never red/green alone (many low-vision users are also colour-blind).
- Large tap targets and the option to **fall back to voice** when the chart is too small to parse.

## How Chitti Technicals serves him
| Need | Implementation |
|---|---|
| Zoom / reflow safe | Relative units; single-column reflow at 320px-equivalent; no fixed-width that clips at 200% |
| High contrast | High-contrast theme; ≥4.5:1 text; verdict text is large + bold, not a thin coloured label |
| Never colour-only | 5-state **shape ladder** ▲▲/▲/■/▼/▼▼ + the **word** ("Sell") + voice — colour only decorates (Art. 2) |
| Colour-blind safe | Greyscale-survivable: every state distinguishable by shape + label with all colour removed |
| Voice fallback | Chart too small? "Bol ke batao" → the verdict + RSI/MACD are spoken in full (`audio_graph.js` summary) |
| Large targets | ≥48px taps; large-text verdict card; focus ring clearly visible |

## Failure modes to prevent
- Verdict conveyed by **red/green only** (candle colour, coloured text) → invisible to colour-blind low-vision → defect.
- Layout that **clips or horizontal-scrolls** at 200% zoom → content lost → defect (WCAG 1.4.10).
- Thin/low-contrast text (<4.5:1) for the verdict, RSI value, or disclaimer → defect.
- A chart that can't be **escaped to voice/text** when it's too small to read → defect.
- Tap targets under 48px on the verdict / Tip Shield / widget controls → defect.

## Test procedure (part of [../EVALS.md](../EVALS.md) + BO5/BO11 gate)
**Browser zoom 200% + forced greyscale + contrast checker.** Any language:
1. Zoom to 200% → no clipping, no horizontal scroll; verdict, RSI, disclaimer all readable, reflowed to one column.
2. Force greyscale → 5-state verdict still distinguishable by **shape + word** (▼ "Sell").
3. Contrast check → verdict text, RSI value, and the "most traders lose" rail all ≥4.5:1.
4. "Bol ke batao" → verdict spoken in full as a fallback to the small chart.
5. Confirm all interactive controls are ≥48px.
**Pass = full verdict recoverable at 200% zoom, in greyscale, at ≥4.5:1 contrast, with a voice fallback.**

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
