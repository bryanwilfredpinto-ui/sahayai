# Chitti Car Mechanic — CEOS v1.0

**A 24/7/365 voice-first car-ownership mechanic for EVERY Indian car owner** — built for the
blind, deaf, mute and illiterate, the livelihood driver (Ola/Uber/delivery/fleet) and the
vernacular family. Free. No sign-up. Works offline. 26 languages.

> Built on the platform contract in [`../SAHAYAI_MASTER.md`](../SAHAYAI_MASTER.md) §2 (locked decisions)
> and the per-Chitti standard in [`../CHITTI_SOP.md`](../CHITTI_SOP.md). This product passed the
> pre-CEOS **Master Product Validation** gate at **Build Score 82.5/100 → BUILD**
> ([PRODUCT_JUSTIFICATION.md](PRODUCT_JUSTIFICATION.md)).

## Doctrine (non-negotiable)
- **Rules are the product. The LLM (DeepSeek) is an enhancement, never a dependency.** Every verdict,
  rupee band, date, score and triage colour is computed in [`../chitti_car_mechanic_engine.js`](../chitti_car_mechanic_engine.js)
  from the user's own inputs + versioned rule tables — never invented by an LLM. Works with the
  internet down, DeepSeek 429 and Turso blocked.
- **Safety is supreme. Calibrated honesty is a hard gate.** Safety-critical systems are NEVER
  Safe-DIY; every diagnostic carries `{confidence, canDrive, risks[], sources[]}`; low confidence →
  "I'm not sure — see a mechanic"; **emergency = family cascade, Chitti never auto-dials**.
- **Four-user contract + per-response widget + Vaani language dropdown** on every box, every card.

## What's in this folder
| File | Role |
|---|---|
| [PRODUCT_JUSTIFICATION.md](PRODUCT_JUSTIFICATION.md) | Pre-CEOS validation (8 phases, Build Score 82.5 → BUILD) |
| [RESEARCH_BEST_APPS.md](RESEARCH_BEST_APPS.md) | 20 apps + 20 AI apps reference study |
| [CONSTITUTION.md](CONSTITUTION.md) | 12 articles, each mapped to code/UI |
| [ROLE.md](ROLE.md) · [PRODUCT_VISION.md](PRODUCT_VISION.md) · [PERSONAS.md](PERSONAS.md) · [SUCCESS_METRICS.md](SUCCESS_METRICS.md) | identity, vision, 11 personas, metrics |
| [PRD.md](PRD.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [SKILLS.md](SKILLS.md) · [SOP.md](SOP.md) | requirements, architecture, 12 skills, 10 SOPs |
| [GUARDRAILS.md](GUARDRAILS.md) · [EVALS.md](EVALS.md) · [OBSERVABILITY.md](OBSERVABILITY.md) · [SWARM.md](SWARM.md) · [MEMORY.md](MEMORY.md) | safety, tests, monitoring, swarm, state |
| [ACCESSIBILITY.md](ACCESSIBILITY.md) | 4-user + 9 profiles + 5-element widget + 26 langs |
| [BUILD_ORDER.md](BUILD_ORDER.md) | BO1–BO10 **+ my researched additions** |
| [QUALITY_GATES.md](QUALITY_GATES.md) · [CERTIFICATION.md](CERTIFICATION.md) | G0–G10 + cert status |
| [CEOS_TRACEABILITY.md](CEOS_TRACEABILITY.md) | **every CEOS §1–§42 → exact code/UI location** (Sire's "show me where" rule) |
| [skills/FEATURES.md](skills/FEATURES.md) | capability surface parsed live by `chitti_features.js` |

## Where the product actually lives (code)
| Artifact | Path |
|---|---|
| Deterministic engine (16 modules) | [`../chitti_car_mechanic_engine.js`](../chitti_car_mechanic_engine.js) |
| Frontend (9 tabs, Vaani lang dropdown, 5-element widget) | [`../chitti_car_mechanic.html`](../chitti_car_mechanic.html) |
| Engine gold test (79 assertions) | [`../tools/test_car_mechanic.mjs`](../tools/test_car_mechanic.mjs) |
| Live Playwright cert (35 checks, 5 device screenshots) | [`../tools/cert_car_mechanic.mjs`](../tools/cert_car_mechanic.mjs) |
| Screenshots (1920·1366·iPad·iPhone·Android) | [`../tools/cert_screenshots/chitti_car_mechanic_*.png`](../tools/cert_screenshots/) |

## Reproduce the proof
```
node tools/test_car_mechanic.mjs     # → PASS 79 · FAIL 0
node tools/cert_car_mechanic.mjs      # → 41/41 GREEN  (writes 5 device screenshots)
```

## Honest status (no fake "done")
- **Engine + page + tests + cert: GREEN, in repo, reproducible.** Deterministic core needs no
  LLM/network.
- **Honest COMING SOON** (visible, never faked): live VAHAN/RTO history fusion, camera CV
  (dashboard-light/damage), DeepSeek plain-language phrasing, live insurance/maps APIs, WhatsApp/SMS
  reminder delivery. Blocked on Sire's DeepSeek funding + data partnerships + the org Turso quota.
- **Remaining for Sire:** real iPhone/Android hardware sign-off (everything else automated here).
