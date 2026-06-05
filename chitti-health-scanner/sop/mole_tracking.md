**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# SOP-004 — Mole Tracking

> Part of **Chitti Health Scanner** (Chitti MedUPI family) · COSDF v1.0 · Level 7 (Standard Operating Procedures)
> Brand palette: Saffron `#FF9933` · Navy `#000080` · Green `#138808`
>
> **Golden line:** *Chitti helps you notice — doctors help you heal.*
> **Chitti DETECTS / NOTICES patterns and ESCALATES to professionals. Chitti NEVER diagnoses.**

---

## Purpose

Help a user track a mole over time using a **scale reference**, **body-location mapping**, frame
**alignment** with the prior photo, and a **growth-rate** estimate, so Chitti can NOTICE change and
suggest a professional action. **This is not a medical diagnosis.**

## Honest-stub notice

The mole-vision model is **NOT built or clinically validated yet**. Any accuracy figure is a
**research TARGET / benchmark, never achieved**. The analysis endpoint returns honest
`501 coming_soon`. Certification score: **___%** (BLANK).

---

## Steps

1. **Explain & set expectation.** Chitti: "Sire, I can help you NOTICE if a mole changes over time.
   I am not a doctor and will not diagnose. *This is not a medical diagnosis.* Shall we begin?"

2. **Golden-Rule camera confirm (MANDATORY).** **"Sire, shall I open the camera? Haan / Nahi."**
   Wait for explicit haan OR a tap on ✅. Mute-safe. **Never default to yes. Silence = wait.**

3. **Body-location mapping.** Chitti asks the user to mark/confirm **where on the body** the mole is
   (e.g. "upper back, left side"). This location is stored so the SAME mole is tracked over time and
   not confused with others.

4. **Scale reference (required).** Place a coin (₹5 ≈ 23 mm) or marked ruler **flat** beside the mole,
   in the same focal plane, so diameter can be estimated each visit.

5. **Alignment with prior photo.** If a baseline exists, Chitti overlays/recalls the previous framing
   (a ghost outline on screen, or spoken guidance) so the new photo **aligns** — same angle, distance,
   rotation — making comparison fair.

6. **Capture confirm (Golden Rule).** **"Sire, shall I capture this photo now? Haan / Nahi."**
   Capture only on explicit haan / tap.

7. **Quality check.** If blurry / dark / glare / misaligned: "The photo is not clear or not aligned —
   shall I retake? Haan / Nahi" → return to Step 4/5.

8. **Growth-rate & change NOTICE (not diagnose).** Against the baseline, Chitti notices change in
   **diameter, border, colour, and symmetry** and estimates a **growth rate** over the elapsed days.
   It surfaces ABCDE-style patterns (asymmetry, border, colour, diameter, evolving) **as patterns to
   show a doctor** — never as a verdict, never "this is melanoma."

9. **Save confirm (Golden Rule).** **"Sire, shall I save this to your Chitti Health File timeline
    under this body location? Haan / Nahi."** Save only on confirm. Images **AES-256-GCM encrypted at
    rest, user-owned, never sold**.

10. **Deliver the output box** (see template) with confidence + plain-language explanation + suggested
    action + disclaimer; box carries `data-chitti-response` + 🔊 / 🤖 / 👍 / 👎.

11. **Honest limitation note.** "AI is less accurate on darker (Fitzpatrick IV–VI) skin tones — please
    weigh this and consult a professional." Never hide this.

12. **Escalation check.** Rapid growth, bleeding, ulceration, or a mole that looks very different from
    the user's others → hand off to **SOP-005 — Emergency Escalation** as
    **"this pattern requires professional evaluation."**

---

## Voice-guided variant (blind users)

- Every step spoken (Voice OUT) and accepts spoken input (Voice IN); every prompt also accepts a tap.
- Confirms (Steps 2, 6, 9) read aloud; wait for haan / tap; never auto-proceed.
- **Body-location mapping by voice:** Chitti asks "where is this mole?" and accepts a spoken answer
  ("upper back, left"). Helper/caregiver framing supported.
- **Alignment audio aid:** Chitti recalls last framing aloud — "last time the coin was on the right,
  arm's length… match that… rotate a little… hold… good."
- Growth-rate result read aloud in full via 🔊.
- Status paired with icon + text, never colour alone: 🟢 stable · 🟡 monitor & re-check · 🔴 seek care.

---

## Analysis output template (every box must carry this)

```
🔊 / 🤖 / 👍 / 👎   (per-response widget — data-chitti-response)

Body location: <mapped location>
Baseline date: <date of first capture for this mole>
What Chitti noticed: <diameter/border/colour/symmetry change vs baseline, plain language>
Growth rate: <appears stable / slow change / notable change> over <N> days
ABCDE patterns to show a doctor: <none / list — as patterns, not a verdict>
Confidence: <low / medium / high>   ← honest stub: a TARGET, not achieved
Suggested action: 🟢 monitor  /  🟡 consider consult  /  🔴 seek care
Note: AI is less accurate on darker (Fitzpatrick IV–VI) skin tones.

⚠️ This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.
```

## Cross-links

- Feeds the **Chitti Health File** timeline (one thread per body-location mole, aligned over time).
- Cross-links to **Chitti Government** (PMJAY) and **Chitti MedUPI** for affordable specialist care.
