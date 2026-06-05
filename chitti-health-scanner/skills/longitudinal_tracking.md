**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# Skill: Longitudinal Tracking (Image Registration & Change Detection)

> Chitti helps you notice — doctors help you heal.
> **This is not a medical diagnosis.** Chitti DETECTS/NOTICES patterns and ESCALATES to professionals.

**Status:** HONEST STUB. Engine NOT built or clinically validated. Accuracy figures are research **TARGETS**, never achieved. Backend `/api/health-scanner/track` returns honest `501 coming_soon`. Certification: ___%.

Palette: Saffron `#FF9933` · Navy `#000080` · Green `#138808`.

---

## Objective
Be the shared change-detection engine behind every other skill — line up a new photo with old ones of the same site, measure what actually changed, and compute growth. Powers `mole_tracking.md`, `wound_assessment.md`, `skin_assessment.md`, `dental_assessment.md`.

## Inputs
- Two or more dated images of the **same body site** (from the Chitti Health File timeline).
- Scale reference (coin/ruler) for real-world units.
- Capture metadata: date, lighting, angle, device.

## Method
1. **Image registration:** align the new image to the baseline (correct for angle, distance, rotation) so the same region is compared.
2. **Pixel change detection:** difference the registered images; separate true change from lighting/angle noise.
3. **Growth calculation:** convert pixel deltas to real units via the scale reference; report area change and **diameter growth in mm/month** across the dated interval.
4. **Trend:** classify the change direction — shrinking / stable / enlarging — and hand it to `risk_communication.md`.

## Outputs (each box: `data-chitti-response` + 🔊/🤖/👍/👎)
- A dated trend on the Chitti Health File timeline (size/area over time).
- Measured change (mm, mm², mm/month) with **confidence level** and what limited it.
- **Suggested action** routed from the calling skill: 🟢 monitor · 🟡 consider consult · 🔴 seek care.
- Disclaimer: **"This is not a medical diagnosis."**

## Safety / Limitation Note
- Measurements are **estimates** — without a consistent scale and angle, error is large; Chitti reports the uncertainty and never presents a number as exact. "Stable" means "no change Chitti could measure," not "safe."
- Registration is harder with poor/changing light and on **darker / Fitzpatrick IV–VI skin** (lower contrast) → confidence drops, lean toward consult. Images AES-256-GCM encrypted at rest, anonymised before any aggregate, user-owned; "Chitti forget" deletes all.
