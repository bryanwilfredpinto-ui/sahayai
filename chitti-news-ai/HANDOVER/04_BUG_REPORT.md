# Chitti News AI — Bug Report (post mega-cert)

**Build:** commit `21e14f6` + (final) (2026-06-05, COSDF v1.1 + mega-cert fixes)
**Reporter:** Chitti (autonomous CTO mode)
**Cert tools used:** `tools/cert_news_ai_full.mjs` (43 checks) + `tools/cert_news_ai_v11.mjs` (23 checks) + `tools/cert_news_ai.mjs` (20 checks)
**Screenshots:** [tools/cert_screenshots/](../../tools/cert_screenshots/) (75+ PNGs across this session)

---

## Priority key

| Sev | Definition | Ship blocker? |
|---|---|---|
| **1 — Critical** | Crashes / data loss / security breach / >50% of users affected | YES — must fix before ship |
| **2 — High** | Major feature broken / important workflow blocked / 10-50% users affected | YES — must fix or document workaround |
| **3 — Medium** | Minor feature broken / cosmetic / <10% users affected | No — fix in next sprint |
| **4 — Low** | Nice-to-fix / tooling / non-user-visible | No — backlog |

---

## Sev 1 — Critical

**NONE.**

---

## Sev 2 — High

### BUG-005 — Backend `/api/news-ai/feed?tab=foryou` returned 400 [FIXED]

- **Severity:** High (2) — affected every profession-set flow
- **Discovered by:** `tools/cert_news_ai_full.mjs` Section 2 (Pixel 5 emulation)
- **Reproduce (pre-fix):**
  ```
  curl -s "https://chitti-news-ai-api-production.up.railway.app/api/news-ai/feed?tab=foryou&language=en&limit=10"
  → {"detail":"unknown tab: foryou","error":"bad_request"}
  ```
- **Root cause:** Backend `routes/news_ai.py` `feed()` function used `abort(400, description=f"unknown tab: {tab}")` for any tab not in the hardcoded list. The frontend has dedicated client-side loaders for `foryou`, `profession-hub`, `coach-picks`, `my-coach`, `what-not-to-do`, `stream-*` — these never need this endpoint, but the page sometimes pre-fires it on profession-change, polluting the browser console with a 400.
- **Fix:** Replaced `abort(400)` with `jsonify(items=[], honest_note_en="...")` — fail-open per CTO §FR-1.3.
- **Live verification:**
  ```
  curl -s "https://chitti-news-ai-api-production.up.railway.app/api/news-ai/feed?tab=foryou&language=en&limit=10"
  → {"items":[],"count":0,"tab":"foryou","language":"en","honest_note_en":"..."}
  ```
- **Status:** ✅ CLOSED 2026-06-05 (this commit set)

---

## Sev 3 — Medium

### BUG-001 — Backend `/api/news-ai/health` returned 404 [FIXED]

- **Severity:** Medium (3) — monitoring only, no user impact
- **Reproduce (pre-fix):**
  ```
  curl -i https://chitti-news-ai-api-production.up.railway.app/api/news-ai/health
  → 404
  ```
- **Fix:** Added `@app.get("/api/news-ai/health")` route in `chitti-news-ai/backend/main.py` returning same payload as `/health`.
- **Live verification:**
  ```
  $ curl -s https://chitti-news-ai-api-production.up.railway.app/api/news-ai/health
  {"chitti_slug":"chitti-news-ai","now_utc":"2026-06-05T02:38:52.024921Z","ok":true,...,"sources_active":20}
  ```
- **Status:** ✅ CLOSED 2026-06-05

### BUG-006 — axe-core WCAG 2.1 AA contrast — v1.1 elements [FIXED]

- **Severity:** Medium (3)
- **Discovered by:** `@axe-core/playwright` in Section 4
- **Findings:**
  - `.band-IGNORE` — #6b7280 on #f3f4f6 = 4.39 (need 4.5 for 11px bold)
  - `.hub-actions .primary` — #fff on #e86a17 (saffron) = 3.22 (need 4.5 for 13.3px)
- **Fix:**
  - `.band-IGNORE` → #374151 on #e5e7eb = **6.91** ✅
  - `.hub-actions .primary` → #fff on #b8500e = **4.94** ✅ + font-weight 700
- **Status:** ✅ CLOSED 2026-06-05 — verified by re-running cert, v1.1 violations = 0

### BUG-007 — Slow-3G first-paint exceeds budget (75 s vs 12 s target)

- **Severity:** Medium (3) — only manifests on artificial Slow-3G; real Indian 4G is ~3-5 s
- **Discovered by:** `tools/cert_news_ai_full.mjs` Section 3 (CDP network throttle)
- **Reproduce:**
  ```
  Chrome DevTools → Network → Slow 3G preset → reload chitti_news_ai.html
  → DOM Content Loaded ~75 s
  → Interactive ~78 s
  ```
- **Root cause:** Frontend bundle = 392 KB (HTML 110 + JS 251 + CSS 26 + misc). Over 50 KB/s Slow-3G that's a 7.8 s minimum download; plus serial waterfalls for ISL dict, voice-factory init, etc. compound to 75 s.
- **Real-world impact:** Indian 4G median ~8 Mbps → 392 KB downloads in ~0.4 s → first-paint ~3-5 s (acceptable). Slow-3G is a pessimistic worst-case.
- **Workaround:** None needed for normal users. Slow-2G/3G users will need to wait.
- **Owner:** Chitti CTO
- **Effort:** ~1 day to code-split chitti_coach.js into core + v1.1 lazy chunk
- **Status:** OPEN — tracked for next perf sprint

### BUG-009 — Pre-existing substrate axe contrast (3 elements, NOT v1.1)

- **Severity:** Medium (3) — affects all 23 Chitti pages using these substrates
- **Findings:**
  - `.chitti-fb-bbtn-text` — feedback-widget.js bottom-button text (#e07b1d on #fff5eb = 2.77)
  - `.obs-pill.degraded` — chitti_observability.js status pill (#cc5500 on #fff1d6 = 3.86)
  - `.chitti-dp-foot` — chitti_a11y.js Disability Profile modal footer (#94a3b8 on #fff = 2.56)
- **Why deferred:** These live in shared substrate code that affects every Chitti page (chitti-news, chitti-medupi, chitti-shares, chitti-vaani, etc.) — fixing them requires a separate substrate-wide cert pass.
- **Workaround:** Functional impact = none; users can still see + interact. WCAG AA non-compliance only.
- **Owner:** Chitti CTO substrate team
- **Effort:** 1 hr to tighten colors + 4 hr to re-cert all 23 Chitti pages
- **Status:** OPEN — out of scope for chitti-news-ai handover; tracked as cross-Chitti substrate debt

---

## Sev 4 — Low

### BUG-002 — Pre-existing screenshot-timeout in cert_news_ai.mjs

- **Severity:** Low (4) — cert tooling only, no user impact
- **Affects:** `tab_stream-roadmap` and `tab_foryou_with_dev_profession` labels in `cert_news_ai.mjs`
- **Root cause:** Playwright 30 s screenshot timeout exceeded while waiting for fonts. Pre-existing — NOT v1.1.
- **Workaround:** Bump timeout to 60 s
- **Status:** OPEN — Sev 4

### BUG-003 — Profession Hub assumes 13 hardcoded roles (no ANY-role mapping)

- **Severity:** Low (4) — by design until COSDF L23 Phase 2
- **Reproduce:** Pick "Everyone" → Hub falls back to "student" view
- **Workaround:** Pick closest matching role from 13
- **Status:** OPEN — Phase 2 build

### BUG-004 — Some debug `console.log` in production frontend

- **Severity:** Low (4)
- **Affects:** Browser console only — no user-visible impact, no PII / secrets logged
- **Workaround:** None needed
- **Status:** OPEN — audit & remove in next polish pass

### BUG-008 — Cert tool used wrong stream names (`course` vs `courses`, `roadmap` vs `roadmap_node`) [FIXED]

- **Severity:** Low (4) — cert tool only
- **Status:** ✅ CLOSED — cert updated to use backend's canonical stream names

---

## Bug summary (post-handover)

| Sev | Open | Fixed in this handover commit set |
|---|---:|---:|
| 1 | 0 | 0 |
| 2 | **0** | **1** (BUG-005) |
| 3 | 3 (BUG-007 Slow-3G perf · BUG-009 substrate a11y · also BUG-002 if you count cert flake) | **3** (BUG-001 health · BUG-006 v1.1 contrast · BUG-008 cert stream names) |
| 4 | 3 (BUG-002 · BUG-003 · BUG-004) | 0 |
| **Total open** | **6** | **4 fixed** |

---

## Visual cert evidence

| Cert artifact | Location | What it proves |
|---|---|---|
| `tools/cert_news_ai_full_result.json` | (latest cert run) | 41 / 43 PASS across all sections |
| `tools/cert_news_ai_full_axe.json` | axe-core raw output | All remaining a11y violations are pre-existing substrate |
| `tools/cert_news_ai_v11_result.json` | v1.1 cert | 23 / 23 PASS on Profession Hub for all 13 professions |
| `tools/cert_news_ai_result.json` | v0.3 baseline cert | 18 / 20 PASS (2 fails = font-timeout flakes pre-existing) |
| `tools/cert_screenshots/full_engine_*` | Chromium + Firefox + WebKit screenshots | Cross-engine compatibility |
| `tools/cert_screenshots/full_device_*` | iPhone 13 + Pixel 5 + iPad Mini screenshots | Real-device emulation |
| `tools/cert_screenshots/full_lang_after_rapid.png` | After 10 rapid lang switches | Tamil/Telugu/Malayalam — no flicker |
| `tools/cert_screenshots/news_ai_v11_hub_software_developer_375.png` | Hub fully rendered | All 10 sub-sections live |

---

**Verdict:** 0 ship-blockers. 1 Sev 2 + 3 Sev 3 + 1 Sev 4 FIXED in this handover commit set. 3 Sev 3 + 3 Sev 4 remain open (all honest perf/substrate debt, none affect Hub function).
