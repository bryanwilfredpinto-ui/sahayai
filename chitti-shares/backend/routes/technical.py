"""
routes/technical.py
-------------------
Phase 4 endpoints. All authenticated.

  GET  /api/technical/{symbol}/analyze?timeframe=day
       Compute all indicators on the latest candles. Includes
       suggested entry/target/SL based on ATR.

  GET  /api/technical/{symbol}/consensus
       Compares signals across day/week/month timeframes. If higher
       and lower TFs disagree, returns WAIT.

  POST /api/technical/rules/evaluate
       Body: { symbol, timeframe, rule_text }
       Evaluate a custom rule against fresh data.

  GET  /api/technical/rules/examples
       Show some pre-baked example rules.

  Saved rules (max 5 per user):
    GET    /api/technical/rules/saved
    POST   /api/technical/rules/saved   { name, rule_text, signal }
    DELETE /api/technical/rules/saved/{id}
    POST   /api/technical/rules/saved/{id}/run   { symbol, timeframe? }

Call reports:
  GET    /api/calls
  POST   /api/calls
  POST   /api/calls/{id}/close
  POST   /api/calls/track-all   - admin: refresh high/low/last for open calls
"""

import logging
from datetime import datetime
from urllib.parse import unquote

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models.stock import CallReport, CustomRule
from models.user import User
from services import indicators, rule_engine
from services.cache import cache
from services.data_source import (
    DataSourceAuthError, DataSourceError, get_history, get_quote,
)
from services.deps import get_admin_user, get_current_user

log = logging.getLogger("technical")

router_tech = APIRouter(prefix="/api/technical", tags=["technical"])
router_calls = APIRouter(prefix="/api/calls", tags=["calls"])

MAX_SAVED_RULES_PER_USER = 5
VALID_TIMEFRAMES = {"day", "week", "month"}


# =============================================================
# Technical analysis
# =============================================================

@router_tech.get("/{symbol:path}/analyze")
def analyze(symbol: str,
            timeframe: str = "day",
            _user: User = Depends(get_current_user),
            db: Session = Depends(get_db)):
    if timeframe not in VALID_TIMEFRAMES:
        raise HTTPException(status_code=400,
                            detail=f"timeframe must be one of {VALID_TIMEFRAMES}")
    sym = unquote(symbol)
    cache_key = f"tech:{sym}:{timeframe}"
    cached = cache.get(cache_key)
    if cached:
        return cached
    days_needed = {"day": 365, "week": 365 * 3, "month": 365 * 10}[timeframe]
    try:
        candles = get_history(sym, days=days_needed, interval=timeframe, db=db)
    except DataSourceAuthError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except DataSourceError as e:
        raise HTTPException(status_code=502, detail=str(e))

    if len(candles) < 30:
        raise HTTPException(status_code=404,
                            detail="Not enough history to compute indicators")

    res = indicators.compute_all(candles)
    plan = indicators.entry_target_sl(candles, res.get("summary", "Neutral"))

    out = {
        "symbol": sym,
        "timeframe": timeframe,
        "latest_close": candles[-1]["close"],
        "latest_date": candles[-1]["date"],
        "indicators": res,
        "trade_plan": plan,   # may be None if signal is Neutral
    }
    cache.set(cache_key, out, 5 * 60)
    return out


@router_tech.get("/{symbol:path}/consensus")
def consensus(symbol: str,
              _user: User = Depends(get_current_user),
              db: Session = Depends(get_db)):
    """
    Strict-filter signal: checks day, week, month. If they disagree,
    returns WAIT. Used as the safety net before generating a Call.
    """
    sym = unquote(symbol)
    out = {"symbol": sym, "by_timeframe": {}, "verdict": "WAIT", "reason": ""}
    summaries = {}
    for tf, days in (("day", 365), ("week", 365 * 3), ("month", 365 * 10)):
        try:
            candles = get_history(sym, days=days, interval=tf, db=db)
            if len(candles) < 30:
                summaries[tf] = "Not enough data"
                continue
            res = indicators.compute_all(candles)
            summaries[tf] = res.get("summary")
            out["by_timeframe"][tf] = {
                "summary": res.get("summary"),
                "rsi_14": res.get("rsi_14"),
                "macd_hist": res.get("macd_hist"),
            }
        except (DataSourceAuthError, DataSourceError) as e:
            summaries[tf] = "error"
            out["by_timeframe"][tf] = {"error": str(e)}

    # Decision: all bullish -> BUY; all bearish -> SELL; else WAIT
    bullish = {"Strong Buy", "Buy"}
    bearish = {"Strong Sell", "Sell"}
    valid = [s for s in summaries.values() if s in bullish | bearish | {"Neutral"}]
    if not valid:
        out["reason"] = "No timeframes returned data"
    elif all(s in bullish for s in valid):
        out["verdict"] = "BUY"
        out["reason"] = "All timeframes bullish"
    elif all(s in bearish for s in valid):
        out["verdict"] = "SELL"
        out["reason"] = "All timeframes bearish"
    else:
        out["verdict"] = "WAIT"
        out["reason"] = "Higher and lower timeframes disagree - wait for alignment"
    return out


class RuleEvalIn(BaseModel):
    symbol: str = Field(..., min_length=2, max_length=40)
    rule_text: str = Field(..., min_length=3, max_length=400)
    timeframe: str = "day"


@router_tech.post("/rules/evaluate")
def evaluate_rule(payload: RuleEvalIn,
                  _user: User = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    if payload.timeframe not in VALID_TIMEFRAMES:
        raise HTTPException(status_code=400, detail="bad timeframe")
    days = {"day": 365, "week": 365 * 3, "month": 365 * 10}[payload.timeframe]
    try:
        candles = get_history(payload.symbol, days=days,
                              interval=payload.timeframe, db=db)
    except DataSourceAuthError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except DataSourceError as e:
        raise HTTPException(status_code=502, detail=str(e))
    if len(candles) < 30:
        raise HTTPException(status_code=404, detail="Not enough history")

    try:
        explanation = rule_engine.explain(payload.rule_text, candles)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Bad rule: {e}")
    return explanation


@router_tech.get("/rules/examples")
def example_rules(_user: User = Depends(get_current_user)):
    return {
        "examples": [
            {"name": "Oversold bounce", "rule": "RSI(14) < 30 AND MACD_HIST > 0", "signal": "BUY"},
            {"name": "Strong uptrend",  "rule": "PRICE > SMA(50) AND SMA(20) > SMA(50)", "signal": "BUY"},
            {"name": "Breakout above Bollinger",  "rule": "PRICE > BB_UPPER(20, 2)", "signal": "BUY"},
            {"name": "Williams oversold", "rule": "WILLIAMS_R(14) < -80", "signal": "BUY"},
            {"name": "Elder bull", "rule": "BULL_POWER > 0 AND BEAR_POWER > 0", "signal": "BUY"},
            {"name": "RSI vs its own SMA", "rule": "RSI(14) > SMA(20 of RSI(14))", "signal": "BUY"},
        ]
    }


# ---- Saved rules (max 5/user) ----

class SavedRuleIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    rule_text: str = Field(..., min_length=3, max_length=400)
    signal: str = Field(default="BUY", pattern="^(BUY|SELL|WAIT)$")


class RunSavedIn(BaseModel):
    symbol: str = Field(..., min_length=2, max_length=40)
    timeframe: str = "day"


@router_tech.get("/rules/saved")
def list_saved_rules(user: User = Depends(get_current_user),
                     db: Session = Depends(get_db)):
    rows = (db.query(CustomRule)
            .filter(CustomRule.user_id == user.id)
            .order_by(CustomRule.created_at.desc()).all())
    return [{
        "id": r.id, "name": r.name, "rule_text": r.rule_text,
        "signal": r.signal, "created_at": r.created_at.isoformat(),
    } for r in rows]


@router_tech.post("/rules/saved")
def create_saved_rule(payload: SavedRuleIn,
                      user: User = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    # Cap check
    count = db.query(CustomRule).filter(CustomRule.user_id == user.id).count()
    if count >= MAX_SAVED_RULES_PER_USER:
        raise HTTPException(status_code=429,
                            detail=f"Max {MAX_SAVED_RULES_PER_USER} saved rules reached")
    # Validate it parses
    try:
        rule_engine.parse(payload.rule_text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Bad rule: {e}")
    row = CustomRule(user_id=user.id, **payload.model_dump())
    db.add(row); db.commit(); db.refresh(row)
    return {"id": row.id, "name": row.name, "rule_text": row.rule_text, "signal": row.signal}


@router_tech.delete("/rules/saved/{rule_id}")
def delete_saved_rule(rule_id: int,
                      user: User = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    row = (db.query(CustomRule)
           .filter(CustomRule.id == rule_id, CustomRule.user_id == user.id).first())
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(row); db.commit()
    return {"ok": True}


@router_tech.post("/rules/saved/{rule_id}/run")
def run_saved_rule(rule_id: int,
                   payload: RunSavedIn,
                   user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    row = (db.query(CustomRule)
           .filter(CustomRule.id == rule_id, CustomRule.user_id == user.id).first())
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    days = {"day": 365, "week": 365 * 3, "month": 365 * 10}.get(payload.timeframe, 365)
    try:
        candles = get_history(payload.symbol, days=days,
                              interval=payload.timeframe, db=db)
    except (DataSourceAuthError, DataSourceError) as e:
        raise HTTPException(status_code=502, detail=str(e))
    if len(candles) < 30:
        raise HTTPException(status_code=404, detail="Not enough history")
    try:
        explanation = rule_engine.explain(row.rule_text, candles)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Bad rule: {e}")
    return {
        "rule": {"id": row.id, "name": row.name, "signal": row.signal},
        "symbol": payload.symbol,
        "timeframe": payload.timeframe,
        **explanation,
    }


# =============================================================
# Call Reports (unchanged from Phase 5)
# =============================================================

class NewCallIn(BaseModel):
    symbol: str = Field(..., max_length=40)
    call_type: str = Field(..., pattern="^(BUY|SELL|WAIT)$")
    timeframe: str = Field(default="day")
    entry_price: float = Field(..., gt=0)
    target: float | None = None
    stop_loss: float | None = None
    rationale: str | None = Field(default=None, max_length=2000)


class CloseCallIn(BaseModel):
    closed_price: float = Field(..., gt=0)


@router_calls.get("")
def list_calls(user: User = Depends(get_current_user),
               db: Session = Depends(get_db)):
    rows = (
        db.query(CallReport)
        .filter((CallReport.user_id == user.id) | (CallReport.user_id.is_(None)))
        .order_by(CallReport.created_at.desc())
        .limit(200)
        .all()
    )
    return [_call_to_dict(r) for r in rows]


@router_calls.get("/stats")
def call_stats(user: User = Depends(get_current_user),
               db: Session = Depends(get_db)):
    """Win rate + summary across the user's calls."""
    rows = (db.query(CallReport)
            .filter((CallReport.user_id == user.id) | (CallReport.user_id.is_(None)))
            .all())
    total = len(rows)
    open_count = sum(1 for r in rows if r.status == "open")
    target_hits = sum(1 for r in rows if r.status == "target_hit")
    sl_hits = sum(1 for r in rows if r.status == "sl_hit")
    closed_manual = sum(1 for r in rows if r.status == "closed_manual")

    closed = target_hits + sl_hits + closed_manual
    wins = target_hits + sum(
        1 for r in rows
        if r.status == "closed_manual" and _was_winning(r)
    )
    win_rate = round(wins / closed * 100, 1) if closed else None

    return {
        "total": total,
        "open": open_count,
        "target_hit": target_hits,
        "sl_hit": sl_hits,
        "closed_manual": closed_manual,
        "win_rate_pct": win_rate,
    }


def _was_winning(r: CallReport) -> bool:
    if r.closed_price is None or r.entry_price is None:
        return False
    if r.call_type == "BUY":
        return r.closed_price > r.entry_price
    if r.call_type == "SELL":
        return r.closed_price < r.entry_price
    return False


@router_calls.post("")
def create_call(payload: NewCallIn,
                user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    row = CallReport(
        user_id=user.id,
        symbol=payload.symbol,
        call_type=payload.call_type,
        timeframe=payload.timeframe,
        entry_price=payload.entry_price,
        target=payload.target,
        stop_loss=payload.stop_loss,
        rationale=payload.rationale,
        last_price=payload.entry_price,
        high_seen=payload.entry_price,
        low_seen=payload.entry_price,
        last_updated_at=datetime.utcnow(),
    )
    db.add(row); db.commit(); db.refresh(row)
    return _call_to_dict(row)


@router_calls.post("/{call_id}/close")
def close_call(call_id: int,
               payload: CloseCallIn,
               user: User = Depends(get_current_user),
               db: Session = Depends(get_db)):
    row = db.query(CallReport).filter(CallReport.id == call_id,
                                      CallReport.user_id == user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Call not found")
    row.status = "closed_manual"
    row.closed_price = payload.closed_price
    row.closed_at = datetime.utcnow()
    db.commit()
    return _call_to_dict(row)


@router_calls.post("/track-all")
def track_all_open_calls(_admin: User = Depends(get_admin_user),
                         db: Session = Depends(get_db)):
    """
    For every OPEN call: refresh last_price, update high_seen/low_seen,
    mark as target_hit / sl_hit if breached. Run this from a cron or
    Render Job to auto-close hit calls.
    """
    open_rows = db.query(CallReport).filter(CallReport.status == "open").all()
    if not open_rows:
        return {"updated": 0, "closed": 0}

    symbols = list({r.symbol for r in open_rows})
    try:
        quotes = get_quote(symbols, db=db)
    except (DataSourceAuthError, DataSourceError) as e:
        raise HTTPException(status_code=502, detail=str(e))

    closed = 0
    updated = 0
    now = datetime.utcnow()
    for r in open_rows:
        q = quotes.get(r.symbol) or {}
        last = q.get("last_price")
        if last is None:
            continue
        r.last_price = last
        r.last_updated_at = now
        if r.high_seen is None or last > r.high_seen: r.high_seen = last
        if r.low_seen is None or last < r.low_seen: r.low_seen = last

        # BUY: target above, SL below.  SELL: opposite.
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


def _call_to_dict(r: CallReport) -> dict:
    return {
        "id": r.id,
        "symbol": r.symbol,
        "call_type": r.call_type,
        "timeframe": r.timeframe,
        "entry_price": r.entry_price,
        "target": r.target,
        "stop_loss": r.stop_loss,
        "rationale": r.rationale,
        "high_seen": r.high_seen,
        "low_seen": r.low_seen,
        "last_price": r.last_price,
        "status": r.status,
        "closed_price": r.closed_price,
        "closed_at": r.closed_at.isoformat() if r.closed_at else None,
        "created_at": r.created_at.isoformat(),
        "last_updated_at": r.last_updated_at.isoformat() if r.last_updated_at else None,
    }
