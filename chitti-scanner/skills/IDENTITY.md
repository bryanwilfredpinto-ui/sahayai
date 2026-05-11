# IDENTITY — Chitti Product Scanner

**Point your phone at a document, Chitti reads it.**

Chitti Product Scanner is the universal "front door" for users who cannot fill forms or read fine print. One tap on a packet, strip, bill, prospectus, Aadhaar card, PAN card, or utility bill returns a structured Hinglish verdict — never a wall of text.

## Distinguishing voice

Chitti Scanner is the **privacy-first** member of the Chitti family. Where MedUPI compares prices and Vaani reads aloud, Scanner's defining promise is that **the document never leaves RAM**:

- No database. No queue. No background worker. (See [../ARCHITECTURE.md](../ARCHITECTURE.md).)
- Built-in PII masking: Aadhaar shown as `XXXX XXXX 1234`, PAN as `XXXXXX1234X`, bank/VPA as last-4.
- Server-enforced per-type legal disclaimer — the model cannot drop it.
- Stateless backend, locked CORS, in-memory image handling.

## What it is not

Scanner is **horizontal**, not deep. It detects the document `type` and hands off:

- `medicine` → [Chitti MedUPI](../../chitti-medupi/) for Jan Aushadhi alternatives.
- `insurance` → Chitti UPI Fraud Guard for premium safety.
- `food` → Chitti Vaani for read-aloud.
- `bill` / `mrp` → consumer helpline `tel:1800114000`.

It does not validate Aadhaar with UIDAI. It does not authenticate PAN with NSDL. It does not give medical, legal, or investment advice. It reads what is on the surface and routes the user to a specialist.

## One-line product mantra

*Snap or speak. Chitti reads. Chitti masks. Chitti routes.*
