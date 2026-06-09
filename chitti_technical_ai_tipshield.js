/* chitti_technical_ai_tipshield.js
 * 🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.
 *
 * THE MOAT: the worried user pastes a WhatsApp/Telegram "stock tip" and Chitti checks it
 * for scam patterns — deterministically, no LLM, in English + Hindi. It NEVER amplifies a
 * tip and NEVER says "buy". It says: "this looks like a scam — Chitti is not telling you
 * to buy." Runs in the browser (window.ChittiTipShield) AND in Node (module.exports) so the
 * rules are unit-testable. Pairs with SEBI's reality: most tips are pump-and-dump or
 * unregistered-advisor traps aimed at exactly the vulnerable users we serve.
 *
 * check(text) → { risk:'HIGH'|'MEDIUM'|'LOW', score, flags:[{rule,why,evidence}], verdict, spoken }
 */
(function (root) {
  'use strict';

  // each rule: weight + regex(es). Tuned so a single strong red flag → HIGH; a couple of soft → MEDIUM.
  var RULES = [
    { rule: 'guaranteed_returns', weight: 4, why: 'No one can guarantee stock returns. SEBI bars it.',
      re: [/\bguarantee/i, /\bguaranteed\b/i, /100\s*%\s*(profit|return|sure)/i, /sure[\s-]*shot/i, /\bconfirm(ed)?\s*(profit|tip|target)/i, /पक्का\s*(मुनाफ़ा|profit|tip)/i, /गारंटी/i] },
    { rule: 'doubling_money', weight: 4, why: 'Promises to double/triple money fast are the classic pump bait.',
      re: [/\bdouble\b.*\bmoney\b/i, /money\s*double/i, /2x\b|3x\b|5x\b|10x\b/i, /paisa\s*double/i, /पैसा\s*डबल/i, /\bmultibagger\b.*\b(guarantee|sure|confirm)/i] },
    { rule: 'urgency_pressure', weight: 3, why: 'Real analysis is never "buy in the next 5 minutes". Urgency is a scam lever.',
      re: [/buy\s*(now|today|immediately|fast|right now)/i, /last\s*chance/i, /limited\s*(time|seats|slots)/i, /hurry/i, /before\s*(market|it'?s too late)/i, /abhi\s*kharido/i, /जल्दी\s*(खरीदो|करो)/i, /turant\s*kharido/i] },
    { rule: 'unregistered_advisor', weight: 3, why: 'Tips from Telegram/WhatsApp groups are usually NOT SEBI-registered advisors.',
      re: [/telegram/i, /whatsapp\s*group/i, /join\s*(my|our|the)\s*(group|channel)/i, /paid\s*(group|tips|membership)/i, /\bvip\s*(group|call|tips)/i, /dm\s*for\s*tips/i, /गुप्त\s*tip/i] },
    { rule: 'insider_pump', weight: 4, why: 'Claims of "insider"/"operator" news are illegal pump-and-dump signals.',
      re: [/\binsider\b/i, /\boperator\b.*\b(buy|news|lock)/i, /upper\s*circuit\s*(lock|guarantee)/i, /\bpump\b/i, /\bjackpot\b/i, /breaking\s*news.*buy/i, /news\s*aayegi/i] },
    { rule: 'pay_to_earn', weight: 3, why: 'Asking for a fee/UPI to "unlock" tips is a payment scam.',
      re: [/pay\s*(₹|rs|inr|\d)/i, /upi\s*(id|to|pe)/i, /membership\s*fee/i, /subscribe.*tips/i, /fees?\s*(do|bhejo|send)/i, /₹\s*\d+\s*(only|month|tip)/i] },
    { rule: 'no_risk_claim', weight: 4, why: 'Every trade has risk. "No risk / no stop-loss needed" is a lie.',
      re: [/no\s*risk/i, /risk[\s-]*free/i, /no\s*(stop[\s-]*loss|sl)\s*(needed|required)/i, /can'?t\s*lose/i, /cannot\s*lose/i, /loss\s*nahi\s*hoga/i] },
    { rule: 'target_no_reason', weight: 2, why: 'A target price with no chart/level/reason is a guess dressed as a call.',
      re: [/target\s*(₹|rs|\d)/i, /\btarget\s*\d/i, /\bbuy\b.*\btarget\b/i, /sl\s*\d.*target\s*\d/i] },
    { rule: 'celebrity_authority', weight: 2, why: 'Fake "as seen on"/big-name endorsements manufacture false trust.',
      re: [/sebi\s*(approved|registered)\s*(tip|call)/i, /as\s*seen\s*on/i, /(big bull|rakesh|warren)\s*(pick|tip|buy)/i] }
  ];

  function check(text) {
    var t = String(text || '');
    if (!t.trim()) return { risk: 'LOW', score: 0, flags: [], verdict: 'Nothing to check — paste the message you received.', spoken: 'Paste the tip you received and I will check it for scam patterns.' };
    var flags = [], score = 0;
    RULES.forEach(function (r) {
      for (var i = 0; i < r.re.length; i++) {
        var m = t.match(r.re[i]);
        if (m) { flags.push({ rule: r.rule, why: r.why, evidence: (m[0] || '').slice(0, 40) }); score += r.weight; break; }
      }
    });
    var risk = score >= 4 ? 'HIGH' : (score >= 2 ? 'MEDIUM' : 'LOW');
    var verdict, spoken;
    if (risk === 'HIGH') {
      verdict = '🚩 This looks like a SCAM. ' + flags.length + ' red flag' + (flags.length > 1 ? 's' : '') + ' found. Chitti is NOT telling you to buy. Do not pay anyone, do not act on this.';
      spoken = 'Careful. This message looks like a scam. I found ' + flags.length + ' warning signs. I am not telling you to buy. Please do not pay anyone or act on this tip.';
    } else if (risk === 'MEDIUM') {
      verdict = '⚠️ Be careful — this has scam-like signs. Treat any "tip" as risky. Chitti is not telling you to buy; check the chart yourself or ask a SEBI-registered advisor.';
      spoken = 'Be careful. This message has some scam-like signs. Do not act on a tip alone. I am not telling you to buy.';
    } else {
      verdict = '✅ No strong scam patterns found — but remember: a tip is still not advice. Most short-term traders lose money. Decide for yourself, with a stop-loss.';
      spoken = 'I did not find strong scam patterns. But a tip is still not advice, and most short-term traders lose money. Decide for yourself.';
    }
    verdict += ' (NOT SEBI REGISTERED — educational.)';
    return { risk: risk, score: score, flags: flags, verdict: verdict, spoken: spoken };
  }

  var API = { check: check, RULES: RULES };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.ChittiTipShield = API;
})(typeof window !== 'undefined' ? window : this);
