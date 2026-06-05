**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# SOP-001 — Skin Check

> Part of **Chitti Health Scanner** (Chitti MedUPI family) · COSDF v1.0 · Level 7 (Standard Operating Procedures)
> Brand palette: Saffron `#FF9933` · Navy `#000080` · Green `#138808`
>
> **Golden line:** *Chitti helps you notice — doctors help you heal.*
> **Chitti DETECTS / NOTICES patterns and ESCALATES to professionals. Chitti NEVER diagnoses.**

---

## Purpose

Guide a user (or a blind user, voice-first) through capturing a clear, well-lit photo of a skin
concern so Chitti can NOTICE patterns (colour, border, texture, change) and suggest a professional
action. **This is not a medical diagnosis.**

## Pre-conditions

- User has opened **Chitti Health Scanner** (inside Chitti MedUPI).
- User Disability Profile loaded (blind / deaf / mute / illiterate flags honoured).
- Language render = ONE pure language (no Hinglish). Brand/technical terms stay English
  (Chitti, DeepSeek, AI, UPI, DPDP, ABDM, AES-256-GCM).

## Honest-stub notice

The skin-vision model is **NOT built or clinically validated yet**. Any accuracy figure (research
target ~95% on lighter skin) is a **research benchmark / TARGET, never an achieved score**. The
analysis endpoint returns an honest `501 coming_soon`. Certification score: **___%** (BLANK).

---

## Steps

1. **Explain & set expectation.** Chitti says: "Sire, I can help you NOTICE patterns on your skin.
   I am not a doctor and I will not diagnose. *This is not a medical diagnosis.* Shall we begin?"

2. **Golden-Rule camera confirm (MANDATORY).** Chitti asks: **"Sire, shall I open the camera?
   Haan / Nahi."** Wait for explicit voice **haan** OR a tap on ✅. Mute-safe (tap works).
   **Never default to yes. Silence = wait, forever.** Do not open the camera until confirmed.

3. **Lighting & framing.** Guide the user: bright, even, natural light; no shadow over the spot;
   hold steady ~15–20 cm away; fill the frame with the area of concern.

4. **Scale reference (recommended).** Place a common scale reference beside the spot — a coin
   (₹5 coin ≈ 23 mm) or a fingernail — so size can be estimated. Keep it flat and in focus.

5. **Capture confirm (Golden Rule).** Chitti asks: **"Sire, shall I capture this photo now?
   Haan / Nahi."** Capture only on explicit haan / tap.

6. **Quality check.** Chitti checks focus and lighting. If blurry / too dark / glare, Chitti says:
   "The photo is not clear — shall I retake? Haan / Nahi" and returns to Step 3.

7. **Notice patterns (DETECT, never diagnose).** Chitti notes colour variation, border regularity,
   texture, and (if a baseline exists) change over time. **No disease names. No "you have …".**

8. **Save confirm (Golden Rule).** Chitti asks: **"Sire, shall I save this to your Chitti Health
   File timeline? Haan / Nahi."** Save only on confirm. Images are **AES-256-GCM encrypted at rest,
   user-owned, never sold**.

9. **Deliver the output box** (see template) — every analysis box carries `data-chitti-response`
   and the 🔊 / 🤖 / 👍 / 👎 widget, with confidence + plain-language explanation + suggested action
   + the disclaimer.

10. **Honest limitation note.** Chitti states: "AI is less accurate on darker (Fitzpatrick IV–VI)
    skin tones — please weigh this and consult a professional." Never hide this.

---

## Voice-guided variant (blind users)

- Every step above is **spoken** (Voice OUT) and accepts **spoken** input (Voice IN); every prompt
  also accepts a tap (mute-safe).
- Step 2 / 5 / 8 confirms are read aloud: *"Sire, shall I open the camera? Say haan, or tap the green
  tick."* Wait for haan / tap. Never auto-proceed.
- **Framing audio aid:** Chitti gives continuous spoken guidance — "move up… a little left… hold…
  good, centred" — to help frame without sight.
- The output box is **read aloud in full** (confidence + explanation + action + disclaimer) via 🔊.
- Pair every status with icon + text, never colour alone:
  🟢 normal · 🟡 monitor · 🔴 seek care.

---

## Analysis output template (every box must carry this)

```
🔊 / 🤖 / 👍 / 👎   (per-response widget — data-chitti-response)

What Chitti noticed: <plain-language pattern description, no disease name>
Confidence: <low / medium / high>   ← model is an honest stub: confidence is a TARGET, not achieved
Plain-language explanation: <one or two simple sentences>
Suggested action: 🟢 monitor  /  🟡 consider consult  /  🔴 seek care
Note: AI is less accurate on darker (Fitzpatrick IV–VI) skin tones.

⚠️ This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.
```

## Escalation hook

If the noticed pattern meets any SOP-005 trigger (rapid change, bleeding, non-healing, severe pain),
hand off to **SOP-005 — Emergency Escalation** immediately. Never say "this is cancer" → always say
**"this pattern requires professional evaluation."**

## Cross-links

- Feeds the **Chitti Health File** timeline.
- Cross-links to **Chitti MedUPI** (Jan Aushadhi) and **Chitti Government** (PMJAY) for affordable care.
