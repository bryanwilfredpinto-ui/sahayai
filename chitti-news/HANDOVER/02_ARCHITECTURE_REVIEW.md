# Chitti News (CNOS) — Architecture Review

**Reviewer:** Chitti (solution-architect mode)
**Build commit:** `65f5aae`
**Date:** 2026-06-06
**Scope:** End-to-end system — ingest → classify → store → serve → swarm → render.

---

## A. System diagram

```
 ┌───────────────────────────────────────────────────────────────────────┐
 │  227 RSS PUBLISHERS (real Indian: TOI, HT, The Hindu, IE, NDTV, ...)   │
 │  6 categories × multi-publisher                                         │
 └───────────────┬───────────────────────────────────────────────────────┘
                 │  poll (scheduler)
                 ▼
        ┌──────────────────────┐    requests fails (403/cloudflare)
        │   INGEST              │ ─────────────────────────────────┐
        │   requests (primary)  │                                   ▼
        └──────────┬───────────┘                        ┌──────────────────┐
                   │                                     │  cloudscraper     │
                   │ ◄───────────────────────────────── │  (fallback)       │
                   ▼                                     └──────────────────┘
        ┌──────────────────────┐
        │  CATEGORY CLASSIFIER  │  rule + keyword; 31/31 unit tests
        │  (with `why` trail)   │  → National/Politics/Business/Sports/Ent/Tech
        └──────────┬───────────┘
                   ▼
        ┌──────────────────────┐
        │  TURSO (libSQL)       │  news.* schema isolation
        │  articles + sources   │
        └──────────┬───────────┘
                   ▼
        ┌──────────────────────┐
        │  Flask: chitti-news-api │
        │  GET /health           │
        │  GET /api/news/feed     │
        │  GET /api/news/*        │
        └──────────┬───────────┘
                   ▼
        ┌─────────────────────────────────────────────────────┐
        │  7-AGENT SWARM                                        │
        │  News → Verification → Context → Personalization →   │
        │  Accessibility → [Career]* → [Action]*               │
        │  (*Career + Action NOT built yet — Phase 2)          │
        │  DeepSeek = Chitti's Take (3-bullet) + fact-check    │
        └──────────┬──────────────────────────────────────────┘
                   ▼
        ┌─────────────────────────────────────────────────────┐
        │  chitti_news.html (1935 lines)                       │
        │  6 category tabs · 6 home rails · per-card Trust     │
        │  Strip (verified/partial/unverified) · Chitti's Take │
        │  · fact-check · For You / Read Later / Cancelled     │
        │  (localStorage-only)                                  │
        │  + chitti_a11y.js + feedback-widget.js substrate     │
        └─────────────────────────────────────────────────────┘
```

---

## B. Data flows

1. **Ingest flow** — Scheduler polls 227 RSS feeds. Primary fetch via `requests`; on 403 / Cloudflare challenge it falls back to `cloudscraper`. Parsed items normalized → category classifier → Turso `news.*`.
2. **Serve flow** — `chitti_news.html` calls `GET /api/news/feed` (and per-category endpoints). Payload includes source URL, verification badge, and a `why` trail per classification.
3. **Swarm flow** — Each served story passes News → Verification (≥2-source corroboration) → Context → Personalization (state/language/profession, on-device) → Accessibility. Career + Action are stubbed for Phase 2. DeepSeek generates the 3-bullet "Chitti's Take" and the fact-check verdict.
4. **Personalization flow** — For You / Read Later / Cancelled are **localStorage-only**, never synced to backend (privacy contract).

---

## C. External dependencies + fail-open behavior

| Dependency | Role | Failure mode | Behavior |
|---|---|---|---|
| Railway | Hosts `chitti-news-api` | **Currently 502 on prod** | Frontend renders from fixtures/cache; page does not white-screen |
| Turso (libSQL) | Article + source store | unreachable | API returns last-served / empty feed gracefully |
| DeepSeek | Chitti's Take + fact-check | timeout/quota | Card shows headline + Trust Strip without AI take (degrades, not breaks) |
| 227 RSS feeds | Content source | individual 404/403 | per-feed isolation; `cloudscraper` fallback; one bad feed never blocks the rest (HT Business 404 proves this) |

Design principle: **fail-open** — a downed dependency degrades the experience, never blanks the page.

---

## D. Scalability

| Scale | Assessment |
|---|---|
| ~1k concurrent | OK on a single Flask dyno + Turso |
| ~100k concurrent | Needs horizontal Flask scale-out + a feed CDN cache (edge-cache `/api/news/feed` for N seconds) |
| Bottleneck | **RSS ingest** — 227 sequential polls; move to a worker pool / staggered schedule + dedupe before classify |

The feed is read-heavy and highly cacheable; the personalization layer is on-device, so it adds zero server load.

---

## E. Security

- **No PII collected.** For You / Read Later / Cancelled are localStorage-only, never synced.
- **No API keys in the frontend** — DeepSeek and Turso credentials live server-side only.
- **XSS** — all dynamic strings escaped via `esc()` before insertion into the DOM.
- **No off-device tracking** (ROLE.md hard rule).

---

## F. Deployment & rollback

- Deploy target: Railway service `chitti-news-api` + static `chitti_news.html` on sahayai.in.
- Rollback: redeploy previous Railway image; frontend is a static file (revert commit + redeploy).
- **Current state:** prod API 502 — redeploy required (likely `DATABASE_URL` libsql:// env gap, QUALITY_STATUS.md §5). This is the top infra action item.

---

## G. Technical-debt log

| # | Item | Type | Severity | Owner |
|---|---|---|---|---|
| 1 | Production 502 — Railway redeploy / `DATABASE_URL` libsql:// env gap | infra | High | Sire/infra |
| 2 | axe color-contrast (27 nodes) — saffron/grey on white below AA | code | Medium | CNOS |
| 3 | axe nested-interactive (36 nodes) — art-card role=button with inner buttons | by-design tradeoff | Medium | CNOS |
| 4 | axe aria-required-children (7 nodes) | code | Medium | CNOS |
| 5 | ~166 tap targets < 44px | code | Medium | CNOS |
| 6 | Career + Action agents not built | scope | Low | CNOS (Phase 2) |
| 7 | Vernacular coverage gap — Gujarati = 0 RSS feeds | content | Low | CNOS |

---

## Architect verdict

✅ **APPROVED** — architecture is sound, fail-open, privacy-clean, and scales on a known path. The single hard blocker is the infra-owned production 502 redeploy. Code-level debt is bounded and tracked.

**World Class CNOS — Commando Discipline. Zero Excuses.**
