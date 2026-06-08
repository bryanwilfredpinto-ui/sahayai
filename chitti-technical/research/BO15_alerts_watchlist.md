🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# BO15 — Live Alerts & Watchlist
## Step 1: Research — Top 20 apps + Top 20 AI apps (BEFORE coding), with best practices

Locked process (Sire): per BO research **Top 20 apps + Top 20 AI apps** → document with best practices →
code → test → show. **Users (blind/deaf/illiterate) + 9-language UI = acceptance criteria** — alerts
must be **spoken**, icon-first, colour+icon+number, with the 5-element widget + Vaani dropdown.

**What BO15 does:** a watchlist of stocks the user cares about, each evaluated live for **alerts** —
the signal turned BUY/SELL, price crossed a level the user set, or a chart pattern formed — surfaced
**and spoken**, decluttered. The feature that makes a trader come back daily.

---
## A. 20 alert / watchlist apps — best practice we take

| # | App | Best practice |
|---|---|---|
| 1 | **TradingView** | price + **indicator + drawing** alerts; one-tap from chart |
| 2 | **Zerodha Kite** (India) | price/volume/% alerts + **Sentinel technical-indicator alerts** + **GTT** (persist ≤1yr) |
| 3 | **Kite ATO** (India) | **Alert-Triggers-Order** — alert → action (for us: alert → open the setup) |
| 4 | **Sensibull** (India) | stock alerts within the broker universe |
| 5 | **Tickertape** (India) | watchlist + alerts, prebuilt |
| 6 | **Stock Alarm** | alerts on price/volume/%/**RSI/MA/MACD** across 65k assets |
| 7 | **Webull** | broker-built alerts + free watchlist |
| 8 | **Yahoo Finance** | dead-simple **price-threshold push**, free |
| 9 | **Stocktwits** | watchlist + social alerts |
| 10 | **Stock Rover** | watchlist + scheduled alerts |
| 11 | **Benzinga Pro** | real-time + news-driven alerts |
| 12 | **Investing.com** | price + event alerts |
| 13 | **Seeking Alpha** | alerts on holdings |
| 14 | **Moneycontrol** (India) | retail price alerts |
| 15 | **Google Finance** | lightweight watchlist + alerts |
| 16 | **Screener.in** (India) | saved watchlists |
| 17 | **Delta / Stocktwits portfolio** | portfolio-level alerts |
| 18 | **stockalertapp** | portfolio price alerts |
| 19 | **Winvesta** | cross-market alerts from India |
| 20 | **Thinkorswim** | conditional alerts |

**Distilled:** alert types = **price level cross (above/below)** · % / volume · **technical-indicator /
signal flip** · **pattern-confirmed** · persistent (GTT-style) · **alert → action** (open the setup) ·
free · push instantly · watchlist is the home.
Sources: [Best stock alert apps 2026](https://pro.stockalarm.io/blog/best-stock-alert-apps-2026) · [Kite alerts](https://support.zerodha.com/category/trading-and-markets/alerts-and-nudges/kite-alerts/articles/what-are-kite-alerts-and-how-do-i-use-them) · [Kite Sentinel (indicator alerts)](https://support.zerodha.com/category/trading-and-markets/alerts-and-nudges/kite-alerts/articles/set-a-technical-indicator-based-alert-using-sentinel) · [Kite ATO](https://zerodha.com/z-connect/business-updates/introducing-alert-triggers-order-ato-feature-on-kite) · [Best watchlist apps](https://www.gainify.io/blog/best-stock-watchlist-app)

## B. 20 AI alert apps — best practice (and anti-pattern) we take

| # | App | Best practice we take |
|---|---|---|
| 1 | **Tickeron** | **pattern-confirmed push** + "**Chance of Success %**" per alert (FLMs every few min) |
| 2 | **Danelfin** | **score-change** alerts; factor breakdown (why) |
| 3 | **Trade Ideas (Holly)** | alert carries **entry + exit** |
| 4 | **Kavout** | score-cross alerts |
| 5 | **Zen Ratings** | rating-change alerts |
| 6 | **Prospero.ai** | probability-up alerts |
| 7 | **TradeAlgo** | AI alert with rationale |
| 8 | **TrendSpider** | automated condition alerts (no manual scan) |
| 9 | **KuCoin AI** | bot signal alerts |
| 10 | **Composer** | rule-trigger alerts |
| 11 | **Magnifi** | natural-language alert setup |
| 12 | **Sana / enterprise ML** | calibrated alert thresholds |
| 13 | **Stoxra (India AI)** | NSE AI alerts |
| 14–19 | StockBrokers AI bots, WallStreetZen, VisionVix, TradeAlgo, Seeking Alpha Quant, Tickeron Agents | confidence per alert + **export past signals to review** (→ our scorecard) |
| 20 | **Vaani / Chitti substrate** | **spoken, 9-language, 5-element widget** alerts — nobody does this for blind/illiterate users |

**Big AI lesson:** the winners attach **confidence + a reason** to each alert and let you **review past
alert performance** — but they also **spam** and **hype win-rates (85%) with no calibration**. So we:
attach **our honest confidence** (tied to the calibration BO), **surface only meaningful alerts
(decluttered)**, **speak them**, and **never auto-act** (Golden Rule). Deterministic, no LLM/key.
Sources: [Tickeron](https://tickeron.com/) · [Danelfin](https://danelfin.com/) · [AI technical-analysis tools](https://www.wallstreetzen.com/blog/best-ai-technical-analysis-tools/) · [AI stock pickers](https://money.howstuffworks.com/kavout-best-ai-stock-pickers.htm)

### Anti-patterns we refuse
Alert spam · hyped uncalibrated win-rates · pay-gated alerts · auto-execution · colour-only / text-only.

---
## Step 2: CEOS for THIS BO only — Live Alerts & Watchlist

**Objective:** a private on-device watchlist; each stock evaluated live for meaningful alerts (signal
flip · price-level cross · pattern), surfaced + spoken, decluttered, never auto-acting.

**Engine (no LLM):**
- `evaluateWatch(item, candlesByTf, opts)` → {sym, price, dayChangePct, signal, confidence, alerts[]}.
  alerts: `{type:'signal', dir, confidence, entry, sl, t1}` when directional · `{type:'level', dir:'above'
  /'below', level, price}` when the last bar crosses the user's level · `{type:'pattern', name, dir,
  reliability}` when a chart pattern just formed.
- `scanWatchlist(items, candlesMap, opts)` → per-item evaluation.

**Accessibility (acceptance):** card carries `data-chitti-response` → 5-element widget; each watch row is
icon + symbol + price + signal + alerts (colour **+icon+number**, never colour-only); **"🔊 Read alerts"**
speaks the triggered alerts in the selected language; add/remove are 48px taps; **never auto-acts**
(Golden Rule). Decluttered — only meaningful alerts.

**Languages:** all UI labels in **9 languages** (no Hinglish); stock names stay English; re-render on flip.

**Build steps:** (1) engine `evaluateWatch`/`scanWatchlist` + node tests; (2) Watchlist & Alerts card —
add current symbol (+ optional price level above/below), live rows, "🔊 Read alerts", remove, localStorage;
(3) i18n ×9; (4) Playwright + axe + live cert. **Show Sire; then ask: is this the best I've ever made?**

**Acceptance:** signal/level/pattern alerts fire on fixtures; level cross needs a real prev→current
crossing; watchlist persists; 9-language flip clean; axe 0 serious; box wired; audio reads in language.
