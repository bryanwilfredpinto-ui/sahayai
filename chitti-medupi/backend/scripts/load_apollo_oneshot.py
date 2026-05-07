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


def ensure_unique_index(cur):
    """
    Create the case-insensitive unique constraint we need for ON CONFLICT.
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


def main(csv_path: str) -> int:
    db_url = os.environ.get("DATABASE_URL", "").strip()
    if not db_url:
        print("ERROR: DATABASE_URL not set in environment.", file=sys.stderr)
        print(
            "Set it once with (PowerShell):\n"
            "  $env:DATABASE_URL = 'postgresql://postgres.xxxx:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres'",
            file=sys.stderr,
        )
        return 2

    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    csv_p = Path(csv_path)
    if not csv_p.exists():
        print(f"ERROR: CSV not found at {csv_p}", file=sys.stderr)
        return 2

    # Redact password before any logging so it never appears in transcripts.
    print(f"Connecting to {_redact(db_url)}")
    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    cur = conn.cursor()

    print("Ensuring unique constraint exists…")
    ensure_unique_index(cur)
    conn.commit()

    print(f"Streaming {csv_p.name} ({csv_p.stat().st_size:,} bytes)…")
    t0 = time.time()
    total_seen = upserted = skipped = errors = 0
    batch: list[tuple] = []
    BATCH = 500

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
                _flush(cur, conn, batch)
                upserted += len(batch)
                batch.clear()
                if upserted % 10_000 == 0:
                    elapsed = time.time() - t0
                    rate = upserted / elapsed if elapsed > 0 else 0
                    print(f"  …{upserted:,} upserted ({rate:.0f} rows/sec)")

    if batch:
        _flush(cur, conn, batch)
        upserted += len(batch)

    cur.execute("SELECT COUNT(*) FROM medupi.medicines")
    total = cur.fetchone()[0]
    cur.close()
    conn.close()

    elapsed = time.time() - t0
    print()
    print("=" * 60)
    print(f"  rows seen     : {total_seen:,}")
    print(f"  upserted      : {upserted:,}")
    print(f"  skipped       : {skipped:,} (missing brand / composition / strength)")
    print(f"  errors        : {errors:,}")
    print(f"  elapsed       : {elapsed:.1f} s")
    print(f"  DB total now  : {total:,} rows in medupi.medicines")
    print("=" * 60)
    return 0


def _flush(cur, conn, rows):
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
        rows,
        template="(%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())",
        page_size=500,
    )
    conn.commit()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python load_apollo_oneshot.py <path-to-apollo_medicine_details.csv>", file=sys.stderr)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
