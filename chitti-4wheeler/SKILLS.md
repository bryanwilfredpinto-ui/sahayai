🎖️ World Class Chitti Car Doctor — Skills

> CTO-standard skills index. The user-facing capability surface (parsed live by
> `chitti_features.js`) is [skills/FEATURES.md](skills/FEATURES.md); the depth
> corpus that grounds every DeepSeek answer is
> [skills/MECHANIC_KNOWLEDGE.md](skills/MECHANIC_KNOWLEDGE.md).

## The 4 Users I Serve

| User | How Chitti Car Doctor serves them |
|------|-------------------------------------|
| 👁️ Blind | "Chitti, mera dashboard padho" reads every warning light aloud; diagnose engine by sound; full spoken verdict |
| 🦻 Deaf | Visual severity cards + text + ISL panel; Sound Doctor shows a waveform — never audio-only |
| 🤫 Mute | Photograph the leak / dashboard / service bill — full diagnosis by tap + photo |
| 📖 Illiterate | Voice-everything in the chosen language; picture-icon fault menu; 2G-ready |

## Features

| # | Feature | Status | Tested By | Date |
|---|---------|--------|-----------|------|
| 1 | Symptom Doctor (8-agent swarm diagnosis) `POST /api/4w/ask` | ✅ LIVE | CTO | 2026-06-03 |
| 2 | Car profile / vehicle memory (brand/model/year/**fuel**/tx/odo/reg) `POST·GET /api/4w/profile` | ✅ LIVE | CTO | 2026-06-03 |
| 3 | Breakdown coach + family-cascade SOS `POST /api/4w/breakdown` | ✅ LIVE | CTO | 2026-06-03 |
| 4 | Preventive maintenance — brand odometer schedule `GET /api/4w/maintenance/next` | ✅ LIVE | CTO | 2026-06-03 |
| 5 | DTC plain-Hinglish decoder (~16 generic P-codes) `GET /api/4w/dtc/<code>` | ✅ LIVE | CTO | 2026-06-03 |
| 6 | Six-field diagnosis (Why/Severity/Can-drive/DIY/Cost/Alternatives) | ✅ LIVE | CTO | 2026-06-03 |
| 7 | Never-claim-certainty confidence bands + weighted vote | ✅ LIVE | CTO | 2026-06-03 |
| 8 | DIY-safety classification (Allowed/Assisted/Professional/Emergency; brake/fuel/airbag/HV-EV force-🔴) | ✅ LIVE | CTO | 2026-06-03 |
| 9 | Per-response widget — 🔊 / 🤖 / 👍 / 👎 / ✏️🎙️ | ✅ LIVE | CTO | 2026-06-03 |
| 10 | Golden-Rule confirm gate on every side-effecting action | ✅ LIVE | CTO | 2026-06-03 |
| 11 | 26-language Voice Factory cascade + ISL panel | ✅ LIVE | CTO | 2026-06-03 |
| 12 | Dashboard Doctor (photo → warning-light read: MIL/ABS/coolant/oil/airbag/DPF/EV) | 🟡 COMING SOON | — | — |
| 13 | Sound Doctor (10s clip → ranked faults) `POST /api/4w/listen` | 🟡 COMING SOON | — | — |
| 14 | DIY Coach (video + voice walk-through, safe jobs only) | 🟡 COMING SOON | — | — |
| 15 | Scam Shield (quote → fair band verdict; AC compressor ₹35k vs ₹18-24k) `POST /api/4w/quote/check` | 🟡 COMING SOON | — | — |
| 16 | Vehicle Twin (part-age failure prediction) | 🟡 COMING SOON | — | — |
| 17 | Parts Life Predictor (tyre/battery/brake/coolant/DPF/EV-SoH) | 🟡 COMING SOON | — | — |
| 18 | Used Vehicle Inspector (100-point + OBD2 scan) **[HUGE for cars]** | 🟡 COMING SOON | — | — |
| 19 | Vehicle Health Passport (portable resale record) **[HUGE for cars]** | 🟡 COMING SOON | — | — |
| 20 | Document vault — RC/insurance/PUC/DL/road-tax/FASTag auto-expiry | 🟡 COMING SOON | — | — |
| 21 | Weather-aware + diesel-DPF / EV preventive maintenance | 🟡 COMING SOON | — | — |
| 22 | Full ~2 000-code DTC library (`dtc_codes_4w.json`) | 🟡 COMING SOON | — | — |
| 23 | Family / Fleet view (shared `family_fleet` with 2-wheeler) | 🟡 COMING SOON | — | — |
| 24 | OBD2 / ELM327 Mode 2 live PIDs + freeze-frame (Web-Bluetooth) `POST /api/4w/obd/snapshot` | 🔵 FUTURE | — | — |
| 25 | DeepSeek → Claude → Gemini Layer-5 fallback | 🔵 FUTURE | — | — |

Status is sourced from [skills/FEATURES.md](skills/FEATURES.md) + the real routes
in [backend/routes/wheels.py](backend/routes/wheels.py) (prefix `/api/4w/`). LIVE =
real route; COMING SOON = honest 501 stub; FUTURE = needs a partnership / hardware / wiring.

## Skill definitions (reasoning libraries)

- [skills/FEATURES.md](skills/FEATURES.md) — capability surface (Feature Discovery contract)
- [skills/MECHANIC_KNOWLEDGE.md](skills/MECHANIC_KNOWLEDGE.md) — maintenance schedule · OBD2 sensor map · DTC P-code library · RSA numbers · fair-price bands (₹ car ranges)
- [swarm/](swarm/) — the 8 voting agents (Symptom · Engine · Electrical · Fuel · Safety · DIY · Cost · Trust)

## Mode 2 — OBD2 first-class for cars

Unlike bikes, **every car since 2010 has a standard OBD-II port**. A ₹400-700
ELM327 Bluetooth/CAN reader gives: standard DTC P-code decode (portable across
Swift/Creta/Nexon), live coolant/RPM/fuel-trim/voltage, and the freeze-frame the
ECU captured at fault-time. This is the car's killer feature, in Hinglish, voice-first.

## Indian User Support

- Family-car owner Tier-2/3 (Swift/Creta) · taxi/Ola-Uber driver (car = livelihood)
  · small-business fleet manager · used-car buyer (100-point) · elderly driver ·
  woman night-driver.
- Cars: Maruti · Hyundai · Tata · Mahindra · Honda · Toyota · Kia · MG · Skoda · VW
  + Tata EVs (Nexon EV / Tiago EV / Punch EV) + hybrids. Fuel: Petrol/Diesel/EV/Hybrid.
  Rupee bands (car-scale), Hinglish, state-aware PUC.

## Language Support

26 languages via Chitti Voice Factory cascade (Bhashini temporary, community
voices replace it; provider swappable at one URL). One pure language per response.

## Mandatory 5-element widget on every response box

🔊 Speaker · 🤖 Chitti icon · 👍👎 Thumbs · ✏️🎙️ Pencil+Mic · 🌐 Language selector —
plus ISL panel per response. Verified on `chitti_4wheeler.html`.

## Commando standard

- 375px mobile-first · 2G compatible · works for blind/deaf/mute/illiterate · ISL on every page.
- NEVER books service · NEVER dispatches mechanics · NEVER certifies roadworthy.
- NEVER coaches a 🟠/🔴 (brake/fuel/airbag/HV-EV) DIY job — routes to a human, armed with the fair price.
- NEVER claims certainty — confidence bands + weighted vote always.
- NEVER auto-dials 100/108/112 — family cascade only.
- Photos/audio/OBD2 streams processed on-device; only text descriptions reach the model.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
