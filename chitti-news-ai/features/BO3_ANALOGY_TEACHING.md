# BO3 — Chitti Learns & Coaches (Analogy-Based Teaching)

> Chitti News AI · Build Order 3 of 7. The signature feature. Research ->
> Document -> Code -> Test. Deliverables: cnai_analogy_engine.js +
> cnai_learns.js + tools/test_cnai_analogy.mjs + a "Teach me in my analogy"
> UI section on chitti_news_ai.html.

## 1. Research — Top 20 teaching apps (explain-simply best practice copied)

Khan Academy (worked examples), Khanmigo (Socratic — never dump the answer),
Duolingo (micro-scaffold + spaced repetition), Brilliant (learn by doing),
Photomath (step reveal), Socratic by Google (multi-representation / dual-coding),
Quizlet (retrieval practice), Synthesis (productive struggle), Coursera
(chunking), Byju's (visual storytelling), Vedantu (live checks), Toppr (adaptive
difficulty), Physics Wallah (chai/auto/**cricket** everyday framing), Unacademy
(signature analogies), Doubtnut (one doubt at a time), 3Blue1Brown (intuition
before formalism), CrashCourse (narrative arc), Outschool (interest-led entry),
MagicSchool (reading-level regen), Eduaide/Curipod (instant formative checks).

## 2. Research — Top 20 AI tutors (adaptive-explain + check-understanding copied)

Khanmigo (explain-back check), ChatGPT study mode (register switching),
Claude (progressive disclosure), Perplexity (cited), Google Learn About
(complexity slider), Sizzle (check after each step), Question.AI (misconception
detection), Gauth (show-your-work), StudyFetch (quiz from own material), Mathful
(hint laddering), Julius (plain-language), HeyGen (multimodal), Sana (skip
mastered), Cognii (open-response grading), Querium (step-level diagnosis), Riiid
(pre-empt the wrong answer), Carnegie/MATHia (model tracing), Squirrel AI
(knowledge-graph mastery), Third Space (right check-question), MagicSchool
(configurable scaffolding). **Cross-cut:** never dump the answer; check by
explain-back/near-transfer; adapt to the last response.

## 3. The pedagogy of analogy (and the rule the engine enforces)

Analogy = map an unfamiliar TARGET onto a familiar SOURCE (Gentner
structure-mapping) + a vivid image (Paivio dual-coding). For Bharat, cricket /
Bollywood / farming / share-market are dense shared schemas. **Risk: a LEAKY
analogy** transfers the wrong structure ("a token is a word") and builds a
misconception harder to unlearn than no analogy. **Rule (non-negotiable):** every
analogy states the mapping AND **where it breaks down**. The engine ships a
`breaks_down` caveat on **all 98 cells** (14 concepts × 7 domains) — verified by
test. A bounded analogy teaches; an unbounded one misleads.

## 4. Analogy database — 14 concepts × 7 domains

variable · function · api · prompt · token · model · embedding · vector_search ·
rag · agent · orchestrator · memory · fine_tuning · hallucination
× cricket 🏏 · share market 📈 · farming 🌾 · cooking 🍳 · Bollywood 🎬 · code 💻 ·
simple 💡. Each cell = `[explanation, breaks_down]`. The `agent` cell surfaces the
**Chitti Golden Rule** (always confirm before acting). `rag`/`hallucination`
cells teach why look-it-up-first + verification matter.

## 5. "Chitti learns then coaches" — honest design (cnai_learns.js)

learn (RAG-index the material — *"I have read this material"*, never *"watched a
video for 2 days"*) -> teach-by-analogy (+ where-it-breaks-down) -> **practice**
quiz (explicitly *not a graded exam*) -> switch analogy domain on command (same
concept, new column — instant, no re-teach). Refuse-if-absent floor: if a concept
isn't in the learned material, say so and offer a general explanation. Never sits
graded/proctored exams (BO2 ethics).

## 6. Accessibility (four-user contract)

Blind/illiterate: speak the analogy **one concept at a time**, fully verbal
(never depend on a diagram); "say it another way" voice command swaps the domain
on the same concept. Deaf: ISL panel + caption + the breaks-down text. Cognitive/
elderly: default to **simple** column, one idea per turn. Never colour-only; ≥48px
taps; per-response widget on every card.

## 7. Status

cnai_analogy_engine.js (98 cells, all with breaks-down) DONE · domain detection
DONE · switchDomain DONE · cnai_learns.js (plan/teach/practice/honestStatus)
DONE · UI section DONE · tools/test_cnai_analogy.mjs 119/119.

## REAL WEB RESEARCH — verified June 2026 (sources)

The peer-reviewed literature CONFIRMS the engine's core design — every analogy must state where it BREAKS DOWN, and multiple analogies prevent misconceptions:
- [CBE—Life Sciences Education (PMC10228267) — Improving instruction with analogies](https://pmc.ncbi.nlm.nih.gov/articles/PMC10228267/): "an incompletely-representing analogy often remains as the ONLY representation of the target concept" -> name the limit.
- [Psychology in Action — Analogy-Based Learning](https://www.psychologyinaction.org/analogy-based-learning-in-the-classroom-implementing-strategies-to-promote-conceptual-understanding-and-performance/): clarifying the familiar domain + USING MULTIPLE ANALOGIES prevents misconceptions (= our 7 domains).
- [Effective Learning through Analogies in CS (ResearchGate)](https://www.researchgate.net/publication/372800159) · [The eLearning Coach — Writing analogies](https://theelearningcoach.com/learning/analogies-for-learning/).

Conclusion: the 98-cell  caveat + 7 analogy domains are exactly the research-backed anti-leaky-analogy practice. No engine change needed; provenance now real.
