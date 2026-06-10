/* test_indicators.cjs — tests ALL 39 indicators + Roshan ONE BY ONE on LIVE NSE data.
 * Pulls real RELIANCE daily candles from the backend, runs TechEngine.indicatorSet, and prints
 * a per-indicator row (value · signal · OK). Run: node tools/test_indicators.cjs
 */
const path = require('path');
const T = require(path.join(__dirname, '..', 'chitti_technical_engine.js'));
const API = 'https://chitti-shares-api-production.up.railway.app';
const SYM = process.env.SYM || 'RELIANCE';

(async () => {
  let candles, src = 'LIVE';
  try {
    const r = await fetch(API + '/api/candles/' + SYM + '?timeframe=Daily&days_back=260', { signal: AbortSignal.timeout(20000) });
    const arr = await r.json();
    candles = arr.map(c => ({ date: new Date((c.time || c.t) * 1000).toISOString().slice(0, 10), open: +c.open, high: +c.high, low: +c.low, close: +c.close, volume: +(c.volume || 0) })).filter(c => c.close > 0);
    if (candles.length < 30) throw new Error('short');
  } catch (e) { src = 'DEMO'; candles = T.genCandles(SYM, 'daily', 260); }

  const last = candles[candles.length - 1];
  console.log('Data: ' + src + ' · ' + SYM + ' · ' + candles.length + ' daily bars · last close ₹' + last.close + ' (' + last.date + ')\n');

  const out = T.indicatorSet(candles);
  const names = T.INDICATOR_NAMES;
  let okN = 0, fail = 0; const failed = [];
  console.log('| # | Indicator | Value | Signal | OK |');
  console.log('|---|---|---|---|---|');
  names.forEach((nm, i) => {
    const x = out[nm];
    const has = x && (x.value !== undefined || ['BUY', 'SELL', 'WAIT'].indexOf(x.signal) >= 0);
    const sigOk = x && ['BUY', 'SELL', 'WAIT'].indexOf(x.signal) >= 0;
    const okRow = !!(has && sigOk);
    if (okRow) okN++; else { fail++; failed.push(nm); }
    console.log('| ' + (i + 1) + ' | ' + nm + ' | ' + (x ? (x.value != null ? x.value : '—') : 'MISSING') + ' | ' + (x ? x.signal : '—') + ' | ' + (okRow ? '✅' : '❌') + ' |');
  });

  // spot-check the 5 named ones against a direct recompute (sanity, not just presence)
  const cl = candles.map(c => c.close);
  const rsi = T.rsi(cl, 14); const rsiLast = rsi[rsi.length - 1];
  const macd = T.macd(cl); const st = T.stochastic(candles); const wr = T.williamsR(candles); const ro = T.roshan(cl);
  console.log('\nSpot-check (recomputed directly on the same live candles):');
  console.log('  RSI(14)        = ' + (rsiLast != null ? rsiLast.toFixed(2) : 'n/a') + '  → ' + out['RSI'].signal);
  console.log('  MACD line−sig  = ' + ((macd.line.at(-1) - macd.signal.at(-1)) || 0).toFixed(2) + '  → ' + out['MACD'].signal);
  console.log('  Stochastic %K  = ' + (st.k.at(-1) != null ? st.k.at(-1).toFixed(2) : 'n/a') + '  → ' + out['Stochastic'].signal);
  console.log('  Williams %R    = ' + (wr.at(-1) != null ? wr.at(-1).toFixed(2) : 'n/a') + '  → ' + out['Williams %R'].signal);
  console.log('  Roshan (RSI vs SMA20) = ' + ro.value + ' vs ' + ro.avg + '  → ' + ro.signal);

  console.log('\n' + (fail === 0 ? '✅' : '❌') + ' ' + okN + ' of ' + names.length + ' indicators produced a value + signal on ' + src + ' data.' + (failed.length ? ' Failed: ' + failed.join(', ') : ''));
  process.exit(fail === 0 ? 0 : 1);
})();
