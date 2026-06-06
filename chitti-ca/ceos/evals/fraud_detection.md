🎖️ World Class Chitti CA OS — Commando Discipline. Zero Excuses.

# EVAL — Fraud detection (≥90%)

Asserted against `fraudShield()`.

| Signal | Gold |
|---|---|
| Valid 15-char GSTIN (correct checksum) | PASS (genuine) |
| Tampered GSTIN (bad checksum / wrong length / bad format) | FLAG fake-GST |
| Duplicate invoice no. + same vendor + same amount | FLAG duplicate |
| Line rate > market band ×N | FLAG overbilling |
| New vendor, round-number high-value, no GSTIN | FLAG vendor-risk |

Pass = precision + recall ≥90% on the labelled set; every flag carries `why` +
`confidence` + "verify before acting" (no false accusation as certainty).

---
> **World Class Chitti CA OS — Commando Discipline. Zero Excuses.**
