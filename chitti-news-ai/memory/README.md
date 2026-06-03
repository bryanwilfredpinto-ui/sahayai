# CNAIOS — Memory

> *"Per-device only. Never synced to backend. `Chitti.forget()` wipes everything."*

---

## What we remember (per-device, localStorage only)

| Key | Schema | Purpose |
|---|---|---|
| `chitti_news_ai_profession` | string (slug from 13-profession registry) | Drives For You + per-stream profession filter |
| `chitti_news_ai_lang` | string (Voice Factory locale) | Display + translation language |
| `chitti_news_ai_user_token` | UUID | Per-device anonymous id for feedback aggregation |
| `chitti_disability_profile` | JSON shared with all Chittis | Drives a11y behaviors (blind auto-read, ISL panel, illiterate voice-onboarding) |
| `chitti_news_ai_for_you` | (Phase 2) JSON `{streams: {courses: 0.5, jobs: 0.7, ...}}` | Per-stream weights for Chitti Mentor + Coach |
| `chitti_news_ai_saved` | (Phase 2) JSON `[{kind, id}, ...]` | Saved items across all 7 streams |

---

## What we DO NOT remember

| | Why |
|---|---|
| Reader's name / email / phone | No PII |
| Reader's actual job title beyond profession slug | Profession is enough; granularity is privacy risk |
| Reader's salary / career history | Hard line — never |
| Reader's actual learning history | Career-outcome survey is opt-in, anonymous, aggregate only |
| Cross-device link | Per-device only |

---

## Recall examples (per persona)

| Persona | What we recall | What we render differently |
|---|---|---|
| Aarav, Developer (P1) | profession=software-developer, lang=en | For You: SD-classified news + courses + jobs + tools + roadmaps |
| Dr. Meera, Doctor (P4) | profession=doctor, lang=hi | For You: clinical + oncology + AIIMS / Tata Memorial sourced |
| Ramesh, Farmer (P7) | profession=farmer, lang=mr, illiterate=true | For You: agritech + schemes + voice-first |
| Anjali, Student (P11) | profession=student, lang=hi | For You: courses + scholarships + JEE + free certs |

---

## Cross-Chitti memory (Phase 2)

When CNOS news has a story tagged with profession relevance (Career Agent hand-off), and the user's CNAIOS profession matches:
- That news story bubbles into the CNAIOS "AI News" stream
- Auditable in the user's For You feed under "From CNOS"
- Per-device hand-off; no backend join

---

## `Chitti.forget()`

Same contract as CNOS — wipes all localStorage keys, tombstones per-device aggregate rows, sets opt-out flag.

---

**World Class CNAIOS — Commando Discipline. Zero Excuses.**
