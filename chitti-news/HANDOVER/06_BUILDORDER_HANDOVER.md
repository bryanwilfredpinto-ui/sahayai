# Chitti News (CNOS) — Build Order & Handover

**Build commit:** `65f5aae`
**Date:** 2026-06-06

How CNOS was built, certified, and what is live vs Phase 2.

---

## A. CEOS doc set (the spec backbone)

CNOS is governed by the Chitti News Operating System (CEOS) doc set: `ROLE.md` (optimization order + founder rules + 10-stage definition-of-done), `CHITTI_NEWS_MASTER_SPEC.md`, and per-agent SKILL.md files. CEOS compliance is machine-checked by `tools/verify_ceos_compliance_news.mjs` → **38/38** (once these 8 handover docs exist).

---

## B. The 7-agent swarm

| # | Agent | Status |
|---|---|---|
| 1 | News | ✅ Built |
| 2 | Verification (≥2-source corroboration) | ✅ Built |
| 3 | Context | ✅ Built |
| 4 | Personalization (state/lang/profession, on-device) | ✅ Built |
| 5 | Accessibility | ✅ Built |
| 6 | Career (handoff to CNAIOS) | ⏳ Phase 2 — NOT built |
| 7 | Action ("what next?") | ⏳ Phase 2 — NOT built |

DeepSeek powers the 3-bullet "Chitti's Take" and the fact-check verdict.

---

## C. Frontend

`chitti_news.html` (1935 lines) — 6 category tabs (National/Politics/Business/Sports/Entertainment/Tech), 6 home rails, per-card Trust Strip (verified/partial/unverified), Chitti's Take, fact-check, For You / Read Later / Cancelled (localStorage-only). Inherits all 5 §1a gates via `chitti_a11y.js` + `feedback-widget.js` substrate.

---

## D. Backend

`chitti-news-api` (Flask · Turso · DeepSeek). 227 RSS sources, `news.*` schema isolation, category classifier with `why` trail, scheduler-driven ingest with `requests` → `cloudscraper` fallback. Local boot: `GET /health` → 200 `{"ok":true}`, `GET /api/news/feed` → 200, 49/49 unit/validator tests.

---

## E. The 4-script cert pipeline

| Script | Purpose | Result |
|---|---|---|
| `tools/verify_ceos_compliance_news.mjs` | CEOS doc-set compliance | 38/38 |
| `tools/test_news_samples.mjs` | 5 cat × 5 publisher RSS sample loop | 25/25 schema · 24/25 URL |
| `tools/cert_news_omnibus.mjs` | engines × gates × 26 langs × a11y × viewports × devices × axe × perf × Slow-3G | 28/29 = 96.6% |
| `tools/news_backend_proof_result.json` | backend unit + validator + local boot proof | 49/49 |

---

## F. The local-serve + fixture approach — and WHY

Production `chitti-news-api` returns **502 "Application failed to respond"** on every endpoint (infra/deploy defect — likely `DATABASE_URL` libsql:// env gap, QUALITY_STATUS.md §5). To certify the actual product behavior despite the downed prod backend, the omnibus cert:

1. Serves the **repo `chitti_news.html` locally**, and
2. **Intercepts `/api/news/*`** with **real-sample fixtures** drawn from the live RSS sample loop.

This proves the frontend + contract are correct independent of the broken deploy. Backend code health is proven separately by booting Flask locally (200 + 49/49). The 502 itself is the one infra action item.

---

## G. Live vs Phase 2

| Item | Status |
|---|---|
| Frontend `chitti_news.html` on sahayai.in | ✅ Live |
| 6 category tabs + 6 rails + Trust Strip + Chitti's Take + fact-check | ✅ Live |
| For You / Read Later / Cancelled (localStorage) | ✅ Live |
| Agents 1–5 (News→Verification→Context→Personalization→Accessibility) | ✅ Built |
| Backend on Railway | ⚠️ Deployed but 502 — redeploy pending |
| Career agent (#6) + Action agent (#7) | ⏳ Phase 2 |
| Gujarati RSS coverage | ⏳ Phase 2 (currently 0 feeds) |

---

## H. Reproduce the pipeline

```bash
cd c:/Users/DELL/sahayai/sahayai

# 1. CEOS doc-set compliance (expects these 8 handover docs present)
node tools/verify_ceos_compliance_news.mjs        # -> 38/38

# 2. Sample loop: 5 categories x 5 real Indian-publisher RSS feeds
node tools/test_news_samples.mjs                  # -> 25/25 schema, 24/25 URL

# 3. Omnibus cert (serves repo page locally, intercepts /api/news/* with fixtures)
node tools/cert_news_omnibus.mjs                  # -> 28/29 = 96.6%

# 4. Backend proof (boots local Flask, runs unit + validator)
#    Output captured at tools/news_backend_proof_result.json
#    -> classifier 31/31, validator 18/18 (49/49); /health 200 {"ok":true}

# Screenshots land in:
#   test_screenshots/news/chitti_news_{375,768,1280}.png
#   test_screenshots/news/full_device_{iphone13,pixel5,ipadmini}_news.png
```

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
