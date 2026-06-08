/* tools/test_nifty50_live.mjs — LIVE test: do technicals populate for all 50 Nifty 50 stocks?
 * 🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.
 *
 * Hits the PRODUCTION backend /api/candles for every Nifty 50 symbol, runs the real engine, and
 * reports per-stock: live price + how many of the 39 indicators populated + the verdict. This is
 * the CTO testing all 50 — not the user. Run: node tools/test_nifty50_live.mjs
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = require(join(ROOT, 'chitti_technical_engine.js'));

const BASE = process.env.SHARES_API || 'https://chitti-shares-api-production.up.railway.app';
const NIFTY50 = ['ADANIENT','ADANIPORTS','APOLLOHOSP','ASIANPAINT','AXISBANK','BAJAJ-AUTO','BAJAJFINSV','BAJFINANCE','BEL','BHARTIARTL','BPCL','BRITANNIA','CIPLA','COALINDIA','DRREDDY','EICHERMOT','GRASIM','HCLTECH','HDFCBANK','HDFCLIFE','HEROMOTOCO','HINDALCO','HINDUNILVR','ICICIBANK','INDUSINDBK','INFY','ITC','JIOFIN','JSWSTEEL','KOTAKBANK','LT','M&M','MARUTI','NESTLEIND','NTPC','ONGC','POWERGRID','RELIANCE','SBILIFE','SBIN','SHRIRAMFIN','SUNPHARMA','TATACONSUM','TATAMOTORS','TATASTEEL','TCS','TECHM','TITAN','TRENT','ULTRACEMCO'];

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function fetchTf(sym, tf, retries = 2) {
  const url = BASE + '/api/candles/' + encodeURIComponent(sym) + '?timeframe=' + tf + '&days_back=' + (tf === 'Daily' ? 400 : 260);
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) {
        const a = await r.json();
        if (Array.isArray(a) && a.length) return a.map((c, idx) => ({ open: +c.open, high: +c.high, low: +c.low, close: +c.close, volume: +c.volume || 0, t: idx }));
      }
    } catch (e) { /* retry */ }
    if (i < retries) await sleep(900);
  }
  return null;
}

const rows = [];
let live = 0, populatedOk = 0;
console.log('Testing live technicals for ' + NIFTY50.length + ' Nifty 50 stocks via ' + BASE + ' …\n');
console.log('#  | Symbol      | Price     | Indicators | Verdict | Status');
console.log('---|-------------|-----------|------------|---------|-------');
for (let i = 0; i < NIFTY50.length; i++) {
  const sym = NIFTY50[i];
  const daily = await fetchTf(sym, 'Daily');
  let price = '—', nInd = 0, verdict = '—', status = 'NO DATA';
  if (daily && daily.length >= 30) {
    live++;
    price = '₹' + daily[daily.length - 1].close;
    const ind = E.indicatorSet(daily);
    nInd = Object.keys(ind).filter(k => ind[k] && ind[k].value != null).length;
    // daily-only verdict (trend + indicator lean) — proves the engine runs on live data
    verdict = E.tfVerdict(daily).verdict;
    if (nInd >= 30) populatedOk++;
    status = nInd >= 30 ? 'OK' : 'PARTIAL(' + nInd + ')';
  }
  rows.push({ sym, price, nInd, verdict, status });
  console.log(
    String(i + 1).padStart(2) + ' | ' + sym.padEnd(11) + ' | ' + String(price).padEnd(9) + ' | ' +
    (nInd ? (nInd + '/39') : '—').padEnd(10) + ' | ' + String(verdict).padEnd(7) + ' | ' + status);
  await sleep(400); // be gentle on the Angel rate limit
}

console.log('\n──────── Nifty 50 LIVE technicals ────────');
console.log('Live price returned : ' + live + '/' + NIFTY50.length);
console.log('Indicators populated (>=30/39): ' + populatedOk + '/' + NIFTY50.length);
const missing = rows.filter(r => r.status === 'NO DATA').map(r => r.sym);
if (missing.length) console.log('No live data for: ' + missing.join(', '));
console.log('NIFTY50_RESULT:' + JSON.stringify({ total: NIFTY50.length, live, populatedOk, missing }));
