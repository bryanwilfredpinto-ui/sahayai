🎖️ **World Class Chitti Government — Commando Discipline. Zero Excuses.**

# BUILD_ORDER — Chitti Government (CEOS v1.0)

> The exact sequence to build the product, deterministic-core first. Each step lists
> what · why · file · done-when. Doctrine: **rules are the product, the LLM is an
> enhancement** — every engine works offline before any DeepSeek call is wired.

## Guiding rules
- Deterministic engine before LLM phrasing.
- Preserve the existing working substrate: `chitti_lang.js` 26-lang dropdown + the 5
  frontend gates already pass on `chitti_government.html`. **Extend, never replace.**
- No fake data: a scheme with no source is not shipped; a feature with no engine is a
  COMING SOON card, never a fake demo.

---

## B0 — Data foundation
| # | What | File | Done when |
|---|---|---|---|
| B0.1 | Expand catalog 30 → ~100 schemes, 13 categories, each with `source_url` + `status` + `last_verified` + structured eligibility rules | [backend/data/schemes_seed.json](backend/data/schemes_seed.json) | JSON valid; every scheme has source+status; engine can read eligibility rules |
| B0.2 | Document → scheme map + 19 canonical documents | embedded in seed + [DATABASE.md](DATABASE.md) | each scheme lists `documents_required[]` |

## B1 — Deterministic engines (client-side, offline)
| # | Engine | Why | Done when |
|---|---|---|---|
| B1.1 | **Eligibility** — rule-engine over Citizen Twin → verdict + per-rule trace | PRD F1, never guesses | gold cases pass; missing input → `unknown` |
| B1.2 | **Citizen Readiness Score** — Documents% · Schemes-claimed% · Benefits-missed · Readiness% | PRD F8, the headline metric | computes from Twin deterministically |
| B1.3 | **Life-Event Engine** — event → {documents, schemes, registrations, deadlines} | PRD F3, the moat | 12 events return ordered bundles |
| B1.4 | **Deadline Engine** — recurring deadlines + 90/30/7-day reminders | PRD F7 | reminders confirm-gated |
| B1.5 | **Government Fraud Shield** — message → verdict + reason + confidence + report channel | PRD F6, safety | 8 pattern families; ends with 1930/cybercrime/Chakshu; never auto-dials |

## B2 — Frontend (extend chitti_government.html)
| # | What | Done when |
|---|---|---|
| B2.1 | New tabs: Readiness · Life Events · Deadlines · Fraud Shield (+ existing Eligibility/Catalog/Checklist/Form/Alerts/Status/Locator/Documents/Profile) | tabs render, panels switch |
| B2.2 | Each new panel = `data-chitti-response` box (per-response widget auto-attaches) | 5 gates pass on new boxes |
| B2.3 | Wire engines B1.* to the panels; voice-out + icon + word labels | works @375px, sound-off, voice-only |
| B2.4 | Preserve `#lang-select` + chitti_lang.js auto-translate over all new copy | dropdown translates new tabs across 26 langs |
| B2.5 | Golden-Rule confirm gate on reminder-set + portal-open + form-send | no side-effect without explicit Yes |

## B3 — Backend endpoints (deterministic, mirror client engines)
| # | Endpoint | File | Note |
|---|---|---|---|
| B3.1 | `POST /api/government/readiness` | [backend/routes/government.py](backend/routes/government.py) | server twin echo of B1.2 |
| B3.2 | `POST /api/government/life-event` | services/government_life_event.py | B1.3 map |
| B3.3 | `POST /api/government/fraud-check` | services/government_fraud.py | B1.5 patterns |
| B3.4 | `GET /api/government/deadlines` | reuse profile | B1.4 |
| B3.5 | Keep existing eligibility/catalog/checklist/form/alerts/status/locator endpoints | — | unchanged |

## B4 — Quality + cert
| # | What | Done when |
|---|---|---|
| B4.1 | Eligibility + fraud gold datasets | [evals/datasets/](evals/datasets/) | deterministic runners green |
| B4.2 | Playwright cert (tools/cert_government.mjs) — 5 gates + 26-lang sweep + 375/768/1280 | mirrors cert_fashion.mjs |
| B4.3 | Backend Flask test client — new endpoints 200 + correct verdicts | tests green |

## B5 — Ship
Commit + push (per [feedback_commit_push_immediately]); update
[QUALITY_STATUS.md](../QUALITY_STATUS.md) + [SAHAYAI_MASTER §4](../SAHAYAI_MASTER.md);
honest status (deterministic measured, LLM `AUTOMATION-LIMITED`).

---

## Dependency graph
```
B0 (data) ──► B1 (engines) ──► B2 (frontend) ──► B4 (cert) ──► B5 (ship)
                   └──────────► B3 (backend) ────┘
```
Critical path is B0 → B1 → B2. Backend (B3) parallels frontend once engines exist.

---
> **World Class Chitti Government — Commando Discipline. Zero Excuses.**
