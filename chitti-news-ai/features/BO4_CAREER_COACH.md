# BO4 — Professional AI Career Coach

> Chitti News AI · Build Order 4 of 7. Research -> Document -> Code -> Test.
> Deliverable: cnai_career_coach.js + tools/test_cnai_career.mjs + a "Career
> Coach" UI section. Constitution Article 2: NEVER hardcode professions.

## 1. Research — Top 20 career/resume apps (parsing & gap-mapping copied)

LinkedIn (recent roles = identity), Indeed (normalise titles to a taxonomy),
Naukri (Key-Skills block is highest precision in Indian resumes), Teal (diff
resume vs JD -> missing keywords = gap), Rezi (ATS formatting first), Kickresume
(extract verb+metric achievements), Jobscan (keyword match-rate %), Enhancv
(tag bullets to competencies), Zety (years -> seniority band), Huntr (gap from
real postings), Otta (adjacent roles via shared skills), Hired (drop PII early),
Coursera Career Academy (role -> competency rubric), Google Career Certs
(foundational->applied), Degreed (level deltas not binary), Cornerstone (skills
graph -> nearest learnable), Gloat (skill-vector match), Eightfold (infer latent
skills), SeekOut (enrich thin skills from title), Fuel50 (goal -> ordered path).

## 2. Research — Top 20 AI career-intelligence apps (tool/role forecasting copied)

Eightfold (talent-graph skill forecast), Gloat (skills marketplace), SeekOut
(GitHub/patent signals), Beamery (living skills ontology), Draup (company tool-
adoption -> 12-18mo forecast), Workera (adaptive skill measurement), Pymetrics
(fair person->role), HireVue (keep AI assessment human-reviewed), Sana (path to
current state), Faethm/Pearson (task automation risk -> target the augmentable),
LinkedIn Career Explorer (smallest-gap transitions), Teal/Kickresume/Jobscan/Rezi
(JD-tailored resume), Final Round/Interview Warmup/Yoodli (interview practice,
user-in-control), Sora (pipeline thinking). **Cross-cut:** measure -> gap-vector
-> minimal path; forecast from task-type, not titles.

## 3. The dynamic mapping (the "never hardcode a job" trick)

Only TWO tables are hardcoded: (a) a capability **LEXICON** (keyword -> task-type)
and (b) **7 capability BUCKETS** (category -> tools + free alternative + free
cert). Every profession is DERIVED: role string -> matched task-types -> the 7
categories {writing · data-analysis · vision · scheduling · customer-comms ·
research · domain}. A pig farmer matches {vision (herd health), data-analysis
(feed/weight forecast), writing (records)} -> the union of those buckets — no
"pig farmer" row ever stored. Verified by test (`no-job-table`).

## 4. Real 2026 mapping (10 professions × tools + free cert)

HR/TA (LinkedIn Recruiter AI, hireEZ, SeekOut · Google AI Essentials · bias-audit),
Software Dev (Copilot, Cursor, Codeium · GitHub Copilot Fundamentals · review code),
Doctor (Nabla, Abridge, Glass Health · NVIDIA GenAI · **human-in-loop, not a
diagnosis**), Teacher (MagicSchool, Khanmigo, Diffit · Google GenAI for Educators),
Farmer (Plantix, Cropin, Teachable Machine · Skill India agri-AI · field-validate),
CA/Accountant (Docyt, Vic.ai · IBM AI Foundations · don't auto-file), Lawyer
(Harvey, CoCounsel · NPTEL AI & Law · **verify citations**), Small-biz (Canva
Magic, Zapier AI · Google AI Essentials), Govt (Gemini, Bhashini · Skill India ·
no citizen PII), Student (NotebookLM, Khanmigo · Elements of AI · learn don't
plagiarise). Free alternatives always shown first.

## 5. Resume parsing — deterministic, privacy-first

Regex-only (no LLM): role (title line / headline), years (explicit "X years" or
year-span), skills (Skills section or keyword scan), domain (industry keywords).
Also a typed one-liner: "I am a [profession] with [N] years". Profile stored in
**localStorage** (`cnai_profile`) only — never uploaded; **"Chitti forget"** wipes
it. Both paths converge on `{role, years, skills[], domain, seniority}`.

## 6. Report (free-first)

Your profile · AI tools for your field (each with a FREE alternative) ·
Certifications (FREE, from BO2 catalog) · 30-day roadmap (hand `learn_goal` to
the BO1 engine) · honest caveats (clinical/legal/financial = human-in-the-loop).

## 7. Accessibility

On report ready, auto-speak: "You are a [role] with [N] years. Your top 3 AI
tools are A, B, C. Your free certification is X." Tap-to-expand sections (≥48px),
persistent "read my report" voice button, free/paid as icon+WORD (never colour-
only), caveats with ⚠ + words. Every card carries data-chitti-response.

## 8. Status

cnai_career_coach.js (parse/map/report/speakable) DONE · 7 buckets + lexicon
(no job hardcoded) DONE · sensitive caveats DONE · BO1 roadmap hand-off DONE ·
UI section DONE · tools/test_cnai_career.mjs 24/24.
