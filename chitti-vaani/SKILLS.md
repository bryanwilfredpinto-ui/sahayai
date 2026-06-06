🎖️ **World Class Chitti Vaani — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

# Chitti Vaani — SKILLS (CEOS L5)

> **COSDF v1.1 · Level 5.** Eight domain skills Vaani must master to fulfil its
> role as the sole user-facing surface for all of sahayai.in.  Every skill below
> is consistent with the locked decisions in [SAHAYAI_MASTER.md §2](../SAHAYAI_MASTER.md)
> and the seven-field SOP in [CHITTI_SOP.md §1](../CHITTI_SOP.md).
>
> **CHITTI GOLDEN RULE applies to every skill below (LOCKED 2026-05-23).**
> Any skill that produces a side-effecting action (call · SMS · WhatsApp · email
> · UPI · device control · routing to a HIGH-risk Chitti that triggers a real
> action) gates on `chittiConfirmAndDo()`. Vaani asks, waits for explicit haan,
> and fires only on explicit Yes. Silence = wait. Never times out into Yes.

---

## Skill 1 — Intent Classification + Routing to 14 Internal Chittis

| Attribute | Value |
|---|---|
| Owner | `backend/services/vaani_service.py` `route_intent()` |
| Eval bar | >= 85% intent-route accuracy across all 14 Chittis on a held-out judge eval |
| Confidence output | `route_confidence` [0, 1] emitted on every routed reply |
| Low-confidence path | `route_confidence < 0.70` -> Vaani confirms before routing: *"I think this is a CA question — shall I send it to Chitti CA?"* Explicit haan required. |

**14 internal Chitti targets:**

| Slug | Domain | HIGH-risk |
|---|---|---|
| `chitti-medupi` | Medicine cost, generic alternatives, Jan Aushadhi | HIGH (medical) |
| `chitti-shares` | NSE/BSE prices, technicals | — |
| `chitti-fundamentals` | Equity fundamentals, valuations | — |
| `chitti-technical` | Technical analysis, charts | — |
| `chitti-news` | Indian news, politics, sport | — |
| `chitti-news-ai` | AI/tech news, career readiness | — |
| `chitti-ca` | Tax, GST, ITR, CA advice | HIGH (financial) |
| `chitti-legal` | Indian law, consumer rights, FIR | HIGH (legal) |
| `chitti-government` | Government schemes, DigiLocker | — |
| `chitti-upi` | UPI fraud detection | HIGH (financial) |
| `chitti-scanner` | Product / food scanner, FSSAI | — |
| `chitti-2wheeler` | Bike diagnostics | — |
| `chitti-4wheeler` | Car diagnostics | — |
| `chitti-vaani-local` | Local-business directory, geo | — |

**Hard rules:**
- Rules-only classification for routing decisions — no LLM in the intent-classification critical path.
- HIGH-risk Chittis (CA / Legal / MedUPI) carry an extra confirmation: even if a prior
  action was approved, every new action confirms individually.
- Intent fallthrough (no match or confidence < 0.50) -> Vaani answers directly from its
  own DeepSeek corpus; never silently drops the query.
- Every routed reply carries `route_confidence` for the trust strip.

---

## Skill 2 — Multilingual Voice in 26 Languages via Voice Factory

| Attribute | Value |
|---|---|
| Owner | `chitti-voice-factory/backend/`, `chitti_a11y.js` `Chitti.a11y.speak()` |
| Languages | 26 (12 primary + 14 cousin, incl. Sanskrit and Oraon) |
| Supplier cascade | mock_bhashini -> real Bhashini (ULCA) -> 3rd-party TTS -> community-donated voices |
| Tier C rule | **Never silently falls back.** If Tier C is reached, Vaani surfaces: *"Voice service not supported for this language — please type or switch language."* |
| Auto-detect | Incoming user speech is auto-detected across 9 first-class languages; unknown codes fall through to DeepSeek as `"reply in X"` hint. |

**Hard rules:**
- Provider name is never exposed to the user. Frontend says "Chitti" not "Bhashini".
- Community-donated voices replace Bhashini as each language crosses the quality
  threshold — architecture must support swapping the provider at any time.
- Voice Factory fluency pipeline (79,414 chunks, 55 curriculum PDFs) is independent
  of Bhashini and must remain so.
- For blind users: every state change, modal, and navigation event is spoken before
  any visual update.

---

## Skill 3 — Emergency-Cascade Orchestration (Family-Only, NEVER Cops)

| Attribute | Value |
|---|---|
| Owner | `backend/services/emergency_service.py`, `CONTEXT.md §Emergency protocol` |
| Trigger | Always-on keyword spotting on any Chitti-mediated audio (any language, day or night) |
| Denylist | `COP_DENYLIST` hard-codes 112 / 100 / 101 / 102 / 1098 / 1930 / 139. Even a misconfigured trusted-circle entry is refused. |
| One exception | 108 (ambulance / medical line) — Chitti CAN dial this after Golden Rule confirm. |

**Cascade order (SOP: emergency_cascade_sop.md):**
1. Keyword spotted -> POST `/api/vaani/emergency/trigger`
2. Confirm with master (10 s) — *"Master, are you OK? Say theek hun."* Check-in aborts.
3. Ring alarm bypassing silent (STREAM_ALARM / Web Audio, 10 s)
4. Outbound to spouse / first trusted-circle pair
5. Fan out to full trusted-circle roster via `/emergency/poll` (web) or FCM (Android v2)
6. Chitti-to-Chitti relay — paired Chittis ring their own alarm even on silent

**Hard rules:**
- Emergency cascade is family-only. NEVER auto-dial any government emergency number.
- SafeWalk timer reuses this same cascade — no separate notification path.
- Daily elderly check-in (V3 planned) routes through `/emergency/trigger` — not a new path.
- Cascade failure (all family unreachable) -> ring local alarm indefinitely + display `tel:108`
  large-tap button. Never silently fail.

---

## Skill 4 — Pro-Action Execution (Golden Rule Gated)

| Attribute | Value |
|---|---|
| Owner | `chittiConfirmAndDo()` in `chitti_vaani.html`, `confirmNativeAction()` for device controls |
| Gate | Every side-effecting action speaks *"Sire, shall I do X?"* -> Yes/No modal -> fires only on explicit haan/yes/theek/kar do |
| Silence | Waits forever. No timeout-to-Yes. No default-to-Yes. |

**Covered actions (non-exhaustive):**

| Category | Examples |
|---|---|
| Communication | Call (tel: / ChittiNative.makeCall) · SMS (RFC 5724 / SmsManager) · WhatsApp (wa.me) · Email (Gmail OAuth, server-side send) |
| Payments | UPI (upi://pay deeplink, user enters PIN in UPI app — Chitti never sees PIN) |
| Safety | SafeWalk start/extend · Fake incoming call · Location share to trusted circle |
| Device (Android Phase 2) | Lock screen · Silent/ring toggle · App launch · Accessibility-service arming |
| HIGH-risk Chittis | Filing ITR · Sending legal notice · Ordering medicine · Dialling helpline |

**Hard rules:**
- HIGH-risk Chittis (CA / Legal / MedUPI / Vaani-psychology) confirm **every individual
  action** — there is no "approve once, run forever".
- The Android `ChittiNative` bridge adds defence-in-depth: `SafetyChecks.requireNotUnlock`
  / `refuseIfPinLike` / `is_cop_number()` — never bypasses the JS gate.
- `chittiConfirmAndDo` is the single implementation. No Pro Card may hand-roll its own
  confirm pattern.

---

## Skill 5 — Psychology / Empathy (Therapist-Boundary Locked)

| Attribute | Value |
|---|---|
| Owner | `chitti-vaani/skills/PSYCHOLOGY.md` (basics -> PhD corpus), `swarm/empathy_agent.md` |
| Boundary | Vaani is a supportive dost + helpline router. It is **not** a licensed therapist and never claims to be. |
| Helpline cascade | Tele-MANAS 14416 · iCall (9152987821) · Vandrevala Foundation (1860-2662-345) · NIMHANS (080-46110007) |
| Enforcement | Server-side: psychology corpus path -> `_enforce_disclaimer()` appends helpline strip. Client never controls this. |

**Corpus pillars (PSYCHOLOGY.md):**
Freud / Jung / Maslow / Rogers / Bandura / Skinner / Pavlov / Beck / Ellis ·
Goleman / Ekman / Gottman / Seligman · Patanjali / Ayurveda / Gita / Buddhist /
joint-family psychology · MI / trauma / crisis / financial-stress / rural /
women / elder · Kahneman / Thaler / Ariely · neuropsych / cross-cultural /
community / health psychology.

**Hard rules:**
- Psychology responses MUST always end with helpline cascade — server-enforced.
- Vaani recognises distress cues (voice prosody, lexical triggers, regional distress
  vocabulary) and escalates empathy tone before answering the surface question.
- Vaani separates the person (always respected) from the information (gently corrected).
  Never diagnoses, never prescribes — see `PSYCHOLOGY.md §9`.
- HIGH-risk corpus changes (psychology, helpline numbers) require Sire's review before merge.
- CBT thought-record flow used sparingly; never as a diagnostic instrument.

---

## Skill 6 — Geo Local-Business Lookup (Local-Chitti-First Directory)

| Attribute | Value |
|---|---|
| Owner | `backend/services/local_chitti_service.py` `nearby()`, geo shipped 2026-05-13 |
| Algorithm | Haversine radius filter — 5 km metro / 25 km tier-2/3 default; auto-expands when zero confirmed-in-radius hits |
| Honesty knobs | No-geo shops shown with *"Distance unknown"* pill. No location supplied -> directory-wide mode + banner. Nearest match spoken aloud. |
| External fallbacks | Offered AFTER local Chitti directory; clearly labelled "external"; never auto-books |

**Supported categories (local-first):**

| Category | Local key | External fallback |
|---|---|---|
| Food | chittirestaurant | Zomato / Swiggy |
| Groceries | chittikirana / chittigrocery | Blinkit / BigBasket |
| Medicine | chittipharmacy | — (stays local) |
| Salon | chittisalon | — (stays local) |
| Cab | — (no substrate yet) | Ola / Uber / Rapido |
| Movies | — (no substrate yet) | BookMyShow |
| Train | — (no substrate yet) | IRCTC (captcha gated, honest label) |

**Hard rules:**
- "Nearest" means haversine-verified, not directory-wide.
- External deep links open the merchant's mobile site. Chitti does not auto-book,
  auto-pay, or auto-confirm — the final tap is always the user's, in the merchant app.
- Cab / movie / train fall to external honestly because no local Chitti substrate exists.
  Label says so. Never pretend local coverage that doesn't exist.

---

## Skill 7 — Safety Surface (SafeWalk, Fake Call, Medical ID, Location Share)

| Attribute | Value |
|---|---|
| Owner | `chitti_vaani.html` §1.3a safety cards, shipped 2026-05-23 |
| Golden Rule | All six safety cards route through `chittiConfirmAndDo()` |
| Emergency cascade | All safety escalations reuse the family-cascade path — never a separate notification path |

**Six safety cards:**

| Card | What | Web behaviour |
|---|---|---|
| SafeWalk | Check-in timer; alerts trusted circle if user goes silent past deadline | localStorage state · geolocation on escalation · wa.me fan-out |
| Fake incoming call | Fullscreen overlay + WebAudio beat in 2 minutes | Simulates ringing call to enable safe exit from situation |
| Share live location | One-shot geo share to trusted circle | navigator.geolocation -> Google Maps URL -> wa.me or sms: |
| Medical ID | Blood group / allergies / conditions / doctor / emergency contact, spoken on demand | localStorage; readMedicalIdAloud() via Voice Factory |
| Ambulance 108 | Direct shortcut to 108 medical line only — NOT 112/100 | tel:108 after Golden Rule confirm |
| Nearest hospital / chemist | Maps category search by location | google.com/maps/search near me |

**Voice intent shortcuts (wired):**
`"safewalk"` · `"main akeli ja rahi hun"` · `"fake call"` · `"meri location bhejo"` ·
`"ambulance"` · `"108"` · `"nearest chemist"` · `"aaspaas ka hospital"` · `"medical id"`

**Hard rule:** SafeWalk alarm uses family cascade — NEVER auto-dials 112.

---

## Skill 8 — Consent Gate + Quality Framework

| Attribute | Value |
|---|---|
| Consent | 6-section T&C modal locks every feature until user taps I AGREE. Each section has speaker read-aloud in user's language. Persisted in localStorage. |
| Per-response widget | Every response box carries speaker · Chitti icon · thumbs up/down + per-box feedback window (voice or type, tagged to box ID, into Founder dashboard daily). Wired via `feedback-widget.js`. No page ships without it. |
| Quality hooks | Wrap every DeepSeek call; `/api/feedback` + `/metrics` blueprints. Founder report at 07:00 IST. |
| Swarm cycle | Daily collect -> weekly validate -> monthly push to skills/*.md -> quarterly review (see `swarm/README.md`) |
| CTO escalation triggers | Voice Factory ledger >5% supplier failures / emergency cascade median >30s / intent-route accuracy <85% / HIGH-risk corpus drift / Golden Rule bypass in AuditLog |

**Hard rules:**
- ISL Phase 1 panel auto-attached on every response when `disability_profile.isl = true`.
- Legal disclaimer `Yeh AI ki madad hai. Doctor ya lawyer se confirm zaroor karo.`
  appended server-side on every turn (`_enforce_disclaimer()`). Frontend reads it aloud.
- Identity line *"I am Chitti, an AI assistant for [user name]"* never omitted on
  outbound calls — system-prompt enforced + Phase-2 call-screen layer.
- SEBI sticky bar never demoted to the footer on any Chitti page.
- Swarm Intelligence: locked decisions (Golden Rule / emergency protocol / four-user
  contract / DeepSeek-only / ISL / disability profile / psychology helplines)
  are **never learnable by the swarm**. Any pattern touching a lock is auto-rejected
  at weekly validation.

---

## Legacy Feature Inventory

The original per-feature status table (FEATURES.md-style) is preserved in
[`skills/FEATURES.md`](skills/FEATURES.md). This SKILLS.md supersedes it as
the CEOS L5 domain-skills contract.

---

**World Class Chitti Vaani — Commando Discipline. Zero Excuses.**

Last reviewed: 2026-06-06
