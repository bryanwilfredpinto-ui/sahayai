🎖️ World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.

# ARCHITECTURE — Chitti Car Doctor

## Topology

```
User ──► Chitti Vaani (sole interface)        chitti_4wheeler.html (dev/debug + parity)
            │  intent: "4wheeler / car"              │
            └──────────────┬───────────────────────────┘
                           ▼
              chitti-vaani-api  /api/vaani/ask          chitti-4wheeler-api (Flask)
                  (canonical route)                      /api/4w/*  (parity + direct dev surface)
                           │                                   │
                           └─────────────┬─────────────────────┘
                                         ▼
                                  DeepSeek (sole LLM)
                                         │
                    wrap_llm (quadrails + observability + Compliance disclaimer)
                                         │
                          Turso libSQL (via turso_http.py shim) — one DB per Chitti
                          (⚠️ currently SQLite fallback — env-blocker below)
```

- Per [§2 Vaani-sole-interface](../SAHAYAI_MASTER.md), the owner reaches Car Doctor
  through **Vaani**. `chitti-4wheeler-api` exists as the parity + dev surface and
  hosts the deterministic, non-LLM routes (breakdown tree, DTC lookup, maintenance
  schedule, profile) — see [backend/routes/wheels.py](backend/routes/wheels.py).
- **DeepSeek only** ([§2](../SAHAYAI_MASTER.md)). The 8-agent swarm is realised as a
  single structured DeepSeek prompt returning per-agent scores (one round-trip,
  not eight) — see "Swarm execution" below.
- **Voice Factory** for all voice IO; Bhashini is temporary, community voices
  replace it; provider swappable at one URL.

## Real backend routes today ([backend/routes/wheels.py](backend/routes/wheels.py), prefix `/api/4w/`)

| Route | Status | Feature |
|---|---|---|
| `POST /api/4w/ask` | ✅ real | F0 Symptom Doctor — DeepSeek Hinglish Q&A, disclaimer injected, profile by `X-Chitti-Device` |
| `GET /api/4w/dtc/<code>` | ✅ real | F13 DTC library (~16 generic P-codes; 404 honest on miss) |
| `POST /api/4w/breakdown` | ✅ real | F9 Emergency — deterministic 9-step tree + brand RSA + Vaani-protocol line |
| `GET /api/4w/maintenance/next` | ✅ real | F6/F11 odometer-based next-service per `_BRAND_SCHEDULE` (8 brands) |
| `POST·GET /api/4w/profile` | ✅ real | F1 car profile (brand/model/year/fuel/tx/odo/reg), Turso-persisted |
| `* (any other)` | 501 `coming_soon` | honest stub per platform rule |

Everything in [PRD.md](PRD.md) marked COMING SOON returns a clean 501 today — no
fake demos ([honest-stubs rule](../SAHAYAI_MASTER.md)).

## Data residency (privacy by construction)

| Data | Where it lives | Ever sent to server? |
|---|---|---|
| Dashboard / part / leak photos | Browser **IndexedDB** + on-device processing | **Never** — only a short text description |
| Engine sound clips | Processed on-device | **Never** — only the extracted feature/result text |
| OBD2 live PIDs + freeze-frame | Browser, on-device | **Never** — only the decoded text result + DTC string |
| Documents (RC/insurance/PUC/DL/FASTag) | Encrypted on-device vault | **Never** unless the owner shares via `chittiConfirmAndDo()` |
| Car profile (brand/model/year/fuel/tx/odo/reg) | Turso `CarProfile` row keyed by `X-Chitti-Device` | Yes — non-PII vehicle metadata only |
| Vehicle Health Passport | On-device, owner-owned | Exported only on explicit confirm |
| Per-card feedback (👍/👎 + text) | `POST /api/feedback` | Card name + text only — never images/audio |
| Anonymised diagnosis patterns | Turso aggregate (swarm) | Anonymised, ≥100 confirmations, tombstoned on forget |

DPDP Act 2023 compliant. The privacy banner states this in 9 languages on first visit.
Per [§2b Camera Intelligence](../SAHAYAI_MASTER.md), captures feed community
fake-part alerts (fake pads, fake filters) + the annual report — **anonymised,
owner-owned, "Chitti forget" deletes all.**

## Swarm execution (8 agents, 1 round-trip)

The eight-agent vote ([swarm/](swarm/)) is sent to DeepSeek as ONE prompt that
demands a strict JSON object:

```json
{
  "verdict": [
    {"fault": "Misfire cylinder 2 — plug/coil", "probability": 0.80, "confidence": "high"},
    {"fault": "Ignition coil", "probability": 0.12, "confidence": "low"},
    {"fault": "Fuel injector", "probability": 0.08, "confidence": "low"}
  ],
  "agents": {
    "symptom":    {"note": "check-engine + power loss + rough idle → misfire"},
    "engine":     {"score": 0.80, "note": "P0302 freeze-frame, RPM unstable"},
    "electrical": {"score": 0.12, "note": "coil resistance suspect"},
    "fuel":       {"score": 0.08, "note": "fuel-trim near nominal"},
    "safety":     {"can_drive": "limited", "confidence": "medium", "note": "40 km/h hazards, cat-con risk if ignored"},
    "diy":        {"class": "Professional Required", "note": "plug DIY-assisted; coil/injector pro"},
    "cost":       {"band": "₹300-5000", "diy_saving": 0, "note": "plug ₹300; coil ₹1500-3500"},
    "trust":      {"flag": "no over-diagnosis — single cylinder, not 'full engine'", "downgraded": ["ECU replacement"]}
  },
  "six_fields": {
    "why": "...", "severity": "medium", "can_drive": "...",
    "diy_class": "Professional Required", "cost_band": "₹300-5000", "alternatives": "..."
  },
  "disclaimer": "server-injected"
}
```

- **Safety Agent has veto** — it can only *lower* `can_drive` confidence, never
  raise it (ROLE.md principle 5).
- **Trust Agent** can lower a fault's probability and list `downgraded` over-diagnoses
  (e.g. "ECU replacement" sold for a coil); it can never invent a fault.
- **EV / airbag / brake / fuel faults** are force-stamped 🔴 by the DIY Agent —
  never reachable by the DIY Coach.
- If DeepSeek returns malformed JSON, the frontend shows an honest "Chitti could
  not diagnose this — phir se try karo," **never a fabricated verdict or score**.
- The system prompt opens with the **safety + never-claim-certainty** guardrails
  and closes by re-injecting the [server-enforced disclaimer](skills/FEATURES.md#disclaimer).
- System-prompt grounding: [skills/MECHANIC_KNOWLEDGE.md](skills/MECHANIC_KNOWLEDGE.md)
  prefixed when intent maps to a mechanic / DTC / service question.

## Mode 2 — OBD2 / ELM327 (Web-Bluetooth) — FIRST-CLASS for cars

**Every car sold in India since 2010 has a standard OBD-II port.** The frontend
pairs a ₹400-700 ELM327 Bluetooth / CAN reader over **Web-Bluetooth** (no native
app). This is the car's superpower, not a niche power-up.

- **Standard DTC P-code library** — generic SAE J2012 P-codes are *standardised
  across every manufacturer*: P0301 = "cylinder 1 misfire" on a Swift, Creta and
  Nexon alike. The ~16-code live table + queued ~2 000-code library
  (`dtc_codes_4w.json`) decode each to Hinglish + a ₹ band — portable across cars.
- **Live PIDs** (python-OBD command names): `RPM` · `SPEED` · `COOLANT_TEMP` ·
  `ENGINE_LOAD` · `INTAKE_TEMP` · `THROTTLE_POS` · `FUEL_PRESSURE` · `MAF` ·
  short/long **fuel-trim** · `CONTROL_MODULE_VOLTAGE` (battery) · `FUEL_LEVEL` ·
  `DISTANCE_W_MIL` · `HYBRID_BATTERY_REMAINING` (EV/hybrid SoH).
- **Freeze-frame** — the ECU snapshot captured *at the moment the fault tripped*;
  the single most powerful clue a mechanic uses, now in the owner's hand.
- **Read & clear MIL** — read the check-engine light before paying a garage ₹500-1000
  just to "plug in the scanner."
- Live snapshot posts to `POST /api/4w/obd/snapshot` (COMING SOON). Streams are
  processed on-device; only decoded text + the DTC string ever reach the model.

Predictive table (fuel-trim drift, voltage-drop trend, misfire frequency, coolant
heat-cycles, EV SoH) in [MECHANIC_KNOWLEDGE.md §3](skills/MECHANIC_KNOWLEDGE.md).

## Camera Intelligence (§2b)

Dashboard / part / document / leak scans flow through `chitti_camera.js` (shared
substrate). The image is processed on-device; only a text description reaches the
model. Fake-spare-part captures (fake brake pads, fake oil filters — these *kill*
a whole car-load of people at highway speed) feed the community-alert flywheel +
annual report. Per-Chitti camera DB; owner-owned; `"Chitti forget"` tombstones every row.

## Frontend substrate (gate-compliant)

| Substrate | Gate | Role |
|---|---|---|
| `feedback-widget.js` + `data-chitti-response` | G1 | per-box 🔊/🤖/👍/👎 + feedback |
| `chitti_a11y.js` | G2 | lang selector, Voice Required, Braille, read-page, auto-injects the rest |
| Disability Profile prompt (via a11y) | G3 | first-visit multi-select |
| Language auto-detect (via a11y) | G4 | `<html lang>` from profile/navigator |
| `chitti_isl.js` (via a11y) | G5 | ISL panel per response |
| `chitti_features.js` + `<meta name="chitti-features">` | discovery | reads [skills/FEATURES.md](skills/FEATURES.md) |
| `chitti_camera.js` | camera | dashboard/part/document capture (§2b) |
| `chitti_offline.js` | resilience | 2G mode + service-worker cache + connectivity badge |

## Quality stack (per [QUALITY_STATUS.md §1](../QUALITY_STATUS.md))

- **HookRegistry / VISUAL_HOOKS** — per-page cert hooks; every cert writes a 375px
  screenshot to `tools/cert_screenshots/`.
- **wrap_llm** — quadrails (input/output guard, hallucination check, disclaimer
  inject, safety downgrade) around every DeepSeek call.
- **Observability** — request/latency/error metrics; `phantom_fault` and
  `false_certainty` counters are hard-watched.
- **quadrails** — the four safety rails: (1) never-claim-certainty, (2) safety
  downgrade-on-doubt, (3) unsafe-DIY block (brake/fuel/airbag/HV-EV force-🔴),
  (4) disclaimer inject.

## Performance budget

- First paint < 1.5 s on 2G simulation; page < 250 KB excluding shared substrate.
- One DeepSeek round-trip per diagnosis (swarm batched).
- Photos/audio/OBD2 streams never re-uploaded; processed once on-device.

## Failure modes & honest degradation

| Failure | Behaviour |
|---|---|
| DeepSeek 5xx | Honest "Chitti busy hai — phir se try karo"; Layer-5 fallback surfaced, never silent |
| Malformed swarm JSON | Honest retry prompt; **no fabricated verdict or confidence** |
| Symptom too vague | One clarifying question, never a guess |
| Fault not in corpus | Route to human + fair-price band; never invents a fault |
| DTC not in local library | Honest 404 + "POST /api/4w/ask se DeepSeek pe pucho" |
| GPS denied (SOS) | Ask landmark; family cascade still fires on confirm |
| Brand RSA unmatched | Generic 1033 highway RSA surfaced (not auto-called) |
| OBD2 pair fails | Fall back to Mode 1 (voice/photo/sound); never blocks the diagnosis |
| Turso unreachable | SQLite local fallback (current state — see below); profile still persists locally |
| Offline | Service-worker serves last diagnosis + "offline" badge ([§5b](../SAHAYAI_MASTER.md)) |

## ⚠️ Known env-blocker — Turso (per QUALITY_STATUS 2026-05-29)

`chitti-4wheeler-api` is currently on the **local SQLite fallback**. Turso libSQL
persistence requires `DATABASE_URL` in the **composed** `libsql://host?authToken=jwt`
form (the 4wheeler pattern — per [env-var patterns memory](../SAHAYAI_MASTER.md))
wired through the [turso_http.py direct-HTTPS shim](../SAHAYAI_MASTER.md). The DB
is provisioned (4wheeler Turso DB, aws-ap-south-1). **Blocked on Sire** setting the
env var. Until then, car profiles persist locally but do not sync across devices.
This is the YELLOW item. (Always grep `config.py` + `database.py` before pasting
env vars — the 4wheeler uses the composed pattern, not the split one.)

## Rollback plan

- Every feature behind a `c4w_*` flag read at boot from static config; flipping a
  flag off reverts to the prior stable surface with no deploy.
- HTML is a single static file → rollback = `git revert` of the page commit.
- Backend: keeps the last green deploy; `rollback` reverts the service. No
  destructive DB migration owned by Car Doctor (`CarProfile` table is additive) →
  no schema rollback risk.
- COMING SOON routes already return 501, so reverting an unfinished feature is a
  no-op for the owner.

## Security

- No secrets in the page. No PII transmitted (vehicle metadata is non-PII).
- All network calls go to `chitti-vaani-api` (canonical) or `chitti-4wheeler-api`
  (parity) over HTTPS.
- Camera/photo/Bluetooth/OBD2 access gated by browser permission prompt + the
  Golden Rule for any side-effecting action (SOS, RSA call, document share, booking).
- SOS can **never** auto-dial 100/108/112 — hard-coded family-cascade-only.

---
> **World Class Chitti Car Doctor — Commando Discipline. Zero Excuses.**
