/* chitti_paisa_engine.js — Chitti Paisa · deterministic household-money engine.
 * 🎖️ Chitti Paisa — Household Money Guardian. Trust > Virality.
 *
 * Rules are the product; no LLM, no API key, works offline. Every function is pure + Node-testable.
 * Doctrine: NEVER move money, NEVER promise returns; advise + protect + explain, in any language.
 * UMD: window.ChittiPaisa in the browser; module.exports in Node (for tests).
 */
(function (root) {
  'use strict';
  function round2(n) { return Math.round((+n + Number.EPSILON) * 100) / 100; }
  function r2(n) { return round2(n); }

  // ─────────── Loans: EMI + predatory "loan trap" detector ───────────
  function emi(principal, annualRatePct, months) {
    var P = +principal || 0, r = (+annualRatePct || 0) / 12 / 100, n = +months || 1;
    var e = r === 0 ? P / n : P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    var total = e * n;
    return { emi: r2(e), totalPay: r2(total), totalInterest: r2(total - P), principal: P, months: n, annualRatePct: +annualRatePct || 0 };
  }
  // offer: {principal, annualRatePct, months, processingFeePct?, prepayPenaltyPct?, source?}
  function loanTrap(offer) {
    offer = offer || {}; var flags = [], apr = +offer.annualRatePct || 0;
    if (apr >= 36) flags.push({ sev: 'high', msg: 'Interest ' + apr + '% a year is predatory (over 36%). A bank personal loan is about 11-16%.' });
    else if (apr >= 24) flags.push({ sev: 'med', msg: 'Interest ' + apr + '% a year is very high — compare a bank or co-operative loan first.' });
    if ((+offer.processingFeePct || 0) >= 3) flags.push({ sev: 'med', msg: 'Processing fee ' + offer.processingFeePct + '% is high.' });
    if ((+offer.prepayPenaltyPct || 0) > 0) flags.push({ sev: 'med', msg: 'Prepayment penalty ' + offer.prepayPenaltyPct + '% — you are charged for repaying early.' });
    if (/whatsapp|telegram|instant.{0,8}(loan|cash)|5 ?min|no.{0,4}(document|kyc)|aadhaar.{0,6}(photo|selfie)/i.test(offer.source || ''))
      flags.push({ sev: 'high', msg: 'Instant / no-document loans via chat apps are often fraud or loan-shark traps.' });
    var verdict = flags.some(function (f) { return f.sev === 'high'; }) ? 'AVOID' : (flags.length ? 'CAUTION' : 'OK');
    return { verdict: verdict, flags: flags, emi: emi(offer.principal || 0, apr, offer.months || 12) };
  }

  // ─────────── Budget: 50-30-20 + "can I afford this?" ───────────
  function budget(income) { var i = +income || 0; return { income: i, needs: r2(i * 0.5), wants: r2(i * 0.3), savings: r2(i * 0.2) }; }
  function canAfford(income, monthlyExpenses, monthlyEmiNow, newMonthlyCost) {
    var inc = +income || 0, free = inc - (+monthlyExpenses || 0) - (+monthlyEmiNow || 0);
    var emiRatio = inc ? ((+monthlyEmiNow || 0) + (+newMonthlyCost || 0)) / inc : 1;
    var ok = (+newMonthlyCost || 0) <= free * 0.7 && emiRatio <= 0.4;
    return { affordable: ok, freeCash: r2(free), emiToIncomePct: r2(emiRatio * 100),
      reason: ok ? 'Fits within a safe budget and leaves an emergency buffer.'
        : (emiRatio > 0.4 ? 'Your total EMIs would exceed 40% of your income — that is risky.' : 'It leaves too little buffer for emergencies.') };
  }

  // ─────────── Savings: SIP/RD future value + monthly needed for a goal ───────────
  function sipFuture(monthly, annualRatePct, months) {
    var m = +monthly || 0, r = (+annualRatePct || 0) / 12 / 100, n = +months || 1;
    var fv = r === 0 ? m * n : m * ((Math.pow(1 + r, n) - 1) / r) * (1 + r), invested = m * n;
    return { futureValue: r2(fv), invested: r2(invested), gain: r2(fv - invested), monthly: m, months: n, annualRatePct: +annualRatePct || 0 };
  }
  function goalMonthly(target, annualRatePct, months) {
    var T = +target || 0, r = (+annualRatePct || 0) / 12 / 100, n = +months || 1;
    var mth = r === 0 ? T / n : T * r / ((Math.pow(1 + r, n) - 1) * (1 + r));
    return { monthlyNeeded: r2(mth), target: T, months: n, annualRatePct: +annualRatePct || 0 };
  }

  // ─────────── Scam-shield: rule-based UPI/SMS fraud detection (deterministic) ───────────
  var SCAM_RULES = [
    { re: /\b(otp|one.?time.?password|cvv|pin number|atm pin)\b/i, sev: 'high', why: 'Asks for OTP / PIN / CVV — NEVER share these. No real bank ever asks.' },
    { re: /\b(kyc|account|card).{0,24}(expir|block|suspend|deactiv|update now)/i, sev: 'high', why: '"KYC expired / account blocked — update now" is a classic phishing trap.' },
    { re: /\b(lottery|prize|lucky draw|you ?(have)? ?won|reward).{0,24}(crore|lakh|claim|winner)/i, sev: 'high', why: 'A lottery / prize you never entered = scam.' },
    { re: /\b(refund|cashback|gift).{0,20}(click|link|claim|verify|process)/i, sev: 'high', why: 'A fake refund asking you to click / verify = scam.' },
    { re: /\b(send|transfer|pay|deposit).{0,24}(verify|confirm|activate|unlock|release)/i, sev: 'high', why: 'Asking you to PAY to "verify / activate" = scam. Verifying never costs money.' },
    { re: /\b(electricity|gas|bill).{0,20}(disconnect|cut|tonight|today)/i, sev: 'high', why: '"Pay now or power cut tonight" urgency = scam.' },
    { re: /(bit\.ly|tinyurl|t\.me|http:\/\/|https:\/\/)\S+/i, sev: 'med', why: 'Contains a link — do not tap unknown links.' },
    { re: /\b(urgent|immediately|act now|within \d+ ?(min|minute|hour))\b/i, sev: 'med', why: 'Manufactured urgency pressures you to act without thinking.' },
    { re: /\b(army|customer ?care|helpline).{0,16}(number|call)/i, sev: 'med', why: 'Fake "customer care" numbers are a common OLX/UPI scam.' },
  ];
  function scamScan(text) {
    text = String(text || ''); var hits = [];
    SCAM_RULES.forEach(function (rule) { if (rule.re.test(text)) hits.push({ sev: rule.sev, why: rule.why }); });
    var high = hits.filter(function (h) { return h.sev === 'high'; }).length;
    var verdict = high >= 1 ? 'DANGER' : (hits.length >= 2 ? 'SUSPICIOUS' : (hits.length ? 'CAUTION' : 'LOOKS OK'));
    return { verdict: verdict, score: Math.min(100, high * 40 + hits.length * 10), reasons: hits,
      advice: verdict === 'LOOKS OK' ? 'No obvious scam signs — but still never share your OTP or PIN.' : 'Do NOT click links, share OTP/PIN, or pay anything. Call your bank on the number printed on your card.' };
  }

  // ─────────── Government money: deterministic scheme eligibility (refreshable table) ───────────
  // profile: {age, monthlyIncome, occupation('farmer'|'worker'|'unorganised'|'salaried'|...), gender('f'|'m'),
  //           bpl(bool), hasGirlChildUnder10(bool), hasBankAccount(bool)}
  var SCHEMES = [
    { id: 'PMJDY', name: 'Jan Dhan zero-balance bank account', why: 'A free bank account with no minimum balance + accident cover.', test: function (p) { return !p.hasBankAccount; } },
    { id: 'PM-KISAN', name: 'PM-KISAN ₹6,000/year for farmers', why: '₹6,000 a year in 3 instalments for land-holding farmer families.', test: function (p) { return p.occupation === 'farmer'; } },
    { id: 'PMJJBY', name: 'Life cover ₹2 lakh @ ₹436/year', why: 'Term life insurance ₹2 lakh for just ₹436 a year (age 18-50).', test: function (p) { return p.age >= 18 && p.age <= 50; } },
    { id: 'PMSBY', name: 'Accident cover ₹2 lakh @ ₹20/year', why: 'Accident insurance ₹2 lakh for ₹20 a year (age 18-70).', test: function (p) { return p.age >= 18 && p.age <= 70; } },
    { id: 'APY', name: 'Atal Pension Yojana (guaranteed pension)', why: 'A government pension of ₹1,000-₹5,000/month after 60 for unorganised workers (join 18-40).', test: function (p) { return p.age >= 18 && p.age <= 40 && p.occupation !== 'salaried'; } },
    { id: 'SSY', name: 'Sukanya Samriddhi (girl-child savings)', why: 'High-interest tax-free savings for a girl child under 10.', test: function (p) { return !!p.hasGirlChildUnder10; } },
    { id: 'NSAP-OAP', name: 'Old-age pension (NSAP)', why: 'Monthly pension for BPL senior citizens (60+).', test: function (p) { return p.age >= 60 && p.bpl; } },
    { id: 'PDS', name: 'Ration card (subsidised food grain)', why: 'Subsidised wheat/rice through the public distribution system for low-income families.', test: function (p) { return p.bpl; } },
    { id: 'UJJWALA', name: 'Ujjwala free LPG connection', why: 'A free cooking-gas connection for women in BPL households.', test: function (p) { return p.bpl && p.gender === 'f'; } },
    { id: 'EShram', name: 'e-Shram card (unorganised workers)', why: 'A national ID + ₹2 lakh accident cover for unorganised workers.', test: function (p) { return p.occupation === 'worker' || p.occupation === 'unorganised'; } },
  ];
  function schemes(profile) {
    profile = profile || {};
    var eligible = SCHEMES.filter(function (s) { try { return s.test(profile); } catch (e) { return false; } })
      .map(function (s) { return { id: s.id, name: s.name, why: s.why }; });
    return { eligible: eligible, count: eligible.length, checked: SCHEMES.length };
  }

  // honest guardrail — block fabricated certainty in any generated string
  var BANNED = ['guaranteed return', 'guaranteed profit', 'double your money', 'risk-free returns', 'sure-shot', '100% safe investment'];
  function hasBannedPhrase(s) { s = String(s || '').toLowerCase(); for (var i = 0; i < BANNED.length; i++) if (s.indexOf(BANNED[i]) >= 0) return BANNED[i]; return null; }

  var API = { emi: emi, loanTrap: loanTrap, budget: budget, canAfford: canAfford, sipFuture: sipFuture, goalMonthly: goalMonthly, scamScan: scamScan, schemes: schemes, SCHEMES: SCHEMES, hasBannedPhrase: hasBannedPhrase, round2: round2, VERSION: '0.1.0' };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.ChittiPaisa = API;
})(typeof window !== 'undefined' ? window : null);
