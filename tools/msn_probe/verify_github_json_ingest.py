"""
End-to-end verify of the GitHub NewsAPI JSON snapshot through the
json+ source-type dispatch (shipped d3b21e9). Spins up sandbox SQLite,
seeds just the github-newsapi-india source, runs fetch_source(), and
logs inserted/skipped/error.
"""
from __future__ import annotations

import os, sys, tempfile, json
from pathlib import Path


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    tmp = tempfile.mkdtemp(prefix="json_verify_")
    db_path = Path(tmp) / "verify.db"
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path.as_posix()}"
    os.environ["SCHEDULER_ENABLED"] = "false"

    backend = Path(__file__).resolve().parent.parent.parent / "chitti-news" / "backend"
    sys.path.insert(0, str(backend))

    from database import engine, SessionLocal, Base  # noqa
    from models.source import Source                  # noqa
    from models.article import Article                # noqa
    from services import news_ingest                  # noqa

    Base.metadata.create_all(bind=engine)

    src_data = json.loads(
        (Path(__file__).resolve().parent.parent.parent
         / "chitti-news" / "backend" / "data" / "sources.json").read_text(encoding="utf-8"))
    row = next(s for s in src_data if s["slug"] == "github-newsapi-india")

    db = SessionLocal()
    db.add(Source(
        slug=row["slug"], display_name=row["display_name"],
        rss_url=row["rss_url"], homepage_url=row.get("homepage_url"),
        state=row.get("state"), language=row.get("language"),
        category=row.get("category"), enabled=1,
    ))
    db.commit()

    src = db.query(Source).filter(Source.slug == "github-newsapi-india").first()
    res = news_ingest.fetch_source(db, src)
    print("=" * 70)
    print(f"  {src.slug}: {res}")
    print("=" * 70)
    # Show what landed
    arts = db.query(Article).all()
    print(f"\nArticles in sandbox DB: {len(arts)}")
    for a in arts[:3]:
        print(f"  - [{a.source_name}] {a.title[:80]}")
        print(f"    {a.link[:90]}")
        print(f"    published_at={a.published_at}")
    db.close()


if __name__ == "__main__":
    main()
