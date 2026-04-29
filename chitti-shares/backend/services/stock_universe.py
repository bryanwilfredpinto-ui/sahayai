"""
services/stock_universe.py
--------------------------
Manages the stocks master table.
  - seed_if_empty(): loads config/nifty_universe.json on first run
  - search(q):       prefix + substring search on symbol & name
  - get_by_symbol(): one row by canonical symbol
"""

import json
import logging
import os
from datetime import datetime

from database import SessionLocal
from models.stock_universe import Stock

log = logging.getLogger("stock_universe")

UNIVERSE_FILE = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),  # backend/
    "config", "nifty_universe.json",
)


def seed_if_empty():
    """First-run seed. Idempotent - skips if table has rows."""
    db = SessionLocal()
    try:
        existing = db.query(Stock).count()
        if existing > 0:
            log.info("Stock universe already seeded (%d rows)", existing)
            return
        if not os.path.exists(UNIVERSE_FILE):
            log.warning("Stock universe file missing: %s", UNIVERSE_FILE)
            return
        with open(UNIVERSE_FILE, "r", encoding="utf-8") as f:
            stocks = json.load(f)
        for s in stocks:
            db.add(Stock(
                symbol=s["symbol"],
                name=s["name"],
                sector=s.get("sector"),
                in_nifty_500=1,
            ))
        db.commit()
        log.info("Seeded %d stocks into universe", len(stocks))
    except Exception as e:  # noqa: BLE001
        log.exception("Stock universe seed failed: %s", e)
        db.rollback()
    finally:
        db.close()


def search(q: str, limit: int = 12) -> list[dict]:
    """
    Case-insensitive substring search. Symbol matches rank above name matches.
    Returns up to `limit` rows.
    """
    if not q or len(q.strip()) < 1:
        return []
    needle = q.strip().upper()
    db = SessionLocal()
    try:
        # Tier 1: symbol prefix (RELI -> RELIANCE)
        # Tier 2: symbol contains (LIANC -> RELIANCE)
        # Tier 3: name contains (Reliance Industries)
        sym_prefix = (db.query(Stock)
                      .filter(Stock.symbol.like(f"NSE:{needle}%") |
                              Stock.symbol.like(f"BSE:{needle}%"))
                      .limit(limit).all())
        seen = {s.symbol for s in sym_prefix}

        if len(sym_prefix) < limit:
            sym_contains = (db.query(Stock)
                            .filter(Stock.symbol.like(f"%{needle}%"))
                            .filter(~Stock.symbol.in_(seen) if seen else True)
                            .limit(limit - len(sym_prefix)).all())
            seen.update(s.symbol for s in sym_contains)
        else:
            sym_contains = []

        remaining = limit - len(sym_prefix) - len(sym_contains)
        name_match = []
        if remaining > 0:
            name_match = (db.query(Stock)
                          .filter(Stock.name.ilike(f"%{q.strip()}%"))
                          .filter(~Stock.symbol.in_(seen) if seen else True)
                          .limit(remaining).all())

        results = sym_prefix + sym_contains + name_match
        return [_to_dict(s) for s in results]
    finally:
        db.close()


def get_by_symbol(symbol: str) -> dict | None:
    db = SessionLocal()
    try:
        s = db.query(Stock).filter(Stock.symbol == symbol).first()
        return _to_dict(s) if s else None
    finally:
        db.close()


def _to_dict(s: Stock) -> dict:
    return {
        "symbol": s.symbol,
        "name": s.name,
        "sector": s.sector,
        "market_cap_cr": s.market_cap_cr,
        "in_nifty_500": bool(s.in_nifty_500),
    }
