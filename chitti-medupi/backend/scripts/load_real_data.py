"""
scripts/load_real_data.py
-------------------------
Chitti MedUPI — real-data loader CLI.

Loads government-verified + free public-API data into the MedUPI database.
Replaces the 51-row hand-curated seed with 2,000+ medicines and 11,000+
Jan Aushadhi stores once the source files are downloaded.

Sources (all free + legal):
  - NPPA Drug Price List          https://www.nppa.gov.in/drug-price/
  - Jan Aushadhi (BPPI) Stores    https://janaushadhi.gov.in/storelist.aspx
  - Jan Aushadhi (BPPI) Products  https://janaushadhi.gov.in/productlist.aspx
  - CDSCO Approved Formulations   https://cdsco.gov.in/opencms/opencms/en/Approval_new/
  - RxNorm (NIH REST)             https://rxnav.nlm.nih.gov/REST/
  - OpenFDA (REST)                https://api.fda.gov/drug/label.json

Explicitly NOT supported — Tata 1mg / PharmEasy / NetMeds / Apollo /
Amazon Pharmacy. Their data is proprietary; scraping violates ToS.
Government data is BETTER: legally clean, ceiling-price authoritative,
updated regularly.

Usage:
  # Each source individually (recommended — you can verify each step)
  python scripts/load_real_data.py --source jan_aushadhi  --file ./stores.csv
  python scripts/load_real_data.py --source bppi_products --file ./bppi.csv
  python scripts/load_real_data.py --source nppa          --file ./nppa.xlsx
  python scripts/load_real_data.py --source cdsco         --file ./cdsco.csv
  python scripts/load_real_data.py --source rxnorm        # uses live REST API
  python scripts/load_real_data.py --source openfda       # uses live REST API

  # Or, if you have URLs that point at direct CSV/Excel exports:
  python scripts/load_real_data.py --source jan_aushadhi --url https://.../stores.csv

  # Dry-run any loader to preview row counts without writing to DB:
  python scripts/load_real_data.py --source nppa --file ./nppa.xlsx --dry-run

  # Reset the medicines + stores tables before loading (DESTRUCTIVE):
  python scripts/load_real_data.py --reset --source bppi_products --file ./bppi.csv
"""
from __future__ import annotations

import argparse
import logging
import os
import sys
from pathlib import Path


# Make `from database import …` etc. work when invoked from the backend root
HERE = Path(__file__).resolve().parent
BACKEND_ROOT = HERE.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


def _setup_logging(verbose: bool) -> None:
    logging.basicConfig(
        level=logging.DEBUG if verbose else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )


SOURCES = ("jan_aushadhi", "bppi_products", "nppa", "cdsco", "kaggle", "rxnorm", "openfda")


def _reset_tables(db) -> None:
    from models.medicine import Medicine
    from models.jan_aushadhi import JanAushadhiStore
    deleted_med = db.query(Medicine).delete()
    deleted_ja = db.query(JanAushadhiStore).delete()
    db.commit()
    logging.warning("RESET: deleted %d medicines, %d stores", deleted_med, deleted_ja)


def _run(source: str, db, url, file_path, dry_run, force) -> dict:
    if source == "jan_aushadhi":
        from scripts.loaders import jan_aushadhi
        return jan_aushadhi.load(db, url=url, file_path=file_path, dry_run=dry_run, force=force)
    if source == "bppi_products":
        from scripts.loaders import bppi_products
        return bppi_products.load(db, url=url, file_path=file_path, dry_run=dry_run, force=force)
    if source == "nppa":
        from scripts.loaders import nppa
        return nppa.load(db, url=url, file_path=file_path, dry_run=dry_run, force=force)
    if source == "cdsco":
        from scripts.loaders import cdsco
        return cdsco.load(db, url=url, file_path=file_path, dry_run=dry_run, force=force)
    if source == "kaggle":
        from scripts.loaders import kaggle
        return kaggle.load(db, url=url, file_path=file_path, dry_run=dry_run, force=force)
    if source == "rxnorm":
        from scripts.loaders import rxnorm
        return rxnorm.load(db, dry_run=dry_run, force=force)
    if source == "openfda":
        from scripts.loaders import openfda
        return openfda.load(db, dry_run=dry_run, force=force)
    raise ValueError(f"unknown source: {source}")


def main(argv=None) -> int:
    p = argparse.ArgumentParser(
        prog="load_real_data",
        description="Chitti MedUPI — load real medicine + store data from government / free public sources.",
    )
    p.add_argument("--source", choices=SOURCES, help="Single source to load.")
    p.add_argument("--all", action="store_true",
                   help="Run every loader in sensible order (bppi_products → jan_aushadhi → nppa → cdsco → rxnorm → openfda).")
    p.add_argument("--file", dest="file_path", help="Path to a downloaded CSV / XLSX / JSON.")
    p.add_argument("--url", help="Optional URL to fetch the data file from. Cached under scripts/data_cache/.")
    p.add_argument("--dry-run", action="store_true", help="Parse + log row counts but DO NOT write to DB.")
    p.add_argument("--force", action="store_true", help="Re-download a cached URL fetch.")
    p.add_argument("--reset", action="store_true",
                   help="DESTRUCTIVE: wipe medicines + stores tables before loading.")
    p.add_argument("--verbose", "-v", action="store_true")
    args = p.parse_args(argv)

    _setup_logging(args.verbose)

    if not args.source and not args.all:
        p.error("Specify --source <name> or --all")

    # Open DB
    from database import Base, SessionLocal, engine
    import models  # noqa: F401 — registers all models with Base.metadata
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if args.reset:
            if not args.dry_run:
                _reset_tables(db)
            else:
                logging.info("(dry-run) skipping reset")

        results = []
        sources = [args.source] if args.source else list(SOURCES)
        # Reorder: bppi_products + jan_aushadhi must come before NPPA / CDSCO
        # so those have rows to update.
        priority = {"bppi_products": 0, "jan_aushadhi": 1, "kaggle": 2, "nppa": 3, "cdsco": 4, "rxnorm": 5, "openfda": 6}
        sources.sort(key=lambda s: priority.get(s, 99))

        for s in sources:
            logging.info("════════════════════════════════════════════════")
            logging.info("loading source: %s", s)
            logging.info("════════════════════════════════════════════════")
            try:
                result = _run(s, db, args.url, args.file_path, args.dry_run, args.force)
                results.append(result)
                logging.info("✓ %s done: %s", s, result)
            except (ValueError, FileNotFoundError) as e:
                logging.error("✗ %s skipped: %s", s, e)
                results.append({"source": s, "skipped_reason": str(e)})
            except Exception:  # noqa: BLE001
                logging.exception("✗ %s failed", s)
                results.append({"source": s, "error": "unhandled"})

        logging.info("════════════════════════════════════════════════")
        logging.info("SUMMARY")
        for r in results:
            logging.info("  %s", r)

        # Print final DB counts
        from models.medicine import Medicine
        from models.jan_aushadhi import JanAushadhiStore
        med_n = db.query(Medicine).count()
        ja_n = db.query(JanAushadhiStore).count()
        logging.info("DB now contains: %d medicines, %d Jan Aushadhi stores", med_n, ja_n)
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
