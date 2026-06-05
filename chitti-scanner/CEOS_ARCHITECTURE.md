🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# CEOS_ARCHITECTURE — Chitti Universal Scanner

> The runtime topology of the Universal Scanner as a CEOS module. Subordinate to
> [CONSTITUTION.md](CONSTITUTION.md). The existing stateless label-reader backend
> ([ARCHITECTURE.md](ARCHITECTURE.md)) is retained; this document adds the **detection +
> routing + memory** layer on top of it.

## Master architecture

```
                          USER
                           │
                           ▼
                  UNIVERSAL CAPTURE
        (camera · gallery · type · voice — chitti_scanner.html)
                           │
                           ▼
                 UNIVERSAL DETECTOR  ──────────────┐
   (deterministic rules FIRST; DeepSeek vision     │  honest "unknown"
    as OPTIONAL enhancement when funded)           │  when confidence low
                           │                        ▼
        ┌──────────────────┼──────────────────┐  ask user to
        ▼                  ▼                  ▼  describe / pick
     Object            Document            Person
   Classifier         Classifier         Classifier
        └────────┬─────────┴────────┬────────┘
                 ▼                   ▼
            ROUTING ENGINE (8-agent swarm vote)
                 │
   Fashion? Mechanic? Farmer? Education? Health? Fraud?
   Food? Government? Legal? Career? Home-Repair? News?
                 ▼
          SPECIALIST CHITTI  (deep-link / Vaani intent)
                 ▼
          EXPLANATION LAYER (why this route? — 🤖 Chitti)
                 ▼
          MEMORY LAYER (Universal Memory / Life Twin)
                 ▼
          FEEDBACK LAYER (🔊 / 🤖 / 👍 / 👎 — feedback-widget.js)
```

## Layered components

| Layer | Where it lives today | State |
|---|---|---|
| **Universal Capture** | `chitti_scanner.html` (camera/gallery/type/voice) | 🟢 exists |
| **Universal Detector** | deterministic client-side classifier (`type` from backend + keyword rules) | 🟢 build now (rules); 🟡 vision LLM COMING SOON |
| **Routing Engine** | client-side routing table (`routing/routing_table.md`) → deep-link | 🟢 build now |
| **8-agent Swarm** | documented in [swarm/](swarm/); deterministic vote in v1 | 🟢 spec; 🟡 LLM-graded vote COMING SOON |
| **Explanation Layer** | 🤖 icon (feedback-widget.js) + plain-English "why this route" string | 🟢 build now |
| **Memory Layer** | `localStorage` scan history → Universal Memory timeline | 🟢 local-first; 🟡 cross-device COMING SOON |
| **Family Graph** | linked entities (Father/Vehicle/Home/…) | 🟡 local-first stub; cross-device COMING SOON |
| **Feedback Layer** | `feedback-widget.js` per-box (🔊/🤖/👍/👎) | 🟢 inherited |
| **Accessibility Layer** | `chitti_a11y.js` substrate (lang/ISL/braille/disability profile) | 🟢 inherited |

## Deterministic core, LLM enhancement (LOCKED doctrine)

The router classifies and routes using **rules** — the backend's existing `type` field
(`food` / `medicine` / `legal_doc` / `bill` / `mrp` / `insurance` / `other`) plus a
client-side keyword map (see [ROUTING_ENGINE.md](ROUTING_ENGINE.md)). This means:

- The scanner **routes correctly with DeepSeek down**. No vision-model spend for the common
  text/type path.
- The vision LLM (DeepSeek-vision, ~₹0.05–0.10/scan, user-borne, opt-in) is an
  *enhancement* that improves camera auto-detect of arbitrary objects. Until a key is
  funded, camera auto-detect returns an honest `mode: "describe_or_pick"` — never a
  fabricated category. (Same honest pattern as Mechanic's photo auto-detect.)

## Data + persistence (HONEST — read the RED note)

- **Local-first.** Scan history + Universal Memory + the local Family Graph live in the
  browser (`localStorage` / IndexedDB) and **never leave the device** unless the user
  opts into cross-device sync. DPDP Act 2023 compliant by construction.
- **Backend is stateless today.** Raw images are processed in-memory, never persisted
  server-side (see [DATABASE.md](DATABASE.md)).
- 🔴 **RED — Turso persistence unverified.** Per [QUALITY_STATUS.md](../QUALITY_STATUS.md)
  (2026-05-29 fleet audit, CTO defect #9), `chitti-scanner` was **not** covered by the
  direct-HTTPS Turso shim PR and may still run the broken embedded-replica pattern that
  silently lost writes. **Therefore: no Universal Scanner feature writes user data to the
  backend until the shim is verified on chitti-scanner.** Cross-device Memory + Family
  Graph + predictive reminders stay **COMING SOON** until then. This is a deliberate
  honest-stub gate, not an oversight.

## Camera Intelligence contract ([§2b](../SAHAYAI_MASTER.md))

Every scan captures **what / where (pincode) / when / result / user-type / satisfaction**,
anonymised before any aggregation, via the shared `chitti_camera.js` substrate. Feeds the
community-alert + annual-FSSAI flywheels. *"Chitti forget"* writes a tombstone and deletes
all captures for the user token. The Universal Scanner inherits this — it does not
hand-roll capture or storage.

## Failure modes + rollback

| Failure | Behaviour |
|---|---|
| Backend unreachable | Deterministic keyword router still classifies typed text; honest "backend offline, routed from text" notice. |
| Confidence below threshold | Category = `unknown`; ask user to describe or pick — never guess. |
| Specialist Chitti not built | Honest **COMING SOON** card + closest live help / Vaani. |
| Vision LLM unfunded | Camera auto-detect → `describe_or_pick`; never a fake object label. |
| Routed to wrong Chitti | 👎 on the route box → logged to feedback → swarm learning candidate. |

**Rollback:** the Universal Router is additive — it renders *alongside* the existing result
card. Removing the router card (one feature flag `window.CHITTI_SCANNER_ROUTER=false`)
reverts the page to the certified label-reader with zero data loss. The 5-gate substrate is
untouched.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
