# DEVILS_ADVOCATE

Eight critiques to keep honest. Re-read before shipping anything to either frontend.

## 1. Yahoo blocked means data freshness lags vs paid feeds

screener.in scrape refreshes only as fast as screener.in itself updates (typically T+1 for quarterly, intraday for prices). Tickertape, Trendlyne, Bloomberg, and Refinitiv all beat us on freshness for mid-quarter operational updates. We document this in [`../README.md`](../README.md) "Data sources (locked)" but should not pretend the gap is zero.

## 2. Roshan Indicator is a proprietary blend — needs peer review

The Roshan rule (RSI > SMA(RSI) on TF1 AND TF2 + green pair candles + red pullback) is not academically peer-reviewed. We back-tested in-house on NIFTY 500 from 2018–2025 (see [TODO.md §H](../TODO.md)) but no third-party replication exists. The signal-strength language in [PERSONALITY.md](./PERSONALITY.md) helps, but a user could still treat Roshan output as if it were CAPM.

## 3. Story Mode + Buffett-lens framing risks SEBI scrutiny no matter the banner

Naming a verdict `"QUALITY-AT-FAIR-PRICE"` and then narrating it with `"Buffett would buy this"` reads to a regulator like *implicit* investment advice. The banner ([BOUNDARIES.md §1](./BOUNDARIES.md)) is the legal shield but a strict reading could still find the verbal frame too prescriptive. Mitigation: keep all verdicts as *measurements* of how well a stock fits a *lens*, never `"buy this"`.

## 4. screener.in scrape is a single point of failure

If screener.in changes their HTML structure, [`screener_client.py`](../backend/services/screener_client.py) silently returns empty objects until repaired. `yahoo_client` was the historical fallback but is blocked on Railway. We need a smoke-test cron to ping a known symbol and alert when fields go null.

## 5. Angel SmartAPI quota is opaque to the user

The user sees their DeepSeek quota via `/api/usage/today` but the Angel rate limit is invisible. A burst of universe scans (`/api/scan/roshan`) plus per-stock `/api/quotes` can exhaust the SmartAPI tier without warning. [OBSERVABILITY.md](./OBSERVABILITY.md) tracks this but no user-facing meter exists.

## 6. Two frontends, one backend = one cold-start tax for both

Railway free dyno sleeps after 15 min. A user opening `chitti_fundamentals.html` first and then switching to `chitti_complete_technical.html` benefits from the warm dyno, but the *first* visitor of either pays 8-20s cold-start. There is no warming cron because that defeats the free-tier cost model.

## 7. Hindi LLM output is not lint-checked

The `Reply in Hindi (Devanagari script)` instruction in [`../PROMPTS.md`](../PROMPTS.md) §9.1 trusts DeepSeek's Hindi quality. We have no Hindi golden-set test or native reviewer in the loop. A bad-grammar Hindi reply from Story Mode could embarrass and confuse simultaneously.

## 8. The DeepSeek hard cap can make the product appear broken

At ₹100/day the agent endpoints return HTTP 402/503. The fundamentals/technical pages fall back to compute-only mode, but Story Mode and Ask Chitti silently break. We need a user-visible banner when the cap is hit, not just a console error.
