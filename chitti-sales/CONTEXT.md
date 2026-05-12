# Chitti Sales — Context

## Why this exists

India has roughly 6 crore MSMEs and several crore freelancers / gig workers. Most owners learned their business from a parent, an uncle, or by watching the shop next door — none of them went to a b-school, and none of them have read *Influence* or *SPIN Selling*. The result: a kirana owner who can buy and stock perfectly cannot ask a returning customer for a referral; a salon owner with three excellent stylists cannot get a no-show client to rebook; a tutor with five years of perfect feedback cannot raise prices.

Common voice-asked questions:

- "Mere paas customers aate hain, lekin wapas nahi aate. Kya karoon?"
- "Cold call karne se darr lagta hai. Kya bolun shuru mein?"
- "Discount maangne wale ko 'nahi' kaise bolun, bina customer khoye?"
- "WhatsApp pe follow-up karoon ya phone karoon?"
- "Mera competitor mujhse sasta hai. Customer ko kaise convince karoon?"

A real sales coach in Tier-1 India charges Rs 2,000 – Rs 10,000 a session and replies in English. Most MSME owners cannot afford that, and many cannot read English. Chitti Sales exists to give a calm, plain-language coaching answer to one of these questions in Hindi / Tamil / Telugu / Bengali / Marathi etc. — **one tactic at a time, grounded in a fixed set of 10 books, with a server-enforced "this is coaching, not a guarantee" disclaimer**.

It is the **counterpart of [Chitti CA](../chitti-ca/) and [Chitti Legal](../chitti-legal/)**: not a doer (no CRM, no autodialer, no spam), but a coach — same posture as a CA who explains tax language before you go to your real CA.

## The four-user accessibility contract

Every Chitti product must work for the four PWD users we promise: **blind, deaf, mute, illiterate** (and elderly users by extension).

For Chitti Sales that means:

| User           | Path                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| **Blind**      | Speech-in via the mic button, then SpeechSynthesis read-aloud of the reply.                             |
| **Deaf**       | All input is text or topic chips; the reply renders as text with high contrast.                          |
| **Mute**       | Type the question, or tap a topic chip — no voice required.                                              |
| **Illiterate** | Topic chips (Lead / Follow-up / Pricing / Objection / Referral / Cold call) plus voice-in / voice-out cover non-readers. |
| **Elderly**    | Same surface as the four PWD users; large touch targets, high contrast, voice-first.                     |

The proposed frontend page (`chitti_sales.html` at the repo root, not yet built) advertises this contract in the header banner. The proposed backend (see [ARCHITECTURE.md](ARCHITECTURE.md)) is language-aware: the request body accepts a `language` field for any of the 12 Indian languages — English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Odia, Punjabi, Urdu.

## Server-enforced "coaching, not a guarantee" disclaimer

The single most important design decision is the same one Chitti CA and Chitti Legal hold: **the disclaimer is server-side**, not a frontend banner that some other page or scraped client could strip.

Mechanism (proposed — see [PROMPTS.md](PROMPTS.md)):

1. The system prompt instructs the model to always end with:
   > `This is sales coaching from distilled books, not a guarantee. Your results depend on your product, price, market, and effort.`
2. Before the reply leaves the server, `_enforce_disclaimer()` checks whether that exact string is present. If not, it is appended.
3. Even the fallback path (when `DEEPSEEK_API_KEY` is missing) goes through `_enforce_disclaimer()`, so an unconfigured deploy still cannot return advice without the warning.

Same pattern as the permanent sticky NOT SEBI REGISTERED banner on Chitti Vaani / Fundamentals / Technical, and the "consult a registered CA" / "consult a licensed advocate" lines on CA / Legal.

## Honest-stub stance

Chitti Sales does not integrate with WhatsApp Business, does not place calls, does not read contact lists, does not parse invoices, does not score leads. It is a Q&A coach. The roadmap (see [TODO.md](TODO.md)) lists what a fuller "Chitti Sales Pro" would look like; until those land, the product is positioned as a coach that ends every interaction by pointing the user at a real action they can take this week.

## Why books, not scraped sales blogs

The internet's sales advice is mostly recycled blogspam. The 10 books in [SALES_BOOKS.md](SALES_BOOKS.md) are the canon — Carnegie, Cialdini, Rackham, Voss, Pink, Klaff, Tracy, Dixon-Adamson, Ross, Moore. Grounding every reply in this fixed set keeps the model from drifting into the latest LinkedIn fad. The model **labels which book** each tactic came from; the [GUARDRAILS.md](skills/GUARDRAILS.md) rule says it must never fabricate a tactic that is not in those 10 books.


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
