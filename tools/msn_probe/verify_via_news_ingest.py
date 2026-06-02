"""
End-to-end verification: spin up an in-memory SQLite, load ONLY the 24 new
sources, run the production news_ingest.fetch_source against each, log
per-source inserted/skipped/error rows.

This exercises the exact production code path (two-stage fetcher,
cloudscraper fallback, content:encoded extraction, image probe, idempotent
link dedup) — Sire's explicit ask "Run news_ingest.py to verify all feeds
work" applied to a sandboxed DB.

Run:  python tools/msn_probe/verify_via_news_ingest.py
"""
from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path


def main():
    sys.stdout.reconfigure(encoding="utf-8")

    # Sandbox DB — file SQLite, isolated from prod Turso.
    tmpdir = tempfile.mkdtemp(prefix="chitti_news_verify_")
    db_path = Path(tmpdir) / "verify.db"
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path.as_posix()}"
    os.environ["SCHEDULER_ENABLED"] = "false"

    # Inject the backend onto sys.path so its `from database import` works
    backend = Path(__file__).resolve().parent.parent.parent / "chitti-news" / "backend"
    sys.path.insert(0, str(backend))

    # Now import (DATABASE_URL must be set before this).
    from database import engine, SessionLocal, Base  # noqa: E402
    from models.source import Source  # noqa: E402
    from models.article import Article  # noqa: E402
    from services import news_ingest  # noqa: E402

    Base.metadata.create_all(bind=engine)
    print(f"DB: {db_path}")
    print(f"Tables created: {sorted(Base.metadata.tables.keys())}\n")

    # 24 new sources from append_full_batch
    NEW_SLUGS = [
        "gujsam-gujarat", "gujsam-business", "gujsam-sports",
        "gujsam-entertainment", "gujsam-world", "gujsam-surat", "gujsam-editorial",
        "eastmojo", "eastmojo-manipur", "eastmojo-meghalaya",
        "northeastnow", "assamrising",
        "cg24-national", "cg24-sports", "cg24-entertainment",
        "cg24-politics", "cg24-business", "cg24-crime",
        "guardian-india", "indian-express-main", "mint-news",
        "business-standard", "deccan-herald-main", "bangalore-mirror",
    ]

    # Load only those 24 from sources.json into the sandbox DB
    import json as _json
    src_data = _json.loads(
        (Path(__file__).resolve().parent.parent.parent
         / "chitti-news" / "backend" / "data" / "sources.json").read_text(encoding="utf-8")
    )
    by_slug = {s["slug"]: s for s in src_data}

    db = SessionLocal()
    try:
        for slug in NEW_SLUGS:
            row = by_slug[slug]
            db.add(Source(
                slug=row["slug"], display_name=row["display_name"],
                rss_url=row["rss_url"], homepage_url=row.get("homepage_url"),
                state=row.get("state", "india"), language=row.get("language", "en"),
                category=row.get("category", "national"),
                enabled=int(row.get("enabled", 1)),
            ))
        db.commit()
        print(f"Seeded {len(NEW_SLUGS)} sources into sandbox DB\n")

        # Iterate + fetch each through production code path
        print("=" * 88)
        print(f"{'slug':22}  {'http':>6}  {'inserted':>8}  {'skipped':>7}  status")
        print("=" * 88)
        totals = {"sources": 0, "inserted": 0, "skipped": 0, "errors": 0}
        per_lang = {}
        for slug in NEW_SLUGS:
            src = db.query(Source).filter(Source.slug == slug).first()
            res = news_ingest.fetch_source(db, src)
            err = res.get("error") or ""
            status = "OK" if not err else f"ERR: {err[:40]}"
            print(f"{slug:22}  {'-':>6}  {res['inserted']:>8}  {res['skipped']:>7}  {status}")
            totals["sources"] += 1
            totals["inserted"] += res["inserted"]
            totals["skipped"] += res["skipped"]
            if err:
                totals["errors"] += 1
            per_lang.setdefault(src.language, 0)
            per_lang[src.language] += res["inserted"]

        print("=" * 88)
        print(f"\nTOTALS: {totals['sources']} sources · {totals['inserted']} articles inserted · "
              f"{totals['skipped']} skipped · {totals['errors']} errors\n")
        print("Articles inserted per language:")
        for l in sorted(per_lang.keys()):
            print(f"  {l}: {per_lang[l]}")

        # Final sanity: count articles in DB by language
        from sqlalchemy import func
        print("\nArticle table row counts by language (from DB):")
        rows = db.query(Article.language, func.count(Article.id)).group_by(Article.language).all()
        for l, n in rows:
            print(f"  {l}: {n}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
