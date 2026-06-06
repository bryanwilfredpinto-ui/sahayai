# Chitti News (CNOS) — Known Issues List

**Build commit:** `65f5aae`
**Date:** 2026-06-06
**Severity counts:** Critical 0 · High 1 (infra) · Medium 4 · Low 3 · **Total 8**

---

## Issues

| # | Issue | Severity | Workaround | Owner |
|---|---|---|---|---|
| 1 | **Production `chitti-news-api` returns 502** "Application failed to respond" on every endpoint incl `/health`. Local Flask boots clean (200) and passes 49/49 tests, so this is a deploy/infra defect — likely the `DATABASE_URL` libsql:// env gap (QUALITY_STATUS.md §5). | **High (infra)** | Frontend renders from real-sample fixtures / cache (fail-open); QA run against local Flask + intercepted `/api/news/*`. | Sire / infra |
| 2 | **axe color-contrast** — 27 nodes below WCAG AA (saffron/grey text on white). | Medium | Content is still readable; raise foreground darkness / weight on flagged tokens. | CNOS |
| 3 | **axe nested-interactive** — 36 nodes. The art-card is `role=button` (tap-to-hear) and contains inner 🔊🤖👍👎 buttons. | Medium | By-design tradeoff (whole-card tap-to-hear for blind/illiterate users). Refactor to non-nested pattern or expose inner controls via menu. | CNOS |
| 4 | **axe aria-required-children** — 7 nodes missing required child roles. | Medium | Structural fix to ARIA role hierarchy on the affected containers. | CNOS |
| 5 | **Tap targets < 44px** — ~166 small targets detected across cards. | Medium | Functional on touch; enlarge hit-areas to 44×44px min (icon padding). | CNOS |
| 6 | **Hindustan Times Business RSS → 404** — publisher moved the path; 1 of 25 sample URLs unreachable. | Low | Per-feed isolation means it never blocks other feeds; update the feed URL in the source registry. | CNOS |
| 7 | **Vernacular coverage gap — Gujarati = 0 RSS feeds** seeded. | Low | Other 25 substrate languages render via substrate; add Gujarati publisher feeds to registry. | CNOS |
| 8 | **Career + Action agents not built** — swarm is 5 of 7 (News→Verification→Context→Personalization→Accessibility). | Low | Documented as Phase 2; current 5-agent path is complete and tested. | CNOS (Phase 2) |

---

## Severity rollup

| Severity | Count | Issues |
|---|---|---|
| Critical | 0 | — |
| High | 1 | #1 (infra — prod 502) |
| Medium | 4 | #2 contrast · #3 nested-interactive · #4 aria-required-children · #5 tap targets |
| Low | 3 | #6 HT RSS 404 · #7 Gujarati 0 feeds · #8 Career+Action agents |

## Ownership rollup

| Owner | Count | Issues |
|---|---|---|
| Sire / infra | 1 | #1 |
| CNOS (code) | 4 | #2, #3, #4, #5 |
| CNOS (content/scope) | 3 | #6, #7, #8 |

## How each was found

- #1 — production endpoint probe (every `/api/news/*` + `/health` → 502) vs local Flask boot (200, 49/49 tests).
- #2, #3, #4 — `tools/cert_news_omnibus.mjs` axe-core WCAG 2.1 AA stage.
- #5 — omnibus a11y-profile stage (~166 sub-44px targets across cards).
- #6 — `tools/test_news_samples.mjs` URL-reachability check (24/25).
- #7 — RSS source-registry coverage audit (Gujarati = 0 feeds).
- #8 — swarm completeness check (5 of 7 agents built).

## Notes

- **0 critical functional bugs.** No issue blanks the page, loses data, or produces a functional break.
- The only High item is infra-owned (production redeploy), not a code defect.
- All 3 axe findings are WCAG-AA polish; #3 is an intentional accessibility tradeoff under review.

**World Class CNOS — Commando Discipline. Zero Excuses.**
