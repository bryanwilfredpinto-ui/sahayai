"""
routes/stocks.py
----------------
All authenticated.

  GET  /api/stocks/resolve?q=...        - look up a symbol
  GET  /api/stocks/{symbol}/quote       - LTP + day OHLC
  GET  /api/stocks/{symbol}/fundamentals - scorecard (Phase 3)
  GET  /api/stocks/{symbol}/quarterly   - last N quarters (Phase 3)
  GET  /api/stocks/{symbol}/history?days=&interval=  - OHLC candles

Symbol path-param uses URL-encoded canonical form, e.g. "NSE:RELIANCE".
Frontend should encodeURIComponent.
"""

import logging
from urllib.parse import unquote

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from services import scorecard, symbol_resolver, yahoo_client, stock_universe
from services.cache import cache
from services.data_source import (
    DataSourceError, DataSourceAuthError, get_history, get_quote,
)
from services.deps import get_current_user

log = logging.getLogger("stocks")

router = APIRouter(prefix="/api/stocks", tags=["stocks"])


@router.get("/search")
def search_stocks(q: str = Query(..., min_length=1, max_length=40),
                  _user: User = Depends(get_current_user)):
    """Local search across the seeded Nifty universe. Fast (no Yahoo)."""
    return stock_universe.search(q)


@router.get("/resolve")
def resolve_symbol(q: str = Query(..., min_length=1, max_length=40),
                   _user: User = Depends(get_current_user)):
    """Turn user input into our canonical symbol form."""
    cached = cache.get(f"resolve:{q.lower()}")
    if cached:
        return cached
    sym = symbol_resolver.resolve(q)
    if not sym:
        raise HTTPException(status_code=404, detail=f"Could not resolve symbol: {q}")
    out = {"input": q, "symbol": sym}
    cache.set(f"resolve:{q.lower()}", out, 60 * 60)
    return out


@router.get("/{symbol:path}/quote")
def stock_quote(symbol: str,
                _user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    sym = unquote(symbol)
    cache_key = f"quote:{sym}"
    cached = cache.get(cache_key)
    if cached:
        return cached
    try:
        q = get_quote([sym], db=db)
    except DataSourceAuthError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except DataSourceError as e:
        raise HTTPException(status_code=502, detail=str(e))
    data = q.get(sym)
    if not data or data.get("last_price") is None:
        raise HTTPException(status_code=404, detail=f"No quote for {sym}")
    out = {"symbol": sym, **data}
    cache.set(cache_key, out, 60)  # 1 min cache
    return out


@router.get("/{symbol:path}/fundamentals")
def stock_fundamentals(symbol: str,
                       _user: User = Depends(get_current_user)):
    sym = unquote(symbol)
    cache_key = f"fund:{sym}"
    cached = cache.get(cache_key)
    if cached:
        return cached
    try:
        raw = yahoo_client.fundamentals(sym)
    except DataSourceError as e:
        raise HTTPException(status_code=502, detail=str(e))
    if not raw or raw.get("name") is None:
        raise HTTPException(status_code=404, detail=f"No fundamentals for {sym}")
    card = scorecard.build_scorecard(raw)
    out = {
        "symbol": sym,
        "name": raw.get("name"),
        "sector": raw.get("sector"),
        "industry": raw.get("industry"),
        "price": raw.get("price"),
        "market_cap": raw.get("market_cap"),
        "fifty_two_week_high": raw.get("fifty_two_week_high"),
        "fifty_two_week_low": raw.get("fifty_two_week_low"),
        "scorecard": card,
        "raw": raw,
    }
    cache.set(cache_key, out, 60 * 60)  # fundamentals - 1 hr
    return out


@router.get("/{symbol:path}/quarterly")
def stock_quarterly(symbol: str,
                    _user: User = Depends(get_current_user)):
    sym = unquote(symbol)
    cache_key = f"qtr:{sym}"
    cached = cache.get(cache_key)
    if cached:
        return cached
    try:
        rows = yahoo_client.quarterly(sym, num_quarters=8)
    except DataSourceError as e:
        raise HTTPException(status_code=502, detail=str(e))
    if not rows:
        raise HTTPException(status_code=404, detail=f"No quarterly results for {sym}")
    summary = scorecard.quarterly_summary(rows)
    out = {"symbol": sym, **summary}
    cache.set(cache_key, out, 60 * 60)  # 1 hr
    return out


@router.get("/{symbol:path}/history")
def stock_history(symbol: str,
                  days: int = Query(default=180, ge=5, le=2000),
                  interval: str = Query(default="day"),
                  _user: User = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    sym = unquote(symbol)
    cache_key = f"hist:{sym}:{days}:{interval}"
    cached = cache.get(cache_key)
    if cached:
        return cached
    try:
        candles = get_history(sym, days=days, interval=interval, db=db)
    except DataSourceAuthError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except DataSourceError as e:
        raise HTTPException(status_code=502, detail=str(e))
    if not candles:
        raise HTTPException(status_code=404, detail=f"No history for {sym}")
    out = {"symbol": sym, "interval": interval, "days": days, "candles": candles}
    cache.set(cache_key, out, 5 * 60)
    return out
