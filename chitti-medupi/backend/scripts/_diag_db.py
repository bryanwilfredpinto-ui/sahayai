"""Throwaway diagnostic — verifies which connect path works against the
configured Postgres (Neon). Prints URL structure (no password), then tries
(1) URL connect, (2) kwargs connect. Safe to delete after debugging."""
import os
import urllib.parse
import psycopg2

url = os.environ.get("DATABASE_URL", "")
if not url:
    print("DATABASE_URL not set"); raise SystemExit(2)

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
print(f"  pw starts/ends: {pw[:2]!r}...{pw[-2:]!r}")
specials = [c for c in pw if not c.isalnum()]
print(f"  pw specials   : {sorted(set(specials))}")
print(f"  url-encoded?  : {'%' in (p.password or '')}")
print()

print("=== Test 1: psycopg2.connect(url)  (current loader path) ===")
try:
    c = psycopg2.connect(url, connect_timeout=10)
    print("  OK")
    c.close()
except Exception as e:
    print(f"  FAIL: {e}")
print()

print("=== Test 2: psycopg2.connect(**kwargs)  (no URL parsing) ===")
try:
    c = psycopg2.connect(
        host=p.hostname,
        port=p.port or 5432,
        user=user,
        password=pw,
        dbname=p.path.lstrip("/") or "postgres",
        connect_timeout=10,
        sslmode="require",
    )
    cur = c.cursor()
    cur.execute("SELECT current_user, current_database(), version()")
    r = cur.fetchone()
    print(f"  OK  current_user={r[0]!r}  db={r[1]!r}")
    print(f"  version: {r[2][:80]}")
    cur.execute(
        "SELECT schema_name FROM information_schema.schemata "
        "WHERE schema_name IN ('public','medupi','shares')"
    )
    print(f"  schemas present: {[row[0] for row in cur.fetchall()]}")
    cur.execute("SELECT COUNT(*) FROM medupi.medicines")
    print(f"  medupi.medicines row count: {cur.fetchone()[0]}")
    cur.close()
    c.close()
except Exception as e:
    print(f"  FAIL: {e}")
