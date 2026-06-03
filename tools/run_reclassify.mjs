/**
 * run_reclassify.mjs — call POST /api/news/admin/reclassify?apply=1
 * in pages until done:true. Aggregates per-bank moves across all
 * batches. Run with `node tools/run_reclassify.mjs`.
 */
const API = 'https://chitti-news-api-production.up.railway.app';
const TOKEN = 'chitti-cto-2026-06-03-reclassify-script';

const totals = { scanned: 0, overridden: 0, moves: {} };
let after = null, batch = 0;
const LIMIT = 1500;

while (true) {
  batch++;
  const url = new URL(API + '/api/news/admin/reclassify');
  url.searchParams.set('apply', '1');
  url.searchParams.set('limit', String(LIMIT));
  if (after !== null) url.searchParams.set('after', String(after));

  const t0 = Date.now();
  const r = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'X-User-Token': TOKEN },
  });
  if (!r.ok) {
    console.error(`Batch ${batch} HTTP ${r.status}`);
    const body = await r.text().catch(() => '');
    console.error(body.slice(0, 400));
    process.exit(1);
  }
  const d = await r.json();
  const ms = Date.now() - t0;

  totals.scanned    += d.scanned    || 0;
  totals.overridden += d.overridden || 0;
  for (const [k, v] of Object.entries(d.moves || {})) {
    totals.moves[k] = (totals.moves[k] || 0) + v;
  }

  console.log(`batch ${String(batch).padStart(2,'0')}  ` +
              `+${(d.overridden ?? 0).toString().padStart(3)} / ${(d.scanned ?? 0).toString().padStart(4)} rows  ` +
              `next_after=${d.next_after}  done=${d.done}  ${ms}ms`);
  if (d.done) break;
  if (d.next_after == null) {
    console.error('next_after is null but done is false — stopping');
    break;
  }
  after = d.next_after;
}

console.log('\n— TOTALS —');
console.log(`scanned   : ${totals.scanned}`);
console.log(`overridden: ${totals.overridden}  (${(100*totals.overridden/Math.max(1,totals.scanned)).toFixed(2)}%)`);
console.log('moves:');
for (const [k, v] of Object.entries(totals.moves).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(v).padStart(5)}  ${k}`);
}
