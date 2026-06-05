🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# ACCESSIBILITY — COSDF L12 · Modality Matrix + 4 Interface Modes + Languages

**COSDF Level 12 ([../CHITTI_MECHANIC_COSDF.md](../CHITTI_MECHANIC_COSDF.md) §L12) applied to Chitti
Bike Doctor.** This file is the **index + contract** for the four-user accessibility floor. The
per-user detail lives in [accessibility/](accessibility/) — this file maps the COSDF L12 modality
matrix, the four interface modes, the language tiers, and the testing protocol onto those existing
docs. It does not duplicate them.

> A bike breaks down for blind, deaf, mute and illiterate riders too — and they have **no app** to help
> them. Chitti does. Accessibility is the **floor under everything**, not an asterisk
> ([SAHAYAI_MASTER.md §7](../SAHAYAI_MASTER.md)). A safety verdict a deaf rider can't perceive, or a
> diagnosis a blind rider can't hear, is a **defect** — not a limitation.

## The per-user docs (index — detail in `accessibility/`)

| User | Hero path | Detail doc |
|---|---|---|
| 👁️ Blind | sound-first, voice-out diagnosis | [accessibility/blind_user.md](accessibility/blind_user.md) |
| 🦻 Deaf | visual-first; text + symbols + ISL; 🔴 unmissable | [accessibility/deaf_user.md](accessibility/deaf_user.md) |
| 🤫 Mute | whole diagnosis by photo + tap; tap-confirm SOS | [accessibility/mute_user.md](accessibility/mute_user.md) |
| 📖 Illiterate | voice + picture menus; zero reading; 2G-ready | [accessibility/illiterate_user.md](accessibility/illiterate_user.md) |

## COSDF L12 modality matrix (input → output, per user)

| User | Input modality | Output modality | How Chitti delivers it |
|---|---|---|---|
| 👁️ Blind | voice + touch | voice + haptic | spoken diagnosis; **safety call spoken FIRST**; "say HAAN when done" stepping; auto-announce on open |
| 🦻 Deaf | touch + camera | visual + text | captions per line; verdict = symbol **+ word** (never colour-only); ISL panel per box; 🔴 = symbol + word + **screen flash** |
| 🤫 Mute | touch + camera + presets | visual + voice | photo + tap symptom picker; Golden-Rule confirm accepts a **tap**; family-cascade SOS by big tap button |
| 📖 Illiterate | voice + camera + thumbs | voice + icons | every label spoken; picture symptom menu; "say HAAN" + big tap; works on 2G |
| 👁️🦻 Blind+Deaf | touch + haptic | haptic + tactile | **roadmap** — haptic confirm patterns + tactile cues; documented honestly, not yet claimed live |
| 👴 Senior | voice + large-touch | voice + large-text | large taps (≥48×48px), no jargon, one-tap emergency |

## The four interface modes (COSDF L12)

| Mode | What it means | Implementation |
|---|---|---|
| **Voice-First** | no visual dependency; confirm sounds; haptic | spoken cause + safety + DIY + cost; "say HAAN" stepping; `chitti_a11y.js` read-page |
| **Visual-First** | captions, flashing-red border, icons, ISL/caption guides, colour **+ word** | per-line captions; 🔴/🟠/🟢 symbol+word; `chitti_isl.js` panel per `data-chitti-response` box; screen flash on a 🔴 verdict |
| **Icon-First** | 🎤 📷 👍 👎 🔊 🚨 — no text required | picture symptom menus; tappable narrowing questions; SOS as a single button |
| **Haptic** | 1 buzz = success · 3 = warning · continuous = emergency | **roadmap** — accessibility hook documented; haptic library funding-gated; voice/visual cover the floor today |

The five mandatory box-elements ([CTO.md §Mandatory 5 Elements](../chitti-cto/CTO.md)) ride **every**
response box via the substrate: 🔊 speaker · 🤖 Chitti-explain · 👍/👎 · ✏️ type / 🎙️ voice ·
🌐 language selector. No box ships without them
([per-response widget LOCK](../SAHAYAI_MASTER.md)).

## Languages (COSDF L12 — platform-locked tiers)
COSDF L12 lists a wide language set (Roman-Urdu, Portuguese, Russian, French, Swahili, Arabic,
Yoruba/Hausa/Igbo, Mandarin…). On this platform that wider list is **roadmap**. Live today, anchored to
Chitti Vaani ([CTO.md §5 No-Hinglish](../chitti-cto/CTO.md)):

| Tier | Languages | Status |
|---|---|---|
| **9 primary (live)** | English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam | ✅ full UI-string translation; functional labels in native script |
| **26-voice substrate** | + Punjabi, Odia, Urdu, Assamese, Bhojpuri, Sanskrit, Santali, etc. | ✅ voice-out via Voice Factory; selector auto-enriches (`chitti_lang.js`) |
| **Wider COSDF list** | Portuguese, Swahili, Arabic, Yoruba, Mandarin, … | 🟡 **roadmap** — never claimed live |

**No Hinglish (LOCKED):** every response renders in **one pure language** — never mix scripts in a
sentence ("aapka portfolio dekho" is banned). Technical terms stay in English (UPI, ABS, OBD2, RPM,
brand/model names, drug-style salts) and are translated nowhere — they are fingerspelled in ISL and
pronounced as English letters in TTS ([CTO.md §5-6](../chitti-cto/CTO.md)).

## Testing protocol (COSDF L12)
COSDF L12 specs **5 blind + 5 deaf + 5 illiterate users × 20 tasks**; success = the core flow with **no
sighted / audio / reading dependency.** Our implementation
([evals/accessibility_eval.md](evals/accessibility_eval.md)):

| Layer | Method |
|---|---|
| **Automated** | cert script runs the 5 frontend gates ([QUALITY_STATUS.md §1a](../QUALITY_STATUS.md)) + screenshots @375px |
| **Manual — blind** | TalkBack pass: onboard by voice → "engine se awaaz" → hear ranked causes + safety + DIY + cost; **zero** sighted assistance |
| **Manual — deaf** | muted device: full diagnosis by text + symbols + ISL; 🔴 verdict unmistakable (symbol + word + flash); ISL panel on every box |
| **Manual — mute** | mic disabled: onboard → photo dashboard → tap symptoms → tap-confirm RSA → tap-fire family SOS |
| **Manual — illiterate** | 2G throttle, regional language, no-reading: complete the breakdown flow by ear + pictures, incl. tap/voice family SOS |

**Pass bar = 100%.** Any single barrier for any of the four users = RED = blocks release. The five
platform gates (G1 feedback-widget + `data-chitti-response` · G2 chitti_a11y.js · G3 Disability Profile
prompt · G4 language auto-detect · G5 ISL plugin) must all be GREEN
([accessibility_eval.md §Platform 5-gate](evals/accessibility_eval.md)).

## Platform locks on accessibility (LOCKED — §7)
- **Voice in + voice out + symbols + plain language** — never colour-only, never audio-only, never
  reading-required.
- **One-time Disability Profile** (blind/deaf/mute/ISL/illiterate/elderly/limited-mobility/cognitive) on
  first visit to any Chitti page; saved locally, synced on-device, never re-asked.
- **Golden Rule (§2g):** every side-effecting action (SOS / RSA dial / alarm) gates on
  `chittiConfirmAndDo()` and accepts a **tap or a spoken HAAN** — never voice-only, never auto-Yes.
- **Emergency = family cascade, NEVER auto-dial cops/112/100/108**
  ([guardrails/emergency-protocol.md](guardrails/emergency-protocol.md)).

## Status
🟡 **YELLOW** — modality matrix + four modes + language tiers + testing protocol authored; the five
frontend gates inherit via the `chitti_a11y.js` substrate (🟢 inherited). The manual
3×5-user × 20-task panel and the Blind+Deaf haptic mode are **pending / roadmap** — documented honestly,
never claimed measured.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
