"""
scripts/loaders/bppi_products.py
--------------------------------
Jan Aushadhi / BPPI Product Price List loader.

Source (free, public, government):
  https://janaushadhi.gov.in/productlist.aspx
  CSV / Excel published periodically. ~2,000 product rows.

  Columns (typical export):
    Drug Code · Generic Name · Strength · Unit · Therapeutic Category · MRP

This is the single richest source for "2000+ medicines, real prices"
that Bryan asked for. Each row becomes a Medicine row keyed on the
Jan Aushadhi generic — branded equivalents enrich on top later.

Risk class is derived from the molecule via services.medupi_risk so the
same H/M/L tagging applies to BPPI generics as to seeded brands.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

from . import _common as C

log = logging.getLogger("loaders.bppi_products")

DEFAULT_FILENAME = "bppi_products.csv"


def _therapeutic_to_risk(cat: Optional[str]) -> str:
    """Map BPPI's coarse therapeutic category to H/M/L when the molecule isn't in our risk map yet."""
    if not cat:
        return "L"
    c = cat.lower()
    if any(k in c for k in ("antibiotic", "antimicrobial", "antifungal", "antiviral",
                            "cardiovascular", "cardiac", "antihypertensive",
                            "antidiabetic", "diabetic", "endocrine",
                            "antineoplastic", "anticancer", "oncology",
                            "psychiatric", "antipsychotic", "antidepressant",
                            "thyroid", "anticoagulant", "antiplatelet",
                            "antiasthmatic", "respiratory")):
        return "H"
    if any(k in c for k in ("analgesic", "nsaid", "anti-inflammatory",
                            "antacid", "gastrointestinal", "antiemetic", "anti-emetic")):
        return "M"
    return "L"


def _therapeutic_to_schedule(cat: Optional[str], strength: Optional[str]) -> Optional[str]:
    """Crude fallback when CDSCO data isn't loaded yet."""
    if not cat:
        return None
    c = cat.lower()
    if any(k in c for k in ("antibiotic", "psychiatric", "anticoagulant", "anticancer",
                            "antineoplastic", "narcotic")):
        return "H"
    return None


def load(db, *, url: Optional[str] = None, file_path: Optional[str] = None,
         dry_run: bool = False, force: bool = False) -> dict:
    if not (url or file_path):
        raise ValueError(
            "bppi_products loader needs --url or --file. "
            "Download the product price list from janaushadhi.gov.in/productlist.aspx "
            "and pass --file <path>."
        )

    if url:
        path = C.download_to_cache(url, DEFAULT_FILENAME, force=force)
    else:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(path)

    # Lazy-import medupi_risk (sits in services/, not in scripts/)
    from services import medupi_risk

    rows = C.read_table(path)
    log.info("read %d rows from %s", len(rows), path.name)

    upserted = updated = skipped = errors = 0
    for raw in rows:
        try:
            drug_code = C.safe_str(C.pick_first_present(
                raw, "Drug Code", "Code", "Product Code", "BPPI Code",
            ))
            generic = C.safe_str(C.pick_first_present(
                raw, "Generic Name", "Drug Name", "Product Name",
                "Name", "Composition",
            ))
            strength = C.normalize_strength(C.pick_first_present(
                raw, "Strength", "Drug Strength", "Dose", "Dosage",
            ))
            unit = C.safe_str(C.pick_first_present(
                raw, "Unit", "Dosage Form", "Form", "Pack Type",
            ))
            cat = C.safe_str(C.pick_first_present(
                raw, "Therapeutic Category", "Category", "Therapeutic Class",
            ))
            mrp = C.safe_float(C.pick_first_present(
                raw, "MRP", "Price", "Selling Price", "Rate",
            ))

            if not generic or not strength:
                skipped += 1
                continue

            dosage_form = C.normalize_dosage_form(unit) or "Tablet"
            molecule = C.normalize_molecule(generic)

            # Risk class — use services.medupi_risk if known, else fall back to therapeutic-class heuristic
            risk = medupi_risk.classify(molecule)["class"] if molecule else "L"
            if risk == "L":
                risk = _therapeutic_to_risk(cat)

            # The BPPI brand IS the generic — store as "Jan Aushadhi <generic>"
            # so the brand search differentiates it from branded equivalents.
            brand_name = f"Jan Aushadhi {generic}"

            if dry_run:
                upserted += 1
                continue

            created, _row = C.upsert_medicine(
                db,
                brand_name=brand_name,
                salt_composition=generic,
                strength=strength,
                dosage_form=dosage_form,
                manufacturer="BPPI / Jan Aushadhi",
                mrp=mrp,
                jan_aushadhi_price=mrp,
                jan_aushadhi_code=drug_code,
                risk_class=risk,
                schedule=_therapeutic_to_schedule(cat, strength),
                prescription_required=1 if risk == "H" else 0,
                therapeutic_class=cat,
            )
            upserted += 1 if created else 0
            updated += 0 if created else 1
        except Exception as e:  # noqa: BLE001
            log.exception("row failed: %s", e)
            errors += 1

    if not dry_run:
        db.commit()

    log.info("bppi_products: %d new, %d updated, %d skipped, %d errors",
             upserted, updated, skipped, errors)
    return {
        "source": "bppi_products",
        "upserted": upserted,
        "updated": updated,
        "skipped": skipped,
        "errors": errors,
        "file": str(path),
    }
