/* test_technicals.cjs — deterministic smoke + gold test for Chitti Technicals.
 * Tests the REUSED engine + the new Tip Shield (browser-agnostic CJS paths).
 * Audio/app/data rendering need a browser → covered by the Playwright cert (BO11).
 * Run: node tools/test_technicals.cjs
 */
const path = require('path');
const T = require(path.join(__dirname, '..', 'chitti_technical_engine.js'));
const TS = require(path.join(__dirname, '..', 'chitti_technical_ai_tipshield.js'));

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; } else { fail++; console.log('  ✗ FAIL: ' + name); } }

console.log('— ENGINE —');
ok('engine loads (v' + T.VERSION + ')', T && T.VERSION === '2.8.0');
ok('39 indicator names', Array.isArray(T.INDICATOR_NAMES) && T.INDICATOR_NAMES.length === 39);

['RELIANCE', 'TCS', 'SUZLON', 'HDFCBANK', 'ITC'].forEach(function (sym) {
  const tfs = T.genAllTf(sym);
  const sig = T.generateSignal(tfs, { mode: 'longterm', capital: 100000, riskPercent: 2 });
  ok(sym + ': verdict valid', ['BUY', 'SELL', 'HOLD'].indexOf(sig.signal) >= 0);
  ok(sym + ': carries NOT-SEBI disclaimer', /NOT SEBI REGISTERED/.test(sig.disclaimer || ''));
  ok(sym + ': confidence 0-100', sig.confidence >= 0 && sig.confidence <= 100);
  if (sig.signal === 'BUY' || sig.signal === 'SELL') {
    ok(sym + ': NO stop → NO signal (stop present)', sig.stop_loss && sig.stop_loss.price != null);
    ok(sym + ': entry + targets present', sig.entry_price != null && sig.target_1 && sig.target_1.price != null);
    ok(sym + ': position size computed', sig.position_size && sig.position_size.shares >= 0);
  }
  const cv = T.chittiVerdict(sig);
  ok(sym + ': chittiVerdict decision valid', ['BUY', 'SELL', 'WAIT'].indexOf(cv.decision) >= 0);
  ok(sym + ': spoken carries honesty rail', /not advice|not SEBI/i.test(cv.spoken));
  ok(sym + ': spoken has NO banned certainty phrase', !T.hasBannedPhrase(cv.spoken));
});

ok('banned-phrase guard catches "guaranteed profit"', !!T.hasBannedPhrase('this is a guaranteed profit'));
ok('Roshan returns a signal', ['BUY', 'SELL', 'WAIT'].indexOf(T.roshan(T.genCandles('TCS', 'daily', 120).map(c => c.close)).signal) >= 0);

console.log('— SAFETY (deterministic, no LLM) —');
ok('crisis detected', T.detectCrisis('I want to die') === true);
ok('crisis routes to Tele-MANAS 14416', T.crisisResponse().number === '14416');
ok('benign text is not a crisis', T.detectCrisis('should I buy reliance') === false);

console.log('— TIP SHIELD (anti-scam moat) —');
const scam = TS.check('Buy XYZ NOW! guaranteed double your money in 2 days, sure-shot tip, no risk, join our VIP telegram, pay ₹999');
ok('scam tip → HIGH risk', scam.risk === 'HIGH');
ok('scam tip → multiple red flags', scam.flags.length >= 3);
ok('scam tip NEVER says buy', !/\bi (would |)recommend (you |)buy/i.test(scam.verdict) && /not telling you to buy/i.test(scam.verdict));
const benign = TS.check('Reliance is trading above its 200-day moving average and RSI is near 55.');
ok('benign text → LOW risk (no false positive)', benign.risk === 'LOW');
const medium = TS.check('Target 1500 buy now before market opens');
ok('soft pressure → MEDIUM or HIGH', ['MEDIUM', 'HIGH'].indexOf(medium.risk) >= 0);
ok('empty tip → safe prompt', TS.check('').risk === 'LOW');

console.log('\n' + (fail === 0 ? '✅' : '❌') + ' Chitti Technicals deterministic tests: ' + pass + ' passed, ' + fail + ' failed.');
process.exit(fail === 0 ? 0 : 1);
