# Chitti Legal — Why it exists

## The user

A first-generation Indian renter is handed an eight-page rent agreement. A delivery driver receives a Section 138 cheque-bounce notice with a fifteen-day clock. A widow gets an FIR copy and cannot tell if she is the complainant or the accused. A small-shop owner is served a consumer-court complaint. None of these people can afford to lose a Saturday talking to a lawyer they have not yet decided to hire, and none of them can read the legalese alone.

Chitti Legal sits in the gap between "panic" and "lawyer-meeting-on-Monday." It does not replace the lawyer. It tells the citizen what the document is, what the deadline is, and what to ask the lawyer.

## What it covers

From [services/legal_service.py](backend/services/legal_service.py) and the doc-type chips in [chitti_legal.html](../chitti_legal.html):

- Rent agreements
- Employment contracts
- NDAs
- Sale deeds
- Affidavits
- Demand notices (eviction, recovery, IT-Sec 138, motor-accident claim, etc.)
- Consumer-court complaints
- FIR copies

The model is also told it may point to the relevant act / section (e.g. "this looks like an arbitration clause under the Arbitration & Conciliation Act, 1996, Section 7") and to suggest questions the user should ask their lawyer.

## Four-user accessibility contract

Per the Sahay AI accessibility contract, every Chitti product must work for **blind, deaf, mute, illiterate** users. Chitti Legal implements this as:

- **Voice IN** — `🎙️ Speak` button uses the browser SpeechRecognition API, locale set from the chosen reply language (e.g. `hi-IN`). A mute user can type or paste a photo of the document later (planned); a blind user can dictate.
- **Voice OUT** — `🔊 Read aloud` button reads the explanation via SpeechSynthesis. A deaf user gets the plain-text rendering. An illiterate user gets it read aloud in their chosen language.
- **Plain English / Hindi by default** — the system prompt explicitly tells the model to define every legal term in the same sentence the first time. No "prima facie" without a translation.
- **Symbols, not colour-only signal** — the input area is fronted by a red `never` card listing what Chitti will not do. Status changes are also surfaced in plain text (`ready`, `listening…`, `asking Chitti Legal…`, `done`, `error`, `offline`) rather than colour cues.
- **12 reply languages** out of the box: en, hi, ta, te, bn, mr, gu, kn, ml, or, pa, ur.

## SEBI banner

Chitti Legal does not deal with securities, so the SEBI "NOT SEBI REGISTERED" banner does not apply here. The equivalent for this product is the sticky red **legal disclaimer bar** at the top of [chitti_legal.html](../chitti_legal.html). Per the project's permanent-banner rule, this bar never moves to the footer.

## Server-enforced disclaimer

The disclaimer is enforced at three layers and any one of them on its own would be enough:

1. **System prompt** ([legal_service.py](backend/services/legal_service.py), `CHITTI_LEGAL_PROMPT`) tells the model: *"End every reply with the line: 'AI explanation only. Not a substitute for a licensed lawyer. Consult a lawyer before signing or replying.'"*
2. **`_enforce_disclaimer()`** post-processes every model reply. If the literal string is not present, it is appended after a blank line. Empty replies are replaced with just the disclaimer.
3. **Fallback path** — when `DEEPSEEK_API_KEY` is missing or the upstream call fails, the function still returns `{ok: true, source: "fallback", reply: <disclaimer-tagged note>}`. The user can never receive a reply without the disclaimer, even when the model is down.

## What Chitti Legal will never do

Repeated verbatim from the homepage card, the system prompt, and the README so that no engineer "accidentally" extends scope:

- Draft a binding contract for the user
- Predict who will win a case
- Tell the user to ignore a notice
- Invent a statute number or a case citation
- Repeat back sensitive numbers (Aadhaar, PAN, account number)


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
