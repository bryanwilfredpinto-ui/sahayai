# CNAI_BO3_RESEARCH.md
## BO3 — Chitti Learns & Coaches (AI tutors / analogy teaching) · Top-20 + Top-20

**Date:** 2026-06-13 · No code before research.

### A. Top 20 — tutoring / teaching apps
| # | App | Brilliant at | Misses | A11y gap | Chitti beats by |
|---|---|---|---|---|---|
| 1 | Khanmigo | Socratic, won't give answers (anti-cheat) | Paid; US curriculum | Limited Indic | Anti-cheat + analogy + free + 7 domains |
| 2 | Khan Academy | Mastery + practice + feedback | Not AI topics; limited Indic | Some a11y | AI concepts via Indian analogies |
| 3 | Duolingo | Bite-size, feedback loops | Language-only; dark patterns | Strong a11y | Concept teaching, no guilt loops |
| 4 | Brilliant | Intuition before formula | Paid; English | Not 4-user | Analogy = intuition, free, vernacular |
| 5 | 3Blue1Brown | Visual intuition | Video-only; no interaction | Captions | Interactive analogy + practice |
| 6 | Physics Wallah | Chai/auto/cricket framing, mass | Exam-prep; Hinglish | — | Pure-language + breakdown clause |
| 7 | Synthesis/Sizzle | Step scaffolding | STEM; paid | Not 4-user | Cross-domain scaffolding |
| 8 | Socratic (Google) | Photo→explain | **Cheating risk** | Limited | Refuses to do exams (Pillar 8) |
| 9 | Quizlet | Flashcards + AI | Rote; English | Limited | Understanding checks, not rote |
| 10 | Coursera (videos) | Structured | Paywall | Captions | Free, analogy-first |
| 11 | MagicSchool | Reading-level adapt | Teacher-side | Not 4-user | Learner-side reading level |
| 12 | Anki | Spaced repetition | Manual; no teaching | Varies | Journal aids retention |
| 13 | Sololearn | Bite-size coding | Coding; ads | Not 4-user | Any concept, free |
| 14 | Codecademy | Learn-by-doing | Coding; paywall | Not 4-user | Practice (not graded) |
| 15 | DataCamp | Practice ML | Paid; data | Not 4-user | Free analogies |
| 16 | Udemy tutors | Breadth | Variance; paid | English | Curated + honest |
| 17 | YouTube edu | Free | No interaction/feedback | Captions | Interactive + breakdown |
| 18 | Unacademy | Live + structured | Exam-prep; sub | — | Free, AI-literacy |
| 19 | BYJU'S | Engagement | Trust-damaged; K12 | — | Honest, no pressure |
| 20 | SWAYAM/NPTEL | IIT lectures | One-way; English | Limited | Teaches with analogy on top |

### B. Top 20 AI tutors / analogy / consent-learning
| # | App | Brilliant at | Misses | Chitti beats by |
|---|---|---|---|---|
| 1 | ChatGPT Study Mode | Flexible Socratic | Will do homework if pushed; English | Hard anti-cheat refusal; analogy+breakdown |
| 2 | Khanmigo | Grounded, safe | Paid; US | Free + Indian analogy + consent gate |
| 3 | Google LearnLM/"Learn About" | Pedagogically tuned | Experimental; English | Profession analogy + journal |
| 4 | Claude (teaching) | Strong explanations | Generic | Domain-matched analogy + breakdown clause |
| 5 | Quizlet Q-Chat | Study gen | Rote; English | Understanding checks |
| 6 | Sizzle/Synthesis Tutor | Steps | STEM; paid | Cross-domain |
| 7 | Korbit | KG tutor | Niche | 7-domain analogy bank |
| 8 | Riiid/Santa | Pre-empts wrong answer | Test-prep | Breakdown pre-empts misconception |
| 9 | Duolingo Max | Explain-my-answer | Language; paid | Any concept |
| 10 | MagicSchool AI | Teacher content | Teacher-only | Learner + journal |
| 11 | Tutor AI / Mia | Personal tutor | English; paid | Free + vernacular |
| 12 | Querium | Step ML tutor | STEM | Analogy-first |
| 13 | CK-12 Flexi | Free AI tutor | US curriculum | Indian framing |
| 14 | Coursera Coach | In-context | Paid catalog | Neutral |
| 15 | Perplexity | Cited learning | No practice loop | Practice + journal |
| 16 | Notion AI Q&A | Convenient | No pedagogy | Structured 4-step session |
| 17 | Replit AI | Code teaching | Coding | Any profession |
| 18 | Mathpix/Photomath | Solve steps | Cheating risk | Refuses graded exams |
| 19 | Speak (AI tutor) | Conversational | Language | Concept teaching |
| 20 | Anthropic Academy | Free AI fluency | English; self-serve | Sequenced + analogy |

### C. 3 best ideas to adopt
1. **Khanmigo/ChatGPT-Study anti-cheat** → hard refusal to sit exams / do graded work; teach the concept instead (Pillar 8, SOP 6).
2. **Riiid pre-empt-the-wrong-answer** → the *mandatory breakdown clause* ("where this analogy breaks down") pre-empts the misconception the analogy could create.
3. **Mastery loop (Khan): teach → check → feedback → choice** → the 4-step consent-gated session (concept → comprehension check (not graded) → honest feedback → go deeper/move on).

### D. 3 anti-patterns to avoid
- **Doing homework/exams** (Socratic/Photomath) → refuse, teach instead.
- **Engagement dark patterns** (Duolingo streak guilt) → forbidden.
- **Analogy with no boundary** → every analogy MUST state where it breaks down.

### E. Mapping
- **Skill 5 / SOP 4** analogy-first + breakdown — present; add missing concepts **Loop, Database, Neural Network** to complete the BO3-required matrix.
- **Skill 7 / SOP 6** consent gate (4-step, explicit YES, silence≠consent, no timeout) → add `consentPrompt()`, `startSession()`, `checkComprehension()`.
- **Skill 8 / SOP 8** dual journal (What I Learned + What Confused Me, localStorage-only, exportable) → add journal API.
- Anti-cheat → add `isExamRequest()` + refusal.

### F. Deviation
None — additive to both engines; original APIs preserved.
