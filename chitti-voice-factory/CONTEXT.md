# Context — Why Chitti Voice Factory exists

## 1. The PWD-user voice contract

Chitti is designed from the **PWD (Persons With Disability) user perspective**,
not the SaaS-power-user perspective. The four-user accessibility contract
(documented in the user's auto-memory under
`project_four_user_contract.md`) is:

| User | Cannot rely on | Needs |
|---|---|---|
| Blind | screens, colour cues | voice OUT, audio confirmations, plain-English readback |
| Deaf | audio cues | symbols + plain English captions, vibration |
| Mute | typing on cramped keyboards under stress | voice IN (and the system must let them speak instead of type) |
| Illiterate | reading anything | voice IN + voice OUT in their mother tongue, large symbols, never colour-only |

**Two of those four users live or die on voice.** And the language they speak
is not always one of the 12 "scheduled" ones — it's Tulu, Bhojpuri, Oraon,
Konkani, Santhali. So the voice substrate must:

1. Cover **26 Indian languages** (12 primary + 14 cousin) — not just the top 12.
2. Speak **before** it writes. Every verdict in every Chitti product gets read aloud first, written second.
3. **Never lie** about provenance. A blind user hearing "via Bhashini" must mean Bhashini, not a mocked stub.
4. **Never pretend.** Tier C languages (Tulu, Kodava, Oraon) get an honest "we are still learning" banner and a donor-program link — not a Kannada voice with their text shoved through it.

The Voice Factory is the single piece of infrastructure that lets every other
Chitti product honour this contract without each re-implementing TTS / STT.

---

## 2. Supplier fallback policy

We cascade across **four named suppliers** plus one transitional mock. The
order is fixed; each supplier records every attempt to the SQLite ledger;
every audio response carries a disclaimer naming the supplier that won.

| Tier | Suppliers | Behaviour on failure |
|---|---|---|
| **A — Production-ready (12 langs)** | `on_device` → `bhashini` → `mock_bhashini` → `ai4bharat` → `sarvam` | Try each in order. First `ok=True` wins. Logged. |
| **B — Covered but quality varies (11 langs)** | Same cascade, but Bhashini coverage is partial — `mock_bhashini` often serves first while real Bhashini is dark | Same cascade. Honest banner shows quality flag. |
| **C — No production model (3 langs: Tulu, Kodava, Oraon)** | **No silent fallback.** Route returns HTTP 503 + donor URL | User sees / hears: "Chitti is still learning {language}. We need volunteer voice donors." |

The cascade is implemented in [`backend/router.py`](backend/router.py). The
supplier order is the single source of truth for priority; nothing else picks.

### Why this order, in this language

- **`on_device` first** — once ONNX models ship, the user gets sub-100 ms voice with zero network round-trip and zero ongoing cost. This is the dream for blind / illiterate users on flaky 3G. Today it is honestly a placeholder that reports unavailable for every language; the cascade falls through.
- **`bhashini` second** — Bhashini is the Government of India NLTM platform. It is the legal, citizen-free, attribution-only source of truth for Indic TTS. Anything we can do via Bhashini, we must do via Bhashini.
- **`mock_bhashini` third** — until ULCA credentials are issued, we cannot call real Bhashini. The mock returns a `client_directive: speech_synthesis` so the browser uses its own Web Speech API. Crucially, **the supplier name in the ledger is `mock_bhashini`, never `bhashini`**. The disclaimer in every response says so. Spec §11.1 makes this a hard rule.
- **`ai4bharat` fourth** — IIT Madras IndicTTS / IndicParler-TTS open weights. Will cover Bhojpuri, Bodo, Manipuri where Bhashini is thin. Phase 7 wiring pending.
- **`sarvam` last** — commercial paid TTS. Last resort. Disabled in v1 (spec §11.3: closed-source paid costs must be logged + rate-limited + only used after free suppliers fail).

---

## 3. Why `mock_bhashini` is the active stub

To go from MOCK → real Bhashini we need:

- A registered Bhashini ULCA citizen account.
- An inference API key.
- A stated use case: *accessibility infrastructure for blind / illiterate users in 26 Indian languages, free at point of use, attribution to Bhashini on every audio response, no commercial redistribution.*

The application body is at [`README.md`](README.md) §6 and at the master spec §9.

Until creds arrive, `VOICE_FACTORY_USE_MOCK_BHASHINI=1` keeps the mock active.
Setting it to `0` and providing real keys flips Bhashini live with **no other
code change** — the cascade already prefers `bhashini` over `mock_bhashini`
when both are enabled.

This is by design: the day Bryan gets the email saying "your ULCA account is
approved," the only operation is to set three env vars on Railway. No re-deploy
of frontend, no model retraining, no migration.

---

## 4. Things we EXPLICITLY DECIDED NOT to do

(Reproduced from spec §2 so future Claude does not "improve" these back in.)

### 4.1 NO Doordarshan / Prasar Bharati / YouTube scraping
**Why blocked:** anchor voices are personality rights (cf. *Anil Kapoor v. Simply Life India*, Delhi HC 2023; *Arijit Singh v. Codible Ventures*, Bombay HC 2024). Prasar Bharati holds broadcast copyright. Risk = takedown + named defendant.
**Use instead:** Bhashini, AI4Bharat, Sarvam, Mozilla Common Voice, opt-in donors.

### 4.2 NO "cousin = primary + grammar swap + voice morph"
**Why blocked:** Tulu is a separate Dravidian language, not Kannada-with-a-filter. Konkani has 4 dialects across 4 scripts. Morph output sounds like mockery to actual speakers.
**Use instead:** real per-language models from Bhashini / AI4Bharat. For Tulu / Kodava / Oraon (no model exists): voice-donor program, NOT silent fallback.

### 4.3 NO claim of "<100 ms on-device, native-quality, cloned, 12 languages, 50–100 MB"
**Why blocked:** XTTS-v2 weights are ~1.8 GB. The maths doesn't work.
**Use instead:** measured per-language latency in the ledger. Cascade picks the supplier that actually meets target.

---

## 5. Why the community voice contest (Phase 2)

The honest answer to Tier C is: **we cannot legally or technically synthesise
Tulu or Kodava or Oraon today.** Bhashini has no model. AI4Bharat has no model.
Sarvam has no model.

The honest answer to *some* Tier B languages (Bhojpuri, Bodo, Chhattisgarhi,
Santhali) is: the model exists but quality is uneven, and users would rather
hear another native speaker than a robot.

So we let real native speakers donate their voice, under explicit two-stage
consent, with **permanent attribution** and **no deletion of confirmed
winners** (`can_delete=0`). The strongest submission per language becomes the
synthesis voice for that language across every Chitti product.

This is not a free crowdsourcing scheme — it is a credit-and-permanence
contract. The user gives Chitti their voice; Chitti gives the user a page in
the Hall of Fame that never goes down. Compensation is revisited at 100 donors
(spec §11.4).


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
