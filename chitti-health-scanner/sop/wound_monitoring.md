**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# SOP-002 — Wound Monitoring

> Part of **Chitti Health Scanner** (Chitti MedUPI family) · COSDF v1.0 · Level 7 (Standard Operating Procedures)
> Brand palette: Saffron `#FF9933` · Navy `#000080` · Green `#138808`
>
> **Golden line:** *Chitti helps you notice — doctors help you heal.*
> **Chitti DETECTS / NOTICES patterns and ESCALATES to professionals. Chitti NEVER diagnoses.**

---

## Purpose

Help a user track a wound over time — establish a **baseline**, measure with a **scale reference**,
estimate **healing rate**, and run a **diabetic-infection screen** — so Chitti can NOTICE whether a
wound is healing or worsening and suggest a professional action. **This is not a medical diagnosis.**

## Honest-stub notice

The wound-vision model is **NOT built or clinically validated yet**. Any accuracy figure is a
**research TARGET / benchmark, never achieved**. The analysis endpoint returns honest
`501 coming_soon`. Certification score: **___%** (BLANK).

---

## Steps

1. **Explain & set expectation.** Chitti: "Sire, I can help you NOTICE how a wound changes over time.
   I am not a doctor and will not diagnose. *This is not a medical diagnosis.* Shall we begin?"

2. **Golden-Rule camera confirm (MANDATORY).** **"Sire, shall I open the camera? Haan / Nahi."**
   Wait for explicit haan OR a tap on ✅. Mute-safe. **Never default to yes. Silence = wait.**

3. **Establish baseline.** If this is the first capture, mark it as the **baseline** — the reference
   point all future captures compare against. Note date/time automatically.

4. **Scale reference (required for wounds).** Place a coin (₹5 ≈ 23 mm) or a marked ruler **flat**
   beside the wound, in the same focal plane, so width/length can be estimated each time.

5. **Consistent framing.** Same distance, same angle, same lighting as the baseline where possible —
   Chitti shows/speaks the previous framing so the user can match it.

6. **Capture confirm (Golden Rule).** **"Sire, shall I capture this photo now? Haan / Nahi."**
   Capture only on explicit haan / tap.

7. **Quality check.** If blurry / dark / glare: "The photo is not clear — shall I retake?
   Haan / Nahi" → return to Step 4.

8. **Healing-rate estimate (NOTICE, not diagnose).** Comparing against baseline, Chitti notices
   whether the wound size/colour appears to be **shrinking (healing)**, **unchanged**, or **growing
   (worsening)**, and over what number of days. **No disease names, no certainty.**

9. **Diabetic infection screen (pattern flags only).** Chitti NOTICES warning patterns commonly
   associated with infection or poor diabetic healing and flags them for professional evaluation —
   e.g. **spreading redness, swelling, pus/discharge, foul smell, blackened tissue, no improvement
   after several days, increasing pain, or fever reported by the user.** Chitti says these are
   patterns to show a doctor — **never** "you have an infection."

10. **Save confirm (Golden Rule).** **"Sire, shall I save this to your Chitti Health File timeline?
    Haan / Nahi."** Save only on confirm. Images **AES-256-GCM encrypted at rest, user-owned, never
    sold**.

11. **Deliver the output box** (see template) with confidence + plain-language explanation + suggested
    action + disclaimer; box carries `data-chitti-response` + 🔊 / 🤖 / 👍 / 👎.

12. **Escalation check.** If any SOP-005 trigger is met (spreading infection signs, blackened tissue,
    fever, severe pain), hand off to **SOP-005** immediately.

---

## Voice-guided variant (blind users)

- Every step spoken (Voice OUT) and accepts spoken input (Voice IN); every prompt also accepts a tap.
- Confirms (Steps 2, 6, 10) read aloud; wait for haan / tap; never auto-proceed.
- **Framing audio aid:** Chitti recalls the baseline framing aloud — "last time you held it at arm's
  length, scale on the left — match that… up a little… hold… good."
- Healing-rate and infection-screen results read aloud in full via 🔊.
- Status paired with icon + text, never colour alone: 🟢 healing · 🟡 monitor · 🔴 seek care.

---

## Analysis output template (every box must carry this)

```
🔊 / 🤖 / 👍 / 👎   (per-response widget — data-chitti-response)

Baseline date: <date of first capture>
What Chitti noticed: <size/colour change vs baseline, plain language, no disease name>
Healing rate: <appears shrinking / unchanged / growing> over <N> days
Infection-screen flags: <none / list of pattern flags noticed — for professional evaluation>
Confidence: <low / medium / high>   ← honest stub: a TARGET, not achieved
Suggested action: 🟢 monitor  /  🟡 consider consult  /  🔴 seek care

⚠️ This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.
```

## Cross-links

- Feeds the **Chitti Health File** timeline (baseline + every follow-up in one wound thread).
- Cross-links to **Chitti MedUPI** (Jan Aushadhi dressings/antibiotics by prescription) and
  **Chitti Government** (PMJAY) for affordable care.
