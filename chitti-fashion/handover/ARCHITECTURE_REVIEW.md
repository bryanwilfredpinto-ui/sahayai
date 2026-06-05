🎖️ World Class Chitti Fashion — Commando Discipline. Zero Excuses.

# ARCHITECTURE REVIEW — Chitti Fashion (CFOS v2.1)

> **Reviewed by:** Chitti CTO (Solution-Architect role) · **Date:** 2026-06-05
> Grounded in the live build and `tools/fashion_handover_audit.mjs` evidence.

## B1. System architecture

```
┌──────────────────────────────── USER'S DEVICE (browser) ────────────────────────────────┐
│                                                                                          │
│  chitti_fashion.html  ──loads──►  chitti_fashion_engine.js   (DETERMINISTIC, no network) │
│   (UI + 8 tabs +          │       chitti_fashion_dyn.js      (9-lang dynamic output)     │
│    21 response cards)     │       chitti_fashion_i18n.js     (static labels, guarded)    │
│         │                 │       strings.js · chitti_lang.js (shared substrate)         │
│         │                 │       chitti_a11y.js · feedback-widget.js · chitti_features  │
│         ▼                 ▼                                                               │
│  IndexedDB  ◄── wardrobe items + photos (NEVER leave the device)                          │
│  localStorage ◄── profile, prefs, learning, impact ledger (non-sensitive)                │
│                                                                                          │
│         │  (OPTIONAL — only for richer LLM answers, NOT required for core value)         │
└─────────┼────────────────────────────────────────────────────────────────────────────────┘
          ▼  HTTPS POST  { text, language }  (text snapshot only, never photos)
   chitti-vaani-api  (Railway: chitti-vaani-api-production.up.railway.app)
     /api/vaani/ask   ── DeepSeek (currently 429 + off_topic rail → app degrades to engine)
     /api/feedback    ── stores 👍/👎 (best-effort, wrapped in try/catch)
          ▲
   Served by: GitHub Pages (Server: GitHub.com, Fastly/Varnish CDN) — static hosting
```

**Design principle (the chitti-news-ai doctrine):** *rules are the product; the LLM is an
enhancement, never a dependency.* The deterministic engine delivers 100% of the core value
with **zero network** — proven by the offline test (`dressMeWorksOffline=true`).

## B2. Scalability review

| Load | Verdict | Why |
|---|---|---|
| **1,000 concurrent users** | ✅ Trivially handled | The page + all logic are **static assets on a CDN** (GitHub Pages/Fastly). Each user runs the engine locally; no shared server state for core features. |
| **100,000 concurrent users** | ✅ For all deterministic features | CDN serves static files at edge; compute is on-device. **The only shared component is `chitti-vaani-api`** (optional LLM). It would be the first bottleneck **only** for users who invoke the AI-explain path. |
| **What breaks first under load** | The Railway `chitti-vaani-api` (single service) — but **only the optional LLM path**. Core styling never touches it. | Mitigation: the app already degrades to the engine when the API 429s. |

**Scaling recommendations:** (1) keep the engine the default path (done); (2) when the LLM is
funded, put the API behind autoscaling + a CDN cache for identical prompts; (3) shrink the shared
`strings.js` (561 KB) or code-split per page to fix the 3G load (KI-01).

## B3. Security review

| Item | Status | Evidence |
|---|---|---|
| PII stored without consent? | ✅ **No** — first-visit consent + DPDP-2023 notice; photos are opt-in camera captures | onboarding + `fa.z.004/005` |
| Where does PII go? | ✅ **Nowhere** — wardrobe photos stay in IndexedDB on-device; only a short **text** snapshot can reach the model | `faWardrobeText` (text only) |
| API keys exposed in frontend? | ✅ **No keys present** — grep of all fashion JS/HTML returns none; the only endpoint is a public API base URL | grep evidence in handover |
| localStorage encryption? | ⚠️ **No** — but contents are **non-sensitive** (style prefs, learning counts, size in cm). Documented as KI-05; acceptable for the data class. | — |
| Backend auth required? | ✅ **No PII server-side**, so no auth needed for the static app. The optional API is unauthenticated and stateless per request. | — |
| XSS | ✅ Output-encoded — `esc()` defined once, applied **109×** around dynamic/user text before `innerHTML` | grep `esc(` ×109 |
| CSRF | ✅ N/A — no authenticated state-changing endpoints; the feedback POST is anonymous + idempotent | — |
| Console.logs in production | ✅ **Zero** in all shipped fashion JS | grep `console.log` = 0 |

## B4. Data integrity

| Question | Answer |
|---|---|
| Can data be corrupted? | Low risk — items are simple JSON keyed by UUID in IndexedDB; writes are single-record `put`. Corrupt-image input is caught (`img.onerror`) and never persisted. |
| Can the user lose data? | **Yes, in two honest scenarios:** (a) the user clears browser storage / uninstalls; (b) a different device — wardrobe is **device-local by design** (privacy choice). |
| Backup/restore? | ⚠️ **Not yet** — no export/import. Captured as KI-06 (Should-fix). |
| Sync conflicts across devices? | N/A — deliberately **no cross-device sync** (photos never leave the device). Family "wearers" are multiple profiles on **one** device. |

## B5. Integration points

| Integration | Purpose | Failure behavior | Timeout | Retry |
|---|---|---|---|---|
| **DeepSeek** (via chitti-vaani-api `/api/vaani/ask`) | Optional richer explanations | ✅ App **degrades to deterministic engine**; user still gets full value | ⚠️ **No explicit timeout/AbortController** (KI-07) | ❌ none (by design — engine is the fallback) |
| **chitti-vaani-api `/api/feedback`** | Store 👍/👎 | ✅ Best-effort, wrapped in `try/catch`; failure is silent and harmless | ⚠️ none | ❌ none |
| **Voice Factory / Web Speech** (voice-out) | Speak responses | ✅ Falls back silently if unavailable | n/a | n/a |
| **Maps deep-link** (Clothing Doctor "find a tailor") | External nav | ✅ Plain `https` link, opens new tab | n/a | n/a |
| **GitHub Pages CDN** | Serve the app | ✅ Static, highly available | n/a | browser-native |

## B6. Code quality

| Check | Result |
|---|---|
| Linted / syntax-clean | ✅ `node --check` passes on engine + dyn; harnesses run clean |
| console.logs in prod | ✅ **0** |
| Error handling | ✅ All `fetch` wrapped in `try/catch`; image/load/observer paths guarded; verified by edge tests (0 fatal errors across all edge cases) |
| Meaningful names | ✅ `fa*` namespacing, `classifyOccasion`, `coordinateFamily`, `impactStats`, `diagnoseRepair` |
| Comments where needed | ✅ Section banners + rationale comments on each engine layer and v2.1 feature |

## B7. Deployment architecture

| Item | Detail |
|---|---|
| **How deployed** | `git push origin main` → **GitHub Pages** auto-builds & serves at `sahayai.in` via Fastly CDN. No build step (static assets + cache-bust `?v=YYYYMMDD`). |
| **Rollback** | `git revert <sha>` + push, or repoint Pages to a prior commit. Each feature shipped as an isolated commit for clean revert. |
| **Env vars** | None in the frontend. The optional API's keys live **server-side on Railway** only. |
| **CI/CD** | GitHub Pages build is the only automated step. **No test-gating pipeline yet** (KI-08) — tests are run locally pre-push (this pack is the evidence). |

## B8. Technical debt log

| ID | Debt | Priority | Effort |
|---|---|---|---|
| KI-01 | 3G load 6.2 s (shared `strings.js` 561 KB) | **Must fix** | M — split/trim strings, or lazy-load non-active langs |
| KI-02 | No `<noscript>` fallback message | Should fix | S |
| KI-07 | No fetch timeout/AbortController on the optional API | Should fix | S |
| KI-06 | No wardrobe export/import (data portability) | Should fix | M |
| KI-08 | No CI test-gate (tests run locally) | Should fix | M |
| KI-05 | localStorage unencrypted (non-sensitive data) | Nice to fix | S |
| KI-03/04 | Physical device-lab + human screen-reader pass | **Must do before human handover** | external (device lab) |

See **[KNOWN_ISSUES.md](KNOWN_ISSUES.md)** for the full honest list with workarounds.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
