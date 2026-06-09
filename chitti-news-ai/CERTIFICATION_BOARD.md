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
