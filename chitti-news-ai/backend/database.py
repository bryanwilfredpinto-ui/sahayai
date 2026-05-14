"""
Thin SQLAlchemy bootstrap. Honest local-dev fallback to SQLite while the
Turso embedded-replica pattern (locked decision §2) is wired in via
libsql-experimental in a follow-up.
"""
from __future__ import annotations

import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from config import settings

log = logging.getLogger("chitti-news-ai.db")

# In production, settings.database_url points at libsql:// — wire the
# embedded-replica adapter here once libsql-experimental's SQLAlchemy
# dialect is ready. Until then, the local SQLite path is the honest stub
# (matches §3 process rule — never pretend a libSQL feature works when it
# hasn't been wired yet).
engine = create_engine(
    settings.database_url if settings.database_url.startswith("sqlite") else "sqlite:///chitti_news_ai.db",
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

Base = declarative_base()


def ensure_schema() -> None:
    """Create all tables. Idempotent. Called once on boot."""
    Base.metadata.create_all(bind=engine)
    log.info("schema ensured at %s", engine.url)
