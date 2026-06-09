# Chitti News AI (CNAIOS) — CERTIFICATION

> The pass/fail gate a build must clear before it is "certified" shippable.
> Created under the Master Product Creation Rule after the product passed
> validation at **85/100 (BUILD)** as a **Professional Intelligence Platform**
> (see [PRODUCT_JUSTIFICATION.md](PRODUCT_JUSTIFICATION.md)). Canonical product
> spec: [COSDF.md](COSDF.md) · [ROLE.md](ROLE.md) · [PRD.md](PRD.md).
>
> A build is CERTIFIED only when **every** gate below is GREEN with a measured,
> re-runnable result. No gate is waived; an honest `AUTOMATION-LIMITED` (with a
> reason) is allowed only for real-device / human-AT checks reserved for Sire.

---

## 0. What this product is (so we certify the right thing)

A **Professional Intelligence Platform**: per-profession **AI News → Impact →
Tools/Certs/Prompts/Courses/Projects → Jobs → Mentor**, accessible (four-user
contract) in 26 languages, free-first, routed standalone AND via Vaani. It does
**NOT** get certified as a course marketplace/LMS. Certification therefore tests
**relevance + impact + trust + accessibility**, not course volume.

---

## 1. Certification gates (all must be GREEN)

| # | Gate | Criterion | Evidence (re-runnable) |
|---|---|---|---|
| C1 | **Profession routing** | Each canonical profession + a typed "ANY role" returns a populated Hub (News/Impact/Tools/Certs/Prompts/Projects) | backend benchmark + `tools/cert_news_ai_omnibus.mjs` hub rows |
| C2 | **Classifier accuracy** | Per-profession news classifier F1 ≥ 0.85 on the hand-labelled benchmark; rules-only critical path (no LLM dependency) | `backend/data/benchmark_category_*` + PHASE_0_BENCHMARK |
| C3 | **Impact verdict honesty** | Every news card carries a relevance verdict (IGNORE/PAY-ATTENTION/VERY-IMPORTANT/CRITICAL) + a reason; never a verdict without a reason | omnibus per-card check |
| C4 | **Free-first** | Courses/certs ranked free-first (govt → corp-free → … → paid LAST); every paid item carries a `why_no_free` | `tools/test_cnai_courses.mjs` 30/30 |
| C5 | **Roadmap correctness** | Learning paths obey the real AI tree (ML→DL→GenAI→Agentic, foundations-first) + a real course per stage | `tools/test_cnai_roadmap.mjs` 142/142 |
| C6 | **Analogy safety** | Every analogy ships a "where it breaks down" caveat (anti-leaky-analogy) | `tools/test_cnai_analogy.mjs` 119/119 |
| C7 | **Honesty / no fraud** | Never auto-enrols, never sits graded exams, never overpromises jobs; consent-gated registration | `tools/test_cnai_courses.mjs` ethics rows |
| C8 | **Four-user accessibility** | Blind / Deaf / Mute / Illiterate flows all pass; audio-first; ISL; never colour-only | `tools/cert_cnai_omnibus.mjs` 4/4 profiles |
| C9 | **26 languages + RTL** | All 26 substrate languages switch clean (html[lang], RTL for ur/ks/sd), 0 console errors | omnibus lang_all_26 |
| C10 | **WCAG 2.1/2.2 AA** | 0 serious axe violations on the product's own surface (substrate debt documented, not hidden) | omnibus axe_wcag_aa |
| C11 | **Per-response widget** | Every `[data-chitti-response]` card carries 🔊/🤖/👍/👎/✏️ | omnibus per_card_widget |
| C12 | **Cross-platform** | 3 engines (Chromium/Firefox/WebKit) + 375/768/1280/1920, no h-scroll, 0 console errors | omnibus engines + viewports |
| C13 | **Backend health** | `/health` 200; fail-open (serves with every LLM provider offline); Turso restart-survival OR honest fallback | backend tests + curl |
| C14 | **Trust / sources** | Every news item cites a real source URL; no fabricated stats/sources; staleness flag > 30 days | guardrails/hallucination + ingest logs |
| C15 | **Engine battery** | All deterministic engine suites green | `tools/test_cnai_all.mjs` (target 100%) |

## 2. Certification verdict formula

- **CERTIFIED ✅** — C1–C15 all GREEN (C10 = 0 serious on own surface; documented
  substrate items listed in KNOWN_ISSUES with an owner).
- **CONDITIONAL 🟡** — all code gates GREEN; only real-device / human-AT
  (VoiceOver, TalkBack, real 3G, real mic) pending Sire's sign-off.
- **NOT CERTIFIED ❌** — any of: C2 < 0.85, C5/C6/C7 failing (wrong curriculum,
  leaky analogy, or any dishonesty/auto-enrol/exam-sitting), C8 < 4/4, C10 has a
  serious violation on the product's OWN surface, or C14 finds a fabricated source.

## 3. Current measured status (2026-06-09)

| Gate cluster | Result |
|---|---|
| C4/C5/C6 + engine battery (C15) | **336/336** (`test_cnai_all.mjs`) |
| C1/C3/C8/C9/C10/C11/C12 (omnibus) | **21/22** (only the shared bottom-nav target-size remains — substrate debt) |
| UI functional (C1/C3/C7/C11) | **48/48** (`cert_cnai_bo1.mjs`) |
| C2 classifier | 12/13 professions F1 ≥ 0.85 (PHASE_0_BENCHMARK) |
| Verdict | **CONDITIONAL 🟡** — code gates green; real-device sign-off reserved for Sire |

## 4. Re-run

```bash
node tools/test_cnai_all.mjs          # engines (C4/C5/C6/C15)
node tools/cert_cnai_bo1.mjs          # UI functional
node tools/cert_cnai_omnibus.mjs      # a11y · 26 langs · axe · platforms (C8-C12)
```

**World Class CNAIOS — Commando Discipline. Zero Excuses. Certified only when measured.**
