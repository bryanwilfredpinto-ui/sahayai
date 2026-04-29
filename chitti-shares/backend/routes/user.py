"""
routes/user.py
--------------
Authenticated endpoints for the logged-in user:

  GET    /user/me                 - current profile
  PUT    /user/me                 - update name
  GET    /user/devices            - list all devices currently logged in
  DELETE /user/devices/{id}       - log out one specific device
  DELETE /user/devices            - log out from ALL devices
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models.device import Device
from models.user import User
from services.deps import get_current_user

router = APIRouter(prefix="/user", tags=["user"])


class UpdateProfileIn(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    language: str | None = Field(default=None, pattern="^(en|hi)$")


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "mobile": user.mobile,
        "name": user.name,
        "language": user.language or "en",
        "created_at": user.created_at.isoformat(),
    }


@router.put("/me")
def update_me(
    payload: UpdateProfileIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.name is not None:
        user.name = payload.name.strip()
    if payload.language is not None:
        user.language = payload.language
    db.commit()
    return {"ok": True, "name": user.name, "language": user.language}


@router.get("/devices")
def list_devices(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    devices = (
        db.query(Device)
        .filter(Device.user_id == user.id)
        .order_by(Device.last_active.desc())
        .all()
    )
    return [
        {
            "id": d.id,
            "device_type": d.device_type,
            "user_agent": d.user_agent or "",
            "created_at": d.created_at.isoformat(),
            "last_active": d.last_active.isoformat(),
        }
        for d in devices
    ]


@router.delete("/devices/{device_id}")
def revoke_device(
    device_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    device = (
        db.query(Device)
        .filter(Device.id == device_id, Device.user_id == user.id)
        .first()
    )
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    db.delete(device)
    db.commit()
    return {"ok": True}


@router.delete("/devices")
def revoke_all(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Device).filter(Device.user_id == user.id).delete()
    db.commit()
    return {"ok": True}
