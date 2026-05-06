"""
scripts/loaders/nppa.py
-----------------------
NPPA (National Pharmaceutical Pricing Authority) ceiling-price list loader.

Source (free, public, government):
  https://www.nppa.gov.in/drug-price/
  https://www.nppaindia.nic.in/en/dpco-2013/scheduled-medicines/

Each notification is published as a PDF or Excel; the structured CSV is
periodically posted on data.gov.in. Column names vary across exports.

What this loader does:
  - Reads the NPPA ceiling list (CSV / XLSX)
  - For each row: composition + strength + dosage form → NPPA ceiling price
  - UPDATES every existing Medicine row with the same composition+strength+form
    so the `nppa_ceiling_price` field is populated. (We do NOT insert a new
    row per ceiling-price entry — those would be branded duplicates of the
    existing seed/BPPI rows.)
  - Optionally creates a "Generic — <molecule> <strength> <form>" row when
    no matching brand exists yet, so the ceiling is at least surfaced.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

from sqlalchemy import func

from . import _common as C

log = logging.getLogger("loaders.nppa")

DEFAULT_FILENAME = "nppa_ceiling_prices.csv"


def load(db, *, url: Optional[str] = None, file_path: Optional[str] = None,
         dry_run: bool = False, force: bool = False) -> dict:
    if not (url or file_path):
        raise ValueError(
            "nppa loader needs --url or --file. "
            "Download a ceiling-price notification from nppa.gov.in/drug-price "
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

    matched = inserted = skipped = errors = 0
    for raw in rows:
        try:
            molecule_raw = C.pick_first_present(
                raw, "Drug Name", "Drug", "Composition", "Generic Name", "Name of Drug",
            )
            strength_raw = C.pick_first_present(
                raw, "Strength", "Dose", "Dosage", "Drug Strength",
            )
            form_raw = C.pick_first_present(
                raw, "Dosage Form", "Form", "Unit",
            )
            ceiling_raw = C.pick_first_present(
                raw, "Ceiling Price", "Ceiling Price (Rs./Unit)", "Price",
                "Retail Price (Rs./Unit)", "Retail Price",
            )

            molecule = C.normalize_molecule(molecule_raw)
            strength = C.normalize_strength(strength_raw)
            dosage_form = C.normalize_dosage_form(form_raw) or "Tablet"
            ceiling = C.safe_float(ceiling_raw)

            if not (molecule and strength and ceiling is not None):
                skipped += 1
                continue

            # Update every brand sharing this composition+strength+form
            q = (
                db.query(Medicine)
                .filter(
                    func.lower(Medicine.salt_composition).like(f"%{molecule}%"),
                    func.lower(Medicine.strength) == strength.lower(),
                    func.lower(Medicine.dosage_form) == dosage_form.lower(),
                )
            )
            existing = q.all() if not dry_run else q.limit(20).all()
            if existing:
                if not dry_run:
                    for m in existing:
                        m.nppa_ceiling_price = ceiling
                matched += len(existing)
                continue

            # No brand match — surface a generic placeholder row
            if dry_run:
                inserted += 1
                continue

            generic_brand = f"Generic {molecule.title()} {strength}".strip()
            created, _ = C.upsert_medicine(
                db,
                brand_name=generic_brand,
                salt_composition=molecule_raw or molecule,
                strength=strength,
                dosage_form=dosage_form,
                manufacturer="(generic — NPPA ceiling)",
                nppa_ceiling_price=ceiling,
                risk_class="L",
            )
            if created:
                inserted += 1
        except Exception as e:  # noqa: BLE001
            log.exception("row failed: %s", e)
            errors += 1

    if not dry_run:
        db.commit()

    log.info("nppa: %d brand rows matched (ceiling updated), %d generic rows inserted, %d skipped, %d errors",
             matched, inserted, skipped, errors)
    return {
        "source": "nppa",
        "matched": matched,
        "inserted": inserted,
        "skipped": skipped,
        "errors": errors,
        "file": str(path),
    }
