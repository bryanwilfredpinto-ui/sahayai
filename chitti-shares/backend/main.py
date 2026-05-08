"""
main.py
-------
FastAPI app entry point.

Phases 1-6 wired:
  - Auth + Device management (Phase 1)
  - Indices + Market view (Phase 2)
  - Stocks + Fundamentals (Phase 3)
  - Technical + Custom rules + Calls (Phase 4)
  - Watchlist + Alerts + Portfolio + Chat (Phase 5)
  - Stock universe seed + Specialists + Quota tracking + Cron (Phase 6)

On startup:
  - Creates DB tables (safe, idempotent)
  - Seeds Nifty 500 universe on first run
  - Loads stock specialists config from config/stock_specialists.json
"""

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from database import Base, engine, ensure_schema
import models  # noqa: F401  (registers models with Base.metadata)
from routes import (
    auth, market, user, stocks, technical, portfolio, chat,
    quota, specialists, cron,
)
from services.usage_tracker import CapExceeded

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("main")

app = FastAPI(
    title="Chitti Shares API",
    version="1.0.0-phase6",
    description="Chitti Shares - Phases 1-6 (auth, market, fundamentals, technical, portfolio, specialists, quota)",
)

# Allowed origins: local dev + production frontend
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "https://chitti-shares-web.onrender.com",
    "https://sahayai.in",
    "https://www.sahayai.in",
    "https://bryanwilfredpinto-ui.github.io",
    settings.FRONTEND_URL,
]
allowed_origins = list({o for o in allowed_origins if o})

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Public NSE healthcheck (no auth needed; for debugging cloud IP blocks) ----

@app.get("/debug/nse")
def debug_nse():
    """
    Public endpoint. Hits NSE directly from this server and returns the
    raw NIFTY 50 + SENSEX numbers. Use this to verify whether NSE is
    reachable from Render's IPs WITHOUT going through auth.
    """
    from services import nse_client
    health = nse_client.healthcheck()
    sample = {}
    if health.get("ok"):
        try:
            sample = nse_client.get_index_quote([
                "NSE:NIFTY 50", "BSE:SENSEX", "NSE:BANKNIFTY",
            ])
        except Exception as e:  # noqa: BLE001
            sample = {"error": str(e)}
    return {"healthcheck": health, "sample_quotes": sample}

@app.get("/debug/angel")
def debug_angel():
    from services import angel_client
    return angel_client.healthcheck()

@app.get("/api/technical/{symbol:path}")
def api_technical(symbol: str, indicators: str = ""):
    """
    Get full technical analysis for a symbol.
    symbol: e.g. NSE:RELIANCE, NSE:NIFTY 50, BSE:SENSEX
    indicators: optional comma-separated list, e.g. "RSI,MACD,Roshan Indicator"
                If empty, runs all indicators.
    """
    from services import technical
    ind_list = [s.strip() for s in indicators.split(",") if s.strip()] or None
    try:
        return technical.technical_report(symbol, indicators=ind_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scan/roshan")
def api_scan_roshan(call: str = "Positional", universe: str = "nifty50",
                   max_stocks: int = 0, force: bool = False):
    from services import scanner
    try:
        return scanner.scan_roshan(
            call=call,
            universe_name=universe,
            max_stocks=(max_stocks or None),
            force_refresh=force,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/scan/{indicator:path}")
def api_scan_indicator(indicator: str, call: str = "Positional",
                       universe: str = "nifty50", max_stocks: int = 0,
                       force: bool = False,
                       tf1: str = "", tf2: str = "", pullback: str = ""):
    """
    Generic scanner for ANY indicator from technical.py.
    indicator: URL-encoded indicator name e.g. MACD, Force+Index, RSI
    call: Long-term | Positional | Swing | Intraday | Custom
    tf1, tf2, pullback: used when call=Custom (e.g. tf1=Daily&tf2=4H&pullback=1H)
    universe: nifty50 | largecap | midcap | smallcap | microcap
    """
    from services import scanner
    try:
        return scanner.scan_indicator(
            indicator=indicator,
            call=call,
            universe_name=universe,
            max_stocks=(max_stocks or None),
            force_refresh=force,
            custom_tf1=tf1 or None,
            custom_tf2=tf2 or None,
            custom_pullback=pullback or None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/scan/cache")
def api_scan_cache():
    """Diagnostic: what's currently cached."""
    from services import scanner
    return scanner.cache_status()


@app.get("/api/levels/{symbol:path}")
def api_levels(symbol: str, timeframe: str = "Daily"):
    """
    Auto-computed support/resistance + trendlines for a symbol/timeframe.
    Used by StockChart to draw colored horizontal lines and trendlines.
    """
    from services import levels
    try:
        return levels.compute_levels(symbol, timeframe)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/candles/{symbol:path}")
def api_candles(symbol: str, timeframe: str = "Daily", days_back: int = 180):
    """
    OHLCV candles for a symbol on a given timeframe.
    Used by the StockChart page (lightweight-charts).
    timeframe: Monthly | Weekly | Daily | 4H | 1H | 15min | 5min | 1min
    days_back: how many candles back from latest (default 180)

    Intraday timeframes (15min/5min/1min) route through services.intraday_candles
    for direct Angel One fetches; everything else uses services.technical.
    """
    from services import technical, intraday_candles
    try:
        if intraday_candles.is_intraday_timeframe(timeframe):
            df = intraday_candles.fetch_intraday_candles(symbol, timeframe).tail(days_back)
        else:
            df = technical.fetch_candles(symbol, timeframe).tail(days_back)
        return [
            {
                "time": int(t.timestamp()),
                "open": float(row.open),
                "high": float(row.high),
                "low": float(row.low),
                "close": float(row.close),
                "volume": float(row.volume) if hasattr(row, "volume") else 0.0,
            }
            for t, row in df.iterrows()
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/fundamentals/{symbol:path}")
def api_fundamentals(symbol: str):
    """
    Public unauthenticated fundamentals endpoint for the in-chart
    Fundamentals section of chitti_complete_technical.html.

    Mirrors what Angel One Overview / Zerodha Kite Fundamentals / Groww
    show on a stock page: identity, 52W H/L, P/E, P/B, EPS, dividend
    yield, D/E, ROE, ROCE, plus last 4 quarters revenue + net profit.

    Promoter / FII / DII shares need an NSE/BSE scrape (yfinance does
    not expose these); returned as None for now and the frontend shows
    "Coming soon" so the slot is reserved.
    """
    from urllib.parse import unquote
    from services import screener_client, yahoo_client
    from services.cache import cache as _cache
    sym = unquote(symbol)
    cache_key = f"public_fund:{sym}"
    cached = _cache.get(cache_key)
    if cached:
        return cached
    # Primary: screener.in scrape (works from Render IPs).
    # Fallback: yahoo (works locally; blocked from Render but kept for completeness).
    raw: dict = {}
    try:
        raw = screener_client.fundamentals(sym) or {}
    except Exception as e:  # noqa: BLE001
        raw = {}
    if not raw.get("name"):
        try:
            raw = yahoo_client.fundamentals(sym) or raw
        except Exception:  # noqa: BLE001
            pass
    if not raw.get("name"):
        raise HTTPException(status_code=502, detail=f"fundamentals unavailable for {sym}")
    qts: list = []
    try:
        qts = screener_client.quarterly(sym, num_quarters=8) or []
    except Exception:  # noqa: BLE001
        qts = []
    if not qts:
        try:
            qts = yahoo_client.quarterly(sym, num_quarters=8) or []
        except Exception:  # noqa: BLE001
            qts = []
    out = {
        "symbol": sym,
        "name": raw.get("name"),
        "sector": raw.get("sector"),
        "industry": raw.get("industry"),
        "price": raw.get("price"),
        "market_cap": raw.get("market_cap"),
        "fifty_two_week_high": raw.get("fifty_two_week_high"),
        "fifty_two_week_low": raw.get("fifty_two_week_low"),
        "pe": raw.get("pe"),
        "forward_pe": raw.get("forward_pe"),
        "pb": raw.get("pb"),
        "eps": raw.get("eps"),
        "dividend_yield": raw.get("dividend_yield"),
        "debt_to_equity": raw.get("debt_to_equity"),
        "roe": raw.get("roe"),
        "roa": raw.get("roa"),
        "roce": raw.get("roce"),
        "profit_margin": raw.get("profit_margin"),
        "operating_margin": raw.get("operating_margin"),
        "current_ratio": raw.get("current_ratio"),
        "quick_ratio": raw.get("quick_ratio"),
        "book_value": raw.get("book_value"),
        "beta": raw.get("beta"),
        "ev_to_ebitda": raw.get("ev_to_ebitda"),
        "peg_ratio": raw.get("peg_ratio"),
        "shares_outstanding": raw.get("shares_outstanding"),
        "revenue_growth": raw.get("revenue_growth"),
        "earnings_growth": raw.get("earnings_growth"),
        # Shareholding — Coming Soon, NSE/BSE shareholding scrape pending
        "promoter_holding": None,
        "fii_holding": None,
        "dii_holding": None,
        "public_holding": None,
        "mf_holding": None,
        "pledged_pct": None,
        "quarterly": qts,
    }
    _cache.set(cache_key, out, 60 * 60)  # 1 hr
    return out


@app.get("/api/news/market")
def api_news_market(limit: int = 20):
    """
    Top market-moving headlines for the in-app News tab in
    chitti_fundamentals.html. Public, unauthenticated. 10 min cache.

    Sources: Moneycontrol RSS (primary), LiveMint RSS, BSE corporate
    filings RSS, NSE corporate announcements JSON. Failures are silent.
    """
    from services import news_client
    items = news_client.fetch_market_news(limit=max(1, min(limit, 50)))
    return {"items": items, "count": len(items)}


@app.get("/api/fundamental-scan")
def api_fundamental_scan(universe: str = "nifty50", strategy: str = "buffett",
                         max_stocks: int = 0):
    """
    Apply an investing strategy filter across a stock universe and return
    matched stocks with key metrics + STRONG BUY / BUY / HOLD verdict.

    universe: nifty50 | largecap | midcap | smallcap | microcap | all
    strategy: buffett | munger | graham | lynch | fisher | greenblatt |
              pabrai | marks | rj | kedia | rkd | rmd | ns | hdfc |
              mirae | motilal | jpm | gs | cs1 | cs2 | cs3 | cs4 |
              pli | china1 | infra | green | defence | digital |
              div-aristo | turnaround | insider | debt-free | hidden
    max_stocks: 0 = scan everything (default), N = cap to first N symbols.

    Public, unauthenticated. Concurrent fetch with cached fundamentals
    (same `public_fund:{symbol}` key as /api/fundamentals/{symbol}).
    """
    from services import fundamental_scanner
    return fundamental_scanner.scan(
        universe=universe.lower().strip(),
        strategy=strategy.lower().strip(),
        max_stocks=max(0, min(max_stocks, 500)),
    )


@app.get("/api/fundamental-scan/strategies")
def api_fundamental_scan_strategies():
    """List every strategy slug + plain-English name + any caveat note."""
    from services import fundamental_scanner
    return {"strategies": fundamental_scanner.all_strategies()}


# ════════════════════════════════════════════════════════════════════
# CHITTI MedUPI — public, unauthenticated endpoints
# Spec: CHITTI_MEDUPI_MASTER_SPEC.md (workspace root)
# ════════════════════════════════════════════════════════════════════

@app.get("/api/medupi/medicine/{name}")
def api_medupi_medicine(name: str):
    """Lookup a medicine by name (typed or spoken). Returns brand + composition + risk."""
    from services import medupi_recognition
    return medupi_recognition.recognise_text(name)


@app.get("/api/medupi/alternatives")
def api_medupi_alternatives(molecule: str, strength: str, dosage_form: str, current_brand: str = ""):
    """
    Same-composition equivalents. STRICT: same molecule + same strength + same dosage form ONLY.
    Returns alternatives + risk classification + disclaimer.
    """
    from services import medupi_alternatives
    return medupi_alternatives.find(molecule, strength, dosage_form, current_brand)


@app.get("/api/medupi/risk/{molecule}")
def api_medupi_risk(molecule: str):
    """Classify a molecule as HIGH / MEDIUM / LOW risk for substitution."""
    from services import medupi_risk
    return medupi_risk.classify(molecule)


@app.get("/api/medupi/jan_aushadhi")
def api_medupi_jan_aushadhi(lat: float, lng: float, radius_km: float = 5.0, limit: int = 10):
    """Find Jan Aushadhi stores within radius_km of the given lat/lng."""
    from services import medupi_jan_aushadhi
    items = medupi_jan_aushadhi.find_nearby(lat, lng, radius_km=max(0.1, min(radius_km, 50.0)), limit=max(1, min(limit, 50)))
    return {"items": items, "count": len(items), "centre": {"lat": lat, "lng": lng}, "radius_km": radius_km}


@app.get("/api/news/stock/{symbol:path}")
def api_news_stock(symbol: str, limit: int = 10):
    """
    Headlines that mention the given stock symbol. Public, unauthenticated.
    Substring match on the headline + exact match on the source's symbol field.
    """
    from urllib.parse import unquote
    from services import news_client
    sym = unquote(symbol)
    items = news_client.fetch_stock_news(sym, limit=max(1, min(limit, 25)))
    return {"items": items, "count": len(items), "symbol": sym}


from pydantic import BaseModel


class ChittiViewInput(BaseModel):
    timeframe: str
    rsi: float | None = None
    macd_signal: str | None = None       # "bullish" / "bearish" / "neutral"
    trend: str | None = None             # "uptrend" / "downtrend" / "sideways"
    price: float | None = None
    ma50: float | None = None
    ma200: float | None = None


@app.post("/api/chitti-view/{symbol:path}")
async def api_chitti_view(symbol: str, payload: ChittiViewInput):
    """
    Plain-English BUY / SELL / HOLD verdict + 2-3-sentence summary for the
    given stock at the given timeframe. Calls services.deepseek_client.

    Built for the Chitti's View card in StockChart.jsx — auto-read aloud
    by the frontend on arrival (user may be blind, illiterate, or elderly).
    """
    from urllib.parse import unquote
    import re
    from services import deepseek_client
    sym = unquote(symbol)

    system = (
        "You are Chitti, a friendly AI assistant for Indian retail investors. "
        "The user may be blind, illiterate, or elderly. "
        "Give a BUY / SELL / HOLD verdict in exactly 2-3 simple sentences. "
        "No jargon. No numbers unless essential. "
        "If timeframe is 1H/4H/Daily → this is a short-term trader. "
        "If timeframe is Weekly/Monthly → this is a long-term investor. "
        "Always end with one action sentence: what to watch for. "
        "Begin your response with the single word BUY, SELL, or HOLD followed by a period."
    )

    parts = [f"Stock: {sym}", f"Timeframe: {payload.timeframe}"]
    if payload.rsi is not None:           parts.append(f"RSI(14): {payload.rsi:.1f}")
    if payload.macd_signal:               parts.append(f"MACD signal: {payload.macd_signal}")
    if payload.trend:                     parts.append(f"Trend: {payload.trend}")
    if payload.price is not None:         parts.append(f"Price: ₹{payload.price:.2f}")
    if payload.ma50 is not None:          parts.append(f"50-period MA: ₹{payload.ma50:.2f}")
    if payload.ma200 is not None:         parts.append(f"200-period MA: ₹{payload.ma200:.2f}")
    user = "\n".join(parts) + "\n\nGive your verdict and 2-3 sentence plain-English summary."

    try:
        text = await deepseek_client.chat(system, user, max_tokens=200, temperature=0.7)
    except deepseek_client.DeepSeekError as e:
        raise HTTPException(status_code=502, detail=f"chitti-view DeepSeek error: {e}")
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"chitti-view error: {e}")

    m = re.search(r"\b(BUY|SELL|HOLD)\b", (text or "").upper())
    verdict = m.group(1) if m else "HOLD"

    return {
        "verdict": verdict,
        "summary": (text or "").strip(),
        "language": "en",
    }


from fastapi import Body, HTTPException


@app.post("/debug/ingest-indices")
def ingest_indices(payload: dict = Body(...)):
    from config import settings
    from models.index_quote import IndexQuote
    from database import SessionLocal
    from datetime import datetime as _dt, timezone as _tz
    secret = payload.get("secret")
    if not secret or secret != settings.CRON_SECRET:
        raise HTTPException(status_code=401, detail="Bad or missing secret")
    quotes = payload.get("quotes") or []
    if not isinstance(quotes, list):
        raise HTTPException(status_code=400, detail="quotes must be a list")
    db = SessionLocal()
    try:
        upserted = 0
        for q in quotes:
            canonical = q.get("canonical")
            if not canonical:
                continue
            row = db.query(IndexQuote).filter(IndexQuote.canonical == canonical).first()
            if row is None:
                row = IndexQuote(canonical=canonical)
                db.add(row)
            row.last_price = q.get("last_price")
            row.prev_close = q.get("prev_close")
            row.day_open = q.get("day_open")
            row.day_high = q.get("day_high")
            row.day_low = q.get("day_low")
            row.change = q.get("change")
            row.pchange = q.get("pchange")
            row.updated_at = _dt.now(_tz.utc)
            upserted += 1
        db.commit()
        return {"ok": True, "upserted": upserted}
    finally:
        db.close()


# ---- Index ingest from external source (laptop pusher script) ----
# Workaround for cloud IP blocks: user's laptop fetches NSE and POSTs here.

from fastapi import Body, HTTPException


@app.post("/debug/ingest-indices")
def ingest_indices(payload: dict = Body(...)):
    """
    Accepts:  {"secret": "...", "quotes": [{"canonical": "NSE:NIFTY 50",
              "last_price": 24300.5, "prev_close": 24250.0, ...}, ...]}
    Stores each quote in the index_quotes table (upsert).
    Auth: simple shared secret (CRON_SECRET env var).
    """
    from config import settings
    from models.index_quote import IndexQuote
    from database import SessionLocal
    from datetime import datetime as _dt, timezone as _tz

    secret = payload.get("secret")
    if not secret or secret != settings.CRON_SECRET:
        raise HTTPException(status_code=401, detail="Bad or missing secret")
    quotes = payload.get("quotes") or []
    if not isinstance(quotes, list):
        raise HTTPException(status_code=400, detail="quotes must be a list")

    db = SessionLocal()
    try:
        upserted = 0
        for q in quotes:
            canonical = q.get("canonical")
            if not canonical:
                continue
            row = db.query(IndexQuote).filter(IndexQuote.canonical == canonical).first()
            if row is None:
                row = IndexQuote(canonical=canonical)
                db.add(row)
            row.last_price = q.get("last_price")
            row.prev_close = q.get("prev_close")
            row.day_open = q.get("day_open")
            row.day_high = q.get("day_high")
            row.day_low = q.get("day_low")
            row.change = q.get("change")
            row.pchange = q.get("pchange")
            row.updated_at = _dt.now(_tz.utc)
            upserted += 1
        db.commit()
        return {"ok": True, "upserted": upserted}
    finally:
        db.close()



# =====================================================================
# PHASE 7 — AGENTIC PRIORITY 1 ENDPOINTS
# Composite scoring + watchlist quotes + financials + CAGR + shareholding
# + medupi cart simulator. Each endpoint wraps an existing service module
# (services/strength.py, /fundamentals_extras.py, /medupi_cart.py, etc.).
# =====================================================================

@app.get("/api/strength/{symbol:path}")
def api_strength(symbol: str, timeframe: str = "Daily"):
    """Composite signal strength (0-10) + confluence breakdown for one TF."""
    from urllib.parse import unquote
    from services import strength
    from fastapi import HTTPException as _HE
    try:
        return strength.signal_strength(unquote(symbol), timeframe=timeframe)
    except Exception as e:  # noqa: BLE001
        raise _HE(status_code=500, detail=str(e))


@app.get("/api/rating-table/{symbol:path}")
def api_rating_table(symbol: str):
    """STRONG BUY / BUY / NEUTRAL / SELL / STRONG SELL across all timeframes."""
    from urllib.parse import unquote
    from services import strength
    from fastapi import HTTPException as _HE
    try:
        return strength.rating_table(unquote(symbol))
    except Exception as e:  # noqa: BLE001
        raise _HE(status_code=500, detail=str(e))


@app.get("/api/quotes")
def api_quotes(symbols: str = ""):
    """
    Batch live quotes for a watchlist. ?symbols=NSE:RELIANCE,NSE:TCS,...
    Returns {symbol: {last_price, change, pchange, ...}}.
    """
    from services import angel_client
    syms = [s.strip() for s in symbols.split(",") if s.strip()]
    if not syms:
        return {}
    return angel_client.get_quote(syms)


@app.get("/api/financials/{symbol:path}")
def api_financials(symbol: str):
    """
    Full financial statements matrix from screener.in:
      quarterly P&L, half-yearly P&L (derived), annual P&L + BS + CF.
    """
    from urllib.parse import unquote
    from services import screener_client
    from fastapi import HTTPException as _HE
    sym = unquote(symbol)
    try:
        out = screener_client.financials(sym)
    except Exception as e:  # noqa: BLE001
        raise _HE(status_code=502, detail=f"financials scrape failed: {e}")
    if not out or not out.get("name"):
        raise _HE(status_code=502, detail=f"financials unavailable for {sym}")
    return out


@app.get("/api/cagr/{symbol:path}")
def api_cagr(symbol: str):
    """3Y / 5Y / 10Y CAGR for Sales, Operating Profit, Net Profit."""
    from urllib.parse import unquote
    from services import fundamentals_extras
    from fastapi import HTTPException as _HE
    try:
        return fundamentals_extras.cagr(unquote(symbol))
    except Exception as e:  # noqa: BLE001
        raise _HE(status_code=502, detail=f"cagr compute failed: {e}")


@app.get("/api/shareholding/{symbol:path}")
def api_shareholding(symbol: str):
    """
    Quarterly shareholding pattern (Promoter / FII / DII / Public) from
    screener.in. Empty dict if section is unavailable for the ticker.
    """
    from urllib.parse import unquote
    from services import screener_client
    return screener_client.shareholding(unquote(symbol)) or {}


@app.post("/api/medupi/cart-simulator")
def api_medupi_cart(payload: dict = None):  # type: ignore[assignment]
    """
    Optimised cart simulator — drop a list of monthly meds, get the cheapest
    same-composition equivalent cart + monthly + annual savings.
    Body: {"items": [{molecule, strength, dosage_form, monthly_qty, current_price, current_brand?}, ...]}
    """
    from services import medupi_cart
    from fastapi import HTTPException as _HE
    items = (payload or {}).get("items") or []
    if not isinstance(items, list):
        raise _HE(status_code=400, detail="items must be a list")
    return medupi_cart.simulate(items)


@app.get("/api/medupi/family/wallet")
def api_medupi_family_wallet():
    """
    Family Wallet preview — aggregate monthly spend per profile.
    SKELETON: full multi-profile DB schema is in CHITTI_MEDUPI_MASTER_SPEC §13.
    Returns sample shape so frontend can wire UI now; live data wires once
    the family-profile + medupi_log tables land.
    """
    from datetime import datetime
    return {
        "ok": True,
        "as_of": datetime.now().date().isoformat(),
        "members": [
            {"id": "self",   "label": "Self",          "monthly_spend": 0, "monthly_savings": 0, "chronic_meds": []},
            {"id": "spouse", "label": "Spouse",        "monthly_spend": 0, "monthly_savings": 0, "chronic_meds": []},
            {"id": "child1", "label": "Child 1",       "monthly_spend": 0, "monthly_savings": 0, "chronic_meds": []},
            {"id": "parent", "label": "Parent",        "monthly_spend": 0, "monthly_savings": 0, "chronic_meds": []},
        ],
        "totals": {"monthly_spend": 0, "monthly_savings": 0, "annual_projection": 0},
        "status": "skeleton",
        "next": "wire family_profile + medupi_log tables (master spec §13).",
    }


@app.get("/api/medupi/insurance-match")
def api_medupi_insurance_match(molecule: str, scheme: str = "ayushman"):
    """
    Skeleton: which scheme covers which medicine.
    Real coverage tables (Ayushman / CGHS / ESI / private) seed once the
    NPPA + scheme catalogue is loaded (master spec §13).
    """
    scheme = (scheme or "").lower().strip()
    coverage = {
        "ayushman": {"covered": True, "ceiling_per_year_inr": 500000, "notes": "PMJAY hospital-stay covers in-patient meds; OPD usually not."},
        "cghs":     {"covered": True, "ceiling_per_year_inr": None,   "notes": "Coverage subject to CGHS empanelment + scheme rules."},
        "esi":      {"covered": True, "ceiling_per_year_inr": None,   "notes": "ESIC hospital + dispensary supply."},
        "private":  {"covered": None, "ceiling_per_year_inr": None,   "notes": "Depends on plan rider; check insurer policy schedule."},
    }
    info = coverage.get(scheme) or {"covered": None, "notes": "Unknown scheme."}
    return {
        "molecule": molecule,
        "scheme": scheme,
        **info,
        "status": "skeleton",
        "next": "seed scheme catalogue (master spec §13).",
    }


@app.get("/api/medupi/jan_aushadhi/stock")
def api_medupi_jan_aushadhi_stock(store_id: str, molecule: str, strength: str = "", dosage_form: str = ""):
    """
    Skeleton: stock-availability check at a Jan Aushadhi store.
    Live wiring requires JAK store-level inventory feed (not yet exposed
    publicly). Returns 'unknown' until that lands.
    """
    return {
        "store_id": store_id,
        "molecule": molecule,
        "strength": strength,
        "dosage_form": dosage_form,
        "in_stock": None,
        "as_of": None,
        "status": "skeleton",
        "next": "wire JAK store-level inventory feed once available.",
    }


# =====================================================================
# PHASE 7B — AGENTIC /ask ENDPOINTS (true tool-calling loop)
# DeepSeek tools API; agent_runtime.run_agent orchestrates the
# LLM-pick-tool / execute / loop / synthesise cycle. One endpoint per
# product, each scoped to its own tool set so personalities stay clean.
# =====================================================================

@app.post("/api/agent/technical/ask")
async def api_agent_technical_ask(payload: dict = None):  # type: ignore[assignment]
    from services import agent_runtime, agent_tools
    q = ((payload or {}).get("question") or "").strip()
    if not q:
        from fastapi import HTTPException as _HE
        raise _HE(status_code=400, detail="question is required")
    return await agent_runtime.run_agent(
        agent_tools.TECHNICAL_SYSTEM, q,
        agent_tools.TECHNICAL_TOOLS, agent_tools.TECHNICAL_EXECUTORS,
        max_steps=int((payload or {}).get("max_steps") or 6),
    )


@app.post("/api/agent/fundamental/ask")
async def api_agent_fundamental_ask(payload: dict = None):  # type: ignore[assignment]
    from services import agent_runtime, agent_tools
    q = ((payload or {}).get("question") or "").strip()
    if not q:
        from fastapi import HTTPException as _HE
        raise _HE(status_code=400, detail="question is required")
    lens = ((payload or {}).get("lens") or "buffett").lower().strip()
    user = f"[Investor lens: {lens}] {q}"
    return await agent_runtime.run_agent(
        agent_tools.FUNDAMENTAL_SYSTEM, user,
        agent_tools.FUNDAMENTAL_TOOLS, agent_tools.FUNDAMENTAL_EXECUTORS,
        max_steps=int((payload or {}).get("max_steps") or 6),
    )


@app.post("/api/agent/medupi/ask")
async def api_agent_medupi_ask(payload: dict = None):  # type: ignore[assignment]
    from services import agent_runtime, agent_tools
    q = ((payload or {}).get("question") or "").strip()
    if not q:
        from fastapi import HTTPException as _HE
        raise _HE(status_code=400, detail="question is required")
    return await agent_runtime.run_agent(
        agent_tools.MEDUPI_SYSTEM, q,
        agent_tools.MEDUPI_TOOLS, agent_tools.MEDUPI_EXECUTORS,
        max_steps=int((payload or {}).get("max_steps") or 6),
    )


# ---- Global exception handler for budget cap ----

@app.exception_handler(CapExceeded)
async def cap_exceeded_handler(_request: Request, exc: CapExceeded):
    return JSONResponse(
        status_code=503,
        content={
            "detail": str(exc),
            "code": "BUDGET_CAP_EXCEEDED",
        },
    )


@app.on_event("startup")
def on_startup():
    """Create schema (Postgres) + tables + seed initial data. Safe to run repeatedly."""
    try:
        ensure_schema()
    except Exception as e:  # noqa: BLE001
        log.warning("ensure_schema skipped: %s", e)
    Base.metadata.create_all(bind=engine)
    # Seed Nifty 500 stock universe (idempotent)
    try:
        from services.stock_universe import seed_if_empty
        seed_if_empty()
    except Exception as e:  # noqa: BLE001
        log.warning("Stock universe seed skipped: %s", e)
    # Start in-process scheduler (replaces external cron jobs)
    try:
        from services.scheduler import start as start_scheduler
        start_scheduler()
    except Exception as e:  # noqa: BLE001
        log.warning("Scheduler failed to start: %s", e)


@app.on_event("shutdown")
def on_shutdown():
    try:
        from services.scheduler import stop as stop_scheduler
        stop_scheduler()
    except Exception:
        pass


@app.get("/")
def root():
    return {
        "app": "Chitti Shares API",
        "version": "1.0.0-phase6",
        "status": "ok",
    }


@app.get("/health")
def health():
    """Lightweight check used by Render + frontend wake-up ping."""
    return {"ok": True}


# Mount routers (44 + new = ~60 routes)
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(market.router)
app.include_router(stocks.router)
app.include_router(technical.router_tech)
app.include_router(technical.router_calls)
app.include_router(portfolio.router_watchlist)
app.include_router(portfolio.router_alerts)
app.include_router(portfolio.router_portfolio)
app.include_router(chat.router)
app.include_router(quota.router)
app.include_router(specialists.router)
app.include_router(cron.router)
