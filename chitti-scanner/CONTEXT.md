# Context — Why Chitti Product Scanner exists

## The problem

Across India, the people most exposed to label-and-document fraud are the people least able to read those labels and documents:

- An illiterate parent at a kirana store cannot read the FSSAI block, so a 28-gram sugar bomb is sold as a "healthy" cereal.
- A 70-year-old widow cannot read a 14-point insurance prospectus, so she signs auto-renewal she did not understand.
- A migrant worker is handed a Hindi-only utility bill; he pays whatever number is at the bottom.
- A blind diabetic gets a strip of medicine; she cannot read the expiry, the salt, or the brand on the foil.

These users **cannot fill forms** — but they can point a phone at a packet, or speak the words on it. Chitti Product Scanner is the front door that converts that simple act (snap or speak) into a plain-Hinglish verdict with explicit warnings, savings, and a clear next step.

## Why it sits next to MedUPI, UPI Guard, Vaani

Scanner is intentionally **horizontal** — it does not own a domain by itself. Instead, it identifies the document `type` and hands the user off to the right specialist:

```
              ┌──────────── medicine ─────────► Chitti MedUPI (Jan Aushadhi alts)
              │
  Scanner ────┼──────────── insurance ────────► Chitti UPI Fraud Guard (premium safety)
              │
              ├──────────── food / any ────────► Chitti Vaani (read aloud)
              │
              └──────────── bill / mrp ────────► Consumer helpline 1800-11-4000 (tel:)
```

This is deliberate: a label-reader that *also* tries to be a price-comparison engine, *also* a fraud detector, *also* a doctor would be a half-built tower of compromise. The Scanner is fast, opinionated, and ships the user off to a deeper agent the moment a domain is recognised.

## Privacy posture for PII

| Element | Treatment |
|---|---|
| Raw uploaded image | Processed **in-memory** in the Flask process; never written to disk, never persisted in a database, never sent to any third party other than the DeepSeek inference endpoint |
| OCR / typed text | Forwarded once to DeepSeek with the request-scoped prompt; never logged at request body level |
| Aadhaar number on a doc | Frontend masks to last 4 digits before display (`XXXX XXXX 1234`) |
| PAN | Frontend masks to last 4 (`XXXXXX1234X`) |
| Bank account / UPI VPA | Masked to last 4 |
| Scan history | Lives **only** in the user's `localStorage` (`chitti_scanner_history`), capped at 20 entries, clearable from the UI |
| User consent | Stored in `localStorage.chitti_scanner_consent_given`; T&C must be read (or read aloud) and accepted before camera, mic, or analyse fires |
| DeepSeek calls | Use HTTPS, Bearer auth, JSON-mode response; the API key lives only in the Render env (`sync: false`) |
| CORS | Locked to `https://sahayai.in,https://www.sahayai.in` in production (`ALLOWED_ORIGINS`) |

There is no DB. There is no cookie. There is no upstream user account. A scan is a one-shot HTTP request that exists in RAM for the duration of the response and then disappears.

## Four-user accessibility contract

The Chitti contract is non-negotiable: every Chitti product must work for four "PWD persona" archetypes at the same time, on the same screen, without a settings flip.

| User | Their problem | How Scanner serves them |
|---|---|---|
| **Blind** | Cannot see camera viewfinder, cannot read result | Every action (T&C, mic, capture, analyse, hear-again) has a labelled button; result auto-speaks via `speechSynthesis` in the chosen Indian language; "Send to Vaani" floating button always present |
| **Deaf** | Cannot hear the read-aloud | Full visual readout — type badge, summary, key facts, warnings (red box), savings (green box), legal line (amber box); no audio-only signal |
| **Mute** | Cannot speak the label into the mic | Text input + camera + gallery upload all work without voice; the mic is purely additive |
| **Illiterate / elderly** | Cannot read the label or the result | Result rendered in plain Hinglish with large 14-15 px text and high-contrast colour blocks; symbols on every action (📷 🖼️ ⌨️ 🎙️ 💊 🛡️ 🔊) so the user can navigate by icon alone |

Colour is **never** the only signal — every coloured block (red warnings / green savings / amber disclaimer) is also labelled with a symbol and a heading.

## SEBI / regulatory posture

Scanner does not give investment advice, medical advice, or legal verdicts. The per-`type` legal disclaimer is **enforced server-side** in `scanner_service._normalise()` so the frontend cannot accidentally drop it. The lines are:

| Type | Hinglish disclaimer (Hindi-Roman) |
|---|---|
| food | *Yeh FSSAI label ki information hai. Dietary advice ke liye nutritionist se milo.* |
| medicine | *Yeh sirf label ki information hai. Doctor se confirm karo pehle.* |
| legal_doc | *Yeh AI summary hai. Final decision apne aap lo ya vakeel se lo.* |
| bill / mrp | *Agar overcharging hai toh consumer helpline 1800-11-4000 pe call karo.* |
| insurance | *Premium pay karne se pehle UPI Fraud Guard mein check kar lo. Agent se policy number confirm karo.* |
| other | *Yeh AI ki madad hai. Doctor ya lawyer se confirm zaroor karo.* |

The repo-wide SEBI sticky banner + full legal modal is included via `chitti_disclaimer.js` at the bottom of `chitti_scanner.html` and must never be moved to the footer.

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
