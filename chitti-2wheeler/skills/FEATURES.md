# Chitti 2-Wheeler — FEATURES

Capability surface for Chitti 2-Wheeler — Bharat's voice-first agent for
motorcycle and scooter owners. Parsed live by [chitti_features.js](../../chitti_features.js)
so this file is the contract. Never hardcode features in JS.

Reference apps audited before commit #1 (per [SAHAYAI_MASTER §2a — new-products process](../../SAHAYAI_MASTER.md#2a-locked-decisions--agent-vision-voice-strategy-new-product-process-2026-05-13)):

1. **Drivvo** — fuel + expense + maintenance log
2. **GoMechanic Bike** — service booking + parts + ratings
3. **Hero / Royal Enfield / Honda / TVS / Bajaj Connect** apps — telematics, ride tracking, group rides
4. **mParivahan / Park+** — RC / insurance / PUC / challan / driving licence
5. **Torque Pro / Carista / FIXD** — Bluetooth OBD2 diagnostics (ELM327 motorcycle modes)

Beyond what those apps do, Chitti adds: voice-first Hinglish · four-user
a11y (Blind / Deaf / Mute / Illiterate) · ISL panel on every response ·
DeepSeek plain-English diagnostics · camera-based fake-spare-parts
community alerts · Vaani family-cascade SOS (never auto-dials cops) ·
document vault with auto-expiry alerts · anti-overcharge guard ·
mechanic honesty score · stolen-bike community ping · AI engine
listening · weather-aware maintenance · WhatsApp booking · carbon per
trip.

Last touched: **2026-05-14**. Verify against `backend/routes/` and
`chitti_2wheeler.html` before claiming "built".

---

## 1. Built and working

_Anchor against routes + frontend handlers. Cross-reference [`../README.md`](../README.md)._

- Onboarding — brand · model · year · odometer (saved per device, voice
  buildable).
- Ask Chitti chat — DeepSeek-powered plain-Hinglish answers for any
  bike question, with the [server-enforced disclaimer](#disclaimer)
  injected.
- Per-response widget — 🔊 / 🤖 / 👍 / 👎 on every answer
  ([feedback-widget.js](../../feedback-widget.js)).
- ISL panel + Feature Discovery box — inherited automatically from
  [chitti_a11y.js](../../chitti_a11y.js).
- Voice IN + voice OUT in 26 languages — inherited from Chitti Voice
  Factory.
- **Dashboard Doctor** — deterministic warning-light knowledge base.
  `GET /api/2w/dashboard/lights` lists ~12 common telltales (every colour
  carries a WORD label + symbol, never colour alone); `POST
  /api/2w/dashboard/check {light_key}` returns severity · can_ride · risk ·
  confidence · Hinglish note. Red-line lights (low oil, overheat, EV
  fault) force `can_ride:false`. **Photo AUTO-DETECT of a light is COMING
  SOON** (needs a vision provider) — sending `{image:true}` returns an
  honest `mode:"pick_or_describe"` (HTTP 200), never a fabricated result.
- **Sound Doctor** — deterministic sound catalogue. `GET
  /api/2w/sound/catalogue` lists ~8 bike sounds; `POST /api/2w/sound/check
  {sound_key}` returns 2-4 ranked candidate causes (≈100%) with DIY-tier +
  rupee cost band + confidence + safety note. **Audio AUTO-DETECT is
  COMING SOON** (needs an audio model) — `{audio:true}` returns honest
  `mode:"pick_or_describe"` (HTTP 200).
- **OBD2 snapshot interpreter** — `POST /api/2w/obd/snapshot
  {codes:[...], live:{volts,rpm,coolant_c}}` decodes each DTC from the
  local library, flags live params vs red-lines (volts<11.8 charging
  issue, coolant>110°C overheat → `can_ride:false`), and returns overall
  severity + confidence + Hinglish summary. Unknown codes are listed
  honestly as `sev:"?"`.
- **Used-Vehicle Inspector** — 100-point deterministic checklist. `GET
  /api/2w/inspect/checklist` (Engine, Transmission/Chain, Electrical,
  Brakes, Tyres/Wheels, Suspension/Fork, Frame/Rust, Documents, Service
  history, Test-ride — safety/title points marked `critical`); `POST
  /api/2w/inspect/score {answers}` returns score % + verdict
  (buy/caution/avoid) + named critical fails + expected repair band. Any
  critical fail caps the verdict — never "buy".
- **Vehicle Health Passport** — persisted per device (Turso). `POST
  /api/2w/passport/event` records service/repair/diagnosis/inspection/doc
  events; `GET /api/2w/passport` returns the timeline newest-first plus a
  deterministic **Trust Score** (0-100, green ≥80 / amber 50-79 / red <50)
  from service history, breadth/recency, unresolved critical repairs, and
  missing docs; `GET /api/2w/passport/trust-score` returns just the score.
  Honest empty state when no events.

---

## 2. Planned — queued 2026-05-14

Each item below must arrive with a route in `backend/routes/`, a UI
affordance in `chitti_2wheeler.html`, and a Voice Required marker
where blind / illiterate users are the primary audience.

| # | Feature | Priority | Why | Surface needed |
|---|---|---|---|---|
| W1 | **Maintenance schedule (odometer-only mode)** — oil, air filter, chain lube, spark plug, brake pads, tyres, battery per brand schedule | **P0** | Works for the 90 % of bikes without OBD2 — every Hero Splendor, Activa, Pulsar owner | `bike_profile` table + brand schedule JSON + cron 06:00 IST → Vaani read-aloud reminders |
| W2 | **Breakdown coach** — step-by-step Hinglish flowchart when bike refuses to start; emits roadside-assistance numbers | **P0** | Safety; rural / highway users with no mechanic nearby | `POST /api/2w/breakdown` returns decision tree; voice-walks user through each step |
| W3 | **Document vault** — RC · insurance · PUC · driving licence · loan EMI · auto-expiry alerts 30 / 7 / 1 days before | **P0** | Expired PUC = ₹10 000 fine; 6 crore Indians have a 2W, most miss renewal dates | Camera capture → Tesseract / DeepSeek OCR → encrypted Turso row + 3 reminder crons per doc |
| W4 | **Fuel log + km/l calculator** | P1 | Drivvo's core feature; lets riders track real economy | Voice "Chitti, 200 rupees ka petrol bhara, 4.5 litre, odo 25 100" → row + rolling km/l |
| W5 | **Predictive maintenance (OBD2 mode)** — oil quality %, coolant trend, battery voltage drop, misfire detect via ELM327 | P1 | For bikes that have an OBD2 port (RE Meteor 350+, KTM 390+, Pulsar NS200+, most ABS bikes 2018+) | ✅ **Snapshot interpreter LIVE** — `POST /api/2w/obd/snapshot` decodes codes + flags live params (see §1). Web-Bluetooth ELM327 pairing UI still queued. |
| W6 | **DTC plain-English library** — every P0xxx + manufacturer-specific code translated to Hinglish + repair cost band | P1 | Removes mechanic information asymmetry — rider can verify quoted repair | `dtc_codes` table + `GET /api/2w/dtc/<code>` |
| W7 | **Anti-overcharge guard** — "Mechanic ne ₹1 800 maanga oil change ke liye, kya theek hai?" → community fair-price band by city + DeepSeek opinion | **P0** | Mechanic overcharging is the #1 complaint; Chitti is the rider's commando | `fair_price` table seeded from community + `POST /api/2w/quote/check` |
| W8 | **Theft guard — community ping** | **P0** | Bike theft is rampant; insurance pays slow; community network is fastest recovery channel | Owner reports theft → pincode-radius alert to every Chitti 2W user in that pincode; sightings replied + spoken to owner |
| W9 | **Roadside SOS — family cascade** | **P0** | Per [Vaani locked emergency protocol](../../SAHAYAI_MASTER.md#2-locked-decisions--do-not-relitigate) — confirm-with-master → alarm → spouse → family → Chitti-to-Chitti relay. **Never auto-dials 100 / 108 / 112.** | Reuses `chitti-vaani` emergency endpoint; 2W adds GPS + RC plate to the payload |
| W10 | **Mechanic finder + honesty score** | P1 | Community-driven ratings; surfaces "fair-price + on-time" mechanics nearby | Geo-aware list (Haversine, §8 P0 #5–#9 substrate) + rating table |
| W11 | **Spare parts — genuine vs fake scanner** | P1 | Per [Camera Intelligence LOCKED §2b](../../SAHAYAI_MASTER.md#2b-camera-intelligence-across-all-chittis--locked-2026-05-13) — every camera capture feeds community alerts + annual report. Fake bearings / fake brake shoes kill riders. | `POST /api/camera/capture` (shared substrate) + community-alert flywheel |
| W12 | **AI engine listening** — phone mic records 10 s clip; DeepSeek + audio classifier flags misfire / bearing whine / chain rattle / tappet noise | P2 | Most riders can't diagnose by ear; Chitti can. | 🟡 **Sound Doctor catalogue LIVE** (deterministic `POST /api/2w/sound/check {sound_key}`, see §1). **Audio AUTO-DETECT (the 10 s clip classifier) remains COMING SOON** — needs an audio model; `{audio:true}` returns honest `pick_or_describe`. |
| W13 | **Weather-aware maintenance** — monsoon arriving → "chain lube every 300 km not 500"; dust storm season → "air filter check 2× more often" | P1 | India's seasons stress the bike differently; reminders should adapt | IMD weather feed + rule table |
| W14 | **WhatsApp booking** — book service from WhatsApp without app | P1 | Per [SAHAYAI_MASTER §5b — WhatsApp integration P0](../../SAHAYAI_MASTER.md#5b-cross-cutting--applies-to-all-chittis-queued-2026-05-13). Rural unlock. | WhatsApp Business API + service-centre directory |
| W15 | **Group ride planner** | P2 | Royal Enfield / BMW Motorrad apps have it; community-feature for Bullet / KTM riders | Trip plan + live location share + auto-fire Vaani SOS if a rider stops moving for 10 min |
| W16 | **Pothole reporter** | P2 | Community-mapped, escalates to MCD / PWD via [chitti-government](../../chitti-government/) | `POST /api/2w/pothole` + pincode aggregate |
| W17 | **Chain & sprocket life tracker** | P1 | Unique to 2W; chain replacement at 18-25k km — riders forget | Voice log "chain lube kiya" → cron projects remaining km |
| W18 | **Tyre pressure calculator** — by load + temperature + tyre type | P2 | Pillion + luggage + hot Indian summer = under-inflated tyre = accident | Calc + cron monthly reminder |
| W19 | **Carbon per trip** | P2 | Per [Chitti Quality v2 §6 — carbon tracker](../../SAHAYAI_MASTER.md#6-quality-standards). Per-trip CO₂ from odo delta × engine cc fuel-burn rate. | Trip log + carbon column |
| W20 | **Family fleet view** — single household, multiple bikes + cars, one dashboard | P2 | Cross-product flywheel with [chitti-4wheeler](../../chitti-4wheeler/) | Shared `family_fleet` table; surfaced on both 2W + 4W pages |
| W21 | **Helmet reminder** — phone-sensor heuristic ("phone went 30 km/h before pickup detected") | P2 | India's helmet compliance is poor; Chitti nudges. | Accelerometer + reminder voice |
| W22 | **Fuel saver score** | P2 | Gamified — bring throttle stomps + harsh braking down ⇒ score up | Trip telemetry + score widget |
| W23 | **Festival / road-trip checklist** — pre-Diwali, pre-monsoon, pre-long-ride | P2 | Cultural micro-moments; bikes need different prep | Static checklist + voice walk-through |
| W24 | **Resale advisor — when to sell** | P3 | Compares your bike's expected resale curve vs maintenance cost trajectory | Resale model + `GET /api/2w/resale/<reg>` |

---

## 3. Future — needs partnership / regulator / new data source

| Item | Blocker |
|---|---|
| **Live VAHAN / PARIVAHAN deep-link** for RC / DL / PUC verification | Partnership with MoRTH or `setu.co` / `signzy` / `karza` API key |
| **DigiLocker pull** of RC + DL + Insurance | Partner-only OAuth (same blocker as [chitti-government](../../chitti-government/skills/FEATURES.md)) |
| **Bhashini voice supplier** swap from `mock_bhashini` | Sire's ULCA registration ([SAHAYAI_MASTER §8 P1](../../SAHAYAI_MASTER.md#p1--unblock-voice-factory-phase-2)) |
| **Real-time traffic challan feed** | mParivahan / state-RTO API |
| **Insurance quote comparison** — Acko / Digit / ICICI Lombard | Per-insurer partnership |
| **Manufacturer telematics deep-link** — Hero Connect / RE App OBD pipe | Hero / RE / Honda / Bajaj / TVS app SDK |
| **Camera-based ISL detection (Phase 2)** | Per [§7 ISL Phase 2 COMING SOON](../../SAHAYAI_MASTER.md#phase-2--camera-based-isl-coming-soon). Frame-stream classifier supplier TBD. |

---

## 3b. COSDF domain skill files (knowledge core)

Per [COSDF v1.0 LEVEL 5](../../CHITTI_MECHANIC_COSDF.md), the diagnostic
knowledge is split into 12 domain skill files. Each carries domain principles,
Indian-fleet failure patterns (Activa / Splendor / Pulsar / RE / Ather / Ola),
symptom→cause mapping, the confidence-band + DIY-safety-tier outputs, and the
swarm agents it feeds. These ground the flagship reasoner
[`symptom-diagnosis.md`](./symptom-diagnosis.md) and the
[8-agent swarm](../swarm/README.md):

| Domain | File | Owns |
|---|---|---|
| Engine | [`engine.md`](./engine.md) | combustion, cranking, fuelling, compression |
| Electrical | [`electrical.md`](./electrical.md) | battery, charging, starting; EV-HV (no-DIY) |
| Brakes | [`brakes.md`](./brakes.md) | drum/disc/CBS/ABS — Safety-supreme |
| Tyres & wheels | [`tyres.md`](./tyres.md) | tread/pressure/age/bearing |
| Cooling | [`cooling.md`](./cooling.md) | air/oil/liquid; no-hot-cap; EV thermal |
| Transmission | [`transmission.md`](./transmission.md) | clutch/gearbox/chain, CVT, EV drive |
| Exhaust | [`exhaust.md`](./exhaust.md) | smoke-colour map, BS6 emissions, PUC |
| OBD | [`obd.md`](./obd.md) | DTC decode, ELM327, dashboard MIL |
| Cost | [`cost.md`](./cost.md) | fair-price bands, quote verification |
| Safety | [`safety.md`](./safety.md) | the supreme veto + emergency path |
| Accessibility | [`accessibility.md`](./accessibility.md) | four-user modality adaptation |
| Sound recognition | [`sound_recognition.md`](./sound_recognition.md) | sound→component; audio AUTO-DETECT roadmap |

---

## 4. Cross-product hooks

- **[Chitti Vaani](../../chitti_vaani.html)** — emergency cascade endpoint; Chitti 2W's
  SOS button reuses Vaani's family-call chain. **Never auto-dials cops.**
- **[Chitti MedUPI](../../chitti_medupi.html)** — accident response: after SOS confirm,
  surface the nearest hospital + family medicine cabinet for blood-group + allergy.
- **[Chitti Legal](../../chitti_legal.html)** — challan / accident / FIR template
  generator. Plain-English in any of 26 languages.
- **[Chitti Government](../../chitti_government.html)** — pothole + RTO + driving-licence
  renewal deep-link.
- **[Chitti Voice Factory](../../chitti_voice_factory.html)** — all voice IO. No
  Bhashini hard-coding; provider swappable at one URL.
- **[chitti_camera.js](../../chitti_camera.js)** — every spare-part / document / strip
  scan flows through the shared capture path. Camera DB is per-Chitti.
- **[chitti-4wheeler](../../chitti-4wheeler/)** — shared `family_fleet` table for
  households with both a bike and a car.

---

## 5. How to keep this file honest

- If a feature lands in the JS but isn't in `## 1. Built and working`
  → bug. Update this file first, code second.
- If a feature is in this file but the route returns 501 / 404 → bug.
  Either ship the route or move the row down a section.
- Status badges in the modal are inferred from the H2 — `Built` ⇒ LIVE 🟢,
  `Planned` ⇒ PLANNED 🟡, `Future` ⇒ FUTURE 🔵. Don't rename sections.
- New cross-product hooks land in `§4`. Update [SAHAYAI_MASTER §4a](../../SAHAYAI_MASTER.md#4a-frontend--folder-map-root-html-files)
  if you add a root-level HTML.

---

## Disclaimer

> *"Main mechanic nahi hoon. Yeh information guide ke liye hai. Major
> problems ke liye trained mechanic se milein. Emergency mein **family
> ko call kiya jayega**, **cops ko nahi** (Vaani protocol)."*

Server-enforced — every DeepSeek answer carries this footer, never
client-controlled. Matches [SAHAYAI_MASTER §6 — DeepSeek answers carry server-enforced disclaimers](../../SAHAYAI_MASTER.md#6-quality-standards).
---

## 2a. Quality & Scope improvements — queued 2026-05-15

Per the *Quality & Scope Improvement directive* dated 2026-05-15. Items
land here first as a capability surface that the [Feature Discovery
Box](../../chitti_features.js) reads live; COMING SOON badges show until
the backend/UI work is wired per the [new-products process
(§2a)](../../SAHAYAI_MASTER.md). Locked decisions in §2 are never
relitigated by this section — the swarm + Sire may *propose* new
capabilities; locks (LLM provider, voice substrate, emergency protocol,
four-user contract, ISL, per-response widget, camera intelligence,
knowledge-corpus expert grades, Vaani sole interface) never move.

### Quality

| # | Item | How to apply |
|---|---|---|
| Q1 | Service interval **specific to make / model / year** — never generic. Ask bike details first. | Onboarding wizard (make + model + year + odometer); decision tree maps to OEM service-book intervals. |
| Q2 | DIY vs Mechanic shows **cost difference** — *"DIY saves ₹800 vs the mechanic's quoted ₹2,000"*. | Per-task cost-band table (parts only vs parts + labour) sourced from a curated `2wheeler_costs.json`. |
| Q3 | Recall notices shown **prominently** if the user's bike model has an active recall (per ARAI / OEM feeds). | Periodic poll of ARAI recall list + per-OEM announcements; banner on every page when the user's bike model matches. |


### Scope

| # | Item | Priority | Surface needed |
|---|---|---|---|
| S1 | Fuel efficiency tracker — user logs fuel fills, Chitti tracks mileage. | P1 | Local-only log; cross-references against the OEM-claimed mileage; alerts if user's mileage drops > 15% (possible service due). |
| S2 | Insurance renewal reminder — before expiry. | **P0** (legal compliance) | Per-policy reminder set at user-entered expiry date; voice + Notification API. |
| S3 | Pollution certificate (PUC) reminder. | **P0** | Same pattern as S2; PUC validity varies by state — state-aware reminder. |
| S4 | Nearest authorised service centre locator. | P1 | Per-OEM service-centre database (publicly available); uses `Chitti.location` for ranking. |
| S5 | Spare-part price comparison — 3 sources shown. | P1 | OEM-MRP + Amazon / Flipkart prices + local-mechanic estimate; honest *"local mechanic price is approximate"* footer. |
| S6 | *"Is this garage overcharging me?"* — user describes the repair, Chitti gives a fair price range. | P1 | Reuses the cost-band table from Q2; surfaces median + 25/75 percentile. |

### Cross-Chitti improvements (substrate — every page inherits)

The 2026-05-15 directive's cross-cutting items #1–#10 ship as
substrate features in [`chitti_a11y.js`](../../chitti_a11y.js) so every
Chitti page inherits them without per-page edits:

| # | Cross-Chitti item | Where it lives | Status |
|---|---|---|---|
| 1 | Offline mode for basic queries | `chitti_offline.js` (service-worker cache + connectivity badge) | wired since 2026-05-14 |
| 2 | WhatsApp share on every response | `Chitti.a11y.share(text, opts)` | shipped 2026-05-15 |
| 3 | Save as PDF / print scoped to a node | `Chitti.a11y.print(el, opts)` | shipped 2026-05-15 |
| 4 | Voice input everywhere | Voice Factory cascade via `Chitti.a11y.speak` / Web Speech API on every page | wired since 2026-05-12 |
| 5 | Low-data / 2G mode | `chitti_offline.js` + `effectiveType <= 2g` heuristic; user-overridable via Disability Profile "rural / low connectivity" | wired since 2026-05-14 |
| 6 | Battery saver auto-dark below 20% | `Chitti.a11y.setBatterySaver()` + `html[data-chitti-batt="save"]` CSS | shipped 2026-05-15 |
| 7 | Font size large / medium / small | `Chitti.a11y.setFontSize('lg'\|'md'\|'sm')` | shipped 2026-05-15 |
| 8 | "Chitti forget" — one-tap local wipe | `Chitti.a11y.forget(scope)` + tombstone preserved for honest counts | shipped 2026-05-15 |
| 9 | Session history (last 5 questions) | `Chitti.a11y.history.{push,list,clear,mount}` per-Chitti scope | shipped 2026-05-15 |
| 10 | Rating after 3 uses | **REJECTED** — see "Rejected items" below | — |

### Confidence-score chip — shared primitive

The 2026-05-15 directive asks several Chittis to show a confidence
score on every answer (MedUPI strip scan, CA tax answer, Scanner FSSAI
flag, etc.). Rather than each backend hand-rolling a different chip,
the rendering primitive lives in `Chitti.a11y.renderConfidence(target,
pct, opts)` — the backend emits a number, the substrate renders the
coloured pill (green ≥ 80%, amber 50–79%, red < 50%). Below 70% the
chip carries a `Please verify` line; if `opts.verifyWith` is set, the
chip's `title` says where to verify (e.g. "FSSAI portal" / "your CA").

### Rejected items — directive-level reroute (2026-05-15)

The following two items conflict with [`feedback_design_from_pwd_user_perspective`](../../SAHAYAI_MASTER.md):

| Item | Why rejected | What we do instead |
|---|---|---|
| *"Did Chitti understand you? YES/NO after every routed response"* | Pre-action / pre-feedback modals **break blind / mute / illiterate users** — the four-user contract floor. We already collect per-response 👍 / 👎 + voice-or-text feedback on every box via the [per-response widget §7](../../feedback-widget.js). Adding a second YES/NO confirmation is redundant + creates a forced choice every turn. | The existing 4-icon row (🔊 · 🤖 · 👍 · 👎) covers the same intent; a 👎 click opens the per-box feedback window scoped to that response. No second prompt. |
| *"Rating after 3 uses — ask user to rate Chitti 1–5"* | Same anti-pattern as above. Generic SaaS rating prompts assume a literate, tap-fluent user. Forcing a 1–5 modal pesters elderly / illiterate / blind users and lowers honest feedback quality (rate-to-dismiss bias). | The per-response widget already produces a far richer signal — every box's 👍 / 👎 rolls into the Founder's daily 07:00 IST quality slice + the Sunday digest. Per-response signals beat point-in-time rating modals on every dimension. |

Both rejections are documented here, not silently dropped, so any
future revisit knows the reasoning. If Sire wants either of these
shipped anyway, the override lives in `Chitti.a11y` and either can be
wired in a future patch.


## AI Scanners (camera + audio)

Four camera/audio diagnostic scanners on the bike HOME tab, launched from the
**🔬 AI Scanners** card → `ChittiScanners.open('2w')` (`chitti_ai_scanners.js`).
Honest-stub contract: the camera/audio AI auto-detect needs a vision/audio
model that is **not funded yet**, so we NEVER fabricate an AI verdict. Each
flow captures the photo/audio for real (object-URL preview, stays on-device),
shows a 🔵 "AI auto-read — coming soon" badge, then gives a REAL deterministic
result based only on what the user tells us. All strings are pure native script
in 9 languages; §6 terms (AI, OBD, EV, AC, ATF, km, ₹, mm, °C, brand/model)
stay English.

| Scanner | Deterministic self-check | Camera/audio AI auto-detect |
|---|---|---|
| 📸 **Dashboard Scanner** — read a warning light | 🟢 LIVE — tap the light you see (~10 lights: check-engine/MIL, battery, oil-pressure, coolant-temp, brake, TPMS, EV, side-stand) → severity (word + colour) · can-ride? · within · plain note. Oil/coolant/brake = HIGH → stop. | 🔵 COMING SOON — needs vision-model funding |
| 📸 **Tire Scanner** — check tyre health | 🟢 LIVE — 30-second yes/no self-check (₹1-coin tread test, sidewall cracks, bulge, uneven wear, nail/cut, age >5–6 yrs) → 🟢 OK / 🟡 watch / 🔴 replace + which checks failed. | 🔵 COMING SOON — needs wear/crack vision model funding |
| 🎙️ **Engine Sound Analysis** — identify a noise | 🟢 LIVE — record ~10 s near the engine, then pick the closest sound (knocking, bearing whine, tappet tick, misfire, brake squeal, exhaust blow, chain rattle) → ranked causes · can-ride? · ₹ cost band · safety note. | 🔵 COMING SOON — needs audio-match model funding |
| 📸 **Leak Detection** — find a leak | 🟢 LIVE — photo of the puddle, then match the fluid colour (brown/black = engine oil, amber = gear oil, green/orange/pink = coolant, red/pink = ATF/power-steering, clear under AC = water/normal, dark-oily near a wheel = 🔴 brake fluid) → what it is · severity · can-ride? · action. | 🔵 COMING SOON — needs leak vision model funding |

Every result block carries a 🔊 speak button (`speakText` / `Chitti.a11y.speak`)
and an "ℹ️ based on what you told me — not an AI verdict" honesty line.
Registered in `chitti_offline_sw.js` (PRECACHE_URLS + SUBSTRATE_RX) so it works
offline. The launch card is a `data-chitti-response` box so the per-response
feedback widget attaches.
