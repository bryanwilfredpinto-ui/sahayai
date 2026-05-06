"""
scripts/loaders/cdsco.py
------------------------
CDSCO (Central Drugs Standard Control Organisation) approved-formulations loader.

Sources (free, public, government):
  https://cdsco.gov.in/opencms/opencms/en/Approval_new/Approved-Drugs/
  https://cdsco.gov.in/opencms/opencms/en/Drugs/Drugs/
  Schedule of Drugs (H / H1 / X) is published as PDFs and Excel files
  attached to the CDSCO website. Column names vary widely.

What this loader does:
  - Reads a CDSCO-approved formulations CSV / XLSX
  - For each row: extracts molecule + schedule (H/H1/X/OTC) + therapeutic class
  - UPDATES every existing Medicine row sharing that composition with the
    `schedule` and `prescription_required` fields filled in
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

from sqlalchemy import func

from . import _common as C

log = logging.getLogger("loaders.cdsco")

DEFAULT_FILENAME = "cdsco_approved.csv"


_SCHEDULE_RX = {"H1": "H1", "X": "X", "H": "H", "G": "G", "OTC": "OTC"}


def _normalize_schedule(v) -> Optional[str]:
    s = C.safe_str(v)
    if not s:
        return None
    s = s.strip().upper().replace("SCHEDULE", "").strip()
    s = s.replace("-", "").replace(".", "").strip()
    # Pick the first known token in the cell
    for token in s.split():
        if token in _SCHEDULE_RX:
            return _SCHEDULE_RX[token]
    if s in _SCHEDULE_RX:
        return _SCHEDULE_RX[s]
    return None


def load(db, *, url: Optional[str] = None, file_path: Optional[str] = None,
         dry_run: bool = False, force: bool = False) -> dict:
    if not (url or file_path):
        raise ValueError(
            "cdsco loader needs --url or --file. "
            "Download an approved-formulations export from cdsco.gov.in "
            "and pass --file <path>."
        )

    if url:
        path = C.download_to_cache(url, DEFAULT_FILENAME, force=force)
    else:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(path)

    from models.medicine import Medicine

    rows = C.read_table(path)
    log.info("read %d rows from %s", len(rows), path.name)

    matched = skipped = errors = 0
    for raw in rows:
        try:
            molecule_raw = C.pick_first_present(
                raw, "Drug Name", "Drug", "Composition", "Active Ingredient",
                "INN", "API",
            )
            schedule_raw = C.pick_first_present(
                raw, "Schedule", "Drug Schedule", "Class", "Schedule (Drugs Rules)",
            )
            therapeutic = C.pick_first_present(
                raw, "Therapeutic Category", "Category", "Indication",
            )

            molecule = C.normalize_molecule(molecule_raw)
            schedule = _normalize_schedule(schedule_raw)

            if not molecule:
                skipped += 1
                continue

            q = db.query(Medicine).filter(
                func.lower(Medicine.salt_composition).like(f"%{molecule}%")
            )
            existing = q.all() if not dry_run else q.limit(20).all()
            if not existing:
                skipped += 1
                continue

            if not dry_run:
                for m in existing:
                    if schedule:
                        m.schedule = schedule
                        m.prescription_required = 1 if schedule in {"H", "H1", "X"} else 0
                    if therapeutic and not m.therapeutic_class:
                        m.therapeutic_class = C.safe_str(therapeutic)
            matched += len(existing)
        except Exception as e:  # noqa: BLE001
            log.exception("row failed: %s", e)
            errors += 1

    if not dry_run:
        db.commit()

    log.info("cdsco: %d rows updated, %d skipped, %d errors", matched, skipped, errors)
    return {
        "source": "cdsco",
        "updated": matched,
        "skipped": skipped,
        "errors": errors,
        "file": str(path),
    }
