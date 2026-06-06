# VISION — Chitti Vaani

> **Level 1** of the CEOS governance stack.
> Sourced from [`SAHAYAI_MASTER.md`](../SAHAYAI_MASTER.md) §2 locked decisions,
> [`CHITTI_SOP.md`](../CHITTI_SOP.md) §1, [`CONTEXT.md`](CONTEXT.md),
> and [`README.md`](README.md).

---

## Mission

Give every Indian a voice-first dost who handles any life task — in their language,
for their disability, at 2G, in the dark, in an emergency — without them ever
needing to know which app to open.

The mission has three nouns, not three features:

1. **One dost** — a single conversational relationship that routes every capability
2. **Every capability** — commerce, health, legal, government, news, safety, and 10 more — assembled, not siloed
3. **One conversation** — the user speaks; Vaani acts; the screen is optional

A general-purpose voice assistant does noun 1 for English-first, sighted,
urban users with full motor control. Nobody does all three nouns for the 500
million Indians whose first language is not English and whose disability, age, or
connectivity situation breaks every other product. Chitti Vaani does all three.

---

## Vision statement

A world where the same product opens for —

- A **70-year-old blind woman in rural Bihar**, speaking Maithili, needing to
  know which government scheme she qualifies for
- A **deaf delivery rider in Chennai**, reading captions on a cracked screen,
  needing to share his live location with his wife
- A **mute teenage girl in Pune**, using tap input and ISL symbols, needing
  to call her brother without speaking a word
- A **semi-literate farmer in Vidarbha**, speaking Marathi in a slow voice,
  needing to check his PM-Kisan instalment

— and ALL four hear / see, in their own language and modality:

> *"Understood. Doing it now — shall I confirm? Say haan to proceed."*

That is the product. Anything that does not render that sentence for all four
users is a bug.

---

## The shift — from assistant to dost

### Where Chitti Vaani was (Phase 1, May 2026)

A multilingual voice assistant with a DeepSeek conversational core, 9
first-class languages, 5 Pro Action cards (call / SMS / WhatsApp / UPI /
email), a 24/7 emergency cascade, and a local-business directory that
queries the Chitti shop network before falling back to Zomato, Swiggy, Ola.

At this stage Vaani was one well-built voice app among many.

### Where Chitti Vaani is going (Phase 2 + Phase 3)

The **Vaani-sole-interface principle** (locked 2026-05-15) transforms it
from a well-built voice app into the **nervous system** of the sahayai.in
platform:

```
User speaks one sentence to Vaani
      ↓
Vaani classifies intent → routes to 1 of 14 internal Chittis
      ↓
Chitti reply returns to Vaani
      ↓
Vaani reads it aloud in user's language
      ↓
User never opened a second tab
```

At Phase 3, Chitti Vaani is no longer competing with Siri, Google
Assistant, or Alexa. It becomes the **Bharat Premium AI** — the product
that does for the next 500 million what Siri does for iPhone users in
English, but better: multi-language, accessibility-first, safety-first,
local-economy-first.

---

## What "Bharat Premium AI" means concretely

| Dimension | Floor today | Target |
|---|---|---|
| Languages | 9 first-class in conversational API; 26 via Voice Factory | 26 first-class + community voices (Voice Factory Phase 3) |
| Accessibility | Blind + Deaf + Mute + Illiterate (all served via web) | + Elderly mode + Low Vision + Blind+Deaf + Cognitive; Android Phase 2 OS-level bypass |
| Intent domains | 14 Chittis (commerce, health, legal, CA, government, news, tech, safety, finance, fashion, mechanic, scanner, voice, shares) | All Chitti capabilities served via one conversational turn |
| Emergency | Web: `tel:` cascade + Chitti-to-Chitti relay via `/poll` | Android Phase 2: on-device Vosk keyword spotting + FCM relay that fires even when the screen is off |
| Connectivity | Online, 4G-optimised | Phase 2: service-worker offline cache for emergency + basics; `effectiveType <= 2g` graceful mode |
| Voice supply | mock_bhashini → real Bhashini cascade | Community-donated voices replace Bhashini per language as quality threshold is crossed (Voice Factory Hall of Fame) |

The floor is what ships today on `sahayai.in/chitti_vaani.html`. The target
is what the Voice Factory, Swarm Intelligence, and Android Phase 2
buildout earns over time.

---

## Four-user contract

The four-user contract is not a feature. It is a design law.

| User | Floor requirement |
|---|---|
| **Blind** | Voice-first mode auto-activates from `disability_profile.blind`; every state change spoken; never colour-only feedback |
| **Deaf** | Captions in user's script + symbol cues on every state change; ISL Phase 1 panel on every response box |
| **Mute** | Tap / typed input accepted everywhere; Chitti speaks on the user's behalf; outbound calls open with self-ID, never impersonation |
| **Illiterate** | Symbols + voice readback for every UI label; never assumes reading order; Face-emoji affordances where literacy would otherwise be a gate |

The **elderly** user is the integration test — they hit every constraint
simultaneously (narrow hearing range, slower speech recognition, less text
comprehension, smaller motor precision). A feature that passes the elderly
test passes the four-user contract.

---

## What success looks like — in one sentence per persona

- **Blind Bihar grandmother**: opens the page, Voice-First Mode auto-activates,
  hears today's PM-Kisan status and which scheme she qualifies for, never
  touches the screen.
- **Deaf Chennai delivery rider**: taps the location card, sees a caption
  confirming his live location was shared over WhatsApp to his wife, gets an ISL
  symbol confirmation — never needed audio.
- **Mute Pune teenager**: taps the call card, types her brother's name, sees the
  readback caption, taps Haan — Chitti calls on her behalf and says *"Namaste,
  main Chitti hun."*
- **Vidarbha farmer**: says *"PM Kisan ka paisa kab aayega?"* in Marathi, hears
  the answer spoken back, says *"theek hai"*, the session ends.

Same product. Same code path. Different rendering.

---

## What this product refuses to become

- An assistant that auto-acts without the user's explicit haan. (Golden Rule — constitutional.)
- An assistant that dials cops, ambulance lines, or government emergency numbers autonomously. (Family cascade — constitutional.)
- An assistant that impersonates the user on an outbound call. (Identity — constitutional.)
- An assistant that stores or reads back a UPI PIN. (PIN ceremony — constitutional.)
- An assistant that skips the ISL panel or the per-response widget because the feature is "good enough". (Four-user contract — constitutional.)
- A super-app that locks the user into the sahayai.in ecosystem. Each Chitti is independently auditable; Vaani is the router, not the jailer.

---

Last reviewed: 2026-06-06