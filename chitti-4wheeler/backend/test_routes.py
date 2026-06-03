"""
chitti-4wheeler/backend/test_routes.py
--------------------------------------
Deterministic route tests via Flask test client — NO DeepSeek, NO network.
Covers the contract that must hold regardless of LLM/DB availability:
/health, DTC lookup, breakdown decision-tree (family-cascade-never-cops),
maintenance next-due calc, profile-absent, and the honest 501 coming-soon.

Run from this dir:  python test_routes.py
"""
import os
import unittest

os.environ.setdefault("DATABASE_URL", "sqlite:///test_4w.db")  # force local SQLite, no Turso

from main import app  # noqa: E402


class FourWheelerRoutes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.config["TESTING"] = True
        cls.c = app.test_client()

    def test_health_200(self):
        r = self.c.get("/health")
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        self.assertTrue(j["ok"])
        self.assertEqual(j["chitti"], "chitti-4wheeler")

    def test_dtc_known_code(self):
        r = self.c.get("/api/4w/dtc/P0301")
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        self.assertEqual(j["code"], "P0301")
        self.assertIn("sev", j)
        self.assertIn("hi", j)

    def test_dtc_unknown_code_404_honest(self):
        r = self.c.get("/api/4w/dtc/ZZZZZ")
        self.assertEqual(r.status_code, 404)
        self.assertEqual(r.get_json()["error"], "not_in_local_library")

    def test_breakdown_family_cascade_never_cops(self):
        r = self.c.post("/api/4w/breakdown", json={"profile": {"brand": "Maruti Suzuki"}})
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        self.assertTrue(len(j["steps"]) >= 5)
        # SAFETY CONTRACT: emergency protocol must be family cascade + explicitly never auto-dial cops.
        vp = j["vaani_protocol"]
        self.assertIn("Family cascade", vp)
        self.assertIn("never auto-dials", vp.lower())

    def test_maintenance_next_calc(self):
        r = self.c.get("/api/4w/maintenance/next")
        self.assertEqual(r.status_code, 200)
        items = r.get_json()["schedule"]
        self.assertTrue(len(items) >= 1)
        for i in items:
            self.assertGreaterEqual(i["km_remaining"], 0)

    def test_profile_absent_404(self):
        r = self.c.get("/api/4w/profile", headers={"X-Chitti-Device": "test-no-profile-xyz"})
        self.assertEqual(r.status_code, 404)

    def test_unknown_route_honest_501(self):
        r = self.c.post("/api/4w/used-car-inspector", json={})
        self.assertEqual(r.status_code, 501)
        self.assertEqual(r.get_json()["error"], "coming_soon")


if __name__ == "__main__":
    unittest.main(verbosity=2)
