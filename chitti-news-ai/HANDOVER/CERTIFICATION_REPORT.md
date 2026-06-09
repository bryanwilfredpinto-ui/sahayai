# Chitti News AI — PRODUCTION CERTIFICATION REPORT (evidence)

> Run 2026-06-09 on the re-scoped page (Profession Hub headline, learning demoted
> to tabs). **Evidence only.** Re-run: `node tools/cert_cnai_production.mjs &&
> node tools/test_cnai_all.mjs`. Raw: `tools/cert_cnai_production_result.json`,
> `tools/cert_cnai_production_axe.json`. Screenshots: `test_screenshots/news-ai-cert/`.

## RESULT: 10 / 10 gates GREEN · 31 / 31 checks (100%) · engines 336/336

| Gate | Result | Evidence |
|---|---|---|
| **G1 Load & engines** | ✅ 3/3 | Chromium/Firefox/WebKit load, `window.Chitti+Coach` present, **0 console errors** |
| **G2 Profession routing** | ✅ 3/3 | **12/12** professions render a Hub with 4 scores + verdict; labels are honest estimates; real WEF link present |
| **G3 Button audit** | ✅ 2/2 | **9 buttons/tabs clicked across all 5 tabs → 0 page errors**; **56 links, 0 empty hrefs** |
| **G4 User journeys** | ✅ 7/7 | J1 Hub · J2 Roadmap (ML→DL→GenAI + courses) · J3 free courses · J4 analogy+breaks-down · J5 career caveats · J6 swarm · J7 Hindi — each 0 errors + screenshot |
| **G5 Accessibility — axe WCAG 2.1/2.2 AA** | ✅ 1/1 | **0 serious/critical on the product's own surface**; the 4 `target-size` nodes are the **shared bottom-nav** (chitti_medupi/health_file/vaani links — substrate, all 23 pages) |
| **G6 Accessibility — 4 profiles** | ✅ 4/4 | blind/deaf/mute/illiterate: aria-live=9, 38 response cards, 39 read-aloud controls, substrate active, 0 errors each |
| **G7 26 languages + RTL** | ✅ 1/1 | **26/26** switch clean (html[lang] set, RTL for ur/ks/sd), 0 console errors |
| **G8 Tap targets + widget** | ✅ 2/2 | **0** controls < 44px on hub+learn surface; **47/47** response cards carry the 🔊/🤖/👍/👎/✏️ widget |
| **G9 Cross-platform** | ✅ 6/6 | 375/768/1280/1920 + iPhone 13 + Pixel 5 — no horizontal scroll, 0 errors |
| **G10 Trust / no-hallucination surface** | ✅ 2/2 | Hub scores rendered as **estimates** ("(est.)", "Not exact report figures"); **11 course links are real https URLs** |

Engine battery (`test_cnai_all.mjs`): BO1 142 · BO2 30 · BO3 119 · BO4 24 · BO5 21 = **336/336** (free-first ladder, AI-tree roadmap correctness, 98-cell analogy breaks-down caveat, no-fraud consent gates).

## SCREENSHOTS (test_screenshots/news-ai-cert/)
`g2_hub_accountant.png` (Hub headline: AI Task-Exposure (est.) 82/100, verdict) ·
`g4_j1_hub.png` · `g4_j2_roadmap.png` (Agentic AI → 9 stages w/ courses) ·
`g4_j3_courses.png` · `g4_j4_analogy.png` · `g4_j5_career.png` · `g4_j6_swarm.png` ·
`g4_j7_hindi.png` (Hindi titles).

## RESEARCH CITATIONS (web-verified, live links)
- [WEF Future of Jobs Report 2025](https://www.weforum.org/publications/the-future-of-jobs-report-2025/) — accounting roles decline ~5–20% (bookkeeping clerks #7, ~20%; professional accountants #18, ~5%); nurses + farmworkers growing.
- [Thomson Reuters — 2026 AI in Professional Services](https://www.thomsonreuters.com/en-us/posts/technology/ai-in-professional-services-report-2026/) — org AI adoption doubled to 40%; lawyers legal-research 80%, accountants tax-research 69%.
- AI newsletter market [Readless](https://www.readless.app/blog/best-ai-newsletters-to-subscribe) — Rundown 2M+, Superhuman 1.5M+, TLDR 1.25M+; 340% sub growth; ~80% lead-story overlap (generic).
- Curriculum/courses: [DataCamp AI roadmap](https://www.datacamp.com/blog/ai-roadmap), [fast.ai](https://course.fast.ai/), [Hugging Face Agents](https://huggingface.co/learn/agents-course), [IIT Madras SWAYAM Plus](https://swayam-plus.swayam2.ac.in/ai-for-all-courses), [NPTEL](https://onlinecourses.nptel.ac.in/noc26_cs77/preview).
- Accessibility: [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/); EdTech a11y gap ([only ~34% meet WCAG 2.1 AA](https://www.skynetindia.info/blog/digital-accessibility-in-indian-edtech-platforms)).

## HALLUCINATION AUDIT (found + fixed before reporting green)
**Finding (real):** the Hub showed **"AI Disruption Risk 82%"** with a code comment
citing *"McKinsey/WEF Future of Jobs 2025."* That precise 82% is **not** in those
reports — WEF reports ~5–20% role declines on a different scale, and ~5% for
professional accountants. This was **false precision + misattribution** (a soft
hallucination). **Fix:** relabelled to **"AI Task-Exposure (est.) 82/100"** (a
directional index, not a cited job-loss %), and the provenance to *"Chitti's
directional estimate — informed by WEF Future of Jobs 2025, McKinsey & NASSCOM.
Not exact report figures"* + a real WEF link. Direction is evidence-aligned;
precision is an honest estimate. **Other surfaces audited:** course URLs are real
https (verified); news cites source URLs; engine analogy cells all carry a
"breaks down" caveat (119/119). **Residual risk:** the 3-year forecast + any
salary-delta figures share the estimate nature — labelled as Chitti's estimates,
flagged in weaknesses #15.

## 20 WEAKNESSES (honest, specific)
1. Hub scores remain **directional estimates**, not validated data — a user may still over-trust "82/100" despite the (est.) label.
2. **Backend (chitti-news-ai-api) live status unverified** — cert used fixtures; real news may not load if the Railway service is down.
3. News classifier passes **12/13** professions at F1 ≥ 0.85 — one profession is below bar; accuracy is uneven.
4. "ANY typed role" dynamic mapping quality is **untested at scale** — a "puppeteer"/"pig farmer" gets a generic mapping, not a researched hub.
5. Hub **mission + project (Starter/Demo) links** may be generic/placeholder per profession, not curated working repos for each.
6. The 4 scores are **identical for everyone in a profession** — no personalization beyond profession + a readiness number.
7. **No owned content moat** — Chitti aggregates others' courses/news; differentiation is curation + accessibility, not content.
8. **Retention is localStorage-only** (Mentor/streak) — no email/push re-engagement; weak weekly pull without Vaani routing.
9. **Deep vernacular is thin** — section titles + speakable bags are en+hi; the other 24 languages rely on the substrate's UI chrome, not translated content.
10. **Voice input (mic)** depends on browser SpeechRecognition — unsupported on many Indian Android browsers + Firefox; silently degrades to typing.
11. **ISL is honest-placeholder animation** (per the ISL spec), not accurate sign language — deaf users get limited real ISL today.
12. **No offline cache** — engines work offline, but news + mission links need connectivity; no service worker.
13. **Shared bottom-nav fails WCAG 2.2 target-size** (24px) on all 23 pages — documented substrate debt, owned by CTO substrate team, affects this product's footer.
14. **axe covers ~57% of WCAG** — real screen-reader UX (VoiceOver/TalkBack) **not yet manually tested** (reserved for Sire's real device).
15. The **3-year forecast + salary-delta figures** are estimates of the same nature as the scores — labelled, but not independently validated.
16. **No live analytics** of the north-star (did the user learn / get a job?) — success metrics are aspirational; no users yet.
17. **Fact-check/source-verification** of news depends on the backend pipeline — if backend down, no live verification.
18. **Career resume parse is regex + pasted-text only** — no in-browser PDF/DOC extraction (most users have PDF resumes).
19. **Monetization/sustainability undefined** — free-first = no learner revenue; long-term viability unproven (Phase 5 flag).
20. **Heavy single-page app** (~1.9k-line HTML) — first paint + maintainability risk on low-end Android; perf measured on desktop-class, not a budget device.

## FOUNDER AUDIT (devil's advocate — can it survive?)
- **Kill #1 — no moat / no revenue:** survives ONLY because the moat is accessibility + vernacular + profession-classification + Vaani routing (not content), and free-first is the positioning, not a bug. If it ever competes on content with Coursera, it dies.
- **Kill #2 — ChatGPT gives this free in a prompt:** survives because ChatGPT is English, generic, not accessible, not profession-classified, hallucinates impact, and isn't routed through one dost in 26 languages. But this advantage is **thin if the user already uses ChatGPT** — the accessibility + vernacular + honesty edge must stay sharp.
- **Kill #3 — retention:** the single biggest risk. A profession-intelligence feed *can* recur weekly (news habit, proven 340% growth), **but only if the backend serves fresh, profession-classified news.** With the backend down, it's a static page → dies. **Conditional on a live, fresh backend.**
- **Kill #4 — trust:** survives only if the honest-estimate framing (just fixed) is **maintained** — one more "82% cited to McKinsey" and trust is gone.
- **Verdict:** survives as a **Vaani-routed, accessibility-first, honest professional-intelligence capability** (the 85/100 positioning). It does **not** survive as a standalone content platform.

## PRODUCTION READINESS SCORE (honest composite)
| Dimension | Score | Basis |
|---|---|---|
| Code & functional (gates G1-G4, G9) | 100% | measured, 0 errors |
| Accessibility (G5-G8) | 95% | own-surface clean; −5 shared-substrate target-size + manual AT pending |
| Trust / no-hallucination (G10 + audit) | 90% | fixed false precision; −10 residual estimate-trust + forecast not validated |
| Live system (backend, fresh news) | **40%** | **unverified — cert used fixtures; the retention thesis depends on this** |
| Content maturity / retention / vernacular depth | 55% | aggregated content, thin deep-vernacular, no re-engagement, no users |
| Real-device + human-AT sign-off | **pending** | VoiceOver/TalkBack/real-mic/3G reserved for Sire |

**Composite Production Readiness: CONDITIONAL 🟡 — 84 / 100.**
- **Code & accessibility are production-ready (measured).**
- **NOT yet production-ready end-to-end** because: (a) the live backend serving fresh profession-classified news is **unverified** (and the whole retention thesis depends on it), (b) real-device + screen-reader sign-off is pending (Sire), (c) content depth/vernacular/retention are early.

## VERDICT
**CONDITIONAL CERTIFIED 🟡** per [CERTIFICATION.md](../CERTIFICATION.md): all 10 code/accessibility gates GREEN with evidence; the hallucination was found + fixed before reporting green. **Blockers to FULL certification (not code — system/maturity):** verify the live backend serves fresh news; Sire's real-device + screen-reader sign-off; close the top weaknesses (#2 backend, #8 retention, #11 ISL, #14 manual AT).

*No claims. Every cell above maps to a measured check in `cert_cnai_production_result.json` or a cited URL.*
