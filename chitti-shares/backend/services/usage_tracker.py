"""
services/usage_tracker.py
-------------------------
Every external API call goes through this. Two responsibilities:

  1. Log the call (cost, tokens, success) to usage_log.
  2. Enforce daily caps:
       SOFT CAP - log a warning, keep serving (₹50/day default)
       HARD CAP - reject metered calls with 503 (₹100/day default)

Yahoo Finance is "free" but we still log it so we can see the call rate.
Yahoo never gets blocked by the hard cap.

Usage:

    from services.usage_tracker import tracked

    @tracked(provider="deepseek", operation="chat")
    async def deepseek_chat(...):
        ...

For DeepSeek calls, the wrapped function should return either:
  - just the reply text (we'll skip token accounting), OR
  - a dict {"text": "...", "input_tokens": N, "output_tokens": M}
    (we'll cost it precisely).

For Fast2SMS we charge ₹0.22 per call regardless of what's returned.
For Yahoo we charge ₹0.

If the wrapped function raises, we log success=0 with the error message
and re-raise. No silent swallowing.
"""

from __future__ import annotations

import asyncio
import inspect
import logging
import time
from datetime import datetime
from functools import wraps
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from config import settings
from database import SessionLocal
from models.quota import DailyQuotaSummary, UsageLog

log = logging.getLogger("usage_tracker")
IST = ZoneInfo("Asia/Kolkata")


# ============== Pricing ==============

PRICING = {
    "deepseek": {
        # Per-million-token rates in INR
        "input_per_million":  22.50,
        "output_per_million": 91.50,
    },
    "fast2sms": {
        "per_sms": 0.22,
    },
    "yahoo": {
        "per_call": 0.0,  # free
    },
}


# ============== Cap status ==============

class CapExceeded(Exception):
    """Raised when hard cap is breached on a metered provider."""


def today_ist() -> str:
    return datetime.now(IST).strftime("%Y-%m-%d")


def _cost_for(provider: str, **kw) -> float:
    p = PRICING.get(provider, {})
    if provider == "deepseek":
        ti = kw.get("input_tokens", 0) or 0
        to = kw.get("output_tokens", 0) or 0
        return (ti / 1_000_000) * p["input_per_million"] + \
               (to / 1_000_000) * p["output_per_million"]
    if provider == "fast2sms":
        return p["per_sms"]
    return 0.0


# ============== Cap check ==============

def get_today_total(db: Session) -> float:
    """Read today's running total. Cheap (single row)."""
    row = db.query(DailyQuotaSummary).filter(
        DailyQuotaSummary.date_ist == today_ist()
    ).first()
    return row.total_inr if row else 0.0


def assert_under_hard_cap(db: Session, provider: str):
    """Raise CapExceeded if hard cap breached. Yahoo bypasses."""
    if provider == "yahoo":
        return
    total = get_today_total(db)
    hard = settings.HARD_CAP_INR
    if total >= hard:
        # Log the block attempt
        row = _ensure_summary(db)
        row.blocked_count = (row.blocked_count or 0) + 1
        db.commit()
        raise CapExceeded(
            f"Daily budget cap of ₹{hard} reached "
            f"(spent ₹{total:.2f}). Resets at 00:00 IST."
        )


# ============== Logging ==============

def _ensure_summary(db: Session) -> DailyQuotaSummary:
    row = db.query(DailyQuotaSummary).filter(
        DailyQuotaSummary.date_ist == today_ist()
    ).first()
    if not row:
        row = DailyQuotaSummary(date_ist=today_ist())
        db.add(row)
        db.flush()
    return row


def _log_call(provider: str, operation: str, *,
              user_id: int | None = None,
              input_tokens: int | None = None,
              output_tokens: int | None = None,
              units: int | None = None,
              success: bool = True,
              error: str | None = None,
              duration_ms: int | None = None):
    """Insert one usage_log row + update today's summary."""
    cost = _cost_for(provider,
                     input_tokens=input_tokens,
                     output_tokens=output_tokens)
    db = SessionLocal()
    try:
        db.add(UsageLog(
            user_id=user_id,
            provider=provider,
            operation=operation,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            units=units,
            cost_inr=round(cost, 4),
            success=1 if success else 0,
            error=(error or "")[:200] or None,
            duration_ms=duration_ms,
        ))
        row = _ensure_summary(db)
        row.total_inr = (row.total_inr or 0) + cost
        if provider == "deepseek": row.deepseek_inr = (row.deepseek_inr or 0) + cost
        elif provider == "fast2sms": row.fast2sms_inr = (row.fast2sms_inr or 0) + cost
        elif provider == "yahoo": row.yahoo_inr = (row.yahoo_inr or 0) + cost
        row.call_count = (row.call_count or 0) + 1
        row.updated_at = datetime.utcnow()
        db.commit()

        # Soft cap warning in logs
        if provider != "yahoo" and row.total_inr >= settings.DAILY_BUDGET_INR \
                and row.total_inr - cost < settings.DAILY_BUDGET_INR:
            log.warning("SOFT CAP CROSSED: ₹%.2f >= ₹%d soft cap",
                        row.total_inr, settings.DAILY_BUDGET_INR)
    except Exception as e:  # noqa: BLE001
        log.exception("usage_log write failed: %s", e)
        db.rollback()
    finally:
        db.close()


# ============== Decorator ==============

def tracked(provider: str, operation: str):
    """
    Decorator. Wraps an async OR sync function.
    Enforces hard cap before the call, logs cost after.
    The wrapped fn may return:
      - any value (logged with no token info), or
      - a dict with 'input_tokens'/'output_tokens'/'units' keys
        (which are extracted and removed before returning to caller).

    The wrapped fn may declare a kwarg 'user_id' for per-user attribution.
    """
    def deco(fn):
        is_async = asyncio.iscoroutinefunction(fn)

        @wraps(fn)
        async def async_wrap(*args, **kwargs):
            user_id = kwargs.pop("_track_user_id", None)
            db = SessionLocal()
            try:
                assert_under_hard_cap(db, provider)
            finally:
                db.close()
            t0 = time.time()
            try:
                result = await fn(*args, **kwargs)
                ti = to_ = units = None
                if isinstance(result, dict) and "_meta" in result:
                    meta = result.pop("_meta")
                    ti = meta.get("input_tokens")
                    to_ = meta.get("output_tokens")
                    units = meta.get("units")
                _log_call(provider, operation,
                          user_id=user_id,
                          input_tokens=ti, output_tokens=to_, units=units,
                          success=True,
                          duration_ms=int((time.time()-t0)*1000))
                return result
            except CapExceeded:
                raise
            except Exception as e:  # noqa: BLE001
                _log_call(provider, operation,
                          user_id=user_id,
                          success=False, error=str(e),
                          duration_ms=int((time.time()-t0)*1000))
                raise

        @wraps(fn)
        def sync_wrap(*args, **kwargs):
            user_id = kwargs.pop("_track_user_id", None)
            db = SessionLocal()
            try:
                assert_under_hard_cap(db, provider)
            finally:
                db.close()
            t0 = time.time()
            try:
                result = fn(*args, **kwargs)
                ti = to_ = units = None
                if isinstance(result, dict) and "_meta" in result:
                    meta = result.pop("_meta")
                    ti = meta.get("input_tokens")
                    to_ = meta.get("output_tokens")
                    units = meta.get("units")
                _log_call(provider, operation,
                          user_id=user_id,
                          input_tokens=ti, output_tokens=to_, units=units,
                          success=True,
                          duration_ms=int((time.time()-t0)*1000))
                return result
            except CapExceeded:
                raise
            except Exception as e:  # noqa: BLE001
                _log_call(provider, operation,
                          user_id=user_id,
                          success=False, error=str(e),
                          duration_ms=int((time.time()-t0)*1000))
                raise

        return async_wrap if is_async else sync_wrap
    return deco
