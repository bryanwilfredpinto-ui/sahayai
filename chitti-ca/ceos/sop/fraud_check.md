🎖️ World Class Chitti CA OS — Commando Discipline. Zero Excuses.

# SOP-005 — Fraud Check (before you pay)

```
Collect document → Validate GSTIN (checksum) → Scan invoices (duplicate/overbill) →
Score vendor risk → FLAG to VERIFY (never accuse) → Recommend next step
```

1. **Collect** — GSTIN, invoice list, line rate vs market, vendor newness.
2. **GSTIN** — format + checksum (`validateGSTIN`); a bad checksum → likely fake.
3. **Invoices** — duplicate detection; overbilling vs market band.
4. **Vendor risk** — new + high-value + no GSTIN → flag.
5. **FLAG to VERIFY** — every flag is a reason to confirm on the GST portal / with the
   vendor, **never** a proof of fraud (no false accusation as certainty).
6. **Next step** — confirm on portal; withhold payment until verified.

Engine: `fraudShield` · `validateGSTIN`. Eval: [evals/fraud_detection.md](../evals/fraud_detection.md).

---
> **World Class Chitti CA OS — Commando Discipline. Zero Excuses.**
