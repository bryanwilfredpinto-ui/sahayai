# CNAI_BUILD_ORDER.md
## Chitti News AI — Running Build-Order Checklist (Phase 2)

**Gate passed:** Phase 1 validation = **85/100 → BUILD** (see CNAI_PRODUCT_VALIDATION.md).
**Discipline per BO:** RESEARCH → DOCUMENT → CODE → TEST → SELF-CHECK. Never skip, never reorder.
**Audit gate (final):** AUDIT_100x = 250-pt, ≥225 (authoritative). 138-pt = interim subset.

| BO | Title | Research | Document | Code | Test | Self-Check | Status |
|----|-------|:--:|:--:|:--:|:--:|:--:|--------|
| 1 | Roadmap Engine | ✅ | ✅ | ✅ | ✅ | ✅ | **DONE** |
| 2 | Course Discovery & Registration | ✅ | ✅ | ✅ | ✅ | ✅ | **DONE** |
| 3 | Chitti Learns & Coaches | ✅ | ✅ | ✅ | ✅ | ✅ | **DONE** |
| 4 | Professional Career Coach | ✅ | ✅ | ✅ | ✅ | ✅ | **DONE** |
| 5 | Swarm Learning | ☐ | ☐ | ☐ | ☐ | ☐ | pending |
| 6 | Accessibility & Languages (i18n) | ☐ | ☐ | ☐ | ☐ | ☐ | pending |
| 7 | Certification, Tests & Handover | ☐ | ☐ | ☐ | ☐ | ☐ | pending |

### BO1 — Roadmap Engine — completion record
- **Research:** CNAI_BO1_RESEARCH.md — 20 apps + 20 AI apps, 3 best ideas, 3 anti-patterns.
- **Docs:** CNAI_BO1_BEST_PRACTICES.md.
- **Code:** `cnai_roadmap_engine.js` extended (API preserved). Added: `PROFESSIONS` (13 seeds, unbounded), `generateForProfession()`, `paceRoadmap()`, canonical 5-stage builder, `cheat_sheet`/`checkpoint`/`week_range` fields, `cta`, `speakable()` lang-graceful, share helpers `toShareParams`/`fromShareParams`.
- **Tests:** `tools/test_cnai_roadmap_bo1.mjs` (new) + existing `tools/test_cnai_roadmap.mjs` regression — all pass.
- **Self-check:** CNAI_BO1_SELFCHECK.md — all 7 answered.

### Cross-BO invariants (enforced every BO)
- Public JS API never breaks (backward-compat).
- Free-first in every recommendation.
- No hardcoded profession ceiling.
- No LLM in classification/tab-filter path.
- localStorage-only for user data; "Chitti forget" wipes it.
- Every Chitti output gets the 5-icon feedback bar (👍👎✏️🎤🔊) — wired in BO6 UI layer.
