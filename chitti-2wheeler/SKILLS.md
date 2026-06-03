🎖️ World Class Chitti Bike Doctor — Skills

> CTO-standard skills index. The user-facing capability surface (parsed live by
> `chitti_features.js`) is [skills/FEATURES.md](skills/FEATURES.md); the depth
> corpus that grounds every DeepSeek answer is
> [skills/MECHANIC_KNOWLEDGE.md](skills/MECHANIC_KNOWLEDGE.md).

## The 4 Users I Serve

| User | How Chitti Bike Doctor serves them |
|------|-------------------------------------|
| 👁️ Blind | "Chitti, mera dashboard padho" reads every warning light aloud; diagnose engine by sound; full spoken verdict |
| 🦻 Deaf | Visual severity cards + text + ISL panel; Sound Doctor shows a waveform — never audio-only |
| 🤫 Mute | Photograph the leak / dashboard / mechanic's bill — full diagnosis by tap + photo |
| 📖 Illiterate | Voice-everything in the chosen language; picture-icon fault menu; 2G-ready |

## Features

| # | Feature | Status | Tested By | Date |
|---|---------|--------|-----------|------|
| 1 | Symptom Doctor (8-agent swarm diagnosis) `POST /api/2w/ask` | ✅ LIVE | CTO | 2026-06-03 |
| 2 | Bike profile / vehicle memory `POST·GET /api/2w/profile` | ✅ LIVE | CTO | 2026-06-03 |
| 3 | Breakdown coach + family-cascade SOS `POST /api/2w/breakdown` | ✅ LIVE | CTO | 2026-06-03 |
| 4 | Preventive maintenance — odometer schedule `GET /api/2w/maintenance/next` | ✅ LIVE | CTO | 2026-06-03 |
| 5 | DTC plain-Hinglish decoder (~12 codes) `GET /api/2w/dtc/<code>` | ✅ LIVE | CTO | 2026-06-03 |
| 6 | Six-field diagnosis (Why/Severity/Can-drive/DIY/Cost/Alternatives) | ✅ LIVE | CTO | 2026-06-03 |
| 7 | Never-claim-certainty confidence bands + weighted vote | ✅ LIVE | CTO | 2026-06-03 |
| 8 | DIY-safety classification (Allowed/Assisted/Professional/Emergency) | ✅ LIVE | CTO | 2026-06-03 |
| 9 | Per-response widget — 🔊 / 🤖 / 👍 / 👎 / ✏️🎙️ | ✅ LIVE | CTO | 2026-06-03 |
| 10 | Golden-Rule confirm gate on every side-effecting action | ✅ LIVE | CTO | 2026-06-03 |
| 11 | 26-language Voice Factory cascade + ISL panel | ✅ LIVE | CTO | 2026-06-03 |
| 12 | Dashboard Doctor (photo → warning-light read) | 🟡 COMING SOON | — | — |
| 13 | Sound Doctor (10s clip → ranked faults) `POST /api/2w/listen` | 🟡 COMING SOON | — | — |
| 14 | DIY Coach (video + voice walk-through) | 🟡 COMING SOON | — | — |
| 15 | Scam Shield (quote → fair band verdict) `POST /api/2w/quote/check` | 🟡 COMING SOON | — | — |
| 16 | Vehicle Twin (part-age failure prediction) | 🟡 COMING SOON | — | — |
| 17 | Parts Life Predictor | 🟡 COMING SOON | — | — |
| 18 | Used Vehicle Inspector (100-point) | 🟡 COMING SOON | — | — |
| 19 | Vehicle Health Passport (portable resale record) | 🟡 COMING SOON | — | — |
| 20 | Document vault — RC/insurance/PUC/DL auto-expiry | 🟡 COMING SOON | — | — |
| 21 | Weather-aware preventive maintenance | 🟡 COMING SOON | — | — |
| 22 | Full ~600-code DTC library | 🟡 COMING SOON | — | — |
| 23 | OBD2 / ELM327 Mode 2 (Web-Bluetooth) `POST /api/2w/obd/snapshot` | 🔵 FUTURE | — | — |
| 24 | DeepSeek → Claude → Gemini Layer-5 fallback | 🔵 FUTURE | — | — |

Status is sourced from [skills/FEATURES.md](skills/FEATURES.md) + the real routes
in [backend/routes/wheels.py](backend/routes/wheels.py). LIVE = real route;
COMING SOON = honest 501 stub; FUTURE = needs a partnership / hardware / wiring.

## Skill definitions (reasoning libraries)

- [skills/FEATURES.md](skills/FEATURES.md) — capability surface (Feature Discovery contract)
- [skills/MECHANIC_KNOWLEDGE.md](skills/MECHANIC_KNOWLEDGE.md) — maintenance schedule · OBD2 sensor map · DTC library · RSA numbers · fair-price bands
- [swarm/](swarm/) — the 8 voting agents (Symptom · Engine · Electrical · Fuel · Safety · DIY · Cost · Trust)

## Indian User Support

- Delivery rider (Activa/Jupiter, bike = livelihood) · college student · single-bike
  family (Splendor) · elderly scooter owner · woman rider (safety-first) ·
  used-bike buyer.
- Bikes: Hero · Honda · Bajaj · TVS · Royal Enfield · Yamaha · Suzuki · KTM +
  EV (Ola S1 · Ather · iQube · Chetak). Rupee bands, Hinglish, state-aware PUC.

## Language Support

26 languages via Chitti Voice Factory cascade (Bhashini temporary, community
voices replace it; provider swappable at one URL). One pure language per response.

## Mandatory 5-element widget on every response box

🔊 Speaker · 🤖 Chitti icon · 👍👎 Thumbs · ✏️🎙️ Pencil+Mic · 🌐 Language selector —
plus ISL panel per response. Verified on `chitti_2wheeler.html`.

## Commando standard

- 375px mobile-first · 2G compatible · works for blind/deaf/mute/illiterate · ISL on every page.
- NEVER books service · NEVER dispatches mechanics · NEVER certifies roadworthy.
- NEVER coaches a 🟠/🔴 (brake/fuel/steering) DIY job — routes to a human, armed with the fair price.
- NEVER claims certainty — confidence bands + weighted vote always.
- NEVER auto-dials 100/108/112 — family cascade only.
- Photos/audio processed on-device; only text descriptions reach the model.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
