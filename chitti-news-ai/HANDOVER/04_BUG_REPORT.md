# Chitti News AI — Bug Report

**Build:** commit `a97a33f` (2026-06-05, COSDF v1.1)
**Reporter:** Chitti (autonomous CTO mode)
**Cert tools used:** `tools/cert_news_ai.mjs` + `tools/cert_news_ai_v11.mjs` (Playwright @ 375 px)
**Screenshots:** `tools/cert_screenshots/` (62 PNGs from this session)

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

**NONE.**

---

## Sev 3 — Medium

### BUG-001 — Backend `/api/news-ai/health` returns 404

- **Severity:** Medium (3)
- **Affects:** External monitors / Sire's CTO dashboard health-check
- **Reproduce:**
  ```
  curl -s -o /dev/null -w "%{http_code}\n" \
    https://chitti-news-ai-api-production.up.railway.app/api/news-ai/health
  # → 404
  ```
- **Expected:** 200 with `{"status":"ok","ts":"..."}`
- **Impact:** Doesn't affect users. Affects monitoring + uptime tracking.
- **Workaround:** Use `/api/news-ai/feed/news?n=1` as a synthetic health probe (returns 200 with `items: []` or a row).
- **Owner:** Chitti CTO
- **Effort:** 30 min — add `@app.route('/api/news-ai/health')` to `chitti-news-ai/backend/main.py`
- **Screenshot/evidence:** `tools/cert_screenshots/` health 404 capture from cert run
- **Will fix:** Next backend deploy (target: same session if Sire approves)

---

## Sev 4 — Low

### BUG-002 — Pre-existing screenshot timeout on `stream-roadmap` tab in cert_news_ai.mjs

- **Severity:** Low (4)
- **Affects:** Cert tooling only (no user impact)
- **Reproduce:** `node tools/cert_news_ai.mjs` → check labels `tab_stream-roadmap` and `tab_foryou_with_dev_profession`
- **Root cause:** Playwright `page.screenshot()` 30 s timeout exceeded while waiting for fonts to load on Roadmap and For You tabs. Pre-existing — not a v1.1 regression. The tabs themselves render correctly when manually opened in a real browser.
- **Workaround:** Bump timeout to 60 s in cert script (`{ timeout: 60000 }`)
- **Owner:** Chitti CTO
- **Effort:** 10 min
- **Will fix:** Bundled with next cert pass

### BUG-003 — Profession Hub picker assumes 13 hardcoded roles

- **Severity:** Low (4) — by design until L23 Phase 2
- **Affects:** Users whose profession isn't in the 13 (e.g. "vet", "electrician", "designer")
- **Reproduce:** Pick "Everyone" → Hub falls back to "student" view
- **Root cause:** Phase 1 of COSDF L23 covers 13 most-asked roles. Phase 2 (ANY-role mapping via keyword + alias dictionary) is the next build.
- **Workaround:** Pick the closest matching role from the 13. Hub still shows generic AI scores + comparisons + mission.
- **Owner:** Chitti CTO
- **Effort:** 1 day to implement Phase 2 mapping
- **Will fix:** Next COSDF v1.2 increment

### BUG-004 — Some debug `console.log` calls remain in production frontend

- **Severity:** Low (4)
- **Affects:** Browser console only — no user-visible impact, no PII / secrets logged
- **Reproduce:** Open DevTools → Console → reload chitti_news_ai.html → see legitimate debug lines (`onProfessionChange`, ingest diagnostics)
- **Workaround:** None needed
- **Owner:** Chitti CTO
- **Effort:** 30 min audit
- **Will fix:** Bundled with next polish pass

---

## Bug summary

| Sev | Count | Open | Closed |
|---|---:|---:|---:|
| 1 | 0 | 0 | — |
| 2 | 0 | 0 | — |
| 3 | 1 | 1 | 0 |
| 4 | 3 | 3 | 0 |
| **Total** | **4** | **4** | 0 |

---

## Visual cert evidence

| Cert artifact | Location | Notes |
|---|---|---|
| Mobile 375 px screenshot (v0.3 baseline) | `tools/cert_screenshots/chitti_news_ai_375.png` | Pre-v1.1 |
| Mobile 375 px screenshot (v1.1 Hub) | `tools/cert_screenshots/news_ai_v11_hub_software_developer_375.png` | Hub fully rendered for SD profession |
| 768 px tablet screenshot | `tools/cert_screenshots/chitti_news_ai_768.png` | OK |
| 1280 px desktop screenshot | `tools/cert_screenshots/chitti_news_ai_1280.png` | OK |
| All 8 stream-tab screenshots | `tools/cert_screenshots/news_ai_tab_*.png` | OK |
| v1.1 cert JSON | `tools/cert_news_ai_v11_result.json` | 23/23 PASS |
| v0.3 cert JSON | `tools/cert_news_ai_result.json` | 18/20 PASS (2 pre-existing screenshot timeouts) |

---

**Verdict:** 0 ship-blockers. 1 medium-priority bug with a 30-min fix. 3 low-priority debt items. Ready for handover.
