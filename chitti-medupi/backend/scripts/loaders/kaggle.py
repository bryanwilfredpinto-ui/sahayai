"""
scripts/loaders/kaggle.py
-------------------------
Kaggle "A-Z Medicine Dataset of India" loader.

Source (free, large reference dataset):
  https://www.kaggle.com/datasets/shudhanshusingh/az-medicine-dataset-of-india
  Roughly 250,000 Indian-market medicine rows. Use as a one-time bulk
  base for branded MRP coverage. NOT a real-time feed.

Authentication:
  Kaggle datasets need an API token. Set up:
      pip install kaggle
      mkdir ~/.kaggle && cp kaggle.json ~/.kaggle/  (chmod 600)
  OR download the CSV manually from Kaggle and pass --file.

Why optional:
  We do NOT make the kaggle SDK a hard dependency. Bryan downloads the
  CSV once (~few MB) and feeds it via --file. Cleaner, no auth-leak risk.

Columns (typical export — normalized):
  id · name · short_composition1 · short_composition2 · pack_size_label
  manufacturer_name · price · is_discontinued · type
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

from . import _common as C

log = logging.getLogger("loaders.kaggle")

DEFAULT_FILENAME = "kaggle_az_medicine_india.csv"

# Kaggle exports use multiple `short_composition*` columns we need to merge
_COMP_COLS = (
    "short_composition1", "short_composition2", "short_composition3",
    "Short Composition 1", "Short Composition 2", "Short Composition 3",
    "composition", "Composition",
)


def _merge_composition(raw: dict) -> Optional[str]:
    parts: list[str] = []
    for k in _COMP_COLS:
        v = C.safe_str(raw.get(k))
        if v:
            parts.append(v)
    return "+".join(parts) if parts else None


def _parse_strength_from_pack(pack: Optional[str]) -> Optional[str]:
    """Kaggle's pack_size_label often embeds strength: '10 tablets in 1 strip · 500mg'."""
    s = C.safe_str(pack)
    if not s:
        return None
    import re
    m = re.search(r"(\d+(?:\.\d+)?)\s*(mg|mcg|µg|g|ml|iu)", s, re.IGNORECASE)
    if m:
        return f"{m.group(1)}{m.group(2).lower()}"
    return None


def _parse_form_from_pack(pack: Optional[str]) -> Optional[str]:
    s = C.safe_str(pack)
    if not s:
        return None
    s_l = s.lower()
    if "tablet" in s_l or "tab" in s_l:
        return "Tablet"
    if "capsule" in s_l or "cap" in s_l:
        return "Capsule"
    if "syrup" in s_l or "susp" in s_l:
        return "Syrup"
    if "injection" in s_l or "inj" in s_l or "vial" in s_l:
        return "Injection"
    if "inhaler" in s_l:
        return "Inhaler"
    if "drops" in s_l:
        return "Drops"
    if "cream" in s_l or "ointment" in s_l or "gel" in s_l:
        return "Cream"
    return None


def load(db, *, url: Optional[str] = None, file_path: Optional[str] = None,
         dry_run: bool = False, force: bool = False) -> dict:
    if not (url or file_path):
        raise ValueError(
            "kaggle loader needs --file (recommended) or --url. "
            "Download from https://www.kaggle.com/datasets/shudhanshusingh/"
            "az-medicine-dataset-of-india and pass --file <path>."
        )
    if url:
        path = C.download_to_cache(url, DEFAULT_FILENAME, force=force)
    else:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(path)

    from services import medupi_risk

    rows = C.read_table(path)
    log.info("read %d rows from %s", len(rows), path.name)

    upserted = updated = skipped = errors = 0
    for raw in rows:
        try:
            brand = C.safe_str(C.pick_first_present(
                raw, "name", "Name", "medicine_name", "Medicine Name", "Brand",
            ))
            comp = _merge_composition(raw) or C.safe_str(C.pick_first_present(
                raw, "salt_composition", "active_ingredient", "API",
            ))
            pack = C.safe_str(C.pick_first_present(
                raw, "pack_size_label", "Pack Size", "packaging",
            ))
            strength = C.normalize_strength(C.pick_first_present(
                raw, "strength", "dose", "Dosage",
            )) or _parse_strength_from_pack(pack)
            form = C.normalize_dosage_form(C.pick_first_present(
                raw, "type", "Type", "dosage_form", "Form",
            )) or _parse_form_from_pack(pack) or "Tablet"
            manuf = C.safe_str(C.pick_first_present(
                raw, "manufacturer_name", "Manufacturer", "Company",
            ))
            price = C.safe_float(C.pick_first_present(
                raw, "price", "Price", "MRP", "mrp",
            ))

            if not (brand and comp and strength):
                skipped += 1
                continue

            molecule_norm = C.normalize_molecule(comp)
            risk = medupi_risk.classify(molecule_norm)["class"] if molecule_norm else "L"

            if dry_run:
                upserted += 1
                continue

            created, _ = C.upsert_medicine(
                db,
                brand_name=brand,
                salt_composition=comp,
                strength=strength,
                dosage_form=form,
                pack_size=pack,
                manufacturer=manuf,
                mrp=price,
                risk_class=risk,
                prescription_required=1 if risk == "H" else 0,
            )
            # Tag provenance for the freshness UI
            if created:
                upserted += 1
            else:
                updated += 1
            try:
                # Best-effort: stamp price_source on the row we just touched
                from sqlalchemy import func
                from models.medicine import Medicine
                db.query(Medicine).filter(
                    func.lower(Medicine.brand_name) == brand.lower(),
                    func.lower(Medicine.strength) == strength.lower(),
                    func.lower(Medicine.dosage_form) == form.lower(),
                ).update({"price_source": "kaggle"}, synchronize_session=False)
            except Exception:  # noqa: BLE001
                pass

            # Commit in batches of 500 to keep memory bounded on 250k rows
            if (upserted + updated) % 500 == 0:
                db.commit()
        except Exception as e:  # noqa: BLE001
            log.exception("row failed: %s", e)
            errors += 1

    if not dry_run:
        db.commit()

    log.info("kaggle: %d new, %d updated, %d skipped, %d errors",
             upserted, updated, skipped, errors)
    return {
        "source": "kaggle",
        "upserted": upserted,
        "updated": updated,
        "skipped": skipped,
        "errors": errors,
        "file": str(path),
    }
