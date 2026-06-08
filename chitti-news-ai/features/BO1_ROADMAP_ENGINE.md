# BO1 — Roadmap Engine (v2, REBUILT 2026-06-09)

> REBUILT after Sire's correct critique: the v1 roadmap skipped the real AI
> knowledge tree (it jumped to "Agentic AI" without ML or Deep Learning) and
> showed YouTube searches instead of real courses. v2 encodes the **actual AI
> curriculum as a prerequisite knowledge graph** and attaches a **real free
> course to every stage**. Deterministic, offline.

## 1. REAL web research (June 2026 — this was actually searched, with sources)

**The taxonomy (your point, confirmed):** AI ⊃ ML ⊃ Deep Learning ⊃ {Generative
AI, Agentic AI}. **Data Science** (needs full math + ML + DL) vs **Data
Analytics** (Excel → Stats → SQL → Viz, lighter math) is a sibling branch.

**The order is non-negotiable** (DataCamp AI roadmap, KDnuggets 2026 starter kit,
Google ML prereqs, Scaler): Python + Math (**Statistics → Linear Algebra →
Calculus**) → **Core ML** → **Deep Learning** (NN/CNN/RNN/Transformers) →
**Generative AI / LLMs** (transformers, RAG, diffusion) → **Agentic AI** (tools,
function-calling, LangGraph/CrewAI/smolagents, multi-agent).

Sources:
- [DataCamp — AI Learning Roadmap 2026](https://www.datacamp.com/blog/ai-roadmap)
- [KDnuggets — 2026 Data Science Starter Kit](https://www.kdnuggets.com/the-2026-data-science-starter-kit-what-to-learn-first-and-what-to-ignore)
- [MachineLearningMastery — Roadmap for Mastering Agentic AI 2026](https://machinelearningmastery.com/the-roadmap-for-mastering-agentic-ai-in-2026/)
- [Google ML — Prerequisites](https://developers.google.com/machine-learning/crash-course/prereqs-and-prework)
- [fast.ai — Practical Deep Learning](https://course.fast.ai/)
- [Hugging Face — AI Agents Course](https://huggingface.co/learn/agents-course)
- [roadmap.sh — AI/Data Scientist + Data Analyst](https://roadmap.sh/ai-data-scientist)

## 2. Real free courses wired into the graph (one per stage)

| Stage / module | Real free course (verified) |
|---|---|
| AI Literacy | Elements of AI (U. Helsinki) — free cert |
| Python | freeCodeCamp Scientific Computing with Python · Kaggle Python |
| Math for ML | DeepLearning.AI *Mathematics for ML & Data Science* (free audit) |
| Data Handling | Kaggle *Pandas + Data Cleaning* |
| Prompt Engineering | Anthropic Academy · DeepLearning.AI prompt courses |
| Core ML | **Andrew Ng *Machine Learning Specialization*** · Google ML Crash Course |
| Deep Learning | **fast.ai *Practical Deep Learning*** (100% free) · Ng *DL Specialization* |
| Generative AI & LLMs | Microsoft *Generative AI for Beginners* · Hugging Face *NLP/LLM* |
| Agentic AI | **Hugging Face *AI Agents Course*** (free+cert) · DeepLearning.AI *AI Agents in LangGraph* |
| SQL / Viz / Data Analytics | Kaggle SQL · Microsoft Power BI · Google Data Analytics |
| Data Science | IBM *Data Science Professional Certificate* (free audit) |
| Web | freeCodeCamp · The Odin Project |

## 3. The engine (knowledge graph)

15 modules; each has `prereq[]`, a real `course`, topics (YouTube term + check),
a built-artifact `milestone`. A goal resolves to a **target module**; the engine
computes the **transitive prerequisite closure** + a **topological (Kahn) order**
→ stages. So:

- **"Agentic AI" → 9 stages**: AI Literacy → Python → Math → Data Handling →
  Prompt Engineering → **Core ML → Deep Learning → Generative AI** → Agentic AI
  (~180h), each with its real course, + a tree note: *"Agentic AI sits inside
  GenAI ⊂ Deep Learning ⊂ Machine Learning ⊂ AI."*
- **"Machine Learning" → 4**, **"Deep Learning" → 5**, **"Generative AI" → 6**
  (proper nesting: broader-but-lower goals are shorter prefixes of the same path).
- **"Data Analytics"** includes SQL, NOT forced Deep Learning; **"Data Science"**
  DOES include Deep Learning.
- Word-boundary goal matching (so "tailoring"/"raise" never match the `ai` target).
- ANY other goal → generic 4-stage generator (still a course-ish + milestone per
  stage).

## 4. Accessibility (four-user contract)

`speakable()` reads the whole path aloud incl. the course per stage + the tree
note (en + hi Devanagari). Every stage card carries `data-chitti-response`
(speaker/Chitti/thumbs/pencil-mic), difficulty as dots + WORD, course links
≥44px, "Read my whole roadmap aloud".

## 5. Status / tests

`cnai_roadmap_engine.js` v2 (knowledge graph + 21 real courses) · UI shows
course + tree note per stage · `tools/test_cnai_roadmap.mjs` **142/142**
(asserts ML before DL before GenAI before Agentic; fast.ai + HF + Ng courses
present; analytics≠data-science) · UI cert 48/48 · a11y omnibus contrast 0.
