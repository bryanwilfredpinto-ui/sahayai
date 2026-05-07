"""Throwaway: load .env, show URL structure (no password), try both connects."""
import os
import sys
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import load_apollo_oneshot  # noqa: F401  — side effect: loads .env

import psycopg2

url = os.environ.get("DATABASE_URL", "")
if not url:
    print("DATABASE_URL not set after .env load")
    sys.exit(2)

p = urllib.parse.urlparse(url)
pw = urllib.parse.unquote(p.password or "")
user = urllib.parse.unquote(p.username or "")

print("=== URL structure (password redacted) ===")
print(f"  scheme        : {p.scheme}")
print(f"  username      : {user!r}")
print(f"  host          : {p.hostname}")
print(f"  port          : {p.port}")
print(f"  database      : {p.path.lstrip('/')}")
print(f"  pw length     : {len(pw)} chars")
print(f"  pw start/end  : {pw[:2]!r}...{pw[-2:]!r}")
specials = sorted(set([c for c in pw if not c.isalnum()]))
print(f"  pw specials   : {specials}")
print(f"  url-encoded?  : {'%' in (p.password or '')}")
print()

print("=== Test 1: psycopg2.connect(url) ===")
try:
    c = psycopg2.connect(url, connect_timeout=15)
    cur = c.cursor()
    cur.execute("SELECT current_user, current_database()")
    print(f"  OK  {cur.fetchone()}")
    cur.execute(
        "SELECT schema_name FROM information_schema.schemata "
        "WHERE schema_name IN ('public','medupi','shares')"
    )
    print(f"  schemas: {[r[0] for r in cur.fetchall()]}")
    cur.execute("SELECT COUNT(*) FROM medupi.medicines")
    print(f"  medupi.medicines rows: {cur.fetchone()[0]}")
    cur.close(); c.close()
except Exception as e:
    print(f"  FAIL: {e}")
print()

print("=== Test 2: psycopg2.connect(**kwargs) ===")
try:
    c = psycopg2.connect(
        host=p.hostname,
        port=p.port or 5432,
        user=user,
        password=pw,
        dbname=p.path.lstrip("/") or "postgres",
        connect_timeout=15,
        sslmode="require",
    )
    cur = c.cursor()
    cur.execute("SELECT current_user")
    print(f"  OK  {cur.fetchone()}")
    cur.close(); c.close()
except Exception as e:
    print(f"  FAIL: {e}")
