"""
services/medupi_jan_aushadhi.py
-------------------------------
Jan Aushadhi (Pradhan Mantri Bhartiya Janaushadhi Pariyojana) store locator.

11,000+ stores across India. Public CSV: https://janaushadhi.gov.in/store_locator.aspx
Each row: Store_code · Name · Address · District · State · PIN · Phone · Lat · Lng

NEXT SESSION:
  - Download / cache the Jan Aushadhi CSV (refreshes ~weekly)
  - Add geo lookup with haversine distance ranking
  - Add "is open now?" flag based on hours field
  - Add Mobile Jan Aushadhi van schedule (where available)
"""
from __future__ import annotations

import logging
from math import asin, cos, radians, sin, sqrt

log = logging.getLogger("medupi_jan_aushadhi")

# Stub seed — 5 representative stores (Bhopal, Indore, Delhi, Mumbai, Bengaluru).
# Wires to CSV next session.
_STUB_STORES = [
    {"store_code":"JA-MP-001", "name":"Jan Aushadhi Bhopal Central",       "address":"MP Nagar Zone-1, Bhopal", "district":"Bhopal",   "state":"MP",  "pincode":"462011", "phone":"+91-755-XXXXXXX", "lat":23.2599, "lng":77.4126, "hours":"9 AM – 8 PM"},
    {"store_code":"JA-MP-002", "name":"Jan Aushadhi Indore",              "address":"Vijay Nagar, Indore",       "district":"Indore",   "state":"MP",  "pincode":"452010", "phone":"+91-731-XXXXXXX", "lat":22.7196, "lng":75.8577, "hours":"9 AM – 8 PM"},
    {"store_code":"JA-DL-001", "name":"Jan Aushadhi AIIMS Delhi",         "address":"Ansari Nagar East, Delhi",  "district":"South Delhi","state":"DL", "pincode":"110029", "phone":"+91-11-XXXXXXX",  "lat":28.5672, "lng":77.2100, "hours":"24 hours"},
    {"store_code":"JA-MH-001", "name":"Jan Aushadhi KEM Hospital Mumbai", "address":"Parel, Mumbai",             "district":"Mumbai",   "state":"MH",  "pincode":"400012", "phone":"+91-22-XXXXXXX",  "lat":19.0034, "lng":72.8421, "hours":"9 AM – 9 PM"},
    {"store_code":"JA-KA-001", "name":"Jan Aushadhi Bengaluru Victoria",  "address":"K R Market, Bengaluru",     "district":"Bengaluru","state":"KA", "pincode":"560002", "phone":"+91-80-XXXXXXX",  "lat":12.9667, "lng":77.5833, "hours":"8 AM – 9 PM"},
]


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Distance between two lat/lng points in km."""
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return 2 * R * asin(sqrt(a))


def find_nearby(lat: float, lng: float, radius_km: float = 5.0, limit: int = 10) -> list[dict]:
    """
    Returns Jan Aushadhi stores within `radius_km` of the given lat/lng,
    sorted by distance ascending. Stub returns from seed.
    """
    if lat is None or lng is None:
        return []
    out = []
    for s in _STUB_STORES:
        d = _haversine_km(lat, lng, s["lat"], s["lng"])
        if d <= radius_km:
            out.append({**s, "distance_km": round(d, 2)})
    out.sort(key=lambda x: x["distance_km"])
    return out[:limit]
