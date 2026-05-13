"""
migrate_neon_to_turso.py
------------------------
One-shot migration: pull every row from Neon Postgres `medupi.*` schema
into the Turso libSQL DB at the matching unprefixed table names.

Usage (inside WSL where libsql-experimental is installed):

    NEON_URL='postgresql://neondb_owner:...@.../neondb?sslmode=require' \\
    TURSO_URL='libsql://chitti-medupi-bryanwilfredpinto.aws-ap-south-1.turso.io' \\
    TURSO_TOKEN='eyJ...' \\
    python3 migrate_neon_to_turso.py

Strategy:
  1. Connect to Neon via psycopg2. Discover all tables in `medupi` schema +
     their column metadata (name, postgres-type, nullable, default).
  2. Connect to Turso via libsql_experimental in EMBEDDED REPLICA mode
     against /tmp/migrate_medupi.db so all CREATE / INSERT happens against
     a local SQLite + auto-syncs upstream.
  3. For each table:
       a. Build CREATE TABLE IF NOT EXISTS with SQLite-compatible types.
       b. SELECT * from medupi.<table> in batches of 1000.
       c. Translate rows (None/NULL stays NULL; datetimes -> ISO strings;
          JSONB -> json string).
       d. INSERT into the matching Turso table.
  4. Print a final per-table count summary so we can compare against Neon.

Idempotency: the script uses INSERT OR IGNORE so re-running won't duplicate
rows (assuming each table has a sensible PRIMARY KEY).
"""
from __future__ import annotations

import json
import os
import sys
import time
from typing import Any

# Postgres source
import psycopg2
import psycopg2.extras

# Turso target (embedded replica syncs to Turso behind the scenes)
import libsql_experimental as libsql


NEON_URL = os.environ.get("NEON_URL", "").strip()
TURSO_URL = os.environ.get("TURSO_URL", "").strip()
TURSO_TOKEN = os.environ.get("TURSO_TOKEN", "").strip()
LOCAL_DB = os.environ.get("LOCAL_DB", "/tmp/migrate_medupi.db")
BATCH = int(os.environ.get("BATCH", "1000"))
SCHEMA = "medupi"

if not (NEON_URL and TURSO_URL and TURSO_TOKEN):
    print("ERROR: NEON_URL, TURSO_URL, TURSO_TOKEN env vars are required", file=sys.stderr)
    sys.exit(2)


# ---- Postgres -> SQLite type mapping ----
# SQLite has a tiny type system. We map Postgres types to one of:
# INTEGER, REAL, TEXT, BLOB. JSONB / arrays get serialised to TEXT (json).

_PG_TO_SQLITE = {
    "bigint": "INTEGER",
    "integer": "INTEGER",
    "smallint": "INTEGER",
    "boolean": "INTEGER",            # 0/1
    "real": "REAL",
    "double precision": "REAL",
    "numeric": "REAL",
    "decimal": "REAL",
    "character varying": "TEXT",
    "character": "TEXT",
    "text": "TEXT",
    "uuid": "TEXT",
    "date": "TEXT",                  # ISO date
    "timestamp without time zone": "TEXT",
    "timestamp with time zone": "TEXT",
    "time without time zone": "TEXT",
    "json": "TEXT",
    "jsonb": "TEXT",
    "bytea": "BLOB",
    "ARRAY": "TEXT",                 # serialise to JSON
}


def sqlite_type_for(pg_type: str) -> str:
    return _PG_TO_SQLITE.get(pg_type.lower(), "TEXT")


def translate_value(v: Any) -> Any:
    """Convert a Postgres row value to something libsql/SQLite accepts."""
    if v is None:
        return None
    if isinstance(v, (int, float, str, bytes)):
        return v
    if isinstance(v, bool):
        return 1 if v else 0
    # datetimes / dates -> ISO string
    if hasattr(v, "isoformat"):
        return v.isoformat()
    # lists / dicts (json columns) -> serialised string
    if isinstance(v, (list, dict)):
        return json.dumps(v, default=str)
    # Decimal / UUID / etc.
    return str(v)


def _connect_pg():
    """Open a Neon connection with TCP keepalives so the pooler doesn't drop us mid-SELECT.

    Note: named (server-side) cursors require autocommit=False, so we keep
    the connection transactional and explicitly commit() between tables.
    Readonly is set at session level so a stray write would fail loudly.
    """
    pg = psycopg2.connect(
        NEON_URL,
        keepalives=1,
        keepalives_idle=30,
        keepalives_interval=10,
        keepalives_count=5,
        connect_timeout=30,
        application_name="chitti-medupi/migrate_neon_to_turso",
    )
    pg.set_session(readonly=True, autocommit=False)
    return pg


def main() -> int:
    print(f"[connect] Neon: {NEON_URL.split('@')[-1][:60]}", flush=True)
    pg = _connect_pg()
    pg_cur = pg.cursor(cursor_factory=psycopg2.extras.DictCursor)

    # Direct-to-Turso (NO local replica). The replica mode syncs after every
    # commit which becomes the bottleneck for 200k-row migrations. We only
    # issue CREATE TABLE + INSERT here, never PRAGMAs, so direct Hrana is
    # safe (the dialect-level PRAGMA issues only hit SQLAlchemy reflection).
    print(f"[connect] Turso (direct/remote): {TURSO_URL}", flush=True)
    ts = libsql.connect(TURSO_URL, auth_token=TURSO_TOKEN)

    # Discover tables in medupi schema
    pg_cur.execute(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema = %s AND table_type = 'BASE TABLE' "
        "ORDER BY table_name",
        (SCHEMA,),
    )
    tables = [r[0] for r in pg_cur.fetchall()]
    print(f"[discover] {len(tables)} tables in {SCHEMA}.*: {tables}", flush=True)

    summary = {}

    for tname in tables:
        # Get columns
        pg_cur.execute(
            "SELECT column_name, data_type, is_nullable, column_default "
            "FROM information_schema.columns "
            "WHERE table_schema = %s AND table_name = %s "
            "ORDER BY ordinal_position",
            (SCHEMA, tname),
        )
        cols = pg_cur.fetchall()
        col_names = [c[0] for c in cols]

        # Build CREATE TABLE
        col_defs = []
        for c in cols:
            cname, ctype, _nullable, _default = c[0], c[1], c[2], c[3]
            col_defs.append(f'  "{cname}" {sqlite_type_for(ctype)}')
        create_sql = (
            f'CREATE TABLE IF NOT EXISTS "{tname}" (\n'
            + ",\n".join(col_defs)
            + "\n)"
        )

        ts.execute(create_sql)
        ts.commit()

        # Pull row count first (for progress)
        pg_cur.execute(f'SELECT count(*) FROM {SCHEMA}."{tname}"')
        total = pg_cur.fetchone()[0]
        print(f"\n[table] {SCHEMA}.{tname}: {total:,} rows", flush=True)

        if total == 0:
            summary[tname] = (0, 0)
            continue

        # ID-based pagination with reconnect-on-EOF. Neon's pooler kills long
        # SELECTs (even server-side cursors), so we open a fresh cursor per
        # chunk. This requires the table to have an `id` column; for tables
        # that don't, fall back to single-shot SELECT (small tables only).
        placeholders = ", ".join("?" * len(col_names))
        col_list_quoted = ", ".join(f'"{c}"' for c in col_names)
        insert_sql = (
            f'INSERT OR IGNORE INTO "{tname}" ({col_list_quoted}) '
            f"VALUES ({placeholders})"
        )

        has_id = "id" in col_names
        inserted = 0
        t0 = time.time()
        CHUNK = 5000

        if not has_id:
            # Small table fallback — fetch everything in one go.
            local_cur = pg.cursor(cursor_factory=psycopg2.extras.DictCursor)
            local_cur.execute(f'SELECT * FROM {SCHEMA}."{tname}"')
            rows = local_cur.fetchall()
            local_cur.close()
            pg.commit()
            batch = [tuple(translate_value(r[c]) for c in col_names) for r in rows]
            if batch:
                ts.executemany(insert_sql, batch)
                ts.commit()
                inserted = len(batch)
        else:
            # COPY ... TO STDOUT is much faster than chunked SELECT. We dump
            # the result to a real file on disk, then stream CSV from that
            # file and bulk-insert into Turso. Reconnect Turso per batch so
            # Hrana streams don't time out.
            import csv as csvmod

            try:
                pg.commit()
            except Exception:
                pass

            tmp_csv = f"/tmp/migrate_{tname}.csv"
            print(f"    > COPY {SCHEMA}.{tname} TO {tmp_csv}  (csv, NULL='\\N')", flush=True)
            t_copy = time.time()
            cols_quoted = ", ".join(f'"{c}"' for c in col_names)
            copy_cur = pg.cursor()
            with open(tmp_csv, "w", encoding="utf-8", newline="") as fout:
                copy_cur.copy_expert(
                    f'COPY (SELECT {cols_quoted} FROM {SCHEMA}."{tname}" ORDER BY id) '
                    f"TO STDOUT WITH (FORMAT csv, HEADER false, NULL '\\N')",
                    fout,
                )
            copy_cur.close()
            pg.commit()
            size_bytes = os.path.getsize(tmp_csv)
            print(f"    < COPY done in {time.time() - t_copy:.1f}s  ({size_bytes:,} bytes)", flush=True)

            def _row_to_tuple(row_strs):
                out = []
                for v in row_strs:
                    out.append(None if v == "\\N" else v)
                return tuple(out)

            def _flush(batch_rows):
                nonlocal ts
                try:
                    ts.close()
                except Exception:
                    pass
                ts = libsql.connect(TURSO_URL, auth_token=TURSO_TOKEN)
                ts.executemany(insert_sql, batch_rows)
                ts.commit()

            batch: list[tuple] = []
            with open(tmp_csv, "r", encoding="utf-8", newline="") as fin:
                reader = csvmod.reader(fin)
                for row_strs in reader:
                    batch.append(_row_to_tuple(row_strs))
                    if len(batch) >= CHUNK:
                        _flush(batch)
                        inserted += len(batch)
                        batch.clear()
                        rate = inserted / max(1e-9, (time.time() - t0))
                        print(f"  ... {inserted:,}/{total:,}  ({rate:.0f} rows/s)", flush=True)

            if batch:
                _flush(batch)
                inserted += len(batch)
                rate = inserted / max(1e-9, (time.time() - t0))
                print(f"  ... {inserted:,}/{total:,}  ({rate:.0f} rows/s) [final]", flush=True)

            try:
                os.remove(tmp_csv)
            except Exception:
                pass

        # Direct-mode connection — no sync() needed; every commit already
        # writes through to Turso over Hrana.

        # Commit (and release) the Postgres transaction so the next table
        # starts fresh — keeps Neon's pooler happy.
        try:
            pg.commit()
        except Exception:
            pass

        summary[tname] = (total, inserted)
        print(f"  done. inserted={inserted:,}/{total:,}", flush=True)

    print(f"\n[done]", flush=True)
    ts.close()
    pg.close()

    print("\n=== SUMMARY (neon_count -> turso_inserted) ===")
    for t, (src, dst) in summary.items():
        flag = "OK" if src == dst else "MISMATCH"
        print(f"  {flag}  {t:35s}  {src:>10,} -> {dst:>10,}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
