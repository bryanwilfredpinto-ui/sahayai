**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# Skill: Skin Assessment (Visual Dermatology)

> Chitti helps you notice — doctors help you heal.
> **This is not a medical diagnosis.** Chitti DETECTS/NOTICES patterns and ESCALATES to professionals.

**Status:** HONEST STUB. The vision model is NOT built or clinically validated yet. All accuracy numbers below are research **TARGETS / benchmarks**, never achieved metrics. Backend `/api/health-scanner/skin/analyze` returns honest `501 coming_soon`. Certification: ___%.

Palette: Saffron `#FF9933` · Navy `#000080` · Green `#138808`.

---

## Objective
Notice visual patterns on skin (rashes, lesions, discolouration, pigmented spots) and route the user to the right level of care. Never name a disease, never reassure away a real concern.

## Inputs
- One or more skin photos (good light, ruler/coin for scale when possible) — camera opened ONLY after the confirm gate ("Sire, shall I open the camera? Haan / Nahi").
- Optional: body location, how long present, itch/pain/bleeding, change over time.
- Stored prior images for the same site (feeds `longitudinal_tracking.md`).
- User Disability Profile (drives voice-guided capture from `accessibility.md`).

## Method
1. **ABCD rule** for pigmented lesions/moles:
   - **A — Asymmetry:** one half unlike the other.
   - **B — Border:** irregular, notched, blurred edges.
   - **C — Colour:** more than one shade; black, blue, red, white mixed.
   - **D — Diameter:** larger than ~6 mm (pencil eraser). (Evolution handled in `mole_tracking.md`.)
2. **Rash morphology:** describe pattern in plain words — flat (macule) vs raised (papule), fluid-filled (vesicle), scaly, ring-shaped, clustered, spreading; note distribution and symmetry.
3. **Map to urgency, never to diagnosis** — hand the noticed features to `risk_communication.md` for the confidence + action wording.

## Outputs (every output box carries `data-chitti-response` + 🔊/🤖/👍/👎)
- Plain-language description of what Chitti noticed.
- **Confidence level** (low / medium / high — and what limited it).
- **Suggested action:** 🟢 monitor · 🟡 consider consult · 🔴 seek care (colour ALWAYS paired with icon + text).
- Disclaimer line: **"This is not a medical diagnosis."**

## Safety / Limitation Note
- AI vision is **less accurate on darker / Fitzpatrick IV–VI skin tones** — most public dermatology datasets under-represent brown and Black skin. Chitti states this limitation out loud, lowers its confidence on darker tones, and biases toward "consider consult / seek care" rather than false reassurance.
- Any feature suggesting melanoma, fast change, bleeding, or non-healing → red-flag escalation per `medical_safety.md`. No "you have <disease>", no certainty, no panic, no shaming. Images AES-256-GCM encrypted at rest; "Chitti forget" deletes all.
