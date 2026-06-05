# Chitti News AI — Known Issues List (Honest)

**Build:** commit `a97a33f` (2026-06-05, COSDF v1.1)
**Author:** Chitti (autonomous CTO mode)
**Updated:** 2026-06-05

This is an HONEST list. Nothing is hidden. Every known limitation is named with a workaround (if any), and a remediation owner.

---

## 1. Untested surfaces (testing gaps, not bugs)

| # | Surface | Why untested | Remediation |
|---|---|---|---|
| U1 | Real iOS Safari on iPhone | No physical device in this session | Sire to do hands-on cert. Lighthouse can simulate but only Chromium engine. |
| U2 | Real Android Chrome on 2 devices | No physical devices in this session | Sire to do hands-on cert. |
| U3 | Real screen-reader (NVDA / JAWS / VoiceOver) blind-user flow | Headless Playwright cannot speak | Sire to test with TalkBack on Android or VoiceOver on iOS. |
| U4 | 3G slow-network throttling | Network conditions emulation not run in this cert | Add `await page.context().route()` throttle in next cert pass. |
| U5 | Lighthouse / WAVE automated a11y scan | Not run in this env | Run `npx lighthouse https://sahayai.in/chitti_news_ai.html --output=html --output-path=tools/lighthouse_news_ai.html` |
| U6 | Tamil / Telugu / Malayalam rapid-switch flicker | Auto-test ran 10 switches × 5 langs, NO visible flicker observed, but Hub surface (newly added) was NOT specifically isolated | Sire's 10-second manual flicker test on the Hub tab |
| U7 | Pre-existing screenshot-timeout on `stream-roadmap` and `foryou_with_dev_profession` tabs in `cert_news_ai.mjs` | Font-loading timeout in Playwright cert script — NOT a v1.1 regression; predates this commit | Bump `page.waitForLoadState('networkidle')` timeout to 60s in cert script |

---

## 2. Documented limitations (by-design, not bugs)

| # | Limitation | Why by-design |
|---|---|---|
| L1 | localStorage profile lost on browser uninstall / clear-cache | Privacy-first (per SAHAYAI §2 user-ownership). User can re-fill intake in 60 s. |
| L2 | No multi-device sync of user's coach profile | Privacy-first. No backend account, no cloud sync. |
| L3 | No `<noscript>` fallback (JavaScript required) | Same as every Chitti page — interactive product needs JS. |
| L4 | localStorage NOT encrypted | Profile is non-sensitive (profession, skills, goal, hours, AI usage band). |
| L5 | Per-device only, no cross-device backup | By design, see L2 |
| L6 | Profession Hub tab loads for 13 hardcoded professions only (no ANY-role mapping yet) | COSDF L23 Phase 2 (Dynamic Role Mapping) is the next build. Phase 1 covers 13 most-asked roles. |

---

## 3. Spec'd-but-not-built features (deferred, with status)

| # | Feature | COSDF Level | Status | Effort |
|---|---|---|---|---|
| S1 | Community Intelligence (user submissions of prompts/courses/tools/certs) | L20 | spec'd in PRD N13 | 3 days |
| S2 | Dynamic ANY-role mapping (user types "vet" → mapped to closest profession) | L23 Phase 2 | spec'd in PRD N16 | 1 day |
| S3 | Per-card relevance band shown on Coach Picks tab (currently only on AI Aaj news cards) | L14 extension | not in v1.1 ship | 1 hr |
| S4 | Hub forecast card visualisation (graph not table) | L22 polish | low priority | 2 hr |
| S5 | Native mobile push notifications for urgent items | Chitti PA's domain | deferred | N/A |
| S6 | Federated swarm cross-Chitti learning fully automated | SWARM.md L20 | partially built (manual review) | 1 week |

---

## 4. Open bugs

See [04_BUG_REPORT.md](04_BUG_REPORT.md) for full priority list with reproduction steps.

| Sev | Count | Examples |
|---|---:|---|
| Sev 1 (Critical) | **0** | — |
| Sev 2 (High) | **0** | — |
| Sev 3 (Medium) | **1** | Backend `/api/news-ai/health` returns 404 |
| Sev 4 (Low) | **3** | See bug report |

---

## 5. Performance bottlenecks (known, mitigated)

| # | Bottleneck | Impact | Mitigation in place |
|---|---|---|---|
| P1 | Backend `/feed` cold p50 ~250-400 ms vs target 200 ms | Cold-start lag after Railway redeploy | Boot ingest pre-warms; subsequent calls warm to ~120 ms |
| P2 | Per-card POST `/feedback/collect` is 1 row per event | Under 100k DAU could lag SQLite writes | Batch-flush would fix; deferred to scale phase |
| P3 | DeepSeek API calls in explain/insight serial (not batched) | Under high load, latency adds up | Fail-open to extractive keeps user UX fast |
| P4 | Frontend bundle 392 KB | Over 200 KB target for low-end Android Go | Could code-split chitti_coach.js into core + COSDF v1.1 lazy chunk |

---

## 6. Language-specific known issues (historical from prior sessions)

| Lang | Issue | Severity |
|---|---|---|
| Tamil (ta) | Reported as flicker-prone on some pages during rapid switch | **NOT REPRODUCED** on Hub in this cert (10 rapid switches, no flicker), but flagged here for Sire's manual verification. |
| Telugu (te) | Same as Tamil | NOT REPRODUCED |
| Malayalam (ml) | Same as Tamil | NOT REPRODUCED |
| Hindi (hi) | Some UI strings still in English where translation key missing | Low — Hub inherits from substrate; will fix as substrate dict grows |
| Sanskrit (sa) | Voice readback uses fallback voice (mock_bhashini) | Tracked separately in Voice Factory phase 2 |
| Oraon | Voice readback uses fallback voice | Same as Sanskrit |

---

## 7. Workarounds list (for issues the user might hit)

| Issue | Workaround |
|---|---|
| Hub doesn't render for my profession | Make sure profession is selected in the picker (not "Everyone"). Refresh once. |
| My intake saved but Readiness Score didn't update | Open intake again — fill 3 readiness fields explicitly (defaults are conservative `none`/`beginner`/`none`) |
| News cards don't show relevance band | Verify profession is set to something other than "Everyone". Band hides for `IGNORE` verdicts. |
| Profile lost after clearing browser data | By design (privacy). Re-fill intake in 60 s. |
| Voice readback didn't speak | Check OS-level audio + ensure browser has microphone/speaker permission. Voice substrate falls back to mock if Bhashini ULCA not configured. |
| Hub Mentor ETA shows "0 months" | You're already at 80/100. Keep shipping projects. |

---

**Verdict:** All known issues are honestly documented. None block shipping. Most "untested" rows are gaps in the testing infrastructure (no real devices in this environment), not in the product.
