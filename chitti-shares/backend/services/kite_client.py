"""
services/kite_client.py
-----------------------
Wrapper around the official `kiteconnect` Python SDK.

What this gives us:
  - get_login_url()                : redirect user to Kite login
  - exchange_request_token(rt)     : swap request_token -> access_token
                                     (called from auth-callback route)
  - get_kite()                     : returns a KiteConnect instance
                                     pre-loaded with today's access_token
  - quote(symbols)                 : LTP + OHLC dict for given symbols
  - historical(token, days)        : daily candles for last N days
  - is_market_open()               : Mon-Fri 9:15-15:30 IST

Tokens expire DAILY at ~6 AM IST. When this happens, every Kite call
raises TokenException and we surface a 503 with a clear message so
the admin knows to re-auth.

Why a class? So we can reuse one KiteConnect object instead of
re-building it on every request.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from kiteconnect import KiteConnect
from kiteconnect.exceptions import TokenException
from sqlalchemy.orm import Session

from config import settings
from models.kite_token import KiteToken

log = logging.getLogger("kite_client")

IST = ZoneInfo("Asia/Kolkata")

# Kite's tradingsymbol for the spot indices we care about.
# These come back via /quote with these exact keys.
NIFTY_SYMBOL = "NSE:NIFTY 50"
SENSEX_SYMBOL = "BSE:SENSEX"

# Instrument tokens for historical() calls.
# These are fixed integers Kite assigns. Documented values:
NIFTY_INSTRUMENT_TOKEN = 256265   # NSE:NIFTY 50
SENSEX_INSTRUMENT_TOKEN = 265     # BSE:SENSEX


# ---------------- Token persistence ----------------

def get_stored_token(db: Session) -> KiteToken | None:
    return db.query(KiteToken).filter(KiteToken.id == 1).first()


def save_token(db: Session, *, access_token: str, public_token: str | None,
               user_id: str | None, user_name: str | None) -> KiteToken:
    row = db.query(KiteToken).filter(KiteToken.id == 1).first()
    now = datetime.utcnow()
    if row:
        row.access_token = access_token
        row.public_token = public_token
        row.user_id = user_id
        row.user_name = user_name
        row.issued_at = now
        row.last_used_at = now
    else:
        row = KiteToken(
            id=1,
            access_token=access_token,
            public_token=public_token,
            user_id=user_id,
            user_name=user_name,
            issued_at=now,
            last_used_at=now,
        )
        db.add(row)
    db.commit()
    db.refresh(row)
    return row


# ---------------- Kite instance helpers ----------------

class KiteAuthRequired(Exception):
    """Raised when no valid Kite token is available - admin must re-auth."""


def _new_client() -> KiteConnect:
    if not settings.KITE_API_KEY:
        raise KiteAuthRequired("KITE_API_KEY not configured")
    return KiteConnect(api_key=settings.KITE_API_KEY)


def get_login_url() -> str:
    """URL to redirect admin to so they can log into Kite."""
    return _new_client().login_url()


def exchange_request_token(request_token: str, db: Session) -> KiteToken:
    """
    After Kite redirects back with ?request_token=..., call this to
    swap it for an access_token. Stores the result in DB.
    """
    if not settings.KITE_API_SECRET:
        raise KiteAuthRequired("KITE_API_SECRET not configured")
    kc = _new_client()
    data = kc.generate_session(request_token, api_secret=settings.KITE_API_SECRET)
    return save_token(
        db,
        access_token=data["access_token"],
        public_token=data.get("public_token"),
        user_id=data.get("user_id"),
        user_name=data.get("user_name"),
    )


def get_kite(db: Session) -> KiteConnect:
    """
    Get a Kite client pre-loaded with today's stored access_token.
    Raises KiteAuthRequired if no token has ever been saved.
    """
    row = get_stored_token(db)
    if not row:
        raise KiteAuthRequired("No Kite token stored - admin must run OAuth")
    kc = _new_client()
    kc.set_access_token(row.access_token)
    # Mark it as used so we know how stale it is
    row.last_used_at = datetime.utcnow()
    db.commit()
    return kc


# ---------------- Market data helpers ----------------

def quote(db: Session, symbols: list[str]) -> dict:
    """
    Returns {symbol: {last_price, ohlc:{open,high,low,close}, ...}}.
    Wraps Kite's /quote endpoint.
    """
    kc = get_kite(db)
    try:
        return kc.quote(symbols)
    except TokenException as e:
        log.warning("Kite token expired: %s", e)
        raise KiteAuthRequired("Kite token expired - admin must re-auth")


def historical(db: Session, instrument_token: int, days: int = 60) -> list[dict]:
    """
    Returns daily candles for the last N calendar days.
    Each candle: {date, open, high, low, close, volume}.
    """
    kc = get_kite(db)
    to_dt = datetime.now(IST).date()
    from_dt = to_dt - timedelta(days=days)
    try:
        return kc.historical_data(
            instrument_token=instrument_token,
            from_date=from_dt,
            to_date=to_dt,
            interval="day",
        )
    except TokenException as e:
        log.warning("Kite token expired during historical: %s", e)
        raise KiteAuthRequired("Kite token expired - admin must re-auth")


# ---------------- Market hours ----------------

def now_ist() -> datetime:
    return datetime.now(IST)


def is_market_open(when: datetime | None = None) -> bool:
    """NSE/BSE: Mon-Fri, 09:15 - 15:30 IST. Holidays not handled here."""
    now = (when or now_ist()).astimezone(IST)
    if now.weekday() >= 5:  # 5=Sat, 6=Sun
        return False
    open_t = time(9, 15)
    close_t = time(15, 30)
    return open_t <= now.time() <= close_t
