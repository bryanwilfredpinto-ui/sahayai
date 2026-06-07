🎖️ World Class Chitti Legal OS — Commando Discipline. Zero Excuses.

# PRD — Chitti Legal OS feature surface (10 CEOS features + research modules)

> Maps the CEOS brief's 10 features + the Section-C research modules onto deterministic
> engine modules (L1–L10) and the page tabs. **Rules are the product; the LLM is an
> enhancement.** Every module output carries `{ confidence, risks[], sources[] }`.
> Engine: [chitti_legal_os_engine.js](../../chitti_legal_os_engine.js). Page: [chitti_legal_os.html](../../chitti_legal_os.html).

## Module map

| Module | CEOS feature | Engine fn | Page tab | Deterministic? |
|---|---|---|---|---|
| **L1 Rights Coach** | Feature 5 (Rights Coach) + police-interaction (research #6) | `rightsCoach`, `caseCompanion` | ⚖️ Rights | ✅ KB |
| **L2 Limitation engine** | Feature 9 (Deadline Tracker) + research #1 | `limitationCheck` | ⏰ Deadlines | ✅ rule table |
| **L2b Cheque s.138 timeline** | research #2 | `chequeTimeline` | ⏰ Deadlines | ✅ exact dates |
| **L3 Notice Decoder** | Feature 1 (Legal Scanner) + research #5 | `decodeNotice`, `classifyNotice` | 📄 Decode | ✅ classifier + KB |
| **L4 Contract Risk** | Feature 2 (Contract Doctor) + research #8 | `contractRisk` | 📝 Contract | ✅ weighted flags |
| **L5 Consumer Router** | Feature 4 (Consumer Rights) + research #7 | `consumerRouter` | 🛒 Consumer | ✅ CPA 2021 thresholds |
| **L6 Court Companion** | Feature 7 (Court Companion) | `caseCompanion` | ⚖️ Rights | ✅ stage KB |
| **L7 Doc Checklist** | Feature 3 (Land/Property) + Feature 8 docs + research #11 (RTI) | `docChecklist` | 🛒 Consumer | ✅ KB |
| **L8 Free Legal Aid + Govt layer** | Feature 6 (Govt-Benefits Legal Layer) + research #3,#9,#10,#12 | `legalAid`, `govtLegalLayer` | 🏛️ Free help | ✅ s.12 LSA Act |
| **L9 Scam Shield** | research #4 (cyber/digital-arrest) | `scamShield` | 🛡️ Scam shield | ✅ heuristic |
| **L10 Legal Memory Twin** | Feature 8 (Legal Memory) + Feature 10 (Prevention) | `twin.*` | 🧬 My Twin | ✅ on-device |

## Feature detail (CEOS brief, made concrete)

**Feature 1 — Legal Scanner / Notice Decoder.** User picks (or pastes) FIR / notice /
summons / agreement / 138 / IT / GST / eviction / SARFAESI. Chitti explains: *what is
it · who issued it · what it means · deadline · worst case · next 3 steps.* (Camera OCR
of the physical notice = BO11, honest stub until the DeepSeek-vision key lands.)

**Feature 2 — Contract Doctor.** Employment / rent / vendor / loan contracts → plain
explanation + risk score + red flags + negotiation suggestions. (Full-text clause
parsing via vision/LLM = BO11; the deterministic red-flag checklist works today.)

**Feature 3 — Land & Property Assistant.** Sale deed / mutation / registry / inheritance
/ partition → doc checklist + limitation (12-year possession / partition) + where & cost.

**Feature 4 — Consumer Rights Assistant.** Refunds / insurance / builder delays /
defective products / online scams → rights + correct forum (by value) + 2-year deadline
+ e-Daakhil + complaint steps. Draft generation = BO11 (LLM enhancement).

**Feature 5 — Legal Rights Coach.** Employee / tenant / women / senior / consumer /
police-interaction / cyber / student rights, each with the law behind it and first steps.

**Feature 6 — Government Benefits Legal Layer + Free Legal Aid (the moat).** Links the
user's situation to the FREE legal help and entitlements they are owed: NALSA s.12 free
legal aid, Maintenance Tribunal, Lok Adalat, and the right helpline.

**Feature 7 — Court Companion.** Civil / criminal / consumer / cheque / family case →
stages + documents + what to expect. Never predicts the outcome.

**Feature 8 — Legal Memory (Twin).** Stores agreements, notices, licences, court docs,
matters + deadlines on-device, with reminders. "Chitti forget" wipes everything.

**Feature 9 — Legal Deadline Tracker.** Limitation periods + compliance/renewal/court
dates + the cheque cascade. Prevention > Penalty.

**Feature 10 — Legal Prevention (the biggest moat).** The deadline engine, contract
red-flag checker and scam shield together stop the problem before it starts —
*"Rent agreement expires in 30 days → renew before expiry."*

## Guardrails (enforced in code + [guardrails/](guardrails/))

Never pretend to be a lawyer · never guarantee outcomes · never predict court decisions ·
never hide uncertainty · never give illegal advice. Always: explain confidence, encourage
professional/free legal help when needed, cite the legal basis, explain risks.

---
> **World Class Chitti Legal OS — Commando Discipline. Zero Excuses.**
