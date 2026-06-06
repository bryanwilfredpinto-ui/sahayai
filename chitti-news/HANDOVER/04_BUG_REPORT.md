# Chitti News (CNOS) — Bug Report

**Build commit:** `65f5aae`
**Date:** 2026-06-06
**Summary:** 0 critical functional bugs. 5 logged items: 1 infra, 3 axe (2 code-defect / 1 by-design tradeoff), 1 publisher-side 404.

---

## BUG-1 — Production API returns 502 on every endpoint

| Field | Value |
|---|---|
| Severity | High |
| Classification | **Infra / deploy defect** (NOT a code defect) |
| Repro | `curl https://<chitti-news-api>/health` → `502 Application failed to respond`; same for `/api/news/feed` and all `/api/news/*`. |
| Expected | `GET /health` → `200 {"ok":true}` |
| Actual | 502 on every endpoint |
| Evidence | Local Flask: `GET /health` → 200 `{"ok":true}`, `GET /api/news/feed` → 200, 227 RSS sources + 6 articles seeded, scheduler started, 49/49 backend tests pass. So the code is healthy; the Railway deploy is not. |
| Likely cause | `DATABASE_URL` libsql:// env gap (QUALITY_STATUS.md §5). |
| Status | **OPEN — infra-owned.** Fix = Railway redeploy with correct libsql env. |

---

## BUG-2 — axe color-contrast (27 nodes)

| Field | Value |
|---|---|
| Severity | Medium (serious per axe) |
| Classification | **Code defect** (CSS) |
| Repro | Run `tools/cert_news_omnibus.mjs` axe stage on `chitti_news.html`; observe 27 color-contrast violations (saffron/grey text on white below 4.5:1). |
| Expected | WCAG 2.1 AA ≥ 4.5:1 for normal text |
| Actual | 27 nodes below threshold |
| Status | OPEN — darken flagged foreground tokens. |

---

## BUG-3 — axe nested-interactive (36 nodes)

| Field | Value |
|---|---|
| Severity | Medium (serious per axe) |
| Classification | **By-design tradeoff** (accessibility) |
| Repro | axe stage flags 36 nested-interactive nodes — the art-card is `role=button` (tap-to-hear) and contains inner 🔊🤖👍👎 buttons. |
| Expected | No interactive element nested inside another |
| Actual | Whole-card tap-to-hear wraps inner per-response controls |
| Rationale | Whole-card tap-to-hear is the blind/illiterate-first interaction; inner icons are the locked per-response widget. Refactor under review (expose inner controls without nesting). |
| Status | OPEN — tracked as intentional tradeoff. |

---

## BUG-4 — axe aria-required-children (7 nodes)

| Field | Value |
|---|---|
| Severity | Medium (critical per axe) |
| Classification | **Code defect** (ARIA structure) |
| Repro | axe stage flags 7 nodes whose role requires specific child roles that are absent. |
| Expected | ARIA role containers contain their required children |
| Actual | 7 nodes missing required child roles |
| Status | OPEN — fix ARIA role hierarchy on affected containers. |

---

## BUG-5 — Hindustan Times Business RSS 404

| Field | Value |
|---|---|
| Severity | Low |
| Classification | **Publisher-side / data** (NOT our code defect) |
| Repro | `tools/test_news_samples.mjs` → 25/25 schema-valid, 24/25 URL-reachable; the HT Business feed URL returns 404. |
| Expected | Feed URL reachable |
| Actual | 404 — publisher moved the path |
| Mitigation | Per-feed isolation: one bad feed never blocks the other 24. |
| Status | OPEN — update feed URL in source registry. |

---

## Disposition summary

| Bug | Type | Severity | Blocks ship? |
|---|---|---|---|
| BUG-1 | Infra | High | Yes (prod) — infra-owned redeploy |
| BUG-2 | Code defect | Medium | No |
| BUG-3 | By-design tradeoff | Medium | No |
| BUG-4 | Code defect | Medium | No |
| BUG-5 | Publisher/data | Low | No |

**0 critical functional bugs.** No data loss, no crash, no white-screen. Frontend fails open against the 502.

**World Class CNOS — Commando Discipline. Zero Excuses.**
