#!/usr/bin/env python3
"""
tools/test_medupi_samples.py — loop EVERY sample in test_samples/medupi/ (NO hardcoded
list — glob) and run it through the REAL Chitti MedUPI deterministic engine
(medupi_alternatives.find -> medupi_database.search_by_composition) on an in-memory
copy of the production seed (chitti-medupi/backend/data/medicines_seed.json).

The safety invariant checked on EVERY sample is the locked MedUPI contract
(SAHAYAI_MASTER.md §2, CHITTI_SOP.md §2): STRICT same-composition — same molecule
AND same strength AND same dosage form. ZERO cross-molecule leakage. Plus: NPPA
ceiling is a hard cap (no MRP above ceiling), and Jan Aushadhi savings are non-negative.

Output: tools/test_medupi_samples_result.json + console PASS/FAIL per sample.
Fully offline. No network, no LLM, no Railway.
"""
import json
import sys
import glob
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BACKEND = os.path.join(ROOT, "chitti-medupi", "backend")
SAMPLES = os.path.join(ROOT, "test_samples", "medupi")
sys.path.insert(0, BACKEND)

# Force local SQLite (no schema prefix) BEFORE importing config/models — the
# models derive their schema from settings.DATABASE_URL at import time, and the
# production default is Postgres ('medupi' schema), which an in-memory SQLite
# cannot resolve. This only affects which schema the table goes in; the engine
# logic under test is identical.
os.environ["DATABASE_URL"] = "sqlite://"

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base
from models.medicine import Medicine
from services import medupi_alternatives

# ---- in-memory DB seeded from the REAL production seed ----
engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
Base.metadata.create_all(engine, tables=[Medicine.__table__])
Session = sessionmaker(bind=engine)
db = Session()

seed_path = os.path.join(BACKEND, "data", "medicines_seed.json")
with open(seed_path, encoding="utf-8") as f:
    seed = json.load(f)
cols = {c.name for c in Medicine.__table__.columns}
for r in seed:
    db.add(Medicine(**{k: v for k, v in r.items() if k in cols}))
db.commit()
print(f"Seeded {len(seed)} medicines into in-memory DB ({len(cols)} columns).\n")

# ---- glob every sample (NO hardcoded list) ----
files = sorted(glob.glob(os.path.join(SAMPLES, "**", "*.json"), recursive=True))
files = [f for f in files if os.path.basename(f) != "README.md"]

results = []
for fp in files:
    rel = os.path.relpath(fp, ROOT).replace("\\", "/")
    with open(fp, encoding="utf-8") as f:
        s = json.load(f)
    q = s["query"]
    exp = s.get("expect", {})
    checks = []
    ok = True

    res = medupi_alternatives.find(
        db, q["molecule"], q["strength"], q["dosage_form"], q.get("brand", "")
    )
    alts = res.get("alternatives", [])

    # 1. at least min_alternatives returned
    need = exp.get("min_alternatives", 1)
    c1 = len(alts) >= need
    checks.append(("min_alternatives>=%d" % need, c1, "got %d" % len(alts)))
    ok &= c1

    # 2. SAFETY: every alternative shares molecule + strength + form (no leakage)
    leaks = [a for a in alts
             if (a.get("salt_composition", "").strip().lower() != q["molecule"].strip().lower()
                 or a.get("strength", "").strip().lower() != q["strength"].strip().lower()
                 or a.get("dosage_form", "").strip().lower() != q["dosage_form"].strip().lower())]
    c2 = len(leaks) == 0
    checks.append(("zero_cross_molecule_leakage", c2, "leaks=%d" % len(leaks)))
    ok &= c2

    # 3. NPPA ceiling is a hard cap — no alt's MRP exceeds its ceiling (when both present)
    over = [a for a in alts if a.get("nppa_ceiling_price") and a.get("mrp")
            and float(a["mrp"]) > float(a["nppa_ceiling_price"]) + 0.001]
    c3 = len(over) == 0
    checks.append(("nppa_ceiling_respected", c3, "over_ceiling=%d" % len(over)))
    ok &= c3

    # 4. cheapest present + savings non-negative
    cheapest = res.get("cheapest")
    c4 = cheapest is not None and (res.get("max_savings_pct", 0) or 0) >= 0
    checks.append(("cheapest_present_savings>=0", c4,
                   "cheapest=%s max_sav=%.1f%%" % (cheapest.get("brand_name") if cheapest else None,
                                                    res.get("max_savings_pct", 0) or 0)))
    ok &= c4

    # 5. savings_expected — a Jan Aushadhi / cheaper generic actually saves money
    if exp.get("savings_expected"):
        c5 = (res.get("max_savings_pct", 0) or 0) > 0
        checks.append(("real_savings_present", c5, "max_sav=%.1f%%" % (res.get("max_savings_pct", 0) or 0)))
        ok &= c5

    # 6. mandatory disclaimer present (non-negotiable medical line)
    c6 = bool(res.get("disclaimer_en")) and bool(res.get("disclaimer_hi"))
    checks.append(("disclaimer_en+hi_present", c6, ""))
    ok &= c6

    ja_price = cheapest.get("jan_aushadhi_price") if cheapest else None
    results.append({
        "sample": rel, "category": s["category"], "ok": ok,
        "alternatives": len(alts), "cheapest": cheapest.get("brand_name") if cheapest else None,
        "cheapest_ja_price": ja_price, "max_savings_pct": round(res.get("max_savings_pct", 0) or 0, 1),
        "risk_class": res.get("risk", {}).get("class"), "checks": checks,
    })
    mark = "PASS" if ok else "FAIL"
    bad = [c[0] for c in checks if not c[1]]
    print(f"[{mark}] {s['category']:20s} {s['id'] if 'id' in s else os.path.basename(rel):22s} "
          f"alts={len(alts)} cheapest={results[-1]['cheapest']} save={results[-1]['max_savings_pct']}% "
          f"risk={results[-1]['risk_class']}" + (f"  FAILED:{bad}" if bad else ""))

passed = sum(1 for r in results if r["ok"])
out = {
    "engine": "medupi_alternatives.find -> search_by_composition (real backend, in-memory seed)",
    "seed_medicines": len(seed), "total": len(results), "passed": passed, "failed": len(results) - passed,
    "results": results,
}
with open(os.path.join(HERE, "test_medupi_samples_result.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, indent=2)
print(f"\nSAMPLES_RESULT:{json.dumps({'total': len(results), 'passed': passed, 'failed': len(results) - passed})}")
sys.exit(0 if passed == len(results) else 1)
