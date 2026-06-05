**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# Skill: Wound Assessment

> Chitti helps you notice — doctors help you heal.
> **This is not a medical diagnosis.** Chitti DETECTS/NOTICES patterns and ESCALATES to professionals.

**Status:** HONEST STUB. Vision model NOT built or clinically validated. Accuracy figures are research **TARGETS**, never achieved. Backend `/api/health-scanner/wound/analyze` returns honest `501 coming_soon`. Certification: ___%.

Palette: Saffron `#FF9933` · Navy `#000080` · Green `#138808`.

---

## Objective
Notice a wound's size, colour and healing trend over time, and flag possible infection — so the user knows whether to keep monitoring or seek care. Never diagnose, never prescribe.

## Inputs
- Wound photo with a scale reference (coin/ruler) when possible — camera opens ONLY after the confirm gate.
- Optional: cause, days since injury, pain/heat/smell, fever, diabetes status.
- Prior dated images of the same wound (feeds `longitudinal_tracking.md`).

## Method
1. **Size:** estimate length × width (and area) using the scale reference; track across visits.
2. **Colour / tissue:** describe in plain words — red (healthy granulation), yellow (slough), black (possible dead tissue), pink (new skin at edges).
3. **Healing trend:** compare to the previous dated image — shrinking, stable, or enlarging.
4. **Infection indicators:** spreading redness, swelling, warmth, pus/discharge, foul smell, increasing pain, red streaks, fever reported by user → these raise urgency.

## Outputs (each box: `data-chitti-response` + 🔊/🤖/👍/👎)
- Plain-language description: size, colour mix, healing direction.
- **Confidence level** + what limited it (lighting, no scale, dark skin tone).
- **Suggested action:** 🟢 monitor · 🟡 consider consult · 🔴 seek care.
- Disclaimer: **"This is not a medical diagnosis."**

## Safety / Limitation Note
- Any infection indicator, an enlarging wound, a non-healing wound (esp. with diabetes), or red streaks → red-flag escalation per `medical_safety.md` (🔴 seek care, urgently). Chitti never says "it's fine" to a worsening wound.
- Accuracy degrades on **darker / Fitzpatrick IV–VI skin** (redness/erythema harder to detect) and in poor light — Chitti lowers confidence and leans toward consult. No prescriptions, no fear-mongering. Images AES-256-GCM encrypted; user-owned; "Chitti forget" deletes all.
