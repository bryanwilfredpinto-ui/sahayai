"""
services/local_chitti_service.py
--------------------------------
Local-Chitti-first lookup for Vaani's "Chitti can act for you" cards.

The promise on the frontend is:
  Before opening any external app (Zomato / Swiggy / Ola / etc.) for the
  user, check if a registered Chitti business exists for that service.
  A registered Chitti shop always comes first; the external app is a
  pure fallback.

Geo support (P0 — added 2026-05-13):
  `nearby()` accepts the user's `lat / lng` (preferred) or `pincode`
  (fallback) and returns shops within `radius_km`, sorted by distance
  ascending. Haversine in Python — no PostGIS dependency, works on
  Turso libSQL. Shops without coordinates are surfaced with
  `distance_km: None` (we can't filter them) so admins are not
  punished for half-set rows.

  When no location is supplied at all, behaviour falls back to the
  pre-geo "directory-wide" mode for backward compatibility. Callers
  that should never silently return Chennai kiranas to a Mumbai user
  must check `geo_applied` in the response payload.

Service categories accepted by `nearby(service)`:
  - food / restaurant
  - groceries / kirana
  - pharmacy / medicine
  - salon
  - stationery / books
  - hardware
  - clothing
  - electronics
  - furniture
  - dairy

Categories with NO local Chitti substrate (cab, movies, trains): the
endpoint returns an empty `local` list and the frontend falls straight
through to the external deep-link picker.
"""
from __future__ import annotations

import logging
import math
from typing import Optional

from services.admin_db import ProductGmailAccount, session

log = logging.getLogger("local_chitti")


# Default radius (km) by city tier. Metro = dense, walkable / short
# auto ride. Tier-2/3 = sparser, longer ride. These defaults are the
# starting radius — the endpoint caller may override via `radius_km`.
# The 5 → 25 km auto-expand wrapper lives in `nearby()` and is exercised
# in C5 of the geo P0 plan.
DEFAULT_RADIUS_KM_METRO    = 5.0
DEFAULT_RADIUS_KM_TIER_2_3 = 25.0
RADIUS_EXPANSION_KM        = 25.0   # auto-expand from 5 to 25 km if 5 yields no matches

# Pincode → tier lookup. Honest v1: prefix-match the first 3 digits
# against a small set of known metro postal districts. Anything else is
# treated as tier-2/3 with the wider default radius. When a real
# chitti-pincode-tier.json gazetteer lands, swap this set out — the
# function signature stays the same.
_METRO_PINCODE_3DIGIT_PREFIXES = frozenset({
    "400",  # Mumbai
    "110",  # Delhi
    "560",  # Bengaluru
    "600",  # Chennai
    "700",  # Kolkata
    "500",  # Hyderabad
    "411",  # Pune
    "380",  # Ahmedabad
    "201",  # Noida / Ghaziabad NCR
    "122",  # Gurugram NCR
})


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in kilometres. Inputs in decimal degrees."""
    r = 6371.0088  # mean Earth radius in km
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a  = math.sin(dp / 2.0) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2.0) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _default_radius_for_pincode(pincode: Optional[str]) -> float:
    if not pincode or len(pincode) < 3:
        return DEFAULT_RADIUS_KM_TIER_2_3
    return (DEFAULT_RADIUS_KM_METRO
            if pincode[:3] in _METRO_PINCODE_3DIGIT_PREFIXES
            else DEFAULT_RADIUS_KM_TIER_2_3)


# Service-category → list of shop_chitti product_keys that fulfil it.
# Multiple keys per category is fine — the frontend will list all matches
# so the user can pick the most convenient one (e.g. for groceries:
# chittikirana OR chittigrocery OR chittidairy).
#
# Keys mirror admin_seed.py. If a shop_chitti is renamed/added there,
# update this map in the same commit.
SERVICE_CATEGORIES: dict[str, list[str]] = {
    # Food
    "food":        ["chittirestaurant"],
    "restaurant":  ["chittirestaurant"],

    # Groceries / kirana / sabzi
    "groceries":   ["chittikirana", "chittigrocery", "chittidairy"],
    "grocery":     ["chittikirana", "chittigrocery", "chittidairy"],
    "kirana":      ["chittikirana", "chittigrocery"],
    "dairy":       ["chittidairy"],

    # Healthcare
    "pharmacy":    ["chittipharmacy", "chittimedical"],
    "medicine":    ["chittipharmacy", "chittimedical"],
    "medical":     ["chittipharmacy", "chittimedical"],

    # Services
    "salon":       ["chittisalon"],
    "haircut":     ["chittisalon"],

    # Retail
    "stationery":  ["chittistationery"],
    "books":       ["chittistationery"],
    "hardware":    ["chittihardware"],
    "clothing":    ["chitticlothing"],
    "clothes":     ["chitticlothing"],
    "electronics": ["chittielectronics"],
    "furniture":   ["chittifurniture"],

    # No Chitti substrate yet — listed so the endpoint returns a stable
    # "no local match" answer instead of 400. The frontend uses this as
    # a signal to skip the local block entirely.
    "cab":         [],
    "ride":        [],
    "auto":        [],
    "movies":      [],
    "movie":       [],
    "tickets":     [],
    "train":       [],
    "trains":      [],
}


# Service-category → user-facing display name + suggested external
# fallback apps. The frontend renders the actual deep-link URLs; we just
# tell it which apps are appropriate fallbacks for this category, in
# preference order.
EXTERNAL_FALLBACKS: dict[str, dict] = {
    "food":        {"display": "food delivery",   "external_keys": ["zomato", "swiggy"]},
    "restaurant":  {"display": "food delivery",   "external_keys": ["zomato", "swiggy"]},
    "groceries":   {"display": "groceries",       "external_keys": ["blinkit", "bigbasket"]},
    "grocery":     {"display": "groceries",       "external_keys": ["blinkit", "bigbasket"]},
    "kirana":      {"display": "kirana / sabzi",  "external_keys": ["blinkit", "bigbasket"]},
    "dairy":       {"display": "dairy",           "external_keys": ["blinkit", "bigbasket"]},
    "pharmacy":    {"display": "pharmacy",        "external_keys": []},
    "medicine":    {"display": "pharmacy",        "external_keys": []},
    "medical":     {"display": "pharmacy",        "external_keys": []},
    "salon":       {"display": "salon",           "external_keys": []},
    "haircut":     {"display": "salon",           "external_keys": []},
    "stationery":  {"display": "stationery",      "external_keys": []},
    "books":       {"display": "stationery",      "external_keys": []},
    "hardware":    {"display": "hardware",        "external_keys": []},
    "clothing":    {"display": "clothing",        "external_keys": []},
    "clothes":     {"display": "clothing",        "external_keys": []},
    "electronics": {"display": "electronics",     "external_keys": []},
    "furniture":   {"display": "furniture",       "external_keys": []},

    "cab":         {"display": "cab",     "external_keys": ["ola", "uber", "rapido"]},
    "ride":        {"display": "cab",     "external_keys": ["ola", "uber", "rapido"]},
    "auto":        {"display": "auto",    "external_keys": ["rapido", "ola", "uber"]},
    "movies":      {"display": "movies",  "external_keys": ["bookmyshow"]},
    "movie":       {"display": "movies",  "external_keys": ["bookmyshow"]},
    "tickets":     {"display": "tickets", "external_keys": ["bookmyshow", "irctc"]},
    "train":       {"display": "trains",  "external_keys": ["irctc"]},
    "trains":      {"display": "trains",  "external_keys": ["irctc"]},
}


def _normalise(service: str) -> str:
    return (service or "").strip().lower()


def categories() -> dict:
    """Diagnostic: list every service category and the keys it maps to."""
    return {
        "ok": True,
        "items": [
            {
                "service": svc,
                "local_chitti_keys": SERVICE_CATEGORIES.get(svc, []),
                "external_keys": EXTERNAL_FALLBACKS.get(svc, {}).get("external_keys", []),
                "display": EXTERNAL_FALLBACKS.get(svc, {}).get("display", svc),
            }
            for svc in sorted(SERVICE_CATEGORIES)
        ],
    }


def _row_to_dict(r: ProductGmailAccount) -> dict:
    return {
        "product_key":     r.product_key,
        "product_name":    r.product_name,
        "gmail_address":   r.gmail_address,
        "domain_template": r.domain_template,
        "features":        [f.strip() for f in (r.features or "").split(",") if f.strip()],
        "oauth_status":    r.oauth_status,
        "lat":             r.lat,
        "lng":             r.lng,
        "pincode":         r.pincode,
        "service_radius_km": r.service_radius_km,
    }


def _annotate_distance(rows: list[dict], *, user_lat: Optional[float],
                       user_lng: Optional[float], user_pincode: Optional[str]) -> list[dict]:
    """Add `distance_km` (float | None) and `geo_match` to each row.

    Match logic, in preference order:
      1. Both user and shop have lat/lng  → Haversine distance.
      2. Both user and shop have a pincode → same pincode = "same area"
         (distance_km = 0.0; cheap but better than nothing without a
         real pincode gazetteer). Different pincode = None (unknown).
      3. Otherwise → distance_km = None, geo_match = "unknown".
    """
    out: list[dict] = []
    for r in rows:
        d: Optional[float] = None
        match = "unknown"
        s_lat, s_lng = r.get("lat"), r.get("lng")
        if user_lat is not None and user_lng is not None and s_lat is not None and s_lng is not None:
            d = _haversine_km(user_lat, user_lng, s_lat, s_lng)
            match = "haversine"
        elif user_pincode and r.get("pincode"):
            if user_pincode == r["pincode"]:
                d = 0.0
                match = "pincode_exact"
            else:
                d = None
                match = "pincode_different"
        out.append({**r, "distance_km": d, "geo_match": match})
    return out


def _filter_and_sort(rows: list[dict], *, radius_km: float) -> tuple[list[dict], int]:
    """Apply the radius filter + sort by distance ascending.

    Returns `(kept_rows, confirmed_in_radius_count)`. The second value
    drives the 5 → 25 km auto-expansion: we expand only when we found
    ZERO shops with a known-in-radius distance. No-geo shops are kept
    in the result (so an admin who hasn't backfilled lat/lng yet
    doesn't get hidden) but do NOT count toward "we found something",
    because including a Chennai no-geo kirana for a Mumbai user is
    precisely the bug this whole P0 is fixing.

    Rows with `geo_match == "pincode_different"` are dropped — we know
    they are not local. Connected mailboxes float up within the same
    distance bucket.
    """
    keep: list[dict] = []
    confirmed = 0
    for r in rows:
        d, m = r.get("distance_km"), r.get("geo_match")
        if m == "pincode_different":
            continue
        if d is None:
            # No way to verify proximity. Keep, but it does NOT count
            # toward the expansion check (see docstring).
            keep.append(r)
            continue
        if d <= radius_km:
            keep.append(r)
            confirmed += 1
    # Sort: distance asc (None last), then connected-first.
    keep.sort(key=lambda r: (
        r["distance_km"] if r.get("distance_km") is not None else float("inf"),
        0 if r.get("oauth_status") == "connected" else 1,
        r.get("product_key", ""),
    ))
    return keep, confirmed


def nearby(
    service: str,
    *,
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
    user_pincode: Optional[str] = None,
    radius_km: Optional[float] = None,
) -> dict:
    """Return the local-Chitti list (preferred) + external fallback hint.

    Geo behaviour:
      - If `user_lat`+`user_lng` (or `user_pincode`) is supplied, filter
        shops to within `radius_km`. Default radius is chosen from
        `user_pincode` tier (5 km metro, 25 km tier-2/3) when supplied,
        else 25 km.
      - If NO location is supplied, behaviour falls back to directory-
        wide (no filter, no distance), and the response has
        `geo_applied: False` so the caller can surface "geo skipped"
        to the user rather than silently returning everything.

    Distance expansion from 5 km → 25 km lives in this function. If the
    caller did not pass `radius_km` explicitly AND the chosen default
    was metro (5 km) AND zero shops matched, we retry once at 25 km and
    flag `expanded_to_km` in the response.

    Returns
    -------
    {
      "ok": True,
      "service":        "food",
      "display":        "food delivery",
      "geo_applied":    True | False,
      "radius_km":      5.0,
      "expanded_to_km": 25.0 | None,    # set only if auto-expansion fired
      "user_loc":       {"lat": …, "lng": …, "pincode": …},
      "local":          [ { …row…, "distance_km": 0.42, "geo_match": "haversine" } ],
      "local_chitti_keys":   ["chittirestaurant"],
      "external_keys":       ["zomato", "swiggy"],
      "note": "…"
    }
    """
    svc = _normalise(service)
    if svc not in SERVICE_CATEGORIES:
        return {
            "ok": False,
            "error": f"unknown service '{service}'. "
                     f"Known: {sorted(SERVICE_CATEGORIES.keys())}",
        }

    wanted_keys = SERVICE_CATEGORIES[svc]
    fallback    = EXTERNAL_FALLBACKS.get(svc, {})

    has_latlng  = user_lat is not None and user_lng is not None
    has_pincode = bool(user_pincode)
    geo_applied = has_latlng or has_pincode

    # Resolve the working radius. Caller override wins; otherwise pick
    # by pincode tier. Without a pincode we default to the wider 25 km
    # — the 5 km auto-expansion below only fires when the *default*
    # was 5 km AND no caller override was supplied.
    caller_overrode = radius_km is not None
    if not caller_overrode:
        radius_km = _default_radius_for_pincode(user_pincode)
    working_radius = float(radius_km)

    raw_rows: list[dict] = []
    if wanted_keys:
        try:
            with session() as s:
                rows = (
                    s.query(ProductGmailAccount)
                    .filter(ProductGmailAccount.product_key.in_(wanted_keys))
                    .all()
                )
                raw_rows = [_row_to_dict(r) for r in rows]
        except Exception as e:  # noqa: BLE001
            # Directory unreachable (admin DB misconfigured) — frontend
            # falls back to external apps. We never block the user.
            log.warning("local_chitti.nearby DB lookup failed: %s", e)
            raw_rows = []

    expanded_to_km: Optional[float] = None
    local_rows: list[dict]

    if not geo_applied:
        # Pre-geo behaviour: no filter, no distances. Connected mailboxes
        # surface first so the UI can label half-onboarded ones honestly.
        annotated = _annotate_distance(raw_rows, user_lat=None, user_lng=None,
                                       user_pincode=None)
        annotated.sort(key=lambda r: (0 if r.get("oauth_status") == "connected" else 1,
                                      r.get("product_key", "")))
        local_rows = annotated
    else:
        annotated = _annotate_distance(raw_rows, user_lat=user_lat, user_lng=user_lng,
                                       user_pincode=user_pincode)
        local_rows, confirmed = _filter_and_sort(annotated, radius_km=working_radius)

        # 5 km → 25 km auto-expansion (C5). Only when caller did NOT
        # explicitly pick a radius, the default WAS metro (5 km), and
        # we found ZERO confirmed-in-radius shops. No-geo shops in
        # `local_rows` do not count — admins who haven't backfilled
        # coordinates must not block honest expansion.
        if (confirmed == 0
                and not caller_overrode
                and working_radius < RADIUS_EXPANSION_KM):
            expanded_to_km = RADIUS_EXPANSION_KM
            working_radius = RADIUS_EXPANSION_KM
            local_rows, _ = _filter_and_sort(annotated, radius_km=working_radius)

    return {
        "ok": True,
        "service":             svc,
        "display":             fallback.get("display", svc),
        "geo_applied":         geo_applied,
        "radius_km":           working_radius if geo_applied else None,
        "expanded_to_km":      expanded_to_km,
        "user_loc": {
            "lat": user_lat, "lng": user_lng, "pincode": user_pincode,
        } if geo_applied else None,
        "local":               local_rows,
        "local_chitti_keys":   wanted_keys,
        "external_keys":       fallback.get("external_keys", []),
        "note": (
            "Local Chitti business comes first. External apps are a fallback "
            "the user can pick if the local Chitti is unreachable."
        ),
    }
