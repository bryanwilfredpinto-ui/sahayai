🎖️ World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.

# ARCHITECTURE — Chitti Bike Doctor

## Topology

```
User ──► Chitti Vaani (sole interface)        chitti_2wheeler.html (dev/debug + parity)
            │  intent: "2wheeler / bike"             │
            └──────────────┬───────────────────────────┘
                           ▼
              chitti-vaani-api  /api/vaani/ask          chitti-2wheeler-api (Railway, Flask)
                  (canonical route)                      /api/2w/*  (parity + direct dev surface)
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

- Per [§2 Vaani-sole-interface](../SAHAYAI_MASTER.md), the rider reaches Bike
  Doctor through **Vaani**. `chitti-2wheeler-api` exists as the parity + dev
  surface and hosts the deterministic, non-LLM routes (breakdown tree, DTC
  lookup, maintenance schedule, profile) — see [backend/routes/wheels.py](backend/routes/wheels.py).
- **DeepSeek only** ([§2](../SAHAYAI_MASTER.md)). The 8-agent swarm is realised as a
  single structured DeepSeek prompt returning per-agent scores (one round-trip,
  not eight) — see "Swarm execution" below.
- **Voice Factory** for all voice IO; Bhashini is temporary, community voices
  replace it; provider swappable at one URL.

## Real backend routes today ([backend/routes/wheels.py](backend/routes/wheels.py))

| Route | Status | Feature |
|---|---|---|
| `POST /api/2w/ask` | ✅ real | F0 Symptom Doctor — DeepSeek Hinglish Q&A, disclaimer injected |
| `GET /api/2w/dtc/<code>` | ✅ real | F13 DTC library (~12 codes; 404 honest on miss) |
| `POST /api/2w/breakdown` | ✅ real | F9 Emergency — deterministic 8-step tree + brand RSA |
| `GET /api/2w/maintenance/next` | ✅ real | F6/F11 odometer-based next-service |
| `POST /GET /api/2w/profile` | ✅ real | F1 bike profile, Turso-persisted |
| `* (any other)` | 501 `coming_soon` | honest stub per platform rule |

Everything in [PRD.md](PRD.md) marked COMING SOON returns a clean 501 today — no
fake demos ([honest-stubs rule](../SAHAYAI_MASTER.md)).

## Data residency (privacy by construction)

| Data | Where it lives | Ever sent to server? |
|---|---|---|
| Dashboard / part / leak photos | Browser **IndexedDB** + on-device processing | **Never** — only a short text description |
| Engine sound clips | Processed on-device | **Never** — only the extracted feature/result text |
| Documents (RC/insurance/PUC/DL) | Encrypted on-device vault | **Never** unless the rider shares via `chittiConfirmAndDo()` |
| Bike profile (brand/model/year/odo/reg) | Turso row keyed by `X-Chitti-Device` | Yes — non-PII vehicle metadata only |
| Vehicle Health Passport | On-device, rider-owned | Exported only on explicit confirm |
| Per-card feedback (👍/👎 + text) | `POST /api/feedback` | Card name + text only — never images/audio |
| Anonymised diagnosis patterns | Turso aggregate (swarm) | Anonymised, ≥100 confirmations, tombstoned on forget |

DPDP Act 2023 compliant. The privacy banner states this in 9 languages on first visit.
Per [§2b Camera Intelligence](../SAHAYAI_MASTER.md), captures feed community
fake-part alerts + the annual report — **anonymised, user-owned, "Chitti forget"
deletes all.**

## Swarm execution (8 agents, 1 round-trip)

The eight-agent vote ([swarm/](swarm/)) is sent to DeepSeek as ONE prompt that
demands a strict JSON object:

```json
{
  "verdict": [
    {"fault": "Battery weak / discharged", "probability": 0.85, "confidence": "high"},
    {"fault": "Starter motor", "probability": 0.10, "confidence": "low"},
    {"fault": "Fuel delivery", "probability": 0.05, "confidence": "low"}
  ],
  "agents": {
    "symptom":    {"note": "self start nahi, horn weak → electrical"},
    "engine":     {"note": "combustion ruled out — cranks but no fire absent"},
    "electrical": {"score": 0.85, "note": "voltage drop pattern"},
    "fuel":       {"score": 0.05, "note": "reserve untested"},
    "safety":     {"can_drive": false, "confidence": "high", "note": "do not push-start in traffic"},
    "diy":        {"class": "DIY Assisted", "note": "jump/charge ok; replace if 3yr+"},
    "cost":       {"band": "₹1200-2500", "diy_saving": 300, "note": "Exide/Amaron 12V 5Ah"},
    "trust":      {"flag": "no over-diagnosis — single likely cause", "downgraded": []}
  },
  "six_fields": {
    "why": "...", "severity": "medium", "can_drive": "...",
    "diy_class": "DIY Assisted", "cost_band": "₹1200-2500", "alternatives": "..."
  },
  "disclaimer": "server-injected"
}
```

- **Safety Agent has veto** — it can only *lower* `can_drive` confidence, never
  raise it (ROLE.md principle 5).
- **Trust Agent** can lower a fault's probability and list `downgraded` over-diagnoses;
  it can never invent a fault.
- If DeepSeek returns malformed JSON, the frontend shows an honest "Chitti could
  not diagnose this — phir se try karo," **never a fabricated verdict or score**.
- The system prompt opens with the **safety + never-claim-certainty** guardrails
  and closes by re-injecting the [server-enforced disclaimer](skills/FEATURES.md#disclaimer).
- System-prompt grounding: [skills/MECHANIC_KNOWLEDGE.md](skills/MECHANIC_KNOWLEDGE.md)
  prefixed when intent maps to a mechanic question.

## Camera Intelligence (§2b)

Dashboard / part / document / leak scans flow through `chitti_camera.js` (shared
substrate). The image is processed on-device; only a text description reaches the
model. Fake-spare-part captures (fake bearings, fake brake shoes — these *kill*
riders) feed the community-alert flywheel + annual FSSAI-style report. Per-Chitti
camera DB; user-owned; `"Chitti forget"` tombstones every row.

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

## Mode 2 — OBD2 / ELM327 (Web-Bluetooth)

For bikes with a port, the frontend pairs a ₹400 ELM327 adapter over **Web-Bluetooth**
(no native app). Live PIDs (RPM, COOLANT_TEMP, BATTERY_VOLTAGE, O2, THROTTLE,
ENGINE_LOAD, RUN_TIME, DISTANCE_W_MIL) snapshot to `POST /api/2w/obd/snapshot`
(COMING SOON, W5). Predictive table in [MECHANIC_KNOWLEDGE.md §2](skills/MECHANIC_KNOWLEDGE.md).
Mode 2 is strictly additive — Mode 1 is feature-complete without it.

## Quality stack (per [QUALITY_STATUS.md §1](../QUALITY_STATUS.md))

- **HookRegistry / VISUAL_HOOKS** — per-page cert hooks; every cert writes a 375px
  screenshot to `tools/cert_screenshots/`.
- **wrap_llm** — quadrails (input/output guard, hallucination check, disclaimer
  inject, safety downgrade) around every DeepSeek call.
- **Observability** — request/latency/error metrics; `phantom_fault` and
  `false_certainty` counters are hard-watched.
- **quadrails** — the four safety rails: (1) never-claim-certainty, (2) safety
  downgrade-on-doubt, (3) unsafe-DIY block, (4) disclaimer inject.

## Performance budget

- First paint < 1.5 s on 2G simulation; page < 250 KB excluding shared substrate.
- One DeepSeek round-trip per diagnosis (swarm batched).
- Photos/audio never re-uploaded; processed once on-device.

## Failure modes & honest degradation

| Failure | Behaviour |
|---|---|
| DeepSeek 5xx | Honest "Chitti busy hai — phir se try karo"; Layer-5 fallback surfaced, never silent |
| Malformed swarm JSON | Honest retry prompt; **no fabricated verdict or confidence** |
| Symptom too vague | One clarifying question, never a guess |
| Fault not in corpus | Route to human + fair-price band; never invents a fault |
| GPS denied (SOS) | Ask landmark; family cascade still fires on confirm |
| Brand RSA unmatched | Generic 1033 highway RSA surfaced (not auto-called) |
| Turso unreachable | SQLite local fallback (current state — see below); profile still persists locally |
| Offline | Service-worker serves last diagnosis + "offline" badge ([§5b](../SAHAYAI_MASTER.md)) |

## ⚠️ Known env-blocker — Turso (per QUALITY_STATUS 2026-05-29)

`chitti-2wheeler-api` is currently on the **local SQLite fallback**. Turso libSQL
persistence requires `DATABASE_URL` in `libsql://host?authToken=jwt` form (the
composed pattern, per [env-var patterns memory](../SAHAYAI_MASTER.md)) wired
through the [turso_http.py direct-HTTPS shim](../SAHAYAI_MASTER.md). The DB is
provisioned (2wheeler Turso DB, aws-ap-south-1). **Blocked on Sire** setting the
Railway env var. Until then, profiles persist locally but do not sync across
devices. This is the YELLOW item.

## Rollback plan

- Every feature behind a `c2w_*` flag read at boot from static config; flipping a
  flag off reverts to the prior stable surface with no deploy.
- HTML is a single static file → rollback = `git revert` of the page commit.
- Backend: Railway keeps the last green deploy; `railway rollback` reverts the
  service. No destructive DB migration owned by Bike Doctor (profile table is
  additive) → no schema rollback risk.
- COMING SOON routes already return 501, so reverting an unfinished feature is a
  no-op for the rider.

## Security

- No secrets in the page. No PII transmitted (vehicle metadata is non-PII).
- All network calls go to `chitti-vaani-api` (canonical) or `chitti-2wheeler-api`
  (parity) over HTTPS.
- Camera/photo/Bluetooth access gated by browser permission prompt + the Golden
  Rule for any side-effecting action (SOS, RSA call, document share, booking).
- SOS can **never** auto-dial 100/108/112 — hard-coded family-cascade-only.

---
> **World Class Chitti Bike Doctor — Commando Discipline. Zero Excuses.**
