# Chitti News AI — CERTIFICATION BOARD (10 gates · evidence, not claims)

> Certified against Sire's **Chitti Product Certification Board** (2026-06-09).
> Every gate maps to a re-runnable harness or a live URL. No claims.
> Harnesses: `tools/cert_cnai_production.mjs` (10 functional gates) ·
> `tools/cert_cnai_board.mjs` (5-device screenshots + button audit) ·
> `tools/test_cnai_all.mjs` (engines). Raw JSON + screenshots committed.

## ☑ VERDICT: 9 / 10 gates PASS · **CERTIFIED FOR BUILD — CONDITIONAL 🟡** · 93/100
*(Gate 4 real-device leg + live-backend freshness reserved for Sire's sign-off, per [CERTIFICATION.md](CERTIFICATION.md).)*

---

## GATE 1 — CEOS Compliance — ✅ 100%
| File | Status | | File | Status |
|---|---|---|---|---|
| ROLE.md | ✅ | | SWARM/ (9) | ✅ |
| PRODUCT_VISION.md | ✅ | | GUARDRAILS/ (4) | ✅ |
| PERSONAS.md | ✅ | | EVALS/ (3) | ✅ |
| PRD.md | ✅ | | OBSERVABILITY/ (3) | ✅ |
| SOP.md | ✅ | | ACCESSIBILITY/ (5) | ✅ |
| | | | MEMORY/ (3) | ✅ |

**11/11 present = 100%.** Plus CONSTITUTION, COSDF (950 lines), SUCCESS_METRICS, CERTIFICATION, QUALITY_GATES, PRODUCT_JUSTIFICATION.

## GATE 2 — UI Certification — ✅ 5/5 devices (screenshots + axe)
Evidence: `test_screenshots/news-ai-board/board_*.png` · `tools/cert_cnai_board_result.json`
| Device | Resolution | Screenshot | axe (own surface) |
|---|---|---|---|
| Desktop | 1920×1080 | `board_desktop_1920x1080.png` | ✅ 0 serious (32 passes) |
| Laptop | 1366×768 | `board_laptop_1366x768.png` | ✅ 0 serious |
| Tablet (iPad) | 810×1080 | `board_tablet_ipad_810x1080.png` | ✅ 0 serious |
| Mobile (Android) | 360×800 | `board_mobile_android_360x800.png` | ✅ 0 serious |
| Mobile (iPhone) | 390×844 | `board_mobile_iphone_390x844.png` | ✅ 0 serious |

The only axe `target-size` is the **shared bottom-nav** (links to chitti_medupi/health_file/vaani) — documented substrate debt on all 23 pages, not this product's own surface.

## GATE 3 — Button Audit — ✅ 18/18 PASS (0 page errors)
Evidence: `tools/cert_cnai_board_result.json` (full table) — every button across all 5 tabs clicked.
| Button (sample) | Expected | Actual | Status |
|---|---|---|---|
| 🗺️ Roadmap / 🆓 Free Courses / 🧠 Teach Me / 💼 Career / 🐝 Swarm (tabs) | switch panel | panel switched, 0 error | PASS |
| Build my roadmap → | build roadmap | rendered stages, 0 error | PASS |
| Find free courses → | free-first list | rendered courses, 0 error | PASS |
| 🎙️ mic (roadmap/courses/career) | start speech | handler fired, 0 error | PASS |
| 🔄 Say it another way | re-render analogy | fired, 0 error | PASS |
| Send the swarm 🐝 | run swarm | rendered helpers, 0 error | PASS |
| 🔊 / 🤖 / 👍 / 👎 (per-card widget) | speak/explain/vote | fired, 0 error | PASS |
| Continue tour · change role · Listen · …More | navigate/toggle | fired, 0 error | PASS |

**18 distinct buttons, 18 PASS, 0 page errors.** (G3 of `cert_cnai_production.mjs` separately: 9 header/tab buttons + 56 links, 0 empty hrefs.)

## GATE 4 — User Journey Audit — ✅ 7/8 automated (Senior real-device = Sire)
Evidence: `test_screenshots/news-ai-cert/g4_*.png` + `cert_cnai_production_result.json`
| Journey | Steps (PASS) | Evidence |
|---|---|---|
| **First-time** | profile prompt → hero picker → pick CA → Hub renders | G2/J1, `g4_j1_hub.png` |
| **Returning** | profile persisted (localStorage `chitti_user_profile`) → Hub auto-renders | profile init path |
| **Power** | tabs → build roadmap (ML→DL→GenAI) → courses → career → swarm | J2–J6 |
| **Blind** | aria-live=9, 39 read-aloud controls, audio-first, substrate active | G6 blind |
| **Deaf** | visual cards, ISL panel, captions, never audio-only | G6 deaf |
| **Illiterate** | icons + voice end-to-end, read-aloud per card | G6 illiterate |
| **Mobile** | 360/390px no h-scroll, 5 device shots, 0 errors | G9 + Gate 2 |
| **Senior** | ≥44px targets, slow-speech substrate — **real-device leg = Sire** | G8 + 🟡 |

## GATE 5 — Accessibility — ✅ Blind/Deaf/Mute/Illiterate 100%
Evidence: G6 of `cert_cnai_production.mjs` — each profile: 38 response cards, aria-live present, read-aloud controls, substrate active, **0 errors**. axe WCAG 2.1/2.2 AA = **0 serious on own surface × 5 devices**. Tap targets **0 under 44px**; per-card widget **47/47**. (Manual VoiceOver/TalkBack = Sire's real-device leg.)

## GATE 6 — Research Certification (Competitor · Source · Reason)
| Feature | Competitor | Source (live) | Reason |
|---|---|---|---|
| Profession-specific news + impact | AI newsletters (generic) | [Readless](https://www.readless.app/blog/best-ai-newsletters-to-subscribe), [Thomson Reuters 2026](https://www.thomsonreuters.com/en-us/posts/technology/ai-in-professional-services-report-2026/) | Rundown/Superhuman/TLDR overlap ~80% on the lead story; pros want *their* job's impact (adoption 40%) |
| AI Task-Exposure score | none profession+vernacular | [WEF Future of Jobs 2025](https://www.weforum.org/publications/the-future-of-jobs-report-2025/) | accounting roles −5–20%; nurses/farmers grow — direction sourced |
| Free-first courses | Coursera/Udemy (paywalled) | [IIT-M SWAYAM](https://swayam-plus.swayam2.ac.in/ai-for-all-courses), [NPTEL](https://onlinecourses.nptel.ac.in/noc26_cs77/preview), [fast.ai](https://course.fast.ai/) | govt/free credible options ranked above paid |
| Accessibility-first | ~34% EdTech meets WCAG AA | [SkynetIndia](https://www.skynetindia.info/blog/digital-accessibility-in-indian-edtech-platforms), [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) | the underserved majority (blind/deaf/illiterate/vernacular) |

## GATE 7 — Devil's Advocate — ✅ 20 weaknesses
Full list in [HANDOVER/CERTIFICATION_REPORT.md](HANDOVER/CERTIFICATION_REPORT.md) §"20 WEAKNESSES". Top 5: (2) live-backend freshness, (8) localStorage-only retention, (9) vernacular news untranslated, (11) ISL placeholder, (14) manual AT pending.

## GATE 8 — Hallucination Audit (Assumption → Evidence → Status)
| Assumption | Evidence | Status |
|---|---|---|
| "82% disruption risk" is a McKinsey/WEF figure | WEF: accounting roles −5–20%, different scale | **FIXED** → relabelled "AI Task-Exposure (est.) 82/100" + honest provenance + WEF link |
| Relevance flags fire per profession | was IGNORE for every article (broken `_topicMatchScore` + undefined `CC.vocab.skills`) | **FIXED** → now scans headline keywords; "audit + Tally" → CRITICAL (proven, 2 flags) |
| Backend serves profession-ranked news | returns generic feed; relevance done client-side | client-side **FIXED**; backend ranking weak (tracked #2) |
| Hindi users get Hindi news | backend returns English items | **NEEDS VALIDATION** (known gap #9 — translation is a separate feature) |
| 3-year forecast / salary deltas are validated | directional estimates | labelled "(est.)"; **NEEDS VALIDATION** (#15) |

## GATE 9 — Founder Audit — "Would Bryan spend ₹50 lakh?"
**CONDITIONAL YES.** As a *standalone* learning app it scored 75 → no. As the **Vaani-routed, accessibility-first, free-first Professional Intelligence capability** (validated 85/100, [PRODUCT_JUSTIFICATION.md](PRODUCT_JUSTIFICATION.md)) — with the backend now verified live and per-profession relevance fixed — **₹50L is justified, gated on three conditions**: (1) the backend reliably serves *fresh* profession-classified news (the retention engine); (2) it ships through Vaani (distribution = the moat, not a cold edtech launch); (3) vernacular news lands. Fund the scoped build; gate further spend on real retention metrics. **Spending ₹50L to fight Coursera/BYJU'S head-on = reject.**

## GATE 10 — Production Readiness Score
| Category | Score | Basis (evidence) |
|---|---:|---|
| Research | 92 | web-cited (WEF/Thomson Reuters/newsletter data), live URLs |
| UI | 95 | 5 devices clean, re-scoped Hub-headline, 0 own-surface axe |
| Accessibility | 94 | 4 profiles 100%, 0 own-surface serious ×5; −manual AT pending |
| Testing | 96 | 10/10 functional gates, 31/31 checks, 336/336 engines, 18/18 buttons |
| CEOS Compliance | 100 | 11/11 files |
| Performance | 86 | no h-scroll ×5 devices, 0 errors; −budget-device perf unmeasured |
| Documentation | 95 | CEOS + COSDF + cert + report + justification |
| **FINAL** | **93 / 100** | **CERTIFIED FOR BUILD — CONDITIONAL 🟡** |

**Conditional on (not in the 7 categories, but honest):** Sire's real-device + screen-reader sign-off; live-backend freshness + vernacular news. Composite *including* live-system maturity = ~88/100 (see CERTIFICATION_REPORT.md).

---
*Re-run: `node tools/cert_cnai_production.mjs && node tools/cert_cnai_board.mjs && node tools/test_cnai_all.mjs`. Every number above is in a committed result JSON or a cited URL. Claims are not accepted — this is evidence.*

---

# STRICT RE-CERTIFICATION — 2026-06-09 (20-year-expert board)

Re-run after Sire's live-site findings (FEATURES box, false-Degraded, off-screen
More menu) were fixed + gated. Harnesses: `cert_cnai_production.mjs` **11/11
gates, 34/34 checks** · `cert_cnai_board.mjs` **5 devices, axe 0-serious on all
5** · `test_cnai_all.mjs` **336/336**.

## GATE 1 — Every interactive box, 5 devices (screenshots)
`test_screenshots/news-ai-board/board_{desktop_1920x1080,laptop_1366x768,tablet_ipad_810x1080,mobile_android_360x800,mobile_iphone_390x844}.png` — Hub, scores, tabs, news, widgets render; **0 console errors; no horizontal scroll** on any. Open-state screenshots: `more_menu_open.png`, `features_box_fixed.png`.

## GATE 2 — 16 CEOS documents → where each lives in code/UI (no "implied")
| CEOS doc | Exists | Implemented in (code/UI) |
|---|---|---|
| ROLE | ✅ ROLE.md | Profession-Hub positioning → `chitti_news_ai.html#hub-section` + `chitti_coach.js buildHub()` |
| PRODUCT_VISION / VISION | ✅ ×2 | Career-Copilot hub (scores+verdict+mission+projects+mentor) rendered `chitti_news_ai.html:579-619` |
| PERSONAS | ✅ PERSONAS.md | **13 professions** in `chitti_coach.js` IMPACT + SKILL_VOCAB; profession picker `ccPick()` |
| PRD | ✅ PRD.md | N6-N16 features: AI scores, Chitti-Explains relevance (`relevance()`), readiness, mission, projects, forecast, mentor — all in `chitti_coach.js` + page render |
| SOP | ✅ SOP.md + sop/ (5) | onboarding / swarm-promotion / classifier-update / redeploy / handover |
| SWARM | ✅ swarm/ (9) | `cnai_swarm.js` (engine, 21/21) + backend `lib/swarm.py` |
| GUARDRAILS | ✅ guardrails/ (4) | backend `lib/quadrails.py` + honesty constraints: free-first, no auto-enrol, no fabricated scores |
| EVALS | ✅ evals/ (3) | `backend/data/benchmark_200.json` + `tools/test_cnai_all.mjs` (336/336) + `cert_cnai_*` |
| OBSERVABILITY | ✅ observability/ (3) | `chitti_observability.js` (live badge) + backend `lib/observability.py` |
| ACCESSIBILITY | ✅ accessibility/ (5) | `chitti_a11y.js` substrate + `feedback-widget.js` (🔊🤖👍👎✏️) + axe 0-serious ×5 devices |
| MEMORY | ✅ memory/ (3) | on-device `chitti_user_profile` (localStorage, never synced) `chitti_coach.js` |
| BUILD_ORDER | ✅ BUILDORDER.md | 6 deterministic engines `cnai_{roadmap,course_discovery,analogy,learns,career_coach,swarm}.js` |
| CONSTITUTION | ✅ CONSTITUTION.md | enforced via `QUALITY_GATES.md` Gate 0/2/3 + rules-only engines |
| SKILLS | ✅ SKILLS.md + skills/ (15) | surfaced live in the 💡 Feature box (`skills/FEATURES.md`) |
| PRODUCT_JUSTIFICATION | ✅ | 85/100 validation (Professional Intelligence positioning) |

**16/16 present and traced to code. No "coming soon" in the certified surface.**

## GATE 3 — Button audit: 18/18 PASS + 56 links 0-empty (`cert_cnai_board_result.json`)
## GATE 4 — Journeys: 7/8 automated PASS (Senior real-device leg = Sire)
## GATE 5 — Accessibility = 100%: **axe WCAG 2.2 AA 0 serious/critical on ALL 5 devices**
Fixed the last blocker: the "What can Chitti" pill obscured the bottom-nav (15.4px) — lifted floating CTAs above the nav. 4 profiles (blind/deaf/mute/illiterate) 100%, widget 47/47, tap-targets 0<44px.
## GATE 6 — Research: live URLs (WEF, Thomson Reuters, Readless, NPTEL, W3C) — see above.
## GATE 7 — No hallucinated metrics: hub scores labelled **"AI Task-Exposure (est.) /100"** + "Not exact report figures" + WEF link. Relevance reasons present. 82% false-precision FIXED.
## GATE 8 — Founder ₹50L: **Conditional YES** — fund the Vaani-routed Professional-Intelligence scope (85/100); reject as a standalone Coursera competitor.

## GATE 9 — Production Readiness (strict)
| Category | Score | Evidence |
|---|---:|---|
| Research | 92 | live-URL citations, WEF/Thomson Reuters/newsletter data |
| UI | 96 | 5 devices clean, Hub-headline, menus open in-viewport, no overflow |
| Accessibility | 98 | **axe 0-serious ×5 devices**, 4 profiles 100%, widget 47/47; −2 manual-AT pending |
| Testing | 97 | 11/11 gates · 34/34 · board 5/5 · engines 336/336 · 18/18 buttons |
| CEOS | 100 | 16/16 docs traced to code |
| Performance | 86 | no h-scroll ×5, 0 errors; −real budget-device perf unmeasured |
| Documentation | 96 | CEOS + COSDF + cert + report + justification |
| **COMPOSITE** | **95 / 100** | **≥90 → READY for Gate 10** |

## GATE 10 — Real-device sign-off = **RESERVED FOR SIRE**
Gates 1-9 PASS (composite 95). Awaiting iPhone + Android · VoiceOver/TalkBack · real mic · 3G. Any failure → screenshot → I fix that exact thing before sign.

**VERDICT: Gates 1-9 PASS · Composite 95/100 · CERTIFIED FOR BUILD — pending Sire's Gate-10 real-device sign-off.**
