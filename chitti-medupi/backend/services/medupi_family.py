"""
services/medupi_family.py
-------------------------
Multi-profile Family Wallet — add/list profiles, log a wallet entry,
compute monthly + annual savings.

Auth is intentionally light for v1 — keyed by `user_token` (an opaque
string the frontend stores in localStorage; e.g. `crypto.randomUUID()`).
ABDM-grade auth swaps user_token for a verified phone hash later.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Iterable

from sqlalchemy.orm import Session

from models.family import FamilyProfile
from models.wallet import WalletEntry

log = logging.getLogger("medupi_family")


# ───── Profiles ─────

def _profile_dict(p: FamilyProfile) -> dict:
    try:
        conditions = json.loads(p.conditions) if p.conditions else []
    except (TypeError, ValueError):
        conditions = []
    return {
        "id": p.id,
        "name": p.name,
        "relation": p.relation,
        "dob": p.dob,
        "conditions": conditions,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


def list_profiles(db: Session, user_token: str) -> list[dict]:
    rows = (
        db.query(FamilyProfile)
        .filter(FamilyProfile.user_token == user_token)
        .order_by(FamilyProfile.created_at.asc())
        .all()
    )
    # Defensive: Turso embedded replica can hand back None entries when
    # the sync thread races a read. See list_profiles in
    # health_file_service.py for the parallel fix.
    return [_profile_dict(r) for r in rows if r is not None]


def add_profile(
    db: Session,
    user_token: str,
    name: str,
    relation: str = "self",
    dob: str | None = None,
    conditions: list[str] | None = None,
) -> dict:
    from datetime import datetime as _dt
    cond_list = list(conditions or [])
    created_at = _dt.utcnow()
    p = FamilyProfile(
        user_token=user_token,
        name=name.strip(),
        relation=relation.strip() or "self",
        dob=(dob or None),
        conditions=json.dumps(cond_list),
        created_at=created_at,
    )
    db.add(p)
    db.flush()
    # Snapshot attrs BEFORE commit — Turso embedded-replica sync can
    # invalidate the row between commit and attribute access.
    out = {
        "id": p.id, "name": p.name, "relation": p.relation,
        "dob": p.dob, "conditions": cond_list,
        "created_at": created_at.isoformat(),
    }
    db.commit()
    return out


def delete_profile(db: Session, user_token: str, profile_id: int) -> bool:
    p = (
        db.query(FamilyProfile)
        .filter(FamilyProfile.user_token == user_token, FamilyProfile.id == profile_id)
        .first()
    )
    if not p:
        return False
    db.delete(p)
    db.commit()
    return True


# ───── Wallet entries ─────

def _entry_dict(e: WalletEntry) -> dict:
    return {
        "id": e.id,
        "profile_id": e.profile_id,
        "medicine_name": e.medicine_name,
        "salt_composition": e.salt_composition,
        "qty": e.qty,
        "price_paid": e.price_paid,
        "cheapest_equivalent_price": e.cheapest_equivalent_price,
        "savings_realized": e.savings_realized,
        "purchased_at": e.purchased_at.isoformat() if e.purchased_at else None,
    }


def add_wallet_entry(
    db: Session,
    user_token: str,
    profile_id: int,
    medicine_name: str,
    qty: int = 1,
    price_paid: float = 0.0,
    cheapest_equivalent_price: float | None = None,
    salt_composition: str | None = None,
) -> dict:
    profile = (
        db.query(FamilyProfile)
        .filter(FamilyProfile.user_token == user_token, FamilyProfile.id == profile_id)
        .first()
    )
    if not profile:
        raise ValueError("profile not found for this user_token")

    savings = 0.0
    if cheapest_equivalent_price is not None and price_paid > cheapest_equivalent_price:
        savings = round((price_paid - cheapest_equivalent_price) * max(qty, 1), 2)

    e = WalletEntry(
        profile_id=profile.id,
        user_token=user_token,
        medicine_name=medicine_name.strip(),
        salt_composition=(salt_composition or None),
        qty=max(1, int(qty)),
        price_paid=float(price_paid or 0.0),
        cheapest_equivalent_price=cheapest_equivalent_price,
        savings_realized=savings,
        purchased_at=datetime.utcnow(),
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    return _entry_dict(e)


def list_wallet_entries(
    db: Session, user_token: str, profile_id: int | None = None, limit: int = 200
) -> list[dict]:
    q = db.query(WalletEntry).filter(WalletEntry.user_token == user_token)
    if profile_id is not None:
        q = q.filter(WalletEntry.profile_id == profile_id)
    rows = q.order_by(WalletEntry.purchased_at.desc()).limit(limit).all()
    return [_entry_dict(r) for r in rows]


# ───── Reports ─────

def _sum(entries: Iterable[dict], key: str) -> float:
    return round(sum((e.get(key) or 0) for e in entries), 2)


def wallet_report(db: Session, user_token: str, profile_id: int | None = None) -> dict:
    """
    Returns:
      {
        profile_id, this_month_spend, this_month_saved,
        last_12_months_spend, last_12_months_saved, annual_projection,
        entries: [...],
        speak_en, speak_hi, caption_en, caption_hi
      }
    """
    entries = list_wallet_entries(db, user_token, profile_id=profile_id, limit=500)
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    year_start = (now - timedelta(days=365))

    this_month = [
        e for e in entries
        if e["purchased_at"] and datetime.fromisoformat(e["purchased_at"]) >= month_start
    ]
    last_12m = [
        e for e in entries
        if e["purchased_at"] and datetime.fromisoformat(e["purchased_at"]) >= year_start
    ]

    this_month_spend = _sum(this_month, "price_paid")
    this_month_saved = _sum(this_month, "savings_realized")
    year_spend = _sum(last_12m, "price_paid")
    year_saved = _sum(last_12m, "savings_realized")

    # Naive projection: extrapolate this-month spend × 12
    projection = round(this_month_spend * 12, 2)

    speak_en = (
        f"This month you spent {int(this_month_spend)} rupees and saved "
        f"{int(this_month_saved)}. Over the last 12 months you saved "
        f"{int(year_saved)} rupees by choosing same-composition equivalents."
    )
    speak_hi = (
        f"इस माह आपने {int(this_month_spend)} रुपये खर्च किए और {int(this_month_saved)} रुपये बचाए। "
        f"पिछले 12 महीनों में समान-संरचना विकल्पों से {int(year_saved)} रुपये की बचत हुई।"
    )

    return {
        "profile_id": profile_id,
        "this_month_spend": this_month_spend,
        "this_month_saved": this_month_saved,
        "last_12_months_spend": year_spend,
        "last_12_months_saved": year_saved,
        "annual_projection": projection,
        "entries": entries,
        "speak_en": speak_en,
        "speak_hi": speak_hi,
        "caption_en": (
            f"This month: ₹{int(this_month_spend)} spent · ₹{int(this_month_saved)} saved"
        ),
        "caption_hi": (
            f"इस माह: ₹{int(this_month_spend)} खर्च · ₹{int(this_month_saved)} बचत"
        ),
    }
