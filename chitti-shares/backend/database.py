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

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from config import settings

# SQLite needs this special arg; Postgres does not.
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Render gives Postgres URLs starting with "postgres://" but
# SQLAlchemy 2.x wants "postgresql://" - patch it here.
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
