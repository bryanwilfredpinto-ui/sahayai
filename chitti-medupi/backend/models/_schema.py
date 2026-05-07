"""
models/_schema.py
-----------------
Schema isolation for the Chitti MedUPI backend.

We share the chitti-shares Postgres database (free-tier limit on Render
forbids a second free DB) but keep all our tables under a dedicated
`medupi` schema so the two services don't collide.

Postgres → schema = 'medupi'.   Cross-schema FK target = 'medupi.foo.id'
SQLite  → schema = None.        FK target = 'foo.id' (SQLite has no schemas)

Usage in a model:

    from models._schema import TABLE_KW, fk_target

    class Reminder(Base):
        __tablename__ = "reminders"
        profile_id = Column(Integer, ForeignKey(fk_target("family_profiles")),
                            index=True, nullable=False)
        # ... columns ...
        __table_args__ = TABLE_KW           # → {"schema": "medupi"} on Postgres

For models that already need __table_args__ to carry an Index, pass a tuple
ending in TABLE_KW:

    __table_args__ = (Index(...), TABLE_KW)
"""
from __future__ import annotations

from config import settings


def _detect_schema() -> str | None:
    """Postgres → 'medupi'. Anything else (SQLite local dev) → None."""
    url = (settings.DATABASE_URL or "").lower()
    if url.startswith("postgres://") or url.startswith("postgresql"):
        return "medupi"
    return None


SCHEMA: str | None = _detect_schema()

# Pass to __table_args__ on every model so SQLAlchemy puts the table in the
# right schema. Empty dict on SQLite (so the table goes into the default
# schema, which is what SQLite supports).
TABLE_KW: dict = {"schema": SCHEMA} if SCHEMA else {}


def fk_target(table_name: str, column: str = "id") -> str:
    """ForeignKey target string. 'medupi.foo.id' on Postgres; 'foo.id' on SQLite."""
    prefix = f"{SCHEMA}." if SCHEMA else ""
    return f"{prefix}{table_name}.{column}"


def qualified(table_name: str) -> str:
    """Schema-qualified table name for raw SQL (ALTER TABLE etc.)."""
    return f"{SCHEMA}.{table_name}" if SCHEMA else table_name
