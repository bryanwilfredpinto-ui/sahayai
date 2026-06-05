**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# Skill: Dental Assessment

> Chitti helps you notice — doctors help you heal.
> **This is not a medical diagnosis.** Chitti DETECTS/NOTICES patterns and ESCALATES to professionals.

**Status:** HONEST STUB. Vision model NOT built or clinically validated. Accuracy figures are research **TARGETS**, never achieved. Backend `/api/health-scanner/dental/analyze` returns honest `501 coming_soon`. Certification: ___%.

Palette: Saffron `#FF9933` · Navy `#000080` · Green `#138808`.

---

## Objective
Notice early dental patterns — possible caries, plaque build-up, gum redness/swelling — and nudge the user toward a dentist before small problems become painful ones. Never diagnose, never prescribe.

## Inputs
- Intra-oral photos (front, upper, lower; good light, mouth open) — camera opens ONLY after the confirm gate.
- Optional: pain, sensitivity, bleeding gums, which tooth, how long.

## Method
1. **Tooth segmentation:** locate individual teeth so a noticed spot can be tied to a specific tooth position.
2. **Caries spectrum (notice the stage, don't grade clinically):**
   - **White-spot** lesion (early demineralisation, often reversible) →
   - **Discolouration / brown spot** →
   - **Cavitated** (visible hole / broken surface).
3. **Gums & plaque:** note redness, swelling, recession, bleeding signs at the gum line; visible plaque/tartar build-up.

## Outputs (each box: `data-chitti-response` + 🔊/🤖/👍/👎)
- Plain-language description tied to tooth position where possible.
- **Confidence level** + limiter (lighting, angle, saliva glare).
- **Suggested action:** 🟢 monitor + hygiene · 🟡 consider dentist visit · 🔴 seek dental care (pain/abscess signs).
- Disclaimer: **"This is not a medical diagnosis."**

## Safety / Limitation Note
- Photos see only surfaces — Chitti **cannot** see between teeth, under fillings, or below the gum; it states this and never rules anything out. Swelling, severe pain, or signs of abscess → red-flag escalation per `medical_safety.md`.
- No prescriptions (no antibiotics/painkillers advice), no certainty, no shaming about oral hygiene. Images AES-256-GCM encrypted; user-owned; "Chitti forget" deletes all.
