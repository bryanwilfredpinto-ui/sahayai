"""
services/deps.py
----------------
FastAPI dependencies (small reusable functions injected into routes).

`get_current_user` extracts the access token from the Authorization
header, validates it, and returns the matching User from the DB.
Any route that does `user: User = Depends(get_current_user)` is
automatically protected.
"""

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models.user import User
from services.auth_helpers import decode_token


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header",
        )
    token = authorization.split(" ", 1)[1].strip()
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        )
    user_id = int(payload["sub"])
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )
    return user


def get_admin_user(user: User = Depends(get_current_user)) -> User:
    """
    Same as get_current_user but additionally checks the user's mobile
    matches ADMIN_MOBILE env var. Used for Kite OAuth endpoints which
    only the admin runs (once a day after Kite token expiry at 6 AM IST).
    """
    admin_mobile = (settings.ADMIN_MOBILE or "").strip()
    if not admin_mobile:
        raise HTTPException(
            status_code=503,
            detail="ADMIN_MOBILE not configured on server",
        )
    if user.mobile != admin_mobile:
        raise HTTPException(
            status_code=403, detail="Admin access required"
        )
    return user
