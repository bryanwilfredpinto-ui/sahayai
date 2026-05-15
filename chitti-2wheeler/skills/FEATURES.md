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
| W5 | **Predictive maintenance (OBD2 mode)** — oil quality %, coolant trend, battery voltage drop, misfire detect via ELM327 | P1 | For bikes that have an OBD2 port (RE Meteor 350+, KTM 390+, Pulsar NS200+, most ABS bikes 2018+) | Web-Bluetooth UI to pair adapter + `POST /api/2w/obd/snapshot` |
| W6 | **DTC plain-English library** — every P0xxx + manufacturer-specific code translated to Hinglish + repair cost band | P1 | Removes mechanic information asymmetry — rider can verify quoted repair | `dtc_codes` table + `GET /api/2w/dtc/<code>` |
| W7 | **Anti-overcharge guard** — "Mechanic ne ₹1 800 maanga oil change ke liye, kya theek hai?" → community fair-price band by city + DeepSeek opinion | **P0** | Mechanic overcharging is the #1 complaint; Chitti is the rider's commando | `fair_price` table seeded from community + `POST /api/2w/quote/check` |
| W8 | **Theft guard — community ping** | **P0** | Bike theft is rampant; insurance pays slow; community network is fastest recovery channel | Owner reports theft → pincode-radius alert to every Chitti 2W user in that pincode; sightings replied + spoken to owner |
| W9 | **Roadside SOS — family cascade** | **P0** | Per [Vaani locked emergency protocol](../../SAHAYAI_MASTER.md#2-locked-decisions--do-not-relitigate) — confirm-with-master → alarm → spouse → family → Chitti-to-Chitti relay. **Never auto-dials 100 / 108 / 112.** | Reuses `chitti-vaani` emergency endpoint; 2W adds GPS + RC plate to the payload |
| W10 | **Mechanic finder + honesty score** | P1 | Community-driven ratings; surfaces "fair-price + on-time" mechanics nearby | Geo-aware list (Haversine, §8 P0 #5–#9 substrate) + rating table |
| W11 | **Spare parts — genuine vs fake scanner** | P1 | Per [Camera Intelligence LOCKED §2b](../../SAHAYAI_MASTER.md#2b-camera-intelligence-across-all-chittis--locked-2026-05-13) — every camera capture feeds community alerts + annual report. Fake bearings / fake brake shoes kill riders. | `POST /api/camera/capture` (shared substrate) + community-alert flywheel |
| W12 | **AI engine listening** — phone mic records 10 s clip; DeepSeek + audio classifier flags misfire / bearing whine / chain rattle / tappet noise | P2 | Most riders can't diagnose by ear; Chitti can. | `POST /api/2w/listen` accepts blob; returns ranked candidate faults |
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
