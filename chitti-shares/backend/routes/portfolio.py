"""
routes/portfolio.py
-------------------
Phase 5 endpoints. All authenticated.

Watchlist:
  GET    /api/watchlist
  POST   /api/watchlist        body: {symbol, note?}
  DELETE /api/watchlist/{id}
  POST   /api/watchlist/reorder body: {ordered_ids: [int]}

Alerts:
  GET    /api/alerts
  POST   /api/alerts
  POST   /api/alerts/{id}/toggle
  DELETE /api/alerts/{id}
  POST   /api/alerts/check-all   (admin) - run alert checker now
  GET    /api/alerts/events      - recent fired events for current user

Portfolio:
  GET    /api/portfolio          - holdings + Doctor analysis
  GET    /api/portfolio/insights - DeepSeek-generated 3 specific recos (cached)
  POST   /api/portfolio/holdings  body: {symbol, qty, avg_buy_price}
  POST   /api/portfolio/upload    body: multipart CSV (Zerodha holdings format)
  DELETE /api/portfolio/holdings/{id}
"""

import csv
import io
from datetime import datetime, timedelta
import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import asc

from config import settings
from database import get_db
from models.stock import (
    Alert, AlertEvent, PortfolioHolding, WatchlistItem,
)
from models.user import User
from services import indicators
from services.cache import cache
from services.data_source import (
    DataSourceAuthError, DataSourceError, get_history, get_quote,
)
from services.deepseek_client import DeepSeekError, chat as deepseek_chat
from services.deps import get_admin_user, get_current_user

log = logging.getLogger("portfolio")

router_watchlist = APIRouter(prefix="/api/watchlist", tags=["watchlist"])
router_alerts = APIRouter(prefix="/api/alerts", tags=["alerts"])
router_portfolio = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


# =============================================================
# Watchlist
# =============================================================

class AddWatchIn(BaseModel):
    symbol: str = Field(..., min_length=2, max_length=40)
    note: str | None = Field(default=None, max_length=200)


@router_watchlist.get("")
def list_watch(user: User = Depends(get_current_user),
               db: Session = Depends(get_db)):
    rows = (db.query(WatchlistItem)
            .filter(WatchlistItem.user_id == user.id)
            .order_by(asc(WatchlistItem.order_index), WatchlistItem.added_at.desc())
            .all())
    if not rows:
        return []
    symbols = [r.symbol for r in rows]
    try:
        quotes = get_quote(symbols, db=db)
    except (DataSourceAuthError, DataSourceError):
        quotes = {}

    # Best-effort scorecard + tech signal per symbol (cached by underlying services)
    from services import scorecard, yahoo_client
    out = []
    for r in rows:
        q = quotes.get(r.symbol) or {}
        last = q.get("last_price")
        prev = q.get("prev_close")
        change_pct = None
        if last and prev:
            change_pct = (last - prev) / prev * 100

        grade = None
        try:
            f = yahoo_client.fundamentals(r.symbol)
            if f:
                grade = scorecard.build_scorecard(f).get("overall_grade")
        except Exception:
            pass

        signal = None
        try:
            cached_tech = cache.get(f"tech:{r.symbol}:day")
            if cached_tech:
                signal = (cached_tech.get("indicators") or {}).get("summary")
        except Exception:
            pass

        out.append({
            "id": r.id,
            "symbol": r.symbol,
            "note": r.note,
            "order_index": r.order_index,
            "added_at": r.added_at.isoformat(),
            "last_price": last,
            "change_pct": round(change_pct, 2) if change_pct is not None else None,
            "scorecard_grade": grade,    # 'A'/'B'/.. if cached, else None
            "tech_signal": signal,        # 'Buy'/'Sell'/.. if cached, else None
        })
    return out


@router_watchlist.post("")
def add_watch(payload: AddWatchIn,
              user: User = Depends(get_current_user),
              db: Session = Depends(get_db)):
    count = (db.query(WatchlistItem)
             .filter(WatchlistItem.user_id == user.id).count())
    if count >= settings.MAX_WATCHLIST_ITEMS:
        raise HTTPException(status_code=429,
                            detail=f"Watchlist limit ({settings.MAX_WATCHLIST_ITEMS}) reached")
    existing = (db.query(WatchlistItem)
                .filter(WatchlistItem.user_id == user.id,
                        WatchlistItem.symbol == payload.symbol).first())
    if existing:
        return {"id": existing.id, "symbol": existing.symbol}
    # New item goes to the bottom of the list
    max_order = (db.query(WatchlistItem)
                 .filter(WatchlistItem.user_id == user.id)
                 .count())
    row = WatchlistItem(user_id=user.id, symbol=payload.symbol,
                        note=payload.note, order_index=max_order)
    db.add(row); db.commit(); db.refresh(row)
    return {"id": row.id, "symbol": row.symbol, "note": row.note}


class ReorderIn(BaseModel):
    ordered_ids: list[int]


@router_watchlist.post("/reorder")
def reorder_watch(payload: ReorderIn,
                  user: User = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    """Persist a new ordering. Items not in the list keep their existing order_index."""
    rows = {r.id: r for r in db.query(WatchlistItem)
                                .filter(WatchlistItem.user_id == user.id).all()}
    for idx, item_id in enumerate(payload.ordered_ids):
        if item_id in rows:
            rows[item_id].order_index = idx
    db.commit()
    return {"ok": True, "count": len(payload.ordered_ids)}


@router_watchlist.delete("/{item_id}")
def remove_watch(item_id: int,
                 user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    row = (db.query(WatchlistItem)
           .filter(WatchlistItem.id == item_id,
                   WatchlistItem.user_id == user.id).first())
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(row); db.commit()
    return {"ok": True}


# =============================================================
# Alerts
# =============================================================

ALERT_KINDS = {"price_above", "price_below", "rsi_above", "rsi_below"}


class NewAlertIn(BaseModel):
    symbol: str = Field(..., max_length=40)
    kind: str = Field(..., pattern="^(price_above|price_below|rsi_above|rsi_below)$")
    threshold: float = Field(..., gt=0)
    timeframe: str = "day"
    note: str | None = Field(default=None, max_length=200)


@router_alerts.get("")
def list_alerts(user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    rows = (db.query(Alert).filter(Alert.user_id == user.id)
            .order_by(Alert.created_at.desc()).all())
    return [_alert_to_dict(r) for r in rows]


@router_alerts.post("")
def create_alert(payload: NewAlertIn,
                 user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    count = db.query(Alert).filter(Alert.user_id == user.id, Alert.active.is_(True)).count()
    if count >= settings.MAX_ALERTS_PER_USER:
        raise HTTPException(status_code=429,
                            detail=f"Alert limit ({settings.MAX_ALERTS_PER_USER}) reached")
    row = Alert(
        user_id=user.id, symbol=payload.symbol, kind=payload.kind,
        threshold=payload.threshold, timeframe=payload.timeframe, note=payload.note,
    )
    db.add(row); db.commit(); db.refresh(row)
    return _alert_to_dict(row)


@router_alerts.post("/{alert_id}/toggle")
def toggle_alert(alert_id: int,
                 user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    row = db.query(Alert).filter(Alert.id == alert_id,
                                 Alert.user_id == user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Alert not found")
    row.active = not row.active
    if row.active:
        row.triggered_at = None
    db.commit()
    return _alert_to_dict(row)


@router_alerts.delete("/{alert_id}")
def delete_alert(alert_id: int,
                 user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    row = db.query(Alert).filter(Alert.id == alert_id,
                                 Alert.user_id == user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(row); db.commit()
    return {"ok": True}


@router_alerts.get("/events")
def my_events(user: User = Depends(get_current_user),
              db: Session = Depends(get_db)):
    rows = (db.query(AlertEvent)
            .filter(AlertEvent.user_id == user.id)
            .order_by(AlertEvent.fired_at.desc())
            .limit(50).all())
    return [{
        "id": r.id, "symbol": r.symbol, "alert_id": r.alert_id,
        "fired_value": r.fired_value, "note": r.note,
        "fired_at": r.fired_at.isoformat(), "seen": r.seen,
    } for r in rows]


@router_alerts.post("/events/mark-seen")
def mark_seen(user: User = Depends(get_current_user),
              db: Session = Depends(get_db)):
    db.query(AlertEvent).filter(AlertEvent.user_id == user.id,
                                AlertEvent.seen.is_(False)).update({"seen": True})
    db.commit()
    return {"ok": True}


@router_alerts.post("/check-all")
def check_all_alerts(_admin: User = Depends(get_admin_user),
                     db: Session = Depends(get_db)):
    """Run all active alerts, fire events when threshold crossed."""
    return run_alert_check(db)


def run_alert_check(db: Session) -> dict:
    """Pure function so a cron job can call this directly too."""
    rows = db.query(Alert).filter(Alert.active.is_(True),
                                  Alert.triggered_at.is_(None)).all()
    if not rows:
        return {"checked": 0, "fired": 0}

    by_symbol: dict[str, list[Alert]] = {}
    for r in rows:
        by_symbol.setdefault(r.symbol, []).append(r)

    fired = 0
    now = datetime.utcnow()

    try:
        quotes = get_quote(list(by_symbol.keys()), db=db)
    except (DataSourceAuthError, DataSourceError) as e:
        log.error("Alerts check: data fetch failed: %s", e)
        return {"checked": 0, "fired": 0, "error": str(e)}

    for symbol, alerts in by_symbol.items():
        q = quotes.get(symbol) or {}
        last = q.get("last_price")
        if last is None:
            continue

        # If any alert needs RSI, compute it once
        rsi_value = None
        needs_rsi = any(a.kind.startswith("rsi") for a in alerts)
        if needs_rsi:
            try:
                candles = get_history(symbol, days=120, interval="day", db=db)
                if len(candles) >= 30:
                    closes = [c["close"] for c in candles]
                    series = indicators.rsi(closes, 14)
                    rsi_value = series[-1]
            except Exception as e:  # noqa: BLE001
                log.debug("RSI fetch failed for %s: %s", symbol, e)

        for a in alerts:
            triggered = False
            value = None
            if a.kind == "price_above" and last > a.threshold:
                triggered = True; value = last
            elif a.kind == "price_below" and last < a.threshold:
                triggered = True; value = last
            elif a.kind == "rsi_above" and rsi_value is not None and rsi_value > a.threshold:
                triggered = True; value = rsi_value
            elif a.kind == "rsi_below" and rsi_value is not None and rsi_value < a.threshold:
                triggered = True; value = rsi_value

            a.last_checked_at = now
            if triggered:
                a.triggered_at = now
                evt = AlertEvent(
                    alert_id=a.id, user_id=a.user_id, symbol=a.symbol,
                    fired_value=value,
                    note=f"{a.kind.replace('_', ' ').title()} {a.threshold} (was {value:.2f})",
                )
                db.add(evt)
                fired += 1
    db.commit()
    return {"checked": len(rows), "fired": fired}


def _alert_to_dict(r: Alert) -> dict:
    return {
        "id": r.id, "symbol": r.symbol, "kind": r.kind,
        "threshold": r.threshold, "timeframe": r.timeframe,
        "active": r.active, "note": r.note,
        "triggered_at": r.triggered_at.isoformat() if r.triggered_at else None,
        "last_checked_at": r.last_checked_at.isoformat() if r.last_checked_at else None,
        "created_at": r.created_at.isoformat(),
    }


# =============================================================
# Portfolio Doctor
# =============================================================

class AddHoldingIn(BaseModel):
    symbol: str = Field(..., max_length=40)
    qty: float = Field(..., gt=0)
    avg_buy_price: float = Field(..., gt=0)


@router_portfolio.get("")
def get_portfolio(user: User = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    rows = (db.query(PortfolioHolding)
            .filter(PortfolioHolding.user_id == user.id).all())
    if not rows:
        return {
            "holdings": [], "total_invested": 0, "total_current": 0,
            "total_pnl": 0, "total_pnl_pct": 0,
            "doctor": {"verdict": "—", "star_rating": 0, "concerns": [], "wins": []},
        }

    symbols = [r.symbol for r in rows]
    try:
        quotes = get_quote(symbols, db=db)
    except (DataSourceAuthError, DataSourceError):
        quotes = {}

    holdings = []
    total_invested = 0.0
    total_current = 0.0

    for r in rows:
        q = quotes.get(r.symbol) or {}
        last = q.get("last_price") or r.avg_buy_price
        invested = r.qty * r.avg_buy_price
        current = r.qty * last
        pnl = current - invested
        pnl_pct = (pnl / invested * 100) if invested else 0
        holdings.append({
            "id": r.id, "symbol": r.symbol, "qty": r.qty,
            "avg_buy_price": r.avg_buy_price, "last_price": last,
            "invested": round(invested, 2),
            "current_value": round(current, 2),
            "pnl": round(pnl, 2),
            "pnl_pct": round(pnl_pct, 2),
        })
        total_invested += invested
        total_current += current

    total_pnl = total_current - total_invested
    total_pnl_pct = (total_pnl / total_invested * 100) if total_invested else 0

    # Doctor heuristics
    concerns = []
    wins = []
    star_rating = 3  # baseline

    biggest = max(holdings, key=lambda h: h["current_value"])
    biggest_pct = biggest["current_value"] / total_current * 100 if total_current else 0
    if biggest_pct > 40:
        concerns.append(f"{biggest['symbol']} is {biggest_pct:.0f}% of your portfolio - high concentration risk.")
        star_rating -= 1
    elif biggest_pct < 10 and len(holdings) > 10:
        wins.append("Well diversified across many holdings.")
        star_rating += 1

    if len(holdings) < 5:
        concerns.append(f"Only {len(holdings)} holding{'s' if len(holdings)>1 else ''} - consider 8-15 for risk spread.")
        star_rating -= 1
    elif 8 <= len(holdings) <= 18:
        star_rating += 1
    elif len(holdings) > 25:
        concerns.append(f"{len(holdings)} holdings is a lot - consider trimming weak ones.")

    big_losers = [h for h in holdings if h["pnl_pct"] < -15]
    if big_losers:
        names = ", ".join(h["symbol"] for h in big_losers[:3])
        concerns.append(f"{len(big_losers)} holding(s) down >15%: {names}. Review thesis.")
        star_rating -= 1

    big_winners = [h for h in holdings if h["pnl_pct"] > 50]
    if big_winners:
        names = ", ".join(h["symbol"] for h in big_winners[:3])
        wins.append(f"{len(big_winners)} winner(s) up >50%: {names}.")
        star_rating += 1

    if total_pnl_pct > 10:
        wins.append(f"Overall portfolio up {total_pnl_pct:.1f}%.")
        star_rating += 1
    elif total_pnl_pct < -10:
        concerns.append(f"Overall portfolio down {abs(total_pnl_pct):.1f}%.")
        star_rating -= 1

    star_rating = max(1, min(5, star_rating))

    if not concerns: verdict = "Healthy"
    elif len(concerns) == 1: verdict = "Mostly healthy"
    elif len(concerns) <= 3: verdict = "Needs attention"
    else: verdict = "Significant issues"

    return {
        "holdings": holdings,
        "total_invested": round(total_invested, 2),
        "total_current": round(total_current, 2),
        "total_pnl": round(total_pnl, 2),
        "total_pnl_pct": round(total_pnl_pct, 2),
        "doctor": {
            "verdict": verdict,
            "star_rating": star_rating,
            "concerns": concerns,
            "wins": wins,
        },
    }


@router_portfolio.get("/insights")
async def get_portfolio_insights(user: User = Depends(get_current_user),
                                 db: Session = Depends(get_db)):
    """
    DeepSeek-generated 3 specific recommendations based on the user's portfolio.
    Cached per-user for 1 hour to keep costs low.
    """
    cache_key = f"portfolio_insights:{user.id}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    rows = (db.query(PortfolioHolding)
            .filter(PortfolioHolding.user_id == user.id).all())
    if len(rows) < 2:
        return {
            "recommendations": [],
            "note": "Add at least 2 holdings to get personalised insights.",
        }

    symbols = [r.symbol for r in rows]
    try:
        quotes = get_quote(symbols, db=db)
    except (DataSourceAuthError, DataSourceError):
        quotes = {}

    holdings_text = []
    total = 0.0
    for r in rows:
        q = quotes.get(r.symbol) or {}
        last = q.get("last_price") or r.avg_buy_price
        current = r.qty * last
        invested = r.qty * r.avg_buy_price
        pnl_pct = (current - invested) / invested * 100 if invested else 0
        total += current
        holdings_text.append(
            f"  {r.symbol}: qty={r.qty:.0f}, avg_buy=₹{r.avg_buy_price:.0f}, "
            f"now=₹{last:.0f}, P&L={pnl_pct:+.1f}%"
        )

    lang_pin = (
        "Reply in English." if (user.language or "en") == "en"
        else "Reply in Hindi (Devanagari script). Keep ticker symbols and numbers in English."
    )

    system = (
        "You are Chitti, an AI portfolio advisor for Indian retail traders. "
        "Given the holdings below, return EXACTLY 3 specific, actionable "
        "recommendations. Each recommendation must:\n"
        "  - Name a specific stock from the holdings (or suggest an addition)\n"
        "  - State a clear action (Hold / Trim / Add / Exit)\n"
        "  - Give a 1-line reason\n"
        "Format as a numbered list (1. 2. 3.). No preamble, no disclaimers.\n"
        f"Total portfolio value ≈ ₹{total/1e5:.2f} L\n"
        f"Holdings:\n" + "\n".join(holdings_text) + f"\n\n{lang_pin}"
    )
    user_msg = "Give me three concrete actions for my portfolio right now."

    try:
        reply = await deepseek_chat(system, user_msg, max_tokens=400, temperature=0.55,
                                    user_id=user.id)
    except DeepSeekError as e:
        raise HTTPException(status_code=502, detail=f"DeepSeek error: {e}")

    out = {
        "recommendations_text": reply,
        "generated_at": datetime.utcnow().isoformat(),
    }
    cache.set(cache_key, out, 60 * 60)  # 1 hr
    return out


@router_portfolio.post("/holdings")
def add_holding(payload: AddHoldingIn,
                user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    existing = (db.query(PortfolioHolding)
                .filter(PortfolioHolding.user_id == user.id,
                        PortfolioHolding.symbol == payload.symbol).first())
    if existing:
        # Average the price across the combined position
        new_qty = existing.qty + payload.qty
        existing.avg_buy_price = (
            (existing.qty * existing.avg_buy_price + payload.qty * payload.avg_buy_price)
            / new_qty
        )
        existing.qty = new_qty
        db.commit()
        return {"id": existing.id, "merged": True}
    row = PortfolioHolding(user_id=user.id, **payload.model_dump())
    db.add(row); db.commit(); db.refresh(row)
    return {"id": row.id, "merged": False}


@router_portfolio.post("/upload")
async def upload_holdings_csv(file: UploadFile = File(...),
                              user: User = Depends(get_current_user),
                              db: Session = Depends(get_db)):
    """
    Zerodha 'holdings.csv' importer.
    Expected columns: Instrument, Qty., Avg. cost (other columns ignored).
    Wipes existing holdings then imports fresh - this is "replace" not "merge".
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")

    raw = (await file.read()).decode("utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(raw))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV is empty")

    # Normalize header lookup - strip whitespace + dots, lowercase
    def norm(s): return (s or "").strip().lower().replace(".", "").replace(" ", "")
    header_map = {norm(h): h for h in reader.fieldnames}

    sym_col = header_map.get("instrument") or header_map.get("symbol") or header_map.get("tradingsymbol")
    qty_col = header_map.get("qty") or header_map.get("quantity")
    avg_col = (header_map.get("avgcost") or header_map.get("avgprice")
               or header_map.get("averagecost") or header_map.get("buyprice"))

    if not (sym_col and qty_col and avg_col):
        raise HTTPException(
            status_code=400,
            detail=f"CSV must have Instrument, Qty., Avg. cost columns. Found: {reader.fieldnames}"
        )

    new_rows = []
    skipped = []
    for row in reader:
        try:
            sym_raw = (row[sym_col] or "").strip().upper()
            if not sym_raw: continue
            # Zerodha exports plain symbol like "RELIANCE" - canonicalise
            sym = sym_raw if ":" in sym_raw else f"NSE:{sym_raw}"
            qty = float((row[qty_col] or "0").replace(",", ""))
            avg = float((row[avg_col] or "0").replace(",", "").replace("₹", "").strip())
            if qty <= 0 or avg <= 0:
                skipped.append(f"{sym_raw}: invalid qty/price"); continue
            new_rows.append((sym, qty, avg))
        except (ValueError, KeyError) as e:
            skipped.append(f"{row.get(sym_col, '?')}: {e}")

    if not new_rows:
        raise HTTPException(
            status_code=400,
            detail=f"No valid holdings parsed. Skipped: {skipped[:5]}"
        )

    # Replace existing holdings
    db.query(PortfolioHolding).filter(PortfolioHolding.user_id == user.id).delete()
    for sym, qty, avg in new_rows:
        db.add(PortfolioHolding(user_id=user.id, symbol=sym, qty=qty, avg_buy_price=avg))
    db.commit()
    # Invalidate insights cache
    cache.set(f"portfolio_insights:{user.id}", None, 1)

    return {
        "imported": len(new_rows),
        "skipped": len(skipped),
        "skipped_reasons": skipped[:10],
    }


@router_portfolio.delete("/holdings/{holding_id}")
def remove_holding(holding_id: int,
                   user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    row = (db.query(PortfolioHolding)
           .filter(PortfolioHolding.id == holding_id,
                   PortfolioHolding.user_id == user.id).first())
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(row); db.commit()
    cache.set(f"portfolio_insights:{user.id}", None, 1)
    return {"ok": True}
