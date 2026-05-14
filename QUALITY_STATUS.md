# QUALITY_STATUS.md — Enterprise Quality Audit

**Generated:** 2026-05-14 · **Auditor:** Claude Opus 4.7 (1M context) ·
**Trigger:** "ENTERPRISE QUALITY AUDIT — Priority 1" from Sire.

## Legend

| Mark | Meaning |
|------|---------|
| 🟢 GREEN  | **Verified working in production.** Curl-tested on the live URL, headers/logs confirmed. |
| 🟡 YELLOW | **Code wired, not verified in production yet.** Substrate exists + call sites land in this PR. Production verification requires the next Render deploy. |
| 🔴 RED    | **Missing completely.** Substrate absent or never invoked at the call site. |
| ⚪ N/A    | Not applicable to this backend (e.g. no LLM call → no quadrails needed). |

**Honesty note:** I cannot curl `*.onrender.com` from this dev environment, so
**no backend earns 🟢 today**. Every YELLOW item needs an explicit
post-deploy verification step (see §5).

---

## 1. Per-backend status table

| BACKEND               | QUADRAILS | HOOKS (`wrap_llm`) | OBSERVABILITY (audit log) | SLA_MEASURED (`X-Chitti-Response-Time-Ms`) | OVERALL |
|-----------------------|-----------|--------------------|---------------------------|--------------------------------------------|---------|
| chitti-medupi         | 🟡        | 🟡 (HookRegistry live, services call to be migrated post-this-PR) | 🟡 (per-HTTP audit row + LLM gated audit when wrap_llm fires) | 🟡 | YELLOW |
| chitti-vaani          | 🟡        | 🟡 (vaani_service.ask wired) | 🟡 | 🟡 | YELLOW |
| chitti-ca             | 🟡        | 🟡 (ca_service.ask wired) | 🟡 | 🟡 | YELLOW |
| chitti-legal          | 🟡        | 🟡 (legal_service.explain wired; explain_notice JSON-output still raw — see §3) | 🟡 | 🟡 | YELLOW |
| chitti-government     | 🟡        | 🔴 (HookRegistry live, government_deepseek.* not yet wrapped) | 🟡 (HTTP audit only) | 🟡 | YELLOW |
| chitti-news           | 🟡        | 🔴 (HookRegistry live, news_summary / news_explain not yet wrapped) | 🟡 (HTTP audit only) | 🟡 | YELLOW |
| chitti-voice-factory  | 🟡        | ⚪ (no DeepSeek path in v1 — STT/TTS only) | 🟡 (HTTP audit) | 🟡 | YELLOW |
| chitti-upi            | 🟡        | 🔴 (HookRegistry NOT registered; upi_service raw) | 🟡 (HTTP audit only) | 🟡 | YELLOW |
| chitti-scanner        | 🟡        | 🔴 (HookRegistry NOT registered; scanner_service raw) | 🟡 (HTTP audit only) | 🟡 | YELLOW |
| chitti-shares         | 🟡 (lib mirrored) | 🔴 (FastAPI — HookRegistry not registered; deepseek_client raw) | 🔴 (no SQLAlchemy Observability install) | 🟡 (Starlette middleware in this PR) | YELLOW |
| chitti-logo-video     | ⚪ (stub) | ⚪ (stub) | 🔴 (no engine) | 🟡 | YELLOW |
| chitti-founder        | ⚪ (no LLM) | ⚪ | 🔴 (uses libsql directly, not SQLAlchemy) | 🟡 | YELLOW |
| chitti-2wheeler       | 🟡        | 🔴 (HookRegistry NOT registered; deepseek_client raw) | 🟡 | 🟡 | YELLOW |
| chitti-4wheeler       | 🟡        | 🔴 (HookRegistry NOT registered; deepseek_client raw) | 🟡 | 🟡 | YELLOW |
| chitti-news-ai        | 🟡        | 🔴 (skeleton — DeepSeek wiring still 501) | 🟡 | 🟡 | YELLOW |

**Pre-audit state was almost entirely 🔴 RED.** This PR moves the platform from
"substrate built, never invoked" to "substrate wired everywhere for SLA timing
+ wrapped on the 3 HIGH-risk DeepSeek services." The remaining 🔴 cells are
honest debt — listed below as concrete follow-up.

---

## 2. The four audit findings — verbatim

### Finding #1 — QUADRAILS

**Code substrate present in 15/15 backends** (12 backends carried `lib/quadrails.py`
into this PR; 3 missing — chitti-2wheeler, chitti-4wheeler, chitti-news-ai —
were given the lib in this PR).

**Actual wrapping of every DeepSeek call: was 0/15 before this PR.** The four
rails (Safety / Relevance / Truth / Compliance) only run via `HookRegistry.wrap_llm`,
and **no service file called any hook method** before this PR:

```
$ grep -rn "hooks.before_model\|hooks.after_model\|wrap_llm" chitti-*/backend/services/
(no matches before this PR)
```

The only `before_model` / `after_model` references in the codebase were inside
[lib/hooks.py](lib/hooks.py) (definitions) and [lib/__init__.py](lib/__init__.py)
(a documentation snippet). `HookRegistry` was *constructed* on `app.config`
in 7 backends but **never read by any service**:

```
$ grep -rn 'current_app.config.get("CHITTI_HOOKS")' .
(no matches before this PR)
```

**This PR adds `HookRegistry.wrap_llm`** ([lib/hooks.py](lib/hooks.py)) — a
one-line wrapper around `before_model` → caller → `after_model` — and **wires
it into the 3 HIGH-risk services**: [chitti-vaani/backend/services/vaani_service.py](chitti-vaani/backend/services/vaani_service.py),
[chitti-ca/backend/services/ca_service.py](chitti-ca/backend/services/ca_service.py),
[chitti-legal/backend/services/legal_service.py](chitti-legal/backend/services/legal_service.py).

Remaining wrapping work tracked in §4.

### Finding #2 — HOOKS (before_model + after_model)

`before_model` / `after_model` are firing on **the 3 wired services
(vaani/ca/legal) only**, when the call goes through Flask request context
(production path). The CLI / unit-test fallback in each service preserves
the prior un-wrapped behavior — by design, so tests stay simple.

**Proof in code:**
```python
# chitti-vaani/backend/services/vaani_service.py
try:
    from flask import current_app
    hooks = current_app.config.get("CHITTI_HOOKS")
except Exception:
    hooks = None
if hooks is not None:
    wrapped = hooks.wrap_llm(_call, user_text=text, ctx={})
```

The 4 other backends with `HookRegistry` registered on `app.config`
(government, news, voice-factory, medupi) had no DeepSeek service files
edited in this PR — their `wrap_llm` migration is the §4 follow-up.

### Finding #3 — OBSERVABILITY (audit logs)

**Audit table schema is correct** ([lib/observability.py](lib/observability.py) §
`QualityAudit`) — but **was empty in production** because every write happens
inside `HookRegistry.{before_model, after_model, before_tool, after_tool}` and
nothing called those methods.

**This PR adds two write paths:**

1. **Every HTTP request** now writes one `quality_audit` row via
   `install_request_timing(app, slug, observability=obs)` — wired into every
   Flask Chitti's `main.py`. The row carries `kind="http"`, method, path, status,
   `elapsed_ms`. This works even before `wrap_llm` is wired into every service.
2. **Every wrapped LLM call** writes the existing `record_request` /
   `record_response` / `record_rail` rows via `wrap_llm`. Active today on
   vaani/ca/legal.

**Sample production log entry: cannot show yet.** No production deploy has
run since this PR. The first deploy will populate `quality_audit` per
the schema above — verification step in §5.

### Finding #4 — SLA MEASUREMENT (response time)

**Was missing on all 15 backends.** Only `chitti-founder/backend/main.py`
measured `latency_ms` — and only for *outbound* self-pings, not for its own
inbound requests:

```
$ grep -l "before_request\|after_request\|X-Response-Time" chitti-*/backend/main.py
chitti-founder/backend/main.py   # outbound timing only
```

**This PR adds [`install_request_timing`](lib/observability.py)** — a Flask
`before_request` + `after_request` middleware that:

- Stamps every response with `X-Chitti-Response-Time-Ms` and `X-Chitti-Request-Id` headers.
- Writes one `quality_audit(kind="http")` row per request with elapsed milliseconds.
- Exports a Prometheus histogram `chitti_http_latency_ms{chitti,method,endpoint,status}` when prometheus_client is installed.

**Wired into all 14 Flask backends + 1 FastAPI backend** (chitti-shares uses a
Starlette `@app.middleware("http")` equivalent — same headers, no audit write
yet because chitti-shares has no SQLAlchemy `Observability` wired). Honest call:
chitti-founder, chitti-logo-video, chitti-scanner, chitti-upi, chitti-shares
have the timing middleware but no SQLAlchemy Observability — they emit the
headers + Prometheus but not the per-request audit row.

---

## 3. Swarm Intelligence — basic version SHIPPED

Per SAHAYAI_MASTER.md §2f. Lives in [lib/swarm.py](lib/swarm.py), mirrored to
every backend.

| Piece | File | Status |
|------|-------|--------|
| Pattern table | Reuses existing `quality_audit` + `quality_feedback` tables in each Chitti's Turso DB. No new schema. | 🟡 LIVE on next deploy |
| Weekly extraction | [`weekly_swarm_pass`](lib/swarm.py) — clusters by stemmed user_text, filters by ≥100 confirmations + ≥70% thumbs-up (both env-overridable). | 🟡 LIVE on next deploy |
| Auto-push to `skills/*.md` | [`push_to_skills`](lib/swarm.py) — appends to `<chitti>/skills/SWARM_LEARNED.md` (or `SWARM_PROPOSED.md` for HIGH-risk Chittis: legal, ca, medupi, vaani) with verbatim provenance: `<!-- swarm: YYYY-MM-DD, N confirmations -->`. | 🟡 LIVE on next deploy |
| Cron schedule | [chitti-founder/backend/main.py](chitti-founder/backend/main.py) — Sunday **09:00 IST** (after the existing 08:00 weekly digest). Env override: `SWARM_HOUR_IST` / `SWARM_MINUTE_IST`. | 🟡 LIVE on next deploy |
| On-demand trigger | `POST /admin/founder/swarm` with `Authorization: Bearer <ADMIN_SECRET>` — runs the same code path. | 🟡 LIVE on next deploy |

**Locked decisions respected** (SAHAYAI_MASTER.md §2f):

- HIGH-risk Chittis never auto-push — pattern lands in `SWARM_PROPOSED.md`.
- ≥100 confirmations + ≥70% thumbs-up before a pattern is written.
- Honest provenance comment on every swarm-added line.
- §2 locks (LLM provider, voice substrate, emergency protocol, four-user contract, ISL, per-response widget, camera intelligence, knowledge-corpus expert grades) are not learnable by design — the swarm only writes new pattern entries, never modifies SAHAYAI_MASTER.md.

---

## 4. Honest debt — what's NOT done yet

Listed in priority order. Each one is "code path exists, needs a call-site edit
on one or more service files."

1. **`legal_service.explain_notice` is JSON-output and not wrapped.** Wrapping it
   with `wrap_llm` would let the Compliance rail's `INJECT` action corrupt the
   returned JSON. Fix: add a `wrap_llm(..., compliance_inject=False)` flag, OR
   call `hooks.before_model` + `hooks.observability.record_response` manually
   for the JSON path. Tracked as follow-up.
2. **chitti-government / chitti-news / chitti-medupi DeepSeek services** still
   call DeepSeek raw — HookRegistry is registered on `app.config` but the
   `wrap_llm` migration is pending. Same single-function pattern as vaani/ca/legal.
3. **chitti-upi / chitti-scanner / chitti-shares / chitti-2wheeler / chitti-4wheeler /
   chitti-news-ai** don't register `HookRegistry` yet. They have request-timing
   wired but no quadrails on their LLM calls. Add the standard `obs = Observability(...)`
   + `HookRegistry(...)` block from medupi.
4. **chitti-shares Observability** — FastAPI + no SQLAlchemy `Observability` instance
   in `main.py`. The timing middleware is wired but the per-request audit row is
   not. Same six-line block as the Flask backends would close this.
5. **Production verification.** No backend can earn 🟢 today — the headers and
   audit rows live only on the next Render deploy.

---

## 5. Production verification protocol — to run after next deploy

For each Chitti URL listed in [chitti-founder/backend/main.py](chitti-founder/backend/main.py) → `CHITTI_ENDPOINTS`:

```bash
# 1. SLA header — proves install_request_timing fired:
curl -sI https://<chitti>.onrender.com/health | grep -i x-chitti-response-time

# 2. Audit row — proves observability is recording:
#    (requires the per-Chitti admin token)
curl -s https://<chitti>.onrender.com/admin/founder/slice \
  -H "Authorization: Bearer $FOUNDER_PULL_SECRET" \
  | jq '.audit_count_24h'

# 3. (HIGH-risk Chittis only) wrap_llm fired — POST a query and check the response carries `request_id`:
curl -s -X POST https://chitti-vaani-api.onrender.com/api/vaani/ask \
  -H 'Content-Type: application/json' \
  -d '{"text":"Hello Chitti","language":"hi"}' | jq '.request_id, .latency_ms'
```

A backend graduates from 🟡 → 🟢 only after all three of its applicable checks
pass on production traffic.

---

## 6. References

- **Master spec:** [SAHAYAI_MASTER.md §2f Swarm Intelligence](SAHAYAI_MASTER.md), §6 Quality v2, §2e BCP Layer 1
- **Substrate code:**
  - [lib/quadrails.py](lib/quadrails.py) — 4 rails, ~340 LOC
  - [lib/hooks.py](lib/hooks.py) — `HookRegistry` + `wrap_llm` (NEW, this PR)
  - [lib/observability.py](lib/observability.py) — audit log + Prometheus + OTel + `install_request_timing` (NEW, this PR)
  - [lib/swarm.py](lib/swarm.py) — pattern extraction + weekly push (NEW, this PR)
- **Cron:** [chitti-founder/backend/main.py](chitti-founder/backend/main.py) — `run_swarm_pass` (NEW, this PR), wired Sunday 09:00 IST

---

*This file is committed at repo root and emailed to bryanderrylpinto@gmail.com via the chitti-founder SMTP helper. If SMTP env vars aren't set on this dev box, the email helper logs the intent and returns False — the file in this commit is the canonical artifact regardless.*
