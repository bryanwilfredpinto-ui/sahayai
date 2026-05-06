"""
routes/medupi.py
----------------
Public + light-auth API surface for Chitti MedUPI.

Route map (all prefix /api/medupi):

  Recognition + lookup
    POST  /scan                     → image upload, vision extraction, alternatives
    GET   /medicine/{name}          → fuzzy brand-name search + alternatives
    GET   /alternatives             → strict same-composition matcher
    GET   /risk/{molecule}          → HIGH/MEDIUM/LOW classification

  Jan Aushadhi
    GET   /jan_aushadhi             → ?lat=&lng=&radius_km=5  nearest stores
    GET   /jan_aushadhi/state       → ?state=MP fallback when no geolocation

  Insurance
    GET   /insurance/schemes        → all schemes (Ayushman / CGHS / ESI)
    GET   /insurance/{molecule}     → ?scheme=ayushman whether covered

  Family wallet (light auth via X-User-Token header)
    GET   /family/profiles          → list profiles for the user_token
    POST  /family/profile           → add a profile
    DELETE /family/profile/{id}     → delete a profile
    GET   /family/wallet            → ?profile_id= monthly + annual report
    POST  /family/wallet            → log a wallet entry

  Reminders (light auth via X-User-Token header)
    GET    /reminder                → ?profile_id=&status=active list
    POST   /reminder                → schedule a refill / expiry / dose / appointment reminder
    PATCH  /reminder/{id}           → update status (done / dismissed)
    DELETE /reminder/{id}           → delete a reminder
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from services import (
    medupi_alternatives,
    medupi_brave_search,
    medupi_community,
    medupi_database,
    medupi_family,
    medupi_insurance,
    medupi_jan_aushadhi,
    medupi_recognition,
    medupi_reminders,
    medupi_risk,
    medupi_scheduler,
    medupi_search_log,
)

log = logging.getLogger("routes.medupi")

router = APIRouter(prefix="/api/medupi", tags=["medupi"])


# ───── Recognition + lookup ─────

@router.post("/scan")
async def scan(
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload a medicine strip / bottle / prescription photo. Vision-based
    extraction (Anthropic) + master-DB lookup. Returns the same shape as
    /medicine/{name}.

    Limits: 8 MB max upload, image MIME types only.
    """
    if image.content_type and not image.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Only image uploads are accepted (jpg/png/webp).")
    image_bytes = await image.read()
    if len(image_bytes) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large (max 8 MB).")
    return medupi_recognition.recognise_image(db, image_bytes, image.content_type or "image/jpeg")


@router.get("/medicine/{name}")
def medicine_by_name(name: str, db: Session = Depends(get_db)):
    """Fuzzy brand-name search + same-composition alternatives + risk + voice-ready text.

    Side effects (intentional, lightweight):
      - bumps `search_log.count` for this query (drives the daily top-100 refresh)
      - the response carries `freshness_*` badges per the price-update spec
    """
    medupi_search_log.record(db, name)
    return medupi_recognition.recognise_text(db, name)


@router.get("/alternatives")
def alternatives(
    molecule: str = Query(..., description="Active ingredient (e.g. 'Paracetamol' or 'Amoxicillin+Clavulanic Acid')"),
    strength: str = Query("", description="Strength like '650mg' — optional"),
    dosage_form: str = Query("", description="Tablet / Capsule / Syrup / Injection / Inhaler / Sachet — optional"),
    current_brand: str = Query("", description="What the user has now (for the 'switch from' UX)"),
    db: Session = Depends(get_db),
):
    """STRICT same-composition matcher. molecule + strength + dosage_form."""
    return medupi_alternatives.find(db, molecule, strength, dosage_form, current_brand)


@router.get("/risk/{molecule}")
def risk(molecule: str):
    """HIGH / MEDIUM / LOW classification with symbol + warning text in EN + HI."""
    return medupi_risk.classify(molecule)


# ───── Jan Aushadhi ─────

@router.get("/jan_aushadhi")
def jan_aushadhi_nearby(
    lat: float = Query(..., description="Latitude (e.g. 23.2599)"),
    lng: float = Query(..., description="Longitude (e.g. 77.4126)"),
    radius_km: float = Query(5.0, gt=0.1, le=50.0),
    limit: int = Query(10, gt=0, le=50),
    db: Session = Depends(get_db),
):
    """Nearby Jan Aushadhi stores by lat/lng. Sorted by distance ASC."""
    items = medupi_jan_aushadhi.find_nearby(db, lat, lng, radius_km, limit)
    return {
        "items": items,
        "count": len(items),
        "centre": {"lat": lat, "lng": lng},
        "radius_km": radius_km,
        "speak_en": (
            f"{len(items)} Jan Aushadhi stores within {radius_km} kilometres."
            if items else f"No Jan Aushadhi stores within {radius_km} kilometres."
        ),
        "speak_hi": (
            f"{int(radius_km)} किलोमीटर के अंदर {len(items)} जन औषधि स्टोर मिले।"
            if items else f"{int(radius_km)} किलोमीटर के अंदर कोई जन औषधि स्टोर नहीं मिला।"
        ),
    }


@router.get("/jan_aushadhi/state")
def jan_aushadhi_in_state(
    state: str = Query(..., description="State code or name, e.g. 'MP' or 'Maharashtra'"),
    limit: int = Query(50, gt=0, le=200),
    db: Session = Depends(get_db),
):
    """Stores in a given state — fallback when geolocation isn't available."""
    items = medupi_jan_aushadhi.find_in_state(db, state, limit)
    return {"items": items, "count": len(items), "state": state}


# ───── Insurance ─────

@router.get("/insurance/schemes")
def insurance_schemes():
    """List all schemes (Ayushman / CGHS / ESI)."""
    return {"items": medupi_insurance.schemes()}


@router.get("/insurance/{molecule}")
def insurance_coverage(
    molecule: str,
    scheme: str = Query("ayushman"),
    db: Session = Depends(get_db),
):
    """Whether `molecule` is covered by `scheme`. Supplies EN + HI explainers."""
    return medupi_insurance.coverage_for(db, molecule, scheme)


# ───── Family wallet ─────

class ProfileIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    relation: str = "self"
    dob: Optional[str] = None
    conditions: list[str] = []


class WalletEntryIn(BaseModel):
    profile_id: int
    medicine_name: str = Field(..., min_length=1, max_length=160)
    qty: int = 1
    price_paid: float = 0.0
    cheapest_equivalent_price: Optional[float] = None
    salt_composition: Optional[str] = None


def _user_token_or_400(x_user_token: Optional[str]) -> str:
    if not x_user_token or len(x_user_token) < 8:
        raise HTTPException(
            status_code=400,
            detail="Missing X-User-Token header. Frontend should generate a UUID and store it.",
        )
    return x_user_token


@router.get("/family/profiles")
def family_list_profiles(
    x_user_token: Optional[str] = Header(default=None, alias="X-User-Token"),
    db: Session = Depends(get_db),
):
    token = _user_token_or_400(x_user_token)
    return {"items": medupi_family.list_profiles(db, token)}


@router.post("/family/profile")
def family_add_profile(
    body: ProfileIn,
    x_user_token: Optional[str] = Header(default=None, alias="X-User-Token"),
    db: Session = Depends(get_db),
):
    token = _user_token_or_400(x_user_token)
    return medupi_family.add_profile(
        db, token, body.name, body.relation, body.dob, body.conditions
    )


@router.delete("/family/profile/{profile_id}")
def family_delete_profile(
    profile_id: int,
    x_user_token: Optional[str] = Header(default=None, alias="X-User-Token"),
    db: Session = Depends(get_db),
):
    token = _user_token_or_400(x_user_token)
    ok = medupi_family.delete_profile(db, token, profile_id)
    if not ok:
        raise HTTPException(status_code=404, detail="profile not found")
    return {"ok": True}


@router.get("/family/wallet")
def family_wallet(
    profile_id: Optional[int] = Query(default=None),
    x_user_token: Optional[str] = Header(default=None, alias="X-User-Token"),
    db: Session = Depends(get_db),
):
    token = _user_token_or_400(x_user_token)
    return medupi_family.wallet_report(db, token, profile_id)


@router.post("/family/wallet")
def family_wallet_add(
    body: WalletEntryIn,
    x_user_token: Optional[str] = Header(default=None, alias="X-User-Token"),
    db: Session = Depends(get_db),
):
    token = _user_token_or_400(x_user_token)
    try:
        return medupi_family.add_wallet_entry(
            db,
            token,
            body.profile_id,
            body.medicine_name,
            qty=body.qty,
            price_paid=body.price_paid,
            cheapest_equivalent_price=body.cheapest_equivalent_price,
            salt_composition=body.salt_composition,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ───── Reminders ─────

class ReminderIn(BaseModel):
    profile_id: int
    medicine_name: str = Field(..., min_length=1, max_length=160)
    next_due: datetime
    kind: str = "refill"           # refill / expiry / dose / appointment
    recurrence: Optional[str] = None
    note: Optional[str] = None


class ReminderStatusIn(BaseModel):
    status: str                    # active / done / dismissed


@router.get("/reminder")
def reminder_list(
    profile_id: Optional[int] = Query(default=None),
    status: str = Query(default="active"),
    x_user_token: Optional[str] = Header(default=None, alias="X-User-Token"),
    db: Session = Depends(get_db),
):
    token = _user_token_or_400(x_user_token)
    return {"items": medupi_reminders.list_reminders(db, token, profile_id, status)}


@router.post("/reminder")
def reminder_add(
    body: ReminderIn,
    x_user_token: Optional[str] = Header(default=None, alias="X-User-Token"),
    db: Session = Depends(get_db),
):
    token = _user_token_or_400(x_user_token)
    try:
        return medupi_reminders.add_reminder(
            db,
            token,
            body.profile_id,
            body.medicine_name,
            body.next_due,
            kind=body.kind,
            recurrence=body.recurrence,
            note=body.note,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/reminder/{rid}")
def reminder_update_status(
    rid: int,
    body: ReminderStatusIn,
    x_user_token: Optional[str] = Header(default=None, alias="X-User-Token"),
    db: Session = Depends(get_db),
):
    token = _user_token_or_400(x_user_token)
    if not medupi_reminders.update_status(db, token, rid, body.status):
        raise HTTPException(status_code=400, detail="reminder not found or invalid status")
    return {"ok": True}


@router.delete("/reminder/{rid}")
def reminder_delete(
    rid: int,
    x_user_token: Optional[str] = Header(default=None, alias="X-User-Token"),
    db: Session = Depends(get_db),
):
    token = _user_token_or_400(x_user_token)
    if not medupi_reminders.delete_reminder(db, token, rid):
        raise HTTPException(status_code=404, detail="reminder not found")
    return {"ok": True}


# ───── Real-time pharmacy prices via Brave Search ─────

@router.get("/price/live/{name}")
def price_live(
    name: str,
    refresh: bool = Query(False, description="Bypass cache + force a fresh Brave fetch."),
    limit: int = Query(6, ge=1, le=12),
    db: Session = Depends(get_db),
):
    """
    Brave-Search-snippet-based pharmacy price discovery. Snippet-only — we
    never visit the pharmacy URL (zero-scrape policy). 24-hour cache.
    Returns:
      { ok, query, source ('cache'|'brave'|'unconfigured'), items: [...] }
    """
    medupi_search_log.record(db, name)
    return medupi_brave_search.fetch_live(db, name, refresh=refresh, limit=limit)


# ───── Community-reported prices ─────

class CommunityPriceIn(BaseModel):
    medicine_name: str = Field(..., min_length=1, max_length=160)
    price_paid: float = Field(..., gt=0)
    pharmacy_name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    salt_composition: Optional[str] = None
    strength: Optional[str] = None
    dosage_form: Optional[str] = None


@router.post("/community/price")
def community_price_add(
    body: CommunityPriceIn,
    x_user_token: Optional[str] = Header(default=None, alias="X-User-Token"),
    db: Session = Depends(get_db),
):
    """User reports a price they paid. Stored with timestamp + (optional) lat/lng."""
    token = _user_token_or_400(x_user_token)
    try:
        return medupi_community.add_report(
            db,
            user_token=token,
            medicine_name=body.medicine_name,
            price_paid=body.price_paid,
            pharmacy_name=body.pharmacy_name,
            city=body.city,
            state=body.state,
            pincode=body.pincode,
            lat=body.lat,
            lng=body.lng,
            salt_composition=body.salt_composition,
            strength=body.strength,
            dosage_form=body.dosage_form,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/community/price")
def community_price_list(
    medicine_name: Optional[str] = Query(default=None),
    city: Optional[str] = Query(default=None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    items = medupi_community.list_reports(db, medicine_name=medicine_name, city=city, limit=limit)
    stats = (medupi_community.stats_for(db, medicine_name, city=city) if medicine_name else {"count": len(items)})
    return {
        "items": items,
        "count": len(items),
        "stats": stats,
        "disclaimer_en": "Community prices are user-reported. Verify with the pharmacy before purchase.",
        "disclaimer_hi": "सामुदायिक मूल्य उपयोगकर्ताओं द्वारा सूचित हैं। खरीदने से पहले दुकान से पुष्टि करें।",
    }


# ───── Scheduler / loader ops (ops dashboard hooks) ─────

@router.get("/scheduler/status")
def scheduler_status_route():
    """Diagnostic — what jobs are scheduled + their next run times (IST)."""
    return medupi_scheduler.status()


@router.post("/scheduler/trigger/{job_id}")
def scheduler_trigger(
    job_id: str,
    x_user_token: Optional[str] = Header(default=None, alias="X-User-Token"),
):
    """
    Force a scheduled job to run NOW (use sparingly — counts against
    Brave Search quota). Light auth via X-User-Token; production deploys
    can put this behind a real admin gate later.
    """
    _user_token_or_400(x_user_token)
    return medupi_scheduler.trigger_now(job_id)
