# ARCHITECTURE — Chitti Car Mechanic

```
┌────────────────────────── CLIENT (browser / GitHub Pages) ──────────────────────────┐
│  chitti_car_mechanic.html  (9 tabs · 17 cards · per-response widget · sticky disc)    │
│    ├─ sahayai_design_system.css (loaded first)  + page styles (navy/tricolour/18px/48px)│
│    ├─ chitti_lang.js      → owns #lang-select, 26 langs, whole-UI auto-translate (RTL) │
│    ├─ chitti_a11y.js      → disability profile · ISL · read-page · feature discovery   │
│    ├─ feedback-widget.js  → 🔊 🤖 👍 👎 ✏️ on every [data-chitti-response]            │
│    └─ chitti_car_mechanic_engine.js  ◀── THE PRODUCT (deterministic, offline, node-testable)
│            16 modules · versioned RULES · every result {confidence,risks,sources,canDrive}│
│            state: localStorage (vault + twin) · "Chitti forget" wipes                  │
└───────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │  (enhancement only — never in critical path)
                          ┌──────────────▼───────────────┐
                          │  Vaani (chitti-vaani-api)     │  DeepSeek phrasing · live data
                          │  routes intent → this engine  │  BO11–BO15 (VAHAN/RTO, OEM parts,
                          └───────────────────────────────┘  telematics, recalls) when funded
```

## Principles
- **Rules are the product.** The engine is pure, dependency-free vanilla JS; it computes every verdict
  locally. Works with the internet down, DeepSeek 429, Turso blocked. (CEOS §12 "Open & Auditable".)
- **LLM is an enhancement.** DeepSeek (via Vaani) only *phrases/explains*; never produces a number/verdict.
- **No backend needed for core.** Per SAHAYAI §2, frontend on GitHub Pages; the thin Vaani backend is the
  integration seam for live data + LLM, not a dependency. (CEOS §33 named a Node api — superseded by the
  offline-first client engine; the api seam remains for BO11–BO15.)
- **Privacy by design.** Vault + Twin local-only; nothing leaves the device unless a future swarm path
  (anonymised, ≥100-confirmation gate) is explicitly opted into.

## Data model (Vehicle Twin, localStorage)
`{ model, odometerKm, docs:{insurance:{expiry}, puc:{expiry}, ...}, service:{engine_oil:{lastKm,lastDate},
timing_belt:{lastKm}}, battery:{installedDate}, savings:[{amount,why}], accidentFree, fullServiceHistory, loanClosed }`
