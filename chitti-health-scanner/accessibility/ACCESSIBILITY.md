**World Class Chitti Health Scanner — Commando Discipline. Zero Excuses.**

# Chitti Health Scanner — Accessibility (COSDF Level 12)

> Golden line: **"Chitti helps you notice — doctors help you heal."**
> Every analysis carries a confidence level + plain-language explanation + suggested action + the disclaimer *"This is not a medical diagnosis."*

**Brand palette:** Saffron `#FF9933` · Navy `#000080` · Green `#138808`.

A health scanner that a sighted, literate, hearing person can use is a *demo*. A health scanner that a **blind grandmother**, a **deaf teenager**, a **mute farmer**, and a person **who cannot read** can each complete unaided is a **product**. Level 12 is the gate that turns the demo into the product. It is enforced against the **four-user contract** (Blind / Deaf / Mute / Illiterate) and the **eight gates**.

---

## 12.0 Honesty banner (read before anything)

The AI vision models behind the Scanner are **NOT built or clinically validated yet**. Accuracy targets in any sibling doc (skin, dental, eye, etc.) are **research benchmarks / TARGETS**, never achieved metrics. Backend analysis endpoints return an honest `501 coming_soon`. **Accessibility itself, however, ships from day one** — the capture, voice, icon, haptic and language scaffolding below is real working substrate (`chitti_a11y.js`, `chitti_lang.js`, `feedback-widget.js`, Voice Factory), because a blind user must be able to *operate* the camera even while the analysis result honestly says "coming soon."

The certification score for this level stays **BLANK** until the testing protocol in §12.6 is actually run:

| Metric | Target | Achieved |
|---|---|---|
| Task completion (all modalities) | > 99% | ___% |
| Blind-only completion | > 99% | ___% |
| Deaf-only completion | > 99% | ___% |
| Illiterate-only completion | > 99% | ___% |
| Voice-out language coverage (live) | 9 primary | ___ |

---

## 12.1 The User Modality Matrix

Every user maps to a row. The Scanner must offer the **primary** path; if it fails (no mic, no speaker, no screen-reader, noisy environment), it must silently offer the **fallback** without ever dead-ending. No row is allowed a "not supported."

| User | Primary INPUT | Primary OUTPUT | Fallback (if primary fails) |
|---|---|---|---|
| **Blind** | Voice command + voice-guided capture ("move closer", "hold still") | Voice-out (Voice Factory) + haptic buzz | Large high-contrast icons + screen-reader (ARIA-live) + haptic |
| **Deaf** | Tap / icon menu + on-screen typed text | Captions + colour-coded urgency **with icon + text** (🟢/🟡/🔴) | ISL animation panel (`chitti_a11y.js` ISL plugin) + haptic |
| **Mute** | Tap / icon menu + typed text + 👍/👎 | Voice-out **or** captions (user choice) | Full icon-only flow; confirm gate via **tap** (mute-safe) |
| **Illiterate** | Voice command + tap on **pictograms** (📷/📖/🔊) | Voice-out + icons; **zero text-only** screens | Icon menu + spoken readback of every choice |
| **Blind + Deaf** | Tap on raised/large targets + voice command attempt | **Haptic Mode** (distinct buzz patterns) | Connected Braille display via screen-reader; caregiver relay |
| **Elderly** | Voice command + **extra-large** tap targets (≥ 48×48 px) | Slow voice-out + large icons + captions | Caregiver / family-cascade assist; simplified 3-button flow |

**Rules baked into the matrix**
- Every interactive control is **≥ 48×48 px** (eight-gate tap-target rule) and reachable at **375 px** width.
- **Never colour-only.** Urgency is always `colour + icon + word`: 🟢 *normal* / 🟡 *monitor* / 🔴 *seek care*.
- The **Golden Rule confirm gate** ("Sire, shall I open the camera? Haan / Nahi") is satisfiable by **voice OR tap**, is **mute-safe**, **never default-to-yes**, and **silence = wait, forever**.
- Every result box carries `data-chitti-response` + 🔊 / 🤖 / 👍 / 👎 (`feedback-widget.js`).

---

## 12.2 Interface Mode 1 — Voice-First (Blind / Illiterate / hands-busy)

Voice-out is rendered by **Voice Factory** (9 primary languages live; 26-language substrate; honest "translation pending" beyond that). Voice-in uses the device recogniser routed through the same language context. **Capture is guided turn-by-turn** so a blind user can frame a body part they cannot see.

### Voice-guided capture script (canonical)
```
Chitti:  "Sire, I can scan your skin. Shall I open the camera? Haan or Nahi."   [confirm gate]
User:    "Haan."
Chitti:  "Opening camera." [haptic: 1 short buzz]
Chitti:  "Hold the phone about one hand-span from the spot."
Chitti:  "A little closer."           [haptic: rising double buzz = getting better]
Chitti:  "Too close — move back slightly."
Chitti:  "Hold still… two… one…"       [haptic: 1 long buzz = locked]
Chitti:  "Captured. [shutter tone]"     [haptic: 1 short buzz = done]
Chitti:  "Shall I save and analyse this image? Haan or Nahi."  [confirm gate — save]
User:    "Haan."
Chitti:  "Saved securely. Analysis is coming soon — Chitti is still learning to read skin safely.
          This is not a medical diagnosis."        [honest 501 spoken plainly]
```
- The script **never** says "you have X." It notices, then escalates.
- Light/blur/framing prompts are **spoken**, not just shown, so they work eyes-closed.
- Every spoken result ends with **confidence + plain explanation + action (monitor / consider consult / seek care) + the disclaimer**.

### Haptic feedback grammar (paired with the script)
| Pattern | Meaning |
|---|---|
| 1 short buzz | acknowledged / step done |
| Rising double buzz | "getting better — keep going" |
| 1 long buzz | locked / hold still now |
| 3 short buzzes | error — let's retry |
| Long-long-long | 🔴 escalation: please listen, seek care |

---

## 12.3 Interface Mode 2 — Visual-First (Deaf / Hearing-impaired)

Built for users who **cannot rely on audio**. Everything spoken in Voice-First has a **caption equivalent**, and urgency is shown with **colour + icon + word** so it survives colour-blindness and grayscale.

- **Captions:** every Chitti utterance appears as on-screen text in the chosen language (no Hinglish — one pure language per render; brand/technical terms stay English: Chitti, DeepSeek, UPI, AI, DPDP, ABDM, AES-256-GCM).
- **Colour-coded urgency (never colour-only):**
  - 🟢 **Normal** — `#138808` Green + ✅ icon + word "Normal — keep monitoring."
  - 🟡 **Monitor** — `#FF9933` Saffron + ⚠️ icon + word "Monitor — recheck soon."
  - 🔴 **Seek care** — Red + 🚨 icon + word "Seek care — please consult a professional."
- **ISL panel:** the `chitti_a11y.js` ISL plugin animates key terms and the suggested action for Deaf users who prefer sign over text. Honest placeholder animations; never claim sign accuracy.
- **Visual capture aids:** on-screen framing reticle, blur/lighting warning **as text + icon**, and a visible countdown — no audio dependency.
- Captions and ISL **both** restate the four-part result: confidence + explanation + action + *"This is not a medical diagnosis."*

---

## 12.4 Interface Mode 3 — Icon-First (Illiterate / cognitive-load-sensitive / new users)

For users who do not read. The **entire** Scanner is operable from a fixed pictogram menu; tapping any icon triggers a **spoken readback** of what it does before acting (Golden Rule — confirm before side-effect).

### The icon menu
| Icon | Meaning | Action on tap |
|---|---|---|
| 📷 | Scan | "Shall I open the camera? Haan / Nahi" → capture flow |
| 📖 | My health record | reads timeline aloud (feeds Chitti Health File) |
| 🔊 | Read this aloud | re-speaks the current box (Voice Factory) |
| 👍 | This helped | logs positive feedback (`feedback-widget.js`) |
| 👎 | This was wrong / unclear | logs negative feedback + offers help |
| 🚨 | I need help now | escalation: family-cascade / seek-care guidance |
| 🤖 | Ask Chitti about this | DeepSeek-vision explainer, disclaimer-guarded |

- Targets ≥ 48×48 px; high contrast against background; same fixed layout every visit (predictability for cognitive accessibility).
- **No screen is text-only.** Any text is accompanied by an icon and is spoken on focus.
- The 🚨 path **never auto-dials 112/100/102** — it follows the locked emergency protocol (confirm → family cascade), and for medical urgency speaks plain "seek care" guidance.

---

## 12.5 Interface Mode 4 — Haptic Mode (Blind + Deaf / deafblind)

The hardest user. No reliable sight, no reliable hearing — the device communicates almost entirely through **vibration patterns** and large tactile targets, with a connected Braille display where available.

| Buzz pattern | Meaning |
|---|---|
| • (short) | acknowledged |
| • • (rising) | "getting better — keep adjusting" |
| —— (long) | hold still / locked |
| • • • | error — retry |
| —— —— —— (triple long) | 🔴 escalation — seek care; relay to caregiver/family |
| • —— • | confirm gate open — **tap to say Haan**, do nothing to wait |

- Confirm gate in Haptic Mode resolves by **tap = Haan**; absence of tap = **wait forever** (never default-to-yes).
- Where a Braille display is connected via the OS screen-reader, all captioned text (confidence + explanation + action + disclaimer) is mirrored to Braille.
- Capture is best-effort with caregiver-relay fallback from the family cascade; the Scanner honestly states when a deafblind solo capture is not yet reliable.

---

## 12.6 Language Support (mapped to Chitti's real substrate)

Voice and text both flow through the **shared substrate**: `chitti_lang.js` + the `T` dictionary for UI/captions (identical to how **Chitti Vaani** works), and **Voice Factory** for voice-out. **No Hinglish** — one pure language per render; brand/technical terms (Chitti, DeepSeek, UPI, AI, DPDP, ABDM, AES-256-GCM) remain English in every language.

The COSDF P0/P1/P2 tiers map to Chitti reality as follows. We **do not** claim Yoruba/Swahili/other non-Indian languages are live; they are framed as **FUTURE**.

| Tier | COSDF intent | Chitti reality | Status |
|---|---|---|---|
| **P0 — primary** | Must ship first | **9 primary Indian languages**: English, हिन्दी (hi), தமிழ் (ta), తెలుగు (te), বাংলা (bn), मराठी (mr), ગુજરાતી (gu), ಕನ್ನಡ (kn), മലയാളം (ml) — UI via `chitti_lang.js`, voice-out via Voice Factory | 🟢 substrate live (analysis still 501) |
| **P1 — extended** | Broaden reach | **26-language substrate** (additional Indian languages incl. Sanskrit, Oraon, etc.) — UI text where dictionary exists; voice-out per Voice Factory ledger | 🟡 partial — honest **"translation pending"** shown where a string/voice is missing |
| **P2 — global** | International | **Non-Indian languages (e.g. Yoruba, Swahili, Arabic, Spanish)** | ⚪ **FUTURE** — not live, not claimed; community-voice roadmap |

**Honesty rules for language**
- If a UI string or a voice is missing for the chosen language, show **"translation pending"** plainly — never silently fall back to English and pretend it's localised, never machine-fake a voice as if native.
- Voice Factory is the **swappable** provider (Bhashini is temporary; community-donated voices replace it). Tier-C / stub languages **never silently fall back** — they say what's missing.
- A language is only marked 🟢 when **both** caption text **and** voice-out exist for the Scanner's core flow (capture script + four-part result).

---

## 12.7 Accessibility testing protocol

A modality is **not** "done" until a real user in that modality completes the protocol. Until then the score stays **___%**.

### Cohort
- **Blind** users — screen-reader + voice + haptic only (no looking at the screen).
- **Deaf** users — captions + ISL + haptic only (audio muted).
- **Illiterate** users — icon-first + voice only (no reading required).
- (Plus spot checks: Mute via tap/typed; Elderly via large-target/slow-voice; Blind+Deaf via Haptic Mode.)

### Method
- **10 users per modality × 30 tasks each.** Tasks span the full surface: open camera via confirm gate; complete guided capture; understand the four-part result (confidence + explanation + action + disclaimer); switch language; trigger 👍/👎; reach the 🚨 help path; recover from a deliberately induced capture error.
- Measured **unaided** (no facilitator hints). A task counts as passed only if completed solo.

### Targets
| Cohort | Completion target | Achieved |
|---|---|---|
| Blind | > 99% | ___% |
| Deaf | > 99% | ___% |
| Illiterate | > 99% | ___% |
| Overall (all modalities) | > 99% | ___% |

### Pass/fail tie-back
A build **fails Level 12** — and therefore fails handover — if **any** of the following is true:
1. Any Modality Matrix row dead-ends (a user type cannot complete capture → result solo).
2. Any urgency state is conveyed by **colour alone** (missing icon or word).
3. Any confirm gate can **default-to-yes**, time out into yes, or proceed on silence.
4. Any result box lacks `data-chitti-response` + 🔊/🤖/👍/👎, or omits any of confidence / plain explanation / action / *"This is not a medical diagnosis."*
5. Any tap target is **< 48×48 px** or unreachable at **375 px**.
6. A language is marked live without **both** captions and voice-out, or a missing string is hidden instead of shown as **"translation pending."**

This protocol is the Level-12 expression of the **four-user contract** and the **eight gates** (blind × deaf × mute × illiterate × every-box widget × 9+ languages × 375 px × 48×48 px). No Scanner page ships until every gate above is green for every row of the matrix.
