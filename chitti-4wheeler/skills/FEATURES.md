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
