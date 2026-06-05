🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# ARCHITECTURE_REVIEW — Chitti Universal Scanner (CUSOS) · Part B

**Reviewer:** Chitti CTO (Solution Architect role) · **Date:** 2026-06-05.
Companion: [CEOS_ARCHITECTURE.md](../CEOS_ARCHITECTURE.md) (full topology).

## B1. System architecture + data flow

```
 USER ─┬─ camera ─┐
       ├─ gallery ┤→ chitti_scanner.html (GitHub Pages, static)
       ├─ type ───┤        │
       └─ voice ──┘        ▼
                 [Universal Detector]  deterministic keyword + backend `type`
                           │ (LLM optional, COMING SOON)
                           ▼
                 [Universal Router]  routing_table → specialist Chitti
                           │
        ┌──────────────────┼─────────────────────┐
        ▼                  ▼                     ▼
   deep-link          POST /api/scanner/      localStorage
   to specialist      analyze[/text]          (Universal Memory,
   Chitti page        → Flask (Railway)        local-first)
                      → DeepSeek (text/vision)
```

- **Frontend:** static HTML on GitHub Pages (`sahayai.in`). No build step.
- **Backend:** Flask on Railway (`chitti-scanner-api`), **stateless** — images processed
  in-memory, never persisted ([DATABASE.md](../DATABASE.md)).
- **Storage:** `localStorage` only (consent flag, language, scan history / Universal Memory).
  **Nothing leaves the device** except the analyze POST (text/image) to the backend.
- **External:** DeepSeek (LLM, OpenAI-compatible) · MedUPI API (Jan-Aushadhi inline) ·
  substrate scripts (chitti_a11y.js, feedback-widget.js, chitti_lang.js, chitti_isl.js).

## B2. Scalability

| Question | Answer |
|---|---|
| 1,000 concurrent users | ✅ Frontend (static/CDN) trivially scales. The **deterministic router needs no backend**, so routing scales infinitely. Backend analyze is the only bottleneck. |
| 100,000 concurrent | ⚠️ Frontend fine; **backend would throttle** — single Railway dyno + DeepSeek rate limits. Router still works (client-side) but LLM enrichment degrades. |
| What breaks first | **DeepSeek rate limit / Railway dyno**, then the relevance-rail (already blocking today). The deterministic router is the graceful-degradation floor. |
| Scaling recs | (1) Router is already CDN-scalable — lean on it. (2) Cache analyze responses by text hash. (3) Move vision behind a queue (cost-disclosed, opt-in). (4) Horizontal Railway replicas for analyze. |

## B3. Security

| Check | Finding |
|---|---|
| PII stored without consent? | ✅ No. Consent gate before any scan; history is local + type/summary only (no raw image/text). |
| localStorage encryption | ❌ No (plaintext). Acceptable: local-first, low-sensitivity (scan summaries); KYC fragments masked. Documented. |
| Backend auth required | ❌ No (public analyze endpoint, by design — free, no sign-up). Rate-limiting is the missing control (tracked). |
| API keys exposed in frontend | ✅ No DeepSeek key in frontend; only the public Railway URL. Verified by grep. |
| XSS | ✅ All dynamic strings pass `escapeHtml()`/`escapeJs()`; router card uses static map strings + escaped category. No `innerHTML` of raw user text unescaped. |
| CSRF | N/A — no auth/cookies/state-changing GET; stateless POST. |

## B4. Data integrity

| Question | Answer |
|---|---|
| Can data be corrupted? | Low risk — local JSON wrapped in try/catch; malformed history is replaced, not crashed. |
| Can user lose data? | Yes, expected: clearing browser data / "Chitti forget" wipes local memory (by design). Cross-device backup = COMING SOON. |
| Backup/restore | ❌ None today (local-first). Cross-device sync gated on Turso shim (RED). |
| Sync conflicts (multi-device) | N/A today (single-device). Family Graph cross-device = COMING SOON. |

## B5. Integration points

| Integration | Failure behaviour | Timeout | Retry |
|---|---|---|---|
| DeepSeek (via backend) | Honest `unknown`/fallback; **router still routes from text** | backend-side | no |
| `chitti-scanner-api` analyze | `fetch` catch → ⚠️ message **+ deterministic router runs** (resilience fix) | ❌ no explicit client timeout (tech debt) | ❌ no |
| MedUPI API (Jan-Aushadhi inline) | Catch → "Could not reach MedUPI, try chitti_medupi.html" | ❌ none | ❌ no |
| Specialist deep-links | Pure navigation; no failure surface | n/a | n/a |
| Vaani handoff | sessionStorage + navigate | n/a | n/a |

**Recommendation:** add explicit `fetch` timeouts (AbortController, ~15s) + 1 retry on the
analyze + MedUPI calls. Tracked in [KNOWN_ISSUES.md](KNOWN_ISSUES.md) tech-debt.

## B6. Code quality

| Check | Finding |
|---|---|
| Linted | ⚠️ No formal linter in repo; inline JS **syntax-validated** (3/3 parse via vm). |
| console.logs in production | ✅ None added by CUSOS (router code has no console.log). |
| Error handling | ✅ analyze/MedUPI wrapped; router degrades gracefully; honest messages. |
| Meaningful names | ✅ `detectCategory`, `renderRouterCard`, `routeOpen`, `ROUTING_MAP`, `ROUTE_KW`. |
| Comments | ✅ CUSOS block + doctrine comments; routing_table is the documented contract. |

## B7. Deployment architecture

| Aspect | Detail |
|---|---|
| Frontend deploy | git push → GitHub Pages serves `chitti_scanner.html` from repo root. |
| Backend deploy | Railway from `chitti-scanner/render.yaml` (`chitti-scanner-api`, live, /health 200). |
| Rollback | Router is **feature-flagged** (`window.CHITTI_SCANNER_ROUTER=false`) → reverts to certified label-reader; or `git revert` the commit. No data migration. |
| Env vars | `DEEPSEEK_API_KEY`, `DEEPSEEK_VISION_MODEL` (off), `MEDUPI_API_BASE` — Railway dashboard. |
| CI/CD | ⚠️ No automated pipeline; cert + eval harnesses are run-on-demand (`tools/cert_scanner_cusos.mjs`, `tools/scanner_router_eval.mjs`). |

## B8. Technical debt log

| Item | Priority | Effort |
|---|---|---|
| Backend relevance-rail blocks normal labels | **Must fix** | M (rail allowlist, fleet-class) |
| DeepSeek classification falling back to `other` | **Must fix** | infra (funding) |
| No explicit client fetch timeout / retry | Should fix | S |
| Cross-device Memory + Family Graph (Turso shim unverified) | Should fix | M (verify shim first) |
| Router `reason` strings only EN+HI (7 langs fall back to EN) | Should fix | S per language |
| Pre-existing axe contrast (substrate) + nested-interactive (capture buttons) | Should fix | M (substrate, fleet-wide) |
| No CI pipeline for cert/eval | Nice to fix | M |
| Vision auto-detect (funded key, opt-in) | Nice to fix (roadmap P2) | M |

## Risk assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Backend rail blocks users | High (today) | Med (router mitigates) | client-side router resilience (shipped); rail allowlist (pending) |
| DeepSeek down/unfunded | High | Low (deterministic core) | rules are the product |
| Wrong route to a specialist | Low (0% in eval) | High if it happened | safety-supreme precedence + 👎 learning |
| Data loss (local-only) | Med (expected) | Low | documented; cross-device COMING SOON |

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
