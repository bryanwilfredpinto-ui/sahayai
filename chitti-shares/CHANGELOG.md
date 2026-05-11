# CHANGELOG

Generated from `git log --oneline --reverse -- chitti-shares/` at the repo root. Oldest first, most recent last. 81 commits as of 2026-05-11.

## Bootstrap (file-upload phase)

| Commit | Summary |
|---|---|
| `1994704` | Add files via upload — initial chitti-shares directory landed |
| `228bcf9` | Delete chitti-shares directory (re-bootstrap) |
| `a596b7c`, `9bf34d0` | Add files via upload |
| `e7ff926` | Update main.py |
| `ec218a6` | Update market.py |
| `7aa65ad` | Delete chitti-shares/backend/routes/market.py |
| `21e193e`, `e6b5383`, `9af0174` | Add files via upload |
| `85a6ce0` | Delete chitti-shares/backend/services/nse_client.py |
| `4253a49`, `c725596`, `d55f2f7` | Add files via upload |
| `4b76472` | Delete chitti-shares/backend/services/nse_client (2).py |
| `875601e` | nse_client.py |
| `1b6ad32`, `075284a` | Add files via upload |
| `3de3d8d` | Update main.py |
| `5c760c6` | Update requirements.txt |
| `4c7cc22` | Add files via upload |
| `d0d5496` | angel_client.py |

## Phase 1 → 6 framework

| Commit | Summary |
|---|---|
| `0831adf` | Update main.py |
| `9d0ace6` | Update config.py |
| `a9b7e77` | Update data_source.py |
| `c9bbeda` | Update requirements.txt |
| `40a72d0` | Update angel_client.py |
| `eddbb7a` | Create technical.py |
| `77e8b6c` | Update main.py |
| `c63c025` | Create Technical.jsx (legacy React frontend) |
| `c2958cf` | Update App.jsx |
| `76fa13a` | Create universes.py |
| `603e7a7` | Create scanner.py |
| `923fd4b` | Update main.py |
| `e2f8154` | smoke test: chitti-devops-bot first commit |

## Chart / Scanner build-out

| Commit | Summary |
|---|---|
| `2d197df` | add /api/candles/{symbol} endpoint for StockChart |
| `35c04ee` | add services/levels.py — auto S/R + trendlines |
| `242d918` | add /api/levels/{symbol} endpoint |
| `ea2f7be` | add lightweight-charts dep for StockChart |
| `d77ce19` | add Scanner.jsx — Roshan two-column scanner page |
| `bf144b1` | add StockChart.jsx — candlestick + RSI pane + S/R + trendlines |
| `44b01d6` | add /scanner and /chart/:symbol routes |
| `0f47b69` | fix: dropdown changes don't auto-scan, only Scan now button does |
| `7ec081e` | fix: trendlines bounded to pivot range, no extrapolation |
| `d089761` | fix: trendlines anchored to actual pivot prices, no slope extrapolation |
| `18eb999` | loosen levels.py tuning + add 15min/5min/1min params |
| `8dabbc7` | fix: refetch levels on symbol change, retry on partial failures |
| `20698cf` | add services/intraday_candles.py — direct Angel fetch for 15min/5min/1min |
| `2d6a320` | route intraday timeframes through intraday_candles in /api/candles |
| `5e52209` | route intraday timeframes through intraday_candles in compute_levels |
| `07f7d04` | add 15min/5min/1min timeframes to chart UI |
| `dcf6d94` | trendlines: strict wick-to-wick, no body crossings |
| `1871f80` | fix: timeframe labels now display fully without truncation |
| `d9f9add` | ui polish: Scanner.jsx — Tailwind, light theme, Tickertape/Kite-inspired |

## Scanner generalisation

| Commit | Summary |
|---|---|
| `fa3c143` | add SESSION_FILES.txt for devops bot session start |
| `3e9a807` | add generic /api/scan/{indicator} endpoint |
| `e8ea7b6` | add scan_indicator: generic scanner for all 34 indicators |
| `888f481` | Scanner: all 34 indicators dropdown, BUY+SHORT columns, SEBI disclaimer |
| `d5baefd` | add 9 new indicators 2010-2026: TTM Squeeze, AO, Vortex, Chandelier, HMA, Laguerre RSI, HA Trend, BOP, Chande Kroll |
| `0d621ce` | Scanner: add new 2010-2026 indicators with lightning badge, yellow highlight |
| `99da360` | Scanner: Custom call type with TF1+TF2+Pullback pickers — nothing hardcoded |
| `f4191e2` | scan endpoint: accept tf1, tf2, pullback for Custom call type |
| `ea5c69b` | scanner: Custom call type with user-defined TF1+TF2+Pullback, quote enrichment |
| `96b4f98` | fix: add sahayai.in and github.io to CORS allowed origins |

## Chitti Fundamentals product launch

| Commit | Summary |
|---|---|
| `9bc396b` | feat: Chitti Fundamentals — standalone HTML + public /api/fundamentals |
| `f568591` | feat(fundamentals): scanner with 31 strategies + Ask Chitti chat + News tab |
| `0e92fd9` | feat(fundamentals): full skeleton with every feature from Angel/Zerodha/Groww/Screener/Tickertape/Bloomberg |
| `75fe3a6` | feat(scanner): real universe scan + verdict cards + Scan All |
| `45720d9` | fix(data): switch fundamentals to screener.in scrape (yahoo blocked from Render) |
| `f778339` | feat(skeleton): full Financials matrix + reference-app feature surface |

## Sibling product + DB migration

| Commit | Summary |
|---|---|
| `13c3b99` | feat(medupi): Chitti MedUPI v1.4 — master spec + frontend skeleton + backend stubs |
| `5dc82dd` | refactor(db): switch both backends to Supabase · isolate under shares/medupi schemas |

## Chitti's View + Roshan fix

| Commit | Summary |
|---|---|
| `c16088d` | feat(chitti-view): wire DeepSeek to StockChart's existing placeholder + auto-speak |
| `f2bd1a6` | fix(scanner): scan full universe + iloc[-2] last-closed-candle (Roshan spec) |

## Phase 7 agentic surface

| Commit | Summary |
|---|---|
| `3ee1de1` | feat(p1): agentic priority-1 endpoints across all three Chitti products |
| `529eaac` | feat(agent): true tool-calling /api/agent/{tech|fund|medupi}/ask endpoints |
| `06f93d8` | feat(p2): 5D Snowflake + Confidence Dial + Risk-Fit Dial (compute-only) |
| `4ab96a1` | feat(p3): performance vs NIFTY + returns calculator + fix screener D/E + OPM + CR |
| `6d42998` | fix(returns): bypass technical.fetch_candles 365-day cap; pull 2000d direct |
| `c725c22` | fix(screener): accept trailing % in table cells (unblocks OPM % row) |
| `fc17c6c` | feat(meter): per-utterance + per-day DeepSeek cost visible in the UI |

The Phase 7 commits (2026-05-08 → 2026-05-09) reshape the product from "REST routes per feature" to "agent-with-tools": three product agents (Technical / Fundamental / MedUPI) each scoped to their own tool set, plus compute-only differentiators (Snowflake / Confidence / Risk-Fit) that survive DeepSeek rate-limits.
