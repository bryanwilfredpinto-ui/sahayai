# SOP-003 — Live data outage (Angel One)

1. Symptom: page shows "DEMO data — live unavailable: <reason>" or `/api/candles` returns empty/500.
2. Diagnose with Node: `node -e "fetch('https://chitti-shares-api-production.up.railway.app/api/candles/RELIANCE?timeframe=Daily').then(r=>r.json()).then(a=>console.log(a.length))"`.
3. The backend caches non-empty candles 5 min + retries 3× + returns `[]` (never 500). The frontend fetches timeframes **sequentially** with a Daily retry. Confirm both are intact.
4. If Angel is rate-limiting: this is expected; the page stays on DEMO and **says so honestly** (no fake live data). Do not mask it.
5. If a symbol won't resolve, check NSE:/BSE: normalisation in `angel_client.get_candles` (token map is keyed `NSE:SYMBOL`).
6. Verify recovery with `node tools/test_nifty50_live.mjs` (target: ~49/50 populate).
