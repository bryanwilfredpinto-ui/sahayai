"""
routes/auth.py
--------------
All authentication endpoints:

  POST /auth/send-otp     - generate + send OTP to mobile
  POST /auth/verify-otp   - verify OTP, return JWT pair, register device
  POST /auth/refresh      - swap refresh token for new access token
  POST /auth/logout       - revoke this device's refresh token

Device management rule:
  Each user may have at most 1 'mobile' device + 1 'desktop' device
  logged in. A 3rd login of the SAME type kicks out the oldest device
  of that type (by deleting its Device row, which invalidates its
  refresh token).
"""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from database import get_db
from models.device import OTP, Device
from models.user import User
from services.auth_helpers import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_otp,
    verify_otp,
)
from services.otp_sender import generate_otp, send_otp_sms
from config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


# ---------------- Request/Response Schemas ----------------

INDIAN_MOBILE_PATTERN = r"^[6-9]\d{9}$"


class SendOTPIn(BaseModel):
    mobile: str = Field(..., pattern=INDIAN_MOBILE_PATTERN)


class VerifyOTPIn(BaseModel):
    mobile: str = Field(..., pattern=INDIAN_MOBILE_PATTERN)
    otp: str = Field(..., min_length=4, max_length=8)
    device_id: str = Field(..., min_length=4, max_length=128)
    device_type: str = Field(..., pattern=r"^(mobile|desktop)$")
    user_agent: str | None = Field(default=None, max_length=400)

    @field_validator("otp")
    @classmethod
    def digits_only(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("OTP must be digits only")
        return v


class RefreshIn(BaseModel):
    refresh_token: str


class LogoutIn(BaseModel):
    refresh_token: str | None = None


class TokensOut(BaseModel):
    access_token: str
    refresh_token: str
    user: dict


# ---------------- Endpoints ----------------

@router.post("/send-otp")
async def send_otp(payload: SendOTPIn, db: Session = Depends(get_db)):
    """
    Generate a fresh OTP, hash + store it, then SMS it via Fast2SMS.
    Always returns 200 to avoid leaking whether a number is registered.
    """
    code = generate_otp()
    otp_row = OTP(
        mobile=payload.mobile,
        code_hash=hash_otp(code),
        expires_at=datetime.utcnow()
        + timedelta(minutes=settings.OTP_EXPIRY_MINUTES),
    )
    db.add(otp_row)
    db.commit()

    sent = await send_otp_sms(payload.mobile, code)
    if not sent:
        raise HTTPException(
            status_code=502, detail="SMS provider failed - try again"
        )

    return {
        "ok": True,
        "message": f"OTP sent to {payload.mobile}",
        "expires_in_minutes": settings.OTP_EXPIRY_MINUTES,
    }


@router.post("/verify-otp", response_model=TokensOut)
def verify_otp_endpoint(
    payload: VerifyOTPIn,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Verify OTP, create user if first login, register device,
    enforce 2-device limit, and return JWT pair.
    """
    # 1. Find latest non-expired OTP for this mobile
    otp_row = (
        db.query(OTP)
        .filter(OTP.mobile == payload.mobile)
        .filter(OTP.expires_at > datetime.utcnow())
        .order_by(OTP.id.desc())
        .first()
    )
    if not otp_row:
        raise HTTPException(
            status_code=400, detail="OTP expired or not requested. Try again."
        )

    if otp_row.attempts >= 5:
        raise HTTPException(
            status_code=429,
            detail="Too many wrong attempts. Request a new OTP.",
        )

    # 2. Verify the code
    if not verify_otp(payload.otp, otp_row.code_hash):
        otp_row.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Wrong OTP")

    # 3. Burn the OTP (and any older ones for this mobile)
    db.query(OTP).filter(OTP.mobile == payload.mobile).delete()
    db.commit()

    # 4. Find or create the user
    user = db.query(User).filter(User.mobile == payload.mobile).first()
    if not user:
        user = User(mobile=payload.mobile, name="Trader")
        db.add(user)
        db.commit()
        db.refresh(user)

    # 5. Enforce 2-device rule (per type).
    #    If user already has a device of THIS type with a DIFFERENT
    #    device_id, delete the old one (kicks them out).
    existing = (
        db.query(Device)
        .filter(Device.user_id == user.id, Device.device_type == payload.device_type)
        .all()
    )
    for d in existing:
        if d.device_id != payload.device_id:
            db.delete(d)
    db.commit()

    # 6. Upsert this device row + new refresh token
    refresh_token, jti = create_refresh_token(user.id)
    device = (
        db.query(Device)
        .filter(
            Device.user_id == user.id,
            Device.device_id == payload.device_id,
        )
        .first()
    )
    user_agent = payload.user_agent or request.headers.get("user-agent", "")
    if device:
        device.refresh_jti = jti
        device.last_active = datetime.utcnow()
        device.user_agent = user_agent
        device.device_type = payload.device_type
    else:
        device = Device(
            user_id=user.id,
            device_id=payload.device_id,
            device_type=payload.device_type,
            user_agent=user_agent,
            refresh_jti=jti,
        )
        db.add(device)
    db.commit()

    access_token = create_access_token(user.id)
    return TokensOut(
        access_token=access_token,
        refresh_token=refresh_token,
        user={"id": user.id, "mobile": user.mobile, "name": user.name},
    )


@router.post("/refresh")
def refresh_token(payload: RefreshIn, db: Session = Depends(get_db)):
    """
    Exchange a still-valid refresh token for a fresh access token.
    The refresh token itself is checked against the Device.refresh_jti
    so revoked devices can't refresh.
    """
    decoded = decode_token(payload.refresh_token)
    if not decoded or decoded.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = int(decoded["sub"])
    jti = decoded["jti"]

    device = (
        db.query(Device)
        .filter(Device.user_id == user_id, Device.refresh_jti == jti)
        .first()
    )
    if not device:
        raise HTTPException(
            status_code=401, detail="Refresh token revoked - please log in again"
        )

    device.last_active = datetime.utcnow()
    db.commit()

    new_access = create_access_token(user_id)
    return {"access_token": new_access}


@router.post("/logout")
def logout(payload: LogoutIn, db: Session = Depends(get_db)):
    """
    Revoke the refresh token for this device by deleting its Device row.
    Idempotent - returns ok even if the device was already gone.
    """
    if not payload.refresh_token:
        return {"ok": True}
    decoded = decode_token(payload.refresh_token)
    if not decoded:
        return {"ok": True}
    jti = decoded.get("jti")
    if jti:
        db.query(Device).filter(Device.refresh_jti == jti).delete()
        db.commit()
    return {"ok": True}
