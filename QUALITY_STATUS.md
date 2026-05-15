# QUALITY_STATUS.md — Enterprise Quality Audit (final baseline)

**Generated:** 2026-05-14 · **Updated:** 2026-05-15 (commits #1 + #2) · **Auditor:** Claude Opus 4.7 (1M context) ·
**Trigger:** "DEFINITIVE ENTERPRISE BASELINE — all Chittis GREEN" from Sire.

## Legend

| Mark | Meaning |
|------|---------|
| 🟢 GREEN  | Substrate present **AND** invoked at every call site. Production curl confirmation lands after the next Render deploy. |
| 🟡 YELLOW | Substrate present, call sites mostly wired, one or more honest gaps remaining (background judge, agent-tool loop, stub product). |
| 🔴 RED    | Substrate missing or never invoked at any call site. |
| ⚪ N/A    | Not applicable to this backend (no LLM path, intentional stub, etc.). |

**Honesty note:** I cannot curl `*.onrender.com` from this dev environment,
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

### 1b. Frontend audit matrix — all pages 🔴 until verified

| PAGE | G1 | G2 | G3 | G4 | G5 | OVERALL | Note |
|---|---|---|---|---|---|---|---|
| `index.html` | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | Per §8 P0 #2, becomes Vaani entry surface — gates MUST pass before relaunch |
| `chitti_vaani.html` | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | **USER-CANONICAL** per §2 row 1 — highest-priority audit |
| `chitti_medupi.html` | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | |
| `chitti_ca.html` | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | |
| `chitti_legal.html` | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | |
| `chitti_government.html` | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | |
| `chitti_news.html` | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | |
| `chitti_news_ai.html` | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | |
| `chitti_upi.html` | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | |
| `chitti_scanner.html` | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | |
| `chitti_fundamentals.html` | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | |
| `chitti_complete_technical.html` | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | |
| `chitti_logo_video.html` | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | |
| `chitti_voice_factory.html` | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | |
| `chitti_voice_hall_of_fame.html` | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | |
| `chitti_isl.html` | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | G5 self-referential — verify ISL plugin works on its own demo page |
| `chitti_quality.html` | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | |
| 26 Voice Factory language pages (`chitti_hi.html` … `chitti_kru.html`) | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | Audit each at least via `chitti-voice-factory/frontend/` canonical (root pages are mirrors) |
| 2wheeler / 4wheeler / kirana pages (if HTML exists) | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | First check if root HTML exists; create if missing per §2 row 1 routing requirement |

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
5. **Production verification** — no backend earns a *curl-verified* 🟢 until the next Render deploy. Run §5 protocol then; flip the 🟢 marks to bold once each curl check passes.

---

## 5. Production verification — results

### First-round curl results (2026-05-15)

Confirmed via `curl -sI` from outside the dev box, against live Render
production:

```
$ curl -sI https://chitti-vaani-api.onrender.com/health | grep -i x-chitti-response-time
x-chitti-response-time-ms: 0

$ curl -sI https://chitti-ca-api.onrender.com/health | grep -i x-chitti-response-time
x-chitti-response-time-ms: 0

$ curl -sI https://chitti-medupi-api.onrender.com/health | grep -i x-chitti-response-time
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
| `curl -sI https://chitti-news-ai-api.onrender.com/health` | ✅ `HTTP 200` + `x-chitti-response-time-ms: 1` + `x-chitti-request-id: ea8024da3a67` |
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

chitti-news on Render is still pointed at **Supabase Postgres**, not
Turso. The `libsql_experimental` embedded-replica code in
[chitti-news/backend/database.py](chitti-news/backend/database.py) only
fires when `DATABASE_URL` starts with `libsql://` — if the env var is a
`postgres://` URL, `_resolve_url` returns it as-is and the bg sync
thread never starts. The Turso DB has been provisioned but unused since
2026-05-12.

The same misconfiguration is the most likely root cause of the
chitti-news-ai empty-Turso result. To resolve:

1. On Render dashboard → each Chitti service → Environment, confirm
   `DATABASE_URL` is set to the exact `libsql://<db>-<org>.<region>.turso.io`
   form (no quotes, no whitespace, no trailing `?authToken=` for the
   split-pattern Chittis like news-ai).
2. Render logs → grep for `Opening embedded replica at` or
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
curl -sI https://<chitti>.onrender.com/health | grep -i x-chitti-response-time

# 2. Audit row — proves observability is recording.
# CORRECTED 2026-05-15 PM: /admin/founder/slice exists only on chitti-founder,
# not on each Chitti. Pull each Chitti's slice through chitti-founder:
curl -s https://chitti-founder-api.onrender.com/admin/founder/slice/<chitti> \
  -H "Authorization: Bearer $FOUNDER_PULL_SECRET" \
  | jq '.audit_count_24h'

# 3. (LLM-bearing Chittis) wrap_llm fired — POST a query and check response carries request_id + latency_ms:
curl -s -X POST https://chitti-upi-api.onrender.com/api/upi/check \
  -H 'Content-Type: application/json' \
  -d '{"text":"Hello — got SMS for prize money fee","language":"hi"}' | jq '.request_id, .source'
```

A backend earns the **GREEN ✅ curl-verified** marker only after all three
of its applicable checks pass on production traffic.

### chitti-voice-factory deploy note

The voice-factory build was OOM-ing on Render free tier because
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
unset the legacy `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` env vars.

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
