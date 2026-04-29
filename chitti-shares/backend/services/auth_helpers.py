"""
services/auth_helpers.py
------------------------
Helpers for JWT tokens + password-style hashing of OTPs.

Two token types:
- access token  : short-lived (15 min), sent on every API call
- refresh token : long-lived (30 days), used to get new access
                  tokens without re-doing OTP. Each refresh token
                  has a unique 'jti' tied to a specific Device row,
                  so revoking the device kills the token.
"""

import secrets
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from config import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"


# ---------- OTP hashing ----------

def hash_otp(otp: str) -> str:
    return pwd_context.hash(otp)


def verify_otp(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:  # noqa: BLE001
        return False


# ---------- JWT ----------

def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_MINUTES
    )
    payload = {"sub": str(user_id), "type": "access", "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)


def create_refresh_token(user_id: int) -> tuple[str, str]:
    """
    Returns (token, jti). Store the jti on the Device row so we
    can revoke this specific refresh token later.
    """
    jti = secrets.token_urlsafe(24)
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_DAYS
    )
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "jti": jti,
        "exp": expire,
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)
    return token, jti


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
    except JWTError:
        return None
