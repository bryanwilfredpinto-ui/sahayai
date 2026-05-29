🎖️ **World Class Chitti PA — Skills**

> *"Chitti aapki dost hai. Aapki guardian. Aapki PA. Mumbai mein kisi bade admi ko jo Chitti milti hai — wahi Chitti aapko milegi. Free. Hamesha."*

## The 4 Users Chitti PA Serves

| User | Challenge | How Chitti PA Helps |
|---|---|---|
| 👁️ Blind | Cannot see UI | WhatsApp voice notes in / voice replies out. Every brief spoken via Voice Factory. |
| 🦻 Deaf | Cannot hear | Full text WhatsApp + ISL animation for every reply via [chitti-isl](../chitti-isl/). |
| 🤫 Mute | Cannot speak | Tap mic → on-device STT → LLM writes → text reply (no voice required). |
| 📖 Illiterate | Cannot read/write | Pure voice loop in their language — receives voice, sends voice. No typing ever. |

---

## Phase 1 Feature Matrix (WhatsApp MVP — launch target 2026-05-01)

| # | Feature | Status | Tested By | Date | Source |
|---|---|---|---|---|---|
| 1 | Smart onboarding (max 7 features at a time, role-based) | ⬜ Skeleton | — | — | §4 master spec |
| 2 | Morning brief (07:00 IST · weather · mandi · 3 reminders · 1 health tip · 1 AI tip) | ⬜ 501 stub | — | — | §5.6 master spec |
| 3 | Call answering + segregation (Personal / Work / Spam / Recruiter) | ⬜ 501 stub | — | — | §5.1 |
| 4 | Spam call blocking (Truecaller API) + weekly digest | ⬜ 501 stub | — | — | §5.1 |
| 5 | Voicemail + Whisper transcription with tags | ⬜ 501 stub | — | — | §5.1 |
| 6 | Recruiter call capture (JD / salary / contact / callback) | ⬜ 501 stub | — | — | §5.1 |
| 7 | Calendar (meetings + reminders + interview tracker) | ⬜ 501 stub | — | — | §5.2 |
| 8 | Document vault (profile-based, on-device only) | ⬜ 501 stub | — | — | §5.3 |
| 9 | Missing-doc check per profile | ⬜ 501 stub | — | — | §5.3 |
| 10 | Govt scheme scanner (auto-eligibility + auto-notify all eligible masters) | ⬜ 501 stub | — | — | §5.4 (delegates to [chitti-government](../chitti-government/)) |
| 11 | Daily-life reminders (medicines · bills · licences · GST / ITR / exam dates) | ⬜ 501 stub | — | — | §5.5 |
| 12 | Information assistant (any question, any language, instantly) | ⬜ 501 stub | — | — | §5.7 |
| 13 | Product Truth Engine — packaged food / cold drinks / baby food / oil / cosmetics | ⬜ 501 stub | — | — | §6.1 (delegates to [chitti-scanner](../chitti-scanner/) + [chitti-medupi](../chitti-medupi/)) |
| 14 | Contract & document analyser (insurance · loan · rent · job offer · school fees) | ⬜ 501 stub | — | — | §6.2 (delegates to [chitti-legal](../chitti-legal/) + [chitti-ca](../chitti-ca/)) |
| 15 | Vehicle purchase advisor (real mileage · TCO · resale · spare parts) | ⬜ 501 stub | — | — | §6.3 (delegates to [chitti-2wheeler](../chitti-2wheeler/) + [chitti-4wheeler](../chitti-4wheeler/)) |
| 16 | App permission checker | ⬜ 501 stub | — | — | §6.4 |
| 17 | Health Guardian — medicine reminders / Dadi Maa wisdom / family alert | ⬜ 501 stub | — | — | §7.1 (delegates to [chitti-medupi](../chitti-medupi/) + [chitti-health-file](../chitti-health-file/)) |
| 18 | Beauty & personal care (skin / hair / sun protection / traditional remedies) | ⬜ 501 stub | — | — | §7.3 (delegates to [chitti-fashion](../chitti-fashion/) if present) |
| 19 | SafeWalk — women safety (location-share / CHITTI DANGER SOS / safe-route) | ⬜ 501 stub | — | — | §8.1 (family-cascade per [emergency lock](../SAHAYAI_MASTER.md)) |
| 20 | QR scam & UPI fraud guardian | ⬜ 501 stub | — | — | §8.2 (delegates to [chitti-upi](../chitti-upi/)) |
| 21 | Elder protection — fraud shield + family alert before large transfer | ⬜ 501 stub | — | — | §8.3 |
| 22 | "Chitti forget everything" — DPDP Act 2023 erase | ⬜ 501 stub | — | — | §12 |
| 23 | Master feedback pipeline | ⬜ 501 stub | — | — | §3 (uses repo-root [feedback-widget.js](../feedback-widget.js)) |
| 24 | Celebration engine — reels for wins (consent-gated) | ⬜ 501 stub | — | — | §13 |

---

## Indian User Support

| Concern | How Chitti PA handles it |
|---|---|
| 10 Phase 1 languages | Hindi · Telugu · Tamil · Kannada · Malayalam · Marathi · Bengali · Gujarati · Punjabi · Odia. Auto-detected, never forced. |
| WhatsApp-native | Phase 1 ships on WhatsApp via AiSensy. Phase 2 graduates to Android + iOS app. |
| Low bandwidth | 2G compatible — text-first, voice-on-demand. |
| Low literacy | Pure voice loop. STT in → LLM reasoning → TTS out. No typing required. |
| DPDP Act 2023 | Postman Principle absolute. Call CONTENT never stored. Private messages never stored. |

## Language Support (via shared substrates)

| Substrate | Path |
|---|---|
| Voice Factory STT/TTS cascade (26 languages) | [chitti-voice-factory/](../chitti-voice-factory/) |
| `chitti_a11y.js` — User Disability Profile + language auto-detect + ISL plugin | [chitti_a11y.js](../chitti_a11y.js) |
| `feedback-widget.js` — 5-element per-card strip | [feedback-widget.js](../feedback-widget.js) |
| Indian Sign Language Phase 1 dictionary | [chitti-isl/](../chitti-isl/) + `chitti_isl_dictionary.json` |

---

## Commando Standard

- Every Phase 1 endpoint exists as either a working route or an honest `501 not_implemented` JSON — never a `404` and never silent.
- Every reply spoken in user's language via Voice Factory cascade; falls back to mock_bhashini until ULCA creds land.
- Every action gates on `chittiConfirmAndDo()` per [Chitti Golden Rule](../SAHAYAI_MASTER.md) — voice "haan" or tap. Never defaults to Yes. Never times out into Yes.
- Postman Principle enforced at every endpoint: call CONTENT + private messages auto-deleted; never logged, never persisted, never analysed.
- Tested for 60-year-old illiterate user on 2G, 375px screen, Hindi default.

---

**World Class Chitti PA — Commando Discipline. Zero Excuses.**
