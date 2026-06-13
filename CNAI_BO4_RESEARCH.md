# CNAI_BO4_RESEARCH.md
## BO4 — Professional AI Career Coach · Top-20 + Top-20

**Date:** 2026-06-13 · No code before research.

### A. Top 20 — career / resume / job-skill apps
| # | App | Brilliant at | Misses | A11y gap | Chitti beats by |
|---|---|---|---|---|---|
| 1 | LinkedIn (Career Explorer) | Role transitions, skills graph | Western; paywall | Captions | Free + India + profession-AI tools |
| 2 | Naukri | India jobs + profile | Listings, not coaching | — | Coaches AI-readiness, not listings |
| 3 | Apna | Blue/grey-collar India | Jobs, not upskilling | — | AI tools for any field |
| 4 | Indeed Career Guide | Broad guides | Generic; US | — | Profession-specific |
| 5 | Jobscan | Resume-to-JD match | ATS niche; paid | — | Free; AI-tool mapping |
| 6 | Teal | Resume builder + tracker | Paid tiers | — | Free coaching focus |
| 7 | Rezi/Kickresume | AI resume | Resume-only; paid | — | Whole upgrade path |
| 8 | Pathrise/Interview Kickstart | Coaching | Expensive; ISA | — | Free |
| 9 | upGrad/Scaler | Career tracks | Expensive | English | Free-first |
| 10 | Coursera Career Academy | Cert→job framing | Paywall | English | Free certs first |
| 11 | Google Career Certificates | Job-ready, some aid | English; cert cost | Not 4-user | Vernacular + free audit |
| 12 | NASSCOM FutureSkills | India AI roles | Registration friction | — | Surfaces it free |
| 13 | Degreed | Skill graph | Enterprise | Not 4-user | Consumer |
| 14 | Workera | Skill measurement | B2B | Not 4-user | Free self-assessment via gaps |
| 15 | Glassdoor | Salary data | US-leaning; not coach | — | India salary *[verify]* |
| 16 | AmbitionBox | India salary data | Listings | — | Honest "typically", sourced |
| 17 | Shine/TimesJobs | India jobs | Listings | — | Coaching |
| 18 | Cutshort | Tech hiring | Niche | — | Any profession |
| 19 | Internshala | Internships+training | Paid trainings | — | Free-first |
| 20 | Hirect | Direct recruiter chat | Jobs | — | Skills, not jobs |

### B. Top 20 AI apps — career coach / AI-tool recommenders
| # | App | Brilliant at | Misses | Chitti beats by |
|---|---|---|---|---|
| 1 | ChatGPT "career advice" | Conversational | Generic; no India data; hype risk | Profession-AI map + honesty (no "guaranteed job") |
| 2 | LinkedIn AI coach | In-product | Paywall; Western | Free + India |
| 3 | Future of Jobs tools | Trends | Macro, not personal | Personal upgrade path |
| 4 | There's An AI For That | Tool directory | No personalization | Maps tools to YOUR tasks |
| 5 | Futurepedia | AI tool catalog | Browse-only | Task→tool replacement map |
| 6 | Julius AI | Excel→AI data analysis | Tool, not coach | Names it as Excel replacement |
| 7 | Gamma.app | PPT→AI decks | Tool | Named as PPT replacement |
| 8 | Notion AI | Word→AI docs | Tool | Named as Word replacement |
| 9 | Copilot (M365) | Office AI | Paid; tool | Free alternatives surfaced |
| 10 | Gemini in Gmail | Email AI | Tool | Named as Email upgrade |
| 11 | Canva AI (Magic) | Design AI | Tool | PPT/design replacement |
| 12 | Perplexity | Research AI | Tool | Google-Search replacement |
| 13 | Teal AI | Resume AI | Paid | Free regex parse |
| 14 | Kickresume AI | Resume gen | Paid | Privacy: regex-only, local |
| 15 | Interview Warmup (Google) | Practice | Narrow | Whole path |
| 16 | Yoodli | Speaking coach | Niche | — |
| 17 | Sana/Degreed Maestro | Skill AI | Enterprise | Consumer free |
| 18 | Glean/Maxai | Work AI | No career map | Career upgrade plan |
| 19 | BoltAI/Merlin | Browser AI | Convenience | Structured 30-day plan |
| 20 | Final Round AI | Interview AI | Paid | Free, honest |

### C. 3 best ideas to adopt
1. **There's-An-AI-For-That / Futurepedia task→tool mapping** → a `TOOL_REPLACEMENT_MAP`: legacy tool (Excel/Word/PPT/Email/WhatsApp/Google) → free AI replacement ("STOP using X → START using Y (free)").
2. **Skill-graph career transitions (LinkedIn/Degreed)** → `mapUpgradePath()` returning tool_replacements + profession_certs + mentor_voice + first_30_days_plan.
3. **Honest framing** → never "guaranteed job/salary"; "typically/often/based on data"; sources noted (Skill 12 / SOP 12).

### D. 3 anti-patterns to avoid
- **Hype / job guarantees** (EdTech) → forbidden-phrase honesty.
- **Resume data to server** → regex-only, localStorage (already enforced).
- **Cert-chasing without skills** → Learning Psychology redirect (Skill 11).

### E. Mapping
- **Skill 1/2/12** profession intelligence + gap + career — present; add upgrade path + mentor voice + 30-day plan.
- **Skill 11 / SOP 9** Learning Psychology (overwhelm/imposter/cert-chasing) → **add `detectPsychology()`** here (exercise: lives in cnai_career_coach.js).
- v2 BO4 deliverables: `TOOL_REPLACEMENT_MAP`, `PROFESSION_CERTS`, `mapUpgradePath()`.

### F. Deviation
None — additive; `parseResume/parseOneLiner/mapProfession/buildReport/speakable` unchanged.
