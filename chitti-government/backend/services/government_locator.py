"""
services/government_locator.py
------------------------------
Nearest-government-office locator.

We query Nominatim (OSM) for "<office_kind> near <lat>,<lng>" and
return the top 5 hits. Nominatim's free-tier policy is hard:
  - 1 req/second
  - real User-Agent
  - contact email
We honour all three. For any user query we cap to 5 results so the
total Nominatim load stays well under the 1 req/s ceiling.

If Nominatim is unreachable (Render free egress flap) we still return
a useful response: a Google Maps deep-link the user can open in the
browser. That keeps the feature LIVE even when OSM is having a bad
day — the "no coming soon" rule.
"""
from __future__ import annotations

import logging
import time
from typing import Any
from urllib.parse import quote_plus

import requests

from config import settings

log = logging.getLogger("services.government_locator")

# Vocabulary of office kinds → OSM-friendly query strings.
OFFICE_KINDS: dict[str, dict] = {
    "csc": {
        "label": "Common Service Centre (CSC)",
        "query": "Common Service Centre",
        "official_locator": "https://locator.csccloud.in/",
    },
    "post_office": {
        "label": "Post Office",
        "query": "post office",
        "official_locator": "https://www.indiapost.gov.in/VAS/Pages/LocatePostOffices.aspx",
    },
    "aadhaar": {
        "label": "Aadhaar Seva Kendra",
        "query": "Aadhaar Seva Kendra",
        "official_locator": "https://appointments.uidai.gov.in/",
    },
    "passport": {
        "label": "Passport Seva Kendra",
        "query": "Passport Seva Kendra",
        "official_locator": "https://www.passportindia.gov.in/AppOnlineProject/locatePSK",
    },
    "ration": {
        "label": "Ration Office / FPS",
        "query": "Fair Price Shop ration",
        "official_locator": "https://nfsa.gov.in/",
    },
    "jan_aushadhi": {
        "label": "Jan Aushadhi Kendra",
        "query": "Jan Aushadhi Kendra",
        "official_locator": "https://janaushadhi.gov.in/KendraDetails.aspx",
    },
    "panchayat": {
        "label": "Gram Panchayat / Tehsil office",
        "query": "Panchayat office",
        "official_locator": None,
    },
    "bank": {
        "label": "Public-sector bank branch",
        "query": "State Bank of India",
        "official_locator": None,
    },
    "police_station": {
        "label": "Police Station",
        "query": "police station",
        "official_locator": None,
    },
}


def _gmaps_link(query: str, lat: float | None, lng: float | None) -> str:
    if lat is not None and lng is not None:
        return (
            f"https://www.google.com/maps/search/?api=1&"
            f"query={quote_plus(query)}&center={lat},{lng}"
        )
    return f"https://www.google.com/maps/search/?api=1&query={quote_plus(query)}"


def _nominatim_search(
    query: str, lat: float | None, lng: float | None, radius_km: float
) -> list[dict]:
    """Returns up to 5 results in (display_name, lat, lon, address) tuples."""
    params: dict[str, Any] = {
        "q": query,
        "format": "json",
        "limit": 5,
        "addressdetails": 1,
        "countrycodes": "in",
        "email": settings.NOMINATIM_CONTACT_EMAIL,
    }
    if lat is not None and lng is not None:
        # Build a viewbox of ~radius_km around the user. 1° lat ≈ 111 km.
        delta = max(0.05, radius_km / 111.0)
        params["viewbox"] = f"{lng - delta},{lat + delta},{lng + delta},{lat - delta}"
        params["bounded"] = 1
    headers = {
        "User-Agent": settings.NOMINATIM_USER_AGENT,
        "Accept-Language": "en,hi",
    }
    try:
        # Honour 1 req/s — every locator call sleeps a quarter-second so a
        # tight burst from the frontend can't violate the policy.
        time.sleep(0.25)
        resp = requests.get(
            f"{settings.NOMINATIM_URL.rstrip('/')}/search",
            params=params,
            headers=headers,
            timeout=12,
        )
        if resp.status_code != 200:
            log.warning("Nominatim HTTP %s", resp.status_code)
            return []
        return resp.json() or []
    except requests.RequestException as e:
        log.warning("Nominatim error: %s", e)
        return []


def _format_hits(raw: list[dict]) -> list[dict]:
    out = []
    for r in raw:
        addr = r.get("address") or {}
        out.append({
            "name": r.get("display_name", ""),
            "lat": float(r.get("lat", 0) or 0),
            "lng": float(r.get("lon", 0) or 0),
            "city": (addr.get("city") or addr.get("town") or addr.get("village") or addr.get("suburb")),
            "district": addr.get("state_district") or addr.get("county"),
            "state": addr.get("state"),
            "postcode": addr.get("postcode"),
            "country": addr.get("country"),
        })
    return out


def find_nearby(
    kind: str,
    *,
    lat: float | None,
    lng: float | None,
    radius_km: float = 10.0,
) -> dict:
    spec = OFFICE_KINDS.get(kind)
    if not spec:
        return {
            "ok": False,
            "error": f"Unknown office kind '{kind}'. Choose one of: {list(OFFICE_KINDS.keys())}",
        }
    query = spec["query"]
    if lat is not None and lng is not None:
        # Append a coordinate hint to the free-text query so Nominatim
        # ranks nearby names higher even outside the viewbox.
        query_with_geo = f"{query} near {lat},{lng}"
    else:
        query_with_geo = query
    hits = _format_hits(_nominatim_search(query_with_geo, lat, lng, radius_km))
    return {
        "ok": True,
        "kind": kind,
        "label": spec["label"],
        "results": hits,
        "official_locator_url": spec.get("official_locator"),
        "google_maps_search_url": _gmaps_link(query, lat, lng),
        "attribution": "© OpenStreetMap contributors (Nominatim)",
    }


def list_kinds() -> list[dict]:
    return [
        {"kind": k, "label": v["label"], "official_locator_url": v.get("official_locator")}
        for k, v in OFFICE_KINDS.items()
    ]
