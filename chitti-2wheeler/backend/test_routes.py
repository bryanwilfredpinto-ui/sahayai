"""
chitti-2wheeler/backend/test_routes.py
--------------------------------------
Deterministic route tests via Flask test client — NO DeepSeek, NO network.
Covers the contract that must hold regardless of LLM/DB availability:
/health, DTC lookup, breakdown decision-tree (family-cascade-never-cops),
maintenance next-due calc, profile-absent, and the honest 501 coming-soon.

Run from this dir:  python test_routes.py
"""
import os
import unittest

os.environ.setdefault("DATABASE_URL", "sqlite:///test_2w.db")  # force local SQLite, no Turso

from main import app  # noqa: E402  (imports after env is set)


class TwoWheelerRoutes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.config["TESTING"] = True
        cls.c = app.test_client()

    def test_health_200(self):
        r = self.c.get("/health")
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        self.assertTrue(j["ok"])
        self.assertEqual(j["chitti"], "chitti-2wheeler")

    def test_dtc_known_code(self):
        r = self.c.get("/api/2w/dtc/P0301")
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        self.assertEqual(j["code"], "P0301")
        self.assertIn("sev", j)
        self.assertIn("hi", j)

    def test_dtc_unknown_code_404_honest(self):
        r = self.c.get("/api/2w/dtc/ZZZZZ")
        self.assertEqual(r.status_code, 404)
        self.assertEqual(r.get_json()["error"], "not_in_local_library")

    def test_breakdown_family_cascade_never_cops(self):
        r = self.c.post("/api/2w/breakdown", json={"profile": {"brand": "Hero"}})
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        self.assertTrue(len(j["steps"]) >= 5)
        self.assertIn("rsa_number", j)
        # SAFETY CONTRACT: emergency protocol must be family cascade + explicitly never auto-dial cops.
        # (Listing 100/108/112 is correct ONLY inside the "never auto-dials" clause.)
        vp = j["vaani_protocol"]
        self.assertIn("Family cascade", vp)
        self.assertIn("never auto-dials", vp.lower())

    def test_maintenance_next_calc(self):
        # no saved profile → falls back to default schedule; must still return items
        r = self.c.get("/api/2w/maintenance/next")
        self.assertEqual(r.status_code, 200)
        items = r.get_json()["schedule"]
        self.assertTrue(any(i["item"] == "Engine oil" for i in items))
        for i in items:
            self.assertGreaterEqual(i["km_remaining"], 0)

    def test_profile_absent_404(self):
        r = self.c.get("/api/2w/profile", headers={"X-Chitti-Device": "test-no-profile-xyz"})
        self.assertEqual(r.status_code, 404)

    def test_unknown_route_honest_501(self):
        r = self.c.post("/api/2w/sound-doctor", json={})
        self.assertEqual(r.status_code, 501)
        self.assertEqual(r.get_json()["error"], "coming_soon")

    # ───────────────────── MECH-5 Doctor surface ─────────────────────
    def test_dashboard_lights_non_empty(self):
        r = self.c.get("/api/2w/dashboard/lights")
        self.assertEqual(r.status_code, 200)
        lights = r.get_json()["lights"]
        self.assertGreaterEqual(len(lights), 10)
        # every light carries a WORD label, not colour alone (a11y floor)
        for l in lights:
            self.assertIn("color_word", l)
            self.assertTrue(l["color_word"])

    def test_dashboard_check_known_redline_forces_no_ride(self):
        r = self.c.post("/api/2w/dashboard/check", json={"light_key": "low_oil"})
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        self.assertFalse(j["can_ride"])  # safety red-line
        self.assertEqual(j["severity"], "red")
        self.assertIn("confidence", j)

    def test_dashboard_check_amber_can_ride(self):
        r = self.c.post("/api/2w/dashboard/check", json={"light_key": "mil"})
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.get_json()["can_ride"])

    def test_dashboard_photo_pick_or_describe_200(self):
        r = self.c.post("/api/2w/dashboard/check", json={"image": True})
        self.assertEqual(r.status_code, 200)  # honest, never 501
        j = r.get_json()
        self.assertEqual(j["mode"], "pick_or_describe")
        self.assertTrue(len(j["lights"]) >= 10)

    def test_dashboard_unknown_light_404(self):
        r = self.c.post("/api/2w/dashboard/check", json={"light_key": "nope"})
        self.assertEqual(r.status_code, 404)

    def test_sound_catalogue_non_empty(self):
        r = self.c.get("/api/2w/sound/catalogue")
        self.assertEqual(r.status_code, 200)
        self.assertGreaterEqual(len(r.get_json()["sounds"]), 8)

    def test_sound_check_known(self):
        r = self.c.post("/api/2w/sound/check", json={"sound_key": "chain_rattle"})
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        self.assertTrue(2 <= len(j["candidates"]) <= 4)
        self.assertAlmostEqual(sum(c["pct"] for c in j["candidates"]), 100, delta=2)
        self.assertIn("confidence", j)

    def test_sound_audio_pick_or_describe_200(self):
        r = self.c.post("/api/2w/sound/check", json={"audio": True})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.get_json()["mode"], "pick_or_describe")

    def test_sound_unknown_404(self):
        r = self.c.post("/api/2w/sound/check", json={"sound_key": "zzz"})
        self.assertEqual(r.status_code, 404)

    def test_obd_decodes_p0301(self):
        r = self.c.post("/api/2w/obd/snapshot", json={"codes": ["P0301"], "live": {"volts": 12.6}})
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        self.assertTrue(any(d["code"] == "P0301" for d in j["decoded"]))
        self.assertIn("confidence", j)

    def test_obd_overheat_forces_no_ride(self):
        r = self.c.post("/api/2w/obd/snapshot", json={"codes": [], "live": {"coolant_c": 118}})
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        self.assertFalse(j["can_ride"])
        self.assertEqual(j["overall_severity"], "high")
        self.assertTrue(any(f["param"] == "coolant_c" for f in j["live_flags"]))

    def test_obd_unknown_code_flagged(self):
        r = self.c.post("/api/2w/obd/snapshot", json={"codes": ["P9999"]})
        self.assertEqual(r.status_code, 200)
        self.assertTrue(any(d.get("sev") == "?" for d in r.get_json()["decoded"]))

    def test_inspect_checklist_about_100(self):
        r = self.c.get("/api/2w/inspect/checklist")
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        self.assertGreaterEqual(j["total_points"], 90)
        counted = sum(len(c["points"]) for c in j["categories"])
        self.assertEqual(counted, j["total_points"])

    def test_inspect_score_critical_brake_fail_avoids(self):
        r = self.c.post("/api/2w/inspect/score", json={"answers": {
            "brk_front_feel": "fail", "brk_rear_feel": "fail",
            "eng_cold_start": "pass", "trn_gears": "pass",
        }})
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        self.assertEqual(j["verdict"], "avoid")
        self.assertTrue(len(j["critical_fails"]) >= 1)
        self.assertIn("brk_front_feel", [c["id"] for c in j["critical_fails"]])

    def test_inspect_score_all_pass_buys(self):
        # answer every point pass → verdict buy
        cl = self.c.get("/api/2w/inspect/checklist").get_json()
        answers = {p["id"]: "pass" for c in cl["categories"] for p in c["points"]}
        r = self.c.post("/api/2w/inspect/score", json={"answers": answers})
        j = r.get_json()
        self.assertEqual(j["verdict"], "buy")
        self.assertEqual(j["score_pct"], 100)

    def test_passport_roundtrip_and_trust_score(self):
        dev = {"X-Chitti-Device": "test-passport-roundtrip"}
        post = self.c.post("/api/2w/passport/event", headers=dev,
                           json={"kind": "service", "title": "Engine oil change", "cost": 600, "odo": 12000})
        self.assertEqual(post.status_code, 200)
        self.assertTrue(post.get_json()["ok"])
        get = self.c.get("/api/2w/passport", headers=dev)
        self.assertEqual(get.status_code, 200)
        j = get.get_json()
        self.assertTrue(any(e["title"] == "Engine oil change" for e in j["events"]))
        self.assertTrue(0 <= j["trust_score"] <= 100)
        ts = self.c.get("/api/2w/passport/trust-score", headers=dev).get_json()
        self.assertTrue(0 <= ts["trust_score"] <= 100)
        self.assertIn(ts["trust_band"], ("green", "amber", "red"))

    def test_passport_empty_honest(self):
        r = self.c.get("/api/2w/passport", headers={"X-Chitti-Device": "test-passport-empty-xyz"})
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        self.assertEqual(j["events"], [])
        self.assertEqual(j["trust_score"], 0)
        self.assertEqual(j["trust_band"], "red")


if __name__ == "__main__":
    unittest.main(verbosity=2)
