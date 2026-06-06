🎖️ World Class Chitti CA OS — Commando Discipline. Zero Excuses.

# PRD — Chitti CA OS

> Product requirements. Every module is **deterministic-first** (the engine computes
> the numbers; the LLM only explains) and **four-user accessible** (voice + symbol +
> tap on every surface). Module 0 + Module 7 + Module 11 are the moat. Status legend:
> 🟢 built in v1 frontend engine · 🟡 partial / honest stub · 🔵 COMING SOON.

## Module 0 — Accessibility & Language core (the floor, built FIRST)

Voice IN + voice OUT, ISL panel, symbol+word status, picture menus, large-text/
slow-speech senior mode, 26-language dropdown (Vaani-canonical `chitti_lang.js`),
auto-read first result for blind users, full keyboard + screen-reader support.
**Every module below inherits this — a module that can't serve the four users is
redesigned, not shipped.** 🟢

## Module 1 — Financial Operations (acts as Accountant)

Invoice Scanner · Expense Scanner · Bank-Statement Scanner · Purchase Register ·
Sales Register · Inventory Tracking · Payroll Assistant · Cash Book · Journal-Entry
Assistant · Bank Reconciliation. Voice cash/credit (udhaar) book for kirana. 🟡
(deterministic cash book + GST invoice math 🟢; OCR scan needs vision key 🔵)

## Module 2 — Income-Tax Intelligence

Old-vs-New **Regime Comparison** · Deduction Finder (80C/80D/80E/80G/24b/HRA…) ·
Capital Gains (STCG/LTCG, indexation, 54/54F/54EC) · Advance-Tax calendar (15/45/75/
100%) · **Notice Understanding** (decode + read aloud + next steps) · ITR-form
guidance (which ITR) · **Tax Health Score** (0–100 + top-3 fixes). 🟢 (engine) /
🔵 notice OCR.

## Module 3 — GST Intelligence

GST-registration need check · Composition vs Regular · **GST Health Score** · Input
Credit (ITC) Analysis · GSTR-2B mismatch detection · GST Risk Analysis · GST Notice
Assistant · GST Reconciliation · e-invoice/e-way-bill thresholds. 🟢 (engine).

## Module 4 — Compliance Intelligence

ROC · MCA · TDS · PF · ESI · Labour compliance · **Compliance Calendar** (due dates
by entity type) · **Penalty Prediction** · 45-day MSME payment rule (43B(h)). Wired
to the reminder/deadline cascade. 🟢 (calendar + penalty math).

## Module 5 — Audit Intelligence

Internal Audit checklist · Audit Readiness score · Control-Weakness Detection ·
Ledger Analysis · **Anomaly Detection** · Variance Analysis. 🟡 (ratio/variance
deterministic 🟢; ledger upload 🔵).

## Module 6 — Business Doctor

Upload Balance Sheet / P&L / Cash Flow → **Profitability Score · Liquidity Score ·
Working-Capital Score · Growth Opportunities · Cost-Reduction Areas · Business
Health Score**. 🟢 (ratio engine from typed figures; file upload 🔵).

## Module 7 — Government Benefits Engine (THE MOAT — most important)

Input: state · industry · turnover · employees · business type. Output: Mudra ·
PMEGP · MSME/Udyam · CGTMSE · Startup India (80-IAC/DPIIT) · State Subsidies ·
Export Incentives (RoDTEP/LUT) · Solar Benefits · Agriculture Benefits — each with
**estimated financial impact**. 🟢
**7b — Scheme Opportunity Engine:** "money you are losing by not claiming." 🟢

## Module 8 — Funding Advisor

Loan Eligibility · Credit Readiness · Investor Readiness · Grant Discovery · Funding
Roadmap. 🟡 (eligibility heuristics 🟢; live lender APIs 🔵).

## Module 9 — Fraud Shield

Scans invoices/contracts/GST bills/quotations/POs. Detects Fake GST (GSTIN
checksum + format) · Duplicate Invoices · Overbilling · Vendor Risk · Suspicious
Transactions. 🟢 (GSTIN checksum + duplicate/overbilling heuristics deterministic).

## Module 10 — CFO Dashboard

Revenue · Profit · Cash Flow · Tax Exposure · Compliance Score · Business Health ·
Growth Score — one glance, spoken aloud. 🟢 (from Financial Twin figures).

## Module 11 — Financial Twin (lifelong memory)

Stores (on-device): PAN · GST · ITR · ROC · Insurance · Loans · Investments ·
Financial Documents. Creates Financial / Business / Compliance / Tax timelines.
"Chitti forget" wipes all. 🟢 (on-device localStorage twin).

## Cross-cutting requirements (every module)

- **Per-response widget** (🔊 / 🤖 / 👍 / 👎 + per-box feedback) on every result box.
- **Golden Rule** — any side-effecting action (reminder set, share, export, scheme
  apply hand-off) confirms first via `chittiConfirmAndDo()`. Chitti never files/signs.
- **Server-enforced disclaimer** (this is guidance, not professional/legal advice;
  see a CA for HIGH-risk) — inherited from the live `chitti-ca-api`.
- **Confidence + risks + sources + reasoning** shown on every answer.
- **Deterministic money math** — every rupee figure provenance-tagged to the engine.

---
> **World Class Chitti CA OS — Commando Discipline. Zero Excuses.**
