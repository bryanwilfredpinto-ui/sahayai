🎖️ **World Class Chitti Government — Commando Discipline. Zero Excuses.**

# RESEARCH_BEST_APPS — what to copy, and the scheme corpus

> Per the [new-products process](../SAHAYAI_MASTER.md) §2a: research the best apps in
> the category, copy their full feature surface, mark unbuilt as COMING SOON. This
> file is the distilled research that feeds the catalog + the CEOS feature set.
> Full source list at the bottom. **Corpus rule:** no amount/deadline/threshold is
> ever spoken to a citizen as a guarantee — always cite the official portal and carry
> `last_verified` + `status`.

---

## 1. Best-practice platforms — patterns Chitti copies

### Indian
| Platform | The pattern to copy |
|---|---|
| **MyScheme** (myscheme.gov.in) | *The* model. Eligibility **question-graph** (8–12 Qs) → matched-scheme list; **life-event discovery** ("getting married", "having a baby", "starting a business") instead of ministry silos; structured per-scheme schema (benefit / eligibility / process / documents / FAQ / source); DigiLocker apply. **Copy the question-graph + scheme schema.** |
| **UMANG** | One app, pan-India services central→local, single sign-on. **Copy: unified catalog + one login.** |
| **DigiLocker** | Issued-document vault, verifiable e-docs, auto-fetch into forms. **Copy: document vault + once-only reuse.** |
| **Jan Samarth** | Answer eligibility Qs → matched to 15+ credit-linked loan schemes → digital apply. **Copy: eligibility-first credit matching** (Business Governance). |
| **India.gov.in** | Authoritative scheme registry. **Copy: registry as source of truth.** |

### Global
| Platform | The pattern to copy |
|---|---|
| **GOV.UK + GDS Design System** | Reusable components; **"check a service is suitable"** pre-screen wizard; rigorous **plain-language + WCAG-AA**. **Copy: the pre-screen + plain-language discipline.** |
| **Singapore LifeSG / Singpass / Moments of Life** | 100+ services in one app; checkers curate eligible schemes; **proactive "future benefits"** notifications; single digital identity. **Copy: anticipatory benefit nudges + life-event bundles.** |
| **Estonia e-Estonia / X-Road** | Interoperability backbone; **once-only principle** (data given once, reused). India's analog = Aadhaar + DigiLocker + Account Aggregator DPI. **Copy: once-only data.** |
| **USA Benefits.gov / USA.gov Benefit Finder** | Questionnaire → 1,000+ programs; login.gov SSO; moving to proactive notifications. **Copy: broad cross-program screener.** |
| **Australia myGov** | Single account linking tax/health/welfare + digital wallet. **Copy: linked-services account.** |
| **Code for America — GetCalFresh / BenefitsCal** | Human-centred screener; **plain language, mobile-first, simple document upload**; Benefits Enrollment Field Guide. **Copy: the screener→enrollment funnel + upload simplicity** — directly serves Chitti's low-literacy users. |

### Seven concrete patterns now in the CEOS feature set
1. Eligibility-screener wizard (short question graph → matched schemes, never a static list) → **PRD F1**.
2. Life-event bundles → **PRD F3** (research Part C is the map).
3. Document vault + once-only → **PRD F2**.
4. Proactive/anticipatory nudges (turn 60/70, child born) → **PRD F4 Family Governance**.
5. Single sign-on / Aadhaar identity with consent → (Vaani SSO; on-device Twin today).
6. Plain-language + WCAG-AA + voice/ISL → the four-user contract (mandatory).
7. Structured scheme schema (name·ministry·benefit·eligibility·documents·URL·last_verified) → catalog.

---

## 2. Scheme corpus — 13 categories (~100+ schemes)

> Seeded into [backend/data/schemes_seed.json](backend/data/schemes_seed.json). Each
> carries `source_url`, `status` (`active|closed|verify`), and `last_verified`.
> **State amounts are the most volatile — all flagged `verify`.**

**1. Farmer/Agri:** PM-KISAN · PMFBY (crop insurance) · KCC · Soil Health Card ·
PM-KUSUM (solar pump) · eNAM · PM Kisan Maandhan (₹3,000/mo pension) · Agri
Infrastructure Fund · Per-Drop-More-Crop (micro-irrigation) · National Mission on
Natural Farming `verify`.

**2. Women/girl-child:** PMMVY 2.0 · Sukanya Samriddhi · Beti Bachao Beti Padhao ·
Ujjwala 2.0 · Mahila Samman Savings `closed` (new deposits ended 31 Mar 2025) ·
Lakhpati Didi · MP Ladli Behna `verify` · MH Ladki Bahin `verify` · Odisha Subhadra.

**3. Senior citizen:** NSAP-IGNOAPS (old-age pension) · Atal Pension Yojana · PMVVY
`closed` (new entrants ended 31 Mar 2023) · SCSS · Rashtriya Vayoshri · **Ayushman Vay
Vandana (PM-JAY 70+, ₹5 lakh, income-agnostic, Aadhaar-only)**.

**4. Students/education:** National Scholarship Portal (NSP) · PM-USP merit · PM
Vidyalaxmi (loan) · Vidya Lakshmi portal · AICTE Pragati (girls) · AICTE Saksham (PwD)
· Post-Matric SC/ST/OBC · NMMS · INSPIRE-SHE · PM-YASASVI · PM Internship `verify`.

**5. Workers/labour:** e-Shram · PM-SYM (₹3,000/mo) · PM Vishwakarma (artisans,
toolkit+loan) · NPS-Traders · ESIC · BOCW (construction worker welfare) · PM-SVANidhi
(street vendors).

**6. Health:** Ayushman Bharat PM-JAY (₹5 lakh) · PM-JAY 70+ · ABHA/ABDM · Janani
Suraksha · RBSK (child screening) · PM Jan Aushadhi · JSSK.

**7. Housing/sanitation:** PMAY-G · PMAY-U 2.0 · Swachh Bharat (toilet) · Saubhagya
`verify` · Jal Jeevan (Har Ghar Jal).

**8. Disabled (Divyangjan):** ADIP (aids) · **UDID (disability ID — the gateway)** ·
IGNDPS (disability pension) · PwD scholarships · Accessible India (infra).

**9. Business/MSME/startup:** Udyam · PM Mudra (Shishu/Kishore/Tarun) · Stand-Up India
· Startup India/DPIIT · CGTMSE · PMEGP · PLI · ONDC.

**10. Financial inclusion (Jan Suraksha):** PMJDY (Jan Dhan) · PMJJBY (₹2 lakh life,
₹436/yr) · PMSBY (₹2 lakh accident, ₹20/yr) · Atal Pension.

**11. Energy/utility:** **PM Surya Ghar Muft Bijli** (rooftop solar, up to ₹78,000) ·
PM-KUSUM · Ujjwala 2.0.

**12. Caste/social-justice:** SC/ST/OBC/EWS scholarships · NSFDC loans · PM-AJAY
`verify` · PM-JANMAN (PVTGs) · NMDFC (minorities).

**13. State flagships (`verify` all):** AP (Thalliki Vandanam, Annadata Sukhibhava,
Deepam-2), TS (Rythu Bharosa, Mahalakshmi, Gruha Jyoti, Indiramma), KA (Gruha Lakshmi,
Gruha Jyoti, Anna Bhagya, Shakti, Yuva Nidhi), TN (Magalir Urimai ₹1,000/mo, Pudhumai
Penn, free bus), MP (Ladli Behna, Ladli Laxmi), MH (Ladki Bahin, Namo Shetkari), OD
(Subhadra, Biju Swasthya Kalyan), WB (Lakshmir Bhandar, Kanyashree, Rupashree, Krishak
Bandhu, Swasthya Sathi), BR (Kanya Utthan, Udyami, Student Credit Card), UP (Kanya
Sumangala, Abhyudaya), RJ (Chiranjeevi/health `verify`), GJ (Namo Lakshmi, Namo
Saraswati, MA health), KL (Karunya, social-security pensions), PB (Aam Aadmi Clinics,
free power), HR (Chirayu, family-ID gated), DL (Mohalla Clinics, free bus/power/water).

---

## 3. Document → scheme intelligence (19 canonical documents)

Aadhaar (nearly all DBT) · PAN (business/loans/tax) · Voter ID · Ration/NFSA (PMJAY,
Ujjwala, food) · ABHA (health records) · **UDID (all PwD schemes)** · Income cert
(scholarships, EWS) · Caste cert (reservations, NSFDC) · Domicile/residence (state
schemes) · EWS cert · Land records/7-12 (PM-KISAN, KCC, PMFBY) · KCC · Jan Dhan account
(every DBT) · e-Shram · Driving licence · Passport · Birth cert (SSY, school) · Death
cert (family pension, succession) · Marriage cert (spouse benefits) · DigiLocker (vault
for all). Each: which schemes need it · where to obtain · validity/renewal. Full table
in research Part B → encoded in [DATABASE.md](DATABASE.md) document-map.

---

## 4. Life-event → action map (12 events) → PRD F3

birth · daughter born · marriage · death in family · job loss · start business · buy
land/house · turn 18 · turn 60 (and 70 = Ayushman Vay Vandana) · disability onset ·
move to new state (ONORC ration portability) · retirement. Each event → {documents,
schemes, registrations, deadlines, affected member}. Detail in research Part C.

---

## 5. Government-impersonation fraud (2024–2026) → PRD F6

8 pattern families: fake PM-Kisan e-KYC/installment with **malicious APK** ·
**digital-arrest** (fake police/CBI video-call extortion — *does not exist in law*) ·
fake electricity-disconnection · fake Aadhaar/PAN-update fee · fake scholarship/subsidy
"processing fee" · courier-customs (FedEx) · fake DBT "claim your benefit" link ·
fake job/loan deposit. **Government-never truths:** never asks OTP/PIN; never charges a
fee for a free scheme; DBT lands directly in the Aadhaar-seeded account (never "claim
via link"); official domains are `.gov.in`/`.nic.in`; never install an APK/remote-access
app. **Report to: 1930 · cybercrime.gov.in · Sanchar Saathi–Chakshu
(sancharsaathi.gov.in).** Chitti **never auto-dials police**.

---

## 6. Trust guardrails (so the AI never hallucinates) → guardrails/

Closed-corpus for facts (never generative) · every answer shows source + last_verified ·
eligibility is a screener not a verdict ("you **may** qualify") · never guarantee
approval/disbursal · declare uncertainty (`VERIFY` items hedged) · separate facts from
advice · `status` field so dead schemes are never promised · hand off to official apply
URL · anti-fraud overlay triggers on any link/fee/OTP/KYC mention · consent-first,
data-minimisation (DPDP 2023).

---

## Sources

Schemes: pmkisan.gov.in · pmfby.gov.in · pmsuryaghar.gov.in · myscheme.gov.in
(mmlby/mssc/pm-yasasvi/pmsgmb) · subhadra.odisha.gov.in · pmvishwakarma.gov.in ·
lakhpatididi.gov.in · beneficiary.nha.gov.in (PM-JAY 70+) · nha.gov.in senior FAQs ·
scholarships.gov.in · eshram.gov.in · maandhan.in · pmjdy.gov.in · jansuraksha.gov.in ·
udyamregistration.gov.in · mudra.org.in · standupmitra.in · startupindia.gov.in ·
swavlambancard.gov.in (UDID) · nsap.nic.in · pmayg.nic.in · pmay-urban.gov.in ·
tribal.nic.in (PM-JANMAN) · studyiq scheme lists.
Fraud: Agri-Ministry PM-Kisan scam alert · The Quint APK scam · sancharsaathi.gov.in
(Chakshu) · EnsureIAS digital-arrest · cybercrime.gov.in.
Best-practice apps: myscheme.gov.in · design-system.service.gov.uk (+"check a service
is suitable") · tech.gov.sg LifeSG (+ future-benefits FAQ) · e-estonia.com X-Road ·
usa.gov/benefit-finder · benefits.gov · codeforamerica.org (food benefits + Benefits
Enrollment Field Guide) · digilocker.gov.in · jansamarth.in.

---
> **World Class Chitti Government — Commando Discipline. Zero Excuses.**
