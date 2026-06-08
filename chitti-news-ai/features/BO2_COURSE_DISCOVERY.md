# BO2 — Course Discovery & Registration

> Chitti News AI · Build Order 2 of 7. Research -> Document -> Code -> Test.
> Deliverable: cnai_course_discovery.js + tools/test_cnai_courses.mjs + a
> "Find a free course" UI section on chitti_news_ai.html.
> Doctrine: free first; deterministic; consent-gated registration (no auto-enrol).

## 1. Research — Top 20 course-discovery / aggregator apps (best practice copied)

| App | Best practice copied |
|---|---|
| Class Central | Aggregate same course across providers; surface FREE/audit first |
| Coursera | Always expose "Audit for free" separately from the paid cert |
| edX | Free-to-audit vs verified-cert shown as two columns, not one CTA |
| Udemy | Rank by recency + ratings; "last updated" is a trust signal |
| Udacity | Free standalone courses separated from paid Nanodegrees |
| LinkedIn Learning | Map to a named skill taxonomy (skill-gap driven) |
| Skillshare | De-prioritise no-cert content when user wants credentials |
| FutureLearn | Show effort hours/week up front (time budget filter) |
| Khan Academy | Lead with 100% free, no-login; nonprofit trust badge |
| freeCodeCamp | Rank verifiable free certs above passive video |
| SWAYAM / NPTEL | Government-of-India provenance = highest trust tier |
| Skill India Digital (NSDC) | NSQF-aligned, govt-recognised seal |
| Google Skillshop | Group by official free product certifications |
| Microsoft Learn | Structured learning paths + free-cert label |
| IBM SkillsBuild | Free credential + Credly issuing-body trust mark |
| NVIDIA DLI | Separate free self-paced from paid instructor-led |
| Hugging Face Learn | Open, fully-free, code-along verifiable |
| DeepLearning.AI | Free short courses distinct from paid specialisations |
| MIT OCW | Institution provenance; state "free, no certificate" honestly |
| OpenLearn | Free statement-of-participation, badged as free |

**Cross-cut:** trust tier = (institution) x (verifiable credential) x (recency); free-first is a SORT KEY, never a quality penalty.

## 2. Research — Top 20 AI course/skill apps (user->course matching copied)

Coursera Coach (goal -> minimal path), Degreed (gap from skill profile + role),
Sana (adaptive diagnostic placement), Cornerstone (competency frameworks),
EdCast (micro-units sized to time), Docebo AI (peer/cohort signals), Udemy AI
("covers X, skips Y" fit summary), LinkedIn AI Coach (skills from real job posts),
Sololearn AI (re-teach weak sub-skills), DataCamp AI (baseline -> XP per skill),
Section (outcome/use-case framing), Maven (prereq-readiness checks), Uplimit
(gaps via project submissions), BloomTech (job-ready ladder), Multiverse
(on-the-job competency), LXPs (localise to language/region), Pluralsight Iris
(Skill IQ measures level), 360Learning (peer-authored), Disco (community+AI),
Workera (rigorous skill measurement -> precise gap vector).
**Cross-cut:** measure -> gap-vector -> MINIMAL path; free options first.

## 3. Free-first ranking policy (deterministic ladder in the engine)

1 govt_free_cert (SWAYAM/NPTEL, Skill India) · 2 govt_free · 3 corp_free_cert
(Google/MS/IBM/NVIDIA/HF/freeCodeCamp/Kaggle) · 4 corp_free (DeepLearning.AI,
docs) · 5 uni_free (MIT OCW/OpenLearn) · 6 youtube_free · 7 paid (LAST, only if
no free covers the topic). Every card shows a discrete `cost` + `cert` flag;
every paid card carries a `why_no_free` string listing the free alternatives.

## 4. Seed catalog (real, 2026)

~21 real courses across the tiers — Skill India, NPTEL ML + Deep Learning,
Google Cloud GenAI, Microsoft Learn Azure AI, IBM SkillsBuild, NVIDIA DLI RAG,
Hugging Face Agents + NLP, freeCodeCamp ML + Web, Kaggle, Elements of AI, AWS
Prompt Engineering, DeepLearning.AI, Anthropic prompting, Harvard CS50 AI, MIT
OCW, OpenLearn, YouTube, + one paid Coursera example. Stored with
`verified_date: 2026` (stale-checkable per CHITTI_SOP).

## 5. Consent + ethics — Chitti registers/completes a course? (LOCKED boundary)

Chitti MAY: **DISCOVER · PLAN · COACH · PRE-FILL** a signup the USER submits.
Chitti must **NOT**: silently impersonate the user, create third-party accounts
without per-action consent, store passwords without explicit revocable consent,
or **take graded/proctored assessments** for the user (ToS violation + credential
fraud + academic dishonesty — and it invalidates the certificate). This binds to
the **Chitti Golden Rule** (`chittiConfirmAndDo`): every enrolment is an explicit
"Sire, shall I open the signup with your details pre-filled?" — never auto-yes,
never time-out-to-yes. Honest refusal string: *"I can teach you this and prepare
you, but I can't sit the exam for you — that would make your certificate invalid."*

## 6. Accessibility (four-user contract)

Speak essentials in order: provider -> FREE/PAID(+cost) -> duration -> cert
yes/no -> trust tier. Free vs paid is **text label + icon (🆓/💳) + spoken word**,
never colour-only. Each course is a ≥48px tap row with data-chitti-response
(speaker/Chitti/thumbs/pencil-mic). Cost lives in the accessible name so it
survives screen-reader linearisation.

## 7. Status

cnai_course_discovery.js DONE · seed catalog DONE · free-first ladder DONE ·
synonym matching DONE · consent-gated registrationPlan DONE · speakable DONE ·
UI section DONE · tools/test_cnai_courses.mjs 30/30.
