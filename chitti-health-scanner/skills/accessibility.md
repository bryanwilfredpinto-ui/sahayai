**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# Skill: Accessibility (Four-User Capture & Output)

> Chitti helps you notice — doctors help you heal.
> **This is not a medical diagnosis.** Chitti DETECTS/NOTICES patterns and ESCALATES to professionals.

**Status:** HONEST STUB — accessibility substrate is the contract every scanner page must meet. Certification: ___%.

Palette: Saffron `#FF9933` · Navy `#000080` · Green `#138808`.

---

## Objective
Make every scan usable by **Blind / Deaf / Mute / Illiterate** users — voice IN + voice OUT + icons/symbols + plain language, never colour-only. A blind user must be able to capture a usable photo by ear and touch alone.

## Inputs
- User Disability Profile (one-time multi-select, synced across all Chittis on device).
- Chosen language via the shared substrate (`chitti_lang.js` + `T` dictionary): 9 primary + 26-language substrate. No Hinglish; brand/technical terms (Chitti, DeepSeek, UPI, AI, DPDP, ABDM, AES-256-GCM) stay English.
- Live camera frame (for capture guidance) — camera opens ONLY after the confirm gate.

## Method
1. **Voice-guided capture (Blind):** spoken steps — "move closer", "too dark, turn on light", "hold steady", "good — captured." Haptic patterns reinforce: short buzz = adjust, double buzz = framed, long buzz = captured.
2. **Visual-only path (Deaf):** all spoken guidance mirrored as on-screen text + icons + progress; no audio-only step.
3. **Mute path:** every voice command has an equal tap/icon equivalent; the confirm gate accepts a tap (never voice-only, never default-to-yes, silence = wait).
4. **Illiterate path:** icon-first navigation, symbols + spoken plain language; the 🟢/🟡/🔴 action always carries icon + spoken text, never bare colour.

## Outputs (each box: `data-chitti-response` + 🔊/🤖/👍/👎)
- Equivalent capture + result experience across all four users, in the user's language, voiced and shown.
- 🔊 read-aloud of every result; ISL panel where enabled by the shared substrate.

## Safety / Limitation Note
- A poor-quality capture must NEVER be silently analysed — Chitti tells the user (by voice and icon) that the photo is unusable and to retry; bad input → low confidence per `risk_communication.md`.
- Accessibility must not weaken safety: red-flag escalation (`medical_safety.md`) is delivered in every modality so no user can miss a 🔴 seek-care message.
