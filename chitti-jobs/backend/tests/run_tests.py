"""
tests/run_tests.py
------------------
BO1-BO10 local verification. Unit tests for the pure skills (classifier,
scoring, ATS, email/ics) + an end-to-end Flask test-client run of the
approval flow. DeepSeek key is intentionally absent so BO7 exercises the
deterministic fallback (feature stays LIVE without a key).

Run:  .venv/Scripts/python.exe tests/run_tests.py
"""
from __future__ import annotations

import os
import sys
import tempfile

# backend dir on path + sqlite env BEFORE importing app modules
HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.dirname(HERE)
sys.path.insert(0, BACKEND)

_db = os.path.join(tempfile.gettempdir(), "chitti_jobs_test.db")
if os.path.exists(_db):
    os.remove(_db)
os.environ["DATABASE_URL"] = f"sqlite:///{_db}"
os.environ["SCHEDULER_ENABLED"] = "false"
os.environ["DEEPSEEK_API_KEY"] = ""

PASS = 0
FAIL = 0


def check(name, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  PASS  {name}")
    else:
        FAIL += 1
        print(f"  FAIL  {name}  {detail}")


print("\n== BO3 level_classifier ==")
from services import level_classifier as lc  # noqa: E402
check("0.5y → fresher", lc.classify(0.5) == "fresher")
check("2y → junior", lc.classify(2) == "junior")
check("8y → mid", lc.classify(8) == "mid")
check("15y → senior", lc.classify(15) == "senior")
check("25y → cxo", lc.classify(25) == "cxo")
check("situation fresher overrides", lc.classify(9, career_situation="fresher") == "fresher")
check("CXO title @16y → cxo", lc.classify(16, "Chief Technology Officer") == "cxo")
check("None years → fresher", lc.classify(None) == "fresher")

print("\n== BO6 ats_engine ==")
from services import ats_engine  # noqa: E402
ats = ats_engine.score("Experienced in Python and SQL and pandas.",
                        "Required: Python, SQL, AWS, Docker. Build data pipelines.")
check("ats match between 0 and 100", 0 < ats["match_pct"] <= 100, ats["match_pct"])
check("aws flagged missing", "aws" in ats["missing"])
check("python matched", "python" in ats["matched"])
check("empty jd → 0%", ats_engine.score("x", "")["match_pct"] == 0.0)

print("\n== BO5 scoring_engine ==")
from datetime import datetime  # noqa: E402
from services import scoring_engine  # noqa: E402
prof = {"target_roles": ["Data Analyst"], "target_locations": ["Bangalore"],
        "target_industries": ["fintech"], "user_level": "mid"}
job = {"title": "Data Analyst", "company": "Acme Fintech", "location": "Bangalore",
       "jd_text": "fintech data analyst role", "posted_at": datetime.utcnow()}
v = scoring_engine.score_job(prof, job)
check("strong match score >= 7", v["score"] >= 7, v["score"])
check("score clamped 1..10", 1 <= v["score"] <= 10)
weak = scoring_engine.score_job(prof, {"title": "Plumber", "company": "X", "location": "Pune",
                                       "jd_text": "", "posted_at": None})
check("weak match not surfaced", weak["surfaced"] is False, weak["score"])
black = scoring_engine.score_job({"target_roles": ["Data Analyst"], "blacklist_companies": ["Evil Corp"]},
                                 {"title": "Data Analyst", "company": "Evil Corp", "location": "", "jd_text": ""})
check("blacklist applies -2", any(d["factor"] == "blacklisted_company" for d in black["breakdown"]))

print("\n== BO8 email_compose ==")
from services import email_compose as ec  # noqa: E402
ml = ec.build_mailto("hr@acme.com", "Application for Data Analyst", "Hello,\nPlease find...")
check("mailto scheme", ml.startswith("mailto:hr@acme.com?subject="))
check("mailto body encoded", "%0A" in ml or "%0D%0A" in ml or "body=" in ml)
ics = ec.build_ics(summary="Interview with Acme", start=datetime(2026, 7, 1, 10, 0))
check("ics has VCALENDAR", "BEGIN:VCALENDAR" in ics and "BEGIN:VEVENT" in ics)
check("ics has alarm", "BEGIN:VALARM" in ics)

print("\n== BO1/BO2/BO4/BO9/BO10 integration (Flask test client) ==")
import main  # noqa: E402  (boots schema on sqlite)
client = main.app.test_client()
H = {"X-User-Token": "test-uid-001"}

# health
r = client.get("/api/jobs/health")
check("health 200", r.status_code == 200 and r.get_json()["ok"])
check("health reports deepseek not configured", r.get_json()["deepseek_configured"] is False)

# missing token guard
check("profile without token → 400", client.get("/api/jobs/profile").status_code == 400)

# BO2 + BO3 save profile
r = client.post("/api/jobs/profile", headers=H, json={
    "name": "Asha", "experience_years": 8, "current_role": "Data Analyst",
    "target_roles": ["Data Analyst", "Senior Data Analyst"],
    "target_locations": ["Bangalore", "Remote"], "target_industries": ["fintech"],
    "resume_text": "8 years building dashboards with Python, SQL, pandas, Tableau at a fintech.",
    "career_situation": "actively_hunting", "consent": True,
})
j = r.get_json()
check("profile saved 200", r.status_code == 200 and j["ok"])
check("BO3 level mid", j["user_level"] == "mid", j.get("user_level"))
check("knows_user true", j["knows_user"] is True)

# MEMORY FIRST: source before profile would 409 for a different uid
r2 = client.post("/api/jobs/source", headers={"X-User-Token": "no-profile-uid"})
check("source w/o profile → 409", r2.status_code == 409)

# BO4 manual paste + BO5/BO6 scoring
jd = ("Data Analyst, Bangalore. Required: Python, SQL, Tableau, pandas. "
      "Build dashboards for a fintech product. fintech analytics.")
r = client.post("/api/jobs/manual", headers=H, json={
    "jd_text": jd, "title": "Data Analyst", "company": "Acme Fintech",
    "location": "Bangalore", "url": "https://example.com/job/1"})
j = r.get_json()
check("manual ingest 200", r.status_code == 200 and j["ok"])
check("manual job scored", j["job"] is not None and j["job"]["score"] >= 1, j.get("job"))
scored_id = j["job"]["scored_id"]
check("manual job has ats", j["job"]["ats_match_pct"] is not None)

# BO9 digest
r = client.get("/api/jobs/digest?min_score=1", headers=H)
check("digest 200", r.status_code == 200)
check("digest returns the job", any(x["scored_id"] == scored_id for x in r.get_json()["jobs"]))

# BO9 apply — ATS gate (resume lacks some keywords → likely <70 → gated)
r = client.post(f"/api/jobs/scored/{scored_id}/apply", headers=H, json={})
j = r.get_json()
check("apply responds 200", r.status_code == 200)
if j.get("gated"):
    check("ATS gate fires <70% (§24)", j["reason"] == "ats_below_70")
    # override → real draft
    r = client.post(f"/api/jobs/scored/{scored_id}/apply", headers=H, json={"override": True})
    j = r.get_json()
check("apply draft created", j.get("application_id") is not None, j)
check("BO7 deterministic draft", j.get("draft_source") == "deterministic_fallback", j.get("draft_source"))
check("BO8 mailto present", j["email"]["mailto"].startswith("mailto:"))
app_id = j["application_id"]

# Art 5: user confirms THEY sent it
r = client.post(f"/api/jobs/applications/{app_id}/sent", headers=H)
check("mark sent → applied", r.status_code == 200 and r.get_json()["status"] == "applied")

# BO10 CRM pipeline + status transition
r = client.get("/api/jobs/pipeline", headers=H)
j = r.get_json()
check("pipeline has 1 applied", j["counts"].get("applied", 0) >= 1, j["counts"])
r = client.post(f"/api/jobs/applications/{app_id}/status", headers=H, json={"status": "interview"})
check("status → interview", r.status_code == 200 and r.get_json()["status"] == "interview")
r = client.post(f"/api/jobs/applications/{app_id}/status", headers=H, json={"status": "nonsense"})
check("invalid status rejected", r.status_code == 400)

print(f"\n=== RESULT: {PASS} passed, {FAIL} failed ===")
sys.exit(1 if FAIL else 0)
