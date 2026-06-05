# Chitti 4-Wheeler — FEATURES

Capability surface for Chitti 4-Wheeler — Bharat's voice-first agent
for car owners. Parsed live by [chitti_features.js](../../chitti_features.js)
so this file is the contract. Never hardcode features in JS.

Reference apps audited before commit #1 (per [SAHAYAI_MASTER §2a — new-products process](../../SAHAYAI_MASTER.md#2a-locked-decisions--agent-vision-voice-strategy-new-product-process-2026-05-13)):

1. **Torque Pro / Car Scanner / FIXD** — Bluetooth OBD2 diagnostics + DTC library
2. **Drivvo** — fuel + expense + maintenance log
3. **GoMechanic / Spinny / Park+** — service booking + parts + valuation
4. **mParivahan / Acko Drive** — RC / insurance / PUC / challans / driving score
5. **CarDekho / Cars24 / Spinny Resale** — valuation + when-to-sell signals

Beyond what those apps do, Chitti adds: voice-first Hinglish · four-user
a11y (Blind / Deaf / Mute / Illiterate) · ISL panel on every response ·
DeepSeek plain-English diagnostics for every DTC · camera-based
fake-spare-parts community alerts · Vaani family-cascade SOS (never
auto-dials cops) · document vault with auto-expiry alerts ·
anti-overcharge guard · mechanic honesty score · stolen-car community
ping · AI engine listening · weather-aware maintenance · WhatsApp
booking · carbon per trip · drive score with privacy.

Last touched: **2026-05-14**. Verify against `backend/routes/` and
`chitti_4wheeler.html` before claiming "built".

---

## 1. Built and working

_Anchor against routes + frontend handlers. Cross-reference [`../README.md`](../README.md)._

- Onboarding — brand · model · year · fuel · odometer (saved per
  device, voice buildable).
- Ask Chitti chat — DeepSeek-powered plain-Hinglish answers for any
  car question, with the [server-enforced disclaimer](#disclaimer)
  injected.
- Per-response widget — 🔊 / 🤖 / 👍 / 👎 on every answer
  ([feedback-widget.js](../../feedback-widget.js)).
- ISL panel + Feature Discovery box — inherited automatically from
  [chitti_a11y.js](../../chitti_a11y.js).
- Voice IN + voice OUT in 26 languages — inherited from Chitti Voice
  Factory.

### Car Doctor — deterministic diagnostics (MECH-5, shipped 2026-06-04)

All deterministic (knowledge tables + scoring) — NO DeepSeek, NO
network. Every diagnostic carries a `confidence` band; red-line systems
(brakes / steering / airbag-SRS / overheat / tyre / EV-HV) force
`can_drive:false` + a do-not-drive note. Routes live in
[`backend/routes/doctor.py`](../backend/routes/doctor.py); tables in
[`backend/services/doctor_data.py`](../backend/services/doctor_data.py).

- **Dashboard Doctor** — `GET /api/4w/dashboard/lights` (14-telltale KB)
  + `POST /api/4w/dashboard/check` (interpret one light → severity /
  can-drive / risk / confidence / Hinglish note). Photo **auto-detect**
  of a light is **COMING SOON** (needs vision); `{image:true}` returns
  HTTP 200 `mode:"pick_or_describe"`, never a fabricated result.
- **Sound Doctor** — `GET /api/4w/sound/catalogue` (9 car sounds) +
  `POST /api/4w/sound/check` (2-4 ranked causes summing ~100%, DIY tier,
  car rupee bands, safety note). Audio **auto-classify** of a recorded
  sound is **COMING SOON**; `{audio:true}` returns
  `mode:"pick_or_describe"`.
- **OBD2 snapshot interpreter** — `POST /api/4w/obd/snapshot` decodes
  DTCs from the local library + flags live params (volts<12.0,
  coolant>110°C → can-drive false, |stft+ltft|>25%). Unknown codes
  returned honestly (`sev:"?"`).
- **Used-Vehicle Inspector** — `GET /api/4w/inspect/checklist`
  (~100-point sheet across 11 categories, safety points marked
  `critical`) + `POST /api/4w/inspect/score` → weighted score, verdict
  (buy / caution / avoid), named critical fails, expected repair band.
- **Vehicle Health Passport** — `POST /api/4w/passport/event` (persist),
  `GET /api/4w/passport` (events newest-first + deterministic Trust
  Score 0-100, green/amber/red), `GET /api/4w/passport/trust-score`.

---

## 2. Planned — queued 2026-05-14

Each item below must arrive with a route in `backend/routes/`, a UI
affordance in `chitti_4wheeler.html`, and a Voice Required marker
where blind / illiterate users are the primary audience.

| # | Feature | Priority | Why | Surface needed |
|---|---|---|---|---|
| C1 | **Maintenance schedule (odometer-only mode)** — oil, coolant, brake fluid / pads, spark plugs, timing belt, transmission fluid, tyres, AC filter, battery per brand schedule (Maruti / Hyundai / Tata / Mahindra / Honda / Toyota / Kia / MG) | **P0** | Works for the 95 % of Indian cars without a paired OBD2 adapter | `car_profile` table + brand schedule JSON + cron 06:00 IST → Vaani read-aloud reminders |
| C2 | **Breakdown coach** — step-by-step Hinglish flowchart when car refuses to start; emits brand-specific roadside-assistance numbers (Maruti 1800-102-1800, Hyundai 1800-102-4645, etc.) | **P0** | Highway breakdowns with no signal / no mechanic | `POST /api/4w/breakdown` returns decision tree; voice-walks user through each step |
| C3 | **Document vault** — RC · insurance · PUC · driving licence · loan EMI · road tax · FASTag · auto-expiry alerts 30 / 7 / 1 days before | **P0** | Expired PUC = ₹10 000 fine; expired insurance = uninsured liability | Camera capture → Tesseract / DeepSeek OCR → encrypted Turso row + 3 reminder crons per doc |
| C4 | **OBD2 connected mode** — Bluetooth ELM327 pairing via Web-Bluetooth; reads coolant temp, RPM, MAF, throttle, fuel pressure, battery voltage, fuel level, ambient temp, MIL run-time | P1 | For the rider who buys a ₹500 adapter; this is Torque Pro's core | Web-Bluetooth pair UI + `POST /api/4w/obd/snapshot` + sensor stream |
| C5 | **DTC plain-English library** — every P0xxx + manufacturer-specific code translated to Hinglish + repair cost band (₹) | P1 | Removes mechanic information asymmetry; FIXD's killer feature, but in Hinglish | `dtc_codes` table seeded with 2 000+ codes + `GET /api/4w/dtc/<code>` |
| C6 | **Predictive maintenance (OBD2 mode)** — oil quality %, coolant degradation, battery voltage drop, brake-pad wear (where TPMS-W is exposed), spark-plug life via misfire frequency | P1 | Stops engine seizes / catalytic damage before they happen | Trend table + `GET /api/4w/predict` |
| C7 | **Anti-overcharge guard** — "Service center ne ₹18 000 maanga 40k service ke liye, kya theek hai?" → community fair-price band by city + DeepSeek opinion | **P0** | Indian car-service overcharging at authorised vs independent is the #1 complaint. Chitti = the rider's commando, not a polite assistant. | `fair_price` table seeded from community + `POST /api/4w/quote/check` |
| C8 | **Theft / unauthorised-movement guard** — community ping by pincode if reported stolen | **P0** | India sees 200k+ car thefts / year; community network outpaces insurance / police | Owner reports → pincode-radius alert; sightings replied + spoken to owner |
| C9 | **Roadside SOS — family cascade** | **P0** | Per [Vaani locked emergency protocol](../../SAHAYAI_MASTER.md#2-locked-decisions--do-not-relitigate) — confirm-with-master → alarm → spouse → family → Chitti-to-Chitti relay. **Never auto-dials 100 / 108 / 112.** | Reuses `chitti-vaani` emergency endpoint; 4W adds GPS + RC plate + crash-g-force signal |
| C10 | **Mechanic finder + honesty score** | P1 | Community-driven ratings; surfaces "fair-price + on-time + genuine-parts" mechanics nearby. Authorised vs independent both rated. | Geo-aware (Haversine, §8 P0 #5–#9 substrate) + rating table |
| C11 | **Spare parts — genuine vs fake scanner** | P1 | Per [Camera Intelligence LOCKED §2b](../../SAHAYAI_MASTER.md#2b-camera-intelligence-across-all-chittis--locked-2026-05-13). Fake brake pads / fake oil filters kill drivers. Community alerts + annual report to MoRTH / BIS. | `POST /api/camera/capture` (shared substrate) + community-alert flywheel |
| C12 | **AI engine listening** — phone mic 10 s clip; DeepSeek + audio classifier flags knock / pinging / belt squeal / wheel bearing / brake squeal | P2 | Most drivers can't diagnose by ear; Chitti can. | `POST /api/4w/listen` accepts blob; returns ranked candidate faults |
| C13 | **Weather-aware maintenance** — pre-monsoon → wiper / brake-pad / tyre-tread check; pre-winter → battery / coolant; pre-summer → AC gas / coolant top-up | P1 | India's seasons stress the car differently; reminders should adapt | IMD weather feed + rule table |
| C14 | **WhatsApp booking** — book service from WhatsApp without app | P1 | Per [SAHAYAI_MASTER §5b — WhatsApp integration P0](../../SAHAYAI_MASTER.md#5b-cross-cutting--applies-to-all-chittis-queued-2026-05-13). Rural unlock. | WhatsApp Business API + service-centre directory |
| C15 | **Fuel log + km/l calculator** | P1 | Drivvo's core feature; lets owners track real economy + spot fuel-injector / clogged-filter issues early | Voice "Chitti, 2 000 rupees ka petrol bhara, 24 litre, odo 45 100" → row + rolling km/l |
| C16 | **Cheapest fuel nearby** — IOC / BPCL / HPCL / Reliance / Nayara live price by pincode | P1 | Saves ~₹3-5 / l for buyers who plan; ties into geo substrate | Daily scrape of state-fuel-board rates + Haversine pick |
| C17 | **Carbon per trip** | P2 | Per [Chitti Quality v2 §6 — carbon tracker](../../SAHAYAI_MASTER.md#6-quality-standards). Per-trip CO₂ from odo delta × engine cc / fuel-burn rate. | Trip log + carbon column |
| C18 | **Drive score with privacy** — soft-acceleration / soft-braking / cornering / phone-use score, computed **on device**, no raw GPS leaves the phone | P2 | Acko Drive does it; Chitti does it without selling telemetry | Accelerometer + score widget; only the score (0–100) syncs |
| C19 | **Resale advisor — when to sell** | P2 | Compares your car's depreciation curve vs rising maintenance cost; nudges sell-or-hold | Resale model (Spinny / Cars24 / OLX scrape) + `GET /api/4w/resale/<reg>` |
| C20 | **Insurance comparison** — Acko / Digit / ICICI Lombard / Bajaj Allianz / HDFC Ergo quote compare at renewal | P2 | Owners overpay ~₹3 000 / yr by sticking with default renewal | Per-insurer partner API or honest stub (link out) until partner-onboarded |
| C21 | **Loan EMI tracker** | P3 | For financed cars; reminds before EMI; flags over-budget months | Manual entry today; eventually Account Aggregator pull |
| C22 | **Family fleet view** — single household, multiple bikes + cars, one dashboard | P2 | Cross-product flywheel with [chitti-2wheeler](../../chitti-2wheeler/) | Shared `family_fleet` table; surfaced on both 2W + 4W pages |
| C23 | **Pothole reporter** | P2 | Community-mapped, escalates to MCD / PWD via [chitti-government](../../chitti-government/) | `POST /api/4w/pothole` + pincode aggregate |
| C24 | **Festival / road-trip checklist** — pre-Diwali long drive · pre-monsoon · pre-summer Goa run · pre-winter Manali | P2 | India drives in seasons; pre-trip checklists save lives | Static checklist + voice walk-through |
| C25 | **Tyre pressure calculator** — by load + temperature + tyre type | P2 | Pillion + luggage + hot Indian summer = under-inflated tyre = blow-out at 120 km/h | Calc + monthly cron reminder |
| C26 | **Service-centre honesty score** — authorised dealers rated by Chitti owners for upselling / honest billing / part-genuineness | P2 | Authorised service is often the worst for overcharging; community keeps them honest | Per-centre rating table |

---

## 3. Future — needs partnership / regulator / new data source

| Item | Blocker |
|---|---|
| **Live VAHAN / PARIVAHAN deep-link** for RC / DL / PUC verification | Partnership with MoRTH or `setu.co` / `signzy` / `karza` API key |
| **DigiLocker pull** of RC + DL + Insurance + PUC | Partner-only OAuth (same blocker as [chitti-government](../../chitti-government/skills/FEATURES.md)) |
| **Bhashini voice supplier** swap from `mock_bhashini` | Sire's ULCA registration ([SAHAYAI_MASTER §8 P1](../../SAHAYAI_MASTER.md#p1--unblock-voice-factory-phase-2)) |
| **Real-time traffic challan feed** | mParivahan / state-RTO API |
| **OEM telematics deep-link** — Hyundai BlueLink / Tata iRA / MG i-SMART / Mahindra AdrenoX / Maruti SmartPlay | Per-OEM SDK partnership |
| **FASTag balance + auto-recharge** | NPCI / bank API partnership |
| **Real-time fuel-price API** instead of daily scrape | IOC / BPCL / HPCL data licence |
| **Coding / customisation** (à la OBDeleven for VW group) | Vehicle-specific reverse-engineering corpus |
| **Camera-based ISL detection (Phase 2)** | Per [§7 ISL Phase 2 COMING SOON](../../SAHAYAI_MASTER.md#phase-2--camera-based-isl-coming-soon). Frame-stream classifier supplier TBD. |

---

## 4. Cross-product hooks

- **[Chitti Vaani](../../chitti_vaani.html)** — emergency cascade endpoint; Chitti 4W's
  SOS button reuses Vaani's family-call chain. **Never auto-dials cops.**
- **[Chitti MedUPI](../../chitti_medupi.html)** — accident response: after SOS confirm,
  surface the nearest hospital + family medicine cabinet for blood-group + allergy.
- **[Chitti Legal](../../chitti_legal.html)** — challan / accident / FIR /
  insurance-claim template generator. Plain-English in any of 26 languages.
- **[Chitti Government](../../chitti_government.html)** — pothole + RTO + driving-licence
  renewal deep-link.
- **[Chitti CA](../../chitti_ca.html)** — car-loan interest deduction; depreciation
  for self-employed; section 80EEB EV-loan interest deduction.
- **[Chitti Voice Factory](../../chitti_voice_factory.html)** — all voice IO. No
  Bhashini hard-coding; provider swappable at one URL.
- **[chitti_camera.js](../../chitti_camera.js)** — every spare-part / document
  scan flows through the shared capture path. Camera DB is per-Chitti.
- **[chitti-2wheeler](../../chitti-2wheeler/)** — shared `family_fleet` table for
  households with both a car and a bike.

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
| Q1–Q3 | Mirror of [chitti-2wheeler Q1–Q3](../../chitti-2wheeler/skills/FEATURES.md) — make/model-specific intervals, DIY-vs-mechanic cost delta, recall notices. | Same backend pattern; 4wheeler-specific OEM catalogs. |
| Q4 | **OBD2 interpreter** — ✅ SHIPPED (MECH-5, 2026-06-04) as `POST /api/4w/obd/snapshot` (deterministic decode + live-param flags) and `GET /api/4w/dtc/<code>`. **Interpreter only — not reader.** No phone-to-OBD adapter needed. Full ~2 000-code library still queued (C5). | Local `_DTC` table narrates severity + likely cause + repair band, deterministically (no LLM). |


### Scope

| # | Item | Priority | Surface needed |
|---|---|---|---|
| S1–S6 | Mirror of chitti-2wheeler S1–S6 — fuel tracking, insurance / PUC reminders, service centre locator, spare-part comparison, garage-fair-price. | P0–P1 | Same modules. |
| S7 | EMI calculator — loan amount, tenure, interest rate → monthly EMI. | P1 | Pure calculator + LLM narrative; compares against user's monthly budget when entered. |
| S8 | Electric vehicle range estimator — based on AC usage, load, terrain. | P1 | Per-EV-model lookup table + adjustment factors; honest *"this is an estimate, real range depends on driving style"* footer. |
| S9 | Traffic-fine checker — how to pay, how to contest. | P1 | State-specific portal deep-links (vahan.parivahan.gov.in fronts most states). LLM explains the violation + how to contest under the Motor Vehicles Act. |
| S10 | FASTag recharge reminder + balance-checker guide. | P1 | Reminder cron when balance is low (user-entered) + bank/portal-specific recharge instructions. |

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

Four camera/audio diagnostic scanners on the car HOME tab, launched from the
**🔬 AI Scanners** card → `ChittiScanners.open('4w')` (`chitti_ai_scanners.js`).
Honest-stub contract: the camera/audio AI auto-detect needs a vision/audio
model that is **not funded yet**, so we NEVER fabricate an AI verdict. Each
flow captures the photo/audio for real (object-URL preview, stays on-device),
shows a 🔵 "AI auto-read — coming soon" badge, then gives a REAL deterministic
result based only on what the user tells us. All strings are pure native script
in 9 languages; §6 terms (AI, OBD, EV, AC, ATF, km, ₹, mm, °C, brand/model)
stay English.

| Scanner | Deterministic self-check | Camera/audio AI auto-detect |
|---|---|---|
| 📸 **Dashboard Scanner** — read a warning light | 🟢 LIVE — tap the light you see (~10 lights: check-engine/MIL, battery, oil-pressure, coolant-temp, brake, TPMS, ABS, airbag/SRS, EV) → severity (word + colour) · can-drive? · within · plain note. Oil/coolant/brake/airbag = HIGH → stop / don't drive. | 🔵 COMING SOON — needs vision-model funding |
| 📸 **Tire Scanner** — check tyre health | 🟢 LIVE — 30-second yes/no self-check (₹1-coin tread test, sidewall cracks, bulge, uneven wear, nail/cut, age >5–6 yrs) → 🟢 OK / 🟡 watch / 🔴 replace + which checks failed. | 🔵 COMING SOON — needs wear/crack vision model funding |
| 🎙️ **Engine Sound Analysis** — identify a noise | 🟢 LIVE — record ~10 s near the engine, then pick the closest sound (knocking, belt squeal/chirp, bearing whine, tappet tick, misfire, brake squeal, exhaust blow) → ranked causes · can-drive? · ₹ cost band · safety note. | 🔵 COMING SOON — needs audio-match model funding |
| 📸 **Leak Detection** — find a leak | 🟢 LIVE — photo of the puddle/underside, then match the fluid colour (brown/black = engine oil, amber = transmission oil, green/orange/pink = coolant, red/pink = ATF/power-steering, clear under AC = water/normal, dark-oily near a wheel = 🔴 brake fluid) → what it is · severity · can-drive? · action. | 🔵 COMING SOON — needs leak vision model funding |

Every result block carries a 🔊 speak button (`speakText` / `Chitti.a11y.speak`)
and an "ℹ️ based on what you told me — not an AI verdict" honesty line.
Registered in `chitti_offline_sw.js` (PRECACHE_URLS + SUBSTRATE_RX) so it works
offline. The launch card is a `data-chitti-response` box so the per-response
feedback widget attaches.
