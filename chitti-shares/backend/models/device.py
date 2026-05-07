"""
models/device.py
----------------
Two tables here:

1. Device  - one row per logged-in device.
   Used to enforce "max 2 devices per user (1 mobile + 1 desktop)"
   and to power the Settings page.

2. OTP     - one row per OTP we send.
   We store a HASH of the OTP (not the OTP itself) so even if
   the DB leaks, attackers can't read codes.
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from database import Base
from models._schema import TABLE_KW, fk_target


class Device(Base):
    __tablename__ = "devices"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(fk_target("users")), nullable=False, index=True)

    # Stable fingerprint of the browser/device (from fingerprintjs)
    device_id = Column(String(128), nullable=False, index=True)

    # "mobile" or "desktop" - decides which slot this device occupies
    device_type = Column(String(16), nullable=False)

    # Free-text user-agent so the Settings page can show "Chrome on iPhone"
    user_agent = Column(String(400), nullable=True)

    # Refresh token's unique ID (jti). When a device is force-logged-out,
    # we delete the row so its refresh token stops working.
    refresh_jti = Column(String(64), nullable=False, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_active = Column(DateTime, default=datetime.utcnow, nullable=False)


class OTP(Base):
    __tablename__ = "otps"
    __table_args__ = TABLE_KW

    id = Column(Integer, primary_key=True, index=True)
    mobile = Column(String(10), nullable=False, index=True)

    # bcrypt hash of the 6-digit code
    code_hash = Column(String(200), nullable=False)

    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Counts wrong-OTP attempts; lock after a few
    attempts = Column(Integer, default=0, nullable=False)
