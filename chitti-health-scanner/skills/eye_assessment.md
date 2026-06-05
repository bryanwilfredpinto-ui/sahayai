**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# Skill: Eye Assessment (External / Surface)

> Chitti helps you notice — doctors help you heal.
> **This is not a medical diagnosis.** Chitti DETECTS/NOTICES patterns and ESCALATES to professionals.

**Status:** HONEST STUB. Vision model NOT built or clinically validated. Accuracy figures are research **TARGETS**, never achieved. Backend `/api/health-scanner/eye/analyze` returns honest `501 coming_soon`. Certification: ___%.

Palette: Saffron `#FF9933` · Navy `#000080` · Green `#138808`.

---

## Objective
Notice external eye patterns — redness, swelling, discharge, or yellowing (jaundice) of the white — and route the user to an eye doctor or general physician. External surface only; never an eye exam.

## Inputs
- Close, well-lit photos of the eye(s), looking straight and (gently) up/down/sideways — camera opens ONLY after the confirm gate.
- Optional: pain, blurred vision, light sensitivity, duration, one eye or both.

## Method
1. **Redness:** note location and spread across the white (sclera/conjunctiva).
2. **Swelling:** of the lid or around the eye.
3. **Discharge:** watery vs thick/coloured; crusting.
4. **Jaundice:** yellow tint of the normally-white sclera (can signal a body-wide issue, not just the eye).

## Outputs (each box: `data-chitti-response` + 🔊/🤖/👍/👎)
- Plain-language description of what Chitti noticed.
- **Confidence level** + limiter (lighting, glare, reflections, skin tone affecting surrounding tissue read).
- **Suggested action:** 🟢 monitor · 🟡 consider consult · 🔴 seek care (vision loss, severe pain, injury, jaundice).
- Disclaimer: **"This is not a medical diagnosis."**

## Safety / Limitation Note
- Chitti sees only the **outer surface** — it cannot check vision, pressure, retina, or anything inside; it says so plainly and never rules out serious causes. Sudden vision change, severe pain, chemical/physical injury, or scleral yellowing → red-flag escalation per `medical_safety.md` (🔴 seek care).
- No prescriptions (no drops/antibiotics advice), no certainty, no panic. Images AES-256-GCM encrypted; user-owned; "Chitti forget" deletes all.
