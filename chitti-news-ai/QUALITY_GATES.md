# Chitti News AI (CNAIOS) — QUALITY_GATES

> The **merge-blockers**. A change does NOT merge until every applicable gate is
> green. Companion to [CERTIFICATION.md](CERTIFICATION.md) (ship gate) — this is
> the per-change gate. Positioning: **Professional Intelligence Platform** (NOT
> an LMS); gates protect **relevance · impact · trust · accessibility**, not
> feature count. Founder rule: *kill weak features; a 9/10 product, not 100
> average ones.*

---

## Gate 0 — Should this change exist? (the Master Rule, per-feature)

Before writing code for any NEW feature, answer in the PR description:
1. Which axis does it measurably improve? (Health/Education/Income/Safety/Govt/Legal/Financial/**Accessibility**) — if none, **reject**.
2. Does it serve the **primary** function (profession-specific news + impact) or is it a shiny tertiary? Tertiary features need a higher bar.
3. Would a professional notice it **weekly**? If not, justify.
4. Is it just chasing an LMS/marketplace pattern? If yes, **reject** (wrong category).

> *"Build only features that measurably improve a core axis. Trust > Virality ·
> Accessibility > Complexity · Evidence > Assumptions · Research > Opinions ·
> Product > Features."*

## Gate 1 — Determinism & fail-open
- Classification critical path stays **rules-only** (no LLM in the hot path); CI static-scan forbids an LLM import in the classifier.
- The product serves real content with **every LLM provider offline** (fail-open).

## Gate 2 — Trust & honesty (HARD)
- No fabricated source/stat/score; every news item → a real source URL.
- No job-overpromise; no auto-enrol; **never** sit a graded/proctored exam.
- Every relevance verdict carries a reason; staleness flag on > 30-day items.
- Research claimed in any doc = real web research with **live cited URLs**, or it does not say "research".

## Gate 3 — Accessibility (HARD, four-user contract)
- Blind / Deaf / Mute / Illiterate flows all pass; audio-first; ISL panel; never colour-only; tap targets ≥ 44px on the product's own surface.
- New `[data-chitti-response]` cards carry the 🔊/🤖/👍/👎/✏️ widget.
- axe WCAG 2.1/2.2 AA = **0 serious** on the product's own surface (substrate debt → KNOWN_ISSUES with an owner, never silently shipped).

## Gate 4 — Languages
- All 26 substrate languages switch clean (html[lang] + RTL for ur/ks/sd), 0 console errors; proper nouns stay English; numbers/structure language-independent.

## Gate 5 — Curriculum & pedagogy correctness
- Learning paths obey the real AI tree (foundations-first; ML→DL→GenAI→Agentic); a real free course per stage.
- Every analogy ships a "where it breaks down" caveat.

## Gate 6 — Evals don't regress
- Classifier F1 must not drop > 0.05 from baseline; relevance-verdict accuracy held; no merge if an eval regresses.

## Gate 7 — Tests green (re-runnable)
- `node tools/test_cnai_all.mjs` = 100% · `node tools/cert_cnai_bo1.mjs` green ·
  `node tools/cert_cnai_omnibus.mjs` ≥ 95% (only documented substrate items may be amber).
- Backend `/health` 200 + unit tests green.

## Gate 8 — Observability & honesty of status
- The page must report `status:"active"` in a clean state (no false "Degraded");
  observability checks must not false-positive on transient backend/card fluctuation.

---

## Verdict
A PR merges only when Gates 0–8 (applicable) are green. Gates 2 & 3 are **never**
waived. Shipping to users additionally requires [CERTIFICATION.md](CERTIFICATION.md)
CONDITIONAL-or-better + Sire's real-device sign-off.

**World Class CNAIOS — Commando Discipline. Zero Excuses.**
