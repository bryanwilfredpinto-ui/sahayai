🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# SKILL (COSDF L5) — Accessibility Domain

The floor under every other skill. A diagnosis that a blind, deaf, mute or illiterate
driver cannot use is **not done**. COSDF L3: blind/deaf/illiterate success **>99%**,
voice-command **>95%**, offline core **100%**. This domain owns the modality matrix
that adapts every verdict — and it is wired into the platform substrate, not bolted on.
Aligns with COSDF L12 (ACCESSIBILITY.md) + [../../SAHAYAI_MASTER.md](../../SAHAYAI_MASTER.md) §7.

## Domain principles
- **Four-user contract is non-negotiable** — Blind / Deaf / Mute / Illiterate. Every
  diagnosis must complete with no sighted, no audio, and no reading dependency.
- **Safety is spoken first, in every modality** — the can-I-drive call leads (see
  [safety.md](safety.md)) so a blind driver hears it before cause/cost.
- **Vaani is the sole user surface** (LOCKED) — the HTML page is dev/debug/parity. The
  accessibility contract is delivered through Vaani's voice + the shared substrate.
- **No colour-only meaning** — every 🟢/🟡/🟠/🔴 ships with an icon **and** a word
  (so deaf+colourblind and illiterate users get it too).
- **One pure language, no Hinglish** ([../../chitti-cto/CTO.md](../../chitti-cto/CTO.md) §5) —
  9 primary live (en, hi, ta, te, bn, mr, gu, kn, ml) + 26-voice substrate. Wider COSDF
  language list (Portuguese, Swahili, Arabic, Yoruba…) = roadmap.
- **Technical terms stay English** (CTO §6) — OBD codes (P0420), DOT date, ABS, SRS,
  DPF, EV, PUC are fingerspelled in ISL and pronounced as letters, not transliterated.

## Modality matrix (per COSDF L12)
| User | Input | Output | Diagnosis adaptation |
|---|---|---|---|
| 👁️ Blind | voice + touch | voice + haptic | safety spoken first; ranked causes read aloud; "say HAAN or tap" |
| 🦻 Deaf | touch + camera/picker | visual text + flashing-red border | symptom **picker** (not "listen & tell me"); captions; ISL panel |
| 🤫 Mute | touch + camera + presets | visual + voice | tap-picker + preset answers; LLM writes, reads back for approval |
| 📖 Illiterate | voice + camera + 👍👎 | voice + icons (🎤📷🔊🚨) | no text required; pictures for symptoms; spoken steps |
| 👁️🦻 Blind+Deaf | touch + haptic | haptic + tactile | 1 buzz=ok, 3=warning, continuous=emergency |
| 👵 Senior | voice + large-touch | voice + large text | no jargon; one-tap; slow, plain steps |

## Domain-specific adaptations Car Doctor must make
- **Sound Doctor for deaf users** → never "record the noise"; offer a **visual symptom
  picker** + photo/video of the part instead ([sound_recognition.md](sound_recognition.md)).
- **Dashboard lights for illiterate users** → tap the matching **picture** of the light,
  not its name; Chitti speaks the meaning.
- **DIY steps for blind users** → spoken one step at a time, "say done to continue,"
  haptic confirm; no "see the diagram" without an audio description.
- **Emergency for all** → family-cascade trigger reachable by voice, by one big icon,
  and by haptic — never buried behind reading.

## Outputs this skill must enforce on every other skill's verdict
- **Modality-correct rendering** — the same verdict re-expressed as voice / text+caption /
  icon-only / haptic per the active User Disability Profile.
- **Per-box widget present** — 🔊 / 🤖 / 👍 / 👎 + ✏️/🎙️ on every response card
  (`data-chitti-response`, [../../feedback-widget.js](../../feedback-widget.js)).
- **Icon + word, never colour alone** on the can-I-drive and DIY tiers.

## Swarm agents fed
This skill **is** the [Accessibility role] inside the swarm — it post-processes the FINAL
verdict from every agent ([Engine](../swarm/engine-agent.md) … [Safety](../swarm/safety-agent.md))
into the user's modality. It cannot change the diagnosis or weaken a Safety call — it only
re-renders. Works with [Trust](../swarm/trust-agent.md)/QA to confirm required a11y fields
are present before output ships. Substrate: [../../chitti_a11y.js](../../chitti_a11y.js).

## Roadmap (honest stubs — COSDF §3)
- ISL **camera** recognition (signing → diagnosis) = roadmap; ISL **playback** panel +
  dictionary are LIVE. Community-donated voices replace Bhashini over time (Voice strategy
  LOCKED). Wider language list beyond the 9 primary = roadmap.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
