# COSDF v1.1 — CHITTI NEWS AI
## Complete Operating System Development Framework

> **Authored:** Sire (Bryan Wilfred Pinto) — 2026-06-05
> **v1.1 revision:** 2026-06-05 PM — added Levels 13-23 (the 10 missing layers
> + Profession Hub architecture) per Sire's 9.8/10 enhancement directive
> **Committed to repo:** 2026-06-05 — single source of truth, never re-litigated
> **Supersedes:** Any prior per-Chitti spec for chitti-news-ai. Reconciles with
> `SAHAYAI_MASTER.md` (vision) + `CHITTI_SOP.md` §7 (per-Chitti contract) +
> `chitti-cto/CTO.md` (build rules).
>
> **v1.0 → v1.1 changelog:**
> - +10 missing layers (AI Impact Score™ · Chitti Explains · Readiness
>   Assessment · Weekly Missions · Real-World Projects · Jobs Radar · Mentor
>   · Community Intelligence · Tool Comparison Lab · Future Forecast™)
> - + Level 23 Profession Hub architecture (replaces flat feed-of-streams)
> - + Final rating matrix (current 8.8/10 → 9.8/10 target with the 10 additions)
> - Reframing: Chitti News AI is no longer competing with news apps, course
>   platforms, or AI directories. It becomes a **Global AI Career Copilot for
>   Every Profession, Language, and Ability Level.**

---

## LEVEL 0 — CONSTITUTION

### ROLE.md
You are Chitti News AI — the world's most accessible AI news and upskilling coach for ANY profession.

**Not** a news aggregator.
**Not** a course marketplace.
**Not** a static list.

You are building:

```
AI News Curator
+
Universal Career Coach (Any Role)
+
Upskilling Mentor
+
Smart Prompt Library
+
Personalized Learning Engine
```

For ANY person in ANY profession:

Doctors, CA, Lawyers, Teachers, HR, Python Developers, Talent Acquisition, Executives, Students, Nurses, Architects, Farmers, Mechanics, Electricians, Police, Journalists, Marketing, Sales, Accountants, Pilots, Chefs, **ANY ROLE**

For ALL users regardless of:
- Disability (Blind, Deaf, Mute, Illiterate)
- Language (ALL languages — see Level 8)
- Location (Rural, Urban, Anywhere)
- Education level
- Technical expertise

**Optimize for:**

| Priority | Metric |
|---|---|
| 1 | Universality — ANY role, ANY language, ANY user |
| 2 | Personalization — Role-specific recommendations |
| 3 | Accessibility — ALL disabilities supported |
| 4 | FREE-first — FREE resources prioritized |
| 5 | Trust — No fake certifications, verified links only |

**Founder Rule:**

```
ANY Role × ANY Language × ALL Disabilities = Universal Access
FREE First > Paid
Coach > Curator > Aggregator
Trust Over Everything
No Hardcoded Roles — Dynamic for ANY Profession
```

---

## LEVEL 1 — VISION

### Mission
Help ANY professional — regardless of role, language, disability, or location — understand AI news AND upgrade their skills with personalized certifications, courses, tools, and prompts.

### Vision
A world where a doctor in rural India (speaking Tamil, blind), a CA in Mumbai (speaking Marathi, deaf), a teacher in Nigeria (speaking Yoruba, illiterate), and a lawyer in Brazil (speaking Portuguese) ALL open Chitti and see:

> "Here's AI news for your profession. Here's what to learn for YOUR role. Here's how to use AI tomorrow — in YOUR language."

---

## LEVEL 2 — PERSONAS (Infinite — ANY Role)

### Professional Categories (Dynamic — User types ANY)

| Category | Example Roles |
|---|---|
| Healthcare | Doctor, Nurse, Surgeon, Dentist, Veterinarian, Pharmacist, Radiologist |
| Finance & Legal | CA, Accountant, Auditor, Lawyer, Paralegal, Tax Consultant, Financial Advisor |
| Education | Teacher, Professor, Principal, Education Consultant, Trainer |
| Technology | Python Developer, Data Scientist, DevOps, Frontend, Backend, QA, Security |
| HR & Recruitment | HR Generalist, Talent Acquisition, L&D, People Analytics, HRBP |
| Marketing & Sales | Marketer, SEO, Content Writer, Social Media Manager, Sales Rep, CRM |
| Operations & Supply Chain | Logistics Manager, Supply Chain, Procurement, Inventory Manager |
| Creative | Designer, Video Editor, Photographer, Animator, Architect |
| Skilled Trades | Electrician, Plumber, Carpenter, Welder, Mechanic, HVAC Technician |
| Agriculture | Farmer, Agronomist, Agricultural Engineer, Farm Manager |
| Government & Public Service | Police, Firefighter, Civil Servant, Military, Postal Worker |
| Hospitality | Chef, Hotel Manager, Restaurant Owner, Bartender |
| Transportation | Pilot, Truck Driver, Delivery Driver, Fleet Manager |
| Students | High School, College, Graduate, PhD Candidate |
| Executives | CEO, CTO, Director, VP, Department Head |
| General | ANY role user types |

### Accessibility Personas

| Persona | Needs |
|---|---|
| Blind | Voice-first news + courses + prompts, haptic feedback |
| Deaf | Visual-first, captions, text-based recommendations |
| Mute | Tap/icon-only, pre-set responses |
| Illiterate | Voice + icons only, no text dependency |
| Low Vision | Large text, high contrast |
| Blind+Deaf | Haptic + tactile feedback |

---

## LEVEL 3 — SUCCESS METRICS

| Metric | Target |
|---|---|
| Daily Active Users (Global) | 500K (Year 1) |
| Role coverage (unique roles served) | 1,000+ |
| Language coverage | 100+ languages |
| Accessibility completion rate (all disabilities) | >99% |
| User satisfaction (thumbs up) | >90% |
| Courses started from recommendations | >30% |
| Certifications completed (self-report) | >10% |

---

## LEVEL 4 — PRD

### Feature N0 — AI News Feed (LIVE)
- 8+ real AI publishers
- 100+ languages (via translate + native sources)
- 🤖 Chitti icon explains ANY article in simple language
- Voice-read for blind users
- Visual captions for deaf users

### Feature N1 — 🎯 Coach Picks (LIVE)
- Static library: 172 picks across 6 sections
- YouTube, Free Courses, Corporate Academies, Govt Skill India, Certifications, AI Tools
- 100+ languages support

### Feature N2 — Universal Role-Based Coach (TO BUILD)

User types ANY role → Chitti dynamically returns:

```yaml
input: "Doctor"
output:
  certifications:
    - "AI for Medical Diagnosis (Coursera) [FREE audit]"
    - "Healthcare AI Specialization (Stanford Online)"
    - "Radiology AI Certificate (Aidoc) [FREE]"
  courses:
    - "AI in Healthcare (DeepLearning.ai) [FREE]"
    - "Medical LLMs for Clinicians"
  tools:
    - "Aidoc — AI radiology assistant"
    - "Abridge — AI clinical notes"
    - "Glass AI — Differential diagnosis"
  prompts:
    - "Suggest 3 differential diagnoses for chest pain with fever"
    - "Summarize this patient's history for rounds"
```

```yaml
input: "CA / Chartered Accountant"
output:
  certifications:
    - "AI for Finance (Coursera) [FREE audit]"
    - "Accounting Automation Certificate (AICPA)"
    - "Data Analytics for Auditors"
  courses:
    - "AI in Accounting (edX) [FREE]"
    - "Excel + AI for CAs"
  tools:
    - "Vic.ai — Invoice automation"
    - "Datarails — FP&A AI"
    - "Power BI Copilot"
  prompts:
    - "Analyze this expense report for anomalies"
    - "Draft an audit program for revenue recognition"
```

```yaml
input: "Teacher"
output:
  certifications:
    - "AI for Educators (Microsoft) [FREE]"
    - "Digital Learning Certificate (Google)"
    - "EdTech Leadership (ISTE)"
  courses:
    - "AI in the Classroom (Coursera) [FREE]"
    - "Prompt Engineering for Teachers"
  tools:
    - "MagicSchool.ai — Lesson planning"
    - "Diffit — Differentiation"
    - "Brisk Teaching — Feedback"
  prompts:
    - "Create a lesson plan for 8th grade science on photosynthesis"
    - "Generate 5 quiz questions about fractions with answer key"
```

```yaml
input: "Lawyer"
output:
  certifications:
    - "AI for Legal Professionals (Harvard) [FREE audit]"
    - "Legal Tech Certificate (CLOC)"
    - "eDiscovery AI Specialist"
  courses:
    - "LLMs for Legal (DeepLearning.ai)"
    - "AI and Contract Law (edX)"
  tools:
    - "Harvey AI — Legal research"
    - "Spellbook — Contract review"
    - "Casetext — CoCounsel"
  prompts:
    - "Find cases related to AI copyright infringement"
    - "Draft a clause for data protection in vendor contract"
```

### Feature N3 — Smart Prompt Library by Role
- Curated prompts for ANY profession
- Users copy-paste into ChatGPT/Claude/Gemini
- Users can submit their own prompts (voting/ranking)

### Feature N4 — My Learning Plan (Personal Memory)
- User saves certifications, marks progress (Started / Completed / Skipped)
- Auto-generates CV/LinkedIn section in 100+ languages
- Reminders for incomplete courses

### Feature N5 — Accessibility Layer (ALL Disabilities)
- Voice-read news + courses + prompts (Blind)
- Visual indicators + captions (Deaf)
- Icon-first + thumbs up/down (Illiterate)
- Haptic feedback (Blind+Deaf)
- ALL languages (100+)

---

## LEVEL 5 — SKILLS

| Skill | What It Does | How |
|---|---|---|
| Role Keyword Mapping | Maps ANY user role to relevant domains | Dynamic keyword dictionary |
| Certification Validation | Returns REAL certs (no fake/generated) | Verified database + links |
| FREE-First Ranking | FREE resources shown before paid | Priority scoring |
| Tool Recommendation | AI tools by profession | Category + role matching |
| Prompt Engineering Library | Curated, tested prompts by role | Crowd-sourced + expert reviewed |
| News Categorization | Tags news by profession relevance | Keyword + category matching |
| Language Translation | 100+ languages | Native + translate API |
| Accessibility Adaptation | Voice/visual/icon/haptic per user | User preference + auto-detect |

---

## LEVEL 6 — SWARM

Every user request passes through ALL agents:

```
User: "I am a [ANY ROLE]. What should I learn in AI?"
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Agent 1: ROLE MAPPING AGENT                                  │
│ → Maps "Doctor" → healthcare, medical, clinical, diagnosis  │
│ → Maps "CA" → finance, accounting, audit, tax               │
│ → Works for ANY role dynamically                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Agent 2: CERTIFICATION AGENT                                 │
│ → Returns verified certs for that role                      │
│ → Priority: FREE certifications first                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Agent 3: COURSE AGENT                                        │
│ → Returns free courses for that role                        │
│ → Difficulty level (beginner/intermediate/advanced)         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Agent 4: TOOL AGENT                                          │
│ → AI tools relevant to that role                            │
│ → Use case examples                                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Agent 5: PROMPT AGENT                                        │
│ → Curated prompts for that role                             │
│ → Copy-paste ready                                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Agent 6: ACCESSIBILITY AGENT                                 │
│ → Adapts output for user's needs (blind/deaf/illiterate)    │
│ → Chooses output modality (voice/text/icons/haptic)         │
│ → Uses user's preferred language                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Agent 7: TRUST & QUALITY AGENT                               │
│ → Verifies all links are real (no hallucinations)           │
│ → Ensures FREE option shown first                           │
│ → No fake certifications                                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Agent 8: LANGUAGE AGENT                                      │
│ → Translates ALL output to user's language                  │
│ → Supports 100+ languages                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    FINAL OUTPUT TO USER
```

---

## LEVEL 7 — GUARDRAILS

### NEVER
```
❌ Hardcode roles ("Only HR, Dev, TA, Executive")
❌ Recommend fake/generated certifications
❌ Promote paid courses without FREE alternative
❌ Claim a cert will "guarantee job" or "double salary"
❌ Ignore accessibility (must work for ALL disabilities)
❌ Ignore language (must support user's chosen language)
```

### ALWAYS
```
✓ ANY role user types — Chitti handles it dynamically
✓ Show FREE option first (if exists)
✓ Link to real, verified course/cert pages
✓ State difficulty level (Beginner/Intermediate/Advanced)
✓ Estimate time commitment (if known)
✓ Accessibility-first: voice for blind, visual for deaf, icons for illiterate
✓ User's language: ALL output in their selected language
✓ Declare uncertainty: "I couldn't find specific certs for 'X'. Here are general AI resources for your domain."
```

---

## LEVEL 8 — MEMORY (Universal Learning Twin)

```json
{
  "user_id": "unique_identifier",
  "role": "CA",
  "learning_plan": [
    {
      "type": "certification",
      "name": "AI for Finance (Coursera)",
      "status": "started",
      "date_added": "2025-06-01",
      "is_free": true
    },
    {
      "type": "course",
      "name": "Accounting Automation",
      "status": "completed",
      "date_completed": "2025-05-15"
    }
  ],
  "skipped_items": ["Blockchain for Accountants"],
  "saved_prompts": ["Analyze expense report anomalies"],
  "preferences": {
    "language": "tamil",
    "accessibility_mode": "voice_first",
    "free_only": true
  }
}
```

---

## LEVEL 9 — ACCESSIBILITY (ALL LANGUAGES + ALL DISABILITIES)

### Languages Supported: 100+ (ALL)

| Priority | Language Family | Examples |
|---|---|---|
| P0 | Indian (Constitution) | Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, Odia, Assamese, Urdu |
| P0 | Global | English, Spanish, French, Arabic, Portuguese (Brazil), Russian, Chinese (Simplified), Japanese, German |
| P1 | African | Swahili, Yoruba, Hausa, Igbo, Amharic, Zulu |
| P1 | Southeast Asian | Indonesian, Thai, Vietnamese, Filipino |
| P2 | European | Italian, Dutch, Polish, Turkish |
| P2 | Middle Eastern | Farsi, Hebrew |
| P3 | ALL OTHER | Any language user requests |

### Modality Matrix (ALL Disabilities)

| User Type | Input | Output | Fallback |
|---|---|---|---|
| Blind | Voice + Touch | Voice + Haptic | Large buttons |
| Deaf | Touch + Camera | Visual + Text | Vibration |
| Mute | Touch + Pre-sets | Visual + Voice | Text |
| Illiterate | Voice + Thumbs | Voice + Icons | Emoji |
| Blind+Deaf | Touch + Haptic | Haptic + Tactile | Voice (max volume) |
| Low Vision | Voice + Large Touch | Large Text + Voice | Icons |
| Cognitive | Simple icons + voice | Simple language + voice | Repeat |

### Output Adaptation Examples

**For Blind User (Voice-first):**
> Chitti: "You asked for AI courses for Chartered Accountant. I found 3 free certifications. First: AI for Finance from Coursera. Takes 20 hours. Free audit. Shall I read the next one?"

**For Deaf User (Visual-first):**
```
[CARD DISPLAY]
Role: Chartered Accountant
━━━━━━━━━━━━━━━━━━━━━━━
📜 CERTIFICATIONS (FREE FIRST)
1. AI for Finance (Coursera) · 20h · 🔴FREE audit
2. Accounting Automation (AICPA) · 10h · $49
━━━━━━━━━━━━━━━━━━━━━━━
🔧 TOOLS
1. Vic.ai · Invoice automation
2. Datarails · FP&A
━━━━━━━━━━━━━━━━━━━━━━━
[VISUAL INDICATOR: ✅ All links verified]
```

**For Illiterate User (Icon + Voice):**
```
[📜] + voice: "Certification"
[🎓] + voice: "Course"
[🔧] + voice: "Tool"
[👍] Save / [👎] Skip
[🔊] Read again
```

---

## LEVEL 10 — QUALITY GATES

### No Feature Ships Until ALL Gates Pass

```
Gate 1: FUNCTIONAL
├── [ ] ANY role user types works (dynamic)
├── [ ] No hardcoded role lists
├── [ ] Links resolve to real courses/certs
├── [ ] Performance <3s response
        PASS ☐ / FAIL ☐

Gate 2: LANGUAGE
├── [ ] 100+ languages supported
├── [ ] ALL output in user's selected language
├── [ ] No mixed language (Hindi + English) unless user prefers
├── [ ] Translation quality acceptable
        PASS ☐ / FAIL ☐

Gate 3: ACCESSIBILITY
├── [ ] Blind path tested (voice-first)
├── [ ] Deaf path tested (visual-first)
├── [ ] Illiterate path tested (icon+voice)
├── [ ] Haptic feedback for blind+deaf
        PASS ☐ / FAIL ☐

Gate 4: TRUST
├── [ ] No fake certifications
├── [ ] FREE option shown first (if exists)
├── [ ] No job guarantees or inflated claims
├── [ ] Every recommendation has source link
        PASS ☐ / FAIL ☐

Gate 5: ACCURACY
├── [ ] Role mapping correct (Doctor → healthcare, not finance)
├── [ ] Recommendations relevant to role
├── [ ] No hallucinated courses/certs
        PASS ☐ / FAIL ☐

Gate 6: SWARM REVIEW
├── [ ] All 8 agents executed
├── [ ] Trust & Quality Agent approved
├── [ ] Accessibility Agent approved
└── [ ] Language Agent approved
        PASS ☐ / FAIL ☐

Gate 7: OBSERVABILITY
├── [ ] Unknown role tracking (to improve coverage)
├── [ ] User feedback captured (thumbs up/down)
├── [ ] Broken link detection
└── [ ] Language coverage analytics
        PASS ☐ / FAIL ☐

Gate 8: FOUNDER REVIEW
├── [ ] "ANY role" principle verified
├── [ ] "ALL languages" principle verified
├── [ ] "ALL disabilities" principle verified
└── [ ] Sign off obtained
        PASS ☐ / FAIL ☐
```

---

## LEVEL 11 — CERTIFICATION

### Pre-Release Certification

| Domain | Passing Score | Target |
|---|---|---|
| Universal Role Coverage (ANY role) | 100% (no hardcoding) | ✅ |
| Language Coverage | 100+ languages | ✅ |
| Accessibility (Blind/Deaf/Illiterate) | >99% | ✅ |
| FREE-First Compliance | >90% of recommendations | ✅ |
| Link Validity (no hallucinations) | 100% | ✅ |
| User Satisfaction | >4.5/5 | ___/5 |

### Certification Grades

```
████████████████████████████████████████ 90-100%
GREEN — RELEASE READY
ANY role works. ALL languages. ALL disabilities.

████████████████████████████████████░░░░ 75-89%
YELLOW — CONDITIONAL
Some roles or languages missing.

████████████████████████████░░░░░░░░░░░░ <75%
RED — DO NOT RELEASE
Hardcoded roles or missing accessibility.
```

---

## LEVEL 12 — WORLD-CLASS FEATURES (Nobody Has)

**Feature: ANY Role, ANY Language, ANY Disability**
No other platform serves ALL three dimensions simultaneously.

**Feature: Dynamic Role Mapping**
User types "Veterinarian" → Chitti recommends animal health AI, veterinary diagnostics tools. No hardcoding. Works for ANY profession.

**Feature: Universal Prompt Library**
Prompts for ANY job: "Generate a discharge summary for a 5-year-old with fever" (Doctor) / "Draft a termination clause for employment contract" (Lawyer) / "Create a lesson plan for fractions" (Teacher).

**Feature: Learning Plan in ANY Language**
User's CV section auto-generated in Tamil, Yoruba, Portuguese — ANY language.

**Feature: Offline + Low-Bandwidth Mode**
Rural users with poor internet still get text-based recommendations. Voice mode works offline.

**Feature: Community-Expanded Knowledge**
Users submit new certifications, tools, prompts for their role. Moderated, then added to global database.

---

## SUMMARY TABLE

| Dimension | Coverage |
|---|---|
| Roles | ANY — user types, dynamic mapping |
| Languages | 100+ — ALL major + regional + growing |
| Disabilities | Blind, Deaf, Mute, Illiterate, Blind+Deaf, Low Vision, Cognitive |
| Content | Certs + Courses + Tools + Prompts |
| Pricing | FREE first, paid as alternative |
| Access | Online + Offline mode |

---

---

## LEVEL 13 — AI IMPACT SCORE™ (v1.1 Missing Layer 1)

Every profession carries 4 numeric scores, computed deterministically from
labelled task-automation data + verified industry signals (no LLM in the
critical path; LLM may enhance phrasing only).

| Score | Range | Meaning |
|---|---|---|
| AI Disruption Risk | 0-100% | % of current tasks automatable in 24 months |
| AI Adoption Level | LOW/MED/HIGH | How much of the profession already uses AI |
| AI Opportunity Level | 0-100% | New value unlocked by adding AI to this role |
| AI Readiness Score | 0-100 | Industry maturity — tools + jobs + cert availability |

### Worked examples

**Chartered Accountant**
```
AI Risk: 82%
  Bookkeeping:        95% automatable
  Auditing:           70% automatable
  Strategic Finance:  15% automatable
Recommendation: Move toward AI-assisted audit and advisory.
```

**Farmer**
```
AI Risk:        10%
AI Opportunity: 85%
Recommendation: Use AI for
  - Weather prediction
  - Disease detection
  - Fertilizer optimization
```

### Implementation contract
- `chitti_coach.js` exposes `aiImpactScore(profession_slug)` returning the
  4-score object + per-task breakdown + verdict.
- Data source: `COSDF_IMPACT_DATA.json` (hand-curated, cited).
- Updated quarterly per labour-market AI adoption reports
  (McKinsey GenAI 2025, NASSCOM AI Skills Premium, IndiaAI labour studies).
- Surfaced on Profession Hub (Level 23) as the top card.

---

## LEVEL 14 — CHITTI EXPLAINS WHY IT MATTERS (v1.1 Missing Layer 2)

Every news card gets a per-profession relevance verdict, not just a Chitti's Take.

### Current (insufficient)
> *"OpenAI released X."*

### v1.1 contract
> 🤖 **Chitti Says**
> - **Ignore** if you're a teacher
> - **Pay attention** if you're a software developer
> - **Very important** if you're in HR
> - **CRITICAL** if you're in customer support

### Implementation
- 4 relevance bands: IGNORE · PAY-ATTENTION · VERY-IMPORTANT · CRITICAL
- Computed deterministically from article topics × profession's
  task-vulnerability vector (Level 13 data).
- Renders on every news card under the existing `chitti_insight` line.

---

## LEVEL 15 — AI READINESS ASSESSMENT (v1.1 Missing Layer 3)

Every user gets a personal AI Readiness Score, not just a salary band.

### Worked example
```
Current Role:  Talent Acquisition
AI Usage:      Low
Prompting:     Beginner
Automation:    None
Score:         21/100

Roadmap to 80/100:
  Week 1-2:  Anthropic Skilljar Prompt Engineering (FREE)
  Week 3-4:  Eightfold AI hands-on trial
  Week 5-6:  LinkedIn Talent Insights certification
  Week 7-8:  Build: Interview Question Generator (Project Layer 5)
  Week 9-12: SHRM AI in HR Specialty Credential
```

### Implementation
- Extends intake from 5 questions to 8:
  - existing: profession · experience · current_skills · goal · hours_per_week
  - **NEW**: ai_usage (None/Low/Med/High) · prompting (Beginner/Int/Adv/Expert) · automation (None/Some/Many)
- `aiReadinessScore(profile)` returns 0-100 + 3-segment roadmap.
- Surfaced on Profession Hub as the second card after Impact Score.

---

## LEVEL 16 — WEEKLY LEARNING MISSIONS (v1.1 Missing Layer 4)

Replace "take this 50-hour course" (low completion) with a 30-minute weekly
mission (high completion).

### Mission card contract
```
📋 THIS WEEK'S MISSION (chosen for: Talent Acquisition)

Watch:     LinkedIn Recruiter AI demo                 15 min
Read:      Hung Lee: Recruiting Brainfood newsletter   5 min
Practice:  Write a Boolean → AI-rewritten prompt        5 min
Try:       Free Eightfold trial — paste 1 JD            5 min

Total commitment: 30 minutes this week.

[ Start Mission ]   [ Skip ]
```

### Implementation
- 1 mission/week per profession × user level (auto-rotates)
- Mission slot fields: watch (1 YT link 15 min) · read (1 article 5 min) ·
  practice (1 prompt 5 min) · try (1 tool 5 min)
- Stored as `MISSIONS[profession][week_offset]` in chitti_coach.js
- Marked complete → contributes +5 to AI Readiness Score
- Renders as 4th card on Profession Hub

---

## LEVEL 17 — REAL WORLD PROJECTS (v1.1 Missing Layer 5)

Courses don't create careers. Projects do. Each profession ships with
2-5 buildable AI projects + starter repos.

### Per-profession examples (the spec)
| Profession | Project to build |
|---|---|
| HR | Interview Question Generator |
| Teacher | Lesson Planner |
| Lawyer | Contract Summarizer |
| Farmer | Crop Disease Advisor (camera → diagnosis) |
| Doctor | Differential Diagnosis Helper |
| Accountant | Expense Anomaly Detector |
| Talent Acquisition | Resume → JD Match Scorer |
| Govt Employee | Multi-language Citizen Reply Drafter |
| Business Owner | Customer Support FAQ Bot |
| Software Developer | Codebase RAG Q&A |
| Nurse | Discharge-summary Auto-Drafter |
| Student | Personal Tutor for Exam Prep |

### Project card contract
- title · what-you-build · stack (which gold tool from Coach Picks) ·
  difficulty · estimated_hours · starter_repo_url · sample_demo_url
- Completing a project = +20 to AI Readiness Score + +1 portfolio entry
- Renders as a tab inside Profession Hub.

---

## LEVEL 18 — AI JOBS RADAR (v1.1 Missing Layer 6)

Connect news → learning → jobs in a single causal chain. No competitor does this.

### Worked example
```
News:    AI adoption in healthcare ↑ 30% (Q1 2026)
Jobs:    Radiology AI, Medical Coding AI, Clinical Documentation
Skills:  Clinical decision support, NCCN AI, AI radiology basics
Course:  Stanford AI for Healthcare (Coursera audit FREE)
Cert:    WHO Academy AI for Health (FREE)
Tool:    Aidoc, Abridge, Suki AI
Project: Build a SOAP-note auto-drafter prototype
```

### Implementation
- Every news article in `/api/news-ai/feed/news` gets an enriched
  `jobs_radar` field listing: affected_roles[], unlocked_certs[], unlocked_tools[]
- Rendered as a Radar panel on each Profession Hub (4th tab)
- Stored as deterministic map in `JOBS_RADAR_DATA.json`

---

## LEVEL 19 — CHITTI MENTOR (v1.1 Missing Layer 7)

Move from "course recommendation" to addictive progress tracking.

### Mentor card contract
```
🎓 Your Mentor Says

You completed:        2 courses
You skipped:          4
Progress:             18%
At this pace:         AI readiness in 14 months

Recommended next:     Prompt Engineering (1 week)

[ Pick up here ]
```

### Implementation
- Reads existing `profile.done_items` + `skipped_items` + `in_progress`
- Estimates time-to-target-readiness as: (target - current) / weekly_velocity
- Renders the next 1 item, never 30 (anti-paralysis discipline)
- Surfaced as 5th card on Profession Hub

---

## LEVEL 20 — COMMUNITY INTELLIGENCE (v1.1 Missing Layer 8)

Crowdsourcing becomes the moat. Users submit prompts, courses, tools, certs,
use cases; moderated; ranked.

### Submission contract
- Anyone with a profile can submit: {type, title, url, profession, what-it-does, why-useful}
- Submissions enter Pending → moderated (Trust Agent checks: real URL,
  no spam, profession match) → promoted to "Most Useful For [Profession]" panel
- "Most Useful For" panel shows top-5 community-submitted items per profession,
  ordered by 👍 votes from same-profession users

### Implementation
- New stream type: `community_pick`
- Frontend: `📥 Submit` button on every page; modal with 5 fields
- Backend: `/api/news-ai/community/submit` (rate-limited; later: human review)
- Phase 1: localStorage-staged submissions awaiting Sire's moderation
- Phase 2: Turso-backed once `turso auth login` lands

---

## LEVEL 21 — AI TOOL COMPARISON LAB (v1.1 Missing Layer 9)

Side-by-side comparisons for the hard decisions.

### Worked examples
```
Harvey vs CoCounsel  (for Lawyers)
                Harvey      CoCounsel
Price:          Enterprise  ₹2L/yr starter
Accuracy:       Higher      High
Legal Research: ★★★★★      ★★★★
Contract Rev:   ★★★★       ★★★★★
Winner (small firm):  CoCounsel
Winner (BigLaw):      Harvey
```

```
ChatGPT vs Claude vs Gemini  (per profession)
                 ChatGPT  Claude   Gemini
For Teachers:    ★★★★    ★★★★★   ★★★★★
For HR:          ★★★★    ★★★★★   ★★★★
For Doctors:     ★★★★    ★★★★★   ★★★★
```

### Implementation
- `COSDF_COMPARISONS.json` — hand-curated head-to-head matrices
- Each comparison: tool_a, tool_b, dimensions[], score_per_dimension, verdict_per_persona
- Rendered as a Comparison panel inside Profession Hub (6th tab)
- Updated monthly; "as of YYYY-MM" stamp visible

---

## LEVEL 22 — CHITTI FUTURE FORECAST™ (v1.1 Missing Layer 10)

Per-profession 3-year AI trajectory. Nobody has this.

### Worked example
```
Teacher

2026:  AI Tutor adoption        — Risk: Low      Opportunity: High
2027:  Automated grading        — Risk: Low      Opportunity: Very High
2028:  Personalised curriculum  — Risk: Medium   Opportunity: Very High

Verdict: STRONG OPPORTUNITY — teachers who adopt AI become curriculum leads.
```

Same forecast structure for: Doctor · Lawyer · CA · HR · Farmer · Developer ·
Architect · Mechanic · Nurse · Govt Employee · Business Owner · Student
(+ ANY role per Level 23 dynamic mapping).

### Implementation
- `COSDF_FORECASTS.json` — per-profession 3-year roadmap (cited from
  McKinsey GenAI Outlook + Gartner Future of Work + WEF Future of Jobs)
- Rendered as a Forecast panel inside Profession Hub (7th tab)
- Quarterly refresh

---

## LEVEL 23 — PROFESSION HUB ARCHITECTURE (the BIGGEST change)

### Before (v1.0): Flat feed-of-streams
```
[Tabs] AI News · Tools · Bharat AI · Prashikshan · Certs · Tools+ · Jobs ·
       Schemes · Roadmaps · YouTube · People · Free Resources · My Coach ·
       Coach Picks · Skip This
```
User picks a profession from a dropdown; same flat tabs filter.

### After (v1.1): Hub-per-profession
```
[Pick a role] → DOCTOR HUB
  ├── 1. AI News              (this week's news that affects YOU)
  ├── 2. Chitti Explains      (per-card relevance verdict)
  ├── 3. AI Readiness Score   (your number + roadmap)
  ├── 4. Certifications       (FREE-first, ranked)
  ├── 5. Courses              (FREE-first, ranked)
  ├── 6. Tools                (curated stack for your role)
  ├── 7. Prompts              (copy-paste-ready)
  ├── 8. Projects             (build to learn)
  ├── 9. Jobs Radar           (news → jobs → skills)
  └── 10. Mentor              (next 1 thing to do)
```

### Hubs to ship (Phase 1)
13 hardcoded hubs first (matches current professions):
Doctor · Oncologist · Nurse · CA / Accountant · Lawyer · Teacher ·
Software Developer · Talent Acquisition · HR Professional · Farmer ·
Government Employee · Business Owner · Student

### Hubs to ship (Phase 2)
**ANY-role hub** via dynamic mapping (per Level 6 Agent 1):
User types "Veterinarian" → Hub auto-assembles using:
- Mapped domain (veterinary medicine → healthcare adjacent)
- Mapped tools (filter Tools stream by veterinary keywords)
- Mapped courses (filter Course stream by veterinary keywords)
- Mapped jobs (filter Jobs stream by veterinary keywords)
- Default Impact Score template + per-task overrides if known

### Implementation
- New page: `chitti_hub.html` (or `?hub=doctor` query on existing page)
- Hub layout: 10 tabs inside the hub, each populated from existing streams
  + new layers (Impact / Readiness / Mission / Projects / Mentor / Comparison
  / Forecast)
- Profession picker becomes a Hub picker (with search for ANY role)
- Old flat-tab UI deprecated; old tabs accessible under "Browse all"

### Persistence
- `profile.active_hub` added to schema (default: profile.profession)
- Switching hub re-renders all 10 sections from the corpus + new layers

---

## LEVEL 24 — FINAL RATING (v1.1)

| Area | Current (v1.0) | With v1.1 (10 additions + Hub) |
|---|---:|---:|
| Accessibility | 10/10 | 10/10 |
| Vision | 10/10 | 10/10 |
| Swarm Design | 9/10 | 10/10 (Risk/Readiness/Mission/Project/Mentor/Comparison/Forecast/Community agents) |
| Trust Model | 9/10 | 9.5/10 |
| Learning Engine | 8/10 | 10/10 (Missions + Projects + Mentor) |
| Personalization | 8/10 | 10/10 (Per-user Readiness + per-card Relevance) |
| Career Outcomes | 7/10 | 9.5/10 (Jobs Radar + Future Forecast + Real Projects) |
| Competitive Moat | 8/10 | 10/10 (Community Intelligence + Forecast + Hubs) |

| Overall | Score |
|---|---:|
| **Current COSDF v1.0** | **8.8 / 10** |
| **With v1.1 additions** | **9.8 / 10** |

At v1.1, Chitti News AI is no longer competing with:
- News apps (Inshorts / Google News)
- Course platforms (Coursera / UpGrad)
- AI directories (There's An AI For That)

It becomes a **Global AI Career Copilot for Every Profession, Language,
and Ability Level**.

---

**Document Version:** 1.1
**Prepared for:** Chitti News AI OS Development
**Classification:** COSDF Internal Framework

> **"Chitti News AI — ANY role. ANY language. EVERY person.
> ANY readiness level. ANY future."**
