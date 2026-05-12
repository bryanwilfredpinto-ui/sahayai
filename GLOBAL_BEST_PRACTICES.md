# Global Best Practices — China · Dubai · Singapore

> Bharat-first, but not Bharat-only. Three places have built voice-first, accessibility-first, multi-language citizen-facing AI at scale before us. We borrow what works, drop what doesn't. This section is appended to every Chitti's [CONTEXT.md](.) so it stays load-bearing.

## Why look outside India

India is the design centre. But three places have shipped — at population scale — the exact properties we promise: voice-first, multi-language, accessibility-first, trust-anchored. Copying their patterns where they fit saves us years; copying patterns that don't fit (super-app monoculture, mandatory ID, social-credit feedback) is what we **refuse** to do. This section makes both lists explicit.

---

## 1. China — elder mode, voice-first, super-app discipline

| Pattern | What it is | Where Chitti adopts it |
|---|---|---|
| **Elder mode as a system default** | WeChat / Alipay / Meituan ship a one-tap "elder mode" with 18pt text, single-column layout, voice readback, big touch targets — installed by 200M+ users over 60. | Our braille-mode (`Chitti.a11y.setBrailleMode(true)`) is the same idea generalised to braille + low-vision. Single toggle, single source of truth. See [BRAILLE.md](BRAILLE.md). |
| **Voice navigation in finance** | Alipay's voice-first flow lets a non-reader transfer money by speaking the recipient's name. | The Voice Factory `/api/voice/speak` substrate (Bhashini today, swappable) is the same pattern across every Chitti. |
| **Standardised accessibility certification (GB/T 37668)** | Each app declares its accessibility class; reviewers audit. | Our per-page audit in [BRAILLE.md §4](BRAILLE.md) is the same discipline at smaller scale. |
| **One-tap "complain to higher authority"** | Every Alipay receipt has a one-tap escalation to a state mediator. | Our feedback widget ([feedback-widget.js](feedback-widget.js)) is the start. Per-product escalation paths are in each `TODO.md`. |

**What we refuse from China:** social-credit feedback (every action scored), forced ID-linking, super-app monoculture (one app owns your life). Each Chitti stays separately deployable, separately auditable, separately deletable.

---

## 2. Dubai — multilingual government-AI at scale, mandatory happiness signal

| Pattern | What it is | Where Chitti adopts it |
|---|---|---|
| **DubaiNow / TAMM 8-language minimum** | Every UAE government service must ship in Arabic + English + the six most-spoken expat languages (Urdu, Hindi, Tagalog, Bengali, Malayalam, Tamil) before launch. | Chitti's 26-language registry in [chitti_a11y.js](chitti_a11y.js) is wider than UAE's, but the *minimum-at-launch* principle is the same: a product is not "shipped" until it works in at least 4 Indian languages. See each product's TODO.md. |
| **"Happiness meter" on every transaction** | After every government service interaction, a single happy/neutral/sad button. Aggregated weekly to the relevant minister. | Our planned feedback meter (`/api/<product>/feedback` — already wired for chitti-sales, planned elsewhere). Voice-first equivalent: "kya theek raha?" with three readback options. |
| **UAE Pass federated identity** | One national identity → 6,000+ services. No re-login. | We **don't** copy this directly — see refusals below. Inspired DigiLocker pattern is partner-only and optional, with local-upload fallback. See [chitti-government/](chitti-government/). |
| **Smart-city emergency cascade** | Family contacts, employer, building security — police is the **last** rung, never the first. | Identical to Vaani's family cascade (see [project_chitti_vaani_emergency_protocol](C:/Users/DELL/.claude/projects/c--Users-DELL-sahayai-sahayai/memory/project_chitti_vaani_emergency_protocol.md)). |

**What we refuse from Dubai:** mandatory national-ID linking, autocratic-by-default UX (no "undo" because the state always knows best), and English-or-Arabic-only fallback when other languages fail silently. Chitti **never** silently falls back; the Voice Factory honestly reports `unsupported` for unmapped languages.

---

## 3. Singapore — inclusive design, digital trust, regulator-led standards

| Pattern | What it is | Where Chitti adopts it |
|---|---|---|
| **SG Enable Inclusive Design Mark** | A government certification that an app was co-designed with vulnerable users (blind, low-vision, deaf, motor-impaired). Required for public service apps. | Our four-user contract is the same discipline. The four CONTEXT.md tables in every product (blind / deaf / mute / illiterate / elderly) is co-design baked into the spec. |
| **IMDA "Digital for Life" senior programmes** | Free voice + tablet training centres in every neighbourhood. | Out-of-scope for software, but in-scope for our distribution: the partner network in [MASTER_CONTEXT.md §8](MASTER_CONTEXT.md) targets community centres in Bharat. |
| **Singpass with biometric + accessibility fallbacks** | Face Verify is the default; users with low vision get a voice + PIN fallback that yields the same trust level. | We **don't** ship Singpass, but the *no-second-class-fallback* rule is the same: every flow must be reachable for blind/deaf/mute users with the same outcome, never a degraded one. |
| **WCAG 2.1 AA enforced for all government services** | Public Service Division audits annually; non-conforming apps are taken offline. | Our BRAILLE.md checklist + per-page audit is the manual equivalent. Adding axe-core CI is a planned step (see `TODO.md` cross-cutting). |
| **Govtech open-source default** | TraceTogether, LifeSG, Singpass SDK — public-money code is public. | Sahay AI is open-source by default (MIT for code, CC-BY-4.0 for voice outputs). See [chitti-voice-factory/README.md](chitti-voice-factory/README.md). |

**What we refuse from Singapore:** centralised identity (no Chitti-pass), mandatory device biometrics (a refreshable braille user without working biometric hands cannot be locked out), and design-by-committee polish that sands off the warm "guardian-commando-coach" voice.

---

## 4. Three rules we keep because all three places keep them

1. **Voice IN + voice OUT is non-negotiable.** China's elder mode, Dubai's TAMM, Singapore's Singpass voice-fallback — every system that reaches non-readers at scale ships voice on both sides. Voice Factory substrate makes this a one-line include for every Chitti.
2. **Provider abstraction is non-negotiable.** China runs on iFlytek + Tencent voice; Dubai runs on multiple Arabic TTS vendors with a switch; Singapore mandates vendor portability for procurement. We hold the same line: Bhashini is the current provider, `chitti-voice-factory` is the swap point. See [MASTER_CONTEXT.md §3](MASTER_CONTEXT.md).
3. **Accessibility audits are continuous, not launch-day.** All three publish quarterly accessibility scorecards. We track per-page accessibility in each Chitti's `TODO.md` + ship the [BRAILLE.md](BRAILLE.md) checklist as a recurring task.

---

## 5. Three temptations we resist precisely because they are global trends

1. **Super-app consolidation.** One Chitti per problem stays separate. A user who only wants medicine prices should not have to install the news app.
2. **Mandatory national ID.** Aadhaar-linking is opt-in everywhere it appears (medupi family wallet, government scheme verifier). Blind users without easy KYC must still get the core value.
3. **AI-first product framing.** "Voice + AI" is the *delivery*, not the *promise*. The promise is "accessibility before AI" — a value carried by every CONTEXT.md and enforced by the four-user contract.

---

*Last updated 2026-05-12. This section is mirrored into every Chitti's `CONTEXT.md`. Single source: `GLOBAL_BEST_PRACTICES.md`.*
