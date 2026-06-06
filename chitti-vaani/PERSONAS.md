# PERSONAS — Chitti Vaani

Every product decision is checked against these personas. **If a feature does not
serve at least 2 of them without degrading the others, it does not ship.**

---

## Accessibility personas — the four-user contract floor

These four are not edge cases. They are the design brief. Any feature that passes
all four passes the accessibility contract. A feature that fails one fails all.

### A1 — Kamla, Blind, 68, Varanasi (UP)

- **Disability:** Total blindness since birth. TalkBack user on a budget Android.
- **Language:** Bhojpuri and Hindi. No English. Voice is her only channel.
- **Phone:** Entry Android, 2G most of the time, charges it once a day.
- **Life context:** Widow. Lives with her son's family. Needs to check PM-Kisan
  instalment dates, medicine costs for her arthritis, and get her son to help with
  the pension form — but her son is away on a construction job all day.
- **Goals:** Know what is happening without asking anyone. Do small tasks herself.
- **Pain:** Every "voice assistant" she has tried switches to English mid-sentence,
  reads out raw HTML (`"span class equals…"`), or requires a visual confirmation she
  cannot see.
- **How Vaani serves:** Voice-First Mode auto-activates from `disability_profile.blind`.
  Every response is spoken. Every label has an audio equivalent. The ISL panel is silent
  for her (she cannot see it) but does not block her flow. She says *"PM Kisan ka
  paisa kab aayega?"* and hears the answer. She never needs to unlock a tab.

---

### A2 — Rajan, Deaf, 34, Chennai (Tamil Nadu)

- **Disability:** Profound deafness since age 3. Indian Sign Language (ISL) is his
  primary language; Tamil written is secondary; Tamil spoken is not available to him.
- **Language:** ISL + written Tamil. Does not use audio.
- **Phone:** Mid-range Android, 4G, WhatsApp-heavy.
- **Life context:** Delivery rider. On the road 10 hours a day. His wife has a
  heart condition — he needs to share his live location with her every hour and
  get notified if she triggers her own Chitti emergency.
- **Goals:** Share location silently, receive family alerts without audio, see
  captions for any Vaani reply.
- **Pain:** Voice assistants are useless to him. Notification-only products miss
  the ISL dimension. Most safety apps ring an alarm he cannot hear.
- **How Vaani serves:** ISL Phase 1 panel attaches to every `[data-chitti-response]`
  box. Every state change is captioned. The STREAM_ALARM bypass (Phase 2 Android) will
  vibrate at maximum intensity even when his phone is on silent. The live-location card
  works tap-only: he taps, sees the caption, taps Haan, location sent — zero audio
  dependency.

---

### A3 — Meera, Mute, 16, Pune (Maharashtra)

- **Disability:** Congenital mutism. Full hearing, full literacy in Marathi and some
  English.
- **Language:** Reads and understands Marathi and English. Cannot speak.
- **Phone:** Her family's shared Android, 4G.
- **Life context:** Second-year junior college student. Has to navigate a threatening
  situation on public transport twice a week on her commute.
- **Goals:** Trigger SafeWalk, call her brother if needed — without speaking a word.
  Use the Fake Call feature to get out of uncomfortable situations.
- **Pain:** Voice-only assistants are completely inaccessible to her. Even products
  that "accept text" require audio confirmation after every command.
- **How Vaani serves:** Every card has a visible Haan / Nahi tap button — the Golden
  Rule confirm modal is mute-user safe by design. SafeWalk activates on a tap-and-hold.
  Fake call activates via the 📵 card. `chittiConfirmAndDo()` accepts explicit tap as
  well as voice haan. Outbound calls open with Chitti's self-ID so she never needs to
  speak. She reads the caption to confirm what Chitti is about to do, then taps Haan.

---

### A4 — Mahavir, Illiterate, 55, Sikar (Rajasthan)

- **Disability:** Never went to school. Cannot read Hindi or any script.
  Full hearing and speech in Rajasthani-Marwari dialect + Hindi.
- **Language:** Spoken Rajasthani-Marwari and Hindi. Zero literacy.
- **Phone:** His adult daughter's phone, entry Android, feature-phone comfort level.
- **Life context:** Smallholder farmer. Uses the phone for voice calls only.
  Needs to check crop insurance (PMFBY) status, soil health card, and medicine
  costs when his wife falls ill.
- **Goals:** Get answers by speaking, never typing. Never be asked to read a label.
- **Pain:** Every product assumes he can read. Even voice products display a text
  confirmation he cannot verify.
- **How Vaani serves:** `disability_profile.illiterate` auto-activates: symbol
  affordances replace text labels, voice readback precedes every action, and the
  Haan / Nahi tap buttons are oversized (≥ 48×48 px) and icon-labelled (✓ / ✗)
  rather than text-labelled. Vaani reads back what it is about to do in Hindi — he
  nods and says *"haan"* — and Chitti acts.

---

## Domain personas — the real users behind the use cases

### D1 — Sunita, Elderly Tier-2 Parent, 72, Nagpur (Maharashtra)

- **Context:** Retired schoolteacher. Lives with her son's family but is home
  alone during the day. Mild presbycusis (age-related hearing loss), arthritis
  limits touchscreen precision.
- **Language:** Marathi + Hindi. Reads Marathi fluently but prefers voice.
- **Goals:** Daily check-in with her daughter in Bengaluru. Know medicine costs.
  Track her pension. Get the 07:00 IST Good Morning brief so she doesn't miss
  a pill or a scheme deadline.
- **Pain:** Small tap targets. Products that assume she can read a 10-pt font.
  Emergency services that require a long phone call she can't always complete.
- **How Vaani serves:** Elderly mode — short sentences, repeat important info twice,
  confirm with *"Kya aapko samajh aaya?"* SafeWalk timer alerts her daughter's
  Chitti if she goes silent. Daily check-in cron (planned V3 feature) rings her at
  her preferred time; silence after 3 prompts triggers the family cascade. She is
  the integration test for the four-user contract.

---

### D2 — Arjun, Delivery Rider + Gig Worker, 26, Bengaluru (Karnataka)

- **Context:** Zomato / Swiggy rider. On the road 12 hours a day. Uses phone with
  one hand while riding (voice-first is safety-critical for him, not a preference).
- **Language:** Kannada + Hindi. Some English from delivery apps.
- **Phone:** Mid-range Android, mostly 4G, drops to 2G on ring roads.
- **Goals:** Share location with wife every hour. Get nearest petrol bunk, chemist,
  or workshop via voice. Order food without opening three apps. Know if a UPI
  request he received is a fraud.
- **Pain:** Cannot safely type while riding. Apps with multi-step modals are dangerous.
- **How Vaani serves:** Voice-first intent routing — *"aaspaas ka petrol bunk batao"*
  → Maps category search; *"yeh UPI request safe hai?"* → routes to Chitti UPI fraud
  guard; *"ghar par meri location bhejo"* → SafeWalk / live-location card, confirm
  and send in one turn.

---

### D3 — Priya, SafeWalk User, 23, Delhi (NCR)

- **Context:** Women's college student. Takes the Delhi Metro home at night.
  Has had one near-miss at an isolated metro station.
- **Language:** Hindi + English.
- **Phone:** Mid-range Android, 4G.
- **Goals:** Activate SafeWalk silently when leaving campus. Trigger a fake call
  immediately if she feels threatened. Share live location to her mother and best
  friend with one tap. Never call the police — she knows from experience that
  calling 112 from inside a metro station often drops.
- **Pain:** Safety apps require too many steps in a stressful moment. She cannot
  afford to look down at her phone for more than 2 seconds.
- **How Vaani serves:** SafeWalk activates via voice (*"main akeli ja rahi hun"*) or
  tap-and-hold. Fake Call card fires in 2 minutes with one tap. Live-location share
  to her Trusted Circle (mother + best friend) happens in one confirm. The family
  cascade (not cops) is the escalation path she trusts. 108 is available if she
  needs medical help — that is the one dialable emergency number.

---

### D4 — Ramesh, Rural Low-Connectivity Farmer, 52, Amravati (Maharashtra)

- **Context:** Cotton + soybean smallholder. Member of an FPO. Phone signal drops
  to 2G most of the day. His son set up Vaani for him; he uses it for voice only.
- **Language:** Marathi. No English.
- **Phone:** Entry Android, 2G, charges at a kirana shop sometimes.
- **Goals:** Know his PM-Kisan instalment date. Check if today's weather will affect
  spraying. Ask Chitti MedUPI about the cost of his wife's BP medicine. Find the
  nearest Jan Aushadhi store.
- **Pain:** Urban-biased products don't load on 2G. Text-heavy answers are useless
  when he has only voice. Apps that time out after 3 seconds of slow network.
- **How Vaani serves:** `chitti_offline.js` service-worker caches the emergency and
  basic-query surface for offline use. `effectiveType <= 2g` heuristic lowers payload
  size. Voice-first routing means a slow response is read aloud as it arrives, not
  displayed as a loading spinner. He says *"PM Kisan kab aayega?"* and hears the
  answer in Marathi.

---

### D5 — Aarti, Woman in Domestic Distress Situation, 38, Bhopal (MP)

- **Context:** Needs to contact her sister without the person she lives with
  knowing she is reaching out. Needs to document her location. Needs the Medical ID
  feature for her children.
- **Language:** Hindi.
- **Phone:** Limited access; shares a phone.
- **Goals:** Silently send her location to her sister. Access helpline numbers.
  Set up Medical IDs for her children. Know that Vaani will not auto-dial
  the police without her explicit permission.
- **Pain:** Products that auto-call 112 expose her to more danger. She needs control,
  not automation.
- **How Vaani serves:** Family cascade never dials cops — constitutional. She controls
  who is in the Trusted Circle. Medical ID is `localStorage`-only — never sent to
  a server. Psychology queries route to the helpline cascade (Tele-MANAS 14416 +
  iCall + Vandrevala + NIMHANS) with Chitti holding the therapist boundary. The
  Fake Call card gives her 2 minutes to change a situation. Every action requires
  her explicit haan — Vaani never acts on her behalf without it.

---

## Operational personas

### O1 — Sire (Bryan Wilfred Pinto), Founder + CTO
- Reads: Daily CTO Inbox report at `chitti_cto_inbox.html`. Vaani-routed status.
- Needs: Curl-verified status, measured results, no placeholders. Never asked to
  run manual infra ops. Tests real iPhone / Android hardware once automated QA
  has passed everything it can automate.

### O2 — Chitti CTO (this agent)
- Needs: Locked decisions documented; spec parity between repo and production;
  automated QA covering 26 langs × all a11y profiles × real uploads × all engines
  before any handover. Never hands QA to Sire that the CTO could have automated.

---

## Anti-personas (we will not optimise for these)

| | We do NOT serve |
|---|---|
| **The English-first urban power user** | Vaani's every design decision favours the vernacular-first, voice-first user. English works; it is never the default. |
| **The "one more confirmation dialog" pattern** | Generic SaaS safety patterns break blind / mute / illiterate users. Onboarding-grants + readback + undo replace per-action popups. |
| **The user who wants Vaani to auto-act silently** | The Golden Rule is constitutional. There is no "approve once, run forever" mode for side-effecting actions. |
| **The user looking to bypass the family emergency protocol** | The cop-denylist is not a configuration option. |

---

## How a persona check works in practice

Before any feature ships, write a one-line check for the highest-stakes user:

> *"Aarti (D5) is in a stressful situation and her hands are shaking.
> Does this feature serve her in the next 10 seconds without requiring her to
> look at the screen for more than 2 seconds?"*

If A1 (blind), A3 (mute), A4 (illiterate), and D5 (distress) can all complete
the flow, the feature ships. If any one fails, it is a bug, not a feature gap.

---

**World Class Chitti Vaani — Commando Discipline. Zero Excuses.**
