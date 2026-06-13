# CNAI_BO2_RESEARCH.md
## BO2 — Course Discovery & Registration · Top-20 + Top-20

**Date:** 2026-06-13 · No code before research (Phase 2 Step 1). *[verify]* = confirm live before user copy.

### A. Top 20 — Course discovery / aggregation / registration bots
| # | App | Brilliant at | Misses | A11y gap | Chitti beats by |
|---|---|---|---|---|---|
| 1 | Class Central | Aggregates 200k+ courses, "free certificate" filter | Ads; not a coach; English | Not 4-user | Free-first sort + profession lens + vernacular |
| 2 | Coursera (catalog) | Audit mode exists | Audit hidden; cert paywall | Captions only | Surfaces audit-free first, discloses cert cost |
| 3 | edX | University rigor | Audit/verified confusion | English | Clear free-vs-paid badges |
| 4 | Udemy | Huge catalog | Quality variance, fake "₹499 sale" urgency | English | Scam-shield flags the urgency tactic |
| 5 | SWAYAM | Govt free, IIT/IIM | Poor discovery/search | Limited Indic UX | Sequences + surfaces SWAYAM as priority-1 |
| 6 | NPTEL | IIT free-to-learn | ₹1000 exam fee buried | English/Hindi | Discloses exam fee transparently (SOP 11) |
| 7 | Skill India Digital | Govt cert, free | Bureaucratic discovery | Trust friction | Priority-1 source, plain-language |
| 8 | NIELIT | Govt AI, Hindi+En, free | Low visibility | — | Top of free-source ladder |
| 9 | Google Skillshop/Grow | Free, trusted, some Indic | Self-serve catalog | Not 4-user | Coaches *which* course for *your* job |
| 10 | Microsoft Learn | Free structured paths | MS-ecosystem framing | Not 4-user | Provider-neutral ranking |
| 11 | IBM SkillsBuild | Free AI/data certs | English | Not 4-user | Vernacular + free cert surfaced |
| 12 | NVIDIA DLI | Authoritative DL | Advanced; some paid | Not 4-user | Beginner-safe sequencing |
| 13 | Hugging Face Learn | Free, current | Expert-level | Not 4-user | Analogy-first onboarding |
| 14 | freeCodeCamp | Free certs + projects | English; self-serve | Some a11y | Profession framing |
| 15 | Kaggle Learn | Free micro-courses + cert | Data/ML only | Not 4-user | Cross-profession |
| 16 | DataCamp | Skill assessment → track | Paid | Not 4-user | Free + skill-gap (Skill 2) |
| 17 | Degreed/Workera | Measure → skill-gap → path | B2B; English | Not 4-user | Consumer + free |
| 18 | LinkedIn Learning | Role paths | Paywall | English | Free-first |
| 19 | Internshala Trainings | India + placement framing | Paid; lead-gen | — | Free-first; flags placement-guarantee |
| 20 | Coursera Coach (AI) | In-context help | Locked to paid catalog | English | Provider-neutral, free-first |

### B. Top 20 AI apps — discovery / registration / scam-detection adjacent
| # | App | Brilliant at | Misses | A11y gap | Chitti beats by |
|---|---|---|---|---|---|
| 1 | ChatGPT "find me a course" | Conversational | **Hallucinates dead URLs**; no free-first | Not 4-user | Verified catalog, no dead links |
| 2 | Perplexity | Cited results | No registration flow | English | Verified + consent registration plan |
| 3 | Google "Course" rich results | Surfacing | Ad-mixed | — | No ads, free-first |
| 4 | Coursera Coach | In-context | Paid catalog | English | Neutral |
| 5 | Udemy AI recommender | Personalized upsell | Paid-first | — | Free-first |
| 6 | Degreed Maestro | AI skill paths | Enterprise | Not 4-user | Consumer |
| 7 | Sana | Adaptive | B2B; opaque | Not 4-user | Transparent (no-LLM classify) |
| 8 | Scam-detection (Bitdefender/Truecaller) | Flags fraud links | Generic, not course-aware | — | Course-specific 7-pattern scam shield |
| 9 | cybercrime.gov.in | Official reporting | Not preventive | — | Chitti links it + pre-warns |
| 10 | PIB Fact Check | Debunks govt-scam claims | Reactive | — | Proactive on "govt certified ₹X" |
| 11 | I4C / 1930 helpline | Cyber-fraud line | Post-fact | — | Chitti surfaces it in every scam warning |
| 12 | LinkedIn course rec | Career-linked | Paywall | English | Free-first |
| 13 | Khanmigo course nav | Grounded | US-curriculum | Limited langs | India free sources |
| 14 | Brilliant rec engine | Intuition path | Paid | Not 4-user | Free |
| 15 | Maxai/Merlin | Summarize-any-course | No free-first/registration | Not 4-user | Consent registration plan |
| 16 | Notion AI course DB | Personal tracking | Manual | — | Auto-discovery |
| 17 | Quizlet AI | Study sets | Not discovery | Limited | — |
| 18 | Apna (jobs+training) | India scale | Paid trainings; lead-gen | — | Free-first; flags fees |
| 19 | Great Learning Academy | Free tier | Funnels to paid; **heavy sales** | English | No sales funnel; honest |
| 20 | Simplilearn AI advisor | "free webinar" hooks | Lead-gen; urgency | English | Scam-shield flags urgency |

### C. 3 best ideas to adopt
1. **Class Central's "free certificate" filter** → free-first sort is already a SORT KEY; add an explicit `is_free`/`tier_label` and never let paid outrank free.
2. **Perplexity citations / verified links** → never emit a hallucinated URL; the catalog is hand-verified; broken links suppressed *[verify at refresh]*.
3. **cybercrime.gov.in + 1930 in every fraud warning** → Skill 10/SOP 10 scam shield with the mandatory format and the helpline.

### D. 3 anti-patterns to avoid
- **Paid-first / hidden audit mode** (Udemy/Coursera) → free-first constitutional.
- **Lead-gen + fake urgency** (Great Learning/Simplilearn "5 seats left") → flagged as a scam pattern, never used.
- **Auto-enrolling the user / sitting exams** → consent-gated plan only; never auto-create accounts or sit graded exams (Pillar 8, Golden Rule).

### E. CEOS/Skill/SOP mapping
- CEOS BO2 self-check: free before paid always; audit-mode badge; verified live URLs; provider/lang/free badges; a11y on badges; <1.5s cached.
- **Skill 3** free-source priority (9 sources) — present via trust-tier ladder.
- **Skill 10 / SOP 10** scam detection (7 patterns) → **add `scamCheck()`** here (exercise: "integrated into cnai_course_discovery.js").
- **SOP 11** Certification Gate (4 checks) → **add `certificationGate()`**.

### F. Deviation
None. Additions (`scamCheck`, `certificationGate`, `freeSourcePriority`) are new functions; `find/registrationPlan/speakable/tierLadder` unchanged.
