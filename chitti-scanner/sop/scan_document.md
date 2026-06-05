🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# sop/scan_document.md — Level 5

**Trigger:** category = `document`. Disambiguate the sub-type before routing.

| Sub-type | Signals | Route |
|---|---|---|
| `government_doc` | aadhaar, pan, scheme, yojana, form | **Government** |
| `legal_doc` | notice, summons, section 138, agreement | **Legal** (prefill via localStorage + hash) |
| `bill` / `mrp` | invoice, total, MRP, charged | overcharge check → consumer helpline `tel:1800114000` |
| `insurance` | premium, policy, sum assured | **UPI Fraud Guard** (premium-fraud check) |
| `career_doc` | resume, CV, offer letter, CTC | **Career** (COMING SOON → Vaani) |
| `education` | homework, certificate, diagram | **Education** (COMING SOON → Vaani) |

**Always**
- Mask KYC fragments (Aadhaar/PAN/account → last-4) in the UI; never store raw.
- For legal notices, deep-link to Legal with the OCR text pre-loaded (existing behaviour).
- Explain the route; confirm before handoff.

**Never:** give binding legal/financial counsel. The scanner explains + routes only.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
