🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# Chitti Technical — KNOWN ISSUES (CEOS FINAL v1.0)

Honest limitations as of 2026-06-08. Nothing hidden.

| # | Issue | Impact | Status / Workaround |
|---|---|---|---|
| 1 | **Languages: 9 full, not 26** | UI fully re-renders in en/hi/ta/te/bn/mr/gu/kn/ml. The other 17 CEOS languages fall back to English. | The CEOS itself (§11.5) specifies "+13 more → Fallback to Hindi", so fallback is by-design. Full strings for the tail are a follow-up. Indicator names stay English by design. |
| 2 | **5-minute timeframe not fetched** | Scalper mode (4H+1H→15m) runs on live data; the 5m candle (precision entry) is not yet pulled. | 15-min IS fetched. 5-min needs the intraday endpoint wired into `loadLiveFrom`; engine already accepts a `5m` key. |
| 3 | **TATAMOTORS returns no live candles** | 49/50 Nifty 50 populate; TATAMOTORS is the gap. | Tata Motors' NSE ticker changed after the 2025 demerger — needs an Angel scrip-master symbol update in `angel_client`. |
| 4 | **Angel historical API is rate-limited** | Under heavy parallel load the live fetch can return empty. | Mitigated: backend caches non-empty candles 5 min + retries 3×; frontend fetches timeframes sequentially with a Daily retry. Repeat loads are instant. |
| 5 | **DeepSeek warm-conversational Explain** | The "Explain" card is deterministic/templated, not LLM-narrated. | By design until a funded DeepSeek key; the CEOS routes deterministic-first anyway. Crisis + signals NEVER use an LLM. |
| 6 | **Directional accuracy vs market** | Win-rate vs real outcomes is not yet measured (needs live signals tracked over time). | The System Signal Journal now logs every signal with outcome fields for exactly this; accumulate then measure. |
| 7 | **Real-device haptics / TTS** | Vibration + speech are wired but only verifiable on physical iPhone/Android. | Sire's testing slot (the one thing the CTO cannot automate). |
| 8 | **Browser cache after deploy** | Users can see an old copy until the 10-min Pages cache expires. | HTML is network-first in the Service Worker (no SW staleness). For an instant fresh load use `?v=<n>`. |

See [TEST_REPORT.md](TEST_REPORT.md) for measured results and [../CEOS_FINAL_v1.md](../CEOS_FINAL_v1.md) for scope.
