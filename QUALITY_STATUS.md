# QUALITY_STATUS.md — Enterprise Quality Audit (final baseline)

**Generated:** 2026-05-14 · **Updated:** 2026-06-03 (chitti-news-ai v0.3 Intelligence Aggregator shipped — rules-only classifier passes 12/13 professions, 7 streams live, 6/6 fail-open tests, boot-time ingest serves real data from a cold container in ~60s) · **Auditor:** Claude Opus 4.7 (1M context) ·

## 2026-06-04 PM — Chitti Mechanic — full QA pass: 2 real bugs found + fixed → 0 issues

**Trigger:** Sire — broken live render + "run the app, test every page/button/form, check the
console, responsive, Playwright e2e, fix all, repeat until zero, give a QA report."

Built [tools/qa_mechanic.mjs](tools/qa_mechanic.mjs) (Playwright, self-serving, network mocked):
both pages × 3 viewports (375/768/1280) + console/page/network-error capture + render sanity +
tab nav + 5 box-elements + i18n switch + form persistence + Swarm + Scam flows. Report:
[CHITTI_MECHANIC_QA_REPORT.md](CHITTI_MECHANIC_QA_REPORT.md).

**2 real bugs caught + fixed** (3 iterations → 0 issues):
1. **Observability CORS** — `chitti_observability.js` POSTed telemetry cross-origin to
   `chitti-shares-api` (no CORS header) → console errors + false "Degraded" on every non-shares
   page. Fixed: remote telemetry now **opt-in** (`OBS_REMOTE` / `window.CHITTI_OBS_API`); badge runs
   100% locally. Fleet-wide fix.
2. **`ReferenceError: strFor is not defined`** — KYV render called bare `strFor()` (helper is
   `strFor2W`/`strFor4W`); crashed whenever a saved vehicle's KYV card rendered. Fixed in both pages.

(2 further "form" findings were harness artifacts — invalid `<select>` option values — corrected.)

**Final: `QA_RESULT:{"issues":0}`** — 0 console/page/network errors, responsive clean, all
tabs/forms/flows functional, 18 response boxes carry the 5 mandatory elements, i18n applies.
Plus cert_mechanic 24/24 + backend 24/24+22/22. Remaining: legacy §5-Hinglish sweep (MECH-7),
live curl (MECH-4, Sire-blocked), Inspector/Passport UI (MECH-6).

## 2026-06-04 PM — Chitti Mechanic — MECH-5 closed: Doctor backends LIVE (deterministic)

**Trigger:** Sire — "Close MECH-5."

Turned the five `501` stubs into LIVE deterministic endpoints on BOTH backends — no DeepSeek,
no network, no LLM in any route. The only LLM-needed parts (photo auto-detect of a dashboard light,
audio classification of a sound) return an honest `mode:"pick_or_describe"` (HTTP 200, never a
fabricated result) — the deterministic "pick from the list / describe it" path is fully live.

| Feature | Routes (per product, `/api/2w` + `/api/4w`) | Proof |
|---|---|---|
| Dashboard Doctor | `GET /dashboard/lights` · `POST /dashboard/check` (red-line lights force can-drive=false; colour always paired with a WORD label) | deterministic KB |
| Sound Doctor | `GET /sound/catalogue` · `POST /sound/check` (2–4 ranked candidates + diy-tier + cost band) | deterministic KB |
| OBD2 | `POST /obd/snapshot` (decodes DTCs via `_DTC`, flags volts/coolant/fuel-trim; coolant>110°C → no-drive) | deterministic |
| Used-Vehicle Inspector | `GET /inspect/checklist` (~100 points) · `POST /inspect/score` (critical fail → avoid; weight-scored buy/caution/avoid) | deterministic |
| Vehicle Health Passport | `POST /passport/event` · `GET /passport` · `GET /passport/trust-score` (`PassportEvent` model + Trust Score 0–100) | persisted (local SQLite until Turso env) |

New files: `chitti-{2,4}wheeler/backend/routes/doctor.py` + `services/doctor_data.py`; `PassportEvent`
added to each `models/`. **Backend tests: 24/24 (2w) + 22/22 (4w) green** via Flask test client
(independently re-run by CTO). `skills/FEATURES.md` updated (5 features moved to "Built"). Every
diagnostic carries a `confidence` band; safety red-lines force can-drive=false. UI wiring of the new
Inspector/Passport screens tracked as MECH-6 (CTO, no blocker).

## 2026-06-04 — Chitti Mechanic — CTO gates certified (cert 22/22 · tests 32/32)

**Trigger:** Sire — "Complete your job." (close the CTO-owned, no-Sire-blocker gates).

Ran the CTO-owned quality gates for both products. **54/54 checks green.** Control Panel:
[CHITTI_MECHANIC_CONTROL_PANEL.md](CHITTI_MECHANIC_CONTROL_PANEL.md) §B/§I.

| Gate | Result | Artifact |
|---|---|---|
| Visual cert (Playwright, 375/768/1280, both pages) | 🟢 **22/22** | [tools/cert_mechanic.mjs](tools/cert_mechanic.mjs) — self-serving; 5 frontend gates + Swarm card 5-elements + tap targets + **runtime i18n proof** (en→ta title renders `🧠 ஸ்வார்ம் பரிசோதனை`, zero Hinglish) |
| Real 375/768/1280 screenshots | 🟢 6 full-page + 2 swarm-card crops | [tools/cert_screenshots/](tools/cert_screenshots/) `chitti_2wheeler_*.png` · `chitti_4wheeler_*.png` |
| Frontend logic + §5 regression | 🟢 **18/18** | [tools/test_mechanic.mjs](tools/test_mechanic.mjs) — 387 i18n keys verified ×9 bags; swarm parse/tier/fallback fixtures; 0 Hinglish literals |
| Backend routes (Flask test client) | 🟢 **7/7 + 7/7** | `chitti-{2,4}wheeler/backend/test_routes.py` — /health 200, DTC, breakdown (**family-cascade-never-cops** asserted), maintenance, honest 501 |

CTO 8-gate status now **6/8 GREEN** (code+unit ✅ · integration ✅ · /health ✅ · visual cert ✅ ·
5 elements ✅ · daily report ✅); gate 3 (live deploy re-verify) 🟡; gate 5 (live Vaani-routed
answer curl) ❌ **blocked on Sire** — Vaani relevance-rail allowlist for mechanic intent + DeepSeek
funding. MECH-1/2/3 closed; MECH-4 is the only remaining item and it is Sire-blocked.

## 2026-06-03 — Chitti Mechanic (Auto OS) rebuilt — CEOS + CQOS doc set + Swarm Diagnosis UI

**Trigger:** Sire — "Redo Chitti-2wheeler & chitti-4wheeler completely, including the html. Prepare read/skills/sops etc. under the CEOS framework. Quality is its own pillar (CQOS)."

Both products elevated from a 5-doc skeleton to the full **chitti-fashion CEOS bar**, plus Sire's
**CQOS** (Chitti Quality Operating System). Umbrella spec:
[CHITTI_MECHANIC_MASTER_SPEC.md](CHITTI_MECHANIC_MASTER_SPEC.md) (Chitti Auto OS — Bike Doctor +
Car Doctor; EV Doctor / Fleet Doctor on the roadmap as honest COMING SOON).

| Proof | Result |
|---|---|
| CEOS doc set per product (57 files each) | 🟢 ROLE · PRODUCT_VISION · PERSONAS · SUCCESS_METRICS · PRD · ARCHITECTURE + `skills/ sop/ swarm/ guardrails/ evals/ observability/ memory/ accessibility/` |
| 8-agent diagnostic SWARM | 🟢 documented per product (Symptom · Engine · Electrical · Fuel · **Safety (supreme)** · DIY · Cost · **Trust**); weighted-vote verdict; "confidence low → recommend inspection" when agents disagree |
| CQOS 5 quality layers | 🟢 eval designs authored: Diagnostic ≥90% · **Safety =100% (critical errors=0)** · DIY-safety unsafe-recs=0 · Cost ≥85% · Hallucination <1% · Accessibility=100% (+sound honesty) |
| Mechanic Verification Loop | 🟢 spec'd (`observability/mechanic_verification_loop.md`) — predicted-vs-actual closes the learning loop |
| Vehicle Twin + Health Passport | 🟢 spec'd (`memory/`) — Vehicle Trust Score on resale (patent-level) |
| HTML — **CEOS Swarm Diagnosis card** on both pages | 🟢 [chitti_2wheeler.html](chitti_2wheeler.html) + [chitti_4wheeler.html](chitti_4wheeler.html): symptom (voice/type) → 8-agent confidence-vote bars + six-field verdict (Why/Severity/Can-drive/DIY-tier/Cost/Alternatives) + **Scam Shield** quote-checker; honest "confidence low" fallback (never fabricates a verdict); inline-script syntax validated via `node` |
| 5 frontend gates | 🟢 inherited via `chitti_a11y.js` substrate; new boxes carry `data-chitti-response` (G1) — **re-cert pending** next deploy |

**Honest CQOS status:** the quality *contract* now exists (gates, eval set designs, swarm,
verification loop). The *numbers are not yet measured* — that needs the labelled eval sets run
against live `chitti-vaani-api`, which is **BLOCKED** on the same standing backend issue as Chitti
Fashion: DeepSeek 429/funding **and** the Vaani relevance-rail returning mechanic intent as
`off_topic`. We do **not** claim a diagnostic-accuracy number until the harness runs. Honest stubs
over fake demos.

**Standing blockers for CTO:** (1) Vaani relevance-rail allowlist for mechanic intent + DeepSeek
funding (unblocks the Swarm Diagnosis live answers + the eval numbers); (2) Turso `DATABASE_URL`
(libsql:// form) on chitti-2wheeler / chitti-4wheeler Railway services — both still fall back to
local SQLite per the 2026-05-29 fleet audit.

## 2026-06-03 — Chitti Fashion CFOS v1.0 built + certified (proof, not architecture)

**Trigger:** Sire — "Finish the product. Return with proof, not architecture updates."

Real Playwright cert + eval harness against a locally-served copy of the rebuilt
`chitti_fashion.html` + live `chitti-vaani-api`. Full report:
[chitti-fashion/CERTIFICATION_REPORT.md](chitti-fashion/CERTIFICATION_REPORT.md).

| Proof | Result |
|---|---|
| Responsive cert ([tools/cert_fashion.mjs](tools/cert_fashion.mjs)) | 🟢 **14/14** — real screenshots @375/768/1280 |
| 5 frontend gates G1–G5 | 🟢 all pass (G3 disability modal visually confirmed) |
| 5 user journeys ([tools/cert_fashion_journeys.mjs](tools/cert_fashion_journeys.mjs)) | 🟢 **5/5** — wardrobe-memory roundtrip + blind/deaf/illiterate paths; screenshots saved |
| Accessibility eval ([tools/fashion_eval_harness.mjs](tools/fashion_eval_harness.mjs), 100 cases) | 🟢 **100/100 (100%)** deterministic vs live DOM |
| **Fashion accuracy — DETERMINISTIC engine, 1000 gold cases** | 🟢 **91.6% exact / 99.3% within-1-band · harmony 96.9% · season 98.4%** ([tools/fashion_gold_eval.mjs](tools/fashion_gold_eval.mjs), no LLM) |
| Hallucination | 🟢 ~0 — engine never emits a non-owned item by construction |
| 8 CTO quality layers + Digital Twin | 🟢 all delivered — engine ([chitti_fashion_engine.js](chitti_fashion_engine.js)): classify/judge/confidence/explain/simulator/ROI; Digital Twin profile on-device |
| Outfit Simulator / Wardrobe ROI / Confidence | 🟢 wired into page — hero renders real outfits + "Confidence 100%" **with DeepSeek down** (`engine_hero_deterministic.png`) |
| LLM phrasing *enhancement* | ⛔ DeepSeek 429 + Vaani relevance-rail off_topic — **no longer gates core value** (engine carries it); backend fix in `chitti-vaani-api` |
| Observability dashboard | 🟢 [chitti_fashion_dashboard.html](chitti_fashion_dashboard.html) shows real gold numbers |

CFOS operating system: 62 docs under [chitti-fashion/](chitti-fashion/) + deterministic engine.
**Doctrine applied (from chitti-news-ai):** rules are the product, LLM is an enhancement.
The fashion-accuracy number is now REAL and LLM-independent.

## 2026-06-03 — chitti-news-ai v0.3 Intelligence Aggregator LIVE

**Pivot:** From a 4-tab "AI explains one article" reader → a **per-profession career-intelligence aggregator** (CHITTI_NEWS_AI_MASTER_SPEC v0.3 §2 doctrine: *"News is the product. Career intelligence is the product. LLMs are enhancements, not dependencies."*)

**What shipped LIVE on `chitti-news-ai-api-production.up.railway.app`** (curl-verified 2026-06-03):

| Surface | State |
|---|---|
| Rules-only deterministic classifier | 🟢 LIVE — no LLM in critical path; CI-forbidden via static scan |
| 7 aggregation streams under unified `/api/news-ai/feed/<stream>` | 🟢 LIVE — news · courses · cert · tool · job · scheme · roadmap_node |
| 13 profession registry + 250-row hand-labelled benchmark | 🟢 LIVE — 12/13 PASS F1 ≥ 0.85 |
| Frontend `🎯 For You` view + 5 per-stream tabs (Certs · Tools+ · Jobs · Schemes · Roadmaps) | 🟢 LIVE on [chitti_news_ai.html](chitti_news_ai.html) |
| Per-card "ℹ Why this matters" explainability disclosure | 🟢 LIVE — shows category + confidence + matched_keywords + source_signals + rule_version |
| Boot-time ingest + 6h scheduler refresh + 1h classify sweep | 🟢 LIVE — production serves classified data within ~60s of cold start |
| Fail-open contract (works with every LLM provider offline) | 🟢 LIVE — 6/6 CI tests pass with all LLM env vars stripped |
| Original 4-tab base (AI Aaj / Tools / Bharat AI / Prashikshan) | 🟢 LIVE — untouched per the 2026-05-23 minimal-product lock |

**Curl proof (all 7 streams responding live):**

```
$ for stream in news courses cert tool job scheme roadmap_node; do
    curl -s ".../api/news-ai/feed/$stream?n=3" | jq .count
  done
news: 3 · courses: 3 · cert: 3 · tool: 3 · job: 3 · scheme: 3 · roadmap_node: 3
```

**Source corpus (live ingest):**
3,622 courses (Microsoft Learn + 7 manifests) + 122 stream items (RemoteOK live RSS + WeWorkRemotely + Remotive + cert/tool/scheme/roadmap manifests) + RSS news pipeline (unchanged).

**Commits (10) on `main`:** `b1daa2f` (spec v0.3) → `ac3ee28` (Phase 0) → `1fa613a` (rule tuning) → `46f680c` (5 streams) → `a629f4c` (enhancement + frontend) → `4dbafa0` (boot ingest + per-stream tabs + 2 more job RSS).

Per-Chitti report: [`chitti-news-ai/PHASE_0_BENCHMARK.md`](chitti-news-ai/PHASE_0_BENCHMARK.md).

---
**Trigger:** Sire 2026-06-02 — "why am I not getting full news loaded in Chitti News in all languages".

## 2026-06-02 PM — chitti-news language-coverage fixed end-to-end

**Root cause:** Strict `Article.language == language` filter in `news_db.feed()` + shallow regional RSS coverage (1-3 publishers per language vs MSN India's 15-20). Non-en/non-hi users saw empty feeds with no explanation.

**Fix shipped (commit `d3b21e9`):**

| Layer | Change |
|---|---|
| Source registry | +30 regional publishers added across two probe rounds (WordPress `/feed` + cloudscraper + `<link rel=alternate>` discovery). [tools/probe_regional_feeds.py](tools/probe_regional_feeds.py) + [tools/probe_v2_cloudscraper.py](tools/probe_v2_cloudscraper.py) committed for repeat runs. |
| Ingest path | [`news_ingest._http_get`](chitti-news/backend/services/news_ingest.py) is now a two-stage fetcher (requests → cloudscraper fallback). Cloudflare-protected publishers (Saamana, Prajavani, Rozana Spokesman) now ingestable in prod. `cloudscraper==1.2.71` added to requirements, lazy-imported. |
| Source seed | [`news_seed.seed_sources_if_empty`](chitti-news/backend/services/news_seed.py) rewritten as idempotent UPSERT — was empty-only check, so new sources.json rows never reached prod DB on redeploy. |
| App-API dispatch | `json+`-prefixed `rss_url` routes to `_fetch_source_json` reading per-slug config at [`data/json_configs/<slug>.json`](chitti-news/backend/data/json_configs/README.md). File-based config = zero schema migration. Ready for Sire's mitmproxy captures of Eenadu / Daily Thanthi / Sandesh / Divya Bhaskar. |
| Feed response | [`news_db.feed()`](chitti-news/backend/services/news_db.py) embeds `coverage: {per_category, total_in_language, available_categories, english_fallback_count}`. Empty feeds now narrate honestly *"No mr stories yet for mh — 42 English stories available, tap to switch"* or *"No business stories in MR today. Available: national, state."* |

**Per-language source-count delta (enabled):**

| Lang | Before | After | Δ |
|---|---|---|---|
| ta Tamil | 2 | 8 | +6 |
| te Telugu | 3 | 7 | +4 |
| ml Malayalam | 6 | 11 | +5 |
| or Odia | 1 | 5 | +4 |
| kn Kannada | 1 | 4 | +3 |
| mr Marathi | 4 | 6 | +2 |
| bn Bengali | 3 | 5 | +2 |
| pa Punjabi | 6 | 7 | +1 |
| ur Urdu | 1 | 3 | +2 |
| en (state-level) | 50 | 53 | +3 |
| gu Gujarati | 3 | 3 | 0 (app-API only — awaiting Sire's mitmproxy capture) |
| hi Hindi | 18 | 18 | 0 (already deep) |

**Standing gap:** Gujarati. Every Cloudflare-bypass + feed-discovery probe came back empty — Sandesh / Divya Bhaskar / ABP Asmita / VTV have no public RSS at all. Path forward: Sire captures the Sandesh app's API via mitmproxy, drops the URL into sources.json with `json+` prefix + a config in `data/json_configs/`.

---



## 2026-05-29 PM — Fleet audit + chitti-pa skeleton ships

**Highest-priority RED closed.** CTO.md P0 defect #1 (chitti-pa folder missing) — fixed in commit `1e742e2`:

- `chitti-pa/README.md` + `SKILLS.md` + `SOP.md` (founder template per [chitti-cto/SOP.md](chitti-cto/SOP.md) §"NEW CHITTI .md SET")
- `chitti-pa/backend/main.py` — Flask app, `/health` returns `{"chitti":"chitti-pa","ok":true}` HTTP 200, 9 honest `501 not_implemented` stubs for Phase 1 features (morning brief · calls · vault · schemes · daily life · truth · safety · forget). Each stub returns `{"feature":"…","master_spec_section":"§X"}` so the contract is committed and visible — never 404, never silent.
- `chitti-pa/backend/{requirements.txt · runtime.txt · Procfile · railway.json}` — Railway-deployable today; `DATABASE_URL` falls back to local SQLite until Sire provisions Turso.
- Local smoke-test: `/health` 200 · `/` 200 · 2× POST stubs 501 with proper JSON · 404 handler clean.

**New finding — fleet audit P0:** chitti-ca / chitti-legal / chitti-upi / chitti-scanner were NOT covered by the 2026-05-29 AM Turso direct-HTTPS shim PR. They may still be on the broken `libsql_experimental` embedded-replica pattern. Silent-write-loss risk. Verification + remediation queued as CTO.md defect #9.

**Audit summary — 15 Chittis (truth-source: 2026-05-29 entries):**

| Bucket | Count | Members |
|---|---|---|
| 🟢 GREEN (Turso restart-survival proven) | 5 | vaani · news · shares · government · medupi |
| 🟡 YELLOW (env-var blocker — CTO blocked on Sire) | 5 | news-ai · 2wheeler · 4wheeler · voice-factory · founder |
| 🟡 YELLOW (Turso shim coverage UNVERIFIED — silent-write-loss risk) | 4 | ca · legal · upi · scanner |
| 🟡 YELLOW (honest stub by design) | 1 | logo-video |
| 🔴 RED (folder missing from fleet) | +2 not-in-15 | chitti-pa ✅ NOW SCAFFOLDED · chitti-business |

End-state commit on `main`: `1e742e2`.

---



## 2026-05-29 — Turso persistence root-cause + fleet-wide fix

**Root cause uncovered:** The libsql_experimental embedded-replica pattern (per `project_turso_embedded_replica_pattern`) was silently losing every write across the fleet. SQLAlchemy wrote to `/tmp/<chitti>.db` via stdlib sqlite3, producing WAL frames libsql could not push back to Turso (`wal_insert_begin failed` in Railway logs). Container restart wiped /tmp. ZERO tables existed on any Chitti's Turso REMOTE despite months of "successful" deploys.

**Fix shipped:** `backend/lib/turso_http.py` (380-line PEP-249 DBAPI shim) vendored into 10 backends. Talks directly to Turso `/v2/pipeline` over HTTPS with HTTP/1.1 keepalive. Plugged into SQLAlchemy via `create_engine("sqlite://", creator=...)`. No local file. No background sync. Every commit() lands on Turso REMOTE before returning. Container restart preserves every row. See `[[project-turso-direct-https-shim]]`.

**Restart-survival proven** (sample row before → after `railway redeploy`):
- chitti-vaani: `feedback_log` count 1 → 1 (id=1) + 8 tables on Turso
- chitti-news: articles 6→6, sources 218→218 + 7 tables
- chitti-shares: stocks 159→159 + 16 tables (16× boot speedup from keepalive)
- chitti-government: schemes 12→12 + 7 tables
- chitti-medupi: medicines 1000→1000, jan_aushadhi 175→175 + 18 tables (replaced the "tactical bypass" mentioned in row above)

**Env-var blockers (CTO blocked on Sire — needs `turso auth login` in WSL OR direct paste):**
chitti-news-ai · chitti-2wheeler · chitti-4wheeler · chitti-voice-factory · sahayai (chitti-founder). Code is deployed and correct on all 5; falls back to local SQLite until `DATABASE_URL` is set to a real `libsql://...?authToken=...`.

End-state commits on `main`: `7d8e65e` … `f233653` (8 commits).

---

## Phase B 2026-05-23 — curl-verified GREEN ✅

**chitti-medupi-api Health File endpoints (all 8) now production-verified:**

| Endpoint | HTTP | Result |
|---|---|---|
| `GET /api/health-file/health` | 200 | `v3-phase-b2-2026-05-24` |
| `POST /api/health-file/profiles` | 200 | Returns row with id |
| `GET /api/health-file/profiles?user_token=X` | 200 | Returns the just-created row (write-read roundtrip GREEN) |
| `GET /api/health-file/quota` | 200 | 500 MB ceiling enforced |
| `POST /api/health-file/vitals` | 200 | BP / sugar / weight logging works |
| `GET /api/health-file/vitals` | 200 | Read-back GREEN |
| `POST /api/health-file/translate` | 200 | Hindi → 13 Indian languages via DeepSeek |
| `GET /api/health-file/export/doctor-pdf` | 200 | `application/pdf · 2882 bytes · %PDF-1.4` |

**Theme:** Indian flag colors (`#FF9933` / `#138808` / `#000080`) live across all 4 redesigned Chitti pages via `chitti_theme.css` (now remaps `--sds-*` token namespace too). 0 purple residue.

**5-element coverage:** Every output card on `chitti_2wheeler` / `chitti_4wheeler` / `chitti_fashion` / `chitti_news_ai` carries `.chitti-response` class or `[data-chitti-response]` attr — `feedback-widget.js` auto-attaches 🔊 / 🤖 / 👍 / 👎 + per-box feedback panel.

**Deferred:** Turso production write traffic — see [chitti-medupi/ARCHITECTURE.md §9](chitti-medupi/ARCHITECTURE.md). Tactical libsql replica bypass deployed; data ephemeral across Railway redeploys; revisit when DAU > 100.

End-state commit on `main`: `33b5372`.

---

## Legend

| Mark | Meaning |
|------|---------|
| 🟢 GREEN  | Substrate present **AND** invoked at every call site. Production curl confirmation lands after the next Railway deploy. |
| 🟡 YELLOW | Substrate present, call sites mostly wired, one or more honest gaps remaining (background judge, agent-tool loop, stub product). |
| 🔴 RED    | Substrate missing or never invoked at any call site. |
| ⚪ N/A    | Not applicable to this backend (no LLM path, intentional stub, etc.). |

**Honesty note:** I cannot curl `*-production.up.railway.app` from this dev environment,
so the GREEN marks below are *code-level wired*, not *production curled*.
The headers + audit rows light up on the next deploy. Production
verification protocol is §5; flip the green to bold once a backend passes
all three curl checks.

---

## 1. Per-backend matrix — seven audit axes (six backend + one frontend)

Run on the post-commit-#1 tree (HookRegistry registered + `wrap_llm`
wired into every previously-raw DeepSeek service across the 15 backends).
**FRONTEND_QUALITY column added 2026-05-15** — every Chitti page must pass the five-gate audit in §1a before the column flips to 🟢. All pages **🔴 RED until verified** per [SAHAYAI_MASTER.md §7](SAHAYAI_MASTER.md) accessibility contract.

| BACKEND | OBSERVABILITY | QUADRAILS | wrap_llm | SLA_TIMING | SWARM | RAW_DEEPSEEK_CALLS | FRONTEND_QUALITY (see §1a) | STATUS |
|---------|--------------|-----------|----------|------------|-------|--------------------|----------------------------|--------|
| chitti-medupi        | 🟢 main.py:161 | 🟢 main.py:163 | 🟢 medupi_recognition.py:185–193 (`compliance_inject=False` for vision JSON; DeepSeek vision since 2026-05-15 — Anthropic SDK removed per §2 lock) | 🟢 main.py:168 | 🟢 lib/swarm.py + founder cron Sun 09:00 IST | ⚪ wrapped | 🔴 `chitti_medupi.html` — 5-gate audit pending | **GREEN ✅ curl-verified 2026-05-15** |
| chitti-vaani         | 🟢 main.py:152 | 🟢 main.py:154 | 🟢 vaani_service.py:180–186 | 🟢 main.py:159 | 🟢 | ⚪ wrapped | 🔴 `chitti_vaani.html` — 5-gate audit pending (USER-CANONICAL per §2 row 1) | **GREEN ✅ curl-verified 2026-05-15** |
| chitti-ca            | 🟢 main.py:69  | 🟢 main.py:71  | 🟢 ca_service.py:119–125 | 🟢 main.py:76 | 🟢 | ⚪ wrapped | 🔴 `chitti_ca.html` — 5-gate audit pending | **GREEN ✅ curl-verified 2026-05-15** |
| chitti-legal         | 🟢 main.py:69  | 🟢 main.py:71  | 🟢 legal_service.py:116, :398 (`compliance_inject=False` for explain_notice JSON) | 🟢 main.py:76 | 🟢 | ⚪ wrapped | 🔴 `chitti_legal.html` — 5-gate audit pending | **GREEN** |
| chitti-government    | 🟢 main.py:159 | 🟢 main.py:161 | 🟢 government_deepseek.py:193–199 | 🟢 main.py:166 | 🟢 | ⚪ wrapped | 🔴 `chitti_government.html` — 5-gate audit pending | **GREEN** |
| chitti-news          | 🟢 main.py:124 | 🟢 main.py:126 | 🟢 news_summary.py:147–153 + news_explain.py:118–124 | 🟢 main.py:131 | 🟢 | ⚪ wrapped | 🔴 `chitti_news.html` — 5-gate audit pending | **GREEN** |
| chitti-voice-factory | 🟢 main.py:124 | 🟢 main.py:126 | ⚪ no DeepSeek service path in v1 (STT/TTS only) | 🟢 main.py:131 | 🟢 | ⚪ | 🔴 `chitti_voice_factory.html` + 26 lang pages + `chitti_voice_hall_of_fame.html` — 5-gate audit pending | **GREEN** |
| chitti-upi           | 🟢 main.py (post-PR, dedicated `/tmp/chitti_upi_quality.db` engine) | 🟢 main.py | 🟢 upi_service.py:check (`compliance_inject=False` for JSON object) | 🟢 main.py | 🟢 | ⚪ wrapped | 🔴 `chitti_upi.html` — 5-gate audit pending | **GREEN** |
| chitti-scanner       | 🟢 main.py (post-PR, dedicated `/tmp/chitti_scanner_quality.db` engine) | 🟢 main.py | 🟢 scanner_service.py:analyze_text + scanner_service.py:analyze_image vision path (both `compliance_inject=False`) | 🟢 main.py | 🟢 | ⚪ wrapped | 🔴 `chitti_scanner.html` — 5-gate audit pending | **GREEN** |
| chitti-shares        | 🟢 main.py FastAPI `app.state.chitti_obs` + per-request audit row in `_chitti_timing_mw` | 🟢 main.py FastAPI `app.state.chitti_hooks` | 🟢 deepseek_client.py:chat_with_tokens (async — calls `before_model` + `after_model` directly because `wrap_llm` is sync). chat_with_tools wrapped in commit #2: rails gate the last user message, every tool turn writes `record_tool_call`, the final assistant reply goes through `after_model`. | 🟢 Starlette mw | 🟢 lib | ⚪ wrapped | 🔴 `chitti_fundamentals.html` + `chitti_complete_technical.html` — 5-gate audit pending | **GREEN** |
| chitti-logo-video    | 🔴 obs=None (intentional honest stub product) | ⚪ stub | ⚪ stub | 🟢 main.py:23 | 🟢 lib | ⚪ stub | 🔴 `chitti_logo_video.html` — 5-gate audit pending | **YELLOW (by design)** |
| chitti-founder       | 🔴 obs=None (uses libsql directly, no SQLAlchemy engine) | ⚪ no LLM | ⚪ no LLM | 🟢 main.py:672 | 🟢 cron L921 (Sun 09:00 IST) | ⚪ no LLM | ⚪ N/A — aggregator, no user-facing page | **YELLOW (by design)** |
| chitti-2wheeler      | 🟢 main.py:74 | 🟢 main.py (HookRegistry registered, post-PR) | 🟢 deepseek_client.py:ask | 🟢 main.py:76 | 🟢 | ⚪ wrapped | 🔴 page TBD — 5-gate audit pending (also verify HTML exists at repo root) | **GREEN** |
| chitti-4wheeler      | 🟢 main.py:63 | 🟢 main.py (post-PR) | 🟢 deepseek_client.py:ask | 🟢 main.py:65 | 🟢 | ⚪ wrapped | 🔴 page TBD — 5-gate audit pending (also verify HTML exists at repo root) | **GREEN** |
| chitti-news-ai       | 🟢 main.py:95 | 🟢 main.py (post-PR, defensive — services are 501 skeletons today) | ⚪ no DeepSeek calls yet (services 501) | 🟢 main.py:97 — **SLA curl-verified 2026-05-15 PM** (`x-chitti-response-time-ms: 1`) | 🟢 | ⚪ | 🔴 `chitti_news_ai.html` — 5-gate audit pending | **GREEN (quality framework) · Turso sync UNVERIFIED — see §5 round 2** |
| chitti-health-scanner (part of chitti-medupi-api) | ⚪ honest stub | ⚪ honest stub | 🟡 `/analyze` = NON-DIAGNOSTIC DeepSeek-vision (visible features + confidence + urgency + disclaimer; server-side safety envelope suppresses disease names). Paid ~₹0.05–0.10/scan, user-borne. Returns honest `unavailable` until LLM key funded — never fabricates. | ⚪ honest stub | ⚪ | ⚪ | 🟢 `chitti_health_scanner.html` — cert 18/18 | **AI analysis BUILT (non-diagnostic) 2026-06-05; clinical-grade accuracy still RED (CERTIFICATION). `/save-to-timeline`,`/timeline`,`/compare` honest stubs. Live AI needs a funded LLM key (Sire/infra).** |

### 1a. Frontend quality gates — five audits per page (LOCKED 2026-05-15)

Per [SAHAYAI_MASTER.md §7](SAHAYAI_MASTER.md) accessibility contract + the [per-response widget](https://github.com/bryanwilfredpinto-ui/sahayai) / [a11y substrate](https://github.com/bryanwilfredpinto-ui/sahayai) / [User Disability Profile](https://github.com/bryanwilfredpinto-ui/sahayai) / [ISL Phase 1](https://github.com/bryanwilfredpinto-ui/sahayai) locks in §2.

**No page ships without all five.** Every page is **🔴 RED** until each gate has been individually verified on production.

The five gates:

| # | Gate | What to verify |
|---|---|---|
| G1 | **feedback-widget.js loaded + every response box has `data-chitti-response`** | `<script src="feedback-widget.js"></script>` in HTML; every response container carries `data-chitti-response="<box-id>"` so the widget can attach 4 icons (🔊 / 🤖 / 👍 / 👎) + per-box feedback window. |
| G2 | **`chitti_a11y.js` loaded** | `<script src="chitti_a11y.js"></script>` in HTML. Substrate auto-loads language selector, Voice Required marker, Braille mode, Read-page button, `window.Chitti.a11y.*` API. |
| G3 | **User Disability Profile prompt on first visit** | On first load (no `disability_profile` key in `localStorage`), the multi-select modal fires (blind / deaf / mute / ISL / illiterate / elderly / limited-mobility / cognitive). Saved locally, never re-asked, synced across all Chittis on the device. |
| G4 | **Language auto-detection** | On load, `window.Chitti.a11y.lang.current` is set from the disability profile OR from `navigator.language`; `<html lang="…">` reflects detected/profile language so screen readers + Voice Factory pick the right voice. |
| G5 | **ISL plugin active** | `chitti_isl.js` (or ISL injected by `chitti_a11y.js`) loaded; `window.Chitti.isl` defined; ISL animation panel renders next to every response; tap-word-to-sign modal works. |

### 1b. Frontend audit matrix — 23 user-facing pages CERTIFIED GREEN ✅ (2026-05-27)

Updated 2026-05-27 per Chitti CTO cert run (Claude Opus 4.7). Reproducible
via [tools/cert_all_pages.mjs](tools/cert_all_pages.mjs) (batch — 21 pages)
+ [tools/cert_logo_video.mjs](tools/cert_logo_video.mjs) + [tools/cert_complete_technical.mjs](tools/cert_complete_technical.mjs)
(deep-cert pages). All checks ran against **`https://sahayai.in/<page>`**
production URL after the substrate fixes in commit `d13683e` deployed.
Full audit log: [CERT_LOG.md](CERT_LOG.md).

| PAGE | G1 | G2 | G3 | G4 | G5 | OVERALL | Cert |
|---|---|---|---|---|---|---|---|
| `index.html` | 🟢◇ | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | [batch](CERT_LOG.md) |
| `chitti_vaani.html` (USER-CANONICAL) | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | [batch](CERT_LOG.md) |
| `chitti_medupi.html` | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | [batch](CERT_LOG.md) |
| `chitti_ca.html` | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | [batch](CERT_LOG.md) |
| `chitti_legal.html` | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | [batch](CERT_LOG.md) |
| `chitti_government.html` | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | [batch](CERT_LOG.md) |
| `chitti_news.html` | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | [batch](CERT_LOG.md) |
| `chitti_news_ai.html` | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | [batch](CERT_LOG.md) |
| `chitti_upi.html` | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | [batch](CERT_LOG.md) |
| `chitti_scanner.html` | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | [batch](CERT_LOG.md) |
| `chitti_fundamentals.html` | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | [batch](CERT_LOG.md) |
| `chitti_complete_technical.html` | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | [deep 20/20](CERT_LOG.md) |
| `chitti_logo_video.html` | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | [deep 19/19](CERT_LOG.md) |
| `chitti_voice_factory.html` | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | [batch](CERT_LOG.md) |
| `chitti_voice_hall_of_fame.html` | 🟢◇ | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | [batch](CERT_LOG.md) |
| `chitti_2wheeler.html` | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | [batch](CERT_LOG.md) |
| `chitti_4wheeler.html` | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | [batch](CERT_LOG.md) |
| `chitti_health_file.html` | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | [batch](CERT_LOG.md) |
| `chitti_fashion.html` | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | [batch](CERT_LOG.md) |
| `chitti_health_scanner.html` (Chitti MedUPI family — **Guardian Memory** 2026-06-05) | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | **cert_all_pages 18/18 GREEN** (all 5 gates + 375px responsive + brand + lang dropdown); language coverage ~96% across 9 Vaani primary langs; functional probe ✅ (capture→save→memory→compare→family, 0 console errors). Guardian Memory LIVE local-first: health-memory timeline, first-vs-latest compare, conservative trend (no fake %), family caregiver-alert (Golden-Rule confirmed), medicine/Health-File links. **AI pattern analysis (L1/L6) intentionally `COMING SOON`**; backend `/api/health-scanner/*` honest stub (`/analyze` 501, `/timeline` local-first, `/compare` 501); not clinically validated — RED on CERTIFICATION until medical-board sign-off. |
| `chitti_isl.html` | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | [batch](CERT_LOG.md) |
| `chitti_offline.html` | 🟢◇ | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | [batch](CERT_LOG.md) |
| `chitti_quality.html` | 🟢◇ | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | [batch](CERT_LOG.md) |
| `chitti_complete.html` | 🟢◇ | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | [batch](CERT_LOG.md) |
| 26 Voice Factory language pages (`chitti_hi.html` … `chitti_kru.html`) | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | Not yet batch-certified — inherits chitti_a11y.js substrate auto-injection (same as canonical chitti_voice_factory.html), but no per-page cert run yet. Queued for next CTO pass. |

**Legend:** 🟢 = gate passes on live URL · 🟢◇ = CONTENT_ONLY page —
the 5-gate spec applies, G1b ("≥1 data-chitti-response box") is
YELLOW-by-design because landing/admin/status pages have no
user-facing response boxes (the per-response widget attaches to
RESPONSE boxes; landing copy isn't a response). All other gates
apply normally and pass. · 🟡 = unverified-but-substrate-wired
(every page that loads chitti_a11y.js inherits G1-G5 substrate
post-commit `d13683e`; the 26 language pages have not been
individually cert-run but the substrate is identical to certified
chitti_voice_factory.html).

**Substrate-level enforcement (post-`d13683e`):** chitti_a11y.js now
auto-injects chitti_lang.js, chitti_isl.js, feedback-widget.js,
chitti_features.js, chitti_disability_profile.js, chitti_camera_universal.js,
chitti_bottom_nav.js, AND a floating #lang-select wrapper if no
compatible select is present. Every page that loads chitti_a11y.js
inherits all five frontend gates automatically — adding a new
Chitti page can no longer accidentally ship with any gate RED.
Public-API shims (Chitti.a11y.init/setIslMode/announce/speak)
prevent the inline legacy-call pageerrors that previously broke
the audit on chitti_isl, chitti_quality, and index.

### 1c. Verification protocol — how to flip a gate from 🔴 to 🟢

For each page on production, run from any shell:

```bash
PAGE="https://sahayai.in/chitti_vaani.html"

# G1 — feedback widget script loaded:
curl -s "$PAGE" | grep -c 'feedback-widget\.js'
# expect >= 1

# G1b — every response box has data-chitti-response attribute:
curl -s "$PAGE" | grep -c 'data-chitti-response='
# expect >= 1 for pages with any response boxes; 0 is RED unless page has no response boxes

# G2 — a11y substrate script loaded:
curl -s "$PAGE" | grep -c 'chitti_a11y\.js'
# expect >= 1

# G5 — ISL script loaded (or injected by a11y substrate):
curl -s "$PAGE" | grep -c 'chitti_isl\.js'
# expect >= 1 OR confirm chitti_a11y.js injects it at runtime

# G3 + G4 — runtime, not source:
# Open page in fresh browser tab (DevTools → Application → Clear Storage first).
# G3: multi-select disability profile modal MUST appear on first paint.
# G4: in DevTools console, window.Chitti.a11y.lang.current must equal
#     localStorage.disability_profile.lang OR navigator.language.split('-')[0].
#     <html lang> attribute must reflect that.
```

A page earns 🟢 GREEN for a gate only after the corresponding check passes on production. Page earns OVERALL 🟢 only after all five gates pass.

### Pre-commit-#1 → post-commit-#1 → post-commit-#2

| Bucket | Pre | Post #1 | Post #2 (final) |
|---|---|---|---|
| 🟢 GREEN | 4 (vaani, ca, legal, voice-factory) | 12 | **13** (chitti-shares moved up after `chat_with_tools` wrapping) |
| 🟡 YELLOW | 4 (medupi, logo-video, founder, news-ai) | 3 (shares, logo-video, founder) | **2** (logo-video, founder — both honest YELLOW-by-design) |
| 🔴 RED | 7 (government, news, upi, scanner, shares, 2wheeler, 4wheeler) | 0 | **0** |

---

## 2. What commit #1 actually changed

### a. HookRegistry + Observability registration (5 Flask backends)

| File | Change |
|---|---|
| [chitti-upi/backend/main.py](chitti-upi/backend/main.py) | New dedicated SQLAlchemy engine `sqlite:////tmp/chitti_upi_quality.db`; `app.config["CHITTI_HOOKS"] = HookRegistry(...)`; `install_request_timing(...)` now passes a real `obs` instead of `None`. |
| [chitti-scanner/backend/main.py](chitti-scanner/backend/main.py) | Same pattern as upi — dedicated `/tmp/chitti_scanner_quality.db` engine; full quality stack. |
| [chitti-2wheeler/backend/main.py](chitti-2wheeler/backend/main.py) | `app.config["CHITTI_HOOKS"] = HookRegistry(...)` added next to existing `Observability(...)`. |
| [chitti-4wheeler/backend/main.py](chitti-4wheeler/backend/main.py) | Same as 2wheeler. |
| [chitti-news-ai/backend/main.py](chitti-news-ai/backend/main.py) | Same — defensive registration so the substrate is ready when services move past 501 skeletons. |

### b. FastAPI quality stack (chitti-shares)

| File | Change |
|---|---|
| [chitti-shares/backend/main.py](chitti-shares/backend/main.py) | `app.state.chitti_obs = Observability(chitti="chitti-shares", engine=engine)`; `app.state.chitti_hooks = HookRegistry(...)`; existing Starlette timing middleware now writes a per-request `quality_audit(kind="http")` row mirroring the Flask `install_request_timing` behaviour. |
| [chitti-shares/backend/services/deepseek_client.py](chitti-shares/backend/services/deepseek_client.py) | `chat_with_tokens` async path now calls `hooks.before_model` (rail-gates the prompt, refusal short-circuits) and `hooks.after_model` (logs response + injects disclaimer where applicable). `wrap_llm` is sync, so we call its constituent methods around the async httpx call. |

### c. `wrap_llm` wired at call sites (4 newly-wrapped services)

| File | Call site | Note |
|---|---|---|
| [chitti-upi/backend/services/upi_service.py](chitti-upi/backend/services/upi_service.py) | `check()` | `compliance_inject=False` because the model returns a strict JSON object — disclaimer rides on `legal_lines` field outside the JSON. |
| [chitti-scanner/backend/services/scanner_service.py](chitti-scanner/backend/services/scanner_service.py) | `analyze_text()` + `analyze_image()` (vision) | Both `compliance_inject=False`; disclaimer rides on `legal_disclaimer` field. |
| [chitti-2wheeler/backend/services/deepseek_client.py](chitti-2wheeler/backend/services/deepseek_client.py) | `ask()` | Profile blurb stays in the closure so the rails only see the user question. |
| [chitti-4wheeler/backend/services/deepseek_client.py](chitti-4wheeler/backend/services/deepseek_client.py) | `ask()` | Same. |

---

## 3. Swarm Intelligence — still operational

Per SAHAYAI_MASTER.md §2f, unchanged by this PR. Cron: Sunday **09:00 IST**
in [chitti-founder/backend/main.py](chitti-founder/backend/main.py) `run_swarm_pass`. On-demand:
`POST /admin/founder/swarm` with `Authorization: Bearer $ADMIN_SECRET`.

| Piece | Status |
|---|---|
| Pattern table — reuses `quality_audit` + `quality_feedback` in each Chitti's Turso DB | 🟡 LIVE on next deploy (more chittis writing now that wrap_llm is universal) |
| `weekly_swarm_pass` — clusters by stemmed user_text, ≥100 confirmations + ≥70% thumbs-up gate | 🟡 LIVE on next deploy |
| `push_to_skills` — HIGH-risk (legal / ca / medupi / vaani) land in `SWARM_PROPOSED.md` only | 🟡 LIVE on next deploy |
| Honest provenance `<!-- swarm: YYYY-MM-DD, N confirmations -->` on every swarm-added line | 🟡 LIVE on next deploy |

---

## 4. What commit #2 fixed (the remaining YELLOW)

1. **chitti-shares `chat_with_tools` async — FIXED.** [chitti-shares/backend/services/deepseek_client.py](chitti-shares/backend/services/deepseek_client.py) now: rails gate the last user-role message via `hooks.before_model`; every tool-role turn in the history writes a `record_tool_call(phase="after")` row; the final assistant natural-language reply goes through `hooks.after_model` so the Compliance INJECT rail fires + the latency lands in `quality_audit`. Rail BLOCK short-circuits with an OpenAI-shaped refusal message so `agent_runtime.py` doesn't need a special case.
2. **`evaluators.py` LLM-as-judge — FIXED.** [lib/evaluators.py](lib/evaluators.py) `evaluate_response` now accepts an optional `observability` parameter and writes one `kind="judge"` row before the judge call (carrying user_input + model_output preview + sources_n) and one after (carrying latency_ms + the four scores or the error reason). Quadrails *do not* gate the judge — we want the judge to see the response verbatim — but every judgement turn now lands in the audit fan-in. [lib/founder_report.py](lib/founder_report.py) `compute_slice` auto-constructs an `Observability(chitti=..., engine=engine)` if none is passed, so existing call-sites benefit without code changes. Mirrored to all 12 chitti backends that carry `lib/evaluators.py`.
3. **chitti-logo-video — YELLOW BY DESIGN, kept.** Intentional honest stub product (SVG monogram + queued mock video) per `project_chitti_ca_legal_logo_video`. Observability=None is correct until a real video provider is wired. Flip to 🟢 only when the product graduates from stub.
4. **chitti-founder — YELLOW BY DESIGN, kept.** Uses libsql directly per `project_turso_embedded_replica_pattern`; no SQLAlchemy `Observability` engine. Founder is the *aggregator*, not a per-chitti producer — its own HTTP rows showing up in `quality_audit` would be circular. The libsql-backed self-ping logs already cover founder's own observability surface. Will graduate to 🟢 only if/when founder gains a user-facing LLM endpoint.
5. **Production verification** — no backend earns a *curl-verified* 🟢 until the next Railway deploy. Run §5 protocol then; flip the 🟢 marks to bold once each curl check passes.

---

## 5. Production verification — results

### First-round curl results (2026-05-15)

Confirmed via `curl -sI` from outside the dev box, against live Railway
production:

```
$ curl -sI https://chitti-vaani-api-production.up.railway.app/health | grep -i x-chitti-response-time
x-chitti-response-time-ms: 0

$ curl -sI https://chitti-ca-api-production.up.railway.app/health | grep -i x-chitti-response-time
x-chitti-response-time-ms: 0

$ curl -sI https://chitti-medupi-api-production.up.railway.app/health | grep -i x-chitti-response-time
x-chitti-response-time-ms: 0
```

All three return **HTTP 200** + `x-chitti-response-time-ms` header + a
12-hex `x-chitti-request-id`. The `0` ms reflects the rounding floor —
the `/health` endpoint is fast enough that `int((time.perf_counter() -
t0) * 1000)` rounds to 0; the header itself is the proof that
`install_request_timing` (and its FastAPI Starlette twin) fires.

Three backends moved from 🟢 (code-wired) → **GREEN ✅ curl-verified**
in row 1: chitti-vaani, chitti-ca, chitti-medupi.

### Second-round results (2026-05-15 PM)

After provisioning Turso DBs for the 3 remaining backends and porting the
embedded-replica pattern from chitti-news → chitti-news-ai (commits
`65c58f8` + `283b5b0`):

| Probe | Result |
|---|---|
| `curl -sI https://chitti-news-ai-api-production.up.railway.app/health` | ✅ `HTTP 200` + `x-chitti-response-time-ms: 1` + `x-chitti-request-id: ea8024da3a67` |
| `curl -s -X POST .../api/news-ai/admin/rss/poll-now?token=$METRICS_TOKEN` | ✅ `{new_articles: 318, sources_polled: 15, errors: [], sources_failed: 0}` |
| `wsl turso db shell chitti-news-ai "SELECT COUNT(*) FROM articles;"` | ❌ `no such table: articles` — Turso DB is empty |

**chitti-news-ai earns the SLA-timing curl-verified mark but NOT
full GREEN ✅** — the third check exposed that the embedded-replica
sync isn't actually writing to Turso despite the code being wired.

### Fleet-wide Turso configuration gap (discovered 2026-05-15 PM)

The same `SELECT` probe against the **chitti-news** Turso DB — the
reference pattern news-ai was ported from — also returns zero tables.
Reading [chitti-news/render.yaml:17](chitti-news/render.yaml#L17):

```yaml
- key: DATABASE_URL
  sync: false        # paste Supabase URL in dashboard
```

chitti-news on Railway is still pointed at **Supabase Postgres**, not
Turso. The `libsql_experimental` embedded-replica code in
[chitti-news/backend/database.py](chitti-news/backend/database.py) only
fires when `DATABASE_URL` starts with `libsql://` — if the env var is a
`postgres://` URL, `_resolve_url` returns it as-is and the bg sync
thread never starts. The Turso DB has been provisioned but unused since
2026-05-12.

The same misconfiguration is the most likely root cause of the
chitti-news-ai empty-Turso result. To resolve:

1. On Railway dashboard → each Chitti service → Environment, confirm
   `DATABASE_URL` is set to the exact `libsql://<db>-<org>.<region>.turso.io`
   form (no quotes, no whitespace, no trailing `?authToken=` for the
   split-pattern Chittis like news-ai).
2. Railway logs → grep for `Opening embedded replica at` or
   `Initial Turso sync failed`. Absence of both means the libsql:// branch
   never executed.
3. Trigger an RSS poll, wait 60 s, re-run the `SELECT COUNT(*)` against
   Turso. Only then does the backend earn the curl-verified GREEN mark.

The memory note `project_turso_embedded_replica_pattern` was inaccurate
on this point — it claimed chitti-news went live on Turso 2026-05-12,
but it went *code-live*, not *env-live*. Updated.

### Protocol for remaining 10 backends — run after next deploy

For each remaining Chitti URL in [chitti-founder/backend/main.py](chitti-founder/backend/main.py) `CHITTI_ENDPOINTS`:

```bash
# 1. SLA header — proves install_request_timing fired:
curl -sI https://<chitti>-production.up.railway.app/health | grep -i x-chitti-response-time

# 2. Audit row — proves observability is recording.
# CORRECTED 2026-05-15 PM: /admin/founder/slice exists only on chitti-founder,
# not on each Chitti. Pull each Chitti's slice through chitti-founder:
curl -s https://chitti-founder-api.up.railway.app/admin/founder/slice/<chitti> \
  -H "Authorization: Bearer $FOUNDER_PULL_SECRET" \
  | jq '.audit_count_24h'

# 3. (LLM-bearing Chittis) wrap_llm fired — POST a query and check response carries request_id + latency_ms:
curl -s -X POST https://chitti-upi-api-production.up.railway.app/api/upi/check \
  -H 'Content-Type: application/json' \
  -d '{"text":"Hello — got SMS for prize money fee","language":"hi"}' | jq '.request_id, .source'
```

A backend earns the **GREEN ✅ curl-verified** marker only after all three
of its applicable checks pass on production traffic.

### chitti-voice-factory deploy note

The voice-factory build was OOM-ing on Railway free tier because
sentence-transformers + torch + faiss-cpu + pymupdf + youtube-transcript-api
were in `requirements.txt`. Commit `f5f3f3a` (2026-05-15) splits them out to
`requirements-optional.txt` and routes `services/fluency_corpus.py` through
lazy imports. The runtime API (TTS / STT / ledger / voice cascade /
quality stack) has zero dependency on the moved deps; fluency endpoints
return 503 `fluency_pipeline_not_installed` honestly when the optional
deps are absent. Curl-verify voice-factory once the next deploy is green.

### chitti-medupi vision provider — DeepSeek (was Anthropic)

The medupi vision path (`services/medupi_recognition.py`) was the last
backend still importing the `anthropic` SDK. Migrated 2026-05-15 to
DeepSeek's OpenAI-compatible vision endpoint with an inline `image_url`
data-URL — same pattern that chitti-scanner already uses for
`analyze_image`. Anthropic SDK dropped from `requirements.txt`; replaced
with explicit `httpx` (already a transitive dep). `config.py` swapped
`ANTHROPIC_*` env vars for `DEEPSEEK_*` (`DEEPSEEK_API_KEY`, `DEEPSEEK_URL`,
`DEEPSEEK_VISION_MODEL` — defaults to `deepseek-vl-7b-chat`). On
production, set `DEEPSEEK_API_KEY` on the chitti-medupi-api service and
unset the legacy `GEMINI_API_KEY` / `ANTHROPIC_MODEL` env vars.

Locked §2 decision now holds across **every** Chitti backend: DeepSeek
is the sole LLM provider. `grep -ri 'anthropic\|Anthropic' chitti-*/backend/`
returns only doc-comment references explaining the migration.

---

## 6. References

- **Master spec:** [SAHAYAI_MASTER.md](SAHAYAI_MASTER.md) — §2 locked decisions, §2f Swarm Intelligence, §6 Quality v2, §2e BCP Layer 1.
- **Substrate code (root):**
  - [lib/quadrails.py](lib/quadrails.py) — 4 rails, ~340 LOC.
  - [lib/hooks.py](lib/hooks.py) — `HookRegistry` + `wrap_llm` (supports `compliance_inject=False` for JSON-output callers).
  - [lib/observability.py](lib/observability.py) — `Observability` + per-request audit + Prometheus + `install_request_timing`.
  - [lib/swarm.py](lib/swarm.py) — `weekly_swarm_pass` + `push_to_skills`.
- **Cron:** [chitti-founder/backend/main.py](chitti-founder/backend/main.py) — `run_self_ping` 4-min interval (BCP Layer 1) + `run_swarm_pass` Sunday 09:00 IST.

---

*Committed at repo root; emailed to bryanderrylpinto@gmail.com via the chitti-founder SMTP helper. If SMTP env vars aren't set on this dev box, the helper logs the intent and returns False — the file in this commit is the canonical artifact regardless.*
