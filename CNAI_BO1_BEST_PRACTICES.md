# CNAI_BO1_BEST_PRACTICES.md
## BO1 — Roadmap Engine · Best Practices Extracted & Applied

**Date:** 2026-06-13 · Derived from CNAI_BO1_RESEARCH.md (40 apps)

### Top 3 insights (from the 40 apps)
1. **Grounded > generated.** The winning pattern is a *prerequisite DAG* (roadmap.sh) with *verified free resources* (Perplexity-style citation), not an LLM that hallucinates dead links (ChatGPT). Chitti already has the DAG — keep it, and never emit an un-verified course URL.
2. **Pace to the person, not the average.** Duolingo wins on bite-size + pacing. Adopt time-adjustment (weekly hours → week ranges) and 1–3 h chunks. Strip the dark patterns.
3. **Drive from role, deliver a fixed scaffold.** Pluralsight/Degreed drive from skill-gap; learners trust a *predictable* 5-stage scaffold. Every profession gets FOUNDATIONS → CORE → HANDS-ON → ADVANCED → CERT+PORTFOLIO.

### Best practices I WILL apply in BO1
- **Preserve public API** (`generate, validate, speakable, listKnownGoals, listTree`) — additive changes only. New functions are extensions.
- **Exactly 5 stages for the profession path**; each stage carries: `name`, `why_it_matters`, `topics[]` (1–3 h each), `course` (verified free), `cheat_sheet`, `milestone`, `checkpoint`, `est_hours`, `week_range`.
- **Free-first, 100%:** every default resource `free:true`. No paid in the default roadmap (CEOS BO1 self-check #3).
- **Time-adjustment:** `1–5 h/wk → ×2`, `5–10 → ×1.5`, `10+ → ×1` (Skill 4 table). Compute `week_range` per stage from adjusted hours ÷ weekly hours.
- **No hardcoded profession ceiling:** the 13 are seeds; ANY profession string maps to the nearest AI learning-goal, or falls back to the generic 5-stage. "I raise pigs" → still 5 valid stages.
- **YouTube as *search terms*, not URLs** (links rot) — already the engine's pattern; keep it.
- **CTA:** profession roadmap ends with the SOP-3 offer field `cta: "Ready to start Stage 1? …"`.
- **Audio:** `speakable()` extended to accept any lang code (graceful fallback to en); full 26-lang strings land in BO6.
- **Error boundaries:** never throw — unknown profession → generic 5-stage; bad pace → default. Returns are always valid roadmaps.
- **Dual-mode IIFE** (window + module.exports) preserved.

### Accessibility considerations specific to BO1
- Output is **data**, not DOM — so the engine stays a11y-neutral, but it must give the UI everything needed for an accessible render: ordered stages, text milestones (not color/emoji-only), `difficulty_band` as **text** (`beginner/intermediate/advanced`) not just dots, and a fully linear `speakable()` for blind users.
- `week_range` + `est_hours` as plain text so a screen reader announces real numbers.
- Generic fallback must never dead-end an illiterate user: every stage has a spoken milestone + checkpoint.

### How BO1 connects to the CEOS spec
- Satisfies CEOS BO1 self-check #1 (5-stage × 13 professions × 3 levels), #3 (100% free), #8 (data-i18n-ready output), and feeds Skill 2/4 + SOP 3.
- The richer topic-DAG (`generate(goal)`) remains for "learn Agentic AI"-style goals and powers BO5 swarm fan-out (which calls `ChittiRoadmap`).

### Deviation from CEOS (and why) — same as RESEARCH §F
Profession 5-stage path is **added** beside the existing topic-DAG; no API break. The DAG is kept because it is pedagogically superior for explicit topic goals and is already a dependency of `cnai_swarm.js`.
