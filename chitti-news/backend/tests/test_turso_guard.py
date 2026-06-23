"""Verify the 2026-06-23 Turso-quota fix: feed() + _coverage_for() only read
recent articles (recency-bound), and DEV_MODE forces sqlite."""
import os, sys, tempfile
from datetime import datetime, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.dirname(HERE)
sys.path.insert(0, BACKEND)

os.environ["ENV"] = "development"
os.environ["DATABASE_URL"] = "libsql://should-be-refused.turso.io?authToken=x"  # dev must refuse this
os.environ.setdefault("SCHEDULER_ENABLED", "false")

from lib.devmode import guard_database_url, DEV_MODE
assert DEV_MODE is True
assert guard_database_url(os.environ["DATABASE_URL"]).startswith("sqlite"), "DEV must refuse Turso"
print("PASS  DEV_MODE refuses Turso libsql URL → sqlite")

# Now point at a temp sqlite and exercise the queries.
_db = os.path.join(tempfile.gettempdir(), "news_guard_test.db")
if os.path.exists(_db): os.remove(_db)
os.environ["DATABASE_URL"] = f"sqlite:///{_db}"
# reload config/database with the new URL
for m in list(sys.modules):
    if m in ("config","database") or m.startswith("models") or m.startswith("services"):
        del sys.modules[m]

from database import Base, engine, SessionLocal
import models  # noqa
from models.article import Article
from services import news_db

Base.metadata.create_all(bind=engine)
db = SessionLocal()
now = datetime.utcnow()
db.add_all([
    Article(title="Recent national", link="r1", source_slug="toi", state="india",
            language="en", category="national", fetched_at=now, published_at=now, importance=8),
    Article(title="Old national", link="o1", source_slug="toi", state="india",
            language="en", category="national", fetched_at=now - timedelta(days=60),
            published_at=now - timedelta(days=60), importance=9),
])
db.commit()

res = news_db.feed(db, state="india", language="en", category="national", limit=50)
titles = [i["title"] for i in res["items"]]
assert "Recent national" in titles, titles
assert "Old national" not in titles, ("old article leaked past recency bound", titles)
print(f"PASS  feed() recency-bound: returns {titles} (60-day-old excluded)")

cov = news_db._coverage_for(db, "india", "en")
assert cov["per_category"].get("national") == 1, cov
print(f"PASS  coverage counts only recent: {cov['per_category']}")

print("\n=== chitti-news Turso guard: ALL PASS ===")
