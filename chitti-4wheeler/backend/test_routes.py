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

    # ── MECH-5 Car Doctor — Dashboard ──────────────────────────────────
    def test_dashboard_lights_list(self):
        r = self.c.get("/api/4w/dashboard/lights")
        self.assertEqual(r.status_code, 200)
        lights = r.get_json()["lights"]
        self.assertGreaterEqual(len(lights), 12)
        for l in lights:
            for k in ("key", "icon", "name_en", "name_hi", "color", "severity", "can_drive"):
                self.assertIn(k, l)

    def test_dashboard_check_critical_forces_no_drive(self):
        r = self.c.post("/api/4w/dashboard/check", json={"light_key": "oil_pressure"})
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        self.assertEqual(j["severity"], "critical")
        self.assertFalse(j["can_drive"])  # red-line system → do-not-drive
        self.assertIn(j["confidence"], ("high", "medium", "low"))

    def test_dashboard_check_unknown_404(self):
        r = self.c.post("/api/4w/dashboard/check", json={"light_key": "nope"})
        self.assertEqual(r.status_code, 404)

    def test_dashboard_photo_pick_or_describe_200(self):
        r = self.c.post("/api/4w/dashboard/check", json={"image": True})
        self.assertEqual(r.status_code, 200)  # never 501, never fabricated
        j = r.get_json()
        self.assertEqual(j["mode"], "pick_or_describe")
        self.assertTrue(len(j["lights"]) >= 12)

    # ── MECH-5 Car Doctor — Sound ──────────────────────────────────────
    def test_sound_catalogue(self):
        r = self.c.get("/api/4w/sound/catalogue")
        self.assertEqual(r.status_code, 200)
        self.assertGreaterEqual(len(r.get_json()["sounds"]), 8)

    def test_sound_check_ranked(self):
        r = self.c.post("/api/4w/sound/check", json={"sound_key": "brake_grind"})
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        self.assertTrue(2 <= len(j["candidates"]) <= 4)
        self.assertAlmostEqual(sum(c["pct"] for c in j["candidates"]), 100, delta=2)
        self.assertFalse(j["can_drive"])  # brakes are a red line

    def test_sound_audio_pick_or_describe_200(self):
        r = self.c.post("/api/4w/sound/check", json={"audio": True})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.get_json()["mode"], "pick_or_describe")

    def test_sound_unknown_404(self):
        r = self.c.post("/api/4w/sound/check", json={"sound_key": "zzz"})
        self.assertEqual(r.status_code, 404)

    # ── MECH-5 Car Doctor — OBD2 ───────────────────────────────────────
    def test_obd_decodes_p0301(self):
        r = self.c.post("/api/4w/obd/snapshot", json={"codes": ["P0301"]})
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        codes = [d["code"] for d in j["decoded"]]
        self.assertIn("P0301", codes)

    def test_obd_overheat_forces_no_drive(self):
        r = self.c.post("/api/4w/obd/snapshot", json={"codes": [], "live": {"coolant_c": 117}})
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        self.assertFalse(j["can_drive"])  # coolant > 110 → do-not-drive
        self.assertTrue(any(f["param"] == "coolant_c" for f in j["live_flags"]))

    def test_obd_unknown_code_honest(self):
        r = self.c.post("/api/4w/obd/snapshot", json={"codes": ["P9999"]})
        self.assertEqual(r.status_code, 200)
        d = r.get_json()["decoded"][0]
        self.assertEqual(d["sev"], "?")

    # ── MECH-5 Car Doctor — Inspector ──────────────────────────────────
    def test_inspect_checklist_about_100(self):
        r = self.c.get("/api/4w/inspect/checklist")
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        self.assertGreaterEqual(j["total_points"], 90)
        self.assertLessEqual(j["total_points"], 110)

    def test_inspect_score_critical_brake_fail(self):
        r = self.c.post("/api/4w/inspect/score", json={"answers": {
            "eng_cold_start": "pass", "eng_idle_smooth": "pass",
            "br_pedal_firm": "fail",  # critical brake fail
            "br_no_pull": "pass", "ty_tread_even": "pass",
            "td_brake_test": "pass", "doc_rc_match": "pass",
        }})
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        self.assertIn(j["verdict"], ("avoid", "caution"))
        self.assertTrue(any(c["id"] == "br_pedal_firm" for c in j["critical_fails"]))

    # ── MECH-5 Car Doctor — Passport ───────────────────────────────────
    def test_passport_event_roundtrip_and_trust(self):
        hdr = {"X-Chitti-Device": "test-passport-device"}
        r = self.c.post("/api/4w/passport/event", headers=hdr,
                        json={"kind": "service", "title": "10k service", "cost": 4500, "odo": 10000})
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.get_json()["ok"])

        r2 = self.c.get("/api/4w/passport", headers=hdr)
        self.assertEqual(r2.status_code, 200)
        j2 = r2.get_json()
        self.assertGreaterEqual(len(j2["events"]), 1)
        self.assertTrue(0 <= j2["trust_score"] <= 100)
        self.assertIn(j2["trust_band"], ("green", "amber", "red"))

        r3 = self.c.get("/api/4w/passport/trust-score", headers=hdr)
        self.assertEqual(r3.status_code, 200)
        self.assertTrue(0 <= r3.get_json()["trust_score"] <= 100)

    def test_passport_empty_state_honest(self):
        r = self.c.get("/api/4w/passport", headers={"X-Chitti-Device": "test-empty-passport-xyz"})
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        self.assertEqual(j["events"], [])
        self.assertEqual(j["trust_score"], 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
