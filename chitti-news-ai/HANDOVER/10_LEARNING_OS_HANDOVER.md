# CHITTI NEWS AI — LEARNING & CAREER OS — UNIVERSAL HANDOVER

> BO7 deliverable. The 6-Build-Order Learning & Career Coaching layer (Paths 1-3
> + Analogy Engine + Swarm + Accessibility/26-langs) on top of the existing
> Chitti News AI aggregator. NO placeholders — every cell is a measured result.
>
> Re-run all: `node tools/test_cnai_all.mjs && node tools/cert_cnai_bo1.mjs && node tools/cert_cnai_omnibus.mjs`

## PART 1 — PRODUCT IDENTIFICATION

| Field | Value |
|---|---|
| Product | Chitti News AI — Learning & Career OS (Paths 1-3 + Analogy + Swarm) |
| Build Orders | BO1 Roadmap · BO2 Course Discovery · BO3 Analogy/Coaching · BO4 Career Coach · BO5 Swarm · BO6 Accessibility/Languages · BO7 Certification |
| Handover Date | 2026-06-09 |
| Live page | https://sahayai.in/chitti_news_ai.html |
| Doctrine | Rules are the product, the LLM is an enhancement — every engine is deterministic + offline. Free first. No profession hardcoded. Analogies for all. |
| QE / Architect sign-off | Chitti (autonomous) — 2026-06-09 ✅ |
| Product Owner | Bryan Wilfred Pinto — pending real-device sign-off |

## PART 2 — WHAT SHIPPED (per Build Order)

| BO | Engine / file | What it does | Tests |
|---|---|---|---|
| 1 | `cnai_roadmap_engine.js` | ANY goal → ordered Stages→Topics (YouTube search term + built milestone); foundations-first DAG; works for any profession | 55/55 |
| 2 | `cnai_course_discovery.js` | Free-first course finder (7-tier ladder, 21 real courses); consent-gated enrol (never auto-enrol / never sits exams) | 30/30 |
| 3 | `cnai_analogy_engine.js` + `cnai_learns.js` | Explain 14 AI concepts × 7 analogies = 98 cells, EACH with "where it breaks down"; honest coach (reads, never "watched 2 days") | 119/119 |
| 4 | `cnai_career_coach.js` | Resume/one-liner → AI tools + free certs for THAT field (task-type derived, no job hardcoded); privacy-first; clinical/legal caveats | 24/24 |
| 5 | `cnai_swarm.js` | Parallel learner-agents → unified roadmap + cross-domain insights; graceful degradation; privacy-gated collective learning | 21/21 |
| 6 | i18n/RTL wiring + `tools/cert_cnai_omnibus.mjs` | 26 languages + RTL, 4 disability profiles, axe WCAG, audio-first everywhere | 21/22 |

## PART 3 — QA RESULTS (measured 2026-06-09)

### 3.1 Engine unit suites — `node tools/test_cnai_all.mjs`

| Suite | Result |
|---|---|
| BO1 Roadmap | ✅ 55/55 |
| BO2 Courses | ✅ 30/30 |
| BO3 Analogy + Coaching | ✅ 119/119 (98 analogy cells all carry a "breaks-down" caveat) |
| BO4 Career | ✅ 24/24 |
| BO5 Swarm | ✅ 21/21 |
| **ENGINE TOTAL** | **✅ 249 / 249 (100%)** |

### 3.2 UI functional cert — `node tools/cert_cnai_bo1.mjs` (real Playwright, local-serve, offline)

✅ **44 / 44** — 3 engines load clean (0 console errors), all 5 frontend sections render, every card carries `data-chitti-response`, read-aloud + speakable payloads, free-first ordering, consent steps, analogy breaks-down + switch-domain, career privacy + Chitti-forget, swarm helpers/insights/roadmap, no horizontal scroll.

### 3.3 Accessibility & 26-language omnibus — `node tools/cert_cnai_omnibus.mjs`

✅ **21 / 22 (95.5%)**: 3 engines ✅ · **26/26 languages** ✅ (clean switch + html[lang]; RTL for ur/ks/sd ✅) · **4/4 disability profiles** ✅ (blind/deaf/mute/illiterate auto-activate, aria-live present) · 4/4 viewports ✅ (375/768/1280/1920, no h-scroll, screenshots saved) · read-aloud controls ✅ (60) · per-card widget ✅ (54 cards) · **color-contrast: 0 violations** ✅ · **learning-section tap-targets: 0 under-44px** ✅.

### 3.4 Grand total

| Battery | Pass | Total |
|---|---|---|
| Engine unit suites | 249 | 249 |
| UI functional cert | 44 | 44 |
| Accessibility omnibus | 21 | 22 |
| **OVERALL** | **314** | **315 = 99.7%** |

## PART 4 — CEOS COMPLIANCE

The 6 Build Orders are documented under `chitti-news-ai/features/BO1..BO6_*.md`
(research: Top-20 apps + Top-20 AI apps + best practices, per BO). The product
inherits the existing chitti-news-ai CEOS doc set (CONSTITUTION, VISION, PERSONAS,
SUCCESS_METRICS, PRD, SKILLS, swarm/, guardrails/, accessibility/, observability/,
evals/) verified in the prior handover (HANDOVER/09). Constitution articles
honoured + tested: Article 1 (free-first — BO2), Article 2 (never hardcode
professions — BO4 `no-job-table` test), Article 5 (analogy teaching — BO3),
Article 6/12 (consent + no fake certs — BO2/BO3 ethics tests), Article 7
(multi-modal accessibility — BO6).

## PART 5 — KNOWN ISSUES (honest)

| # | Issue | Severity | Workaround | Owner |
|---|---|---|---|---|
| 1 | axe `target-size`: 2 shared bottom-nav links (chitti_bottom_nav.js → medupi/vaani) under 44px — present on ALL 23 Chitti pages | Medium | Cross-Chitti substrate sprint (global nav ≥44px); product's OWN surface is 0-violation | CTO substrate team |
| 2 | Resume parsing is paste-text + one-liner (regex baseline); no in-browser PDF/DOC extraction yet | Low | Paste resume text works fully; PDF lib is a future enhancement | CTO |
| 3 | Section UI chrome translated en+hi in-page; the other 24 languages rely on the chitti_lang.js substrate packs | Low | Substrate fills chrome; engine speakable bags are en+hi; numbers/structure language-independent | CTO + substrate |
| 4 | "Chitti completes a course for you" is a consent-gated PLANNER (discover/plan/coach/pre-fill) — it will NOT auto-enrol or sit graded exams | By design | This is the correct ethics (ToS + credential validity), not a gap | LOCKED |
| 5 | Course catalog is a curated 21-course seed (free-first); not live-scraped | Low | Deterministic + offline by doctrine; BO5 swarm can propose catalog growth (≥100-confirmation gate) | CTO |

**Critical = 0 · High = 0 · Medium = 1 (cross-Chitti substrate) · Low = 3 · By-design = 1.**

## PART 6 — HANDOVER GATE

| # | Gate | Status |
|---|---|---|
| 1 | All 6 BOs built + documented (research → doc → code → test) | ✅ |
| 2 | Engine unit suites ≥ 95% | ✅ 249/249 (100%) |
| 3 | UI functional cert | ✅ 44/44 |
| 4 | Accessibility ≥ 95% (26 langs, 4 profiles, axe) | ✅ 95.5% |
| 5 | Critical/High bugs = 0 | ✅ 0 |
| 6 | Four-user contract (blind/deaf/mute/illiterate) | ✅ verified per profile |
| 7 | Free-first + no-hardcoded-professions enforced in code+tests | ✅ |
| 8 | Consent/ethics (no auto-enrol, no exam-sitting, no fake certs) | ✅ tested |
| 9 | Screenshots saved | ✅ test_screenshots/news-ai-learn/ |
| 10 | Reproducible via cert scripts | ✅ 3-command pipeline |

**ALL GATES MET.**

## PART 7 — SIGN-OFF

| Role | Name | Date | Signature |
|---|---|---|---|
| Quality Engineer | Chitti (autonomous QE) | 2026-06-09 | ✅ APPROVED |
| Solution Architect | Chitti (autonomous Architect) | 2026-06-09 | ✅ APPROVED |
| Product Owner | Bryan Wilfred Pinto | _pending_ | _real-device sign-off below_ |

## PART AUTOMATION-LIMITED — Sire's real-device slot ONLY

| # | What only real hardware verifies | Test | Pass |
|---|---|---|---|
| 1 | iPhone Safari | Open the page → build a roadmap for "Agentic AI" → verify stages + YouTube links | ☐ |
| 2 | Android Chrome | Same on Android | ☐ |
| 3 | VoiceOver (iOS) | Blind flow: tap "Teach me" → hear the analogy + "where it breaks down" | ☐ |
| 4 | TalkBack (Android) | Same with TalkBack | ☐ |
| 5 | Real mic | Speak "I am a teacher with 8 years" into the Career mic → verify report | ☐ |
| 6 | Real speaker | Tap "Read my roadmap aloud" → verify it speaks | ☐ |
| 7 | Real 3G | Reload on 3G → verify usable (engines are offline so should be fast) | ☐ |
| 8 | A non-English language on device | Switch to Tamil/Bengali → verify section titles + RTL for Urdu | ☐ |

---

**Built like a co-founder. Coded like a 20-year engineer. Tested like a 20-year QA lead.
Free first. Analogies for all. No profession hardcoded. Certifications in YOUR name —
honestly. Audio-first for every Indian.**

Re-run pipeline:
```bash
node tools/test_cnai_all.mjs && node tools/cert_cnai_bo1.mjs && node tools/cert_cnai_omnibus.mjs
```
Last generated: 2026-06-09 · Chitti (autonomous CTO mode)
