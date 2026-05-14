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

## 1. Per-backend matrix — six audit axes

Run on the post-commit-#1 tree (HookRegistry registered + `wrap_llm`
wired into every previously-raw DeepSeek service across the 15 backends).

| BACKEND | OBSERVABILITY | QUADRAILS | wrap_llm | SLA_TIMING | SWARM | RAW_DEEPSEEK_CALLS | STATUS |
|---------|--------------|-----------|----------|------------|-------|--------------------|--------|
| chitti-medupi        | 🟢 main.py:161 | 🟢 main.py:163 | 🟢 medupi_recognition.py:185–193 (`compliance_inject=False` for vision JSON) | 🟢 main.py:168 | 🟢 lib/swarm.py + founder cron Sun 09:00 IST | ⚪ wrapped | **GREEN** |
| chitti-vaani         | 🟢 main.py:152 | 🟢 main.py:154 | 🟢 vaani_service.py:180–186 | 🟢 main.py:159 | 🟢 | ⚪ wrapped | **GREEN** |
| chitti-ca            | 🟢 main.py:69  | 🟢 main.py:71  | 🟢 ca_service.py:119–125 | 🟢 main.py:76 | 🟢 | ⚪ wrapped | **GREEN** |
| chitti-legal         | 🟢 main.py:69  | 🟢 main.py:71  | 🟢 legal_service.py:116, :398 (`compliance_inject=False` for explain_notice JSON) | 🟢 main.py:76 | 🟢 | ⚪ wrapped | **GREEN** |
| chitti-government    | 🟢 main.py:159 | 🟢 main.py:161 | 🟢 government_deepseek.py:193–199 | 🟢 main.py:166 | 🟢 | ⚪ wrapped | **GREEN** |
| chitti-news          | 🟢 main.py:124 | 🟢 main.py:126 | 🟢 news_summary.py:147–153 + news_explain.py:118–124 | 🟢 main.py:131 | 🟢 | ⚪ wrapped | **GREEN** |
| chitti-voice-factory | 🟢 main.py:124 | 🟢 main.py:126 | ⚪ no DeepSeek service path in v1 (STT/TTS only) | 🟢 main.py:131 | 🟢 | ⚪ | **GREEN** |
| chitti-upi           | 🟢 main.py (post-PR, dedicated `/tmp/chitti_upi_quality.db` engine) | 🟢 main.py | 🟢 upi_service.py:check (`compliance_inject=False` for JSON object) | 🟢 main.py | 🟢 | ⚪ wrapped | **GREEN** |
| chitti-scanner       | 🟢 main.py (post-PR, dedicated `/tmp/chitti_scanner_quality.db` engine) | 🟢 main.py | 🟢 scanner_service.py:analyze_text + scanner_service.py:analyze_image vision path (both `compliance_inject=False`) | 🟢 main.py | 🟢 | ⚪ wrapped | **GREEN** |
| chitti-shares        | 🟢 main.py FastAPI `app.state.chitti_obs` + per-request audit row in `_chitti_timing_mw` | 🟢 main.py FastAPI `app.state.chitti_hooks` | 🟢 deepseek_client.py:chat_with_tokens (async — calls `before_model` + `after_model` directly because `wrap_llm` is sync). chat_with_tools wrapped in commit #2: rails gate the last user message, every tool turn writes `record_tool_call`, the final assistant reply goes through `after_model`. | 🟢 Starlette mw | 🟢 lib | ⚪ wrapped | **GREEN** |
| chitti-logo-video    | 🔴 obs=None (intentional honest stub product) | ⚪ stub | ⚪ stub | 🟢 main.py:23 | 🟢 lib | ⚪ stub | **YELLOW (by design)** |
| chitti-founder       | 🔴 obs=None (uses libsql directly, no SQLAlchemy engine) | ⚪ no LLM | ⚪ no LLM | 🟢 main.py:672 | 🟢 cron L921 (Sun 09:00 IST) | ⚪ no LLM | **YELLOW (by design)** |
| chitti-2wheeler      | 🟢 main.py:74 | 🟢 main.py (HookRegistry registered, post-PR) | 🟢 deepseek_client.py:ask | 🟢 main.py:76 | 🟢 | ⚪ wrapped | **GREEN** |
| chitti-4wheeler      | 🟢 main.py:63 | 🟢 main.py (post-PR) | 🟢 deepseek_client.py:ask | 🟢 main.py:65 | 🟢 | ⚪ wrapped | **GREEN** |
| chitti-news-ai       | 🟢 main.py:95 | 🟢 main.py (post-PR, defensive — services are 501 skeletons today) | ⚪ no DeepSeek calls yet (services 501) | 🟢 main.py:97 | 🟢 | ⚪ | **GREEN (skeleton parity)** |

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

## 5. Production verification protocol — run after next Render deploy

For each Chitti URL in [chitti-founder/backend/main.py](chitti-founder/backend/main.py) `CHITTI_ENDPOINTS`:

```bash
# 1. SLA header — proves install_request_timing fired:
curl -sI https://<chitti>.onrender.com/health | grep -i x-chitti-response-time

# 2. Audit row — proves observability is recording:
curl -s https://<chitti>.onrender.com/admin/founder/slice \
  -H "Authorization: Bearer $FOUNDER_PULL_SECRET" \
  | jq '.audit_count_24h'

# 3. (LLM-bearing Chittis) wrap_llm fired — POST a query and check response carries request_id + latency_ms:
curl -s -X POST https://chitti-upi-api.onrender.com/api/upi/check \
  -H 'Content-Type: application/json' \
  -d '{"text":"Hello — got SMS for prize money fee","language":"hi"}' | jq '.request_id, .source'
```

A backend graduates from 🟡 → 🟢 *with production confirmation* only after all three of its applicable checks pass on production traffic.

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
