**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# SOP-003 — Tooth Check

> Part of **Chitti Health Scanner** (Chitti MedUPI family) · COSDF v1.0 · Level 7 (Standard Operating Procedures)
> Brand palette: Saffron `#FF9933` · Navy `#000080` · Green `#138808`
>
> **Golden line:** *Chitti helps you notice — doctors help you heal.*
> **Chitti DETECTS / NOTICES patterns and ESCALATES to professionals. Chitti NEVER diagnoses.**

---

## Purpose

Guide a user through capturing **front / left / right** intra-oral photos so Chitti can run **tooth
segmentation** and NOTICE patterns — distinguishing an early **white spot** (often reversible) from a
**cavitated** lesion — and suggest a professional action. **This is not a medical diagnosis.**

## Honest-stub notice

The dental-vision model is **NOT built or clinically validated yet**. Any accuracy figure (research
targets ~89–97%) is a **research TARGET / benchmark, never achieved**. The analysis endpoint returns
honest `501 coming_soon`. Certification score: **___%** (BLANK).

---

## Steps

1. **Explain & set expectation.** Chitti: "Sire, I can help you NOTICE patterns on your teeth. I am
   not a dentist and will not diagnose. *This is not a medical diagnosis.* Shall we begin?"

2. **Golden-Rule camera confirm (MANDATORY).** **"Sire, shall I open the camera? Haan / Nahi."**
   Wait for explicit haan OR a tap on ✅. Mute-safe. **Never default to yes. Silence = wait.**

3. **Lighting & prep.** Good light into the mouth (a torch helps); a clear smile/retracted lips so
   teeth and gum line are visible; remove food debris; wet teeth reflect glare, so angle to reduce it.

4. **Capture FRONT view.** Guide: bite gently, lips back, frame the front upper + lower teeth.
   Capture confirm (Golden Rule): **"Sire, shall I capture the front view now? Haan / Nahi."**

5. **Capture LEFT view.** Guide the user to turn so the **left-side** teeth (premolars/molars) are in
   frame. Capture confirm: **"Sire, shall I capture the left view now? Haan / Nahi."**

6. **Capture RIGHT view.** Same for the **right-side** teeth. Capture confirm: **"Sire, shall I
   capture the right view now? Haan / Nahi."** Capture each view only on explicit haan / tap.

7. **Quality check.** For any view that is blurry / too dark / glare-covered: "This view is not clear —
   shall I retake? Haan / Nahi" → return to Step 3 for that view.

8. **Tooth segmentation (NOTICE, not diagnose).** Chitti segments individual teeth and notices areas
   of concern per tooth (position described in plain language, e.g. "upper-left back tooth").

9. **White-spot vs cavitated distinction (pattern, not verdict).** Chitti describes whether a noticed
   spot looks like an **early white spot** (chalky/white, surface appears intact — often reversible
   with care) **or** a **cavitated** lesion (a visible hole/dark cavity, surface broken). Chitti
   frames this as a pattern to confirm with a dentist — **never** "you have a cavity."

10. **Save confirm (Golden Rule).** **"Sire, shall I save these to your Chitti Health File timeline?
    Haan / Nahi."** Save only on confirm. Images **AES-256-GCM encrypted at rest, user-owned, never
    sold**.

11. **Deliver the output box** (see template) with confidence + plain-language explanation + suggested
    action + disclaimer; box carries `data-chitti-response` + 🔊 / 🤖 / 👍 / 👎.

12. **Escalation check.** Severe pain, swelling of face/gum, bleeding that won't stop, or trauma →
    hand off to **SOP-005 — Emergency Escalation**.

---

## Voice-guided variant (blind users)

- Every step spoken (Voice OUT) and accepts spoken input (Voice IN); every prompt also accepts a tap.
- Confirms (Steps 2, 4, 5, 6, 10) read aloud; wait for haan / tap; never auto-proceed.
- **Framing audio aid:** for each view Chitti speaks orientation — "turn your head a little to show the
  left side… open a bit more… hold… good." Front, then left, then right, one at a time.
- White-spot vs cavitated result and per-tooth location read aloud in full via 🔊.
- Status paired with icon + text, never colour alone: 🟢 normal · 🟡 monitor · 🔴 seek care.

---

## Analysis output template (every box must carry this)

```
🔊 / 🤖 / 👍 / 👎   (per-response widget — data-chitti-response)

Views captured: front / left / right
What Chitti noticed (per tooth): <plain-language location + appearance, no verdict>
Pattern: <looks like an early white spot — often reversible  /  looks cavitated — needs a dentist>
Confidence: <low / medium / high>   ← honest stub: a TARGET, not achieved
Suggested action: 🟢 monitor & good oral care  /  🟡 consider dental consult  /  🔴 seek care

⚠️ This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.
```

## Cross-links

- Feeds the **Chitti Health File** timeline (front/left/right thread per check).
- Cross-links to **Chitti Government** (PMJAY) and **Chitti MedUPI** for affordable dental care.
