# CONTEXT — Why Chitti Vaani exists

## The problem

Most "voice AI" assistants are toys for people who already have full sensory access and a smartphone they know how to drive. They fail the moment the user is **blind, deaf, mute, illiterate, elderly, or living rural** — the population Sahay AI exists for. Chitti Vaani is the conversational layer that meets these users on their own terms: speech in, speech out, plain Indian-language replies, no text-first onboarding, no per-action confirmation popups.

It is **not** a chatbot. It is a guardian, a commando, and a coach (per Bryan's design rule — generic SaaS confirmation patterns break PWD users). The voice loop is the product; the screen is a fallback for sighted helpers.

## The four-user accessibility contract

Every feature Vaani ships must work for at least one of these four users without compromising the others. This contract is enforced on every commit:

| User | They cannot... | So Vaani must... |
|---|---|---|
| **Blind** | see the screen | speak every state change, never rely on colour-only feedback |
| **Deaf** | hear the reply | show captions in the user's script + symbol cues |
| **Mute** | speak the request | accept tap / typed input and **speak on the user's behalf** (calls open with "I am Chitti, an AI assistant for [name]") |
| **Illiterate** | read text or labels | use symbols + voice readback for every UI label, never assume reading order |

The **elderly** user is the integration test — they hit every constraint at once (smaller hearing range, slower speech recognition, less text comprehension).

## The conversational mode

Vaani's DeepSeek prompt (see [PROMPTS.md](PROMPTS.md)) hard-codes:

- "I am Chitti, an AI assistant" on every outbound call — **never claim to be the user**
- Slow mode for elderly: short sentences, repeat important info twice, confirm with `Kya aapko samajh aaya?`
- Language auto-detection across Hindi / English / Tamil / Telugu / Bengali / Marathi / Gujarati / Kannada / Malayalam
- The mandatory legal line `Yeh AI ki madad hai. Doctor ya lawyer se confirm zaroor karo.` is appended server-side even if the model omits it. See [vaani_service.py `_enforce_disclaimer`](backend/services/vaani_service.py).

## Emergency protocol — family cascade, never cops

This is the rule Bryan calls out in the master memory and Vaani enforces it at the protocol layer:

1. **Always-on keyword spotting** runs on any Chitti-mediated audio (day or night). Multi-language wake words live in [`EMERGENCY_KEYWORDS`](backend/services/emergency_service.py): `emergency / ambulance / hospital / bachao / madad / dard / udavi / sahaayam / shahajjo / …`
2. On detection, the frontend POSTs `/api/vaani/emergency/trigger`. The backend fans the event out to every paired partner via the relay inbox; the frontend simultaneously runs the **local cascade**:
   1. **Confirm with master, 10 s** — *"Master, are you OK? Say theek hun."* If user says they are fine → `/api/vaani/emergency/check-in` aborts the cascade and notifies pairs.
   2. **Ring alarm, 10 s, bypassing silent** — `STREAM_ALARM` on Android, Web Audio on the web.
   3. **Escalate to spouse / family** — outbound call to the trusted circle. On Android, `ACTION_CALL` direct-dial; on the web, `tel:` deep-link.
   4. **Fire Chitti-to-Chitti relay** — paired partners' Chittis poll `/api/vaani/emergency/poll` (web) or receive FCM push (Android v2) and ring their own alarm, even if their phone is on silent.
3. **NEVER auto-dial 112 / 100 / 101 / 102 / 108 / 1098 / 1930 / 139.** Enforced in code via [`COP_DENYLIST`](backend/services/emergency_service.py) and `is_cop_number()`. Even a misconfigured trusted-circle entry containing a government emergency line is refused.

The user can press a single button (visible / large / haptic) to trigger this manually. Mute users have a touch-and-hold gesture.

## Chitti Golden Rule — confirm before every action (LOCKED 2026-05-23)

**Chitti NEVER acts on its own. EVER.** Vaani is a loyal assistant, not an autonomous agent. He has access — phone, SMS, WhatsApp, email, UPI, device controls — and uses it only on the user's explicit command, **after a per-action confirm**:

```
"Sire, shall I call Maa now?"             → User says haan → Chitti calls.
"Sire, shall I send this WhatsApp to Raj?" → User says haan → Chitti sends.
"Sire, shall I lock your phone?"          → User says haan → Chitti locks.
```

If the user says **nahi / no / ruko / stop**, Chitti stops immediately. If the user says **nothing**, Chitti waits — **forever, if needed.** No default-to-yes. No timeout-to-yes.

### Scope — applies to EVERY side-effecting action surfaced by Vaani

Communication (calls / SMS / WhatsApp / email / UPI) · device control (lock / silent / flashlight / camera / dialer role / call screening / alarm / reminders) · app opening (`ChittiNative.openApp`, YouTube, Maps, Music) · accessibility-service arming · and every routed call into another Chitti that produces a side effect (e.g. "Chitti, MedUPI se yeh dawai mangwa do"). The same gate covers all of them.

### Implementation

Single helper in [chitti_vaani.html](../chitti_vaani.html) — `chittiConfirmAndDo(question, onYes)`:
1. Speaks the question in the user's chosen language (Voice Factory cascade)
2. Opens the `#chitti-confirm-overlay` modal — explicit Haan / Nahi buttons (mute-user safe)
3. Starts a parallel SpeechRecognition pass listening for haan/theek/yes/kar do or nahi/ruko/stop/mat/cancel
4. Fires `onYes()` only on explicit Yes
5. Never defaults to Yes. Never times out into Yes.

One-tap device-control Pro Cards now route through `confirmNativeAction(name)` which wraps `nativeAction(name)` with the gate. The Android `ChittiNative` bridge ([MainActivity.kt](../chitti-vaani-android/app/src/main/java/in/sahayai/chitti/vaani/MainActivity.kt)) trusts the JS gate by architecture (same WebView process) and adds defence-in-depth via `SafetyChecks.requireNotUnlock` / `refuseIfPinLike` / cop-number denylist.

See [SAHAYAI_MASTER.md §2g](../SAHAYAI_MASTER.md) for the locked-decision callout.

## Why these patterns, not generic SaaS patterns

Per Bryan's design rule recorded in memory (`feedback_design_from_pwd_user_perspective.md`):

- **Per-send confirmation modals break blind/mute users.** Use onboarding-time grants + voice readback + 2 s silent-cancel windows instead.
- **OAuth toggle screens with branching paths break illiterate users.** The Gmail flow narrates every step (see [email_service.py](backend/services/email_service.py)) and lands back on the same `chitti_vaani.html` page on success.
- **Colour-only state** is forbidden. Captions, symbols, and audio readback always accompany state changes.

## Where Vaani sits in the Chitti family

Vaani is the **conversational substrate**. Other Chitti products (News, MedUPI, CA, Legal, Government, Voice Factory, Scanner, UPI Fraud Guard) embed Vaani's voice IO and emergency protocol via the same `/api/vaani/*` endpoints. Voice supply itself is centralised in Chitti Voice Factory (26 languages incl. Sanskrit + Oraon, 4-supplier cascade, mock_bhashini active until ULCA credentials land).

## Disclaimers that always stay

- **SEBI**: sticky NOT SEBI REGISTERED banner stays on every Chitti page including Vaani's frontend. Never demote to the footer.
- **AI**: every Vaani reply ends with the Hindi legal line (`_enforce_disclaimer()`). Frontend MUST read it aloud after each turn.
- **Identity**: Chitti always self-identifies on calls — never impersonates the user.


## Accessibility Requirements (Non-Negotiable)
Every Chitti app must be built accessibility first before AI features are added.

### Target Users
- Blind users: Full voice navigation, TalkBack compatible
- Deaf users: Full visual, no audio dependency
- Mute users: Text/gesture input only
- Elderly users: Large touch targets, high contrast

### Android Accessibility Compliance
- Every button must have a text label
- Every image must have alt text
- Logical tab and reading order
- High contrast mode support
- Large touch targets minimum 48x48dp
- Compatible with TalkBack screen reader
- Compatible with BrailleBack for Braille display users
- No image-only content, always have text alternative

### Accountability
Once accessibility is confirmed, AI powers the Chitti.
Chitti is then accountable for keeping all content fresh and updated daily.

### Founder Dashboard
All feature status visible at sahayai.in/founder


---

## Global Best Practices (China · Dubai · Singapore)

Bharat-first, not Bharat-only. The full discussion lives in [../GLOBAL_BEST_PRACTICES.md](../GLOBAL_BEST_PRACTICES.md). Headline rules adopted for every Chitti, including this one:

- **Elder mode as a system default** (China). Our braille-mode toggle in [chitti_a11y.js](../chitti_a11y.js) generalises this to braille + low-vision in a single switch.
- **Minimum 4 Indian languages at launch** (Dubai TAMM principle, 8-language min). The 26-language registry is in [chitti_a11y.js](../chitti_a11y.js). No product is "shipped" until 4 are wired.
- **Happiness meter on every transaction** (Dubai). Three-button voice-first feedback after key flows, aggregated weekly. Wired in chitti-sales; planned in [TODO.md](TODO.md) for the rest.
- **Inclusive Design Mark co-design** (Singapore SG Enable). Our four-user contract is the local equivalent.
- **WCAG 2.1 AA continuous audit** (Singapore Govtech). The [BRAILLE.md](../BRAILLE.md) checklist is the manual equivalent until axe-core CI lands.
- **Provider abstraction is non-negotiable.** Bhashini today, swappable at `chitti-voice-factory`. Frontend never names the supplier.

### What we explicitly refuse

- Super-app monoculture (China). Each Chitti is independently installable, deletable, auditable.
- Mandatory national-ID linking (Dubai UAE Pass). Aadhaar is opt-in everywhere.
- Centralised digital identity (Singapore Singpass). No Chitti-pass; no mandatory biometrics.
- Social-credit feedback aggregation. Happiness meter is anonymised and per-product.

This section is mirrored across every Chitti's CONTEXT.md from a single source — see [GLOBAL_BEST_PRACTICES.md](../GLOBAL_BEST_PRACTICES.md).
