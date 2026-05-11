"""
scripts/admin_seed.py
---------------------
Seed the default Sahay AI product Gmail accounts on every boot.

Idempotent — uses an upsert keyed by `product_key`:
  - Missing rows are inserted in `oauth_status='needs_auth'`.
  - Existing rows have `domain_template` / `features` / `product_name`
    backfilled if they were null/empty (admin edits via dashboard win).
  - OAuth fields (tokens, status, expiry) are NEVER touched here.

Set ADMIN_SEED_DEFAULTS=false to skip on boot.

Two groups of products live here:
  1. The original Chitti products (News, MedUPI, CA, Legal, Vaani) —
     domain left null because they don't fit the shop-Chitti taxonomy.
  2. The 12 shop Chittis Sire created Gmails for in May 2026 — each
     mapped to one of the ten shop-domain templates documented in the
     dashboard "Add Product" dropdown.
"""
from __future__ import annotations

import logging
import os

from services.admin_db import ProductGmailAccount, session

log = logging.getLogger("admin_seed")


# (key, name, email, domain_template, features-csv)
DEFAULTS: list[tuple[str, str, str, str | None, str | None]] = [
    # ── Original Chittis ──
    ("chittimedupi",  "Chitti MedUPI",  "chittimedupi@gmail.com",  None, None),
    ("chittinews",    "Chitti News",    "chittinews@gmail.com",    None, None),
    ("chittica",      "Chitti CA",      "chittica@gmail.com",      None, None),
    ("chittilegal",   "Chitti Legal",   "chittilegal@gmail.com",   None, None),
    ("chittivaani",   "Chitti Vaani",   "chittivaani@gmail.com",   None, None),

    # ── Shop Chittis (May 2026) ──
    ("chittikirana",     "Chitti Kirana",     "chittikirana@gmail.com",
        "shop_management",
        "inventory,billing,orders,customers,suppliers"),
    ("chittipharmacy",   "Chitti Pharmacy",   "chittipharmacy@gmail.com",
        "healthcare",
        "medicine stock,expiry tracking,Jan Aushadhi integration,prescription decoder"),
    ("chittirestaurant", "Chitti Restaurant", "chittirestaurant@gmail.com",
        "food_business",
        "menu management,online orders,table booking,delivery tracking"),
    ("chittisalon",      "Chitti Salon",      "chittisalon@gmail.com",
        "appointment_management",
        "appointment booking,customer history,service catalog,staff management"),
    ("chittimedical",    "Chitti Medical Store", "chittimedical@gmail.com",
        "healthcare",
        "medicine inventory,expiry alerts,insurance billing,patient records"),
    ("chittigrocery",    "Chitti Grocery",    "chittigrocery@gmail.com",
        "shop_management",
        "bulk ordering,wholesale pricing,delivery zone management"),
    ("chittidairy",      "Chitti Dairy",      "chittidairy@gmail.com",
        "perishable_goods",
        "subscription management,expiry tracking,route optimization"),
    ("chittistationery", "Chitti Stationery", "chittistationery@gmail.com",
        "inventory_management",
        "low stock alerts,seasonal demand prediction,bulk order discounts"),
    ("chittihardware",   "Chitti Hardware",   "chittihardware@gmail.com",
        "b2b_inventory",
        "bulk pricing,supplier quotes,GST billing"),
    ("chitticlothing",   "Chitti Clothing",   "chitticlothing@gmail.com",
        "retail_fashion",
        "size tracking,seasonal inventory,customer style preferences"),
    ("chittielectronics", "Chitti Electronics", "chittielectronics@gmail.com",
        "electronics_retail",
        "warranty tracking,repair bookings,accessory suggestions"),
    ("chittifurniture",  "Chitti Furniture",  "chittifurniture@gmail.com",
        "large_item_retail",
        "delivery scheduling,assembly tracking,custom order management"),
]


def seed_defaults_if_empty() -> None:
    """Idempotent upsert. Name kept for backward compatibility with main.py;
    behaviour now seeds-or-backfills regardless of whether the table is empty."""
    if os.environ.get("ADMIN_SEED_DEFAULTS", "true").lower() in ("0", "false", "no"):
        return

    inserted = 0
    backfilled = 0
    with session() as s:
        for key, name, email, domain, feats in DEFAULTS:
            row = s.query(ProductGmailAccount).filter_by(product_key=key).first()
            if row is None:
                s.add(ProductGmailAccount(
                    product_key=key,
                    product_name=name,
                    gmail_address=email,
                    oauth_status="needs_auth",
                    domain_template=domain,
                    features=feats,
                ))
                inserted += 1
                continue
            # Backfill new fields onto pre-existing rows. Never overwrite
            # values an admin set via the dashboard.
            changed = False
            if domain and not row.domain_template:
                row.domain_template = domain
                changed = True
            if feats and not row.features:
                row.features = feats
                changed = True
            if changed:
                backfilled += 1

    if inserted or backfilled:
        log.info("admin_seed: inserted=%d backfilled=%d", inserted, backfilled)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    seed_defaults_if_empty()
    print("seed complete")
