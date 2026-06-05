**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# SOP-006 — Doctor Referral

> Part of **Chitti Health Scanner** (Chitti MedUPI family) · COSDF v1.0 · Level 7 (Standard Operating Procedures)
> Brand palette: Saffron `#FF9933` · Navy `#000080` · Green `#138808`
>
> **Golden line:** *Chitti helps you notice — doctors help you heal.*
> **Chitti DETECTS / NOTICES patterns and ESCALATES to professionals. Chitti NEVER diagnoses.**

---

## Purpose

Decide **when to refer** the user to a professional and generate a clear, honest **referral-language
summary** the user can show a doctor/dentist. Chitti hands the noticing to a human — it does not
prescribe, diagnose, or guarantee. **This is not a medical diagnosis.**

## Honest-stub notice

The vision models are **NOT built or clinically validated yet**; referral is based on conservative
pattern flags framed as TARGETS. Certification score: **___%** (BLANK).

---

## When to refer

Refer the user (🟡 consider consult / 🔴 seek care) when any of these is true:

1. **Any SOP-005 trigger** is met (bleeding, rapid change, non-healing, infection signs, severe pain,
   ulceration, very-different mole, facial/oral swelling, user feels unwell).
2. **Low confidence + a concerning pattern** — Chitti is unsure and the pattern is not clearly benign.
3. **Persistent pattern** — a noticed change continues or recurs across timeline captures.
4. **User anxiety / preference** — the user wants a professional opinion. Always honour this.
5. **Outside Chitti's competence** — anything systemic, internal, or beyond a surface visual pattern.
6. **Darker-skin caution** — on Fitzpatrick IV–VI tones where AI is less accurate, lean toward referral.

> Default to referral when uncertain. Referring is never the wrong call.

## Steps

1. **Explain the referral.** Chitti: "Sire, I have noticed a pattern that a professional should look
   at. *This is not a medical diagnosis* — let me prepare a short summary you can show your doctor."

2. **Generate the referral summary** using the template below — plain language, no verdict, no
   disease name, no prescription. Pull the noticed patterns, timeline, and scale-reference notes.

3. **Read-back & consent (Golden Rule).** Chitti reads the summary back and asks: **"Sire, shall I
   save and share this referral summary? Haan / Nahi."** Save/share only on explicit haan / tap.
   Mute-safe; **never default to yes; silence = wait.**

4. **Offer affordable pathways** (cross-links): **Chitti Government** (PMJAY) and **Chitti MedUPI**
   (Jan Aushadhi).

5. **Save to timeline.** On confirm, save the referral note to the **Chitti Health File** timeline.
   AES-256-GCM encrypted at rest, user-owned, never sold.

6. **No reminder without consent.** If offering a follow-up reminder, that too is a Golden-Rule
   confirm: **"Sire, shall I set a reminder to re-check / to see the doctor? Haan / Nahi."**

---

## Referral language template (use verbatim structure; fill the brackets)

```
CHITTI HEALTH SCANNER — REFERRAL SUMMARY (for a healthcare professional)

This summary was prepared by Chitti, an AI assistant. It is NOT a medical diagnosis.
Chitti notices patterns; it does not diagnose, prescribe, or replace a clinician's judgement.

Patient note: <name / age if shared by user — optional, user-owned>
Date prepared: <date>
Body area / tooth / wound location: <plain-language location>

What Chitti noticed (patterns only, no verdict):
  - <pattern 1, plain language>
  - <pattern 2, plain language>

Timeline (if tracked):
  - Baseline <date>: <observation>
  - Latest  <date>: <observation / estimated change / growth or healing rate>

Scale reference used: <coin ₹5 ≈ 23 mm / ruler / none>
AI confidence: <low / medium / high>  (honest stub — a research TARGET, not a validated score)
Limitation noted: AI is less accurate on darker (Fitzpatrick IV–VI) skin tones.

Reason for referral: <which trigger / why a professional opinion is requested>
Chitti's words: "This pattern requires professional evaluation."

Requested of the professional: please examine and advise. Chitti does not prescribe or diagnose.

⚠️ This is not a medical diagnosis. Chitti helps you notice — doctors help you heal.
This is not an emergency service. If this is a medical emergency, call your local emergency number.
```

---

## Voice-guided variant (blind users)

- The referral need and reason are spoken via 🔊 in the user's language.
- The full referral summary is **read aloud** before saving/sharing (read-back), then the consent
  confirm is spoken: *"Sire, shall I save and share this? Say haan, or tap the green tick."*
- **Wait for haan / tap; never auto-proceed.** Mute users use the tap path.
- Affordable-pathway cross-links and any reminder offer are spoken and tap-confirmable.

## Cross-links

- Receives hand-offs from **SOP-005 — Emergency Escalation** and all scan SOPs (001–004).
- Feeds the **Chitti Health File** timeline.
- **Chitti Government** (PMJAY) · **Chitti MedUPI** (Jan Aushadhi).
