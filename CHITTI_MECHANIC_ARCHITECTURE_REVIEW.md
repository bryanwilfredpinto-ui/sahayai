🎖️ World Class Chitti Mechanic (Chitti Auto OS) — Commando Discipline. Zero Excuses.

# ARCHITECTURE REVIEW — Chitti Mechanic
**Deliverable 2 of 5 · Pre-handover sign-off (Part B) · v2 (2026-06-05)**

> **v2 delta:** added **"Scan your RC"** (`chitti_rc_scan.js`) — a self-contained frontend module; the
> **MedUPI skin** (`chitti_mechanic_medupi_skin.css`) — a presentation-only layer; and the `mc.form.title`
> i18n fix. No backend/data-flow change. Reflected in B1/B2/B3/B5 below.

**Date:** 2026-06-05 · **Solution Architect:** Chitti CTO (Claude Opus 4.8) ·
**Companions:** [CHITTI_MECHANIC_MASTER_SPEC.md](CHITTI_MECHANIC_MASTER_SPEC.md) · [CHITTI_MECHANIC_COSDF.md](CHITTI_MECHANIC_COSDF.md) ·
[CHITTI_MECHANIC_CONTROL_PANEL.md](CHITTI_MECHANIC_CONTROL_PANEL.md).

## B1 — System architecture

```
                          ┌──────────────────────────────────────────┐
   USER (4-user contract) │  FRONTEND — GitHub Pages (static, CDN)    │
   blind/deaf/mute/illit. │  chitti_2wheeler.html / chitti_4wheeler   │
        │ voice/tap/photo │  + substrate: strings.js (VAI_STRINGS i18n│
        ▼                 │  — sole translator), chitti_a11y.js,      │
   ┌─────────────┐        │  feedback-widget.js, chitti_breakdown_kb/ │
   │ device:     │        │  ui/diagrams, chitti_ai_scanners,         │
   │ localStorage│◄──────►│  chitti_health_score, chitti_obd_ble,     │
   │ (twin,profile│       │  chitti_offline_sw (service worker cache) │
   │  passport)  │        └───────────────┬──────────────────────────┘
   └─────────────┘                        │
                          OFFLINE path ◄──┴──► ONLINE path
                          (deterministic,       (LLM)
                           no network)            │
   ┌──────────────────────────────┐    ┌─────────▼─────────────────────┐
   │ Breakdown KB / Self-Fix /     │    │ Chitti Vaani API (Railway)     │
   │ AI-Scanner guides / Health    │    │  POST /api/vaani/ask → DeepSeek │
   │ Score / OBD decode — 100%     │    │  (Swarm Diagnosis, Scam Shield) │
   │ in-browser, 9 languages       │    └─────────┬─────────────────────┘
   └──────────────────────────────┘              │
   ┌──────────────────────────────┐    ┌─────────▼─────────────────────┐
   │ chitti-2wheeler-api /         │    │ DeepSeek (sole LLM, §2 lock)   │
   │ chitti-4wheeler-api (Railway, │    └────────────────────────────────┘
   │ Flask) — deterministic routes │    ┌────────────────────────────────┐
   │ /api/2w /api/4w + Turso libSQL│◄──►│ Turso (per-Chitti DB)          │
   │ (local SQLite fallback today) │    │  — DATABASE_URL UNSET → local   │
   └──────────────────────────────┘    │     SQLite (ephemeral on restart)│
                                        └────────────────────────────────┘
```

## B2 — Data flows
1. **Diagnosis (online):** user symptom → frontend → `chitti-vaani-api /api/vaani/ask` → DeepSeek (8-agent
   swarm prompt) → JSON verdict → rendered (confidence vote + six fields). **Honest fallback** ("confidence
   low") if no parseable JSON / network fails.
2. **Diagnosis (offline):** symptom → `chitti_breakdown_kb.js` / `chitti_ai_scanners.js` (deterministic,
   in-browser) → rendered. No network.
3. **Vehicle memory:** profile/twin/service-log/passport → **localStorage** (device) + (intended) Turso via
   `/api/Nw/passport/*`. Today Turso `DATABASE_URL` is unset → backend uses local SQLite (ephemeral across
   Railway restart). **Risk: server-side persistence not durable yet** (Sire-blocked, §B4).
4. **Voice:** text → Voice Factory / Web Speech (TTS/STT) → audio. Fail-soft (silent if unavailable).
5. **Scan-your-RC (`chitti_rc_scan.js`):** RC photo → `FileReader` → **saved to localStorage device-local only**
   (never uploaded by us) + preview. **Two extraction paths:** (a) **deterministic, offline** — the typed/known
   registration number is parsed to **issuing State + RTO code** (37-entry table, no network); (b) **vision
   auto-read** — `rcTryVision()` POSTs the image to `window.CHITTI_RC_VISION_URL` **only if configured**, expects
   `{make,model,year}`, and **fills the form**. With **no endpoint set (today)** it returns `null` → the card
   shows **"AI auto-read coming soon"** and **never fabricates** a make/model. The 9-language strings are merged
   into `VAI_STRINGS` at load so `strings.js` stays the sole translator. This path auto-activates the moment a
   vision endpoint (DeepSeek vision / VAHAN-Parivahan partner) is wired — **no code change** needed.

## B3 — External dependencies
| Dependency | Use | Failure behavior | Timeout | Retry |
|---|---|---|---|---|
| **DeepSeek** (via Vaani) | LLM Swarm Diagnosis / Scam Shield | honest "confidence low" fallback | ⚠️ none explicit (browser default) — **tech debt** | none — tech debt |
| **chitti-vaani-api** (Railway) | LLM gateway | offline KB takes over | ⚠️ none explicit | none |
| **chitti-{2,4}wheeler-api** | deterministic routes | UI degrades to offline KB | ⚠️ none explicit | none |
| **Turso libSQL** | per-Chitti DB | local SQLite fallback (ephemeral) | n/a | n/a |
| **Voice Factory / Web Speech** | TTS/STT | silent fail | n/a | n/a |
| **Google Maps** (geo deep-link) | nearest-help | plain search query | n/a | n/a |
| **Web Bluetooth (ELM327)** | live OBD2 | honest "use Symptom mode" | n/a | n/a |
| **RC vision endpoint** (`CHITTI_RC_VISION_URL`) | RC make/model auto-read | **unset today** → honest "coming soon" (no fabrication) | ⚠️ none explicit (tech-debt #2) | none |
| Playwright browsers | test only | — | — | — |

## B4 — Scalability review
- **Frontend:** static on GitHub Pages CDN → **scales to millions** trivially. Offline KB is client-side →
  **infinite scale, zero server load** for self-fix/scanners/health-score/OBD-decode.
- **1,000 concurrent:** ✅ frontend + offline fine; deterministic backend routes (Flask) OK on one dyno for
  read-mostly traffic; LLM path bottlenecked by **DeepSeek rate limits**.
- **100,000 concurrent:** ⚠️ frontend fine; **what breaks first = the LLM path** (DeepSeek 429s) and the
  single Railway free-tier dyno per backend. Needs: DeepSeek capacity/queue, horizontal backend scaling,
  Turso connection pooling.
- **Recommendation:** keep diagnosis **offline-first** (already the design) so the LLM is an enhancement, not
  a dependency — this is the scaling moat. Add a request queue + cache in front of DeepSeek for the online path.

## B5 — Security review
| Check | Status |
|---|---|
| PII stored without consent? | ✅ No — vehicle data is device-local (localStorage), keyed by per-device token; no name/phone/Aadhaar collected. **RC photo is saved device-local only (`chitti_rc_photo_2w/4w`) and never uploaded by us**; the registration number is parsed on-device. |
| localStorage encrypted? | ❌ No — low-sensitivity vehicle data (make/model/odo) + the RC photo dataURL. Acceptable for device-local; **do not** sync it anywhere without consent. A registration number is mildly sensitive — kept on-device. |
| RC vision upload? | Only if `CHITTI_RC_VISION_URL` is explicitly configured (unset today). When wired, the image POSTs to **our** server-side endpoint — **must** carry consent + TLS; no third-party direct upload from the browser. |
| Backend auth required? | Public deterministic routes are read-mostly + unauthenticated by design; admin/metrics routes gated by `X-Admin-Secret`/token. |
| API keys exposed in frontend? | ✅ No — DeepSeek key lives **server-side** in `chitti-vaani-api`; frontend only calls the gateway. |
| XSS? | Mitigated — dynamic render escapes via `swEsc()` / `escAttr()`; model output is inserted as escaped text, not raw HTML. **Recommend** a CSP header on GitHub Pages/Cloudflare. |
| CSRF? | N/A — no cookie-based auth; stateless JSON POSTs. |

## B6 — Data integrity
- **Corruption:** localStorage reads are `JSON.parse`-guarded (try/catch → null) → no crash on corrupt data.
- **Data loss scenarios:** clearing browser data / "Chitti forget" wipes the device copy; **server copy not
  durable** (Turso env unset → SQLite ephemeral on Railway restart) — *the* integrity risk, Sire-blocked.
- **Backup/restore:** ❌ none today (Digital Service Book export is roadmap). 
- **Multi-device sync / conflicts:** ❌ not implemented — single-device, token-keyed. Family-fleet/sync = roadmap.

## B7 — Integration points & failure modes
Listed in B3. **All failure modes degrade gracefully** (offline KB, honest fallbacks) — no integration
failure produces a crash or a fabricated result (verified in QA A2 "no internet" + A1 J3/J8). **Gap:** no
explicit fetch timeouts or retry/backoff — a hung backend relies on the browser default. **Tech debt B8-#2.**

## B8 — Code quality & deployment
| Area | Status |
|---|---|
| Linted | ❌ no ESLint config (**tech debt**) — `node --check` syntax-gated in CI scripts |
| console.log in prod | ⚠️ some debug logs remain — **tech debt** (strip pass) |
| Error handling | ✅ try/catch throughout the new modules (breakdown/scanners/health/obd/i18n) |
| Naming / comments | ✅ clear (`swDiagnose`, `mbPruneLangSelect`); locked-decision comments throughout |
| Deployment | Frontend: push to `main` → **GitHub Pages auto-deploy**. Backends: `deploy_to_railway.sh` (Railway CLI). |
| Rollback | `git revert` + redeploy; every backend ships `render.yaml`/`railway.json` (reconstitutable from `main`) |
| Env vars | Railway dashboard (DEEPSEEK_API_KEY, DATABASE_URL). **DATABASE_URL unset** today. |
| CI/CD | ⚠️ no GitHub Actions; the cert/QA/scanner harnesses are **manual gates** (run before commit) — **tech debt** |

### Technical Debt Log (priority · effort)
| # | Debt | Priority | Effort |
|---|---|---|---|
| 1 | **Slow first-visit load on 2G/3G** (heavy JS bundle, ~37s @400kbps) — split/defer + lean substrate; chitti_lang.js removal already cut ~250KB | Must fix | M |
| 2 | **No fetch timeouts / retry** on LLM + backend calls (AbortController + backoff) | Must fix | S |
| 3 | **Turso `DATABASE_URL` unset** → server persistence ephemeral (Sire: `turso auth login`) | Must fix | S (Sire) |
| 4 | **No CI/CD** — wire the cert/QA/scanner harnesses into GitHub Actions | Should fix | M |
| 5 | **No ESLint + console.log strip** for production | Should fix | S |
| 6 | **CSP header** on the static host (defense-in-depth XSS) | Should fix | S |
| 7 | **22-language UI chrome** incomplete (9 complete; rest clean English fallback) | Nice to fix | L |
| 8 | **Camera/audio AI auto-detect + RC make/model auto-read** stubbed (all need the vision/audio model — DeepSeek funding or a VAHAN/Parivahan API; the RC path is already wired to `CHITTI_RC_VISION_URL`, auto-activates when set) | Nice to fix | L (Sire) |
| 9 | **No automated a11y scanner** (axe/Lighthouse) in the gate | Nice to fix | S |
| 10 | **Backup/restore + multi-device sync** (service book export, family fleet) | Nice to fix | L |

## Risk assessment
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Slow first load strands rural 2G users | Medium | Medium | offline-first + SW cache (repeat visits fast); bundle split (debt #1) |
| Server data loss on restart (Turso unset) | High (today) | Medium | local copy persists; fix env (debt #3) — Sire |
| LLM bottleneck at scale | Medium | Medium | offline-first design absorbs it; queue/cache the online path |
| No human-AT testing | — | Medium | structure/voice verified; schedule real blind/deaf/illiterate sessions before mass launch |

---
> **World Class Chitti Mechanic (Chitti Auto OS) — Commando Discipline. Zero Excuses.**
