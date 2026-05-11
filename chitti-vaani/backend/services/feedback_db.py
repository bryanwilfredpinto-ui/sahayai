"""
services/feedback_db.py
-----------------------
DB layer for the cross-product feedback widget (👍 / 👎 / 💡 suggestion).

ONE table — feedback_log. Lives on the same database as admin_db
(Neon Postgres in prod via DATABASE_URL, SQLite in local dev).

Two read paths consumed by the admin dashboard + the daily scoring run:
  - thumbs_counts(since)  → per-page tally of 👍/👎
  - suggestions(since)    → cleaned suggestion list (de-duped, junk-filtered)

Junk filtering:
  - one-word suggestions are dropped
  - duplicates from the same page (case- and whitespace-insensitive) collapse
    to the first occurrence (with frequency count)
  - "impossible-request" patterns (regex) are dropped — see _IMPOSSIBLE
"""
from __future__ import annotations

import logging
import os
import re
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from typing import Iterator, Optional

from sqlalchemy import (
    Column, DateTime, Index, Integer, String, Text, create_engine, func, text,
)
from sqlalchemy.orm import declarative_base, sessionmaker

log = logging.getLogger("feedback_db")

Base = declarative_base()

# Allowed type values from the widget. Anything else is rejected at the route layer.
TYPE_THUMBS_UP   = "thumbs_up"
TYPE_THUMBS_DOWN = "thumbs_down"
TYPE_SUGGESTION  = "suggestion"
ALLOWED_TYPES    = (TYPE_THUMBS_UP, TYPE_THUMBS_DOWN, TYPE_SUGGESTION)

ALLOWED_SEGMENTS = (
    "blind", "deaf", "mute", "illiterate", "elderly", "general",
)


def _resolve_url() -> str:
    url = (
        os.environ.get("FEEDBACK_DATABASE_URL")
        or os.environ.get("ADMIN_DATABASE_URL")
        or os.environ.get("DATABASE_URL")
        or ""
    )
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg2://", 1)
    if not url:
        path = os.environ.get("FEEDBACK_DB_PATH", "/tmp/chitti_feedback.sqlite")
        url = f"sqlite:///{path}"
    return url


_DB_URL = _resolve_url()
_IS_SQLITE = _DB_URL.startswith("sqlite")

_engine = create_engine(
    _DB_URL,
    pool_pre_ping=True,
    connect_args={"check_same_thread": False} if _IS_SQLITE else {},
    future=True,
)
SessionLocal = sessionmaker(bind=_engine, autoflush=False, autocommit=False, future=True)


class FeedbackLog(Base):
    __tablename__ = "feedback_log"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    page         = Column(String(64), nullable=False, index=True)
    type         = Column(String(16), nullable=False, index=True)
    text         = Column(Text)                    # null for thumbs_up/down
    email        = Column(String(256))             # optional contact
    user_segment = Column(String(16))              # blind|deaf|mute|illiterate|elderly|general
    user_agent   = Column(String(512))
    ip_hash      = Column(String(64))              # sha256 of remote addr (privacy-preserving)
    is_junk      = Column(Integer, default=0)      # set by the daily filter; admin filters on this
    created_at   = Column(DateTime, server_default=func.now(), nullable=False)


Index("ix_feedback_log_page_type_created", FeedbackLog.page, FeedbackLog.type, FeedbackLog.created_at.desc())


@contextmanager
def session() -> Iterator:
    s = SessionLocal()
    try:
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        s.close()


_INITIALISED = False


def init_db() -> None:
    global _INITIALISED
    if _INITIALISED:
        return
    Base.metadata.create_all(bind=_engine)
    _INITIALISED = True
    log.info("feedback_db ready (backend=%s)", "sqlite" if _IS_SQLITE else "postgres")


# ── insert ────────────────────────────────────────────────────────────────

def insert_feedback(
    *,
    page: str,
    type_: str,
    text_: Optional[str],
    email: Optional[str],
    user_segment: Optional[str],
    user_agent: Optional[str],
    ip_hash: Optional[str],
) -> int:
    with session() as s:
        row = FeedbackLog(
            page=page,
            type=type_,
            text=(text_ or None),
            email=(email or None),
            user_segment=(user_segment or "general"),
            user_agent=(user_agent or "")[:512] or None,
            ip_hash=ip_hash,
        )
        s.add(row)
        s.flush()
        return int(row.id)


# ── read paths used by daily report + admin dashboard ─────────────────────

def thumbs_counts(*, since: Optional[datetime] = None) -> list[dict]:
    """Per-page tally of 👍/👎. since=None means all-time."""
    with session() as s:
        q = s.query(
            FeedbackLog.page,
            FeedbackLog.type,
            func.count(FeedbackLog.id),
        )
        if since:
            q = q.filter(FeedbackLog.created_at >= since)
        q = q.filter(FeedbackLog.type.in_([TYPE_THUMBS_UP, TYPE_THUMBS_DOWN]))
        q = q.group_by(FeedbackLog.page, FeedbackLog.type)
        rows = q.all()

    by_page: dict[str, dict] = {}
    for page, t, n in rows:
        d = by_page.setdefault(page, {"page": page, "thumbs_up": 0, "thumbs_down": 0})
        if t == TYPE_THUMBS_UP:
            d["thumbs_up"] = int(n)
        else:
            d["thumbs_down"] = int(n)
    out = list(by_page.values())
    out.sort(key=lambda r: -(r["thumbs_up"] + r["thumbs_down"]))
    return out


def total_count() -> int:
    with session() as s:
        return int(s.query(func.count(FeedbackLog.id)).scalar() or 0)


# ── junk filter ───────────────────────────────────────────────────────────

# Crude impossible-request guards. We are not trying to be clever — we are
# trying to keep Sire's daily report clean of obvious spam, abuse, or items
# we cannot ship (free money, login to my account, etc).
_IMPOSSIBLE = re.compile(
    r"(?i)\b("
    r"give\s+me\s+(money|cash|crypto|bitcoin|btc)|"
    r"send\s+me\s+(money|otp|password|aadhaar)|"
    r"hack|crack|stolen|porn|xxx|sex(?:y|ual)?|"
    r"login\s+to\s+my\s+account|"
    r"do\s+my\s+homework|"
    r"i\s+love\s+you|marry\s+me|"
    r"fuck|asshole"
    r")\b"
)


def _normalise(s: str) -> str:
    s = (s or "").strip().lower()
    s = re.sub(r"\s+", " ", s)
    return s


def _is_one_word(s: str) -> bool:
    return len(_normalise(s).split()) <= 1


def _is_impossible(s: str) -> bool:
    return bool(_IMPOSSIBLE.search(s or ""))


def filter_and_score_suggestions(*, since: Optional[datetime] = None) -> dict:
    """Pull suggestions, filter junk, deduplicate, and score the survivors.

    Returns:
      {
        "removed_one_word": int,
        "removed_impossible": int,
        "removed_duplicate": int,   # collapsed but kept as frequency on the survivor
        "kept": [ {page, text, frequency, score, ...} ],
      }

    Score formula (per Sire's spec):
      Score = (Impact × Frequency × Urgency) ÷ Effort

    We don't have Impact/Urgency/Effort labelled per row — they need a human
    judgment. As a serviceable v1, we approximate from observable signals so
    the report is at least sortable on day one:
      Impact    = 1.0 if user_segment is one of the four PWD segments, else 0.6
      Urgency   = 1.5 if a thumbs_down on the same page outnumbers thumbs_up, else 1.0
      Effort    = 1.0 (placeholder — Sire can tag this in the dashboard later)
      Frequency = number of duplicate near-identical suggestions across users.
    """
    # Pull rows into plain dicts INSIDE the session so closing the session
    # doesn't trigger DetachedInstanceError on later attribute access.
    with session() as s:
        q = s.query(FeedbackLog).filter(FeedbackLog.type == TYPE_SUGGESTION)
        if since:
            q = q.filter(FeedbackLog.created_at >= since)
        raw = [
            {
                "id": r.id,
                "page": r.page,
                "text": r.text,
                "email": r.email,
                "user_segment": r.user_segment,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in q.order_by(FeedbackLog.created_at.asc()).all()
        ]

    # Per-page urgency hint from thumbs_counts.
    thumbs = {t["page"]: t for t in thumbs_counts(since=since)}

    one_word = 0
    impossible = 0
    dup = 0
    survivors: dict[tuple[str, str], dict] = {}
    junk_ids: list[int] = []

    for r in raw:
        body = (r["text"] or "").strip()
        if not body:
            junk_ids.append(r["id"]); continue
        if _is_one_word(body):
            one_word += 1; junk_ids.append(r["id"]); continue
        if _is_impossible(body):
            impossible += 1; junk_ids.append(r["id"]); continue

        key = (r["page"] or "unknown", _normalise(body))
        if key in survivors:
            survivors[key]["frequency"] += 1
            dup += 1
            if r["email"] and r["email"] not in survivors[key]["emails"]:
                survivors[key]["emails"].append(r["email"])
            if _segment_impact(r["user_segment"]) > _segment_impact(survivors[key]["user_segment"]):
                survivors[key]["user_segment"] = r["user_segment"]
        else:
            survivors[key] = {
                "page": r["page"],
                "text": body,                       # preserve the user's casing on the first sighting
                "user_segment": r["user_segment"] or "general",
                "emails": [r["email"]] if r["email"] else [],
                "frequency": 1,
                "first_seen": r["created_at"],
                "_id": r["id"],
            }

    # Mark detected junk rows in the DB so the admin dashboard can hide them.
    if junk_ids:
        with session() as s2:
            s2.query(FeedbackLog).filter(FeedbackLog.id.in_(junk_ids)).update(
                {FeedbackLog.is_junk: 1}, synchronize_session=False,
            )

    kept: list[dict] = []
    for v in survivors.values():
        page_thumbs = thumbs.get(v["page"], {"thumbs_up": 0, "thumbs_down": 0})
        urgency = 1.5 if page_thumbs["thumbs_down"] > page_thumbs["thumbs_up"] else 1.0
        impact  = _segment_impact(v["user_segment"])
        effort  = 1.0   # placeholder: human-tagged later
        score   = (impact * v["frequency"] * urgency) / effort
        kept.append({
            "id": v["_id"],
            "page": v["page"],
            "text": v["text"],
            "user_segment": v["user_segment"],
            "emails": v["emails"],
            "frequency": v["frequency"],
            "first_seen": v["first_seen"],
            "score": round(score, 3),
            "score_components": {
                "impact": impact, "frequency": v["frequency"],
                "urgency": urgency, "effort": effort,
            },
        })
    kept.sort(key=lambda r: -r["score"])

    return {
        "removed_one_word": one_word,
        "removed_impossible": impossible,
        "removed_duplicate": dup,
        "kept": kept,
    }


def _segment_impact(seg: Optional[str]) -> float:
    # The four-user contract weights PWD segments 1.0, others 0.6.
    if seg in ("blind", "deaf", "mute", "illiterate"):
        return 1.0
    if seg == "elderly":
        return 0.8
    return 0.6


def daily_report(*, lookback_hours: int = 24) -> dict:
    """Snapshot used by the daily 6 AM IST scheduler and the admin dashboard."""
    since = datetime.now(tz=timezone.utc) - timedelta(hours=lookback_hours)
    survey = filter_and_score_suggestions(since=since)
    return {
        "generated_at": datetime.now(tz=timezone.utc).isoformat(),
        "lookback_hours": lookback_hours,
        "total_feedback_collected_all_time": total_count(),
        "thumbs_counts_window":  thumbs_counts(since=since),
        "thumbs_counts_all_time": thumbs_counts(),
        "top_suggestions":   survey["kept"][:3],
        "all_suggestions":   survey["kept"],
        "removed_one_word":  survey["removed_one_word"],
        "removed_impossible": survey["removed_impossible"],
        "removed_duplicate": survey["removed_duplicate"],
    }
