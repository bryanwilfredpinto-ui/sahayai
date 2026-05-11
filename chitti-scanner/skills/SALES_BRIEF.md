# SALES BRIEF — Chitti Product Scanner

For partners, investors, and CSR sponsors. Ten pain points, ten benefits. No jargon.

## Ten pain points Chitti Scanner solves

1. **Illiterate parent cannot fill the Aadhaar enrolment form.** They cannot read the column headings, let alone match a printed Aadhaar copy against the form fields.
2. **Senior cannot tell if a hand-written utility bill is genuine.** The shop wrote "Rs 870" in pencil; the official tariff line is in 8-point Hindi at the bottom.
3. **Diabetic cannot read the expiry on a medicine strip.** The foil is crinkled and the expiry is printed in 6-point ink.
4. **Migrant worker is handed a Marathi-only insurance prospectus.** He signs without knowing he agreed to a five-year auto-renewal.
5. **Kirana customer cannot check sugar content on a "Healthy Cereal" box.** The FSSAI block is in 7-point text on the side panel; the front shouts "100% NATURAL".
6. **Family member cannot extract a medicine name from a strip to search Jan Aushadhi.** Composition is half-erased; brand is in a stylised font.
7. **Blind user cannot see the MRP sticker.** The shop quotes Rs 60; the printed MRP is Rs 45.
8. **Deaf user cannot understand a phone-IVR "press 1 for English".** They want everything on screen, in their language.
9. **Mute user cannot speak the label into a generic voice assistant.** They can only point and tap.
10. **Returning user is afraid the previous app stored their Aadhaar.** They want a one-tap "no DB, no upload kept" promise.

## Ten benefits Chitti Scanner delivers

1. **One-tap snap or speak** — no form, no fields, no typing required.
2. **Structured Hinglish verdict in 3–4 sentences** — the most important finding first, every time. See [PERSONALITY.md](PERSONALITY.md).
3. **Built-in PII masking** — Aadhaar last-4 and PAN last-4 by default. See [VALUES.md](VALUES.md) #4.
4. **Stateless backend** — no DB, no cloud disk, no scan ever persisted server-side. See [BOUNDARIES.md](BOUNDARIES.md) #1.
5. **Server-enforced legal disclaimer per document type** — the model cannot drop it. See `LEGAL_BY_TYPE` in [../PROMPTS.md](../PROMPTS.md).
6. **Cross-product hand-off** — medicine → MedUPI for Jan Aushadhi savings; insurance → UPI Fraud Guard; bill → consumer helpline.
7. **Four-user accessibility contract** — blind, deaf, mute, illiterate, on one screen, no settings flip. See [../CONTEXT.md](../CONTEXT.md).
8. **Read-aloud in 9 Indian languages** — Hindi, English, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam.
9. **Honest "unreadable"** — Chitti never invents a field. Smudged expiry stays "unreadable". See [GUARDRAILS.md](GUARDRAILS.md) #2.
10. **20-row local-only history** — on the user's phone, clearable in one tap. No remote backup, no remote retention.
