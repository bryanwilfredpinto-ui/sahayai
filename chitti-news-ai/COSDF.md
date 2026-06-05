# COSDF v1.0 — CHITTI NEWS AI
## Complete Operating System Development Framework

> **Authored:** Sire (Bryan Wilfred Pinto) — 2026-06-05
> **Committed to repo:** 2026-06-05 — single source of truth, never re-litigated
> **Supersedes:** Any prior per-Chitti spec for chitti-news-ai. Reconciles with
> `SAHAYAI_MASTER.md` (vision) + `CHITTI_SOP.md` §7 (per-Chitti contract) +
> `chitti-cto/CTO.md` (build rules).

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

**Document Version:** 1.0
**Prepared for:** Chitti News AI OS Development
**Classification:** COSDF Internal Framework

> **"Chitti News AI — ANY role. ANY language. EVERY person."**
