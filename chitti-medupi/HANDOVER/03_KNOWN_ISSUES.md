# 03 — KNOWN ISSUES (HONEST) · Chitti MedUPI

**Date:** 2026-06-06 · **Build:** `f9ec517`

Honest list of everything not-green, with severity, workaround, and owner. Nothing hidden.

| # | Issue | Severity | Detail / Evidence | Workaround | Owner |
|---|---|---|---|---|---|
| 1 | Production backend unreachable from CTO sandbox | Process (not a product bug) | `curl https://chitti-medupi-api-production.up.railway.app/health` → HTTP 000 timeout. Matches QUALITY_STATUS.md §5 "I cannot curl `*.up.railway.app` from this dev environment." | Backend engine tested directly in Python (25/25 samples); live curl is Sire-side or a CI runner with egress. | Sire / infra |
| 2 | AI vision `/api/health-scanner/analyze` & medicine-strip auto-read need a funded DeepSeek key | Medium | Non-diagnostic vision returns honest `unavailable` until the key is funded (per QUALITY_STATUS.md §1, SAHAYAI_MASTER §5a). Deterministic same-composition match needs **no** key and is fully live. | Type/pick the medicine name (deterministic path) until the key lands. | Sire (funding) |
| 3 | Slow-3G first load exceeds the 10s target | Medium | `tools/medupi_crossplatform.mjs` edge #2: DOMContentLoaded **12,432 ms** on emulated 400 kbps / 400 ms. The page is a 213 KB inline HTML — heavy for rural 2G/3G. | Lang packs are already lazy (off critical path). Real fix = the §5c rural "2G mode" + §5b offline service-worker cache. | CTO (cross-cutting wave) |
| 4 | No offline-first (page needs network for the first load) | Medium | edge #1: blocking all network before first paint → blank. MedUPI has no service worker yet; offline-first is the cross-cutting `chitti_offline.js` wave (SAHAYAI_MASTER §5b), not yet wired to this page. | After first load the static UI works without backend (edge #5 proves backend-down is graceful). | CTO (cross-cutting wave) |
| 5 | Language switch can exceed the 1.5s warm target on the heaviest switch | Low | `tools/medupi_crossplatform.mjs` perf #4: warm switches 557–1792 ms; first/heaviest ~1.7–3.2 s. The substrate walks the entire 213 KB DOM (TreeWalker over all text nodes) on every switch. | Acceptable today (26/26 langs translate correctly). Optimisation: scope the re-translate to changed subtrees. | CTO |
| 6 | Live family-wallet / Health-File persistence + camera "Chitti forget" tombstone not curl-verified here | Low | Backend code is wired (QUALITY_STATUS Phase B 2026-05-23 curled these GREEN earlier); not re-curled from this sandbox (issue #1). | Re-verify on the live API after deploy. | Sire / infra |
| 7 | Doc-vs-reality DB note | Low (doc consistency) | Some chitti-medupi docs (README/API) describe the live store as Neon Postgres; SAHAYAI_MASTER §2 + QUALITY_STATUS list MedUPI as GREEN on Turso restart-survival. The two should be reconciled in a docs pass. | No functional impact (the engine is DB-agnostic; tested on in-memory SQLite). | CTO (docs) |

**Critical bugs: 0 · High bugs: 0 (2 found in this pass were fixed — see 04) · Medium: 3 (all cross-cutting/infra, none break the four-user contract or the safety invariant) · Low: 3.**

**Known-issues verdict: ✅ Acceptable for handover.** No issue affects the locked safety contract (strict same-composition, zero cross-molecule leakage, NPPA cap, server-enforced disclaimer) or the four-user accessibility floor. The two Medium cross-cutting items (offline + Slow-3G) are platform-wave work tracked in SAHAYAI_MASTER §5b/§5c, not MedUPI regressions.
