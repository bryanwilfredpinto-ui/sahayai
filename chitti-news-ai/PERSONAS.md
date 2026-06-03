# Chitti News AI — PERSONAS

Every product decision is checked against these personas. **If a feature does not serve at least 2 of them well, it does not ship.**

---

## Primary personas (the 13-profession registry)

These are the personas the [profession registry](backend/data/profession_registry.json) is built around. Each links to a real human archetype.

### P1 — Aarav, Software Developer, 28, Bangalore
- **Job:** mid-level backend engineer at a Series-B Indian startup
- **Reads in:** English + Hindi mix; prefers English titles
- **Phone:** mid-range Android, 4G most of the time, 2G in his hometown trips
- **Daily ritual:** 5 minutes on Chitti News AI morning + 2 minutes before standup
- **What he wants:** "What new AI tool came out that I should evaluate? Which cert is recruiters actually asking for? Which company is hiring for LLM work?"
- **What he hates:** Generic "AI is transforming software development" articles. Wants specific tools / certs / jobs / repos.
- **Success metric:** Tries a new tool / applies to one job from Chitti within a week.

### P2 — Sunita, HR Professional, 36, Hyderabad
- **Job:** Senior HR lead at a 500-person tech services company
- **Reads in:** English + Telugu; English at work, Telugu at home
- **What she wants:** "How is AI changing recruitment? Which HRIS tools matter? What's the latest on DEI in workplace? What's a good L&D programme my team can take?"
- **What she hates:** Recruiter-spam disguised as "thought leadership". Vendor ad copy.
- **Success metric:** Adopts one HR tool or rolls out one L&D programme per quarter.

### P3 — Raghav, Talent Acquisition (Tech Recruiter), 31, Pune
- **Job:** Tech recruiter at a fast-growing product company
- **Reads in:** English; LinkedIn-fluent
- **What he wants:** "Which ATS tools are top-tier? What boolean search patterns work for finding ML engineers? What's the going market rate for a fine-tuning engineer in Bangalore?"
- **What he hates:** Articles about "the future of hiring" that don't include actionable tactics.

### P4 — Dr. Meera, Doctor (Physician), 42, Lucknow
- **Job:** Primary care physician at a 50-bed hospital
- **Reads in:** Hindi + English; medical content in English
- **Phone:** mid-range Android, often slow hospital WiFi
- **What she wants:** "What AI tools can speed up my radiology reads? What's new in clinical decision support? What's the latest CDSCO guideline on AI medical devices?"
- **What she hates:** Articles that confuse AI hype with clinical evidence. Wants peer-reviewed sources.

### P5 — Dr. Karthik, Oncologist, 47, Chennai
- **Job:** Medical oncologist at Tata Memorial-affiliated clinic
- **Reads in:** English; high reading volume (3-5 journals/week)
- **What he wants:** "What's the latest NCCN guideline update? Any AI tools for tumour genomic profiling? Trial recruitment for my patient population?"
- **What he hates:** Generic medical AI articles. Wants oncology-specific signal.

### P6 — Priya, Nurse, 29, Coimbatore
- **Job:** ICU nurse at a multi-speciality hospital
- **Reads in:** Tamil + English; Tamil preferred for non-work reading
- **Phone:** mid-range, often on hospital WiFi
- **What she wants:** "Are there any new AI tools that can help with patient monitoring documentation? Any free CME I can do in Tamil?"
- **What she hates:** Articles assuming nurses are not technical. Wants respect + actionable content.

### P7 — Ramesh, Farmer, 52, Vidarbha (Maharashtra)
- **Job:** Cotton + soybean smallholder farmer; member of an FPO
- **Reads in:** Marathi only; voice-first user
- **Phone:** entry Android, often 2G
- **What he wants:** "Is there an AI drone service in Marathwada? When is the next PM-Kisan instalment? What's the soil card season?"
- **What he hates:** English-only content. Articles that talk down. Anything that requires reading more than 50 words.
- **Success metric:** Adopts one government scheme or precision-agri practice per season.

### P8 — Ananya, Teacher, 34, Bengaluru
- **Job:** Government school 8th-grade teacher
- **Reads in:** Kannada + English; teaching prep in English
- **What she wants:** "What AI teaching aids work for NEP 2020 lesson plans? Free DIKSHA modules I can take? PM-eVidya content I can play in class?"
- **What she hates:** EdTech ad copy. Wants real classroom-tested content.

### P9 — Adv. Rohan, Lawyer, 38, Mumbai
- **Job:** Litigation lawyer; civil + criminal practice
- **Reads in:** English + Hindi; legal content in English
- **What he wants:** "What's the latest BNS / BNSS / BSA case-law summary? Any AI tools for case-law research? Free CLE programs?"
- **What he hates:** Legal-tech vendor copy. Wants peer-reviewed case law + government sources.

### P10 — CA Bhavesh, Accountant, 41, Surat
- **Job:** Practising chartered accountant; SME tax practice
- **Reads in:** Gujarati + English; tax content in English
- **What he wants:** "Latest GST circular? Any AI tools that automate ITR filing? Power BI for SME dashboards?"
- **What he hates:** Generic FinTech content. Wants ICAI-aligned specifics.

### P11 — Anjali, Student, 19, Patna
- **Job:** Final-year BSc CS undergraduate
- **Reads in:** Hindi + English; learning in English
- **Phone:** mid-range Android, college WiFi
- **What she wants:** "Best free AI course right now? Internship openings? Free NPTEL certs that recruiters value? UPSC AI optional syllabus?"
- **What she hates:** Paid certification spam. Wants honest free paths.
- **Success metric:** Completes one cert + lands an internship in 12 months.

### P12 — Mahesh, Business Owner, 49, Coimbatore
- **Job:** Owns a 20-person mid-size manufacturing unit + a kirana franchise
- **Reads in:** Tamil + English
- **What he wants:** "How is AI changing manufacturing? Should I move my kirana to ONDC? Any MUDRA loan updates? Which Power BI dashboard would help me see my SKU performance?"
- **What he hates:** Startup-investor copy. Wants SME-relevant actionable.

### P13 — Suresh, Government Employee, 45, Bhubaneswar
- **Job:** Central government Section Officer; state government deputation
- **Reads in:** Odia + English; official content in English
- **What he wants:** "Latest iGOT Karmayogi modules? Any AI tools approved for govt use? DOPT circular summaries? Vigilance updates?"
- **What he hates:** Private-sector productivity content. Wants govt-specific authoritative.

---

## Operational personas

### P14 — Sire (Bryan), Founder + CTO
- Needs: Honest curl-verified status reports. No surprises. Benchmarks before claims.
- Reads: Daily Report in CTO Inbox. Vaani-routed status updates.

### P15 — Chitti CTO (this agent)
- Needs: Locked decisions documented; spec parity between repo + production; CI guardrails.

---

## Anti-personas (we will not optimise for these)

| | We do NOT serve |
|---|---|
| **The recruitment-pitch reader** | Wants top-of-funnel AI buzzwords to share on LinkedIn. Chitti has signal, not flexing material. |
| **The investor-pitch reader** | Wants "AI market sizing for Indian healthcare" reports. Chitti is operational, not strategic. |
| **The English-only urban professional uninterested in vernacular** | Free to use Chitti, but every product decision favours the vernacular-first user. |
| **The "AI doomerism" reader** | Chitti is neither hype nor doom. It is operational signal. |

---

## How a persona check works in practice

Before any feature ships, the team writes a one-line check:

> *"Aarav (P1) opens the For You tab on his 5-min morning train commute. Does this feature help him in those 5 minutes?"*

If 2 of the 13 personas can't be served by the feature, it doesn't ship.

---

**World Class Chitti News AI — Commando Discipline. Zero Excuses.**
