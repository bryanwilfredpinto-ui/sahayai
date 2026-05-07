"""
database.py
-----------
Sets up the SQLAlchemy database connection and provides:
- `engine`: the connection to the database
- `SessionLocal`: factory that creates short-lived DB sessions
- `Base`: parent class all our model classes inherit from
- `get_db`: FastAPI dependency that opens a session per request

Switching between SQLite (local) and Postgres (Render) is automatic
based on the DATABASE_URL env var.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from config import settings

# SQLite needs this special arg; Postgres does not.
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Render / Heroku give Postgres URLs starting with "postgres://" but
# SQLAlchemy 2.x wants "postgresql://" - patch it here. Supabase URLs
# already use the modern "postgresql://" prefix so this is a no-op for them.
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    FastAPI dependency. Every route that needs the DB declares
    `db: Session = Depends(get_db)` and gets a fresh session.
    The session is closed automatically when the request finishes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_schema() -> None:
    """
    CREATE SCHEMA IF NOT EXISTS shares on Postgres. No-op on SQLite.
    Must be called BEFORE Base.metadata.create_all() so the schema-
    qualified tables defined in models/* have a place to land.

    On Supabase the chitti-medupi service runs CREATE SCHEMA … medupi
    against the same DB. Both are independent — neither service sees
    the other's tables.
    """
    # Late import to keep this module's top-level free of model imports.
    from models._schema import SCHEMA
    if not SCHEMA:
        return
    with engine.begin() as conn:
        conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS {SCHEMA}'))
