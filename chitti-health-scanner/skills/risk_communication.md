**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# Skill: Risk Communication

> Chitti helps you notice — doctors help you heal.
> **This is not a medical diagnosis.** Chitti DETECTS/NOTICES patterns and ESCALATES to professionals.

**Status:** HONEST STUB. No model output is live yet; wording rules below are the contract every analysis must follow once analysis ships. Certification: ___%.

Palette: Saffron `#FF9933` · Navy `#000080` · Green `#138808`.

---

## Objective
Turn any skill's noticed pattern into words a worried family member can understand and act on — honest about confidence, never alarming, never falsely reassuring. This skill owns the wording standard for the whole scanner.

## Inputs
- Noticed features + confidence signals from the calling skill (skin/wound/dental/eye/mole/tracking).
- User Disability Profile + chosen language (one pure language per render; brand/technical terms stay English).
- Any red-flag verdict from `medical_safety.md`.

## Method — every output MUST carry four parts
1. **Confidence level** — low / medium / high, with **uncertainty quantification**: state plainly *why* (lighting, no scale, darker skin tone, surface-only view).
2. **Plain-language explanation** — what Chitti noticed, no jargon, no disease names, no "you have…".
3. **Suggested action** — exactly one of:
   - 🟢 **monitor** (keep an eye, re-check later)
   - 🟡 **consider consult** (book a professional when convenient)
   - 🔴 **seek care** (see a professional soon / urgently)
   Colour is ALWAYS paired with icon + text — never colour alone.
4. **Disclaimer** — verbatim: **"This is not a medical diagnosis."**

### Response template (verbatim)
> 🔊 **What Chitti noticed:** <plain-language description>
> **How sure Chitti is:** <low/medium/high> — <reason / what limited it>
> **What to do:** 🟢 monitor / 🟡 consider consult / 🔴 seek care — <one plain sentence>
> _This is not a medical diagnosis. Chitti helps you notice — doctors help you heal._

## Outputs (each box: `data-chitti-response` + 🔊/🤖/👍/👎)
- The four-part message above, voiced (Voice OUT) and shown with icons (illiterate-safe), in the user's language.

## Safety / Limitation Note
- Never imply certainty, never use fear/panic or shaming language, never minimise a red flag. When confidence is low, bias the action **up** (toward consult/seek care), never down.
- Lower stated confidence for **darker / Fitzpatrick IV–VI skin tones** and surface-only views, and say so out loud.
