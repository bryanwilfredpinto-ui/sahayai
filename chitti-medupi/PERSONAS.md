🎖️ World Class Chitti MedUPI — Commando Discipline. Zero Excuses.

# CEOS Level 2 — PERSONAS (Chitti MedUPI)

Authored 2026-06-06

> Every feature in [PRD.md](PRD.md) names which personas (P1–P9) it serves. A
> feature that serves none is not built. The four-user accessibility contract
> ([SAHAYAI_MASTER.md §7](../SAHAYAI_MASTER.md)) — Blind / Deaf / Mute /
> Illiterate (P1–P4) — is the **floor** under every other persona.
>
> Each persona uses the canonical story form:
> *"As an Indian [user], I want [action] so that [outcome]."*

---

## The four accessibility archetypes (the floor)

### P1 — Lakshmi, 38 — Blind caregiver (Pune)
- **Context:** runs the household for her diabetic mother-in-law; reads nothing on
  a label; manages everything by TalkBack and voice.
- **Goals:** know the cheapest same-composition option and the risk band **by
  ear**, log it to the family wallet hands-free.
- **Pains:** every medicine app is image-only — prices, MRP blocks, strip photos
  are invisible to her; she is overcharged because she cannot read the bill.
- **How MedUPI serves her:** 🎤 voice medicine search → `speak_en` / `speak_hi`
  on every response → the risk banner auto-speaks ("HIGH risk — confirm with your
  doctor") before any price → voice-driven wallet entry via `chittiConfirmAndDo()`.
- **Accessibility need:** voice IN + voice OUT, no visual-only signal. Nothing
  conveyed by colour alone.

### P2 — Imran, 26 — Deaf pharmacy-bill checker (Hyderabad)
- **Context:** buys his family's monthly medicines; communicates in text + Indian
  Sign Language; never relies on audio.
- **Goals:** confirm a generic is the **same composition** and see the savings
  number without a single audio cue.
- **Pains:** voice-only IVR helplines and audio explainers shut him out; he
  can't tell from a spoken-only app whether a swap is safe.
- **How MedUPI serves him:** `caption_en` / `caption_hi` beside every speak;
  symbols `⛔ ⚠️ ✅` on risk; freshness pills carrying emoji + colour + **text**;
  the ISL panel on every response box.
- **Accessibility need:** visible captions + symbols + ISL, never audio-only.

### P3 — Devi, 19 — Mute college student (Coimbatore)
- **Context:** manages her grandfather's BP and thyroid medicines; cannot speak;
  interacts entirely by tap and type.
- **Goals:** compare prices and build the cabinet **without any voice step**.
- **Pains:** "say the medicine name" voice prompts and forced-speech onboarding
  block her; she abandons apps that assume a microphone.
- **How MedUPI serves her:** typed search; file-picker strip upload; photo-based
  QR decode; demo mode advances by Next/Skip; every confirm is tap-or-voice.
- **Accessibility need:** buttons / sliders / typed input — voice never required.

### P4 — Ramesh, 61 — Low-literacy daily-wage earner (rural Madhya Pradesh)
- **Context:** cannot read English labels, reads little Hindi; buys medicines for
  himself and his wife on a daily-wage budget; uses a hand-me-down Android on 2G.
- **Goals:** understand *what the medicine is for* and *how much he saves* in
  plain Hindi with pictures.
- **Pains:** numbers and English brand names are noise to him; he takes the
  chemist's word and overpays.
- **How MedUPI serves him:** `_chittiLang` EN↔हिं toggle; large-font option;
  pictograms over numbers; `purpose_hi` on every medicine ("बुख़ार और हल्के दर्द
  के लिए"); savings shown as a big bold spoken number.
- **Accessibility need:** plain-language symbols + large fonts + Hindi-first UI,
  low-data / 2G mode.

---

## Domain personas

### P5 — Sunita, 44 — Fixed-income chronic-care caregiver (Bhopal) · **PRIMARY USER**
- **Context:** single earner; buys a monthly cart for her diabetic father and
  hypertensive mother — Metformin, Telmisartan, Atorvastatin, thyroid. ₹1,200+ a
  month on medicines, a real strain.
- **Goals:** cut the monthly cart cost without changing what the doctor
  prescribed; track per-person spend and savings.
- **Pains:** she didn't know Jan Aushadhi equivalents existed; some months she
  splits the cart and skips a refill.
- **How MedUPI serves her:** cart simulator returns the cheapest **same-
  composition** cart + monthly + annual savings + per-line risk badge; the family
  wallet shows this-month and 12-month spend/saved per profile (self / spouse /
  parent); refill reminders stop the skipped dose.
- **Accessibility need:** Hindi voice + captions; she is the design centre —
  every call goes to her.

### P6 — Hari, 67 — Elderly diabetic/cardiac patient on lifelong medication (Lucknow)
- **Context:** takes 5+ daily medicines for life; small text and fiddly UIs defeat
  him; sometimes a strip expires in the cabinet unnoticed.
- **Goals:** never run out, never take an expired strip, never overpay on a fixed
  pension.
- **Pains:** he forgets refills; expired medicine is a genuine **safety** risk;
  HIGH-risk cardiac/diabetes molecules make him (rightly) cautious about
  switching.
- **How MedUPI serves him:** expiry reminders bucketed EXPIRED / EXPIRING_SOON
  (≤7d) / EXPIRING (≤30d) with a spoken phrase per bucket; refill reminders
  (refill / dose / appointment kinds); HIGH-risk red banner that **stops and
  tells him to ask his doctor** before any switch.
- **Accessibility need:** large text, slow voice, symbol + word labels (never
  colour alone), elderly-mode adaptations.

### P7 — Geeta, 35 — Rural patient far from a Jan Aushadhi store (village, Vidarbha)
- **Context:** nearest Jan Aushadhi Kendra is 30+ km away; the local chemist is
  the only option and sometimes charges above MRP.
- **Goals:** know the **fair** price before she travels or buys, and whether the
  chemist is overcharging.
- **Pains:** no store nearby means the Jan Aushadhi price is theoretical for her —
  she needs leverage at the local counter.
- **How MedUPI serves her:** by-state Jan Aushadhi fallback when geolocation finds
  nothing within 5 km; **NPPA ceiling violation** chip + a copy-ready complaint
  draft when the chemist charges over the cap; community-reported prices (median +
  IQR by city) so she sees what neighbours actually paid.
- **Accessibility need:** low-data mode; voice-first in her regional language;
  honest empty state when no store is reachable.

### P8 — Anil, 41 — Small-shop pharmacist cross-checking (Indore)
- **Context:** runs a neighbourhood medical store; wants to offer honest generic
  options and confirm composition equivalence for walk-in customers.
- **Goals:** verify *same molecule + strength + form* quickly; cite the NPPA
  ceiling; show the Jan Aushadhi number transparently.
- **Pains:** customers distrust generics; he needs a neutral, non-marketing source
  that confirms equivalence without telling him to substitute.
- **How MedUPI serves him:** the strict-match alternatives list (composition-exact,
  never therapeutic); NPPA ceiling reference; risk band as a shared
  stop-and-think prompt with the customer. MedUPI **never** tells him to swap — it
  arms the conversation.
- **Accessibility need:** fast text lookup, English + Hindi side by side, printable
  / shareable result.

### P9 — Farida, 29 — Insurance-aware patient (Kolkata)
- **Context:** her family is enrolled under Ayushman Bharat; she wants to know
  which chronic-care medicines are covered before she pays out of pocket.
- **Goals:** check coverage by therapeutic class across Ayushman Bharat / CGHS /
  ESI / private and pair it with the cheapest same-composition option.
- **Pains:** scheme coverage rules are opaque; she pays cash for things that may
  be covered.
- **How MedUPI serves her:** insurance match returns a `covered` boolean +
  EN/HI reason by therapeutic class, scheme-by-scheme; cross-links to Chitti
  Government's PMJAY eligibility checker.
- **Accessibility need:** plain-language coverage explanation, EN + Hindi, spoken
  and captioned.

---

## Persona → primary-feature map (cross-ref to [PRD.md](PRD.md))

| Persona | Hero features |
|---|---|
| P1 Blind | F0 compare, F2 scan, voice-first delivery, risk auto-speak |
| P2 Deaf | F0 compare, captions + ISL, risk symbols |
| P3 Mute | typed F0 compare, F4 wallet, demo mode |
| P4 Low-literacy | F0 compare (purpose_hi), F1 Jan Aushadhi savings, big spoken number |
| P5 Fixed-income caregiver (PRIMARY) | F0 cart, F1 Jan Aushadhi, F4 family wallet |
| P6 Elderly chronic patient | F5 expiry/refill reminders, F3 NPPA, risk gate |
| P7 Rural patient | F1 by-state Jan Aushadhi, F3 NPPA violation, community prices |
| P8 Shop pharmacist | F0 strict match, F3 NPPA reference, risk prompt |
| P9 Insurance-aware patient | F7 insurance match, PMJAY cross-link |
