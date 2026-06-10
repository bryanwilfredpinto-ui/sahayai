/* test_sop_gaps.cjs — deterministic proof for SOP 1 (Volume), SOP 5 (Primary/Alt/Invalidation),
 * SOP 8 (Journal reflection). Run: node tools/test_sop_gaps.cjs
 */
const path = require('path');
const T = require(path.join(__dirname, '..', 'chitti_technical_engine.js'));
let pass = 0, fail = 0; const fails = [];
const ok = (n, c) => { if (c) pass++; else { fail++; fails.push(n); console.log('  ✗ ' + n); } };

function byTfWith(dailyVolLast) {
  const daily = T.genCandles('SOP', 'daily', 260);
  if (dailyVolLast != null) daily[daily.length - 1].volume = dailyVolLast;
  return { monthly: T.genCandles('SOP', 'monthly', 24), weekly: T.genCandles('SOP', 'weekly', 60), daily: daily };
}

// ---------- SOP 1 — Volume is mandatory + reduces confidence ----------
const sigLow = T.generateSignal(byTfWith(1), { mode: 'longterm' });           // tiny last-bar volume
ok('SOP1: signal carries a volume object', sigLow.volume && typeof sigLow.volume.note === 'string');
ok('SOP1: volume_confirmed flag present', 'volume_confirmed' in sigLow);
ok('SOP1: tiny volume → NOT confirmed', sigLow.volume_confirmed === false);
ok('SOP1: absent volume confirmation REDUCES confidence', sigLow.confidence < sigLow.confidence_before_volume);
console.log('  volume(low): ' + sigLow.confidence_before_volume + '% → ' + sigLow.confidence + '% · ' + sigLow.volume.note.slice(0, 50));

const sigHi = T.generateSignal(byTfWith(999999999), { mode: 'longterm' });     // huge last-bar volume
ok('SOP1: huge volume → CONFIRMED', sigHi.volume_confirmed === true);
ok('SOP1: confirmed volume → NO confidence cut', sigHi.confidence === sigHi.confidence_before_volume);

// ---------- SOP 5 — Primary view · Alternative view · Invalidation on EVERY verdict ----------
['longterm', 'swing', 'daytrader'].forEach(function (mode) {
  const s = T.generateSignal(byTfWith(), { mode: mode });
  ok('SOP5[' + mode + ']: has views.primary', s.views && s.views.primary && s.views.primary.length > 10);
  ok('SOP5[' + mode + ']: has views.alternative', s.views && s.views.alternative && s.views.alternative.length > 10);
  ok('SOP5[' + mode + ']: has views.invalidation', s.views && s.views.invalidation && s.views.invalidation.length > 10);
  const cv = T.chittiVerdict(s);
  ok('SOP5[' + mode + ']: chittiVerdict exposes views', cv.views && cv.views.primary === s.views.primary);
  ok('SOP5[' + mode + ']: spoken includes the Alternative view', /Alternative view/.test(cv.spoken));
});
const sBuy = T.generateSignal(byTfWith(), { mode: 'longterm' });
console.log('  views.invalidation: ' + sBuy.views.invalidation.slice(0, 70));

// ---------- SOP 8 — Journal captures Lesson · Mistake Category · Emotional State · Improvement ----------
global.window = { localStorage: { _d: {}, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = v; }, removeItem(k) { delete this._d[k]; } } };
global.window.TechEngine = T;
require(path.join(__dirname, '..', 'chitti_technical_ai_journal.js'));
const J = global.window.ChittiTechJournal;
ok('SOP8: Mistake categories defined', Array.isArray(J.MISTAKE_CATEGORIES) && J.MISTAKE_CATEGORIES.length >= 8);
ok('SOP8: Emotional states defined', Array.isArray(J.EMOTIONS) && J.EMOTIONS.length >= 6);
const tid = J.logPaperTrade({ symbol: 'TCS', side: 'BUY', entry: 100, quantity: 10, stop: 95, emotion: 'FOMO' });
ok('SOP8: paper trade stores entry emotion', J.trades()[0].emotion === 'FOMO');
J.reflect(tid, { lesson: 'Wait for volume', mistake_category: 'No volume confirmation', emotion: 'FOMO', improvement: 'Check 20-bar volume first' });
const tr = J.trades().filter(t => t.trade_id === tid)[0];
ok('SOP8: Lesson Learned stored', tr.lesson === 'Wait for volume');
ok('SOP8: Mistake Category stored', tr.mistake_category === 'No volume confirmation');
ok('SOP8: Emotional State stored', tr.emotion === 'FOMO');
ok('SOP8: Improvement Action stored', tr.improvement === 'Check 20-bar volume first');
ok('SOP8: reflected_at timestamp set', !!tr.reflected_at);
ok('SOP8: mistakeSummary aggregates repeats', J.mistakeSummary().some(m => m.category === 'No volume confirmation' && m.count === 1));
// close-with-reflection path
const tid2 = J.logPaperTrade({ symbol: 'INFY', side: 'SELL', entry: 200, quantity: 5, stop: 210 });
J.closePaperTrade(tid2, 190, 'TARGET', { lesson: 'Trailed well', mistake_category: 'None — followed the plan', emotion: 'Calm / disciplined', improvement: 'Repeat this' });
const tr2 = J.trades().filter(t => t.trade_id === tid2)[0];
ok('SOP8: closePaperTrade can capture reflection', tr2.status === 'CLOSED' && tr2.lesson === 'Trailed well' && tr2.emotion === 'Calm / disciplined');

console.log('\n' + (fail === 0 ? '✅' : '❌') + ' test_sop_gaps: ' + pass + ' passed, ' + fail + ' failed.' + (fails.length ? '\nFailures: ' + fails.join(' · ') : ''));
process.exit(fail === 0 ? 0 : 1);
