"""
scripts/loaders/_common.py
--------------------------
Shared helpers for every Chitti MedUPI data loader.

Contract every loader follows:

    def load(db, *, url=None, file_path=None, dry_run=False) -> dict
        # returns {"upserted": int, "skipped": int, "errors": int, "source": "..."}

All loaders MUST be idempotent (re-running on the same input does not
duplicate rows). Natural keys:
    medicines       → (brand_name_lower, strength_lower, dosage_form_lower)
    jan_aushadhi    → store_code

Sources are GOVERNMENT-VERIFIED + free public APIs only:
    NPPA · Jan Aushadhi (BPPI) · CDSCO · OpenFDA · RxNorm

Explicitly NOT supported (see scripts/README.md):
    Tata 1mg · PharmEasy · NetMeds · Apollo 24|7 · Amazon Pharmacy
    Their data is proprietary and scraping violates their ToS.
"""
from __future__ import annotations

import logging
import math
import re
import time
from pathlib import Path
from typing import Any, Iterable, Optional

import requests

log = logging.getLogger("loaders")

CACHE_DIR = Path(__file__).resolve().parent.parent / "data_cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)


# ───────────────────────────────────────────────────────────
# Download helpers
# ───────────────────────────────────────────────────────────

def download_to_cache(url: str, filename: str, force: bool = False, timeout: int = 60) -> Path:
    """
    Download `url` into scripts/data_cache/<filename>. Returns the local path.
    If the file already exists and `force` is False, returns the cached copy.
    Raises on HTTP error.
    """
    dest = CACHE_DIR / filename
    if dest.exists() and not force:
        log.info("cache hit: %s (%s bytes) — pass --force to re-download", dest.name, dest.stat().st_size)
        return dest
    log.info("downloading %s → %s", url, dest)
    headers = {
        "User-Agent": "ChittiMedUPI/1.7 (+https://sahayai.in/chitti_medupi.html)",
        "Accept": "*/*",
    }
    with requests.get(
        url, headers=headers, timeout=timeout, allow_redirects=True, stream=True
    ) as r:
        r.raise_for_status()
        with dest.open("wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
    log.info("downloaded %s (%s bytes)", dest.name, dest.stat().st_size)
    return dest


def http_get_json(url: str, params: Optional[dict] = None, timeout: int = 30) -> Any:
    """Tiny JSON GET helper for REST APIs (RxNorm, OpenFDA)."""
    headers = {
        "User-Agent": "ChittiMedUPI/1.7",
        "Accept": "application/json",
    }
    r = requests.get(
        url, params=params or {}, headers=headers, timeout=timeout, allow_redirects=True
    )
    r.raise_for_status()
    return r.json()


# ───────────────────────────────────────────────────────────
# Parsing helpers
# ───────────────────────────────────────────────────────────

def safe_str(v: Any) -> Optional[str]:
    if v is None:
        return None
    if isinstance(v, float) and math.isnan(v):
        return None
    s = str(v).strip()
    if not s or s.lower() in {"nan", "none", "null", "-", "—"}:
        return None
    return s


def safe_float(v: Any) -> Optional[float]:
    if v is None:
        return None
    if isinstance(v, (int, float)):
        if isinstance(v, float) and math.isnan(v):
            return None
        return float(v)
    s = str(v).strip()
    if not s or s.lower() in {"nan", "none", "null", "-", "—"}:
        return None
    # Strip common rupee / thousands formatting: "₹1,234.50", "Rs. 12.5", "12.5/-"
    s = s.replace("₹", "").replace("Rs.", "").replace("Rs", "").replace(",", "").replace("/-", "").strip()
    try:
        return float(s)
    except (TypeError, ValueError):
        return None


def safe_int(v: Any) -> Optional[int]:
    f = safe_float(v)
    return int(f) if f is not None else None


def pick_first_present(row: dict, *candidates: str) -> Any:
    """
    Government CSVs use wildly different column names across exports. Try a
    list of candidate keys (case-insensitive, whitespace-trimmed) and return
    the first non-empty value.
    """
    by_key = {k.strip().lower(): v for k, v in row.items()}
    for c in candidates:
        v = by_key.get(c.strip().lower())
        if v is not None and safe_str(v):
            return v
    return None


_STRENGTH_RX = re.compile(r"\s+")


def normalize_strength(v: Any) -> Optional[str]:
    """'650 mg' → '650mg', '500 + 125 mg' → '500+125mg', preserves case ('mcg' / 'IU')."""
    s = safe_str(v)
    if not s:
        return None
    s = _STRENGTH_RX.sub("", s)
    s = s.replace("+ ", "+").replace(" +", "+")
    return s


_DOSAGE_FORM_MAP = {
    "tab": "Tablet", "tablet": "Tablet", "tablets": "Tablet",
    "cap": "Capsule", "caps": "Capsule", "capsule": "Capsule", "capsules": "Capsule",
    "syp": "Syrup", "syrup": "Syrup", "susp": "Syrup", "suspension": "Syrup",
    "inj": "Injection", "injection": "Injection", "amp": "Injection", "vial": "Injection",
    "inh": "Inhaler", "inhaler": "Inhaler",
    "oint": "Cream", "cream": "Cream", "gel": "Cream", "ointment": "Cream",
    "drops": "Drops", "eye drops": "Drops", "ear drops": "Drops",
    "sachet": "Sachet", "powder": "Sachet", "ors": "Sachet",
    "soln": "Solution", "solution": "Solution", "lotion": "Solution",
}


def normalize_dosage_form(v: Any) -> Optional[str]:
    s = safe_str(v)
    if not s:
        return None
    key = s.strip().lower()
    if key in _DOSAGE_FORM_MAP:
        return _DOSAGE_FORM_MAP[key]
    # Pattern like "Tablet 10's" or "Tab. 10x10"
    for k, v2 in _DOSAGE_FORM_MAP.items():
        if key.startswith(k):
            return v2
    return s.title()


_MOL_RX = re.compile(r"\s+")


def normalize_molecule(v: Any) -> Optional[str]:
    """
    Lower-case, collapse whitespace, normalize ' + ' / ' / ' / ' AND ' to '+'.
    Removes parenthetical strength artefacts like '(as hydrochloride)'.
    """
    s = safe_str(v)
    if not s:
        return None
    s = re.sub(r"\([^)]*\)", "", s)            # drop "(as hcl)" style noise
    s = s.replace("&", "+").replace(" and ", "+").replace(" / ", "+").replace("/", "+")
    s = re.sub(r"\s*\+\s*", "+", s)
    s = _MOL_RX.sub(" ", s).strip().lower()
    return s


# ───────────────────────────────────────────────────────────
# Upsert helpers (sit on top of SQLAlchemy)
# ───────────────────────────────────────────────────────────

def upsert_medicine(db, *, brand_name: str, salt_composition: str, strength: str,
                    dosage_form: str, **fields) -> tuple[bool, Any]:
    """
    Idempotent upsert into the `medicines` table.

    Natural key: lower(brand_name) + lower(strength) + lower(dosage_form).
    Returns (created: bool, row).
    """
    from models.medicine import Medicine
    from sqlalchemy import func

    bn = (brand_name or "").strip()
    if not (bn and salt_composition and strength and dosage_form):
        raise ValueError("brand_name, salt_composition, strength, dosage_form are all required")

    row = (
        db.query(Medicine)
        .filter(
            func.lower(Medicine.brand_name) == bn.lower(),
            func.lower(Medicine.strength) == strength.lower(),
            func.lower(Medicine.dosage_form) == dosage_form.lower(),
        )
        .first()
    )

    payload = dict(
        salt_composition=salt_composition,
        pack_size=fields.get("pack_size"),
        manufacturer=fields.get("manufacturer"),
        mrp=fields.get("mrp"),
        nppa_ceiling_price=fields.get("nppa_ceiling_price"),
        jan_aushadhi_price=fields.get("jan_aushadhi_price"),
        jan_aushadhi_code=fields.get("jan_aushadhi_code"),
        risk_class=fields.get("risk_class") or "L",
        schedule=fields.get("schedule"),
        prescription_required=int(fields.get("prescription_required") or 0),
        therapeutic_class=fields.get("therapeutic_class"),
        purpose_en=fields.get("purpose_en"),
        purpose_hi=fields.get("purpose_hi"),
    )

    if row is None:
        row = Medicine(brand_name=bn, strength=strength, dosage_form=dosage_form)
        for k, v in payload.items():
            setattr(row, k, v)
        db.add(row)
        return True, row

    # Update only fields that arrive non-None (preserve existing seed data
    # — e.g. if NPPA gives a ceiling but no manufacturer, don't wipe the
    # manufacturer that BPPI loaded earlier).
    for k, v in payload.items():
        if v is not None:
            setattr(row, k, v)
    return False, row


def upsert_jan_aushadhi(db, *, store_code: str, name: str, lat: float, lng: float,
                       **fields) -> tuple[bool, Any]:
    """
    Idempotent upsert into `jan_aushadhi_stores`. Natural key: store_code.
    Returns (created, row).
    """
    from datetime import datetime
    from models.jan_aushadhi import JanAushadhiStore

    sc = (store_code or "").strip()
    if not sc:
        raise ValueError("store_code is required")
    if lat is None or lng is None:
        raise ValueError("lat/lng required (skip stores without coords — they can't be searched)")

    row = db.query(JanAushadhiStore).filter(JanAushadhiStore.store_code == sc).first()
    payload = dict(
        name=name,
        address=fields.get("address"),
        district=fields.get("district"),
        state=fields.get("state"),
        pincode=fields.get("pincode"),
        phone=fields.get("phone"),
        hours=fields.get("hours"),
        lat=float(lat),
        lng=float(lng),
        last_verified=datetime.utcnow(),
    )
    if row is None:
        row = JanAushadhiStore(store_code=sc, **payload)
        db.add(row)
        return True, row
    for k, v in payload.items():
        if v is not None:
            setattr(row, k, v)
    return False, row


# ───────────────────────────────────────────────────────────
# Pandas helpers
# ───────────────────────────────────────────────────────────

def read_table(path: Path) -> "list[dict]":
    """
    Read a CSV / TSV / XLS / XLSX into a list of dicts. We avoid making
    pandas a hard import-time dep so loaders can short-circuit without it
    when only RxNorm/OpenFDA are needed.
    """
    suffix = path.suffix.lower()
    if suffix in {".csv", ".tsv", ".txt"}:
        try:
            import pandas as pd
        except ImportError as e:
            raise RuntimeError("pandas required for CSV parsing — pip install pandas") from e
        sep = "\t" if suffix == ".tsv" else None
        df = pd.read_csv(path, sep=sep, dtype=str, keep_default_na=False, encoding_errors="ignore")
        return df.to_dict("records")
    if suffix in {".xls", ".xlsx", ".xlsm"}:
        try:
            import pandas as pd
        except ImportError as e:
            raise RuntimeError("pandas + openpyxl required for Excel parsing — pip install pandas openpyxl") from e
        df = pd.read_excel(path, dtype=str)
        df = df.fillna("")
        return df.to_dict("records")
    if suffix == ".json":
        import json
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    raise ValueError(f"unsupported file type: {suffix}")


def chunked(seq: Iterable, n: int):
    """Yield successive n-sized chunks from seq."""
    buf = []
    for item in seq:
        buf.append(item)
        if len(buf) >= n:
            yield buf
            buf = []
    if buf:
        yield buf


def gentle_sleep(seconds: float = 0.2) -> None:
    """Be a polite citizen on public APIs — small pause between calls."""
    if seconds > 0:
        time.sleep(seconds)
