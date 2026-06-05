🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# SKILL (COSDF L5) — Accessibility Domain

Makes every diagnosis usable by the four-user floor — **blind, deaf, mute,
illiterate** — plus seniors and limited-mobility riders. It does not change *what*
Chitti concludes; it changes *how* the conclusion is delivered. Targets
**>99% task success** for blind/deaf/illiterate riders.

Framework: [../../CHITTI_MECHANIC_COSDF.md](../../CHITTI_MECHANIC_COSDF.md) (LEVEL 5 +
LEVEL 12). Locks: [../../SAHAYAI_MASTER.md](../../SAHAYAI_MASTER.md) §2 + §7.

---

## 1. Domain principles
- **Diagnosis is identical for every user; only the modality adapts.** A blind
  rider and a sighted rider get the same fault, band, can-I-ride and DIY tier.
- **Vaani is the sole user surface (LOCKED §2c).** Voice-in + voice-out is the
  primary path; the HTML page is dev/debug/parity. Accessibility is delivered
  through the substrate, not re-coded per page.
- **9 primary live languages** (en, hi, ta, te, bn, mr, gu, kn, ml) + the **26-voice
  Voice Factory substrate** for voice-out. The wider COSDF language list (Portuguese,
  Swahili, Arabic, Yoruba…) is **roadmap**, not claimed live.
- **Never colour alone.** Every severity uses **symbol + word + voice** (🟢 "safe" /
  🔴 "do not ride") so deaf and colour-blind riders are never excluded.
- Inherited substrate (auto-injected, no per-page code): `chitti_a11y.js`
  (language selector, Voice-Required marker, Braille toggle, aria-live),
  `feedback-widget.js` (🔊 / 🤖 / 👍 / 👎 per response box), ISL panel,
  Feature-Discovery box, User Disability Profile prompt.

## 2. Modality matrix (per user) — applied to a bike diagnosis
| User | Input | Output |
|---|---|---|
| 👁️ **Blind** | voice + touch | voice + haptic; can-I-ride spoken FIRST; "I hear grinding" audio cue |
| 🦻 **Deaf** | touch + camera | visual-first text, flashing-red border, ISL/caption; never audio-only |
| 🤫 **Mute** | touch + tappable symptom pictures + presets | visual + voice readback for confirm |
| 📖 **Illiterate** | voice + camera + 👍/👎 | voice + icons only, no text dependency |
| 🧓 **Senior / low-mobility** | voice + large taps (≥48×48px) | simple voice, large text, one-tap SOS |

## 3. Symptom → modality mapping (bike-specific)
- A **tappable symptom picker** (pictures of: dim headlight, smoke, flat tyre,
  warning lamp, leaking fluid) lets a mute or illiterate rider report without typing.
- **Sound complaints** are handled for the deaf via the visual sound-catalogue
  ([sound_recognition.md](./sound_recognition.md)) — they pick the closest described
  sound instead of "listening".
- **Dashboard lights** are handled for the blind by spoken light-picker + spoken
  severity (the deterministic light-picker is LIVE; camera auto-detect is roadmap).
- **Emergency** for a blind rider: one spoken/long-press SOS → family cascade
  (consented), Chitti stays on voice until "safe".

## 4. Confidence-band output (always — accessible form)
- The confidence band is delivered in the user's modality: spoken for blind
  (*"highly likely — battery"*), symbol+word card for deaf, icon+voice for illiterate.
- Per [never-claim-certainty](../guardrails/never-claim-certainty.md), uncertainty is
  expressed clearly in every modality — a blind user hears "not sure, please…", not a
  silent low bar.

## 5. DIY safety-tier output (always — accessible form)
- DIY tier and can-I-ride are delivered symbol+word+voice. A 🔴 "do not ride" is
  spoken AND shown with a flashing border AND haptic (continuous buzz = emergency).
- The DIY steps adapt: blind = numbered voice steps with confirm sounds; illiterate =
  voice + icon steps + "record yourself" verify; deaf = captioned visual steps.

## 6. Swarm agents this skill feeds
Owns the [Accessibility role in the swarm](../swarm/README.md) — it adapts the final
synthesized verdict's **modality** after all other agents (including the
[Safety Agent](../swarm/safety-agent.md)) have decided the content. It never alters
the safety call or confidence — it makes them reachable. Works with every agent's
output as the last delivery stage before the rider.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
