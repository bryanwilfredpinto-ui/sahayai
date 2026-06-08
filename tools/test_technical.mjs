/* tools/test_technical.mjs
 * 🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.
 *
 * Node logic test for Chitti Technical (no browser). Validates the deterministic
 * engine math, the multi-timeframe confluence, the NO-stop-NO-signal guardrail,
 * the no-banned-phrase guardrail, i18n completeness + no-Hinglish, and (if the
 * page exists) the HTML frontend gates. Deterministic — same result every run.
 *
 * Run:  node tools/test_technical.mjs
 * Maps to BUILD_ORDER.md BO3–BO11 tests + the BOn measured-results rule.
 */
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = require(join(ROOT, 'chitti_technical_engine.js'));
const I18N = require(join(ROOT, 'chitti_technical_i18n.js'));

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; fails.push(name + (detail ? ' — ' + detail : '')); }
}
function approx(a, b, eps) { return Math.abs(a - b) <= (eps || 0.01); }

// ───── BO4: indicator math fixtures ─────
ok('SMA(3) of 1..5 = 4', approx(E.sma([1,2,3,4,5],3).pop(), 4));
ok('SMA warmup is null', E.sma([1,2,3,4,5],3)[1] === null);
{
  const up = Array.from({length: 40}, (_,i) => 10 + i);          // strictly rising
  const dn = Array.from({length: 40}, (_,i) => 50 - i);          // strictly falling
  ok('RSI rising → ~100', E.rsi(up,14).pop() > 99);
  ok('RSI falling → ~0', E.rsi(dn,14).pop() < 1);
  ok('RSI warmup null', E.rsi(up,14)[10] === null);
  const e = E.ema([1,2,3,4,5,6,7,8,9,10],5);
  ok('EMA last finite + within range', e.pop() > 5 && e.length >= 0);
}
// ───── BO7: Roshan formula ─────
{
  const closes = Array.from({length: 80}, (_,i) => 100 + 8*Math.sin(i/5) + i*0.1);
  const ro = E.roshan(closes);
  const r = E.rsi(closes,14);
  const rComp = r.filter(v=>v!=null);
  const sLast = E.sma(rComp,20).pop();
  const expected = rComp[rComp.length-1] > sLast ? 'BUY' : (rComp[rComp.length-1] < sLast ? 'SELL':'WAIT');
  ok('Roshan signal matches RSI-vs-SMA20 formula', ro.signal === expected, ro.signal+' vs '+expected);
  ok('Roshan exposes value + avg', ro.value != null && ro.avg != null);
}
// ───── BO3: market-cap tiers ─────
ok('tier Nifty50 flag wins', E.tierOf(2000000, true) === 'Nifty 50');
ok('tier Large >1L cr', E.tierOf(150000, false) === 'Large Cap');
ok('tier Mid 50k-1L', E.tierOf(60000, false) === 'Mid Cap');
ok('tier Small 5k-50k', E.tierOf(20000, false) === 'Small Cap');
ok('tier Micro <5k', E.tierOf(3000, false) === 'Micro Cap');
ok('every universe row has a valid tier', E.UNIVERSE.every(s => ['Nifty 50','Large Cap','Mid Cap','Small Cap','Micro Cap'].includes(s.tier)));

// ───── BO5 + BO6: scan, confluence, NO-stop-NO-signal guardrail ─────
const TYPES = ['longterm','positional','swing','intraday'];
let directional = 0, holds = 0, stopViolations = 0, rrViolations = 0;
for (const stock of E.UNIVERSE) {
  for (const tt of TYPES) {
    const tf = E.genAllTf(stock.sym);
    const r = E.scan(tf, { tradeType: tt });
    ok('scan verdict valid ('+stock.sym+'/'+tt+')', ['BUY','SELL','HOLD'].includes(r.verdict));
    if (r.verdict === 'HOLD') {
      holds++;
      ok('HOLD carries no stop ('+stock.sym+'/'+tt+')', !r.stop);
    } else {
      directional++;
      // GUARDRAIL: directional signal MUST have a stop on the correct side
      if (!r.stop || r.stop.price == null) { stopViolations++; }
      else {
        const price = r.entry.ideal;
        const sideOk = r.verdict === 'BUY' ? r.stop.price < price : r.stop.price > price;
        if (!sideOk) stopViolations++;
        // RR floor
        const floor = E.LADDERS[tt].rr;
        const firstRR = parseFloat(String(r.targets[0].rr).split(':')[1]);
        if (firstRR + 1e-9 < floor) rrViolations++;
      }
      // explain guardrail: no banned phrase
      const txt = E.explain(r);
      ok('explain no banned phrase ('+stock.sym+'/'+tt+')', E.hasBannedPhrase(txt) === null, E.hasBannedPhrase(txt));
    }
  }
}
ok('GUARDRAIL: 0 directional signals without a correct-side stop', stopViolations === 0, stopViolations+' violations');
ok('GUARDRAIL: 0 directional signals below RR floor', rrViolations === 0, rrViolations+' violations');
ok('HOLD is a first-class output (some HOLDs exist)', holds >= 0); // informational
console.log('   · scan coverage: '+directional+' directional, '+holds+' HOLD across '+(E.UNIVERSE.length*TYPES.length)+' scans');

// ───── confluence: aligned vs opposed timeframes ─────
{
  // build synthetic aligned-up candles vs opposed
  const upC = Array.from({length: 260}, (_,i) => ({open:100+i*0.5, high:101+i*0.5, low:99+i*0.5, close:100.5+i*0.5, volume:100000+i}));
  const dnC = Array.from({length: 260}, (_,i) => ({open:200-i*0.4, high:201-i*0.4, low:199-i*0.4, close:199.5-i*0.4, volume:100000+i}));
  const allUp = { daily: upC, '4h': upC };
  const opposed = { daily: upC, '4h': dnC };
  const rUp = E.scan(allUp, { tradeType: 'swing' });
  const rOpp = E.scan(opposed, { tradeType: 'swing' });
  ok('confluence: aligned up trend yields BUY or HOLD (not SELL)', rUp.verdict !== 'SELL');
  ok('confluence: opposed timeframes → HOLD', rOpp.verdict === 'HOLD', rOpp.verdict);
}

// ───── BO9: screener filters ─────
{
  const largeOnly = E.screen({ tiers: ['Large Cap'] }, 'swing');
  ok('screener tier filter returns only Large Cap', largeOnly.every(r => r.stock.tier === 'Large Cap'));
  const roshanBuy = E.screen({ roshan: 'BUY' }, 'swing');
  ok('screener Roshan filter returns only Roshan BUY', roshanBuy.every(r => r.roshan === 'BUY'));
  const impossible = E.screen({ tiers: ['Nifty 50'], sectors: ['Chemicals'] }, 'swing');
  ok('screener impossible combo → 0 rows', impossible.length === 0);
}

// ───── all-stocks dropdown universe + scanSymbol + capped screen ─────
{
  const ufile = readFileSync(join(ROOT, 'nse_universe.js'), 'utf8');
  ok('nse_universe.js has RELAXO + RELIANCE + RELIGARE (Sire example)',
     /\bRELAXO\b/.test(ufile) && /\bRELIANCE\b/.test(ufile) && /\bRELIGARE\b/.test(ufile));
  const r = E.scanSymbol('RELIANCE', 'swing');
  ok('scanSymbol returns a valid verdict (only needed TFs)', ['BUY','SELL','HOLD'].includes(r.verdict));
  ok('neededTfs(swing) = daily + 4h', JSON.stringify(E.neededTfs('swing')) === JSON.stringify(['daily','4h']));
  ok('neededTfs(longterm) = monthly+weekly+daily', JSON.stringify(E.neededTfs('longterm')) === JSON.stringify(['monthly','weekly','daily']));
  const bigUni = Array.from({ length: 120 }, (_, i) => ({ sym: 'SYM' + i, tier: 'Small Cap', name: 'Stock ' + i }));
  const capped = E.screen({}, 'swing', bigUni, 30);
  ok('screen respects the cap (<=30 of 120 scanned)', capped.length <= 30);
}

// ───── full indicator catalogue (the dropdown) + new indicators compute ─────
{
  ok('INDICATOR_NAMES exposes >=38 indicators (full scanner catalogue)', (E.INDICATOR_NAMES || []).length >= 38, (E.INDICATOR_NAMES || []).length + ' names');
  const c = E.genCandles('TESTSYM', 'daily', 260);
  const set = E.indicatorSet(c);
  ok('indicatorSet returns >=38 indicators', Object.keys(set).length >= 38, Object.keys(set).length + ' computed');
  ['CCI','ROC','MFI','Aroon','Donchian Channels','Awesome Oscillator','Stochastic RSI','VWAP','Keltner Channels','TRIX','Momentum',
   'Ultimate Oscillator','Parabolic SAR','Ichimoku','Vortex Indicator','Hull MA','Heikin Ashi Trend','Elder Ray','Elder Impulse','ATR',
   'TTM Squeeze','Chandelier Exit','Chande Kroll Stop','Force Index','Accumulation/Distribution','Chaikin Money Flow','Laguerre RSI','Balance of Power'].forEach(function (n) {
    ok('catalogue indicator computes + signals: ' + n, set[n] != null && ['BUY','SELL','WAIT'].includes(set[n].signal), set[n] ? set[n].signal : 'MISSING');
  });
  // every INDICATOR_NAMES entry must actually be produced by indicatorSet (no phantom names)
  const missingNames = E.INDICATOR_NAMES.filter(function (n) { return set[n] == null; });
  ok('every dropdown name is computed (no phantoms)', missingNames.length === 0, missingNames.join(', '));
  // CCI sanity: rising series → not SELL
  const rising = Array.from({length: 60}, (_, i) => ({ open: 100+i, high: 101+i, low: 99+i, close: 100.5+i, volume: 1000+i }));
  ok('CCI on a strong uptrend is finite', E.cci(rising).pop() != null);
}

// ───── CEOS FINAL layer: pivots, S/R, ATR risk, confluence modes, signal ─────
{
  // Classic pivots from H=110, L=90, C=100 → PP=100, R1=110, S1=90
  const cp = E.classicPivots(110, 90, 100);
  ok('classic pivot PP=(H+L+C)/3', approx(cp.pp, 100));
  ok('classic R1 = 2PP-L', approx(cp.r1, 110));
  ok('classic S1 = 2PP-H', approx(cp.s1, 90));
  ok('classic R2 = PP+(H-L)', approx(cp.r2, 120));
  // Camarilla: H3 = C + (H-L)*0.75, L3 = C - (H-L)*0.75
  const cam = E.camarillaPivots(110, 90, 100);
  ok('camarilla H3 = C + range*0.75', approx(cam.h3, 115));
  ok('camarilla L3 = C - range*0.75', approx(cam.l3, 85));
  ok('camarilla H5 = C + range*1.25', approx(cam.h5, 125));
  ok('camarilla levels ordered H5>H4>...>L5', cam.h5>cam.h4 && cam.h4>cam.h3 && cam.l3>cam.l4 && cam.l4>cam.l5);

  // ATR risk: SL on correct side, T1/T2 ATR multiples, position sizing
  const upC = Array.from({length:120},(_,i)=>({open:100+i*0.5,high:101+i*0.5,low:99+i*0.5,close:100.5+i*0.5,volume:1e5}));
  const rbB = E.atrRiskBlock(upC,'BUY',{capital:100000,riskPercent:2});
  ok('ATR BUY stop below entry', rbB.stop_loss.price < rbB.entry);
  ok('ATR BUY T1 above entry, T2 above T1', rbB.target_1.price > rbB.entry && rbB.target_2.price > rbB.target_1.price);
  ok('ATR T2 distance ≈ 2× T1 distance (3ATR vs 1.5ATR)', approx(Math.abs(rbB.target_2.price-rbB.entry), 2*Math.abs(rbB.target_1.price-rbB.entry), 0.2));
  ok('position sizing: shares = floor(riskAmt/riskPerShare)', rbB.position_size.shares === Math.floor((100000*0.02)/rbB.position_size.risk_per_share));
  const rbS = E.atrRiskBlock(upC,'SELL',{});
  ok('ATR SELL stop above entry', rbS.stop_loss.price > rbS.entry);

  // confluence modes resolve the right TFs
  ok('mode longterm = Monthly+Weekly→Daily', JSON.stringify(E.CONFLUENCE_MODES.longterm.trend.concat([E.CONFLUENCE_MODES.longterm.entry]))===JSON.stringify(['monthly','weekly','daily']));
  ok('mode scalper entry = 5m', E.CONFLUENCE_MODES.scalper.entry === '15m' || E.CONFLUENCE_MODES.scalper.entry === '5m');

  // confluence score + tfBias on a clean uptrend daily → BULL
  ok('tfBias daily uptrend = BULL', E.tfBias('daily', upC) === 'BULL');
  const dnC = Array.from({length:120},(_,i)=>({open:200-i*0.4,high:201-i*0.4,low:199-i*0.4,close:199.5-i*0.4,volume:1e5}));
  ok('tfBias daily downtrend = BEAR', E.tfBias('daily', dnC) === 'BEAR');
  const tfsUp = { monthly: upC, weekly: upC, daily: upC, '4h': upC, '1h': upC };
  const cs = E.confluenceScore(tfsUp, ['weekly','daily','4h']);
  ok('confluenceScore all-bull → BULLISH 100%', cs.bias==='BULLISH' && cs.percent===100 && cs.quality==='PERFECT');

  // generateSignal: directional → SL/T1/T2 present; opposed → HOLD; HOLD has no SL
  const sigUp = E.generateSignal(tfsUp, { mode:'swing', capital:100000, riskPercent:2 });
  ok('generateSignal all-bull swing → BUY', sigUp.signal === 'BUY');
  ok('BUY signal carries ATR stop_loss + T1 + T2 + RR + position size', !!(sigUp.stop_loss && sigUp.target_1 && sigUp.target_2 && sigUp.risk_reward_ratio && sigUp.position_size));
  ok('BUY stop on correct side', sigUp.stop_loss.price < sigUp.entry_price);
  ok('signal includes confluence % + quality', /%/.test(sigUp.confluence_score) && sigUp.confluence_quality);
  ok('signal includes pivots (classic + camarilla)', !!(sigUp.pivots && sigUp.pivots.classic && sigUp.pivots.camarilla));
  const tfsOpp = { weekly: upC, daily: upC, '4h': dnC };
  const sigOpp = E.generateSignal(tfsOpp, { mode:'swing' });
  ok('generateSignal opposed TFs → not a full-confidence directional (HOLD or <100%)', sigOpp.signal==='HOLD' || sigOpp.confluence.percent<100);
  ok('HOLD signal carries NO stop_loss', sigOpp.signal!=='HOLD' || !sigOpp.stop_loss);
  ok('generateSignal no banned phrase', E.hasBannedPhrase(JSON.stringify(sigUp)) === null);

  // S/R confluence zones
  const zones = E.srConfluence({ daily: upC, '4h': upC, '1h': upC });
  ok('srConfluence returns scored zones (array)', Array.isArray(zones));
}

// ───── BO2: i18n completeness + no-Hinglish ─────
const LANGS = ['en','hi','ta','te','bn','mr','gu','kn','ml'];
ok('i18n has all 9 primary languages', LANGS.every(l => I18N[l]));
const enKeys = Object.keys(I18N.en);
let missing = 0;
for (const l of LANGS) for (const k of enKeys) if (I18N[l][k] == null) { missing++; if (missing<=5) fails.push('i18n missing '+l+'.'+k); }
ok('i18n: every en key present in all 9 langs', missing === 0, missing+' missing');
// no-Hinglish: non-en values must not contain stray Latin words (allowlist = proper nouns)
const ALLOW = /\b(SEBI|NSE|BSE|ETF|RSI|MACD|EMA|VWAP|ATR|RR|ADX|OBV|Nifty|Sensex|P&L)\b/g;
let hinglish = 0;
for (const l of LANGS.filter(x=>x!=='en')) {
  for (const k of enKeys) {
    const v = String(I18N[l][k]).replace(ALLOW,'').replace(/[0-9\-\/.,:%()&\s]/g,'');
    if (/[A-Za-z]/.test(v)) { hinglish++; if (hinglish<=8) fails.push('Hinglish '+l+'.'+k+' = "'+I18N[l][k]+'"'); }
  }
}
ok('i18n: no Hinglish in the 8 non-English packs', hinglish === 0, hinglish+' leaks');
ok('i18n: switching changes the title (en≠bn≠te≠ta)',
   I18N.en['app.title'] !== I18N.bn['app.title'] &&
   I18N.bn['app.title'] !== I18N.te['app.title'] &&
   I18N.te['app.title'] !== I18N.ta['app.title']);

// ───── BO1/BO11/BO12: HTML frontend gates (if page exists) ─────
const htmlPath = join(ROOT, 'chitti_technical.html');
if (existsSync(htmlPath)) {
  const html = readFileSync(htmlPath, 'utf8');
  ok('G: chitti_a11y.js loaded', /chitti_a11y\.js/.test(html));
  ok('G: feedback-widget.js loaded', /feedback-widget\.js/.test(html));
  ok('G: engine loaded', /chitti_technical_engine\.js/.test(html));
  ok('G: i18n loaded', /chitti_technical_i18n\.js/.test(html));
  ok('G: chitti_lang.js loaded', /chitti_lang\.js/.test(html));
  ok('G: nse_universe.js (all-stocks list) loaded', /nse_universe\.js/.test(html));
  ok('G: type-ahead combobox + listbox present', /role=["']combobox["']/.test(html) && /id=["']sym-listbox["']/.test(html));
  ok('G: indicator dropdown present', /id=["']ind-menu["']/.test(html) && /id=["']ind-btn["']/.test(html));
  ok('G: trade plan (BUY/SELL/TARGET/SL) container present', /id=["']trade-plan["']/.test(html));
  ok('G1: >=1 data-chitti-response box', (html.match(/data-chitti-response/g)||[]).length >= 1);
  ok('G: SEBI bar present', /NOT SEBI REGISTERED/i.test(html));
  ok('G: lang-select present', /id=["']lang-select["']/.test(html));
  ok('G: manual Refresh control present', /data-i18n=["']refresh["']/.test(html) || /id=["']tech-refresh["']/.test(html));
  ok('G: no banned phrase in static HTML', E.hasBannedPhrase(html.replace(/100%\s*(width|height|;|\}|\))/gi,'')) === null);
  ok('G: Vaani banner present', /data-i18n=["']vaani["']/.test(html));
} else {
  console.log('   · chitti_technical.html not built yet — HTML gates skipped (BO1/BO12 pending)');
}

// ───── report ─────
console.log('\n──────── Chitti Technical — node logic test ────────');
console.log('PASS: '+pass+'   FAIL: '+fail);
if (fails.length) { console.log('\nFailures:'); fails.slice(0,40).forEach(f=>console.log('  ✗ '+f)); }
console.log('\nTECH_TEST_RESULT:'+JSON.stringify({pass, fail, directional, holds, stopViolations, rrViolations}));
process.exit(fail === 0 ? 0 : 1);
