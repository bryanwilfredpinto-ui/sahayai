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
from database import Base, engine
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
    from services import yahoo_client
    from services.cache import cache as _cache
    sym = unquote(symbol)
    cache_key = f"public_fund:{sym}"
    cached = _cache.get(cache_key)
    if cached:
        return cached
    try:
        raw = yahoo_client.fundamentals(sym) or {}
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"fundamentals error: {e}")
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
    """Create tables and seed initial data. Safe to run repeatedly."""
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
