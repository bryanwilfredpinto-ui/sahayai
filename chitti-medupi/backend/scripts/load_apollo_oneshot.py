"""
load_apollo_oneshot.py
----------------------
One-shot loader for the Apollo Pharmacy India 259k-row CSV
(columns: url, drug_name, active_ingredient, legal_manufacturer_name, dosage_form).

Standalone — only deps are psycopg2 + stdlib. Does NOT import the
backend's config / SQLAlchemy stack, so you can run it on a vanilla
Python install with just `pip install psycopg2-binary`.

Usage
-----
    set DATABASE_URL=postgresql://...     # (or $env:DATABASE_URL = "..." in PowerShell)
    python scripts/load_apollo_oneshot.py path\to\apollo_medicine_details.csv

What it does
------------
1. CREATE UNIQUE INDEX IF NOT EXISTS on
   (lower(brand_name), lower(strength), lower(dosage_form))
   so the next step can use ON CONFLICT … DO UPDATE.
2. Streams the CSV row-by-row, parses composition into (salt, strength),
   normalizes dosage_form, classifies risk via the pure-Python
   medupi_risk module if importable (fallback: default 'L').
3. Upserts in batches of 500 via psycopg2.extras.execute_values.
4. Stamps `price_source = 'apollo_dataset'` on every row so the
   freshness UI reads "Last updated X days ago".
5. Prints progress every 10k rows + final SELECT COUNT(*) summary.

Idempotent — safe to re-run on the same file.
"""
from __future__ import annotations

import csv
import os
import re
import sys
import time
from pathlib import Path


# ---- Tiny stdlib .env reader (no python-dotenv dep needed) ----
def _load_dotenv(path: Path) -> None:
    """
    Loads `KEY=VALUE` pairs from a .env file into os.environ.

    .env OVERRIDES existing env vars — opposite of typical dotenv defaults.
    Reason: this loader is run for a specific deployment target encoded in
    the .env, and stale Windows User-level env vars (left over from Supabase
    debugging rounds) were silently winning over the explicit .env value.
    For a one-shot load script, the file on disk is the source of truth.

    Values are read RAW — no shell interpolation, no URL-encoding.
    A password like `Sah@y/2026+!` survives intact, no escaping required.
    """
    if not path.exists():
        return
    with path.open("r", encoding="utf-8", errors="replace") as f:
        for raw_line in f:
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip()
            # Strip surrounding quotes if user wrapped the value
            if (len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'"):
                value = value[1:-1]
            if key:
                os.environ[key] = value


# Load .env from the backend root (parent of scripts/) at import time.
_load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# ---- Optional risk classifier (pure-Python module — no external deps) ----
HERE = Path(__file__).resolve().parent
BACKEND_ROOT = HERE.parent
sys.path.insert(0, str(BACKEND_ROOT))
try:
    from services.medupi_risk import classify as classify_risk    # type: ignore
except Exception:
    def classify_risk(_molecule: str) -> dict:
        return {"class": "L"}

import psycopg2
import psycopg2.extras


# ---- Normalisation helpers ----

DOSAGE_FORM_MAP = {
    "tab": "Tablet", "tablet": "Tablet", "tablets": "Tablet",
    "cap": "Capsule", "caps": "Capsule", "capsule": "Capsule", "capsules": "Capsule",
    "syrup": "Syrup", "suspension": "Syrup", "susp": "Syrup",
    "injection": "Injection", "inj": "Injection", "vial": "Injection",
    "syringe": "Injection",
    "inhaler": "Inhaler", "respules": "Inhaler",
    "spray": "Spray", "nasal spray": "Spray",
    "eye drops": "Drops", "ear drops": "Drops", "drops": "Drops",
    "cream": "Cream", "ointment": "Cream", "gel": "Cream",
    "lotion": "Solution", "solution": "Solution",
    "powder": "Sachet", "sachet": "Sachet", "granules": "Sachet",
    "ors": "Sachet",
    "patch": "Patch",
    "suppository": "Suppository",
    "soap": "Soap", "shampoo": "Solution", "wipes": "Solution",
}


def normalize_dosage_form(s: str | None) -> str:
    """Best-effort cleanup. Defaults to 'Tablet' (the modal form)."""
    if not s:
        return "Tablet"
    k = s.strip().lower()
    if k in DOSAGE_FORM_MAP:
        return DOSAGE_FORM_MAP[k]
    for prefix, val in DOSAGE_FORM_MAP.items():
        if k.startswith(prefix):
            return val
    return s.strip().title()[:40]


_TITLECASE_RX = re.compile(r"\b\w+\b")


def _title_each(s: str) -> str:
    """Title-case each word but preserve `+` joins. e.g. 'AMOXICILLIN+ CLAVULANIC ACID' → 'Amoxicillin+Clavulanic Acid'."""
    parts = [p.strip() for p in s.split("+") if p.strip()]
    return "+".join(p.title() for p in parts)


def parse_composition(raw: str | None) -> tuple[str | None, str | None]:
    """
    Apollo format examples:
       MOXIFLOXACIN-0.5% W/V                     → ('Moxifloxacin', '0.5%w/v')
       OMEPRAZOLE-20MG                            → ('Omeprazole', '20mg')
       DICLOFENAC+ TOLPERISONE-50+ 150MG+ MG     → ('Diclofenac+Tolperisone', '50+150mg')
       FLUTICASONE FUROATE-27.5MCG                → ('Fluticasone Furoate', '27.5mcg')
       ANASTROZOLE-1MG                            → ('Anastrozole', '1mg')

    Returns (None, None) if unparseable so the caller can skip the row.
    """
    if not raw:
        return None, None
    s = raw.strip()
    if "-" not in s:
        return _title_each(s), None
    salt_raw, strength_raw = s.rsplit("-", 1)

    # ---- Salt ----
    salt = re.sub(r"\s+", " ", salt_raw).strip()
    salt = salt.replace(" + ", "+").replace("+ ", "+").replace(" +", "+")
    salt = _title_each(salt)
    if not salt:
        return None, None

    # ---- Strength: lowercase, drop whitespace, normalise units ----
    strength = strength_raw.strip().lower()
    strength = re.sub(r"\s+", "", strength)
    # Strip stray trailing "+mg" / "+mcg" / "+g" (Apollo's known noise)
    strength = re.sub(r"(\+)(mg|mcg|g|ml|iu|%)+$", "", strength)
    if not strength:
        return salt, None
    return salt, strength[:60]   # column is VARCHAR(60)


# ---- DB ops ----

def _redact(db_url: str) -> str:
    """Strip password before logging. 'postgresql://user:pw@host/db' → 'postgresql://user:***@host/db'."""
    import re as _re
    return _re.sub(r"(postgresql://[^:/@]+:)[^@]+(@)", r"\1***\2", db_url or "")


UPSERT_SQL = """
INSERT INTO medupi.medicines
  (brand_name, salt_composition, strength, dosage_form,
   manufacturer, risk_class, prescription_required, price_source,
   created_at, updated_at)
VALUES %s
ON CONFLICT ON CONSTRAINT uniq_medicines_lower_bsf
DO UPDATE SET
  salt_composition      = EXCLUDED.salt_composition,
  manufacturer          = COALESCE(EXCLUDED.manufacturer, medupi.medicines.manufacturer),
  risk_class            = EXCLUDED.risk_class,
  prescription_required = EXCLUDED.prescription_required,
  price_source          = EXCLUDED.price_source,
  updated_at            = NOW();
"""


def ensure_schema_and_table(cur):
    """
    Idempotent bootstrap: CREATE SCHEMA + CREATE TABLE if either is missing.

    DDL mirrors models/medicine.py exactly so that, if chitti-medupi-api's
    startup hook later runs Base.metadata.create_all() against the same DB,
    SQLAlchemy sees the table already exists and skips silently. Keep this
    DDL in sync with models/medicine.py if columns are added.
    """
    cur.execute("CREATE SCHEMA IF NOT EXISTS medupi;")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS medupi.medicines (
          id                     SERIAL PRIMARY KEY,
          brand_name             VARCHAR(140) NOT NULL,
          salt_composition       VARCHAR(240) NOT NULL,
          salt_components        TEXT,
          strength               VARCHAR(60)  NOT NULL,
          dosage_form            VARCHAR(40)  NOT NULL,
          pack_size              VARCHAR(60),
          manufacturer           VARCHAR(160),
          mrp                    DOUBLE PRECISION,
          nppa_ceiling_price     DOUBLE PRECISION,
          jan_aushadhi_price     DOUBLE PRECISION,
          jan_aushadhi_code      VARCHAR(40),
          risk_class             VARCHAR(2)   NOT NULL DEFAULT 'L',
          schedule               VARCHAR(8),
          prescription_required  INTEGER      NOT NULL DEFAULT 0,
          therapeutic_class      VARCHAR(80),
          purpose_en             TEXT,
          purpose_hi             TEXT,
          price_source           VARCHAR(40),
          created_at             TIMESTAMP    NOT NULL DEFAULT NOW(),
          updated_at             TIMESTAMP    NOT NULL DEFAULT NOW()
        );
    """)
    # Indexes from the model + the strict-match composite
    cur.execute("CREATE INDEX IF NOT EXISTS ix_medicines_brand_name        ON medupi.medicines (brand_name);")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_medicines_salt_composition  ON medupi.medicines (salt_composition);")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_medicines_strength          ON medupi.medicines (strength);")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_medicines_dosage_form       ON medupi.medicines (dosage_form);")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_medicines_risk_class        ON medupi.medicines (risk_class);")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_medicines_therapeutic_class ON medupi.medicines (therapeutic_class);")
    cur.execute("""
        CREATE INDEX IF NOT EXISTS ix_medicines_strict_match
        ON medupi.medicines (salt_composition, strength, dosage_form);
    """)


def ensure_unique_index(cur):
    """
    Create the unique constraint we need for ON CONFLICT.
    Idempotent — Postgres skips if already present.
    """
    cur.execute("""
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'uniq_medicines_lower_bsf'
          ) THEN
            BEGIN
              ALTER TABLE medupi.medicines
                ADD CONSTRAINT uniq_medicines_lower_bsf
                UNIQUE (brand_name, strength, dosage_form);
            EXCEPTION WHEN duplicate_table THEN
              -- ignore
              NULL;
            END;
          END IF;
        END
        $$;
    """)


def _connect():
    """
    Connect to Postgres. Supports two .env / env-var styles:

      A) DATABASE_URL=postgresql://user:pw@host:port/db
         (use only if the password has NO special chars — @ / : ? # & % +)

      B) DB_HOST=...  DB_PORT=...  DB_USER=...  DB_PASSWORD=...  DB_NAME=...
         (raw fields — works with any password, no URL-encoding required)

    If both are set, A wins. Returns (connection, log_string_with_pw_redacted).
    """
    db_url = os.environ.get("DATABASE_URL", "").strip()
    if db_url:
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        # Skip if it's still the placeholder from .env template
        if "PASTE_PASSWORD_HERE" in db_url:
            db_url = ""

    # TCP keepalives prevent Neon/Supabase pooler from killing idle sockets
    # mid-batch. Without these the load drops after ~5 min on slow rows.
    keepalive_kwargs = dict(
        keepalives=1,
        keepalives_idle=30,
        keepalives_interval=10,
        keepalives_count=5,
        connect_timeout=30,
        application_name="chitti-medupi/load_apollo_oneshot",
    )

    if db_url:
        return psycopg2.connect(db_url, **keepalive_kwargs), _redact(db_url)

    host = os.environ.get("DB_HOST", "").strip()
    user = os.environ.get("DB_USER", "").strip()
    pw   = os.environ.get("DB_PASSWORD", "")
    if host and user and pw:
        port = int(os.environ.get("DB_PORT", "5432"))
        dbname = os.environ.get("DB_NAME", "postgres").strip() or "postgres"
        conn = psycopg2.connect(
            host=host, port=port, user=user, password=pw, dbname=dbname,
            sslmode=os.environ.get("DB_SSLMODE", "require"),
            **keepalive_kwargs,
        )
        return conn, f"postgresql://{user}:***@{host}:{port}/{dbname}"

    raise RuntimeError(
        "No DB credentials found. Either set DATABASE_URL "
        "or the DB_HOST/DB_USER/DB_PASSWORD/DB_NAME quartet "
        "(in env vars or chitti-medupi/backend/.env)."
    )


def main(csv_path: str) -> int:
    csv_p = Path(csv_path)
    if not csv_p.exists():
        print(f"ERROR: CSV not found at {csv_p}", file=sys.stderr)
        return 2

    try:
        conn, log_target = _connect()
    except Exception as e:  # noqa: BLE001
        print(f"ERROR: {e}", file=sys.stderr)
        return 2
    print(f"Connecting to {log_target}")
    conn.autocommit = False
    cur = conn.cursor()

    print("Ensuring schema + table exist (idempotent)…")
    ensure_schema_and_table(cur)
    conn.commit()
    print("Ensuring unique constraint exists…")
    ensure_unique_index(cur)
    conn.commit()

    print(f"Streaming {csv_p.name} ({csv_p.stat().st_size:,} bytes)…")
    t0 = time.time()
    total_seen = upserted = skipped = errors = reconnects = 0
    batch: list[tuple] = []
    BATCH = 200          # smaller batches → less time per statement → less likely to hit pooler timeouts

    # Mutable holders so reconnect can swap conn/cur across iterations.
    _conn = [conn]
    _cur = [cur]

    def _flush_with_retry(batch_rows: list[tuple]) -> int:
        """Try to flush; if the connection died, reconnect once and retry."""
        nonlocal reconnects
        try:
            return _flush(_cur[0], _conn[0], batch_rows)
        except (psycopg2.OperationalError, psycopg2.InterfaceError) as e:
            print(f"  ! connection dropped ({str(e).strip().splitlines()[0][:80]}) — reconnecting…")
            try:
                _conn[0].close()
            except Exception:
                pass
            new_conn, _ = _connect()
            new_conn.autocommit = False
            _conn[0] = new_conn
            _cur[0] = new_conn.cursor()
            reconnects += 1
            # Retry exactly once. If this fails too, propagate.
            return _flush(_cur[0], _conn[0], batch_rows)

    with csv_p.open("r", encoding="utf-8", errors="replace", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_seen += 1
            try:
                brand = (row.get("drug_name") or "").strip()
                comp_raw = (row.get("active_ingredient") or "").strip()
                manuf = (row.get("legal_manufacturer_name") or "").strip() or None
                dosage_form = normalize_dosage_form(row.get("dosage_form"))

                if not brand or not comp_raw:
                    skipped += 1
                    continue

                salt, strength = parse_composition(comp_raw)
                if not salt or not strength:
                    skipped += 1
                    continue

                # Risk class via the pure-Python molecule map
                key = salt.split("+")[0].lower().strip()
                risk_class = classify_risk(key).get("class", "L")
                prescription_required = 1 if risk_class == "H" else 0

                # Trim to column lengths defensively
                batch.append((
                    brand[:140],
                    salt[:240],
                    strength[:60],
                    dosage_form[:40],
                    (manuf[:160] if manuf else None),
                    risk_class[:2],
                    int(prescription_required),
                    "apollo_dataset",
                ))
            except Exception as e:  # noqa: BLE001
                errors += 1
                if errors < 5:
                    print(f"  row {total_seen} error: {e}", file=sys.stderr)
                continue

            if len(batch) >= BATCH:
                upserted += _flush_with_retry(batch)
                batch.clear()
                if upserted // 10_000 != (upserted - 1) // 10_000 and upserted > 0:
                    elapsed = time.time() - t0
                    rate = upserted / elapsed if elapsed > 0 else 0
                    print(f"  ...{upserted:,} upserted ({rate:.0f} rows/sec)")

    if batch:
        upserted += _flush_with_retry(batch)

    _cur[0].execute("SELECT COUNT(*) FROM medupi.medicines")
    total = _cur[0].fetchone()[0]
    _cur[0].close()
    _conn[0].close()

    elapsed = time.time() - t0
    print()
    print("=" * 60)
    print(f"  rows seen     : {total_seen:,}")
    print(f"  upserted      : {upserted:,}")
    print(f"  skipped       : {skipped:,} (missing brand / composition / strength)")
    print(f"  errors        : {errors:,}")
    print(f"  reconnects    : {reconnects}")
    print(f"  elapsed       : {elapsed:.1f} s")
    print(f"  DB total now  : {total:,} rows in medupi.medicines")
    print("=" * 60)
    return 0


def _flush(cur, conn, rows):
    """
    Upsert a batch. Dedupes within the batch on the unique-constraint key
    (brand_name, strength, dosage_form) — keep the LAST occurrence.

    Postgres' ON CONFLICT DO UPDATE refuses to operate on the same target
    row twice in one statement (CardinalityViolation). The Apollo CSV has
    repeats (same medicine listed under multiple URLs / SKUs), so we
    collapse them at the application layer before sending.

    Returns the number of rows actually sent to the DB after dedup.
    """
    seen: dict[tuple, tuple] = {}
    for r in rows:
        # r = (brand, salt, strength, form, manuf, risk, rx_req, price_source)
        key = (r[0].lower(), r[2].lower(), r[3].lower())
        seen[key] = r          # last write wins
    deduped = list(seen.values())
    if not deduped:
        return 0
    psycopg2.extras.execute_values(
        cur,
        """
        INSERT INTO medupi.medicines
          (brand_name, salt_composition, strength, dosage_form,
           manufacturer, risk_class, prescription_required, price_source,
           created_at, updated_at)
        VALUES %s
        ON CONFLICT ON CONSTRAINT uniq_medicines_lower_bsf
        DO UPDATE SET
          salt_composition      = EXCLUDED.salt_composition,
          manufacturer          = COALESCE(EXCLUDED.manufacturer, medupi.medicines.manufacturer),
          risk_class            = EXCLUDED.risk_class,
          prescription_required = EXCLUDED.prescription_required,
          price_source          = EXCLUDED.price_source,
          updated_at            = NOW();
        """,
        deduped,
        template="(%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())",
        page_size=500,
    )
    conn.commit()
    return len(deduped)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python load_apollo_oneshot.py <path-to-apollo_medicine_details.csv>", file=sys.stderr)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
