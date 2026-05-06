"""
scripts/loaders/jan_aushadhi.py
-------------------------------
Jan Aushadhi (PMBJP) full store-list loader.

Source (free, public, government):
  https://janaushadhi.gov.in/storelist.aspx
  data.gov.in: search "Jan Aushadhi Kendra"
  CSV / Excel published periodically; column names vary by export.

Why a flexible parser?
  Different exports of the same dataset use different column names
  ("Store Name" vs "Name of Kendra" vs "Kendra Name"; "Latitude" vs
  "Lat" vs "GPS Lat"). We accept multiple aliases.

Usage:
    python scripts/load_real_data.py --source=jan_aushadhi --file path/to/stores.csv
    python scripts/load_real_data.py --source=jan_aushadhi --url https://...
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

from . import _common as C

log = logging.getLogger("loaders.jan_aushadhi")

DEFAULT_FILENAME = "jan_aushadhi_stores.csv"


def load(db, *, url: Optional[str] = None, file_path: Optional[str] = None,
         dry_run: bool = False, force: bool = False) -> dict:
    if not (url or file_path):
        raise ValueError(
            "jan_aushadhi loader needs --url or --file. "
            "Download the store list from janaushadhi.gov.in/storelist.aspx "
            "and pass --file <path>."
        )

    if url:
        path = C.download_to_cache(url, DEFAULT_FILENAME, force=force)
    else:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(path)

    rows = C.read_table(path)
    log.info("read %d rows from %s", len(rows), path.name)

    upserted = skipped = errors = 0
    for raw in rows:
        try:
            store_code = C.safe_str(C.pick_first_present(
                raw,
                "Store Code", "Kendra Code", "PMBJK Code", "PMBJK No",
                "Code", "ID", "Drug Code",
            ))
            name = C.safe_str(C.pick_first_present(
                raw,
                "Store Name", "Kendra Name", "Name of Kendra",
                "Name", "PMBJK Name",
            ))
            lat = C.safe_float(C.pick_first_present(
                raw, "Latitude", "Lat", "GPS Lat", "Lat (degrees)",
            ))
            lng = C.safe_float(C.pick_first_present(
                raw, "Longitude", "Long", "Lng", "GPS Lng",
                "Lon", "Lng (degrees)",
            ))
            address = C.safe_str(C.pick_first_present(
                raw, "Address", "Full Address", "Location",
            ))
            district = C.safe_str(C.pick_first_present(
                raw, "District", "Dist", "District Name",
            ))
            state = C.safe_str(C.pick_first_present(
                raw, "State", "State Name", "State/UT",
            ))
            pincode = C.safe_str(C.pick_first_present(
                raw, "Pincode", "PIN", "PIN Code", "Pin Code", "Postal Code",
            ))
            phone = C.safe_str(C.pick_first_present(
                raw, "Phone", "Contact", "Mobile", "Contact No", "Phone No",
            ))
            hours = C.safe_str(C.pick_first_present(
                raw, "Hours", "Working Hours", "Timings", "Open Hours",
            ))

            if not store_code or not name:
                skipped += 1
                continue
            if lat is None or lng is None:
                # Cannot geo-search without coords. Log and move on.
                log.debug("skip %s — missing lat/lng", store_code)
                skipped += 1
                continue

            if dry_run:
                upserted += 1
                continue

            created, _row = C.upsert_jan_aushadhi(
                db,
                store_code=store_code, name=name,
                lat=lat, lng=lng,
                address=address, district=district, state=state,
                pincode=pincode, phone=phone, hours=hours,
            )
            upserted += 1 if created else 0
            if not created:
                # not strictly an upsert-create, but counted as a successful row
                pass
        except Exception as e:  # noqa: BLE001
            log.exception("row failed: %s", e)
            errors += 1

    if not dry_run:
        db.commit()

    log.info("jan_aushadhi: %d upserted (rows accepted), %d skipped, %d errors", upserted, skipped, errors)
    return {"source": "jan_aushadhi", "upserted": upserted, "skipped": skipped, "errors": errors, "file": str(path)}
