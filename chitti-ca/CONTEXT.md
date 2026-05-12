# Chitti CA — Context

## Why this exists

India has roughly 6 crore MSMEs, 1.5 crore registered GST businesses, and several crore freelancers / gig workers. The vast majority cannot afford to put a Chartered Accountant on retainer for a one-line question like:

- "I am a freelancer earning Rs 8 L this year — which ITR form?"
- "Do I need to register for GST if I sell online and my turnover is under Rs 20 L?"
- "I got a notice under Section 143(1). What does this mean?"

Asking a CA each time costs Rs 500 – Rs 2,000 and a day of delay. Googling returns blogspam from 2017 quoting outdated section numbers. The result: first-time filers either freeze, or they file wrong and pay penalties later.

Chitti CA exists to give a calm, plain-language first answer to these questions in Hindi or English — and then explicitly hand off to a real CA before anything binding happens. **It is a triage tool, not a replacement.**

## The four-user accessibility contract

Every Chitti product must work for the four PWD users we promise: **blind, deaf, mute, illiterate**.

For Chitti CA that means:

| User           | Path                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| **Blind**      | Speech-in via the mic button, then SpeechSynthesis read-aloud of the reply.                             |
| **Deaf**       | All input is text or topic chips; the reply renders as text with high contrast.                          |
| **Mute**       | Type the question, or tap a topic chip — no voice required.                                              |
| **Illiterate** | Topic chips (ITR / GST / TDS / 80C-80D / 44AD-44ADA / Notice received) plus voice-in / voice-out cover non-readers. |

The frontend page (`chitti_ca.html` at the repo root) advertises this contract in the header banner. The backend is deliberately language-aware: the request body accepts a `language` field for any of the 12 Indian languages the prompt understands (English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Odia, Punjabi, Urdu).

## Server-enforced "not a substitute for a CA" disclaimer

The single most important design decision in this product: **the disclaimer is server-side**, not a frontend banner that some other page or scraped client could strip.

Mechanism (see [services/ca_service.py](backend/services/ca_service.py)):

1. The system prompt instructs the model to always end with:
   > `This is AI-generated guidance. Consult a registered CA for your actual filings.`
2. Before the reply leaves the server, `_enforce_disclaimer()` checks whether that exact string is present. If not, it is appended.
3. Even the fallback path (when `DEEPSEEK_API_KEY` is missing) goes through `_enforce_disclaimer()`, so an unconfigured deploy still cannot return advice without the warning.

This pattern is shared with Chitti Vaani (financial advice) and Chitti Legal (legal advice). It is the same legal-safety principle as the permanent sticky NOT SEBI REGISTERED banner on the equity products: **never let the disclaimer move to the footer, and never let it be stripped**.

## Honest-stub stance

Chitti CA does not integrate with the income-tax portal. It does not file returns. It does not read books of accounts. It is a Q&A wrapper. The roadmap (see [TODO.md](TODO.md)) lists what real-CA features would look like; until those land, the product is positioned as a triage tool that ends every interaction by pointing the user at a qualified human.


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
