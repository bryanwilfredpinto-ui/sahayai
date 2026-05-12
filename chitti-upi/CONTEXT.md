# Chitti UPI Fraud Guard — Context

> **Scope clarification (read first).** Chitti UPI Fraud Guard is a
> **fraud-text classifier**, not a payment intent parser. It does not
> generate `upi://pay?...` intents, does not move money, and never taps
> "Pay" on the user's behalf. Users paste / dictate suspicious text and
> Chitti returns HIGH / MEDIUM / LOW + a spoken warning. The user makes
> the payment decision in their own bank/UPI app. The "Pay 200 to
> Ramesh → UPI intent" shape is **v2 research**, not v1 behaviour. See
> §2 below for the shipped-vs-future table.

## 1. Why this product exists

India ran ~131 billion UPI transactions in FY24. The same rails carry the
country's biggest scam wave: KYC-update SMS, "electricity disconnection"
threats, fake KBC-lottery processing fees, OTP-on-call phishing, and
collect-request-disguised-as-send.

The users who lose the most money are precisely the users Sahay AI is
built for:

- **Blind users** who cannot inspect a long UPI handle or a suspicious URL
  on screen and rely entirely on what the phone reads aloud.
- **Deaf users** who miss the verbal urgency of a fraudster's call and
  cannot dial the 1930 cyber-crime line by ear.
- **Mute users** who cannot escalate fast over a phone call when something
  feels wrong.
- **Illiterate / first-time-smartphone users** who cannot parse a phishing
  link, cannot verify a payee VPA, and cannot read the bank app's own
  fraud-warning labels.

Existing UPI apps assume the user can read, can see, can speak, and can
verify a 16-character VPA in two seconds. They cannot. Chitti UPI Fraud
Guard is a **second-opinion layer** the user can ask before tapping "Pay"
in their bank/UPI app.

## 2. What the product is — and what it is not

The user-prompt for these docs floated a future shape:
> "Pay 200 to Ramesh" → confirm + open UPI intent, NOT execute payment directly.

That is **not** what is shipped today. Reading
[`backend/services/upi_service.py`](./backend/services/upi_service.py) and
the canonical [`../chitti_upi.html`](../chitti_upi.html) confirms the
shipped scope is even narrower and even safer:

| Shipped (v1)                                              | Future v2 — not built          |
|-----------------------------------------------------------|--------------------------------|
| User pastes / dictates suspicious text                    | "Pay 200 to Ramesh" voice intent |
| Chitti returns HIGH / MEDIUM / LOW + spoken warning       | Chitti generates `upi://pay?pa=...` |
| User reads warning, decides themselves, opens bank app    | Hand-off via Android intent     |
| Zero payment data is touched                              | Per-payment readback + 5s undo  |

The v1 scope is **deliberately** a warning tool, not a payment tool.
[`./SKILL.md`](./skills/chitti-upi/SKILL.md) and the consent gate both
declare this verbatim: "Chitti ek AI warning tool hai — yeh payment block
nahi kar sakta."

## 3. The "no money leaves without readback and confirm" guardrail

Even though v1 cannot move money, the architecture is already built around
the rule that **all action steps must be readback-first**. This is a
direct port of the pattern from Chitti Vaani's family-cascade emergency
protocol (see project memory entry _Vaani emergency protocol — family
cascade, never cops_):

1. **No silent action.** Every `actions[]` item the model returns is
   rendered in the verdict band AND spoken via the Voice Factory.
2. **No false reassurance.** When the AI is offline, `_fallback()` in
   `backend/services/upi_service.py` returns **MEDIUM**, never LOW. The
   user is told "Chitti AI offline hai. Khud merchant se confirm karo."
3. **Legal lines always.** Every response includes
   `legal_lines: [1930 line, "Chitti cannot block payment" line]`. The
   frontend renders both AND speaks both after the warning.
4. **Symbols + voice + plain English.** Verdict band is colour-coded
   (red/orange/green), icon-led, and the model is instructed to write in
   the user's chosen Indian language as "Hinglish" so an illiterate user
   can follow by ear.
5. **Confirm-before-act, never act-before-confirm.** When a v2 payment
   intent is built, it MUST mirror Vaani's pattern: master confirms →
   spouse/family on cascade → readback the payee + amount in the user's
   own language → 5-second cancel window → then and only then surface the
   Android `upi://pay` intent.

This is non-negotiable because the user base includes blind users who
cannot recover a wrong tap with a glance at the screen.

## 4. Cross-reference: Vaani emergency protocol

The pattern UPI Guard reuses is documented in project memory under
**Vaani emergency protocol — family cascade, never cops**. Key transfers:

- Master confirms before any action that affects the real world.
- Family ring (spouse / sibling / adult child) is contacted before any
  state actor. NEVER auto-dial 112 / 100 / 102. For UPI fraud the
  legitimate state escalation path is 1930 (cyber-crime helpline) — the
  user is **told** the number, never auto-dialled.
- Chitti-to-Chitti relay (UPI Guard → Vaani) when verdict is `HIGH`, so
  the family ring can be raised without the user re-dictating the story.

## 5. Four-user accessibility contract (project memory)

This product complies with the project-wide _Four-user accessibility
contract — Blind / Deaf / Mute / Illiterate_:

| User       | Provided by                                                                 |
|------------|-----------------------------------------------------------------------------|
| Blind      | Voice IN (dictation), Voice OUT (warning + legal lines), no colour-only UI  |
| Deaf       | Full visual verdict band, icon, `indicators[]` chips, no audio dependency   |
| Mute       | Text paste / keyboard input; no phone call required                         |
| Illiterate | Plain Hinglish, large icons, sample-card buttons, speak buttons on T&C      |

`chitti_upi.html` includes 4 sample cards (KYC scam, electricity scam,
KBC-lottery scam, OTP-on-call) so an illiterate user can tap an example
instead of typing.

## 6. Tone, not just text

The system prompt instructs Chitti to be a "protective older sibling" —
direct and urgent when needed, never panicked, never accusatory. This is
intentional: the target user is often elderly or first-time-digital and a
banking-app's clinical "Unauthorized Transaction Detected" message reads
as a second scam to them.

---

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
