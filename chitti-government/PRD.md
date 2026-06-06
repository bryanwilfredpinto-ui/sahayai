🎖️ **World Class Chitti Government — Commando Discipline. Zero Excuses.**

# PRD — Chitti Government (CEOS v1.0)

> Product requirements. Each feature carries: user story · UX flow · inputs/outputs ·
> deterministic core · accessibility · failure modes. Answers to
> [ROLE.md](ROLE.md) (nine-artifact rule) + [CONSTITUTION.md](CONSTITUTION.md).
> Build sequence is in [BUILD_ORDER.md](BUILD_ORDER.md).

Legend: 🟢 LIVE · 🟡 PARTIAL/wired · 🔵 PLANNED · honest stubs never faked.

---

## Feature 1 — Scheme Finder & Eligibility Engine 🟢

**Story:** *"I am a farmer from Maharashtra"* → eligible schemes, benefits, documents
required, application links.

- **Input:** Citizen Digital Twin (age, gender, income, state, occupation, category,
  BPL/SECC, landholding, disability, rural/urban) — by voice, tap, or saved profile.
- **Deterministic core:** rule-engine evaluates each catalog scheme →
  `eligible | partial | ineligible | unknown`, with a per-rule pass/fail trace
  (`age ≥ 60 ✓`, `income ≤ ₹X ✗`, `landholding unknown ❔`).
- **Output:** ranked eligible list; each card → benefit, eligibility trace, document
  checklist, official apply link (source shown), nearest office.
- **LLM enhancement:** DeepSeek phrases the verdict as an 80–120-word spoken summary
  in the user's language. Never decides eligibility.
- **Failure modes:** missing input → `unknown` + "tell Chitti your X to check";
  no DeepSeek → deterministic EN/HI text (no "coming soon" ever).
- **Guardrails:** [no_fake_schemes](guardrails/no_fake_schemes.md),
  [no_guarantee_approval](guardrails/no_guarantee_approval.md),
  [no_guess_eligibility](guardrails/no_guess_eligibility.md).

## Feature 2 — Document Advisor & Universal Scanner 🟡

**Story:** scan/declare what documents I have → what I have vs what I'm missing.

- **Output:**
  ```
  Available  ✓ Aadhaar  ✓ PAN
  Missing    ✗ Voter ID  ✗ ABHA Card  ✗ Ayushman Registration
  ```
- **Universal Scanner (🔵 camera):** one button identifies Aadhaar / PAN / land
  record / pension letter / GST notice / scholarship form and routes it. Uses the
  shared [`chitti_camera.js`](../chitti_camera.js) substrate + camera-intelligence
  contract ([SAHAYAI_MASTER §2b](../SAHAYAI_MASTER.md)). Until vision is funded,
  the **declare-what-you-have** path is fully live (tap checklist).
- **Document → scheme map:** missing a document blocks N schemes — Chitti shows the
  unlock value ("get UDID → unlocks 5 schemes"). See [DATABASE.md](DATABASE.md).
- **Accessibility:** every document name spoken + icon; checklist is tap-first.

## Feature 3 — Life-Event Engine 🟢 (deterministic) / 🟡 (LLM phrasing)

**Story:** *"My daughter was born"* → Chitti auto-suggests Birth Certificate, Sukanya
Samriddhi, vaccination programs, state schemes, school pathway.

- **Deterministic core:** life-event → {documents, schemes, registrations, deadlines}
  bundle map ([skills/life-event-understanding.md](skills/life-event-understanding.md)).
  Events: birth · daughter born · marriage · death · job loss · start business · buy
  land/house · turn 18 · turn 60 · disability onset · move state · retirement.
- **Output:** ordered action plan with deadlines + which family member it affects.

## Feature 4 — Family Governance OS 🔵

**Story:** manage parents + spouse + children together — their documents, schemes,
renewals.

- **Citizen Digital Twin** extended to a **household** of members (on-device).
- Per member: documents held, schemes claimed, renewals due, readiness score.
- Anticipatory: "Father turns 60 in 2 months → old-age pension + senior Ayushman."

## Feature 5 — Business Governance 🔵

**Story:** Startup (DPIIT, Startup India) · MSME (Udyam, Mudra) · Exporter (IEC, DGFT).

- Business profile → applicable registrations + loans + compliance deadlines (GST,
  ITR, ROC) + the right scheme for the ticket size.

## Feature 6 — Government Fraud Shield 🟢 (deterministic) / 🟡 (LLM)

**Story:** paste an SMS/WhatsApp/email → *Possible Fraud · Reason · Confidence*.

- **Deterministic core:** pattern rules over known scam signatures (fake PM-Kisan
  e-KYC link, electricity-disconnection, Aadhaar/PAN update fee, digital-arrest,
  scholarship "processing fee", courier-customs). Output:
  ```
  Possible Fraud
  Reason: Government does not collect this payment / OTP for free schemes.
  Confidence: 94%
  ```
- **Always** ends with the official channel: report to **1930** /
  **cybercrime.gov.in** / **Sanchar Saathi (sancharsaathi.gov.in / chakshu)**.
- **Never** auto-dials police (Golden Rule + emergency protocol).
- Guardrail: [fraud_honesty](guardrails/fraud_honesty.md) — never over-claim;
  genuine government messages must not be flagged (false-positive bar).

## Feature 7 — Deadline Engine 🟢

**Story:** never miss GST, Income Tax, Passport, Driving License, Insurance,
Scholarship, Jeevan Pramaan (life certificate), PM-Kisan e-KYC deadlines.

- Deterministic recurring-deadline calendar per Citizen Digital Twin; 90/30/7-day
  reminders (local notifications + SMS fallback). Confirm-gated per Golden Rule.

## Feature 8 — Citizen Readiness Score 🟢

**Story:** one number that tells me how government-ready I am + what's missing.

- Deterministic: `f(documents held, schemes claimed vs eligible, deadlines met)`.
- Output: Documents % · Schemes Claimed % · Benefits Missed (count + ₹ where known)
  · Readiness %. Tapping any number drills into the action list.

## Feature 9 — Government Copilot (router) 🟡

**Story:** *"What should I do next?"* → prioritised action plan across all features.

- Routes the question through the [Citizen Router](ARCHITECTURE.md) to Documents /
  Schemes / Life-Events, merges via the Citizen Digital Twin, returns one plan.
- This is also the **Vaani routing target** ([SAHAYAI_MASTER §2](../SAHAYAI_MASTER.md)
  — Vaani is the sole user interface; this page is the internal service + debug surface).

---

## Existing live surface (preserved)

The shipped backend already provides: catalog (search + state/category filter),
eligibility rule-engine, document checklist, voice form-helper, PIB alerts (6h poll),
status deep-link handoff, nearby-office locator (Nominatim), local document vault +
expiry tracker, profile. See [API.md](API.md). CEOS adds Features 3–8 on top.

## Cross-feature requirements (every feature)

- **5 frontend gates** ([QUALITY_STATUS §1a](../QUALITY_STATUS.md)): feedback-widget +
  `data-chitti-response`, chitti_a11y.js, Disability Profile prompt, language
  auto-detect, ISL plugin.
- **26-language dropdown** via `chitti_lang.js` — whole page translates. Hard gate.
- **Sticky disclaimer bar** — "Government AI. Confirm with official source."
- **Golden Rule** confirm gate on every side-effecting action.
- **Per-response widget** (🔊 / 🤖 / 👍 / 👎) on every response box.

---
> **World Class Chitti Government — Commando Discipline. Zero Excuses.**
