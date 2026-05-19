"""
routes/cron.py
--------------
Endpoints for Render Cron Jobs to call. Each is gated by ?secret=<CRON_SECRET>.

  POST /api/cron/alerts?secret=...      - run alert checker
  POST /api/cron/track-calls?secret=... - refresh open call reports
  POST /api/cron/kite-reauth?secret=... - send Kite re-auth reminder if stale

Set the CRON_SECRET env var to a long random string. Use the same value
in the Render Cron Job command:

  curl -X POST 'https://chitti-shares-api.up.railway.app/api/cron/alerts?secret=YOUR_SECRET'

Why this pattern (not Bearer auth)?
  - Cron Jobs execute curl, no JWT machinery
  - Secret in URL is fine for non-HTTPS-leaking infra (Render is HTTPS-only)
"""

from datetime import datetime, time
import logging
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models.kite_token import KiteToken
from routes.portfolio import run_alert_check
from services.cache import cache

log = logging.getLogger("cron")

router = APIRouter(prefix="/api/cron", tags=["cron"])

IST = ZoneInfo("Asia/Kolkata")


def _verify_secret(secret: str = Query(..., description="Cron secret token")):
    if not settings.CRON_SECRET:
        raise HTTPException(status_code=503, detail="CRON_SECRET not configured")
    if secret != settings.CRON_SECRET:
        raise HTTPException(status_code=401, detail="Bad cron secret")
    return True


def _is_market_hours() -> bool:
    """NSE market hours: Mon-Fri 09:15-15:30 IST."""
    now = datetime.now(IST)
    if now.weekday() >= 5: return False
    return time(9, 15) <= now.time() <= time(15, 30)


@router.post("/alerts")
def cron_alerts(_: bool = Depends(_verify_secret),
                db: Session = Depends(get_db)):
    """Skip outside market hours - cheaper."""
    if not _is_market_hours():
        return {"skipped": True, "reason": "outside market hours"}
    return run_alert_check(db)


@router.post("/track-calls")
def cron_track_calls(_: bool = Depends(_verify_secret),
                     db: Session = Depends(get_db)):
    """Refresh open Call Reports - update high/low/last, mark target/SL hit."""
    from datetime import datetime as dt
    from models.stock import CallReport
    from services.data_source import (
        DataSourceAuthError, DataSourceError, get_quote,
    )

    open_rows = db.query(CallReport).filter(CallReport.status == "open").all()
    if not open_rows:
        return {"updated": 0, "closed": 0}

    symbols = list({r.symbol for r in open_rows})
    try:
        quotes = get_quote(symbols, db=db)
    except (DataSourceAuthError, DataSourceError) as e:
        return {"updated": 0, "closed": 0, "error": str(e)}

    closed = 0
    updated = 0
    now = dt.utcnow()
    for r in open_rows:
        q = quotes.get(r.symbol) or {}
        last = q.get("last_price")
        if last is None: continue
        r.last_price = last
        r.last_updated_at = now
        if r.high_seen is None or last > r.high_seen: r.high_seen = last
        if r.low_seen is None or last < r.low_seen: r.low_seen = last
        if r.call_type == "BUY":
            if r.target and last >= r.target:
                r.status = "target_hit"; r.closed_price = last; r.closed_at = now; closed += 1
            elif r.stop_loss and last <= r.stop_loss:
                r.status = "sl_hit"; r.closed_price = last; r.closed_at = now; closed += 1
        elif r.call_type == "SELL":
            if r.target and last <= r.target:
                r.status = "target_hit"; r.closed_price = last; r.closed_at = now; closed += 1
            elif r.stop_loss and last >= r.stop_loss:
                r.status = "sl_hit"; r.closed_price = last; r.closed_at = now; closed += 1
        updated += 1
    db.commit()
    return {"updated": updated, "closed": closed}


@router.post("/kite-reauth")
def cron_kite_reauth(_: bool = Depends(_verify_secret),
                     db: Session = Depends(get_db)):
    """
    Sends a Telegram reminder if Kite token is missing or stale (older than 22 hrs).
    Only relevant if DATA_SOURCE=kite. With DATA_SOURCE=yahoo, returns 'skipped'.
    """
    if (settings.DATA_SOURCE or "").lower() != "kite":
        return {"skipped": True, "reason": f"DATA_SOURCE={settings.DATA_SOURCE} (not kite)"}

    row = db.query(KiteToken).filter(KiteToken.id == 1).first()
    needs_reauth = False
    reason = ""
    if not row or not row.access_token:
        needs_reauth = True; reason = "no Kite token saved"
    else:
        age_hours = (datetime.utcnow() - row.created_at).total_seconds() / 3600
        if age_hours > 22:
            needs_reauth = True; reason = f"token is {age_hours:.1f}h old (expires daily 6 AM IST)"

    if not needs_reauth:
        return {"reauth_needed": False}

    msg = (
        f"🔔 Chitti Shares: Kite token re-auth needed.\n"
        f"Reason: {reason}\n"
        f"Visit https://chitti-shares-api.up.railway.app/api/market/auth-url "
        f"(logged in as ADMIN_MOBILE) to re-authorise."
    )
    sent = _send_telegram(msg)
    return {"reauth_needed": True, "reason": reason, "telegram_sent": sent}


def _send_telegram(msg: str) -> bool:
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
        log.warning("Telegram not configured - reminder skipped: %s", msg)
        return False
    import httpx
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    try:
        with httpx.Client(timeout=10.0) as client:
            r = client.post(url, json={
                "chat_id": settings.TELEGRAM_CHAT_ID,
                "text": msg,
            })
            return r.status_code == 200
    except Exception as e:  # noqa: BLE001
        log.error("Telegram send failed: %s", e)
        return False
