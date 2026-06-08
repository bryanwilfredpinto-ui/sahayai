# BO1 — Roadmap Engine (Path 1: Direct Roadmap)

> Chitti News AI · Build Order 1 of 7. Research -> Document -> Code -> Test.
> Deliverable: cnai_roadmap_engine.js + tools/test_cnai_roadmap.mjs + a roadmap
> UI section on chitti_news_ai.html. Doctrine: rules are the product, the LLM
> is an enhancement; the engine is fully deterministic and works offline.

## 1. Research — Top 20 learning/roadmap apps (best practice copied)

| App | Strength | Best practice copied |
|---|---|---|
| roadmap.sh | Flowchart DAG, foundations first | Topics as a prerequisite DAG; order = topological sort |
| freeCodeCamp | Project gates next step | Milestone = a BUILT artifact, not "watched" |
| Khan Academy | Mastery map | Foundations-first gating |
| Coursera | Ordered series + capstone | Named arc with a capstone milestone |
| Udemy | Sections -> lectures | Two-level Stage -> Topic hierarchy |
| edX | Intro -> advanced stackable | Each stage independently completable |
| Brilliant | One concept per screen | One concept per Topic |
| Duolingo | Skill tree row gating | Gate whole stage-rows; basics first |
| Codecademy | Skill/Career paths | Skill vs career granularity |
| Scrimba | Interactive screencasts | Embed doing in the step (our check) |
| DataCamp | 5-min one-concept lessons | Short single-concept topics + est-hours |
| Class Central | Ranks across providers | Multiple ranked sources per topic |
| Great Learning / upGrad | Career-outcome programs | Frame around a job outcome |
| SWAYAM / NPTEL | Week-by-week syllabus | Time-boxed (est-hours per stage) |
| Skill India | NSQF graded | Explicit difficulty bands |
| Google Career Certs | Zero-to-job sequence | End-to-end zero->job arc |
| LinkedIn Learning Paths | Role paths | Role-tagged paths |
| Coursera Career Academy | Goal -> role -> path | Map goal -> ordered path automatically |
| Sololearn | Bite-size + streaks | Micro-steps + momentum |

## 2. Research — Top 20 AI/LLM learning apps (personalization copied)

| App | AI approach | Best practice copied |
|---|---|---|
| roadmap.sh AI | LLM roadmap from any goal | Free-text goal -> generated ordered roadmap |
| Khanmigo | Guides not answers | Socratic framing in why_it_matters |
| Coursera Coach | Next step from goal + level | Recommend the next step |
| ChatGPT Study Mode | Step-by-step + checks | Per-topic check |
| Google Learn About | Adaptive depth | Difficulty bands per topic |
| Maven / Sana / Section | Skills-graph paths | Outcome-first framing |
| Uplimit / Quizlet AI | Auto practice/quiz | check per topic |
| Perplexity tutor | Cited answers | A search term per topic |
| Synthesis / MathAcademy | Knowledge graph + spacing | Strict prerequisite graph |
| Santa AI / Riiid / Cerego | Knowledge tracing | Foundations-first refusal |
| Duolingo Max | Explain-my-mistake | Chitti-icon explain on every box |
| Sololearn AI / MagicSchool | Inline explain | Audio-first speakable rendering |

## 3. Best practices enforced by the engine

1. Roadmap as a DAG; order = topological sort. validate() refuses any forward
   prerequisite -> prevents "Machine Learning before Python basics".
2. Foundations first: stage 1 has zero prerequisites.
3. Milestone = built artifact; every topic has a check.
4. One concept per topic; difficulty as colour-independent dots + WORD.
5. YouTube SEARCH TERM not URL (survives dead links); spoken aloud.
6. Works for ANY goal: unknown goals route to a generic generator
   (Understand -> Core -> Practise -> Build).

## 4. Schema

stage: id, order, name, why_it_matters, difficulty_band, difficulty_dots,
milestone, prerequisites[], est_hours, topics[].
topic: id, order, name, why_it_matters, difficulty_band, est_hours,
youtube_search_term, check.

## 5. Accessibility (four-user contract)

- Blind/illiterate: speakable(roadmap, lang) reads the whole roadmap aloud; card
  carries data-chitti-response (speaker/Chitti/thumbs/pencil-mic).
- Deaf: difficulty as dots + WORD (never colour alone).
- Low literacy: plain-language why/milestone/check.
- Language: page lang-select (26 langs) + Hindi speakable bag.

## 6. Status

1.1 Goal parser DONE · 1.2 Curated KB + generic DONE · 1.3 Topic generator DONE ·
1.4 YouTube search per topic DONE · 1.5 Accessible UI DONE · Tests DONE.
