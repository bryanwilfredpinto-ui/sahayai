"""
services/medupi_search_log.py
-----------------------------
Lightweight search-frequency tracker. Each text-search call upserts:
  query_normalized → count++, last_searched_at = now

The daily 2 AM IST scheduler reads `top_n(100)` to refresh cached
pharmacy prices via Brave Search.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Iterable

from sqlalchemy.orm import Session

from models.search_log import SearchLog

log = logging.getLogger("medupi_search_log")


def _normalize(q: str) -> str:
    return " ".join((q or "").lower().split())


def record(db: Session, query: str) -> None:
    """Best-effort log — exceptions never propagate (don't break a user search)."""
    try:
        qn = _normalize(query)
        if not qn or len(qn) > 160:
            return
        row = db.query(SearchLog).filter(SearchLog.query_normalized == qn).first()
        if row:
            row.count = (row.count or 0) + 1
            row.last_searched_at = datetime.utcnow()
        else:
            row = SearchLog(
                query_normalized=qn,
                display_query=query.strip()[:160],
                count=1,
                last_searched_at=datetime.utcnow(),
            )
            db.add(row)
        db.commit()
    except Exception as e:  # noqa: BLE001
        log.debug("search_log.record failed (ignored): %s", e)
        try:
            db.rollback()
        except Exception:  # noqa: BLE001
            pass


def top_n(db: Session, n: int = 100) -> list[dict]:
    rows = (
        db.query(SearchLog)
        .order_by(SearchLog.count.desc(), SearchLog.last_searched_at.desc())
        .limit(max(1, min(n, 1000)))
        .all()
    )
    return [
        {
            "query": r.display_query,
            "query_normalized": r.query_normalized,
            "count": r.count,
            "last_searched_at": r.last_searched_at.isoformat() if r.last_searched_at else None,
        }
        for r in rows
    ]
