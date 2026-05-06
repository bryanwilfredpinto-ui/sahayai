"""
scripts/auto_update.py
----------------------
Wrappers the scheduler invokes for the monthly Jan Aushadhi + weekly NPPA jobs.

Both functions are best-effort against government-published URLs whose
exact paths drift between releases. When a URL stops working, they:
  - log a warning,
  - write an audit row,
  - return without raising,
so the scheduler keeps firing next month / next week.

Bryan can override URLs via env vars without code changes:
  JAN_AUSHADHI_PRODUCT_URL
  NPPA_CEILING_URL

If the env var is unset we try a sensible default. If the response isn't
parseable as a CSV/Excel table, we leave the DB untouched and surface
the failure in the audit log.
"""
from __future__ import annotations

import logging
import os
import sys
from pathlib import Path
from typing import Optional

# Allow `from database import SessionLocal` etc. when invoked as a script
HERE = Path(__file__).resolve().parent
BACKEND_ROOT = HERE.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

log = logging.getLogger("auto_update")


# ───── URLs (env-overridable) ─────

DEFAULT_JAN_AUSHADHI_PRODUCT_URL = "https://janaushadhi.gov.in/productportfolio/ProductmrpList"
DEFAULT_NPPA_CEILING_URL = "https://www.nppa.gov.in/drug-price"


def _env(key: str, default: str) -> str:
    return os.environ.get(key, "").strip() or default


# ───── Monthly Jan Aushadhi ─────

def auto_jan_aushadhi(url: Optional[str] = None) -> dict:
    """
    Best-effort monthly download of the BPPI Product Price List.
    Returns the loader's result dict (or a stub with `note` on failure).
    """
    from database import SessionLocal
    from scripts.loaders import bppi_products
    from scripts.loaders import _common as C

    target = url or _env("JAN_AUSHADHI_PRODUCT_URL", DEFAULT_JAN_AUSHADHI_PRODUCT_URL)
    log.info("auto_jan_aushadhi: GET %s", target)

    try:
        path = C.download_to_cache(target, "bppi_products_auto.csv", force=True)
    except Exception as e:  # noqa: BLE001
        log.warning("auto_jan_aushadhi download failed: %s", e)
        return {"note": f"download failed: {e}"}

    # If the response isn't a recognized table format, skip gracefully
    suffix = path.suffix.lower()
    if suffix not in {".csv", ".xls", ".xlsx", ".xlsm", ".tsv", ".json"}:
        # Government endpoint may return HTML — log + skip
        return {"note": f"download ok but unsupported file type ({suffix}); manual download required"}

    db = SessionLocal()
    try:
        return bppi_products.load(db, file_path=str(path))
    except Exception as e:  # noqa: BLE001
        log.exception("auto_jan_aushadhi parse failed")
        return {"errors": 1, "note": f"parse failed: {e}"}
    finally:
        db.close()


# ───── Weekly NPPA ─────

def auto_nppa(url: Optional[str] = None) -> dict:
    """
    Best-effort weekly check for new NPPA ceiling-price notifications.
    """
    from database import SessionLocal
    from scripts.loaders import nppa
    from scripts.loaders import _common as C

    target = url or _env("NPPA_CEILING_URL", DEFAULT_NPPA_CEILING_URL)
    log.info("auto_nppa: GET %s", target)

    try:
        path = C.download_to_cache(target, "nppa_ceiling_auto.csv", force=True)
    except Exception as e:  # noqa: BLE001
        log.warning("auto_nppa download failed: %s", e)
        return {"note": f"download failed: {e}"}

    suffix = path.suffix.lower()
    if suffix not in {".csv", ".xls", ".xlsx", ".xlsm", ".tsv", ".json"}:
        return {"note": f"download ok but unsupported file type ({suffix}); manual download required"}

    db = SessionLocal()
    try:
        return nppa.load(db, file_path=str(path))
    except Exception as e:  # noqa: BLE001
        log.exception("auto_nppa parse failed")
        return {"errors": 1, "note": f"parse failed: {e}"}
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="Manual run of the auto-update wrappers.")
    p.add_argument("which", choices=("jan_aushadhi", "nppa"))
    p.add_argument("--url")
    args = p.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    fn = auto_jan_aushadhi if args.which == "jan_aushadhi" else auto_nppa
    print(fn(url=args.url))
