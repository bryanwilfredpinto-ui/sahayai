"""
routes/quota.py
---------------
  GET /api/quota/today      - today's spend + caps + remaining
  GET /api/quota/history    - last 30 days
  GET /api/quota/breakdown  - this month grouped by provider/operation

All authenticated. Quota data is global (single-tenant app), but we
still gate behind auth - no point exposing the bill to the world.
"""

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models.quota import DailyQuotaSummary, UsageLog
from models.user import User
from services.deps import get_current_user
from services.usage_tracker import today_ist

router = APIRouter(prefix="/api/quota", tags=["quota"])

IST = ZoneInfo("Asia/Kolkata")


@router.get("/today")
def quota_today(_user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    row = db.query(DailyQuotaSummary).filter(
        DailyQuotaSummary.date_ist == today_ist()
    ).first()

    total = row.total_inr if row else 0.0
    soft = settings.DAILY_BUDGET_INR
    hard = settings.HARD_CAP_INR

    status = "ok"
    if total >= hard: status = "blocked"
    elif total >= soft: status = "warning"

    return {
        "date_ist": today_ist(),
        "total_inr": round(total, 2),
        "soft_cap_inr": soft,
        "hard_cap_inr": hard,
        "remaining_to_soft": round(max(0, soft - total), 2),
        "remaining_to_hard": round(max(0, hard - total), 2),
        "status": status,
        "by_provider": {
            "deepseek": round(row.deepseek_inr, 2) if row else 0,
            "fast2sms": round(row.fast2sms_inr, 2) if row else 0,
            "yahoo":    round(row.yahoo_inr, 4) if row else 0,
        },
        "call_count": row.call_count if row else 0,
        "blocked_count": row.blocked_count if row else 0,
    }


@router.get("/history")
def quota_history(_user: User = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    """Last 30 days, oldest first."""
    rows = (db.query(DailyQuotaSummary)
            .order_by(DailyQuotaSummary.date_ist.desc())
            .limit(30).all())
    return [{
        "date_ist": r.date_ist,
        "total_inr": round(r.total_inr, 2),
        "deepseek_inr": round(r.deepseek_inr, 2),
        "fast2sms_inr": round(r.fast2sms_inr, 2),
        "yahoo_inr": round(r.yahoo_inr, 4),
        "call_count": r.call_count,
    } for r in reversed(rows)]


@router.get("/breakdown")
def quota_breakdown(_user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    """This month, grouped by provider+operation."""
    today = datetime.now(IST).date()
    month_start = today.replace(day=1)

    q = (db.query(
            UsageLog.provider,
            UsageLog.operation,
            func.count(UsageLog.id).label("calls"),
            func.sum(UsageLog.cost_inr).label("cost"),
            func.sum(UsageLog.input_tokens).label("input_tokens"),
            func.sum(UsageLog.output_tokens).label("output_tokens"),
         )
         .filter(UsageLog.created_at >= datetime.combine(month_start, datetime.min.time()))
         .group_by(UsageLog.provider, UsageLog.operation)
         .order_by(func.sum(UsageLog.cost_inr).desc())
         .all())

    return [{
        "provider": p,
        "operation": op,
        "calls": calls or 0,
        "cost_inr": round(cost or 0, 4),
        "input_tokens": int(it or 0),
        "output_tokens": int(ot or 0),
    } for p, op, calls, cost, it, ot in q]
