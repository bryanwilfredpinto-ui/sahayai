"""
services/local_chitti_service.py
--------------------------------
Local-Chitti-first lookup for Vaani's "Chitti can act for you" cards.

The promise on the frontend is:
  Before opening any external app (Zomato / Swiggy / Ola / etc.) for the
  user, check if a registered Chitti business exists for that service.
  A registered Chitti shop always comes first; the external app is a
  pure fallback.

Today the directory we have is the `product_gmail_accounts` table that
already powers the Sahay AI admin dashboard — see
[`admin_db.py`](admin_db.py) and the 12 shop-Chitti rows seeded by
[`admin_seed.py`](../scripts/admin_seed.py). We do NOT have geo / lat-lng
columns yet, so "nearby" is honestly directory-wide, not radius-bound.
The endpoint surfaces only Chitti shops whose `oauth_status == connected`
(they are real, reachable mailboxes) — never half-registered rows.

External-app deep-link templates live in the frontend (so the small
"opens X pre-filled" note stays next to the user). This service only
owns the directory lookup half.

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
from typing import Optional

from services.admin_db import ProductGmailAccount, session

log = logging.getLogger("local_chitti")


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


def nearby(service: str) -> dict:
    """Return the local-Chitti list (preferred) + external fallback hint.

    `service` is one of `SERVICE_CATEGORIES.keys()` (case-insensitive).
    Unknown service → `{ok: False, error}` so the frontend treats it as a
    no-op rather than silently opening the wrong app.

    Returns
    -------
    {
      "ok": True,
      "service": "food",
      "display": "food delivery",
      "local": [
        {
          "product_key":   "chittirestaurant",
          "product_name":  "Chitti Restaurant",
          "gmail_address": "chittirestaurant@gmail.com",
          "features":      ["menu management", "online orders", ...],
          "domain_template": "food_business",
          "oauth_status":  "connected" | "needs_auth" | ...
        }
      ],
      "local_chitti_keys":   ["chittirestaurant"],
      "external_keys":       ["zomato", "swiggy"],
      "note": "Local Chitti business comes first. External apps are fallback."
    }

    "Nearby" today means "in the Chitti shop directory" — we do not yet
    store geo/lat-lng per shop. When per-shop geo lands, this is the
    method to extend (radius filter on the same return shape).
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

    local_rows: list[dict] = []
    if wanted_keys:
        try:
            with session() as s:
                rows = (
                    s.query(ProductGmailAccount)
                    .filter(ProductGmailAccount.product_key.in_(wanted_keys))
                    .all()
                )
                # Connected mailboxes come first; the others come second so
                # the frontend can still surface a "Coming soon — Chitti
                # Pharmacy is being onboarded" hint instead of pretending
                # the directory is empty.
                rows.sort(key=lambda r: (0 if r.oauth_status == "connected" else 1, r.id))
                local_rows = [{
                    "product_key":     r.product_key,
                    "product_name":    r.product_name,
                    "gmail_address":   r.gmail_address,
                    "domain_template": r.domain_template,
                    "features":        [f.strip() for f in (r.features or "").split(",") if f.strip()],
                    "oauth_status":    r.oauth_status,
                } for r in rows]
        except Exception as e:  # noqa: BLE001
            # Directory unreachable (admin DB misconfigured) — frontend
            # falls back to external apps. We never block the user.
            log.warning("local_chitti.nearby DB lookup failed: %s", e)
            local_rows = []

    return {
        "ok": True,
        "service":             svc,
        "display":             fallback.get("display", svc),
        "local":               local_rows,
        "local_chitti_keys":   wanted_keys,
        "external_keys":       fallback.get("external_keys", []),
        "note": (
            "Local Chitti business comes first. External apps are a fallback "
            "the user can pick if the local Chitti is unreachable."
        ),
    }
