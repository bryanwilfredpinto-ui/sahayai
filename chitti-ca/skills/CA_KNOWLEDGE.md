# CA_KNOWLEDGE — Chitti CA at CA Final + PhD level

This is the reference corpus Chitti CA reasons over. It is **not** the legal text — for citations Chitti must always defer to the bare Act on incometax.gov.in / cbic-gst.gov.in / mca.gov.in. This file gives Chitti the conceptual map so its DeepSeek answers are not hallucinated and its disclaimers are not generic.

The server-enforced disclaimer at the end of every reply remains non-negotiable: *"This is AI-generated guidance. Consult a registered CA for your actual filings."* See [GUARDRAILS.md](GUARDRAILS.md).

---

## 1. Income Tax Act, 1961 — complete map (CA Final level)

### 1.1 Charging structure
- **Section 4** — charge of income-tax for every assessment year on total income of the previous year.
- **Section 5** — scope of total income: resident & ordinarily resident (global), resident not-ordinarily resident, non-resident (Indian-sourced only).
- **Section 6** — residential status (individual / HUF / firm / company / every other person). Note the **Finance Act 2020** deemed-residency rule for HNI Indian citizens (₹15L+ India income, not taxed elsewhere) and the **120-day rule** for visiting NRIs with >₹15L India income.
- **Section 9** — income deemed to accrue in India: business connection, significant economic presence (SEP — Finance Act 2018 / 2020), royalty / FTS source rule.

### 1.2 Heads of income (Chapter IV)
- **Salaries (15–17)** — perquisites, profits in lieu, standard deduction ₹75,000 (new regime FY 2024-25 onwards) / ₹50,000 (old).
- **House Property (22–27)** — annual value, 30% standard deduction u/s 24(a), interest u/s 24(b) (₹2L self-occupied, unlimited let-out subject to set-off cap of ₹2L u/s 71(3A)).
- **Profits & Gains of Business or Profession (28–44DB)** — presumptive sections **44AD** (small business, 8%/6% deemed, ₹3 cr turnover with 95% digital), **44ADA** (professionals, 50% deemed, ₹75L gross receipts with 95% digital), **44AE** (transporters), **44BB / 44BBA / 44BBB** (non-residents).
- **Capital Gains (45–55A)** — STCG/LTCG, indexation removed for transfers on/after 23-Jul-2024 (Finance (No. 2) Act 2024); new flat **12.5% LTCG** (and **20% STCG** on listed equity with STT). Listed equity threshold ₹1.25L exempt u/s 112A.
- **Income from Other Sources (56–59)** — gifts u/s 56(2)(x), dividends fully taxable post-DDT abolition (Finance Act 2020), interest on tax refunds.

### 1.3 Aggregation, set-off, carry-forward (60–80)
- House-property loss set-off cap ₹2L per year (rest carries forward 8 years).
- Speculative loss → only against speculative income, 4 years.
- Loss u/s 73A (specified business 35AD) — only against same head, indefinite.
- Capital loss — STCL against STCG/LTCG; LTCL only against LTCG; 8 years carry-forward.

### 1.4 Deductions (Chapter VI-A — applicable only if old regime opted)
- **80C** ₹1.5L (LIC / PPF / ELSS / NSC / 5-yr FD / home loan principal / SSY / NPS Tier-I employee share).
- **80CCD(1B)** additional ₹50,000 NPS.
- **80CCD(2)** employer NPS — 14% of salary for govt, 10% private (10% private also under new regime).
- **80D** health insurance — ₹25,000 self/family, additional ₹50,000 for senior-citizen parents.
- **80DD / 80DDB / 80U** — disability / specified disease / self-disability.
- **80E** education loan interest — no cap, 8 years.
- **80EEA / 80EE** affordable housing interest.
- **80G** donations — 50% / 100% with or without qualifying limit (10% of adjusted GTI).
- **80GG** rent paid (when HRA not received).
- **80TTA / 80TTB** — savings interest (₹10,000) / senior-citizen (₹50,000).

### 1.5 New regime vs old regime (Section 115BAC)
| FY 2024-25 slabs (new regime, default) | Rate |
|---|---|
| Up to ₹3L | Nil |
| ₹3L – ₹7L | 5% |
| ₹7L – ₹10L | 10% |
| ₹10L – ₹12L | 15% |
| ₹12L – ₹15L | 20% |
| Above ₹15L | 30% |

- **Rebate 87A** — full rebate up to ₹7L (new regime) / ₹5L (old regime). Marginal relief on new regime extends to ~₹7.27L.
- **Standard deduction** ₹75,000 (new) / ₹50,000 (old) on salary & family pension.
- **Surcharge** capped at **25%** under new regime (vs 37% old) for incomes above ₹5 cr.
- Salaried may switch every year; business income — one-time opt-out window.

### 1.6 TDS / TCS framework (190–206CCA)
Key sections and FY 2024-25 rates Chitti must remember:
| Section | Payment | Rate | Threshold |
|---|---|---|---|
| 192 | Salary | slab | — |
| 192A | EPF premature | 10% | ₹50,000 |
| 194 | Dividend | 10% | ₹5,000 |
| 194A | Interest (non-bank) | 10% | ₹5,000 (₹40K bank / ₹50K SC) |
| 194C | Contractor | 1% ind/HUF, 2% others | ₹30K single / ₹1L aggregate |
| 194H | Commission | 2% (Oct-2024) | ₹15,000 |
| 194-I | Rent | 10% land/bldg, 2% plant | ₹2.4L p.a. |
| 194-IA | Immovable property | 1% | ₹50L |
| 194-IB | Rent by ind/HUF | 2% (Oct-2024) | ₹50,000 p.m. |
| 194J | Professional / technical | 10% / 2% | ₹30,000 |
| 194Q | Purchase of goods | 0.1% | ₹50L (turnover > ₹10cr) |
| 206C(1H) | Sale of goods | 0.1% | ₹50L (turnover > ₹10cr) |
| 194R | Benefit/perquisite | 10% | ₹20,000 |
| 194S | Virtual digital asset | 1% | ₹50K spec/₹10K others |
| 194T | Partner remuneration (FY 25-26) | 10% | ₹20,000 |

PAN-not-furnished → **20%** (Section 206AA). Non-filer of return → **higher of 5% or twice prescribed** (Section 206AB / 206CCA — relaxed via Finance Act 2025 to remove dual-Acts compliance burden).

### 1.7 Returns & assessments
- **ITR-1 (Sahaj)** — resident, ≤₹50L, one house, no capital gains beyond LTCG ₹1.25L on listed equity (FY 24-25 update).
- **ITR-2** — capital gains, foreign assets, more than one house, agricultural >₹5,000.
- **ITR-3** — business/profession (non-presumptive).
- **ITR-4 (Sugam)** — presumptive 44AD/44ADA/44AE.
- **ITR-5** — firm/LLP/AOP/BOI.
- **ITR-6** — companies (other than 11).
- **ITR-7** — trusts / political parties / institutions.

Due dates (FY 2024-25 / AY 2025-26):
- Non-audit individuals — **31 July 2025**.
- Audit cases — **31 October 2025** (tax audit report **30 September**).
- Transfer pricing — **30 November 2025**.
- Belated / revised return — **31 December 2025** (Section 139(4)/(5)).
- **Updated return ITR-U** — Section 139(8A), now within **48 months** (extended by Finance Act 2025 from 24 to 48), additional tax 25% (≤12m) / 50% (12-24m) / 60% (24-36m) / 70% (36-48m).

Assessments — **Section 143(1)** intimation, **143(2)/(3)** scrutiny, **144** best-judgement, **147** reassessment (post-Ashish Agarwal / Rajeev Bansal SC framework — 4/5 year limits with TOLA-extended timelines), **263** revisional, **264** assessee-friendly revision.

### 1.8 Faceless regime (144B / 250 / 274)
Faceless Assessment → NeAC → AU/VU/RU/TU. No personal hearing as right, but request-based VC mandatory (Sona Knitwear SC observations 2023). Faceless Appeals (CIT(A)) — pending CBDT activation; Faceless Penalty active.

### 1.9 International tax / DTAA
- **Treaty override** principle (Section 90(2)) — assessee may opt Act or treaty, whichever beneficial.
- **POEM** (Section 6(3)) — foreign company resident if Place of Effective Management in India.
- **GAAR** — Chapter X-A. Tax benefit > ₹3cr threshold, impermissible avoidance arrangement test.
- **Equalisation Levy** — abolished on e-commerce supply 1-Aug-2024; 6% on online ads retained.
- **Significant Economic Presence (SEP)** — Section 9(1)(i) Expl 2A — revenue ₹2cr + 3L users.
- **BEPS 2.0 Pillar Two** — India yet to legislate the QDMTT/IIR/UTPR; CBDT consultative paper 2024.

### 1.10 Trusts / NPO (11–13)
- 85% application rule; corpus donations exempt with restrictions (Finance Act 2023 — corpus must be parked in 11(5) modes).
- Re-registration under 12AB every 5 years; provisional → regular.
- **Specified violation** consequences: cancellation + tax at MMR on accreted income u/s 115TD.
- 80G approval — separate, also 5-year cycle.

### 1.11 Transfer pricing (92–92F)
- ALP methods — CUP / RPM / CPM / PSM / TNMM / Other Method.
- Master File (286) + CbCR thresholds — consolidated revenue > ₹6,400cr.
- Safe Harbour rules (Rule 10TD) — IT/ITeS, KPO, contract R&D, intra-group loans, corporate guarantees.

### 1.12 Search / survey / penalty
- **132 search**, **133A survey**, **133(6)** notice for information — frequently confused; Chitti must distinguish.
- Penalty u/s **270A** for underreporting (50%) / misreporting (200%); immunity u/s **270AA**.
- Penalty u/s **271AAB** for search cases.
- Prosecution Chapter XXII — wilful evasion 276C, false statement 277.

### 1.13 Recent budget-2025 highlights (Finance Act 2025)
- New regime slabs revised — Nil up to ₹4L, rebate 87A extended to ₹12L total income (~₹12.75L with SD).
- TDS rationalisation — many sections moved to 10% common rate.
- ITR-U window 24 → 48 months.
- Charitable trust simplification — single registration period 10 years for trusts with receipts ≤ ₹5cr.
- LRS / TCS on foreign remittance — threshold ₹10L (raised from ₹7L).
- Block assessment for searches restored.

---

## 2. GST Acts — CGST/SGST/IGST/UTGST/Compensation Cess (CA Final level)

### 2.1 Architecture
- **CGST + SGST** intra-state; **IGST** inter-state (Article 269A); **UTGST** for UTs without legislature; **Compensation Cess** sunsetting in 2026 (sin/luxury goods).
- **Schedule I** — supplies without consideration (related-party, agent-principal, branch transfer inter-state with separate GSTIN, etc.).
- **Schedule II** — composite/mixed supply classification.
- **Schedule III** — neither goods nor services (services by employee, sale of land, sale of building post-CC).

### 2.2 Levy & exemptions
- Section 9 CGST — levy at notified rates (0/0.25/3/5/12/18/28).
- Section 9(3) — RCM on goods/services (GTA, advocate, sponsorship, security from non-body-corporate, renting of motor vehicle to body corporate, etc.).
- Section 9(4) — RCM on inward supply from URD by registered (currently only specified — real-estate promoter for 80% test).
- Section 11 — exemption (Notification 12/2017 — services; 2/2017 — goods).

### 2.3 Time, place, value (12–18)
- Time of supply — earlier of invoice/payment for goods (Section 12), earlier of invoice (within 30 days) / receipt of payment for services (Section 13).
- Place of supply — Sections 10–13 IGST. B2B default = location of recipient; B2C default = location of supplier. Special rules: immovable property, transportation, OIDAR, events, banking/insurance.
- Valuation Rule 27–35 — transaction value default; related party at OMV / 110% cost / residual.

### 2.4 Input tax credit (16–21)
- **Section 16(2)** — possession of invoice, receipt of goods, supplier has paid tax (16(2)(c)), return filed (16(2)(d)), within 30-Nov of following FY or annual return.
- **Section 16(2)(aa)** — invoice must appear in GSTR-2B.
- **Section 17(5)** blocked credits — motor vehicles (<13-seater), food/catering, club, health insurance (except statutory), works contract for immovable property (except plant & machinery), goods lost/stolen/written-off.
- **Rule 36(4)** removed post-2B regime; **Rule 88B** interest — only on net cash liability.
- **Rule 86A** — blocking of ITC ledger; **Rule 86B** — 1% mandatory cash payment if monthly taxable supply > ₹50L (with exceptions for income-tax filers ₹1L, exporters, govt deductors, etc.).

### 2.5 Returns timeline
- **GSTR-1** — outward, 11th (monthly) / 13th (QRMP quarterly).
- **IFF** — first 2 months of QRMP, 13th.
- **GSTR-3B** — 20th monthly / 22nd or 24th QRMP staggered.
- **GSTR-2B** — auto, 14th.
- **GSTR-9 / 9C** — annual + reconciliation, 31-Dec following FY (mandatory if turnover > ₹5cr; 9C is self-certified post-Finance Act 2021).
- **CMP-08** quarterly composition; **GSTR-4** annual composition.
- **GSTR-5** non-resident; **GSTR-5A** OIDAR; **GSTR-6** ISD; **GSTR-7** TDS; **GSTR-8** TCS.

### 2.6 Composition (10)
- Manufacturer/trader — 1% (CGST 0.5 + SGST 0.5).
- Restaurant — 5%.
- Service provider (10(2A)) — 6%, threshold ₹50L.
- Goods threshold ₹1.5cr (₹75L in special-category states except J&K).
- No ITC, cannot collect tax separately, cannot supply inter-state, cannot supply via e-commerce operator.

### 2.7 Registration & threshold
- Goods — ₹40L (₹20L in special-category & service-only).
- Services — ₹20L (₹10L in special-category).
- Mandatory registration (Section 24) — inter-state supplier, casual taxable, RCM payer, NRTP, e-commerce operator and persons selling through ECO (with exceptions for unregistered intra-state sellers under specified turnover).

### 2.8 Refund (54)
- 2-year limit. Categories: export with/without payment, inverted duty (Rule 89(5) formula), deemed exports, excess balance in cash ledger, refund to UN/embassies, finalisation of provisional assessment.
- LUT-based exports — Notification 37/2017.
- Refund of unutilised ITC under inverted duty — Rule 89(5) (post-Tube Investments SC, updated formula).

### 2.9 E-invoicing & e-way bill
- E-invoicing threshold — **₹5cr aggregate turnover** in any FY since 2017-18 (notified from 1-Aug-2023).
- 30-day reporting window for invoices on IRP if AATO ≥ ₹10cr (effective 1-Apr-2025).
- E-way bill — > ₹50,000 value, distance-based validity, intra-state thresholds vary by state.

### 2.10 Demand / penalty / appeal
- Section 73 (non-fraud) — SCN within 3 years of due date of annual return; order within 3 years.
- Section 74 (fraud) — 5 years SCN; 5 years order. **Note Finance Act 2024 unifying provision Section 74A** for FY 2024-25 onwards.
- Section 50 interest — 18% (on net cash) and 24% (where ITC undue claim used).
- Penalty — 10% or ₹10,000 (73); 100% (74).
- Appeals — First appellate (CGST 107) within 3 months, pre-deposit 10% (max ₹20cr); GST Appellate Tribunal — being operationalised, pre-deposit 10% (max ₹20cr each State + Centre), Principal Bench Delhi + State benches.

### 2.11 Recent council decisions (Chitti must scan dynamically)
- 53rd / 54th / 55th GST Council circular trail: ITC time-limit relaxation under Section 16(5), waiver of interest/penalty Section 128A for FY 2017-18 to 2019-20 non-fraud cases, biometric Aadhaar registration nationwide, B2C e-invoicing pilot.

---

## 3. Companies Act, 2013 — Chitti CA scope

### 3.1 Types & incorporation (1–22)
- Private (≤200 members), Public, OPC (single member), Section 8 (non-profit), Producer Company, Nidhi, LLP (separate Act 2008).
- Incorporation via **SPICe+** (INC-32) with AGILE-PRO-S (GST/PF/ESI/profession tax/opening bank), MOA INC-33, AOA INC-34, INC-9 declaration.

### 3.2 Capital & shares (43–72)
- Equity / preference; sweat equity (54); ESOP (62(1)(b)); rights issue (62(1)(a)); private placement (42); preferential allotment (62(1)(c)); bonus (63); buy-back (68).
- 25% buy-back cap from free reserves + securities premium + proceeds of fresh issue. Debt:equity post-buyback ≤ 2:1.

### 3.3 Charges, deposits (77, 73-76A)
- Charge registration — 30 days (extendable to 60 with addl fee, 60 more with CG approval).
- Deposits — private cos may accept from members up to 100% of paid-up + free reserves + securities premium; public co eligible — different limits.

### 3.4 Audit & accounts (128–138)
- Statutory audit, internal audit (138), cost audit (148), secretarial audit (204 — listed + ₹50cr turnover or ₹250cr public co or ₹100cr loan from PFI).
- **CARO 2020** — applicability and 21 clauses (incl. crypto, fraud, whistle-blower, undisclosed income, working-capital reconciliation, going concern).
- **Schedule III Division I/II/III** — Ind AS / AS / NBFC.

### 3.5 Directors (149–172)
- Min 3 public / 2 private / 1 OPC; max 15 (more with special resolution).
- Resident director ≥ 182 days.
- Independent directors — listed + ₹10cr paid-up / ₹100cr turnover / ₹50cr loan etc. (Rule 4 Companies (Appointment and Qualification of Directors) Rules 2014).
- Woman director — listed + every public co with ₹100cr+ paid-up or ₹300cr+ turnover.
- DIR-3 KYC annually by 30 Sep.

### 3.6 Meetings & resolutions (96–122)
- AGM — first within 9 months of first FY end, subsequent within 6 months; gap ≤ 15 months.
- Notice 21 clear days (shorter with 95% consent).
- OR — simple majority; SR — 75%. List of SR matters: alteration MOA/AOA, buy-back, preferential allotment, voluntary winding-up, etc.

### 3.7 CSR (135)
- Net worth ₹500cr / turnover ₹1,000cr / net profit ₹5cr — 2% average net profits of 3 preceding years.
- Schedule VII activities only. Unspent (non-ongoing) → 6 months to Schedule VII fund. Unspent (ongoing project) → CSR Unspent Account, 3 years to spend.

### 3.8 NCLT / IBC interface
- Class action 245; oppression & mismanagement 241-242; compromise/arrangement 230-232.
- IBC 2016 — CIRP 330 days outer limit, MSME pre-packaged for default ₹10L+, threshold ₹1cr.

### 3.9 LLP Act 2008 amendments (2021)
- Decriminalisation of compoundable offences; small LLP concept (contribution ≤ ₹25L, turnover ≤ ₹40L); accounting standards for LLP (notified 2024).

---

## 4. Accounting standards — AS, Ind AS, IFRS comparability

### 4.1 Indian Accounting Standards (Ind AS) — applicable to listed/large
- **Ind AS 1** presentation; **Ind AS 2** inventories; **Ind AS 7** cash flows; **Ind AS 8** policies/errors; **Ind AS 10** events after; **Ind AS 12** income taxes (deferred); **Ind AS 16** PPE; **Ind AS 19** employee benefits; **Ind AS 20** government grants; **Ind AS 21** forex; **Ind AS 23** borrowing costs; **Ind AS 24** related party; **Ind AS 27/28** separate / equity method; **Ind AS 29** hyperinflationary; **Ind AS 32/33** financial instruments presentation / EPS; **Ind AS 34** interim; **Ind AS 36** impairment; **Ind AS 37** provisions / contingent liabilities; **Ind AS 38** intangibles; **Ind AS 40** investment property; **Ind AS 41** agriculture.
- **Ind AS 101** first-time adoption; **102** share-based payment; **103** business combinations; **104** insurance (superseded by 117); **105** non-current held for sale; **106** mineral resources; **107** financial instruments disclosure; **108** segments; **109** financial instruments (ECL); **110** consolidated; **111** joint arrangements; **112** disclosure of interests; **113** fair value; **114** regulatory deferral; **115** revenue (5-step); **116** leases (right-of-use); **117** insurance contracts (notified April 2024 for India).

### 4.2 Companies (Accounting Standards) Rules 2021 — for non-Ind AS entities
AS 1 to AS 29 (except AS 6, 8 omitted, AS 30/31/32 deferred). Chitti must apply AS only when explaining small/private (non-Ind AS road map) entities.

### 4.3 Ind AS roadmap
- Phase I — listed (or under process of listing) + unlisted with net worth ≥ ₹500cr — from FY 2016-17.
- Phase II — all other listed and unlisted with net worth ≥ ₹250cr — from FY 2017-18.
- Banks/NBFCs/insurance — separate roadmap (NBFCs ≥ ₹500cr from FY 2018-19).

### 4.4 Auditing standards
SA 200 series (general) → SA 700 series (reporting). Mandatory pronouncements: SQC-1 (firm-level quality control), SA 540 (estimates — revised 2019), SA 720 (other information), SA 315 / 330 (risk-based audit), CA 600 (group audit — under revision post-Bharath Construction issues).

---

## 5. Practical portal navigation (Chitti's most asked questions)

### 5.1 incometax.gov.in
- **Login** — PAN + password (or Aadhaar OTP + PAN, or net-banking, or Aadhaar OTP-only for view-only).
- **e-Pay Tax** — generate Challan ITNS-280 (advance / self-assessment), 281 (TDS), 282 (other), 283 (DDT, banking transaction). Major head 0021 (income tax other than companies). Minor head 100 advance / 300 self-assessment / 400 regular assessment.
- **e-Verify** — Aadhaar OTP, net-banking, DSC, bank/demat EVC, ITR-V to CPC Bengaluru within **30 days**.
- **AIS / TIS / 26AS** — three sources; AIS is the master, TIS is the simplified taxpayer view, 26AS retains TDS/TCS/SFT/refund history. Mismatches: respond via "AIS feedback" with one of 7 categories.
- **Compliance portal** — non-filer / e-campaign / e-verification scheme.
- **Worklist** — outstanding intimations and notices; responses to 143(1)(a), 139(9) defective, 245 set-off intimation.

### 5.2 gst.gov.in & cbic-gst.gov.in
- **GSTR-3B flow** — Table 3 outward, Table 4 ITC (with new Table 4B reversal split since 2023), Table 6 payment.
- **DRC-01 / 01A** — pre-SCN; **DRC-03** — voluntary payment (now distinguishes voluntary, against demand, towards 73/74, towards 74A).
- **GSTR-1A** — amendment of GSTR-1 before 3B filing (active from Aug 2024).
- **e-Invoice IRP** — NIC IRP-1 / IRP-2 / private IRPs; UPI QR auto-attached to B2C invoices ≥ ₹5cr AATO threshold (under notification).

### 5.3 mca.gov.in (V3 portal)
- **DSC association**; **DIR-3 KYC** annually before 30 Sep — non-filing → deactivation + ₹5,000 reactivation.
- **AOC-4 XBRL / AOC-4 / AOC-4 CFS** financial statements; **MGT-7 / 7A** annual return; **DPT-3** annual return of deposits/exempted deposits by 30-Jun.
- **CHG-1 / 4** — registration / satisfaction of charge.
- **MGT-14** — special resolutions, board resolutions of public companies for matters in Section 117(3).

### 5.4 TRACES — TDS reconciliation
Form 26AS, Form 16 / 16A generation, Justification report, default summary, online correction (PAN, challan, deductee), conso file download.

### 5.5 EPFO / ESIC
ECR generation, KYC seeding, UAN merge, PF withdrawal Form 19 + 10C + 31, pension PPO, ESIC contribution due 15th, return half-yearly Nov/May.

### 5.6 Profession tax (state) — KPT, MPT, etc.
State-wise slabs; PT enrolment vs registration distinction; KPT (Karnataka) — ₹2,500 annual max (Article 276 cap).

---

## 6. PhD-level — Jurisprudence, doctrines, treaty interpretation

### 6.1 Constitutional foundation of tax
- **Article 265** — no tax without authority of law.
- **Article 246** + **Schedule VII** — Union List 82-92, State List 45-63, Concurrent List (post-101st CAA, GST in Article 246A — concurrent power on goods/services tax).
- **Article 269A** — IGST allocated by Parliament; **279A** — GST Council; binding nature post **Mohit Minerals (2022)** — recommendations are persuasive, not binding on Union/States in their fiscal sovereignty.

### 6.2 Landmark income-tax decisions Chitti must reference
| Case | Year | Doctrine |
|---|---|---|
| **CIT v. Calcutta Discount Co.** | 1961 SC | Duty of disclosure in reassessment (continues to inform 147 jurisprudence) |
| **Sahara India Mutual Benefit v. CIT** | — | Reopening — change of opinion is no ground |
| **Vodafone International v. UoI** | 2012 SC | Indirect transfer — led to retrospective amendment 9(1)(i) Expl 5 — subsequently nullified Finance Act 2021 |
| **Azadi Bachao Andolan** | 2003 SC | Treaty shopping permissible absent specific anti-abuse — context for GAAR |
| **McDowell & Co. v. CTO** | 1985 SC | Tax avoidance vs evasion — colourable device — partial dilution in Azadi Bachao, reaffirmed in **Vodafone** with caveat |
| **CIT v. P. V. A. L. Kulandagan Chettiar** | 2004 SC | DTAA override; later read down by **Engineering Analysis (2021)** |
| **Engineering Analysis Centre v. CIT** | 2021 SC | Computer software payment NOT royalty under most DTAAs — reshaped the FTS/royalty landscape |
| **GE India Technology** | 2010 SC | 195 — TDS obligation only if income chargeable in India |
| **Maxopp Investment** | 2018 SC | 14A disallowance — strategic investment principle |
| **Ashish Agarwal** | 2022 SC | Reassessment 148 — pre/post April 2021 reconciliation |
| **Rajeev Bansal** | 2024 SC | TOLA extension and 148 limitation — definitive framework |
| **Nestlé / Steria** | 2023 SC | MFN clause does not auto-activate — requires notification under Section 90 |
| **Tata Consultancy Services v. State of AP** | 2005 SC | Branded software is "goods" — relevant to GST classification |
| **Safari Retreats** | 2024 SC | ITC on construction of shopping mall — limited reading of 17(5)(d) |

### 6.3 Constitutional GST decisions
- **Union of India v. Mohit Minerals** (2022 SC) — RCM on ocean freight on CIF imports struck down; recommendations of Council not binding.
- **VKC Footsteps** (2021 SC) — inverted duty refund formula validity; Section 54(3)(ii) read with Rule 89(5).
- **Calcutta Club v. UoI** (2019 SC) — doctrine of mutuality; superseded for GST by amendment to Section 7 retrospectively from 1-Jul-2017.
- **Filco Trade Centre** (2022 SC) — Tran-1/2 transition window reopened.
- **Bharti Airtel v. UoI** (2021 SC) — rectification of GSTR-3B; framework on auto-population.

### 6.4 Doctrines Chitti must explain in plain Hindi/English
- **Lifting the corporate veil** (income-tax + Companies — Salomon → Tata Engineering → Bacha F. Guzdar).
- **Doctrine of mutuality** (members' clubs — Bangalore Club).
- **Real-income theory** (Godhra Electricity Co.).
- **Tax planning vs avoidance vs evasion** (Westminster → Ramsay → McDowell → Azadi → Vodafone).
- **Substance over form** (Mohanbhai Pamabhai; codified now in GAAR).
- **Doctrine of precedent in tax** — SC binding under Art 141; HC binding within its jurisdiction; ITAT decisions persuasive.

### 6.5 Treaty interpretation principles
- **VCLT 1969** Articles 31–33 — good faith, ordinary meaning, context, object & purpose.
- **OECD MC vs UN MC** — UN MC more source-oriented; India follows broadly UN with reservations.
- **MLI** — Multilateral Instrument (India ratified 2019, deposited 2020) — modifies covered tax agreements with PPT (Principal Purpose Test), SLOB (Simplified Limitation on Benefits), agency PE / commissionnaire arrangements.
- **PPT** — denies treaty benefit if obtaining it was one of the principal purposes.
- **Beneficial ownership** — substance > legal title; relevant for dividend/interest/royalty articles.

### 6.6 Standards of proof & burden
- Civil tax — **preponderance of probabilities**.
- Penalty (270A misreporting) — slightly higher; revenue must show ingredients.
- Prosecution — **beyond reasonable doubt** + mens rea presumption under 278E.

---

## 7. Confidence-scoring & Devil's Advocate framework

Every Chitti CA answer should silently traverse:
1. **Identify the assessee** — individual / HUF / firm / LLP / company / trust → drives applicable Chapter.
2. **Identify the year / period** — FY 2024-25 vs 2025-26 changes (e.g., 194T came in FY 2025-26; ITR-U 48-month from Finance Act 2025).
3. **Identify the head / Act** — IT, GST, Companies, FEMA, PMLA, Stamp.
4. **Find the controlling provision** — section number first, then circular/notification, then case law.
5. **Devil's-advocate cross-check** ([DEVILS_ADVOCATE.md](DEVILS_ADVOCATE.md)) — "what if assessee is a non-resident / senior citizen / under presumptive / has carried-forward losses?"
6. **Confidence label** — HIGH (bare-Act answer, no ambiguity) / MEDIUM (notification or case-law dependent) / LOW (open litigation or council circular awaited).
7. **Always close with the server-enforced disclaimer.**

Confidence label maps to the per-response widget (👍/👎) — see repo-root `feedback-widget.js`.

---

## 8. Updating this knowledge

This file is regenerated on the following triggers (see [TRUTH_SOURCES.md](TRUTH_SOURCES.md)):
- **Annual Finance Act** (Feb budget + assent).
- **CBDT / CBIC circulars** with rate or compliance impact.
- **GST Council meeting outcomes** (every meeting → diff into §2.11).
- **SC / HC landmark decisions** — added to §6.2 / §6.3 with one-line ratio.
- **ICAI announcements** — accounting standard revisions, SA revisions.

Pull request convention: title `CA_KNOWLEDGE: <Act> / <date>` — keeps the diff trail auditable.

---

## 9. Boundary — Chitti is not your CA

This file makes Chitti **technically literate**, not **professionally accountable**. Chitti does not:
- File any return on behalf of any user.
- Sign any audit report.
- Issue any opinion in writing for a specific transaction.
- Give an opinion that overrides a registered CA's binding advice.

For any of the above the user must engage a CA in practice with valid COP. Chitti's job is to make the user walk into that CA's office with the right vocabulary.

> *"This is AI-generated guidance. Consult a registered CA for your actual filings."* — server-enforced, every response. See [GUARDRAILS.md](GUARDRAILS.md).
