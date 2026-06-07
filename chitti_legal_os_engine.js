/* Chitti Legal OS — Deterministic Legal Engine
 * Frontend for chitti-legal/ceos/  (Chitti Legal Operating System / CEOS v1.0)
 *
 * RULES ARE THE PRODUCT. THE LLM IS AN ENHANCEMENT, NEVER A DEPENDENCY.
 * Every right, deadline, jurisdiction, helpline and red-flag shown to a user is
 * computed HERE, from the user's own facts + a VERSIONED legal rule table — never
 * invented by an LLM. The LLM only explains in the user's language. Works with the
 * internet down and DeepSeek 429. Pure, dependency-free, node-testable.
 *
 * In a legal product, a DEADLINE is the "money math": a wrong limitation date shown
 * as certain is a P0 incident, not a feature gap. So limitation/notice math is exact.
 *
 * Every result object carries: { confidence, risks:[], sources:[] }  (Founder Rule:
 * Always show confidence, risks, legal basis & sources; Never guarantee an outcome;
 * Never predict a court decision; Explain rights before giving actions; Educate before escalate.)
 *
 * Spec: chitti-legal/ceos/ARCHITECTURE.md · PRD.md · EVALS.md · guardrails/*.md
 * Disclaimer: NOT legal advice; Chitti never files, signs, or appears for the user.
 */
(function (root) {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────────
  // VERSIONED RULE TABLES  (change the table, never the logic — memory/rule_versioning.md)
  // Sourced 2026-06 from: Limitation Act 1963 (Schedule), Negotiable Instruments Act
  // s.138, Consumer Protection Act 2019 + Jurisdiction Rules 2021, BNS/BNSS/BSA 2023,
  // Constitution Arts 21/22/39A, RTI Act 2005, Legal Services Authorities Act 1987 s.12,
  // POSH 2013, PWDV (Domestic Violence) Act 2005, Maintenance & Welfare of Senior
  // Citizens Act 2007, Model Tenancy Act 2021, RERA 2016, DPDP Act 2023.
  // ─────────────────────────────────────────────────────────────────────────
  var RULES = {
    version: '1.0.0',
    asOfLaw: '2026-06',
    codes: 'BNS 2023 · BNSS 2023 · BSA 2023 (effective 1-Jul-2024) replace IPC/CrPC/Evidence Act',

    // ── Limitation periods (the "money math" of law). unit:'years'|'days', n. ──
    // Calendar math (years are added as calendar years, not 365-day counts) so a
    // 3-year deadline lands on the same date 3 years later. status computed against
    // a cause-of-action date the USER provides. null = special / state-specific.
    limitation: {
      money_recovery:      { unit: 'years', n: 3,  label: 'Money / debt recovery (contract)', basis: 'Limitation Act 1963, Art. 19/113 — 3 years from when the amount is due' },
      breach_contract:     { unit: 'years', n: 3,  label: 'Breach of contract',               basis: 'Limitation Act 1963, Art. 55 — 3 years from the breach' },
      recover_movable:     { unit: 'years', n: 3,  label: 'Recover movable property / goods',  basis: 'Limitation Act 1963, Art. 68/69 — 3 years' },
      immovable_possession:{ unit: 'years', n: 12, label: 'Possession of immovable property',  basis: 'Limitation Act 1963, Art. 65 — 12 years from adverse possession' },
      partition:           { unit: 'years', n: 12, label: 'Partition of joint property',       basis: 'Limitation Act 1963, Art. 110 — 12 years' },
      tort_defamation:     { unit: 'years', n: 1,  label: 'Defamation',                        basis: 'Limitation Act 1963, Art. 75/76 — 1 year' },
      tort_compensation:   { unit: 'years', n: 3,  label: 'Compensation / general tort',       basis: 'Limitation Act 1963, Art. 113 — 3 years' },
      consumer_complaint:  { unit: 'years', n: 2,  label: 'Consumer complaint',                basis: 'Consumer Protection Act 2019, s.69 — 2 years from cause of action' },
      cheque_138:          { unit: null,   n: 0,  label: 'Cheque bounce (s.138 NI Act)',      basis: 'NI Act s.138/142 — special cascade (see Cheque timeline)' },
      rti_first_appeal:    { unit: 'days',  n: 30, label: 'RTI first appeal',                  basis: 'RTI Act 2005, s.19(1) — 30 days from PIO reply / deadline' },
      rti_second_appeal:   { unit: 'days',  n: 90, label: 'RTI second appeal',                 basis: 'RTI Act 2005, s.19(3) — 90 days' },
      arbitration_setaside:{ unit: 'days',  n: 90, label: 'Set aside arbitral award',         basis: 'Arbitration & Conciliation Act 1996, s.34(3) — 3 months (+30 days condonable)' },
      civil_appeal_hc:     { unit: 'days',  n: 90, label: 'First appeal to High Court',        basis: 'Limitation Act 1963, Art. 116 — 90 days' },
      civil_appeal_dc:     { unit: 'days',  n: 30, label: 'Appeal to District Court',          basis: 'Limitation Act 1963, Art. 116 — 30 days' },
      wages_claim:         { unit: 'years', n: 1,  label: 'Unpaid wages claim',               basis: 'Payment of Wages Act / Code on Wages 2019 — ~1 year (verify forum)' },
      eviction_notice:     { unit: null,   n: 0,  label: 'Eviction (tenancy)',               basis: 'State Rent Control / Model Tenancy Act 2021 — period set in the notice; varies by state' },
      domestic_violence:   { unit: null,   n: 0,  label: 'Domestic violence relief',         basis: 'PWDV Act 2005 — no fixed limitation; relief is ongoing/continuing' },
      posh_complaint:      { unit: 'days',  n: 90, label: 'Workplace sexual harassment (POSH)',basis: 'POSH Act 2013, s.9 — 3 months (extendable by 3 more)' }
    },

    // Negotiable Instruments Act s.138 cheque-bounce timeline (deterministic days).
    cheque138: {
      noticeWithinDays: 30,   // demand notice within 30 days of the bank "cheque return memo"
      payWithinDays: 15,      // drawer gets 15 days from receipt of notice to pay
      complaintWithinDays: 30 // if unpaid, file complaint within 30 days of cause of action (day after the 15)
    },

    // Consumer Protection Act 2019 — pecuniary jurisdiction (Jurisdiction Rules 2021).
    consumer: {
      district:  { max: 5000000,   forum: 'District Consumer Disputes Redressal Commission' },   // ≤ ₹50 lakh
      state:     { max: 20000000,  forum: 'State Consumer Disputes Redressal Commission' },       // > ₹50L ≤ ₹2 Cr
      national:  { max: Infinity,  forum: 'National Consumer Disputes Redressal Commission (NCDRC)' }, // > ₹2 Cr
      limitationDays: 730,
      portal: 'e-Daakhil (edaakhil.nic.in) — file online for free / nominal fee',
      helpline: 'National Consumer Helpline 1915'
    },

    helplines: {
      cyber: '1930 (cyber-fraud — call in the golden hour to freeze the money) · cybercrime.gov.in',
      legalAid: 'NALSA free legal aid 15100',
      women: 'Women helpline 181 · Police 112',
      child: 'Childline 1098',
      senior: 'Elderline 14567',
      consumer: 'National Consumer Helpline 1915',
      mental: 'Tele-MANAS 14416 (if distressed)'
    }
  };

  // ── Rights Coach knowledge base (rights → legal basis → first steps). ──
  // Education > Fear; Explain rights before actions. Never predicts outcomes.
  var RIGHTS = {
    arrest: {
      title: 'If the police want to arrest or question you',
      rights: [
        'You must be told the GROUNDS of arrest (BNSS s.47; Constitution Art. 22).',
        'For many offences police must first give a written NOTICE OF APPEARANCE (BNSS s.35) instead of arresting — if you comply, you should not be arrested unless reasons are recorded.',
        'You must be produced before a Magistrate within 24 HOURS (BNSS s.58; Art. 22(2)).',
        'You have the right to a lawyer of your choice, and to FREE legal aid if you cannot afford one (Art. 39A; NALSA).',
        'A relative/friend must be informed of your arrest and where you are held (BNSS s.48).',
        'A woman cannot normally be arrested after sunset and before sunrise except in exceptional cases with a woman officer and Magistrate permission.',
        'You have the right to a medical examination and to remain silent (no self-incrimination, Art. 20(3)).'
      ],
      firstSteps: ['Stay calm and do not resist. Ask for the grounds in writing.', 'Call a lawyer or NALSA 15100 for free legal aid.', 'Note the officer name, station and time; tell a family member.'],
      helpline: '112 (police) · NALSA 15100 (free legal aid)',
      sources: ['BNSS 2023 ss.35,47,48,58 · Constitution Arts 20(3),21,22,39A']
    },
    employee: {
      title: 'Employee / worker rights',
      rights: [
        'Wages must be paid on time; on resignation/removal, final wages are due quickly (Code on Wages 2019).',
        'No illegal deduction from salary beyond what the law allows.',
        'Gratuity is payable after 5 years of continuous service (Payment of Gratuity Act).',
        'Provident Fund / ESI for eligible establishments.',
        'A woman has 26 weeks paid maternity leave (Maternity Benefit Act).',
        'Protection from workplace sexual harassment with an Internal Committee in workplaces of 10+ (POSH Act 2013).',
        'Wrongful termination / non-payment can go to the Labour Commissioner or labour court.'
      ],
      firstSteps: ['Keep your appointment letter, payslips and messages.', 'Send a written demand for dues (keep proof).', 'Approach the Labour Commissioner / file under the Code on Wages.'],
      helpline: 'State Labour Commissioner · NALSA 15100',
      sources: ['Code on Wages 2019 · Payment of Gratuity Act 1972 · Maternity Benefit Act 1961 · POSH Act 2013']
    },
    tenant: {
      title: 'Tenant & landlord rights',
      rights: [
        'You cannot be evicted without due legal process — no force, no lock-changing, no cutting water/power.',
        'A proper written notice is required to end a tenancy; the period depends on the agreement / state rent law.',
        'Security deposit must be returned (minus genuine dues). Model Tenancy Act 2021 caps it at ~2 months rent for homes (where adopted by the state).',
        'The landlord must do structural repairs; tenant does minor upkeep (unless agreed otherwise).',
        'Rent increases must follow the agreement / state rent control rules.'
      ],
      firstSteps: ['Read your rent agreement; note notice period and deposit terms.', 'Communicate in writing and keep proof.', 'If threatened with forced eviction, you can approach the police/Rent Authority — eviction needs legal process.'],
      helpline: 'State Rent Authority · NALSA 15100',
      sources: ['Model Tenancy Act 2021 (state-adopted) · State Rent Control Acts · Transfer of Property Act 1882']
    },
    women: {
      title: 'Women’s rights & protection',
      rights: [
        'Protection from domestic violence — physical, emotional, sexual, economic — with right to residence, protection, monetary relief and custody (PWDV Act 2005). No fixed time limit.',
        'Equal inheritance rights for daughters in ancestral property (Hindu Succession Act, as amended).',
        'Protection from workplace sexual harassment (POSH Act 2013) — complain to the Internal Committee within 3 months (extendable).',
        'Zero-FIR: you can file an FIR at ANY police station regardless of where the offence happened.',
        'Free legal aid for every woman regardless of income (Legal Services Authorities Act s.12).',
        'Maintenance from husband/family in appropriate cases.'
      ],
      firstSteps: ['Call 181 (women) or 112 (police) if in danger.', 'A Protection Officer / NGO can file a Domestic Incident Report for you.', 'NALSA 15100 gives you a free lawyer.'],
      helpline: 'Women 181 · Police 112 · NALSA 15100',
      sources: ['PWDV Act 2005 · POSH Act 2013 · Hindu Succession Act 1956/2005 · LSA Act 1987 s.12']
    },
    senior: {
      title: 'Senior citizen rights',
      rights: [
        'Children/heirs are legally bound to maintain parents & senior citizens (Maintenance & Welfare of Senior Citizens Act 2007).',
        'A senior can apply to the Maintenance Tribunal for a monthly maintenance order — a fast, lawyer-optional process.',
        'A gift/transfer of property made on the condition of care can be CANCELLED if the children neglect the parent.',
        'Free legal aid is available; senior citizens are a priority category.',
        'Protection from abuse, abandonment and property fraud.'
      ],
      firstSteps: ['Apply to the District Maintenance Tribunal (simple application — no lawyer required).', 'Keep property and transfer papers safe.', 'Call Elderline 14567 or NALSA 15100.'],
      helpline: 'Elderline 14567 · NALSA 15100',
      sources: ['Maintenance & Welfare of Parents & Senior Citizens Act 2007']
    },
    consumer: {
      title: 'Consumer rights',
      rights: [
        'Right to refund/replacement/compensation for defective goods or deficient services (Consumer Protection Act 2019).',
        'Right against unfair trade practices, misleading ads and overcharging above MRP.',
        'File a complaint online for free/low cost on e-Daakhil — a lawyer is optional.',
        'A complaint can be filed within 2 years of the problem.',
        'Right to be heard and to seek compensation including for mental agony.'
      ],
      firstSteps: ['First send a written complaint to the seller/company (keep proof).', 'Call National Consumer Helpline 1915.', 'File on e-Daakhil in the right Commission (by claim value).'],
      helpline: 'National Consumer Helpline 1915',
      sources: ['Consumer Protection Act 2019 · Jurisdiction Rules 2021']
    },
    cyber: {
      title: 'Cyber-crime & online fraud rights',
      rights: [
        'Report financial cyber-fraud IMMEDIATELY on 1930 — the "golden hour" lets banks freeze the money.',
        'File a complaint on cybercrime.gov.in (special, anonymous option for women/children).',
        'You are NOT obliged to pay anyone who threatens "digital arrest" — police NEVER arrest over a video call. It is a scam.',
        'Right to demand the bank act on an unauthorised transaction reported in time (RBI limited-liability rules).',
        'Data protection rights over your personal data (DPDP Act 2023).'
      ],
      firstSteps: ['Call 1930 and your bank at once; freeze the account/card.', 'Save screenshots, numbers, UPI IDs and transaction IDs.', 'File on cybercrime.gov.in and get the acknowledgement number.'],
      helpline: 'Cyber 1930 · cybercrime.gov.in · Police 112',
      sources: ['IT Act 2000 · BNS 2023 (cheating/forgery) · RBI limited-liability circular · DPDP Act 2023']
    },
    student: {
      title: 'Student rights',
      rights: [
        'Protection from ragging — it is a punishable offence; every institution must have an anti-ragging committee (UGC Regulations).',
        'Right to education (RTE Act for ages 6–14; reservation in private schools).',
        'Protection from arbitrary fee hikes / withholding of documents.',
        'Protection from cyber-bullying and harassment (IT Act / BNS).',
        'Scholarship and fee-relief schemes for eligible categories.'
      ],
      firstSteps: ['Report ragging to the UGC anti-ragging helpline 1800-180-5522.', 'Keep fee receipts and admission documents.', 'Escalate to the institution’s grievance committee, then the regulator.'],
      helpline: 'Anti-ragging 1800-180-5522 · Childline 1098',
      sources: ['UGC Anti-Ragging Regulations 2009 · RTE Act 2009 · IT Act 2000']
    }
  };

  // ── Notice / document Decoder knowledge base (what is it · who · means · deadline · worst case · 3 steps). ──
  var NOTICES = {
    cheque138: {
      label: 'Cheque bounce / s.138 legal notice', issuer: 'The payee (the person you gave the cheque to), via a lawyer',
      means: 'Your cheque bounced and they are formally demanding payment before filing a criminal complaint.',
      deadline: 'You have 15 days from receiving this notice to pay the amount.',
      worst: 'A criminal case under s.138 NI Act — up to 2 years imprisonment and/or fine up to twice the cheque amount.',
      steps: ['If the claim is genuine, pay within 15 days — this usually ends it.', 'If you dispute it, reply in writing through a lawyer within 15 days.', 'Keep proof of payment / your reply.']
    },
    incometax: {
      label: 'Income-tax notice (143/142/148 etc.)', issuer: 'Income Tax Department',
      means: 'The department wants information, has found a mismatch, or is assessing/re-opening your return.',
      deadline: 'Each notice states a response date — usually 15–30 days. Respond on the e-filing portal.',
      worst: 'Best-judgment assessment, tax demand, interest and penalty if ignored.',
      steps: ['Note the section and the due date on the notice.', 'Gather Form 16/26AS/AIS and the relevant proofs.', 'Respond on incometax.gov.in; for big amounts, ask a CA (see Chitti CA OS).']
    },
    gst: {
      label: 'GST notice (GSTR-3A / ASMT / DRC etc.)', issuer: 'GST department',
      means: 'A return is missing, there is a tax/ITC mismatch, or tax is being demanded.',
      deadline: 'Stated on the notice — often 7–30 days; respond on the GST portal.',
      worst: 'Tax demand with interest and penalty; registration can be cancelled for non-filing.',
      steps: ['Identify the notice type and due date.', 'File the missing return / reconcile ITC.', 'Reply on gst.gov.in; for big amounts, consult a CA (Chitti CA OS).']
    },
    demand: {
      label: 'Legal demand / recovery notice', issuer: 'A lawyer on behalf of a person/company (loan, dues, contract)',
      means: 'They are formally demanding money or action and warning of a court case if you do not comply.',
      deadline: 'Usually 7–30 days as stated; not replying can be used against you later.',
      worst: 'A civil suit and possible recovery proceedings.',
      steps: ['Read what exactly is demanded and by when.', 'If genuine, settle or negotiate in writing.', 'If disputed, send a proper reply (a lawyer can draft it) — do not ignore it.']
    },
    eviction: {
      label: 'Eviction / vacate notice', issuer: 'Landlord / their lawyer',
      means: 'The landlord wants you to vacate by a date.',
      deadline: 'The notice period in your agreement / state rent law (often 1–3 months).',
      worst: 'An eviction suit before the Rent Authority/court — but you cannot be thrown out by force.',
      steps: ['Check your agreement’s notice period and deposit terms.', 'You cannot be evicted without a legal order — do not panic.', 'Reply in writing; seek the Rent Authority / NALSA 15100 if it is unfair.']
    },
    police35: {
      label: 'Police notice of appearance (BNSS s.35 / old 41A CrPC)', issuer: 'Police (investigating officer)',
      means: 'You are asked to appear and cooperate with an investigation — this is INSTEAD of arrest.',
      deadline: 'Appear on the date/time stated. Comply — do not avoid it.',
      worst: 'If you ignore it without reason, the police may seek to arrest you.',
      steps: ['Appear on the stated date; take a lawyer or call NALSA 15100.', 'Cooperate but you may remain silent on self-incriminating matters (Art. 20(3)).', 'Keep a copy of the notice and note who you met.']
    },
    summons: {
      label: 'Court summons', issuer: 'A court',
      means: 'A case involves you (as a party or witness) and you must appear or respond by a date.',
      deadline: 'The date on the summons. Ignoring a summons is serious.',
      worst: 'Ex-parte order against you, or a warrant for non-appearance.',
      steps: ['Note the court, case number and date.', 'Engage a lawyer or get free legal aid (NALSA 15100).', 'Appear or file your response on time.']
    },
    consumer: {
      label: 'Consumer Commission notice', issuer: 'A Consumer Commission (a consumer filed against you)',
      means: 'A consumer complaint has been admitted and you must file your reply/version.',
      deadline: 'Usually 30 days (extendable up to 45) to file the response.',
      worst: 'The case proceeds ex-parte and an order/compensation can be passed against you.',
      steps: ['Note the Commission, case number and reply date.', 'Prepare your version with documents.', 'File the reply on time; consider a lawyer / NALSA 15100.']
    },
    loanrecovery: {
      label: 'Loan recovery / SARFAESI notice', issuer: 'Bank / NBFC / recovery agency',
      means: 'A loan is in default and the lender is demanding repayment, possibly to seize secured assets.',
      deadline: 'A SARFAESI s.13(2) notice gives 60 days to pay before action; others vary.',
      worst: 'Seizure/auction of secured property; a civil/DRT recovery case.',
      steps: ['Verify the amount and the loan account; recovery agents must follow RBI rules and cannot threaten or use force.', 'Negotiate a repayment/settlement in writing.', 'Harassment by agents is illegal — complain to the bank ombudsman / police; seek NALSA 15100.']
    }
  };

  // ── Document checklists (task → documents · where · cost band · tip). ──
  var CHECKLISTS = {
    fir: { label: 'File an FIR (police complaint)', docs: ['Your ID proof', 'Written complaint with date/time/place & what happened', 'Any evidence (photos, messages, witnesses)'],
      where: 'Any police station (Zero-FIR allowed anywhere) or state police e-FIR portal', cost: 'Free', tip: 'Ask for a free copy of the FIR — it is your right.' },
    rti: { label: 'File an RTI application', docs: ['Your question in writing (clear & specific)', 'Name & address', '₹10 fee (free for BPL)'],
      where: 'The Public Information Officer of that department (online RTI portal for central bodies)', cost: '₹10 (BPL: free)', tip: 'Reply must come in 30 days (48 hours if life/liberty).' },
    consumer_complaint: { label: 'File a consumer complaint', docs: ['Bill/invoice & proof of payment', 'Warranty/communication with the seller', 'Written complaint stating the defect & relief sought'],
      where: 'e-Daakhil (edaakhil.nic.in) — District/State/National by claim value', cost: 'Nil/nominal court fee', tip: 'Send a written complaint to the company first; file within 2 years.' },
    rent_agreement: { label: 'Make a rent agreement', docs: ['ID & address proof of both parties', 'Property ownership proof', 'Photos & rent/deposit terms in writing'],
      where: 'Sub-Registrar (register if 12+ months) / e-stamping portal', cost: 'Stamp duty + registration (varies by state)', tip: 'Register agreements of 12 months or more; keep the deposit terms clear.' },
    will: { label: 'Make a Will', docs: ['List of assets & beneficiaries', 'Two witnesses', 'Your ID'],
      where: 'Can be hand-written; registration (Sub-Registrar) is optional but safer', cost: 'Free (registration nominal)', tip: 'A Will does not need a stamp; two witnesses must sign in your presence.' },
    succession: { label: 'Get a succession / legal-heir certificate', docs: ['Death certificate', 'ID & relationship proof of heirs', 'Application form'],
      where: 'Tehsildar / Revenue office (legal-heir) or Civil Court (succession certificate for debts/securities)', cost: 'Nominal court/stamp fee', tip: 'Legal-heir certificate is quicker for pensions/jobs; succession certificate is for debts & securities.' },
    name_change: { label: 'Change your name legally', docs: ['Affidavit for name change', 'Newspaper publication (two papers)', 'ID proof'],
      where: 'Notary (affidavit) → newspaper → Official Gazette', cost: 'Affidavit + gazette fee (varies)', tip: 'Gazette publication is the strongest proof of a name change.' },
    cyber_complaint: { label: 'Report a cyber-fraud', docs: ['Transaction IDs / UPI IDs / bank statement', 'Screenshots, phone numbers, links', 'Your ID & bank details'],
      where: '1930 (call first) → cybercrime.gov.in', cost: 'Free', tip: 'Call 1930 within the golden hour so the bank can freeze the money.' }
  };

  // ── Free legal-aid eligibility (Legal Services Authorities Act 1987, s.12). ──
  var AID_CATEGORIES = [
    { key: 'woman',    label: 'Woman', test: function (p) { return !!p.woman; }, note: 'Every woman is eligible regardless of income.' },
    { key: 'child',    label: 'Child (under 18)', test: function (p) { return !!p.child; }, note: 'Every child is eligible.' },
    { key: 'scst',     label: 'SC / ST', test: function (p) { return !!p.scst; }, note: 'Members of Scheduled Castes/Tribes are eligible.' },
    { key: 'disabled', label: 'Person with disability', test: function (p) { return !!p.disabled; }, note: 'Persons with disability are eligible.' },
    { key: 'senior',   label: 'Senior citizen', test: function (p) { return !!p.senior; }, note: 'Senior citizens are a priority category in most states.' },
    { key: 'trafficking', label: 'Victim of trafficking / beggar', test: function (p) { return !!p.trafficking; }, note: 'Eligible under s.12.' },
    { key: 'industrial', label: 'Industrial workman', test: function (p) { return !!p.industrial; }, note: 'Industrial workmen are eligible.' },
    { key: 'custody',  label: 'In custody / detention', test: function (p) { return !!p.custody; }, note: 'Anyone in custody is eligible.' },
    { key: 'disaster', label: 'Disaster / violence / flood / drought victim', test: function (p) { return !!p.disaster; }, note: 'Eligible under s.12.' },
    { key: 'lowincome', label: 'Low income', test: function (p) { return p.annualIncome != null && Number(p.annualIncome) > 0 && Number(p.annualIncome) <= (p.incomeLimit || 300000); },
      note: 'Eligible if income is below your State limit (₹5 lakh for Supreme Court cases).' }
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // helpers
  // ─────────────────────────────────────────────────────────────────────────
  function n(x) { var v = Number(x); return isFinite(v) ? v : 0; }
  function src(extra) { var s = ['Chitti Legal OS engine v' + RULES.version + ' · rule table ' + RULES.asOfLaw + ' · ' + RULES.codes]; return extra ? s.concat(extra) : s; }
  // All date math is UTC-based so deadlines are timezone-stable (no off-by-one).
  function parseDate(s) { if (!s) return null; var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s)); if (!m) { var d0 = new Date(s); return isNaN(d0.getTime()) ? null : new Date(Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth(), d0.getUTCDate())); } return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); }
  function addDays(d, days) { return new Date(d.getTime() + days * 86400000); }
  function addYears(d, years) { var y = d.getUTCFullYear() + years, mo = d.getUTCMonth(), day = d.getUTCDate(); var x = new Date(Date.UTC(y, mo, day)); if (x.getUTCMonth() !== mo) x = new Date(Date.UTC(y, mo + 1, 0)); /* Feb-29 → Feb-28 */ return x; }
  function addPeriod(d, unit, num) { return unit === 'years' ? addYears(d, num) : addDays(d, num); }
  function daysBetween(a, b) { return Math.round((b.getTime() - a.getTime()) / 86400000); }
  function iso(d) { return d.toISOString().slice(0, 10); }
  var DISCLAIMER = 'This is legal information & education, NOT legal advice. Chitti never files, signs or appears for you. For serious matters, consult a qualified lawyer or NALSA 15100.';

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE L1 — Rights Coach
  // ─────────────────────────────────────────────────────────────────────────
  function rightsCoach(topic) {
    var k = (topic || '').toLowerCase();
    var r = RIGHTS[k];
    if (!r) {
      return { module: 'rights_coach', found: false, topics: Object.keys(RIGHTS),
        summary: 'Pick a topic: ' + Object.keys(RIGHTS).join(', ') + '.',
        confidence: 'n/a', risks: [DISCLAIMER], sources: src() };
    }
    return { module: 'rights_coach', found: true, topic: k, title: r.title,
      rights: r.rights, firstSteps: r.firstSteps, helpline: r.helpline,
      summary: r.title + ': you have ' + r.rights.length + ' key rights. ' + r.firstSteps[0],
      confidence: 'high (statutory rights, deterministic)',
      risks: ['Rights can have exceptions and state-specific variations — confirm specifics for your case.', DISCLAIMER],
      sources: src(r.sources) };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE L2 — Limitation / Deadline engine  (the "money math" of law)
  // input: { matter, causeDateISO, asOfISO }
  // ─────────────────────────────────────────────────────────────────────────
  function limitationCheck(input) {
    input = input || {};
    var key = input.matter, rule = RULES.limitation[key];
    if (!rule) return { module: 'limitation', found: false, matters: Object.keys(RULES.limitation),
      summary: 'Pick a matter type.', confidence: 'n/a', risks: [DISCLAIMER], sources: src() };

    var human = rule.unit == null ? 'special / state-specific' : humanPeriod(rule.unit, rule.n);
    var out = { module: 'limitation', found: true, matter: key, label: rule.label, basis: rule.basis,
      periodUnit: rule.unit, periodN: rule.n, periodHuman: human };

    if (rule.unit == null) {
      out.status = 'special';
      out.summary = rule.label + ': ' + rule.basis + '.';
      out.confidence = 'high (period is special/state-specific — see the dedicated tool or your notice)';
      out.risks = ['This matter does not have a single fixed period — use the Cheque timeline / your notice / state rent law.', DISCLAIMER];
      out.sources = src(); return out;
    }

    var cause = parseDate(input.causeDateISO);
    var asOf = parseDate(input.asOfISO) || (root.Date ? parseDate(iso(new Date())) : null);
    if (cause && asOf) {
      var deadline = addPeriod(cause, rule.unit, rule.n);
      var remaining = daysBetween(asOf, deadline);
      out.causeDate = iso(cause); out.deadline = iso(deadline); out.daysRemaining = remaining;
      out.status = remaining < 0 ? 'likely-time-barred' : (remaining <= 30 ? 'closing-soon' : 'open');
      out.summary = remaining < 0
        ? '⏰ The ' + human + ' period likely ENDED on ' + iso(deadline) + ' (' + Math.abs(remaining) + ' days ago). A court may still condone delay in some cases — ask a lawyer fast.'
        : 'You have about ' + remaining + ' day(s) left — the ' + human + ' period ends on ' + iso(deadline) + '. ' + (remaining <= 30 ? 'Act now.' : 'Plan ahead.');
      out.confidence = 'high (deterministic from the rule table)';
      out.risks = ['Limitation can pause/extend (acknowledgement of debt, part-payment, legal disability, condonation) — confirm with a lawyer.',
        'The cause-of-action date is what matters; pick it carefully.', DISCLAIMER];
    } else {
      out.status = 'period-only';
      out.summary = rule.label + ': the period is ' + human + ' (' + rule.basis + '). Enter the start date to see your deadline.';
      out.confidence = 'high (period)';
      out.risks = ['Enter the cause-of-action date for an exact deadline.', DISCLAIMER];
    }
    out.sources = src(); return out;
  }
  function humanPeriod(unit, num) {
    if (unit === 'years') return num + ' year' + (num > 1 ? 's' : '');
    if (unit === 'days') return num % 30 === 0 && num >= 30 ? (num / 30) + ' month' + (num / 30 > 1 ? 's' : '') : num + ' days';
    return 'special';
  }

  // MODULE L2b — Cheque-bounce (s.138) timeline
  // input: { dishonourDateISO }  → notice-by, pay-by, complaint-window
  function chequeTimeline(input) {
    input = input || {};
    var C = RULES.cheque138;
    var dishonour = parseDate(input.dishonourDateISO);
    var base = { module: 'cheque_138', noticeWithinDays: C.noticeWithinDays, payWithinDays: C.payWithinDays, complaintWithinDays: C.complaintWithinDays,
      confidence: 'high (NI Act s.138/142 deterministic timeline)',
      risks: ['Dates run from the bank "cheque return memo" date and from when the notice is RECEIVED.',
        'Send the demand notice by registered post / courier and keep proof.', DISCLAIMER],
      sources: src(['Negotiable Instruments Act 1881, ss.138 & 142']) };
    if (!dishonour) {
      base.summary = 'Cheque bounce timeline: send a demand notice within 30 days of the bounce → the drawer gets 15 days to pay → if unpaid, file the complaint within 30 days. Enter the bounce date for exact dates.';
      return base;
    }
    var noticeBy = addDays(dishonour, C.noticeWithinDays);
    var payBy = addDays(noticeBy, C.payWithinDays);             // worst-case (if notice served on last day)
    var complaintStart = addDays(payBy, 1);
    var complaintBy = addDays(complaintStart, C.complaintWithinDays);
    base.dishonourDate = iso(dishonour); base.sendNoticeBy = iso(noticeBy);
    base.drawerPayBy = iso(payBy); base.fileComplaintBetween = iso(complaintStart) + ' and ' + iso(complaintBy);
    base.summary = 'Bounce on ' + iso(dishonour) + ': send the demand notice by ' + iso(noticeBy) + '; the drawer then has 15 days to pay; if unpaid, file the s.138 complaint within 30 days (around ' + iso(complaintStart) + '–' + iso(complaintBy) + ').';
    return base;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE L3 — Notice / document Decoder
  // input: { type } OR { text }  (keyword classifier, LLM-free)
  // ─────────────────────────────────────────────────────────────────────────
  function decodeNotice(input) {
    input = input || {};
    var type = input.type;
    if (!type && input.text) type = classifyNotice(input.text);
    var d = NOTICES[type];
    if (!d) return { module: 'notice_decoder', found: false, types: Object.keys(NOTICES),
      summary: 'Could not recognise the notice. Pick the closest type.', classified: type || null,
      confidence: 'low', risks: ['When unsure, show the notice to a lawyer / NALSA 15100.', DISCLAIMER], sources: src() };
    return { module: 'notice_decoder', found: true, type: type, label: d.label, issuer: d.issuer,
      meaning: d.means, deadline: d.deadline, worstCase: d.worst, nextSteps: d.steps,
      summary: d.label + ' — ' + d.means + ' Deadline: ' + d.deadline,
      confidence: 'high (deterministic classification of a known notice type)',
      risks: ['Read YOUR notice for the exact section, amount and date — they govern.', 'Never ignore a legal notice; a reply protects you.', DISCLAIMER],
      sources: src() };
  }
  function classifyNotice(text) {
    var t = (text || '').toLowerCase();
    if (/138|cheque|dishonou?r|bounce/.test(t)) return 'cheque138';
    if (/143|142|148|income.?tax|assessing officer|\bitr\b/.test(t)) return 'incometax';
    if (/\bgst\b|gstr|drc-|asmt|input tax/.test(t)) return 'gst';
    if (/sarfaesi|13\(2\)|\bloan\b|\bemi\b|recovery agent|\bnpa\b/.test(t)) return 'loanrecovery';
    if (/evict|vacate|tenant|landlord|premises/.test(t)) return 'eviction';
    if (/41a|section 35|appear before|investigating officer|police station/.test(t)) return 'police35';
    if (/summon|hereby summoned|appear in the court|case no/.test(t)) return 'summons';
    if (/consumer|e-?daakhil|redressal commission/.test(t)) return 'consumer';
    if (/demand|legal notice|failing which|hereby call upon/.test(t)) return 'demand';
    return null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE L4 — Contract Risk Scorer  (deterministic weighted red-flags)
  // input: { type, flags:{ autoRenew, lockIn, oneSidedTermination, heavyPenalty, indemnity, jurisdictionFar, noExit, depositOverCap, blankSpaces, noCopy } }
  // ─────────────────────────────────────────────────────────────────────────
  var CONTRACT_FLAGS = {
    oneSidedTermination: { w: 18, text: 'Only the other side can terminate (or with no notice to you) — one-sided.' },
    heavyPenalty:        { w: 16, text: 'A heavy penalty / forfeiture clause against you — negotiate a cap.' },
    indemnity:           { w: 14, text: 'You indemnify them for broad/unlimited losses — limit it.' },
    lockIn:              { w: 12, text: 'A long lock-in / notice period that traps you — shorten it.' },
    noExit:              { w: 12, text: 'No clear exit / refund path for you.' },
    depositOverCap:      { w: 10, text: 'Security deposit looks above the norm (~2 months for homes).' },
    autoRenew:           { w: 8,  text: 'Auto-renews unless you cancel in time — set a reminder.' },
    jurisdictionFar:     { w: 8,  text: 'Disputes go to a far-away city’s courts — costly for you.' },
    blankSpaces:         { w: 14, text: 'Blank spaces / unfilled amounts — never sign a contract with blanks.' },
    noCopy:              { w: 10, text: 'You were not given a signed copy — always keep one.' }
  };
  function contractRisk(input) {
    input = input || {}; var flags = input.flags || {};
    var score = 0, red = [], tips = [];
    Object.keys(CONTRACT_FLAGS).forEach(function (k) {
      if (flags[k]) { var f = CONTRACT_FLAGS[k]; score += f.w; red.push(f.text); }
    });
    score = Math.min(100, score);
    var band = score >= 50 ? 'high-risk' : score >= 20 ? 'caution' : 'low-risk';
    if (red.length) tips.push('Negotiate the flagged clauses in writing before signing — most are negotiable.');
    tips.push('Never sign blanks; always keep a signed copy; read the termination, penalty and renewal clauses first.');
    return { module: 'contract_risk', type: input.type || 'contract', riskScore: score, band: band,
      redFlags: red.length ? red : ['No major red flags from what you selected — still read the whole document.'],
      negotiation: tips,
      summary: 'Contract risk: ' + score + '/100 (' + band + '). ' + (red.length ? red.length + ' clause(s) to review.' : 'Looks reasonable from the selected items.'),
      confidence: 'medium (depends on the actual wording — this scores common red flags, not the full text)',
      risks: ['A clause may be fairer or worse than its label once read in full — have important contracts checked by a lawyer.', DISCLAIMER],
      sources: src(['Indian Contract Act 1872 · Model Tenancy Act 2021 (deposit norm)']) };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE L5 — Consumer Complaint Router (CPA 2019, Jurisdiction Rules 2021)
  // input: { claimValue }
  // ─────────────────────────────────────────────────────────────────────────
  function consumerRouter(input) {
    input = input || {}; var v = n(input.claimValue), C = RULES.consumer;
    var tier = v <= C.district.max ? C.district : (v <= C.state.max ? C.state : C.national);
    return { module: 'consumer_router', claimValue: Math.round(v), forum: tier.forum,
      limitationDays: C.limitationDays, portal: C.portal, helpline: C.helpline,
      steps: ['Send a written complaint to the seller/company first (keep proof).',
        'Call National Consumer Helpline 1915 — many issues are solved here.',
        'If unresolved, file on ' + C.portal + ' in the ' + tier.forum + ' within 2 years.'],
      summary: 'For a claim of ₹' + Math.round(v).toLocaleString('en-IN') + ', file in the ' + tier.forum + ' (within 2 years), online via e-Daakhil.',
      confidence: 'high (deterministic — Jurisdiction Rules 2021 by value of consideration)',
      risks: ['Jurisdiction is by the consideration paid, not the compensation claimed.', 'A lawyer is optional but helps for big/complex claims.', DISCLAIMER],
      sources: src(['Consumer Protection Act 2019 · Jurisdiction Rules 2021']) };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE L6 — Case / Court Companion (deterministic stage KB)
  // input: { caseType }
  // ─────────────────────────────────────────────────────────────────────────
  var CASE_STAGES = {
    civil: { label: 'Civil suit', stages: ['Plaint filed', 'Summons to defendant', 'Written statement', 'Issues framed', 'Evidence & cross-examination', 'Arguments', 'Judgment & decree', 'Execution / appeal'],
      docs: ['Plaint/written statement', 'All agreements & proofs', 'List of witnesses'], expect: 'Civil cases take time; mediation/Lok Adalat can settle faster and cheaper.' },
    criminal: { label: 'Criminal case', stages: ['FIR / complaint', 'Investigation & charge-sheet', 'Cognizance & charges framed', 'Prosecution evidence', 'Defence evidence', 'Arguments', 'Judgment', 'Appeal'],
      docs: ['FIR copy', 'Bail documents (if needed)', 'Any evidence/witnesses'], expect: 'You are innocent until proven guilty; you have the right to a lawyer / free legal aid and to bail in most cases.' },
    consumer: { label: 'Consumer case', stages: ['Complaint filed (e-Daakhil)', 'Notice to opposite party', 'Reply filed', 'Evidence/affidavits', 'Arguments', 'Order', 'Appeal (if needed)'],
      docs: ['Bill & payment proof', 'Complaint & relief sought', 'Correspondence with seller'], expect: 'Consumer forums are designed to be simple — a lawyer is optional.' },
    cheque: { label: 'Cheque bounce (s.138) case', stages: ['Dishonour & demand notice', 'Complaint filed in 30 days', 'Summons to accused', 'Plea & evidence', 'Arguments', 'Judgment', 'Appeal/compounding'],
      docs: ['Bounced cheque & return memo', 'Demand notice + postal proof', 'Agreement/proof of debt'], expect: 'Most s.138 cases can be settled (compounded) by paying — that ends the case.' },
    family: { label: 'Family / matrimonial case', stages: ['Petition filed', 'Notice & response', 'Mediation/counselling (mandatory often)', 'Evidence', 'Arguments', 'Order', 'Appeal'],
      docs: ['Marriage proof', 'Income/asset documents', 'Any prior agreements'], expect: 'Family courts encourage settlement & mediation first; child welfare is paramount.' }
  };
  function caseCompanion(input) {
    input = input || {}; var c = CASE_STAGES[input.caseType];
    if (!c) return { module: 'case_companion', found: false, types: Object.keys(CASE_STAGES),
      summary: 'Pick a case type.', confidence: 'n/a', risks: [DISCLAIMER], sources: src() };
    return { module: 'case_companion', found: true, caseType: input.caseType, label: c.label,
      stages: c.stages, documents: c.docs, expect: c.expect,
      summary: c.label + ': ' + c.stages.length + ' typical stages. ' + c.expect,
      confidence: 'high (typical procedure — exact steps vary by court & facts)',
      risks: ['Procedure & timelines vary by state, court load and the facts — this is a general map.', 'Chitti explains the process; it never predicts who will win.', DISCLAIMER],
      sources: src(['BNSS 2023 / CPC 1908 / Consumer Protection Act 2019 / NI Act 1881']) };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE L7 — Document Checklist
  // ─────────────────────────────────────────────────────────────────────────
  function docChecklist(input) {
    input = input || {}; var c = CHECKLISTS[input.task];
    if (!c) return { module: 'doc_checklist', found: false, tasks: Object.keys(CHECKLISTS),
      summary: 'Pick a task.', confidence: 'n/a', risks: [DISCLAIMER], sources: src() };
    return { module: 'doc_checklist', found: true, task: input.task, label: c.label,
      documents: c.docs, where: c.where, cost: c.cost, tip: c.tip,
      summary: c.label + ': ' + c.docs.length + ' documents. Where: ' + c.where + '. Cost: ' + c.cost + '.',
      confidence: 'high (standard requirements)',
      risks: ['Exact documents/fees vary by state & office — confirm locally before you go.', DISCLAIMER],
      sources: src() };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE L8 — Free Legal Aid + Government legal layer (THE MOAT: free help you are OWED)
  // profile: { woman, child, scst, disabled, senior, trafficking, industrial, custody, disaster, annualIncome, incomeLimit }
  // ─────────────────────────────────────────────────────────────────────────
  function legalAid(profile) {
    profile = profile || {};
    var matched = AID_CATEGORIES.filter(function (a) { try { return a.test(profile); } catch (e) { return false; } })
      .map(function (a) { return { key: a.key, label: a.label, note: a.note }; });
    var eligible = matched.length > 0;
    return { module: 'legal_aid', eligible: eligible, categories: matched,
      helpline: RULES.helplines.legalAid,
      how: ['Call NALSA 15100 or walk into your District Legal Services Authority (DLSA) at the court complex.',
        'You can ask for a free lawyer, free advice, and free Lok Adalat settlement.',
        'Bring an ID and any case papers; the service is free.'],
      summary: eligible
        ? 'You appear ELIGIBLE for FREE legal aid (' + matched.map(function (m) { return m.label; }).join(', ') + '). Call NALSA 15100.'
        : 'You may still get free legal advice from the DLSA even if not in a priority category — call NALSA 15100.',
      confidence: 'high (Legal Services Authorities Act 1987, s.12 categories)',
      risks: ['Income limits vary by State (₹5 lakh for Supreme Court cases). Final eligibility is decided by the DLSA.',
        'Free legal aid is a right for the eligible — never pay a "facilitator".', DISCLAIMER],
      sources: src(['Legal Services Authorities Act 1987, s.12 · NALSA']) };
  }

  function govtLegalLayer(topic) {
    var map = {
      women:  ['Women helpline 181', 'One Stop Centre (Sakhi) for shelter+legal+medical', 'Free legal aid (NALSA 15100)'],
      senior: ['Elderline 14567', 'Maintenance Tribunal (free, lawyer-optional)', 'Free legal aid (NALSA 15100)'],
      cyber:  ['Cyber 1930 (golden hour)', 'cybercrime.gov.in', 'Bank ombudsman for unauthorised transactions'],
      child:  ['Childline 1098', 'Child Welfare Committee', 'Free legal aid (NALSA 15100)'],
      consumer: ['National Consumer Helpline 1915', 'e-Daakhil online filing', 'Free legal aid (NALSA 15100)'],
      general: ['NALSA free legal aid 15100', 'District Legal Services Authority (DLSA)', 'Lok Adalat (free, binding settlement)']
    };
    var list = map[(topic || 'general').toLowerCase()] || map.general;
    return { module: 'govt_legal_layer', topic: topic || 'general', services: list,
      summary: 'Free / government help: ' + list.join(' · '),
      confidence: 'high', risks: ['Helpline coverage varies by state/time; if one does not respond, try 112 or NALSA 15100.', DISCLAIMER],
      sources: src(['Government of India helplines · NALSA · State Legal Services Authorities']) };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE L9 — Scam / Fraud Shield (cyber + legal scams; deterministic heuristic)
  // input: { flags:{ urgency, asksOtpOrPin, threatensArrest, videoCallPolice, advanceFee, fakeJob, fakeCourtSummons, loanAppHarass, payToReceive, linkClick } }
  // ─────────────────────────────────────────────────────────────────────────
  var SCAM_FLAGS = {
    threatensArrest:  { w: 30, text: '"Digital arrest" / police-on-video-call demanding money — this is ALWAYS a scam. Police never arrest over a call. Hang up.' },
    asksOtpOrPin:     { w: 30, text: 'Asks for OTP / PIN / CVV / password — NEVER share these. No genuine bank/officer asks.' },
    fakeCourtSummons: { w: 22, text: 'Fake court/police summons by SMS/WhatsApp/email demanding a fee — real summons are not paid by UPI.' },
    advanceFee:       { w: 20, text: 'Pay-first to get a prize/loan/refund/job — a classic advance-fee fraud.' },
    payToReceive:     { w: 18, text: 'Asked to pay to RECEIVE money — genuine refunds/winnings never need an up-front payment.' },
    loanAppHarass:    { w: 18, text: 'Loan-app harassment / contact-list threats — illegal; report to 1930 & police, complain to the bank ombudsman.' },
    urgency:          { w: 12, text: 'Extreme urgency / "do it now or lose everything" — pressure is a red flag; slow down.' },
    fakeJob:          { w: 14, text: 'Job that asks for a deposit/registration fee — genuine jobs do not charge you.' },
    linkClick:        { w: 12, text: 'Unknown link/APK to "verify" — do not click/install; it can steal your data.' }
  };
  function scamShield(input) {
    input = input || {}; var flags = input.flags || {};
    var score = 0, hits = [];
    Object.keys(SCAM_FLAGS).forEach(function (k) { if (flags[k]) { var f = SCAM_FLAGS[k]; score += f.w; hits.push(f.text); } });
    score = Math.min(100, score);
    var band = score >= 50 ? 'high-risk' : score >= 20 ? 'suspicious' : 'low-risk';
    var act = score >= 20
      ? ['Do NOT pay or share any OTP/PIN. Stop all contact.', 'If money was sent, call 1930 NOW (golden hour) and your bank to freeze it.', 'Report on cybercrime.gov.in and keep screenshots.']
      : ['Stay alert; verify the sender through an official number you find yourself.', 'Never share OTP/PIN. When unsure, call 1930.'];
    return { module: 'scam_shield', riskScore: score, band: band,
      signals: hits.length ? hits : ['No strong scam signals from what you selected — still verify before paying.'],
      whatToDo: act, helpline: RULES.helplines.cyber,
      summary: 'Scam risk: ' + score + '/100 (' + band + '). ' + (band === 'high-risk' ? 'Treat as a scam — do not pay; call 1930 if money was sent.' : band === 'suspicious' ? 'Be very careful and verify.' : 'Low signals — stay alert.'),
      confidence: 'medium (heuristic — when in doubt, treat it as a scam)',
      risks: ['A low score is NOT a guarantee it is safe — scammers change tactics. Never share OTP/PIN.', DISCLAIMER],
      sources: src(['I4C / cybercrime.gov.in advisories · RBI · IT Act 2000 · BNS 2023']) };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE L10 — Legal Twin (on-device memory of documents, matters & deadlines)
  // ─────────────────────────────────────────────────────────────────────────
  var TWIN_KEY = 'chitti_legal_os_twin_v1';
  function twinLoad() { try { return JSON.parse((root.localStorage && root.localStorage.getItem(TWIN_KEY)) || '{}'); } catch (e) { return {}; } }
  function twinSave(obj) { try { if (root.localStorage) root.localStorage.setItem(TWIN_KEY, JSON.stringify(obj || {})); return true; } catch (e) { return false; } }
  function twinAddMatter(m) { var t = twinLoad(); t.matters = t.matters || []; t.matters.push(m); twinSave(t); return t; }
  function twinForget() { try { if (root.localStorage) root.localStorage.removeItem(TWIN_KEY); } catch (e) {} return {}; }

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────
  var API = {
    RULES: RULES, RIGHTS: RIGHTS, NOTICES: NOTICES, CHECKLISTS: CHECKLISTS, DISCLAIMER: DISCLAIMER,
    rightsCoach: rightsCoach,
    limitationCheck: limitationCheck, chequeTimeline: chequeTimeline, humanPeriod: humanPeriod,
    decodeNotice: decodeNotice, classifyNotice: classifyNotice,
    contractRisk: contractRisk,
    consumerRouter: consumerRouter,
    caseCompanion: caseCompanion,
    docChecklist: docChecklist,
    legalAid: legalAid, govtLegalLayer: govtLegalLayer,
    scamShield: scamShield,
    twin: { load: twinLoad, save: twinSave, addMatter: twinAddMatter, forget: twinForget, KEY: TWIN_KEY }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.ChittiLegalOS = API;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));