# CNAIOS — SKILLS

The capabilities every CNAIOS contributor (human or agent) must master.

> **COSDF v1.1 (2026-06-05):** the 7 skills below extend to 15 with the 10
> missing layers. Canonical spec: [COSDF.md](COSDF.md) Levels 13-23.

---

## COSDF v1.1 — NEW skills (to build)

| Skill | What it does | How (rules-only) |
|---|---|---|
| **Impact Scoring** (L13) | Compute 4 numeric scores per profession (Disruption Risk / Adoption / Opportunity / Readiness) | `COSDF_IMPACT_DATA.json` hand-curated from McKinsey + NASSCOM + WEF reports; `aiImpactScore(prof_slug)` returns the bundle |
| **Per-card Relevance** (L14) | For every news article, return one of 4 verdicts per profession (IGNORE / PAY-ATTENTION / VERY-IMPORTANT / CRITICAL) | Deterministic mapping: article.topics × profession's task-vulnerability vector |
| **Readiness Assessment** (L15) | 0-100 personal AI Readiness Score + 12-week roadmap | Intake captures ai_usage / prompting / automation; rules compute score + sequence existing items into 12-week plan |
| **Mission Generation** (L16) | Build a 30-min weekly mission: watch + read + practice + try | Select 1 video + 1 article + 1 prompt + 1 tool from corpus per (profession, week_offset) |
| **Project Recommendation** (L17) | Suggest 2-5 buildable AI projects per profession with starter repos | Curated `PROJECTS_PER_PROFESSION.json` with stack + difficulty + sample_demo_url |
| **Jobs Radar Linking** (L18) | Connect news article → affected job roles → required certs → unlocked tools → buildable project | Enrich `/api/news-ai/feed/news` items with `jobs_radar` field; deterministic map per topic |
| **Mentor Track** (L19) | Read profile, compute time-to-target-readiness, surface 1 next item (never 30) | `velocity = done/weeks_active`; `eta = (target - current) / velocity`; pick highest-score unstarted gold item |
| **Tool Comparison** (L21) | Side-by-side head-to-head with verdict per persona | Curated `COSDF_COMPARISONS.json`; renders matrix + winner per persona |
| **Future Forecast** (L22) | Per-profession 3-year trajectory with verdict | Curated `COSDF_FORECASTS.json` from WEF Future of Jobs + Gartner + McKinsey |
| **Community Moderation** (L20) | Accept submissions, route to moderator, promote to "Most Useful For [Profession]" | Submission flow + Pending → Approved state machine + 👍 ranking by same-profession users |
| **Dynamic Role Mapping** (L23) | ANY role user types → mapped to domain + tools + courses + certs + jobs | Keyword + alias dictionary; falls back to "general AI for [your role]" if no specific mapping |

---

## Skill 1 — Profession Classification (rules-only)

| Skill | Owner | Eval bar |
|---|---|---|
| Per-profession F1 (rules-only critical path) | [`services/profession_classifier.py`](backend/services/profession_classifier.py) | ≥ 0.90 per profession |
| Explainability per emit | classifier output schema | `category + confidence + matched_keywords + source_signals + rule_version` mandatory |
| Forbidden imports static scan | CI: `test_no_llm_imports_in_classifier_critical_path` | zero forbidden imports |
| Per-source default tags + URL patterns | [`data/courses_sources.json`](backend/data/courses_sources.json) + [`data/streams_sources.json`](backend/data/streams_sources.json) | versioned |
| Negative-keyword veto | [`data/profession_registry.json`](backend/data/profession_registry.json) `exclude_keywords` | every profession has list |

**Hard rule:** Sire's 4 worked examples MUST pass (CUDA → SD · Oncology AI → oncologist · Precision Agri → farmer · ATS → talent-acquisition). Locked in `test_classifier_sire_worked_examples`.

---

## Skill 2 — Source Aggregation (real, free, public)

| Source-type | Live sources | Manifest sources |
|---|---|---|
| News | **23 RSS** (8 AI + 15 profession-specific landed 2026-06-04: LiveLaw / Bar & Bench / The Hindu Health / Express Healthcare / MedPage Oncology / Krishi Jagran / Down To Earth Agri / PTI Education / Education World / Taxmann / ETCFO / ETHRWorld / People Matters / Mint MSME / ET Government) | — |
| Courses | Microsoft Learn live | 7 manifests (NPTEL, MIT OCW, fast.ai, HF, freeCodeCamp, DeepLearning.AI, GCSB) |
| Certifications | — | **12 manifests** (MS / AWS / NASSCOM / GCloud / HR+TA / Doctor / Nurse / Farmer / Teacher / Lawyer / Gov-Employee / Accountant — landed 2026-06-04) |
| Tools | — | **9 manifests** (HF Spaces, GH Trending, HR+TA, Doctor, Nurse, Farmer, Teacher, Lawyer, Gov-Employee, Accountant — landed 2026-06-04) |
| Jobs | 9 RSS (3 original + LinkedIn India / Naukri / Indeed India / Wellfound / Cutshort / Instahyre) | **6 manifests** (HN / NCS + Healthcare / Teacher / Lawyer / Gov-Employee — landed 2026-06-04) |
| Schemes | — | **9 manifests** (7 original + Farmer / Teacher / Nurse / Gov-Employee / Business-Owner / Student / Doctor / Lawyer — landed 2026-06-04) |
| Roadmaps | — | 2 manifests |
| Grants | **2 live** (MyGov + Google Research) | — |
| Research | **2 live** (arXiv cs.AI + HF Daily Papers) | — |
| Startups | **3 live** (YourStory / Entrackr / Inc42) + 1 manifest (YC India) | — |

**Hard rule:** Every source is FREE + PUBLIC + provider-attributed. No paid-API recommendation. No invented courses.

**Honest count after 2026-06-04 compliance pass:** all 9 streams have live + manifest coverage. All 13 personas have ≥3 streams populated (11/13 with total ≥25 items). Audit harness: `tools/cert_lang_hooks.mjs` for CTO §8 + `backend/tests/test_classifier_sire_worked_examples.py` for SOP-002.

---

## Skill 3 — Career-relevance Classification

| Mapping | Rule |
|---|---|
| AI course → developer / data-scientist / student | Source-default tags + content keywords |
| Job posting → profession | Source-default + employer/title keywords |
| Cert → profession × level | Manifest-declared + verbatim cost label |
| Tool → use-case profession | Source-default + topic keywords |
| Govt scheme → profession | Manifest-declared + keyword match |

**Hard rule:** Career-relevance classification is rules-only. No LLM in critical path.

---

## Skill 4 — Fail-open Architecture

| Skill | Eval bar |
|---|---|
| Every endpoint serves real items with all LLM env vars stripped | 6/6 CI tests in `test_fail_open.py` |
| Extractive fallback for explain + summarise | `enhancement.py::summarise` is LLM-free |
| Honest empty state on every endpoint | `feed.py` returns 200 with `honest_note_en` |
| No silent failure | every ingest error logged + surfaced in `/admin/stats` |

**Hard rule:** A user must get real items even with every LLM provider offline. Continuously enforced.

---

## Skill 5 — Per-card Explainability + Trust Strip

| Field | Required |
|---|---|
| `category` | per classified item |
| `confidence` | numeric [0,1] |
| `matched_keywords` | the actual keywords that fired |
| `source_signals` | rule trace (`source_default:fast-ai`, `url_pattern:/106106`) |
| `rule_version` | for cache invalidation |
| Trust badge | HIGH / MED / LOW per confidence band |
| Free/Paid badge | verbatim from provider |
| Stale flag | when ingested_at > 30 days |

**Hard rule:** Every classified card carries all 8 fields. Mobile cert verifies.

---

## Skill 6 — World-class features (Phase 2)

| Feature | Spec |
|---|---|
| Opportunity Radar | [`features/OPPORTUNITY_RADAR.md`](features/OPPORTUNITY_RADAR.md) |
| Skill Gap Radar | [`features/SKILL_GAP_RADAR.md`](features/SKILL_GAP_RADAR.md) |
| AI Impact Score | [`features/AI_IMPACT_SCORE.md`](features/AI_IMPACT_SCORE.md) |
| Chitti Mentor | [`features/CHITTI_MENTOR.md`](features/CHITTI_MENTOR.md) |
| Chitti Coach | [`features/CHITTI_COACH.md`](features/CHITTI_COACH.md) |
| Chitti Opportunity Engine | [`features/OPPORTUNITY_ENGINE.md`](features/OPPORTUNITY_ENGINE.md) |

---

**World Class CNAIOS — Commando Discipline. Zero Excuses.**
