/* Chitti CA OS — Deterministic Financial Engine
 * Frontend for chitti-ca/ceos/  (Chitti CA Operating System / CEOS v1.0)
 *
 * RULES ARE THE PRODUCT. THE LLM IS AN ENHANCEMENT, NEVER A DEPENDENCY.
 * Every rupee figure shown to a user is computed HERE, from the user's own numbers
 * + a VERSIONED rule table — never invented by an LLM. The LLM only explains.
 * Works with the internet down and DeepSeek 429. Pure, dependency-free, node-testable.
 *
 * Every result object carries: { confidence, risks:[], sources:[] }  (Founder Rule:
 * Always show confidence, risks, sources, reasoning; Never guarantee.)
 *
 * Spec: chitti-ca/ceos/ARCHITECTURE.md · EVALS.md · guardrails/hallucination.md
 */
(function (root) {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────────
  // VERSIONED RULE TABLES  (change the table, never the logic — memory/rule_versioning.md)
  // ─────────────────────────────────────────────────────────────────────────
  var RULES = {
    version: '1.0.0',
    fy: '2025-26',          // AY 2026-27
    effective_from: '2025-04-01',

    // Income-tax — NEW regime (default), FY 2025-26 (Budget 2025 slabs)
    newRegime: {
      stdDeduction: 75000,
      rebate87A: { incomeCap: 1200000, maxRebate: 60000 }, // tax nil up to ₹12L taxable
      slabs: [
        { upTo: 400000, rate: 0 },
        { upTo: 800000, rate: 0.05 },
        { upTo: 1200000, rate: 0.10 },
        { upTo: 1600000, rate: 0.15 },
        { upTo: 2000000, rate: 0.20 },
        { upTo: 2400000, rate: 0.25 },
        { upTo: Infinity, rate: 0.30 }
      ],
      surcharge: [ // capped at 25% under new regime
        { over: 50000000, rate: 0.25 },
        { over: 20000000, rate: 0.25 },
        { over: 10000000, rate: 0.15 },
        { over: 5000000, rate: 0.10 }
      ]
    },

    // Income-tax — OLD regime, FY 2025-26 (unchanged)
    oldRegime: {
      stdDeduction: 50000,
      rebate87A: { incomeCap: 500000, maxRebate: 12500 }, // tax nil up to ₹5L taxable
      slabs: [
        { upTo: 250000, rate: 0 },
        { upTo: 500000, rate: 0.05 },
        { upTo: 1000000, rate: 0.20 },
        { upTo: Infinity, rate: 0.30 }
      ],
      surcharge: [
        { over: 50000000, rate: 0.37 },
        { over: 20000000, rate: 0.25 },
        { over: 10000000, rate: 0.15 },
        { over: 5000000, rate: 0.10 }
      ],
      // common deductions cap hints (for the deduction finder — guidance only)
      caps: { '80C': 150000, '80D': 25000, '80D_senior': 50000, '80CCD1B': 50000, '80TTA': 10000, '80E': Infinity, '80G': Infinity }
    },

    cess: 0.04, // Health & Education cess on (tax + surcharge)

    // Capital gains (post Budget 2024, FY25-26)
    capitalGains: {
      equityLTCG: { rate: 0.125, exemption: 125000 }, // listed equity/equity MF, >12 months
      equitySTCG: { rate: 0.20 },                      // <=12 months (Sec 111A)
      // other assets LTCG 12.5% without indexation (post-23-Jul-2024); slab for STCG
      otherLTCG: { rate: 0.125 }
    },

    // GST
    gst: {
      rates: [0, 5, 12, 18, 28],
      regThreshold: { goods_normal: 4000000, goods_special: 2000000, services_normal: 2000000, services_special: 1000000 },
      composition: { goods: 15000000, services: 5000000, rate_trader: 0.01, rate_mfg: 0.01, rate_restaurant: 0.05, rate_service: 0.06 },
      eInvoiceTurnover: 50000000, // ≥ ₹5 Cr
      blockedITC: ['motor vehicle (personal)', 'club / health / fitness membership', 'food & beverage (personal)', 'works contract for immovable property (own)', 'goods lost/stolen/gifted/free samples']
    },

    // Compliance due dates (recurring; month/day, India FY). Source: statutory calendar.
    dueDates: [
      { task: 'GSTR-1 (monthly)', day: 11, freq: 'monthly', who: 'GST regular' },
      { task: 'GSTR-3B (monthly)', day: 20, freq: 'monthly', who: 'GST regular' },
      { task: 'TDS payment', day: 7, freq: 'monthly', who: 'deductor' },
      { task: 'PF payment', day: 15, freq: 'monthly', who: 'employer' },
      { task: 'ESI payment', day: 15, freq: 'monthly', who: 'employer' },
      { task: 'Advance tax Q1 (15%)', month: 6, day: 15, freq: 'yearly', who: 'taxpayer' },
      { task: 'Advance tax Q2 (45%)', month: 9, day: 15, freq: 'yearly', who: 'taxpayer' },
      { task: 'Advance tax Q3 (75%)', month: 12, day: 15, freq: 'yearly', who: 'taxpayer' },
      { task: 'Advance tax Q4 (100%)', month: 3, day: 15, freq: 'yearly', who: 'taxpayer' },
      { task: 'ITR filing (non-audit)', month: 7, day: 31, freq: 'yearly', who: 'individual' },
      { task: 'Tax audit report (3CD)', month: 9, day: 30, freq: 'yearly', who: 'audit case' },
      { task: 'ROC AOC-4 (financials)', month: 10, day: 30, freq: 'yearly', who: 'company' },
      { task: 'ROC MGT-7 (annual return)', month: 11, day: 29, freq: 'yearly', who: 'company' }
    ],

    // Penalty/interest rule-of-thumb (deterministic estimate bands; never a guarantee)
    penalties: {
      gstrLateFeePerDay: 50,      // ₹50/day (₹25 CGST + ₹25 SGST), capped
      gstrLateFeeCap: 5000,
      tdsInterestMonthly: 0.015,  // 1.5%/month late deposit
      advanceTaxInterestMonthly: 0.01, // 234B/234C ~1%/month
      itrLateFee: { below5L: 1000, above5L: 5000 }, // 234F
      msme45DayRule: true         // Sec 43B(h): pay MSME within 45 days or lose deduction that year
    }
  };

  // Government schemes — eligibility predicates + estimated ₹ impact bands (the moat).
  // impact is a BAND, never a promise of approval (guardrails/no_guarantee.md).
  var SCHEMES = [
    { id: 'mudra', name: 'PM MUDRA Loan', who: 'micro business / non-farm',
      elig: function (p) { return p.type !== 'individual' && p.turnover <= 10000000; },
      impact: 'Collateral-free loan up to ₹10–20 lakh (Shishu/Kishore/Tarun/Tarun-Plus)',
      band: [50000, 2000000] },
    { id: 'pmegp', name: 'PMEGP (KVIC)', who: 'new manufacturing/service unit',
      elig: function (p) { return p.entityAgeYears != null && p.entityAgeYears <= 1 && (p.industry === 'manufacturing' || p.industry === 'services'); },
      impact: 'Govt subsidy 15–35% of project cost (project up to ₹25–50 lakh)',
      band: [200000, 1500000] },
    { id: 'udyam', name: 'Udyam (MSME) Registration', who: 'any MSME',
      elig: function (p) { return p.type !== 'individual' && p.turnover <= 2500000000; },
      impact: 'Priority lending, lower interest, tender preference, 45-day payment protection',
      band: [0, 0], note: 'free registration — unlocks the others' },
    { id: 'cgtmse', name: 'CGTMSE Credit Guarantee', who: 'MSME needing collateral-free credit',
      elig: function (p) { return p.type !== 'individual' && p.turnover <= 2500000000; },
      impact: 'Guarantee cover on loans up to ₹5 crore (no collateral)',
      band: [100000, 50000000] },
    { id: 'startupindia', name: 'Startup India (80-IAC + angel-tax exemption)', who: 'DPIIT startup',
      elig: function (p) { return p.type === 'startup' && p.entityAgeYears != null && p.entityAgeYears < 10 && p.turnover < 1000000000; },
      impact: '3-year 100% tax holiday (80-IAC), angel-tax exemption, fast-track IP',
      band: [500000, 30000000] },
    { id: 'statesubsidy', name: 'State MSME / Industrial Subsidy', who: 'state-registered unit',
      elig: function (p) { return p.type !== 'individual' && !!p.state; },
      impact: 'Capital/interest/power subsidy (varies by state policy)',
      band: [50000, 5000000] },
    { id: 'export', name: 'Export Incentives (LUT / RoDTEP / IGST refund)', who: 'exporter',
      elig: function (p) { return !!p.exporter; },
      impact: 'Zero-rated exports under LUT + RoDTEP scrips (0.5–4% of FOB) + IGST refund',
      band: [50000, 10000000] },
    { id: 'solar', name: 'Solar / PM-Surya Ghar / accelerated depreciation', who: 'business or home with roof',
      elig: function (p) { return true; },
      impact: 'Capital subsidy + 40% accelerated depreciation on solar assets',
      band: [30000, 2000000] },
    { id: 'agri', name: 'Agriculture / PMFME / FPO benefits', who: 'farmer / food processor',
      elig: function (p) { return p.industry === 'agriculture' || p.industry === 'food'; },
      impact: 'Food-processing subsidy (PMFME 35%), FPO support, KCC credit',
      band: [50000, 1000000] }
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // helpers
  // ─────────────────────────────────────────────────────────────────────────
  function n(x) { var v = Number(x); return isFinite(v) ? v : 0; }
  function round(x) { return Math.round(x); }
  function src() { return ['Chitti CA OS engine v' + RULES.version + ' · rule table FY' + RULES.fy]; }

  function slabTax(taxable, slabs) {
    var tax = 0, prev = 0;
    for (var i = 0; i < slabs.length; i++) {
      var s = slabs[i];
      if (taxable > prev) {
        var band = Math.min(taxable, s.upTo) - prev;
        tax += band * s.rate;
        prev = s.upTo;
      } else break;
    }
    return tax;
  }

  function surchargeRate(income, table) {
    for (var i = 0; i < table.length; i++) { if (income > table[i].over) return table[i].rate; }
    return 0;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE 2 — Income tax (one regime)
  // input: { gross, regime:'new'|'old', salaried:true, deductions:{'80C':n,...} }
  // ─────────────────────────────────────────────────────────────────────────
  function incomeTaxOne(input, regimeKey) {
    var R = regimeKey === 'old' ? RULES.oldRegime : RULES.newRegime;
    var gross = n(input.gross);
    var std = input.salaried ? R.stdDeduction : 0;
    var ded = 0;
    if (regimeKey === 'old' && input.deductions) {
      Object.keys(input.deductions).forEach(function (k) {
        var cap = (R.caps && R.caps[k] != null) ? R.caps[k] : Infinity;
        ded += Math.min(n(input.deductions[k]), cap);
      });
    }
    var taxable = Math.max(0, gross - std - ded);
    var baseTax = slabTax(taxable, R.slabs);

    // 87A rebate
    var rebate = 0;
    if (taxable <= R.rebate87A.incomeCap) rebate = Math.min(baseTax, R.rebate87A.maxRebate);
    var afterRebate = Math.max(0, baseTax - rebate);

    var sur = afterRebate * surchargeRate(taxable, R.surcharge);
    var cess = (afterRebate + sur) * RULES.cess;
    var total = afterRebate + sur + cess;

    return {
      regime: regimeKey, gross: gross, standardDeduction: std, deductionsAllowed: round(ded),
      taxableIncome: round(taxable), slabTax: round(baseTax), rebate87A: round(rebate),
      surcharge: round(sur), cess: round(cess), totalTax: round(total)
    };
  }

  // regime comparison + recommendation
  function incomeTax(input) {
    var nw = incomeTaxOne(input, 'new');
    var od = incomeTaxOne(input, 'old');
    var cheaper = nw.totalTax <= od.totalTax ? 'new' : 'old';
    var saving = Math.abs(nw.totalTax - od.totalTax);
    var picked = (input.regime === 'old' || input.regime === 'new') ? (input.regime === 'old' ? od : nw) : (cheaper === 'new' ? nw : od);
    return {
      module: 'income_tax', fy: RULES.fy,
      result: picked, newRegime: nw, oldRegime: od,
      recommendedRegime: cheaper, savingByChoosing: round(saving),
      summary: 'Under the ' + cheaper + ' regime your tax is ₹' + round(cheaper === 'new' ? nw.totalTax : od.totalTax).toLocaleString('en-IN') +
        ' — that is ₹' + round(saving).toLocaleString('en-IN') + ' ' + (saving ? 'less than the other regime.' : '(both regimes are equal).'),
      confidence: 'high (deterministic slab math)',
      risks: ['Assumes the deductions you entered are actually eligible and proof is kept.',
        'Special-rate income (capital gains, lottery) is taxed separately — see Capital Gains.',
        'Verify with a CA before filing if income > ₹50L or you have foreign assets.'],
      sources: src()
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE 2b — Capital gains
  // input: { assetType:'equity'|'other', holdingMonths, gain }
  // ─────────────────────────────────────────────────────────────────────────
  function capitalGains(input) {
    var CG = RULES.capitalGains;
    var gain = n(input.gain), months = n(input.holdingMonths), type = input.assetType || 'equity';
    var longTerm, tax, exemptionUsed = 0, rateUsed, kind;
    if (type === 'equity') {
      longTerm = months > 12;
      if (longTerm) { kind = 'LTCG (equity)'; exemptionUsed = Math.min(gain, CG.equityLTCG.exemption); tax = Math.max(0, gain - exemptionUsed) * CG.equityLTCG.rate; rateUsed = CG.equityLTCG.rate; }
      else { kind = 'STCG (equity, 111A)'; tax = gain * CG.equitySTCG.rate; rateUsed = CG.equitySTCG.rate; }
    } else {
      longTerm = months > 24;
      if (longTerm) { kind = 'LTCG (other assets)'; tax = gain * CG.otherLTCG.rate; rateUsed = CG.otherLTCG.rate; }
      else { kind = 'STCG (other, at slab)'; tax = null; rateUsed = null; }
    }
    return {
      module: 'capital_gains', fy: RULES.fy, assetType: type, holdingMonths: months,
      classification: kind, longTerm: longTerm, gain: round(gain),
      exemptionUsed: round(exemptionUsed), rate: rateUsed,
      tax: tax == null ? null : round(tax),
      summary: tax == null
        ? kind + ' is added to your income and taxed at your slab rate — use the Income Tax module.'
        : kind + ' of ₹' + round(gain).toLocaleString('en-IN') + (exemptionUsed ? ' (₹' + round(exemptionUsed).toLocaleString('en-IN') + ' exempt)' : '') + ' → tax ₹' + round(tax).toLocaleString('en-IN') + '.',
      confidence: 'high (deterministic)',
      risks: ['Exemptions 54/54F/54EC can reduce this if you reinvest — ask a CA.',
        'Indexation rules changed on 23-Jul-2024; this uses the new 12.5% no-indexation method.'],
      sources: src()
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE 2c — Deduction finder (old regime guidance)
  // ─────────────────────────────────────────────────────────────────────────
  function deductionFinder(input) {
    var R = RULES.oldRegime, used = input.deductions || {}, tips = [];
    Object.keys(R.caps).forEach(function (k) {
      if (k.indexOf('_') > -1) return;
      var cap = R.caps[k]; if (cap === Infinity) return;
      var got = n(used[k]);
      if (got < cap) tips.push({ section: k, claimed: got, cap: cap, headroom: cap - got });
    });
    return {
      module: 'deduction_finder', fy: RULES.fy, regime: 'old',
      opportunities: tips,
      summary: tips.length ? 'You have unused deduction headroom in: ' + tips.map(function (t) { return t.section + ' (₹' + t.headroom.toLocaleString('en-IN') + ' left)'; }).join(', ') + '.'
        : 'You have used your common deduction limits.',
      confidence: 'medium (depends on your eligible investments/expenses)',
      risks: ['Only claim what you genuinely incurred and can prove.',
        'Deductions apply to the OLD regime; the new regime gives a higher standard deduction instead.'],
      sources: src()
    };
  }

  // Tax Health Score 0–100
  function taxHealthScore(input) {
    var it = incomeTax(input);
    var score = 70;
    if (input.regime && input.regime !== it.recommendedRegime) score -= 20; // on the costlier regime
    if (input.advanceTaxPaid) score += 10;
    if (input.proofsKept) score += 10;
    if (input.filedOnTime) score += 10;
    score = Math.max(0, Math.min(100, score));
    return { module: 'tax_health', score: score, band: score >= 80 ? 'healthy' : score >= 50 ? 'watch' : 'at-risk',
      recommendedRegime: it.recommendedRegime, top3: [
        input.regime && input.regime !== it.recommendedRegime ? 'Switch to the ' + it.recommendedRegime + ' regime (saves ₹' + it.savingByChoosing.toLocaleString('en-IN') + ').' : 'Confirm you are on the cheaper regime.',
        'Pay advance tax on schedule to avoid 234B/234C interest.',
        'Keep proof of every deduction you claim.'],
      confidence: 'medium', risks: ['Score is a guide, not a filing.'], sources: src() };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE 3 — GST
  // ─────────────────────────────────────────────────────────────────────────
  function gstTax(taxableValue, ratePct) {
    var t = n(taxableValue) * (n(ratePct) / 100);
    return { taxableValue: round(n(taxableValue)), rate: n(ratePct), tax: round(t), total: round(n(taxableValue) + t),
      cgst: round(t / 2), sgst: round(t / 2), module: 'gst_tax', sources: src() };
  }

  function gstRegistrationNeed(input) {
    var T = RULES.gst.regThreshold;
    var turnover = n(input.turnover), isGoods = input.supply !== 'services', special = !!input.specialCategoryState;
    var thr = isGoods ? (special ? T.goods_special : T.goods_normal) : (special ? T.services_special : T.services_normal);
    var need = turnover > thr || !!input.interState || !!input.ecommerce;
    return { module: 'gst_registration', mandatory: need, threshold: thr,
      summary: need ? 'GST registration looks MANDATORY (turnover above ₹' + thr.toLocaleString('en-IN') + (input.interState ? ', or inter-state supply' : '') + (input.ecommerce ? ', or e-commerce' : '') + ').'
        : 'GST registration is NOT mandatory yet (turnover below ₹' + thr.toLocaleString('en-IN') + '). Voluntary registration can still help claim ITC.',
      confidence: 'high', risks: ['Some supplies need registration regardless of turnover (inter-state, e-commerce, RCM).'], sources: src() };
  }

  function gstHealth(input) {
    var score = 100, issues = [];
    var claimed = n(input.itcClaimed), in2b = n(input.itc2B);
    var mismatch = claimed - in2b;
    if (mismatch > 0) { score -= 30; issues.push({ status: 'warning', text: 'You claimed ₹' + round(mismatch).toLocaleString('en-IN') + ' more ITC than appears in GSTR-2B — reverse or chase the supplier before GSTR-3B.' }); }
    if (input.gstr1Filed === false) { score -= 25; issues.push({ status: 'warning', text: 'GSTR-1 not filed — buyers cannot see your invoices and you risk late fees.' }); }
    if (input.gstr3bFiled === false) { score -= 25; issues.push({ status: 'warning', text: 'GSTR-3B not filed — interest @18% p.a. accrues on tax due.' }); }
    if (input.blockedItcClaimed) { score -= 15; issues.push({ status: 'warning', text: 'Blocked ITC (Sec 17(5)) claimed — must be reversed.' }); }
    score = Math.max(0, Math.min(100, score));
    return { module: 'gst_health', score: score, band: score >= 80 ? 'healthy' : score >= 50 ? 'watch' : 'at-risk',
      issues: issues.length ? issues : [{ status: 'ok', text: 'No GST red flags from the numbers entered.' }],
      itcMismatch: round(mismatch),
      summary: 'GST Health Score: ' + score + '/100 (' + (score >= 80 ? 'healthy' : score >= 50 ? 'watch' : 'at-risk') + '). ' + (issues.length ? issues.length + ' issue(s) to fix.' : 'No red flags.'),
      confidence: 'high', risks: ['A clean score is not a promise of "no notice" — keep records.'], sources: src() };
  }

  function itcAnalysis(input) {
    return { module: 'itc_analysis', blockedList: RULES.gst.blockedITC,
      summary: 'Input Tax Credit is blocked on: ' + RULES.gst.blockedITC.join('; ') + '. Everything else used for business is generally eligible if the supplier filed and it shows in 2B.',
      confidence: 'high', risks: ['ITC needs the supplier to have filed; match against GSTR-2B every month.'], sources: src() };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE 4 — Compliance calendar + penalty
  // ─────────────────────────────────────────────────────────────────────────
  function complianceCalendar(input) {
    input = input || {};
    var roles = input.roles || ['individual'];
    var items = RULES.dueDates.filter(function (d) {
      var w = d.who;
      if (roles.indexOf('company') > -1) return true;
      if (roles.indexOf('gst') > -1 && /GST/.test(d.task)) return true;
      if (roles.indexOf('employer') > -1 && /(TDS|PF|ESI)/.test(d.task)) return true;
      return w === 'taxpayer' || w === 'individual';
    });
    return { module: 'compliance_calendar', fy: RULES.fy, items: items,
      summary: items.length + ' recurring due dates apply to you. Chitti can remind you before each one.',
      confidence: 'high', risks: ['Dates shift if the government extends them — Chitti updates the rule table.'], sources: src() };
  }

  function penaltyEstimate(input) {
    var P = RULES.penalties, kind = input.kind, days = n(input.daysLate), amount = n(input.taxDue), est = 0, basis = '';
    if (kind === 'gstr') { est = Math.min(days * P.gstrLateFeePerDay, P.gstrLateFeeCap); basis = '₹' + P.gstrLateFeePerDay + '/day, capped ₹' + P.gstrLateFeeCap; }
    else if (kind === 'tds') { est = amount * P.tdsInterestMonthly * Math.ceil(days / 30); basis = '1.5%/month on tax'; }
    else if (kind === 'advance_tax') { est = amount * P.advanceTaxInterestMonthly * Math.ceil(days / 30); basis = '~1%/month (234B/234C)'; }
    else if (kind === 'itr') { est = amount > 500000 ? P.itrLateFee.above5L : P.itrLateFee.below5L; basis = '234F late fee'; }
    return { module: 'penalty', kind: kind, estimate: round(est), basis: basis,
      summary: 'Estimated penalty/interest if late: about ₹' + round(est).toLocaleString('en-IN') + ' (' + basis + ').',
      confidence: 'medium (estimate band)', risks: ['Actual penalty can vary; file before the date and this becomes ₹0 — Prevention > Penalty.'], sources: src() };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE 6 — Business Doctor
  // ─────────────────────────────────────────────────────────────────────────
  function businessDoctor(input) {
    var revenue = n(input.revenue), netProfit = n(input.netProfit), grossProfit = n(input.grossProfit);
    var currentAssets = n(input.currentAssets), currentLiab = n(input.currentLiabilities);
    var inventory = n(input.inventory), debt = n(input.debt), equity = n(input.equity);
    var netMargin = revenue ? netProfit / revenue : 0;
    var grossMargin = revenue ? (grossProfit || netProfit) / revenue : 0;
    var currentRatio = currentLiab ? currentAssets / currentLiab : null;
    var quickRatio = currentLiab ? (currentAssets - inventory) / currentLiab : null;
    var debtEquity = equity ? debt / equity : null;
    var wc = currentAssets - currentLiab;

    function clamp(x) { return Math.max(0, Math.min(100, round(x))); }
    var profScore = clamp(netMargin * 500);                       // 20% margin → 100
    var liqScore = currentRatio == null ? 50 : clamp((currentRatio / 2) * 100); // 2.0 → 100
    var wcScore = clamp((wc >= 0 ? 60 : 20) + (quickRatio ? quickRatio * 40 : 0));
    var health = clamp((profScore + liqScore + wcScore) / 3);

    var growth = [], cuts = [];
    if (netMargin < 0.05) cuts.push('Net margin is thin (<5%) — review pricing and your biggest cost line.');
    if (currentRatio != null && currentRatio < 1) cuts.push('Current ratio < 1 — short-term bills exceed liquid assets; protect cash.');
    if (debtEquity != null && debtEquity > 2) cuts.push('Debt is high vs equity (>2) — refinance or reduce before new loans.');
    if (netMargin >= 0.1) growth.push('Healthy margin — reinvest in your best-selling line.');
    growth.push('Check Government Benefits — there may be a subsidy/credit you qualify for (₹0 cost).');

    return { module: 'business_doctor',
      profitabilityScore: profScore, liquidityScore: liqScore, workingCapitalScore: wcScore, businessHealthScore: health,
      netMargin: +(netMargin * 100).toFixed(1), grossMargin: +(grossMargin * 100).toFixed(1),
      currentRatio: currentRatio == null ? null : +currentRatio.toFixed(2),
      quickRatio: quickRatio == null ? null : +quickRatio.toFixed(2),
      debtEquity: debtEquity == null ? null : +debtEquity.toFixed(2), workingCapital: round(wc),
      growthOpportunities: growth, costReductionAreas: cuts,
      summary: 'Business Health: ' + health + '/100. Profitability ' + profScore + ', Liquidity ' + liqScore + ', Working capital ' + wcScore + '.',
      confidence: 'high (from the figures you entered)', risks: ['Scores reflect only the numbers entered — a CA review adds context.'], sources: src() };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE 7 — Government Benefits + Scheme Opportunity (THE MOAT)
  // profile: { state, industry, turnover, employees, type, entityAgeYears, exporter }
  // ─────────────────────────────────────────────────────────────────────────
  function govtBenefits(profile) {
    profile = profile || {};
    var matched = SCHEMES.filter(function (s) { try { return s.elig(profile); } catch (e) { return false; } })
      .map(function (s) { return { id: s.id, name: s.name, who: s.who, impact: s.impact, band: s.band, note: s.note || null }; });
    return { module: 'govt_benefits', profile: profile, schemes: matched, count: matched.length,
      summary: matched.length ? 'You may be eligible for ' + matched.length + ' scheme(s): ' + matched.map(function (m) { return m.name; }).join(', ') + '.'
        : 'No scheme matched the details given — add your state, industry and turnover for a better match.',
      confidence: 'medium (eligibility heuristic — apply on the official portal to confirm)',
      risks: ['Eligibility is indicative — final approval is the government’s decision. No guarantee of approval.',
        'Chitti shows you the door; it never applies or signs on your behalf.'],
      sources: src().concat(['MyScheme.gov.in / Udyam / state industrial policy (verify on portal)']) };
  }

  function schemeOpportunity(profile) {
    var gb = govtBenefits(profile);
    var lo = 0, hi = 0;
    gb.schemes.forEach(function (s) { if (s.band) { lo += s.band[0]; hi += s.band[1]; } });
    return { module: 'scheme_opportunity', schemes: gb.schemes, count: gb.count,
      potentialMin: lo, potentialMax: hi,
      summary: gb.count ? 'You could be leaving roughly ₹' + lo.toLocaleString('en-IN') + '–₹' + hi.toLocaleString('en-IN') + ' on the table by not claiming ' + gb.count + ' scheme(s).'
        : 'Add your business details to see the money you might be missing.',
      confidence: 'low-medium (indicative impact band)', risks: gb.risks, sources: gb.sources };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE 9 — Fraud Shield
  // ─────────────────────────────────────────────────────────────────────────
  var GST_CODE = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function gstinChecksum(first14) {
    var factor = 2, sum = 0, mod = GST_CODE.length, cp, digit, i;
    for (i = first14.length - 1; i >= 0; i--) {
      cp = GST_CODE.indexOf(first14[i]); if (cp < 0) return null;
      digit = factor * cp; digit = Math.floor(digit / mod) + (digit % mod); sum += digit;
      factor = (factor === 2) ? 1 : 2;
    }
    return GST_CODE[(mod - (sum % mod)) % mod];
  }
  function validateGSTIN(gstin) {
    if (!gstin || typeof gstin !== 'string') return { valid: false, reason: 'empty' };
    gstin = gstin.toUpperCase().replace(/\s/g, '');
    if (gstin.length !== 15) return { valid: false, reason: 'GSTIN must be 15 characters (got ' + gstin.length + ')' };
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) return { valid: false, reason: 'GSTIN format is wrong' };
    var expect = gstinChecksum(gstin.slice(0, 14));
    if (expect !== gstin[14]) return { valid: false, reason: 'Checksum failed — this GSTIN is likely FAKE' };
    return { valid: true, reason: 'Format + checksum OK (still confirm the name on the GST portal)' };
  }

  function fraudShield(input) {
    input = input || {};
    var flags = [];
    if (input.gstin) {
      var g = validateGSTIN(input.gstin);
      flags.push({ check: 'GSTIN', status: g.valid ? 'ok' : 'warning', text: g.reason });
    }
    if (input.invoices && input.invoices.length) {
      var seen = {};
      input.invoices.forEach(function (inv) {
        var key = (inv.no || '') + '|' + (inv.vendor || '') + '|' + n(inv.amount);
        if (seen[key]) flags.push({ check: 'duplicate', status: 'warning', text: 'Duplicate invoice ' + inv.no + ' from ' + inv.vendor + ' for ₹' + n(inv.amount).toLocaleString('en-IN') + '.' });
        seen[key] = true;
      });
    }
    if (input.lineRate != null && input.marketRate != null && n(input.lineRate) > n(input.marketRate) * (input.overbillFactor || 1.5)) {
      flags.push({ check: 'overbilling', status: 'warning', text: 'Rate ₹' + n(input.lineRate).toLocaleString('en-IN') + ' is well above market ₹' + n(input.marketRate).toLocaleString('en-IN') + ' — possible overbilling.' });
    }
    if (input.vendorNew && n(input.amount) >= 100000 && !input.gstin) {
      flags.push({ check: 'vendor_risk', status: 'warning', text: 'New vendor, high value, no GSTIN — verify before paying.' });
    }
    return { module: 'fraud_shield', flags: flags.length ? flags : [{ check: 'all', status: 'ok', text: 'No fraud signals from what was provided.' }],
      summary: flags.filter(function (f) { return f.status === 'warning'; }).length + ' warning(s) found.',
      confidence: 'medium (heuristic — verify before accusing anyone)',
      risks: ['A flag is a reason to VERIFY, never a proof of fraud. Confirm on the GST portal / with the vendor.'], sources: src() };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE 10 — CFO Dashboard (from twin/typed figures)
  // ─────────────────────────────────────────────────────────────────────────
  function cfoDashboard(input) {
    var bd = businessDoctor(input);
    var taxExposure = input.estTax != null ? n(input.estTax) : round(n(input.netProfit) * 0.25);
    return { module: 'cfo_dashboard',
      revenue: round(n(input.revenue)), profit: round(n(input.netProfit)),
      cashFlow: round(n(input.operatingCashFlow != null ? input.operatingCashFlow : (n(input.netProfit)))),
      taxExposure: taxExposure, complianceScore: n(input.complianceScore != null ? input.complianceScore : 80),
      businessHealth: bd.businessHealthScore, growthScore: bd.profitabilityScore,
      summary: 'Revenue ₹' + round(n(input.revenue)).toLocaleString('en-IN') + ' · Profit ₹' + round(n(input.netProfit)).toLocaleString('en-IN') + ' · Health ' + bd.businessHealthScore + '/100 · Est. tax exposure ₹' + taxExposure.toLocaleString('en-IN') + '.',
      confidence: 'medium', risks: ['Tax exposure is a 25% rule-of-thumb on profit — use the Tax module for a real figure.'], sources: src() };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODULE 11 — Financial Twin (on-device)
  // ─────────────────────────────────────────────────────────────────────────
  var TWIN_KEY = 'chitti_ca_os_twin_v1';
  function twinLoad() {
    try { return JSON.parse((root.localStorage && root.localStorage.getItem(TWIN_KEY)) || '{}'); } catch (e) { return {}; }
  }
  function twinSave(obj) {
    try { if (root.localStorage) root.localStorage.setItem(TWIN_KEY, JSON.stringify(obj || {})); return true; } catch (e) { return false; }
  }
  function twinSet(key, value) { var t = twinLoad(); t[key] = value; t._updated = '' + (root.Date ? '' : ''); twinSave(t); return t; }
  function twinForget() { try { if (root.localStorage) root.localStorage.removeItem(TWIN_KEY); } catch (e) {} return {}; }

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────
  var API = {
    RULES: RULES, SCHEMES: SCHEMES,
    incomeTax: incomeTax, incomeTaxOne: incomeTaxOne, capitalGains: capitalGains,
    deductionFinder: deductionFinder, taxHealthScore: taxHealthScore,
    gstTax: gstTax, gstRegistrationNeed: gstRegistrationNeed, gstHealth: gstHealth, itcAnalysis: itcAnalysis,
    complianceCalendar: complianceCalendar, penaltyEstimate: penaltyEstimate,
    businessDoctor: businessDoctor, govtBenefits: govtBenefits, schemeOpportunity: schemeOpportunity,
    validateGSTIN: validateGSTIN, gstinChecksum: gstinChecksum, fraudShield: fraudShield,
    cfoDashboard: cfoDashboard,
    twin: { load: twinLoad, save: twinSave, set: twinSet, forget: twinForget, KEY: TWIN_KEY }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.ChittiCAOS = API;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
