"""
routes/market.py
----------------
Phase 2 endpoints:

  Admin only (gated by ADMIN_MOBILE):
    GET  /api/market/auth-url       -> URL admin clicks to log into Kite
    GET  /api/market/auth-callback  -> Kite redirects here with ?request_token=...
    GET  /api/market/auth-status    -> Whether a Kite token is currently stored

  Authenticated users:
    GET  /api/market/indices        -> NIFTY 50 + SENSEX live data
    GET  /api/market/view           -> Chitti's AI summary

All non-admin endpoints require the standard JWT (Phase 1 auth flow).
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models.user import User
from services import kite_client
from services.cache import cache
from services.deepseek_client import DeepSeekError, chat as deepseek_chat
from services.deps import get_admin_user, get_current_user
from services.indices_analyzer import analyze_index
from services.kite_client import (
    KiteAuthRequired,
    NIFTY_INSTRUMENT_TOKEN,
    NIFTY_SYMBOL,
    SENSEX_INSTRUMENT_TOKEN,
    SENSEX_SYMBOL,
)

log = logging.getLogger("market")

router = APIRouter(prefix="/api/market", tags=["market"])


# ===================== Admin: Kite OAuth =====================

@router.get("/auth-url")
def kite_auth_url(_admin: User = Depends(get_admin_user)):
    """
    Returns the URL admin should visit to log into Kite.
    After login, Kite redirects to KITE_REDIRECT_URL with ?request_token=...
    which lands on /auth-callback below.
    """
    try:
        url = kite_client.get_login_url()
    except KiteAuthRequired as e:
        raise HTTPException(status_code=503, detail=str(e))
    return {"login_url": url}


@router.get("/auth-callback", response_class=HTMLResponse)
def kite_auth_callback(
    request: Request,
    request_token: str = Query(...),
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    """
    Kite redirects HERE after admin login. We swap the request_token
    for a permanent access_token and store it in DB.

    NOTE: This endpoint is NOT JWT-gated. Kite's redirect comes from
    the user's browser without our token. We protect it by:
      (a) requiring KITE_API_SECRET (Kite signs the swap server-side)
      (b) accepting only one token at a time, then it's spent
    A malicious party would need a fresh Kite request_token to abuse
    this — and request_tokens are single-use and short-lived.
    """
    if status and status != "success":
        return HTMLResponse(
            f"<h2>Kite login failed</h2><pre>status={status}</pre>",
            status_code=400,
        )
    try:
        row = kite_client.exchange_request_token(request_token, db)
    except KiteAuthRequired as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:  # noqa: BLE001
        log.exception("Kite token exchange failed")
        raise HTTPException(status_code=400, detail=f"Kite exchange failed: {e}")

    # Bust any cached market data so next call fetches fresh
    cache.invalidate("indices")
    cache.invalidate("market_view")

    return HTMLResponse(
        f"""
        <html><body style="background:#0b0f14;color:#e6edf3;
              font-family:system-ui,sans-serif;padding:40px;text-align:center">
          <h1 style="color:#22c55e">✓ Kite Connected</h1>
          <p>Logged in as <b>{row.user_name or row.user_id}</b>.</p>
          <p style="color:#8a96a7">Token issued at {row.issued_at.isoformat()}Z UTC.</p>
          <p>You can close this tab. The Chitti Shares dashboard will now show live data.</p>
          <p><a href="{settings.FRONTEND_URL}" style="color:#3b82f6">Back to Chitti Shares →</a></p>
        </body></html>
        """
    )


@router.get("/auth-status")
def kite_auth_status(
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    row = kite_client.get_stored_token(db)
    if not row:
        return {"connected": False}
    return {
        "connected": True,
        "kite_user_id": row.user_id,
        "kite_user_name": row.user_name,
        "issued_at": row.issued_at.isoformat() + "Z",
        "last_used_at": row.last_used_at.isoformat() + "Z",
    }


# ===================== Authenticated: market data =====================

INDICES_TTL_SECONDS = 5 * 60      # 5 min while market open
INDICES_TTL_CLOSED = 30 * 60      # 30 min when closed
MARKET_VIEW_TTL_SECONDS = 15 * 60 # 15 min always


@router.get("/indices")
def indices(
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns Nifty 50 + Sensex live data with support/resistance/signal.
    Cached: 5 min during market hours, 30 min outside.
    Uses DATA_SOURCE env var to pick Yahoo (default) or Kite.
    """
    from services.data_source import (
        DataSourceAuthError, DataSourceError, get_history, get_quote,
        is_market_open as ds_market_open,
    )

    cached = cache.get("indices")
    if cached:
        return cached

    market_open = ds_market_open()

    NIFTY_C = "NSE:NIFTY 50"
    SENSEX_C = "BSE:SENSEX"

    try:
        q = get_quote([NIFTY_C, SENSEX_C], db=db)
        n_q = q.get(NIFTY_C) or {}
        s_q = q.get(SENSEX_C) or {}
        n_candles = get_history(NIFTY_C, days=120, interval="day", db=db)
        s_candles = get_history(SENSEX_C, days=120, interval="day", db=db)
    except DataSourceAuthError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except DataSourceError as e:
        log.exception("Indices fetch failed")
        raise HTTPException(status_code=502, detail=str(e))

    nifty_price = n_q.get("last_price") or (n_candles[-1]["close"] if n_candles else 0)
    sensex_price = s_q.get("last_price") or (s_candles[-1]["close"] if s_candles else 0)

    nifty_prev = n_q.get("prev_close") or (
        n_candles[-2]["close"] if len(n_candles) >= 2 else nifty_price
    )
    sensex_prev = s_q.get("prev_close") or (
        s_candles[-2]["close"] if len(s_candles) >= 2 else sensex_price
    )

    nifty_block = analyze_index(n_candles, nifty_price, nifty_prev, bucket_step=50)
    sensex_block = analyze_index(s_candles, sensex_price, sensex_prev, bucket_step=100)

    payload = {
        "nifty": {**nifty_block, "name": "NIFTY 50", "exchange": "NSE"},
        "sensex": {**sensex_block, "name": "SENSEX", "exchange": "BSE"},
        "market_open": market_open,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }
    cache.set(
        "indices",
        payload,
        INDICES_TTL_SECONDS if market_open else INDICES_TTL_CLOSED,
    )
    return payload


@router.get("/view")
async def market_view(
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Chitti's 2-sentence AI summary of today's market.
    Cached for 15 minutes.
    """
    from services.data_source import (
        DataSourceAuthError, DataSourceError, get_history, get_quote,
        is_market_open as ds_market_open,
    )

    cached = cache.get("market_view")
    if cached:
        return cached

    NIFTY_C = "NSE:NIFTY 50"
    SENSEX_C = "BSE:SENSEX"

    try:
        q = get_quote([NIFTY_C, SENSEX_C], db=db)
        n_q = q.get(NIFTY_C) or {}
        s_q = q.get(SENSEX_C) or {}
        n_candles = get_history(NIFTY_C, days=120, interval="day", db=db)
        s_candles = get_history(SENSEX_C, days=120, interval="day", db=db)
    except DataSourceAuthError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except DataSourceError as e:
        log.exception("Market view: data fetch failed")
        raise HTTPException(status_code=502, detail=str(e))

    nifty_price = n_q.get("last_price") or (n_candles[-1]["close"] if n_candles else 0)
    sensex_price = s_q.get("last_price") or (s_candles[-1]["close"] if s_candles else 0)
    nifty_prev = n_q.get("prev_close") or (
        n_candles[-2]["close"] if len(n_candles) >= 2 else nifty_price
    )
    sensex_prev = s_q.get("prev_close") or (
        s_candles[-2]["close"] if len(s_candles) >= 2 else sensex_price
    )

    # If Yahoo returned no data at all, return a friendly fallback instead of crashing
    if not nifty_price and not sensex_price:
        return {
            "summary": (
                "Market data is currently unavailable. "
                "Yahoo Finance may be temporarily rate-limiting our server. "
                "Please refresh in a few minutes."
            ),
            "market_state": "OPEN" if ds_market_open() else "CLOSED",
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "stale": True,
        }

    n = analyze_index(n_candles, nifty_price, nifty_prev, bucket_step=50)
    s = analyze_index(s_candles, sensex_price, sensex_prev, bucket_step=100)

    market_state = "OPEN" if ds_market_open() else "CLOSED"

    user_msg = (
        f"Indian markets right now ({market_state}):\n"
        f"NIFTY 50: {n['value']} ({n['change_pct']:+.2f}%, {n['signal']}). "
        f"Support {n['support']}, Resistance {n['resistance']}, 50DMA {n['sma_50']}.\n"
        f"SENSEX: {s['value']} ({s['change_pct']:+.2f}%, {s['signal']}). "
        f"Support {s['support']}, Resistance {s['resistance']}, 50DMA {s['sma_50']}."
    )
    system = (
        "You are Chitti, an AI trading assistant for Indian retail traders. "
        "Summarize the market in EXACTLY 2 sentences. "
        "Mention if today is good for buying, selling, or waiting. "
        "Plain English. No jargon. No financial advice disclaimers. "
        "Don't repeat numbers verbatim - interpret them."
    )

    try:
        summary = await deepseek_chat(system, user_msg, max_tokens=180, temperature=0.65)
    except DeepSeekError as e:
        raise HTTPException(status_code=502, detail=f"DeepSeek error: {e}")

    if n["signal"] == s["signal"] and n["signal"] != "Neutral":
        confidence = "high"
    elif n["signal"] == "Neutral" and s["signal"] == "Neutral":
        confidence = "low"
    else:
        confidence = "medium"

    payload = {
        "summary": summary,
        "confidence": confidence,
        "market_open": ds_market_open(),
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }
    cache.set("market_view", payload, MARKET_VIEW_TTL_SECONDS)
    return payload
