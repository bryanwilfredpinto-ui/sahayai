🎖️ World Class Chitti Mechanic 2 Wheeler — Commando Discipline. Zero Excuses.

# PRD — Chitti Mechanic 2 Wheeler

> Product requirements. Every feature is **deterministic-first** (the engine
> `chitti_mechanic_2w_engine.js` / `window.ChittiMech2W` computes the answer from
> versioned rule tables; DeepSeek only narrates) and **four-user accessible**
> (voice + symbol + tap on every surface). Every result object returns
> `{confidence, risks[], sources[]}`. Status legend: 🟢 built in v1 frontend engine ·
> 🟡 partial / honest stub · 🔵 COMING SOON (honest 501 on backend).
>
> Folder `chitti-mechanic-2w/` · frontend `chitti_mechanic_2w.html` (repo root) ·
> backend `chitti-mechanic-2w-api` (Flask, honest 501 stubs) · DB Turso (local SQLite
> fallback) · substrate `chitti_lang.js` (#lang-select, 26 langs) · `chitti_a11y.js` ·
> `feedback-widget.js` (5-element 🔊/🤖/👍/👎/✏️ on every `[data-chitti-response]`).

## Feature 0 — Accessibility & Language core (the floor, built FIRST)

Voice IN + voice OUT, ISL panel, symbol+word status, picture menus, large-text/
slow-speech senior mode, 26-language dropdown (Vaani-canonical `chitti_lang.js` owns
`#lang-select`), auto-read first result for blind users, full keyboard + screen-reader
support, haptic feedback. **Every feature below inherits this — a feature that can't
serve blind/deaf/mute/illiterate users is redesigned, not shipped.** 🟢

---

## Feature 1 — Document Vault

Store insurance · PUC · RC · service records · tyre · battery · chain documents
**local-only** (on-device, never uploaded). OCR extracts dates/numbers where a vision
key exists; otherwise manual entry.

- **Acceptance:** every document type storable + retrievable offline; "Chitti forget"
  wipes the vault; nothing leaves the device without explicit export.
- **Engine fn:** `ChittiMech2W.vault.add(doc)` / `.list()` / `.forget()`.

## Feature 2 — Smart Reminders 24/7/365

Insurance (30/15/7/1 days before expiry) · PUC (30/7/1d) · Service (km-OR-months,
whichever first) · RC renewal · Tyre (20,000 km OR 3 yr) · Battery (24 mo) · Chain
(every 500 km) · Tyre-pressure (monthly). Channels: voice · SMS · WhatsApp · push.

- **Acceptance:** **Reminder accuracy = 100%** (never miss, never early/late by a day);
  every reminder is Golden-Rule confirmed before any channel send; deterministic from
  stored dates/odometer.
- **Engine fn:** `ChittiMech2W.reminders.compute(twin, today)` → due-list with channel
  + lead-time.

## Feature 3 — Pre-Purchase Inspection & Buy Assistant

Buy Score /100 · expected price · negotiation range · accident / odometer-tamper /
flood flags. Honest **probability** per Cars24-style logic — never "guaranteed clean".

- **Acceptance:** score reproducible from the same inputs; flags state probability +
  reasoning; output literally never contains "guaranteed"/"certified clean".
- **Engine fn:** `ChittiMech2W.buy.score(vehicleInputs)` → `{buyScore, expectedPrice,
  negotiationRange, flags[], confidence, risks[], sources[]}`.

## Feature 4 — Insurance Intelligence

Compare 8+ insurers with **Claim Settlement Ratio (CSR)**, show expected savings vs
current premium, surface IDV/add-on guidance.

- **Acceptance:** comparison within **±5%** of insurer-published premiums (to be
  measured); CSR sourced + dated; savings figure provenance-tagged.
- **Engine fn:** `ChittiMech2W.insure.compare(profile)` → ranked insurers + savings.

## Feature 5 — PUC Intelligence

PUC expiry tracking + nearest PUC centre (geo).

- **Acceptance:** expiry derived deterministically; nearest-centre list sourced.
- **Engine fn:** `ChittiMech2W.puc.status(twin)` + `ChittiMech2W.puc.nearest(geo)`.

## Feature 6 — Service Intelligence

km/months scheduler + oil & parts recommendation as **deterministic tables** keyed by
make/model.

- **Acceptance:** schedule = whichever-first of km/months; oil/parts from versioned
  table, never invented.
- **Engine fn:** `ChittiMech2W.service.schedule(twin)` / `.parts(model)`.

## Feature 7 — Tyre Intelligence

Best tyre by usage pattern (city/highway/mixed) + price.

- **Acceptance:** recommendation matches expert pick **≥90%** (to be measured); price
  sourced.
- **Engine fn:** `ChittiMech2W.tyre.recommend(usage, model)`.

## Feature 8 — Battery Intelligence

Battery age tracking + replacement timing.

- **Acceptance:** replacement flagged deterministically at the 24-month rule (or
  earlier on symptom input).
- **Engine fn:** `ChittiMech2W.battery.status(twin)`.

## Feature 9 — Fuel Intelligence (petrol → EV ROI)

Petrol-vs-EV total-cost-of-ownership and break-even (ROI) calculator.

- **Acceptance:** ROI math reproducible from fuel price, km/yr, EV cost; assumptions
  shown.
- **Engine fn:** `ChittiMech2W.fuel.evRoi(inputs)`.

## Feature 10 — Vehicle Education

8 learning modules, voice + video.

- **Acceptance:** all 8 modules present in 26 languages; voice-out works for blind
  users.
- **Engine fn:** `ChittiMech2W.education.modules()`.

## Feature 11 — Diagnostics & OBD Doctor

Symptom or OBD code → plain-language cause. OBD is an **optional power-feature** (Indian
2-wheelers rarely have OBD2), so the symptom path is primary.

- **Acceptance:** **OBD code lookup = 100%** deterministic from the code table;
  symptom→cause shows confidence; safety-critical → mechanic.
- **Engine fn:** `ChittiMech2W.diagnose.byCode(code)` / `.bySymptom(text)`.

## Feature 12 — Scam Detector

Quote vs expected range; **>30% above expected = alert**.

- **Acceptance:** **Scam detection ≥80%** (to be measured); threshold rule explicit;
  alert fires to user.
- **Engine fn:** `ChittiMech2W.scam.check(quote, jobType, model)`.

## Feature 13 — DIY-vs-Mechanic Triage

🟢 DIY / 🟡 caution / 🔴 mechanic. **Safety-critical jobs always route to mechanic.**

- **Acceptance:** **DIY success ≥70%** for 🟢 jobs (to be measured); brakes/steering/
  electrical-fire class are never marked 🟢.
- **Engine fn:** `ChittiMech2W.triage.classify(job)`.

## Feature 14 — Sell Assistant

Market value + listing helper.

- **Acceptance:** value reproducible from Vehicle Twin + market table; listing text
  Golden-Rule confirmed before any share.
- **Engine fn:** `ChittiMech2W.sell.value(twin)` / `.listing(twin)`.

## Feature 15 — Savings Tracker

Track savings toward a ₹10,000+ goal (insurance + service + scam-avoided savings).

- **Acceptance:** running total provenance-tagged to the feature that produced each
  saving.
- **Engine fn:** `ChittiMech2W.savings.total(journal)`.

---

## Cross-cutting capabilities

- **Vehicle Twin** (on-device): full history + resale-readiness score.
  `ChittiMech2W.twin.*`.
- **Ownership Scores:** Buy · Maintenance · Safety · Resale.
  `ChittiMech2W.scores.compute(twin)`.
- **AI Coach layer:** symptom → likely cause + confidence + DIY/mechanic. Engine first,
  DeepSeek narrates only.

## Cross-cutting requirements (every feature)

- **Per-response widget** (🔊 / 🤖 / 👍 / 👎 / ✏️) on every `[data-chitti-response]`
  box (feedback-widget.js).
- **Golden Rule** — any side-effecting action (reminder channel send, listing share,
  export) confirms first via `chittiConfirmAndDo()`. Chitti never books/buys/sells on
  its own.
- **Confidence + risks + sources** on every answer (`{confidence, risks[], sources[]}`).
- **Deterministic math** — every km/₹/date is engine-computed and provenance-tagged.
- **Honest stub** — on DeepSeek 429 / offline, the engine's own plain-language strings
  ship; a number is never fabricated.

---
> **World Class Chitti Mechanic 2 Wheeler — Commando Discipline. Zero Excuses.**
