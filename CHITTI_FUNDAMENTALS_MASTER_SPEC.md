# Chitti Fundamentals — Master Spec

**Last updated:** 2026-05-08
**Frontend:** `chitti_fundamentals.html` → live at `https://sahayai.in/chitti_fundamentals.html`
**Backend:** FastAPI on Render → `chitti-shares-api.onrender.com`
**Persona:** Teacher — patient, plain-English, always explains *why* a number matters. Hindi-ready.

---

## 1. Mission

Demystify Indian-equity fundamentals for the four-user audience (Blind, Deaf, Mute, Illiterate). Investor-lens parameter (Buffett / Lynch / Graham / Greenblatt) so the same numbers produce different verdicts. Free-tier-only data — no Bloomberg / Refinitiv / Tickertape API.

## 2. Standing rules (non-negotiable)

1. **NOT SEBI Registered** — sticky banner top of page; full-text modal opens with the disclaimer; English + Hindi versions.
2. **Yahoo Finance is BLOCKED** from Render IPs. Primary: `services/screener_client.py` (screener.in scrape). Fallback: `yahoo_client` (local-dev only).
3. **Bharat Premium theme** — saffron `#E86A17` / navy `#0E2344` / gold `#D4AF37` / cream `#f8f4ee`. White rounded 18px cards. Saffron CTAs.
4. **Four-user contract on every control** — Blind (aria + 🔊), Deaf (▲▼ + word labels — never colour-only), Mute (tap-only), Illiterate (🎤 mic + plain English caption + page-wide Hindi toggle via `_chittiLang`).
5. **Free-tier only** — no paid market-data APIs.
6. **Investor lens always present** — every verdict must declare which lens produced it.

## 3. What is LIVE today

| Block | Source | Endpoint |
|---|---|---|
| Identity (name / sector / market-cap / 52W H/L) | screener.in | `/api/fundamentals/{symbol}` |
| Top ratios (P/E, P/B, EPS, ROE, ROCE, D/E, dividend yield) | screener.in | same |
| Quarterly Results table (Revenue / Net Profit / Operating Profit / OPM) | screener.in | same (last 4-8 quarters) |
| Revenue / Profit / Operating Profit charts | derived from quarterly | same |
| Margins & Growth | derived | same |
| Profitability / Leverage / Liquidity ratios | screener.in | same |
| News Feed + Chitti's Take | Moneycontrol/LiveMint RSS | `/api/news/stock/{symbol}` |
| Ask Chitti Fundamentals (Q&A) | Anthropic | `/api/chat/fundamentals` |
| **Full financials matrix (annual P&L + BS + CF, quarterly P&L)** | screener.in | `/api/financials/{symbol}` *(P1 — 2026-05-08)* |
| **3y / 5y / 10y CAGR (Sales / OP / Net Profit)** | derived from yearly P&L | `/api/cagr/{symbol}` *(P1 — 2026-05-08)* |
| **Quarterly shareholding pattern** | screener.in | `/api/shareholding/{symbol}` *(P1 — 2026-05-08)* |
| **Universe screener (Buffett / Lynch / Graham / Greenblatt / etc.)** | derived | `/api/fundamental-scan?strategy=` |

## 4. What is PENDING (priority order)

### Priority 2 — Chitti differentiators

1. **Story Mode** — 60-second audio narrative of the company (DeepSeek + browser TTS). Triggered from a single button on the Overview tab. Hindi + English.
2. **Risk-Fit Dial** — filter stocks by user persona (Conservative / Moderate / Aggressive). "Would this fit a retiree's portfolio?"
3. **Confidence Dial** — verdict confidence (0-10) with reasoning from multiple ratios.
4. **5D Snowflake radar** — Value / Growth / Quality / Health / Income (Simply-Wall-St style). Each axis 0-10.
5. **Plain-English Compare** — *"Reliance is 5× bigger than ITC, but ITC pays 7× more dividend."* Anthropic-generated from peer comparison.

### Priority 3 — Investor analytics

6. **Performance vs NIFTY 50** table — 1M / 6M / 1Y / 3Y / 5Y / 10Y, alpha vs index.
7. **Returns Calculator** — lumpsum + SIP simulator vs NIFTY vs Bank FD.
8. **Sector Peer Comparison** — P/E / ROE / Rev growth / D/E / Mcap table for sector peers.
9. **Tickertape composite scorecard** scoring engine.
10. **Trendlyne DVM** scoring (Durability / Valuation / Momentum).
11. **Pros / Cons auto-generator** — Anthropic-summarised from financials + news.
12. **SWOT auto-generator** — same.
13. **DCF calculator** — analyst-grade DCF with sensitivity table.
14. **Top-10 institutional holders + KMP wiring** — needs NSE/BSE shareholding scrape (separate from screener.in's quarterly aggregate).
15. **Earnings calendar live data** — date + EPS estimate + actual.

### Priority 4 — Agentic surface

16. **`POST /api/agent/fundamental/ask`** — natural-language question + lens parameter, runs Anthropic with tool-use loop, returns synthesised verdict + citations. Tools: `get_pe_ratio`, `get_pb_ratio`, `get_roe`, `get_debt_to_equity`, `get_revenue_growth`, `get_cagr`, `get_shareholding`, `get_quarterly_pl`, `compare_with_peers`.

## 5. Data-source cheat-sheet

| Source | Status | Use for |
|---|---|---|
| screener.in (HTML scrape) | LIVE | Ratios, financials, quarterly, shareholding |
| Moneycontrol RSS | LIVE | News (primary) |
| LiveMint RSS | LIVE | News (secondary) |
| Anthropic API | LIVE | Q&A, narrative, SWOT/Pros-Cons (when wired) |
| DeepSeek | LIVE | Story Mode narrative + voice synthesis (when wired) |
| Yahoo Finance | LOCAL-DEV ONLY | Backup; blocked from Render |
| NSE/BSE corporate-action feed | NOT WIRED | Dividends / splits / bonus / rights |
| AMFI MF holdings | NOT WIRED | Top MF holders block |
| AMFI / NSE shareholding | NOT WIRED | Granular shareholder list |

## 6. File layout

| Layer | Path |
|---|---|
| Frontend | `chitti_fundamentals.html` (single-file, theme overlay at end of `<style>`) |
| Backend root | `chitti-shares/backend/` |
| Scrape + ratios | `services/screener_client.py` |
| CAGR + derived metrics | `services/fundamentals_extras.py` |
| Universe screener | `services/fundamental_scanner.py` |
| News | `services/news_client.py` |
| Routes | `main.py` (top-level) — `/api/fundamentals`, `/api/financials`, `/api/cagr`, `/api/shareholding`, `/api/fundamental-scan`, `/api/news/...` |

## 7. Verdict shape (every endpoint that produces a "view")

```json
{
  "symbol": "NSE:RELIANCE",
  "lens": "buffett",
  "verdict": "QUALITY-AT-FAIR-PRICE",
  "score": 7.2,
  "why": [
    "ROE 8.5% — below Buffett's 15% threshold",
    "D/E 0.42 — comfortable",
    "5y net-profit CAGR 12% — steady",
    "P/E 28 — rich vs growth rate",
    "Promoter holding 50.3%, no pledge"
  ],
  "disclaimer": "NOT SEBI Registered. Educational tool only, not investment advice."
}
```

## 8. Push workflow

Same as Technical / MedUPI:
1. `git fetch origin` (Bryan's Colab may have pushed)
2. If diverged → `git branch backup-$(date +%F)` → `git reset --hard origin/main` → `git cherry-pick`
3. `git -c user.email=... -c user.name=... commit`
4. `git push origin main`
5. Verify live: `curl -sS "https://chitti-shares-api.onrender.com/api/financials/NSE:RELIANCE" | head -c 400`

## 9. Communication

Bryan deploys via Colab. Don't drip-feed. Verify live before saying "live". Skeleton-first must be exhaustive — ship the full feature surface in commit #1 with `Coming Soon` amber badges; never hide unbuilt features.
