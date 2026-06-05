**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# Skill: Mole Tracking (Evolution Over Time)

> Chitti helps you notice — doctors help you heal.
> **This is not a medical diagnosis.** Chitti DETECTS/NOTICES patterns and ESCALATES to professionals.

**Status:** HONEST STUB. Vision model NOT built or clinically validated. Accuracy figures are research **TARGETS**, never achieved. Backend `/api/health-scanner/mole/track` returns honest `501 coming_soon`. Certification: ___%.

Palette: Saffron `#FF9933` · Navy `#000080` · Green `#138808`.

---

## Objective
Watch a specific mole over weeks and months and notice **evolution** — the single most important melanoma warning sign. Chitti's job is to spot change and escalate, not to call it benign or malignant.

## Inputs
- A series of dated photos of the **same** mole, same lighting/angle/scale where possible — camera opens ONLY after the confirm gate.
- Scale reference (coin/ruler) for real-world sizing.
- Prior baseline image + measurements (shared with `longitudinal_tracking.md`).

## Method
1. **ABCD over time** (extends `skin_assessment.md`): re-check Asymmetry, Border, Colour, Diameter against the baseline.
2. **E — Evolution:** flag any change in size, shape, colour, or new symptoms (itch, bleed, crust) since the last image.
3. **Growth rate:** estimate change in diameter in **mm/month** using the scale reference and dated intervals (calculation engine lives in `longitudinal_tracking.md`).
4. Compare registered images pixel-to-pixel; surface meaningful change only (filter noise from lighting/angle).

## Outputs (each box: `data-chitti-response` + 🔊/🤖/👍/👎)
- Plain-language "what changed since last time" summary, with mm/month growth where measurable.
- **Confidence level** + limiter (inconsistent angle/light, no scale, dark skin tone).
- **Suggested action:** 🟢 keep tracking · 🟡 consider dermatologist · 🔴 seek care (clear evolution / bleeding).
- Disclaimer: **"This is not a medical diagnosis."**

## Safety / Limitation Note
- Any clear evolution, bleeding, rapid growth, or new irregular border → red-flag escalation per `medical_safety.md`. A "stable" mole is **never** declared safe — only "no change Chitti could detect."
- Detection is **harder on darker / Fitzpatrick IV–VI skin**; Chitti lowers confidence and leans toward consult. No "you have <disease>", no certainty, no fear-mongering. Images AES-256-GCM encrypted; user-owned; "Chitti forget" deletes all.
