"""
chitti-2wheeler / backend / models / __init__.py
------------------------------------------------
Importing this module registers every SQLAlchemy model with
`Base.metadata` so `Base.metadata.create_all(bind=engine)` in main.py
sees the tables on first boot.
"""
from .vehicle import BikeProfile, PassportEvent  # noqa: F401

__all__ = ["BikeProfile", "PassportEvent"]
