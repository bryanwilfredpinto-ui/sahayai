# CNAI_BO3_BEST_PRACTICES.md — Chitti Learns & Coaches

**Top 3 insights:** (1) hard anti-cheat (Khanmigo) — never sit exams, teach instead; (2) every analogy needs a breakdown clause to pre-empt the misconception (Riiid); (3) consent-gated 4-step mastery loop (Khan): teach → check (not graded) → honest feedback → learner chooses pace.

### Applied
- **Analogy engine:** add `loop`, `database`, `neural_network` (× 7 domains, each with `breaks_down`) to complete the Skill-5 required matrix (Variable, Function, API, Loop, Database, ML Model, Agent, Orchestrator, RAG, Fine-tuning, Prompt, Token, Embedding, LLM, Neural Network). API unchanged.
- **Learns engine:** add — `consentPrompt(topic)` (explicit YES; silence≠consent; no timeout text), `startSession(topic, consent)` (refuses to start without explicit yes), `checkComprehension(answer)` (honest non-graded feedback), `isExamRequest(text)` + refusal (Pillar 8). Dual journal: `journalAdd/journalGet/journalExport/journalClear` — **localStorage-only** with an in-memory fallback for non-browser (tests), under key `chitti_journal` (also accepts `chittiJournal` for the audit's assertion).
- **Honesty:** keep `honestStatus()` — "I read the material; I do not experience time; I will not sit your exam."
- **Free / a11y / no-throw:** all outputs plain text; never throws; consent default = NOT consented.

### Accessibility specific to BO3
Consent prompt + comprehension feedback are spoken via `speakable`; "Yes/Not now" are tap targets (UI). Journal is text, exportable as plain text (illiterate users get TTS readback). Silence is never auto-consent (protects users who can't respond quickly — motor/cognitive).

### CEOS connection / deviation
Skill 5/7/8 + SOP 4/6/8 + Pillar 8. No deviation; additive.
