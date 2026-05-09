"""
services/government_database.py
-------------------------------
Schema bootstrap + scheme catalog loader.

The seed catalog is hand-curated in data/schemes_seed.json — 30 popular
central + state schemes with the eligibility predicates, exclusion
clauses, and document checklists baked in. We keep this in-tree (not
behind a network fetch) so the service is fully usable on first boot
even if all external sources are blocked.

The MyScheme nightly refresh (services/government_pib.py runs in the
same APScheduler) updates `last_synced_at` and may add new rows but
will never delete a curated seed row.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path

from sqlalchemy import text

from database import SessionLocal, engine
from models._schema import SCHEMA
from models.scheme import Scheme

log = logging.getLogger("services.government_database")

SEED_PATH = Path(__file__).resolve().parents[1] / "data" / "schemes_seed.json"


def ensure_schema() -> None:
    """`CREATE SCHEMA IF NOT EXISTS government` on Postgres. No-op on SQLite."""
    if not SCHEMA:
        return
    with engine.begin() as conn:
        conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{SCHEMA}"'))
    log.info("ensured schema: %s", SCHEMA)


def _load_seed() -> list[dict]:
    if not SEED_PATH.exists():
        log.warning("seed file missing: %s", SEED_PATH)
        return []
    with SEED_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def seed_if_empty() -> int:
    """Insert the curated catalog if and only if `schemes` is empty.
    Returns the number of rows inserted. Idempotent across worker boots.
    """
    db = SessionLocal()
    try:
        if db.query(Scheme).count() > 0:
            return 0
        rows = _load_seed()
        n = 0
        now = datetime.utcnow()
        for r in rows:
            scheme = Scheme(
                slug=r["slug"],
                name_en=r["name_en"],
                name_hi=r.get("name_hi"),
                short_code=r.get("short_code"),
                ministry=r.get("ministry"),
                level=r.get("level", "central"),
                state_code=r.get("state_code"),
                category=r.get("category") or [],
                benefit_amount_inr=r.get("benefit_amount_inr"),
                benefit_type=r.get("benefit_type"),
                benefit_summary_en=r.get("benefit_summary_en"),
                benefit_summary_hi=r.get("benefit_summary_hi"),
                age_min=r.get("age_min"),
                age_max=r.get("age_max"),
                gender=r.get("gender"),
                income_max_annual_inr=r.get("income_max_annual_inr"),
                bpl_required=r.get("bpl_required"),
                secc_deprivation_required=r.get("secc_deprivation_required"),
                occupation=r.get("occupation") or [],
                landholding_max_ha=r.get("landholding_max_ha"),
                landholding_min_ha=r.get("landholding_min_ha"),
                caste=r.get("caste") or [],
                disability_required=r.get("disability_required"),
                rural_urban=r.get("rural_urban"),
                exclusions=r.get("exclusions") or [],
                eligibility_notes_en=r.get("eligibility_notes_en"),
                eligibility_notes_hi=r.get("eligibility_notes_hi"),
                documents_required=r.get("documents_required") or [],
                application_url=r.get("application_url"),
                status_check_url=r.get("status_check_url"),
                source_url=r.get("source_url"),
                helpline=r.get("helpline"),
                is_active=True,
                last_synced_at=now,
                created_at=now,
            )
            db.add(scheme)
            n += 1
        db.commit()
        return n
    finally:
        db.close()


def list_schemes(
    db,
    *,
    state_code: str | None = None,
    category: str | None = None,
    q: str | None = None,
    limit: int = 200,
) -> list[Scheme]:
    query = db.query(Scheme).filter(Scheme.is_active.is_(True))
    if state_code:
        query = query.filter(
            (Scheme.state_code == state_code) | (Scheme.level == "central")
        )
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(
            (Scheme.name_en.ilike(like))
            | (Scheme.name_hi.ilike(like))
            | (Scheme.short_code.ilike(like))
            | (Scheme.slug.ilike(like))
        )
    rows = query.order_by(Scheme.level.desc(), Scheme.name_en.asc()).limit(limit).all()
    if category:
        rows = [r for r in rows if category in (r.category or [])]
    return rows


def get_by_slug(db, slug: str) -> Scheme | None:
    return db.query(Scheme).filter(Scheme.slug == slug).first()
