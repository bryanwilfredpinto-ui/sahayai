# CNAI_BO1_RESEARCH.md
## BO1 — Roadmap Engine · Top-20 Apps + Top-20 AI Apps Research

**BO:** 1 — Roadmap / Learning-Path Generation
**Date:** 2026-06-13
**Rule:** No code for BO1 was written before this research was documented (Phase 2, Step 1).
**Honesty note:** Feature observations are from my knowledge of these products as of training; specifics that change often (exact pricing/UX) are marked *[verify]*. None are fabricated.

---

## A. TOP 20 APPS — Roadmap / Learning-Path Generation (general)

| # | App | Core feature (1 line) | Does brilliantly | Does badly / misses | Accessibility gap | How Chitti beats it |
|---|---|---|---|---|---|---|
| 1 | **roadmap.sh** | Community visual tech roadmaps (DAG of topics) | Best-in-class *prerequisite ordering* + visual dependency graph; "click node → resources" | Dev-only; English; static (not personalized to you); no time-pacing | No SR-friendly graph; not vernacular | Chitti keeps the DAG ordering **and** personalizes by profession + paces by your weekly hours, in 26 langs, screen-reader-first |
| 2 | **Coursera (Career/Specialization paths)** | Curated multi-course paths to a goal | University brand; clear sequencing | Paid-first; cert paywall; generic (not your profession-in-India) | Captions only; English-first | Free-first ranking + India-profession framing + analogy teaching |
| 3 | **Duolingo (path)** | Linear gamified skill tree with daily pacing | World-class pacing, streaks, bite-size, *accessibility* | Language-only; engagement-maximizing (Chitti rejects); no career outcome | Strong a11y but English UI for India | Chitti adopts bite-size + pacing, **rejects** dark-pattern streaks (E.1.5) |
| 4 | **Khan Academy** | Mastery-based subject paths | Free, trusted, mastery checkpoints, "learn → practice → quiz" | Not AI-career; limited Indic; not profession-specific | Some a11y; limited langs | Profession-specific AI focus + vernacular + checkpoints kept |
| 5 | **DataCamp (tracks)** | Career/skill tracks (Data Analyst, ML Scientist) | Clear track → milestone structure; hands-on | Paid; data-only; English | Not 4-user | Free-first + analogy + a11y; same track clarity |
| 6 | **The Odin Project** | Free open-source full-stack curriculum | Genuinely free, ordered, project-driven | Web-dev only; text-heavy; English | No 4-user | Chitti's "build a project" milestone mirrors Odin, but accessible + multi-domain |
| 7 | **freeCodeCamp** | Free certification curriculum with projects | Free certs, project-gated progression | Self-serve; English; not a coach | Some a11y | Mentor framing + vernacular + profession lens |
| 8 | **Codecademy (paths)** | Interactive skill paths | In-browser practice; clear path | Paywall on most; coding-only | Not 4-user | Free-first + non-coding professions + analogy |
| 9 | **Scrimba (paths)** | Interactive coding career paths | Interactive screencasts | Paid; dev-only; English | Not 4-user | Broader professions, free-first |
| 10 | **Pluralsight (paths + Skill IQ)** | Role-based skill paths + skill assessment | Skill-gap assessment → path | Paid; dev/IT; Western | Not 4-user | Chitti's skill-gap (Skill 2) feeds roadmap, free, vernacular |
| 11 | **LinkedIn Learning (paths)** | Role-based learning paths | Career-linked, polished | Paywalled; Western framing | English | Free-first + India job context |
| 12 | **Udacity (Nanodegree syllabi)** | Project-based tech nanodegrees | Strong project sequencing, industry projects | Expensive; English | Not 4-user | Free-first project milestones |
| 13 | **edX (MicroMasters paths)** | University stacked credentials | Rigorous; audit mode exists | Audit/cert confusion; English | Not 4-user | Free-first clarity + analogy |
| 14 | **Brilliant** | Intuition-first STEM path | Excellent "build intuition before formula" sequencing | Paid; not career; English | Not 4-user | Analogy-first **is** intuition-first, free, vernacular |
| 15 | **Exercism** | Mentored practice tracks | Free, human-mentored practice | Coding-only; English | Not 4-user | Mentor framing across professions |
| 16 | **Sololearn** | Mobile bite-size coding paths | Mobile-first, bite-size, gamified | Coding-only; ads; shallow | Not 4-user | Mobile + bite-size kept, free, deeper, accessible |
| 17 | **Educative (paths)** | Text-based interactive paths | Fast (text > video), structured | Paid; dev; English | Not 4-user | Text-first helps low-bandwidth; Chitti adds audio+icons |
| 18 | **Memrise / Anki** | Spaced-repetition learning | Retention via spaced repetition | Memorization, not skill paths | Varies | Chitti journal + checkpoints aid retention without rote |
| 19 | **Degreed / EdCast (enterprise)** | Skill-graph driven learning paths | Enterprise skill graph + personalization | B2B only; not consumer; English | Not 4-user | Consumer + free + vernacular skill paths |
| 20 | **SWAYAM / NPTEL (Indian)** | Govt free course catalog | Free, IIT/IIM, some Indic | Poor discovery/sequencing; not a path/coach | Limited 4-user | Chitti **sequences** these scattered free courses into a path |

---

## B. TOP 20 AI APPS — AI-driven Roadmap / Tutor / Path Generation

| # | AI App | Core feature | Does brilliantly | Does badly / misses | Accessibility gap | How Chitti beats it |
|---|---|---|---|---|---|---|
| 1 | **ChatGPT (Study Mode / "make me a roadmap")** | LLM generates a custom learning plan | Infinitely flexible; conversational | **Hallucinates dead course URLs**; no free-first; no verified resources; English-default | Not 4-user; not vernacular-tuned | Chitti's roadmap is **deterministic + verified free courses**, no hallucinated links, free-first, 26 langs |
| 2 | **Khanmigo (Khan AI tutor)** | AI tutor over Khan content | Socratic, safe, grounded in real content | Paid; US-curriculum; English; not AI-career | Limited langs | Grounded **and** free + India-profession + analogy-first |
| 3 | **roadmap.sh AI roadmap generator** | LLM builds a custom topic roadmap | Good ordering; visual | Generic; no pacing; English; resources not free-verified | SR-unfriendly | Personalized + paced + free-verified + accessible |
| 4 | **Coursera Coach** | AI assistant inside Coursera | In-context help | Locked to Coursera's paid catalog | English | Provider-neutral, free-first |
| 5 | **Synthesis Tutor / Sizzle** | AI step-by-step tutor | Strong step scaffolding | Math/STEM; English; paid | Not 4-user | Cross-profession analogy scaffolding, free |
| 6 | **MagicSchool / Eduaide (teacher AI)** | AI lesson/path generation for teachers | Fast teacher content | Teacher-only; English; not learner path | Not 4-user | Serves the teacher persona **and** the learner |
| 7 | **Sana Labs** | AI personalization of enterprise learning | Adaptive sequencing | B2B; English; opaque | Not 4-user | Transparent (no-LLM classification, auditable), consumer, free |
| 8 | **Degreed Maestro** | AI skill-path assistant | Skill-graph + AI | Enterprise; English | Not 4-user | Consumer + vernacular |
| 9 | **Santa / Riiid (test-prep AI)** | Adaptive test prep | Strong adaptivity | Test-prep niche; not career | Limited | Career path, not just test scores |
| 10 | **Quizlet AI (Q-Chat)** | AI study sets + tutoring | Fast study-set generation | Memorization; English | Limited | Skill + project milestones, not flashcards alone |
| 11 | **Maxai / Merlin (browser AI)** | Summarize/learn anything | Convenient | No structured path; no free-first | Not 4-user | Structured 5-stage path |
| 12 | **Perplexity (research → learn)** | Cited answers for learning | Real citations | No path/pacing; English | Not 4-user | Citations idea adopted (verified free courses) + full path |
| 13 | **Learney / Korbit** | AI knowledge-graph tutor | Knowledge-graph navigation | Niche; English | Not 4-user | Chitti already uses a knowledge graph (DAG) — add personalization |
| 14 | **Google "Learn About" (LearnLM)** | Conversational learning experience | Pedagogically tuned LLM | Experimental; English; no career path | Not 4-user | Profession-career outcome + free-first |
| 15 | **Duolingo Max (AI)** | AI explain-my-answer | Contextual feedback | Language-only; paid | — | Cross-domain feedback, free |
| 16 | **Cousera/Udacity AI mentors** | AI Q&A on course | In-context | Locked to paid catalog | English | Provider-neutral |
| 17 | **Socratic by Google** | Photo → explanation | Great for homework help | Homework, not paths; **cheating risk** | Limited | Chitti **refuses to cheat** (Pillar 8), teaches concept |
| 18 | **CodeSignal Learn (AI)** | AI coding tutor + path | Practice-linked path | Coding; English; paid | Not 4-user | Multi-profession, free |
| 19 | **Uplimit / Section AI** | AI cohort upskilling | Live + AI blend | Paid; English; professional niche | Not 4-user | Free + accessible cohorts (swarm later) |
| 20 | **Anthropic / OpenAI "learn" hubs** | Free official AI-skill courses | Authoritative, free | Self-serve; English; advanced | Not 4-user | Chitti **sequences** these into a beginner-safe path with analogy |

---

## C. The 3 best ideas (from the 40) Chitti must adopt — and do better

1. **Prerequisite-DAG ordering (roadmap.sh) + intuition-before-formula (Brilliant) + verified citations (Perplexity).**
   → Chitti already has the DAG. Add: every stage cites a **real, verified, free** course (no ChatGPT-style hallucinated URLs) and teaches **analogy-first** (intuition before jargon). *This is Chitti's "do it better": grounded + free + intuitive, where ChatGPT roadmaps are ungrounded and Coursera paths are paywalled.*

2. **Pacing by available time (Duolingo bite-size) without dark patterns.**
   → Add time-adjustment: 1–5 h/wk → double estimates; 5–10 → +50%; 10+ → min. Produce **week ranges per stage**. Keep bite-size 1–3 h chunks. **Reject** streak guilt/urgency (E.1.5).

3. **Role/skill-gap → path (Pluralsight Skill IQ / Degreed skill graph), but free + cross-profession.**
   → Drive the roadmap from the user's **profession** (Skill 1 → Skill 2 gap → Skill 4 roadmap), produce the **canonical 5-stage** format (FOUNDATIONS → CORE → HANDS-ON → ADVANCED → CERT+PORTFOLIO) every persona gets, time-adjusted, with a milestone + cheat sheet + checkpoint per stage.

## D. 3 anti-patterns to AVOID (seen in the 40)
- **Hallucinated / rotting resource links** (ChatGPT, generic LLM roadmaps) → use verified free courses + YouTube *search terms* (not dead URLs).
- **Paid-first sequencing** (Coursera/DataCamp/Udacity) → free-first is constitutional.
- **Engagement dark patterns** (Duolingo streak guilt, "5 seats left") → forbidden by E.1.5 / SOP 10.

---

## E. How BO1 connects to the CEOS / Skills / SOPs
- **CEOS BO1 self-check:** 13 professions × 3 levels → valid **5-stage** roadmap; 100% free default; <2s; keyboard + SR; localStorage progress; share URL <2048; data-i18n; axe-core 0; JS-off graceful; 320px; print; rate-limit.
- **Skill 4 (Roadmap Generation):** exactly 5 named stages, per-profession, time-adjusted, each with why + 1–3h topics + free YouTube + cheat sheet + checkpoint + time.
- **SOP 3:** 5 stages, free resources, pace-adjusted, end with **"Ready to start Stage 1?"** offer; if overwhelm (SOP 9) → one stage at a time.

## F. Deviation from CEOS (documented, with reason)
- CEOS API contract is `POST /api/roadmap {profession, timePerWeek, currentLevel} → 5 stages`. The existing engine is **topic-goal** driven (`generate(goal)`) producing a *variable* stage count via the knowledge DAG — pedagogically superior for "I want to learn Agentic AI."
- **Resolution (no API break):** keep `generate(goal)` for topic goals; **add** `generateForProfession(profession, opts)` + `paceRoadmap()` that produce the canonical 5-stage, time-adjusted, per-profession format the spec/audit require. Both coexist. `generate()` also accepts `opts.profession` to route to the 5-stage path. This satisfies Skill 4 / SOP 3 / audit `stages.length === 5` for the profession path **and** keeps the richer DAG for explicit topic goals.
