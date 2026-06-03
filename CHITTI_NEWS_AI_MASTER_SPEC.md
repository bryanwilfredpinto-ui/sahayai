# Chitti News AI — Master Spec

**The 14th Chitti.** The curated, per-profession career-intelligence
aggregator for Bharat. **Intelligence aggregator, not AI content
generator.**

Last touched: **2026-05-29** · Version **0.2.0** · Status: **AGGREGATOR
PIVOT — Phase 0 in flight**.

> Read [`SAHAYAI_MASTER.md`](SAHAYAI_MASTER.md) first. This spec sits under
> the platform-wide locked decisions there — never overrides them.

---

## 0. Version history

| Version | Date | Direction |
|---|---|---|
| 0.1.0 | 2026-05-14 | SKELETON — 10-tab surface, trust/ranker/discovery machinery |
| 0.1.1 | 2026-05-23 | LOCK — discarded ranker/discovery; 4 tabs + per-article 🤖 explain only |
| **0.2.0** | **2026-05-29** | **DOCTRINE — Intelligence Aggregator, not AI Content Generator. 7 aggregation streams × N profession lenses. AI classifies, translates, and explains — never generates substance.** |

The 2026-05-23 4-tab base is **kept honest**. The aggregator is a *layer
on top* — never a replacement.

---

## 1. Why this Chitti exists

Indian professionals — Tier-2/3 cities, vernacular speakers, the four
user archetypes (Blind / Deaf / Mute / Illiterate), and the urban
professional alike — face the same root question every morning:

> *"AI is changing my work. What should I do today?"*

The answer surface differs per profession (a cert for a developer, a
PM-Kisan-AI-pilot for a farmer, an OCR tool for a CA, a teaching aid for
a teacher) but the engine is the same: **collect the real free
information that already exists, organize it per profession, verify it,
rank it, filter it, translate it, and explain it on demand.**

No other product does this in vernacular Indian languages, for free, with
trust-first design, voice-out, ISL, and the four-user contract intact.

---

## 2. Doctrine — LOCKED 2026-05-29

**Chitti is an Intelligence Aggregator, not an AI Content Generator.**

- The primary source of value is **collecting, organizing, verifying,
  ranking, filtering, and personalizing free information**.
- AI is used **only to enhance understanding** — classify items by
  profession, translate to user's language, explain on demand,
  summarise extractively (pull from the source, never invent).
- **AI never generates the substance** — never fabricates a course that
  doesn't exist, never invents a certificate, never makes up a job
  posting, never hallucinates pros/cons.
- Every item shown to the user **carries a source URL** that the user can
  open. No claim is made that cannot be traced back to a real public
  source.
- **Trust is the primary KPI.** If confidence is low, say so. If a
  source cannot be verified, say so. Never manufacture authority.
- **Free and publicly available information is preferred wherever
  possible.** Paid courses are surfaced only when honestly labelled
  with the cost; never hidden, never the default recommendation.

---

## 3. The 7 aggregation streams

For every profession, the daily feed has **7 sections**. Each pulls
from real free public sources. AI's role is bounded per column.

| Section | Sources (free + public) | AI's role |
|---|---|---|
| **News** | RSS feeds — current 8 + expand to ~15 (HuggingFace Daily Papers, MarkTechPost, MIT Tech Review free tier, The Decoder, Indian Express tech, Mint AI, Inc42 AI, Entrackr) | Profession-relevance classifier; headline translator; on-tap 🤖 explain |
| **Courses** | NPTEL / SWAYAM public catalogues · Google AI Education · Microsoft Learn (public REST) · AWS Skill Builder free tier · NVIDIA DLI free path · fast.ai · MIT OCW RSS · freeCodeCamp · Kaggle Learn · Coursera/edX audit mode only | Profession-relevance classifier; title translation |
| **Certifications** | Same providers' free study paths + NASSCOM FutureSkills Prime · IBM SkillsBuild · Google Cloud Skills Boost free quests · NPTEL exam · honest exam-cost label always shown | Profession + difficulty classifier; **never hide costs** |
| **Tools** | Hugging Face Spaces API · GitHub Trending filtered to `topic:ai`, `topic:machine-learning` · Product Hunt RSS (free-tier items) · futuretools.io · There's An AI For That public listings | Profession + use-case classifier; pros/cons **extracted from real reviews + issues**, never invented |
| **Jobs** | Hacker News "Who's Hiring" RSS · YC hiring page · Wellfound public · Remote OK RSS · WeWorkRemotely RSS · Indeed RSS · Naukri public RSS · Sarkari Result RSS · NCS (govt jobs) RSS | Profession classifier; **never rewrite the JD** — link out to source |
| **Government initiatives** | Reuse [`chitti-government`](chitti-government/) PIB poller (6h, already wired) · MyGov.in RSS · MeitY press releases · MSDE / NSDC RSS · NITI Aayog publications · state portals | Profession-relevance classifier; translation to user's language |
| **Learning roadmap** | Aggregate, never invent: roadmap.sh AI/ML JSON (public GitHub) · OSSU curriculum · Google AI Engineer Learning Path · Microsoft Learn paths · fast.ai recommended path | Tag each roadmap node with profession applicability; on-tap translate |

**Target source count:** ~60 free public feeds across the 7 streams.

---

## 4. AI's redefined role (Gemini free tier, 1500 calls/day ceiling)

| AI role | Type | Call shape | Budget |
|---|---|---|---|
| **Profession classifier** | Few-shot multi-label classifier | 1 call per ingested item, returns array of profession labels | ~150 items/day × 1 = **150 calls** |
| **Headline translator** | Per-language cache | 1 call per (item, language), only on first request | Lazy, cached forever — **~50 calls/day** |
| **On-demand 🤖 explain** | Extractive + simplification (current `news_explain.py`) | 1 call per user tap | **~500 calls/day** budget |
| **Daily "AI Impact Today" digest** | Extractive ranking of already-classified items | 1 call per profession per day | 13 professions × 1 = **13 calls** |
| **Total** | | | **~700 calls/day** ≈ 50% of free-tier ceiling |

AI is **never asked to know a fact, generate a list, or invent a
recommendation**. Every output is grounded in a specific source URL.

LLM provider is **env-var-driven** (`DEEPSEEK_URL` / `DEEPSEEK_MODEL` /
`DEEPSEEK_API_KEY`). Per the [[project_deepseek_balance_exhausted_2026_05_27]]
hijack, these point at Gemini 2.0 Flash today. Reverses to DeepSeek the
moment DeepSeek is funded — no code change.

---

## 5. Profession registry

| Slug | Display |
|---|---|
| `software-developer` | Software Developer |
| `hr-professional` | HR Professional |
| `talent-acquisition` | Talent Acquisition |
| `doctor` | Doctor |
| `oncologist` | Oncologist |
| `nurse` | Nurse |
| `farmer` | Farmer |
| `teacher` | Teacher |
| `lawyer` | Lawyer |
| `accountant` | Accountant |
| `student` | Student |
| `business-owner` | Business Owner |
| `government-employee` | Government Employee |

**Architecture must support unlimited professions.** The list above is
the seed; new entries are added as data (a JSON row), never as code.

---

## 6. Frontend contract — additive, not destructive

The existing 4-tab base ([`chitti_news_ai.html`](chitti_news_ai.html))
**stays exactly as it is**. The aggregator surface adds:

1. **Inline "I am a…" profession strip** at the top of the home page.
   - **Default: Everyone** — never gate the door.
   - Selecting a profession **filters the same articles down to those
     classified relevant to that profession** + reveals the 6 other
     sections (Courses, Certs, Tools, Jobs, Govt, Roadmap).
2. **Profession is stored locally only** (`localStorage.chitti_news_ai_profession`).
   Never synced to the backend. Changeable any time, deletable by
   `Chitti.forget()`.
3. **Accessibility takes precedence over personalization.** The picker
   is mute-user safe (text + dropdown + voice optional), blind-user
   safe (auto-readable via [`chitti_a11y.js`](chitti_a11y.js)), and never
   blocks content rendering — articles render first, the picker hydrates
   afterwards.
4. **Content visible immediately on first visit.** No onboarding modal.
   No gate. The four-user contract takes precedence.
5. **All sections inherit** the existing per-response widget (🔊 / 🤖 /
   👍 / 👎 + per-box feedback), ISL panel, Voice Factory cascade, and
   Feature Discovery Box.

---

## 7. Backend contract (Phase 0+)

Three new tables, three new services, one new route family. **Nothing
existing is renamed or removed** — the 0.1.1 endpoints stay live.

```
chitti-news-ai/backend/
  data/
    profession_registry.json      ← 13 seed professions, extensible
    courses_sources.json          ← 8 free providers (Phase 0)
    ... (jobs_sources, certs_sources, tools_sources, govt_sources, roadmap_sources to follow)
  models/
    courses_v2.py                 ← rich schema for aggregated courses
    profession_relevance.py       ← item × profession × score
    (jobs, certs, tools, roadmap follow same shape)
  services/
    courses_ingestor.py           ← polls 8 catalogues, dedupes, persists
    profession_classifier.py      ← Gemini few-shot multi-label classifier
    (one ingestor per source-type follows same shape)
  routes/
    feed.py                       ← /api/news-ai/feed/<section>?profession=...&lang=...&n=...
```

**Honest empty states** at every layer:
- Source unreachable → log, persist last_error, return empty list — never fake an entry.
- Classifier unavailable (no LLM key) → items appear in feed un-tagged; profession filter shows fewer items, with a visible "classification offline" note. Never silently mis-tag.
- Translation unavailable → original-language title shown with a "translation unavailable" note. Never silently keep stale English.

---

## 8. Phase 0 — scope LOCKED 2026-05-29

**Goal:** prove the full pipeline end-to-end for **one profession × one
source-type** before scaling to 13 × 7.

**Pick:** `software-developer` × `courses`.

**Done when all 5 benchmark metrics pass** (else iterate; do **not**
advance to all professions until Sire approves the benchmark):

| Metric | Pass threshold |
|---|---|
| **Source coverage** | Ingested ≥ 100 courses from ≥ 6 of the 8 seeded providers |
| **Classification accuracy** | F1 ≥ 0.85 on a hand-labelled 50-course holdout set for `software-developer` |
| **Broken-link rate** | < 5 % of course URLs return non-2xx on HEAD probe |
| **Official-source share** | ≥ 80 % of courses come from the provider's own domain (`nptel.ac.in`, `learn.microsoft.com`, etc.), not third-party catalogues |
| **Free / paid labelling accuracy** | Spot-check 20 courses by hand; ≥ 90 % match the provider's declared price |

Benchmark report lives at
[`chitti-news-ai/PHASE_0_BENCHMARK.md`](chitti-news-ai/PHASE_0_BENCHMARK.md)
and is committed alongside Phase 0 code.

---

## 9. The four-user contract on every aggregator surface (unchanged from 0.1.x)

| User | How aggregator honours the contract |
|---|---|
| **Blind** | Profession strip auto-readable; every card has 🔊; voice-only end-to-end via Voice Factory cascade |
| **Deaf** | Every response has ISL panel; profession strip renders large with symbols |
| **Mute** | Every input text + dropdown; voice is optional |
| **Illiterate** | Emoji glyphs on every section + profession; voice-first onboarding; free-tier as colour-coded pill **with** word label, never colour alone |

---

## 10. Trust contract (extended for aggregator surfaces)

- **Every item carries a source URL.** No exception.
- **Provider name is shown next to every item.** Never hidden behind a
  "Chitti recommends" framing.
- **Free / Paid / Audit-mode labels are explicit** and pulled from the
  provider's own page — never inferred.
- **Last-verified timestamp** stored per item; stale items (> 30 days
  unverified) are flagged in the UI.
- **Classification source is shown** on tap-and-hold: "Classified as
  relevant to *Software Developer* by Gemini (confidence: 0.87)". Never
  hide the AI's hand.
- **Single-source items** tagged *"verify before sharing"* (Ground News
  pattern from 0.1.0 spec retained).
- **Sources < 60 trust score → rejected** (existing contract retained
  from 0.1.x; see [`skills/TRUST_VERIFICATION.md`](chitti-news-ai/skills/TRUST_VERIFICATION.md)).

---

## 11. Language contract (extended for aggregator surfaces)

- **No default profession.** Default is "Everyone" — content renders
  immediately, picker is optional.
- **No default language** (unchanged from 0.1.0).
- **Course / cert / job titles stay original** — `Machine Learning
  Specialization`, `AWS Cloud Practitioner`, `NPTEL Course Code
  CS6101` — never translated.
- **Provider names stay original** — `Microsoft Learn`, `NPTEL`,
  `Hugging Face` — never translated.
- **Descriptions / summaries / category labels translate** to user's
  chosen language.
- **No Hinglish** unless the user explicitly picks a mixed-language
  option (unchanged from 0.1.0).

Full contract:
[`chitti-news-ai/skills/LANGUAGE_BEHAVIOR.md`](chitti-news-ai/skills/LANGUAGE_BEHAVIOR.md).

---

## 12. Voice strategy (unchanged from 0.1.x)

Inherits the [LOCKED voice
strategy](SAHAYAI_MASTER.md#voice-strategy--locked): Bhashini is
temporary, Voice Factory 4-supplier cascade, swappable at one URL.

---

## 13. Self-ping & continuity (unchanged from 0.1.x)

`chitti-news-ai-api` exposes `GET /health`. chitti-founder self-pings
every 4 min (§2e). LLM 5xx ×3 → fallback chain Claude → Gemini → cached
extractive summaries (no AI). Turso unreachable → honest 503 from
aggregator endpoints; the 4-tab base falls through to the locally-cached
SQLite as documented in the new direct-HTTPS shim
([[project-turso-direct-https-shim]]).

---

## 14. Build status snapshot (2026-05-29)

**Live (0.1.1, kept honest):**
- 4-tab base + per-article 🤖 explain via [`news_explain.py`](chitti-news-ai/backend/services/news_explain.py).
- 8 RSS news sources + 14 manually-curated static courses.
- 9 endpoints under `/api/news-ai/`.
- Direct-HTTPS Turso shim in place; production env vars still placeholder
  (`DATABASE_URL=PASTE_LIBSQL_URL_HERE`) — Phase 0 runs on local SQLite
  fallback until Sire pastes the real Turso URL into Railway.

**Phase 0 in flight (this commit):**
- `data/profession_registry.json` (13 seed professions, extensible).
- `data/courses_sources.json` (8 free providers — NPTEL, SWAYAM, Google
  AI, Microsoft Learn, AWS free, NVIDIA DLI free, fast.ai, MIT OCW).
- `models/courses_v2.py` + `models/profession_relevance.py`.
- `services/courses_ingestor.py` + `services/profession_classifier.py`.
- `GET /api/news-ai/feed/courses` route.
- Frontend untouched — per Sire's "no frontend until benchmark passes" rule.

**Stop conditions** before Phase 1 (all professions × all 7 streams):
- All 5 Phase-0 benchmarks pass.
- Sire approves the [`PHASE_0_BENCHMARK.md`](chitti-news-ai/PHASE_0_BENCHMARK.md) report.

---

## 15. What this Chitti will never do (extended from 0.1.x)

(0.1.x rules retained:)
- Recommend a paid tool as "best free".
- Endorse a specific vendor (rankings come from the public formula).
- Use a source below trust score 60.
- Default to a language. Pick. Always.
- Mix Hinglish unless asked.
- Capture camera by default.
- Auto-dial helplines.
- Ship a feature without a `COMING SOON` badge if it isn't fully wired.

(0.2.0 additions:)
- **Generate the substance of any aggregated item.** Course titles,
  cert costs, tool descriptions, job descriptions, scheme details — all
  come from the real source, verbatim. AI never invents them.
- **Hide the price.** Paid items are always shown with their honest
  price.
- **Hide the AI's hand.** Classifier confidence and provider attribution
  are always visible on tap-and-hold.
- **Block the door.** No onboarding modal. No required profession pick.
  Content renders first.
- **Surface stale data silently.** Items > 30 days unverified are
  flagged in the UI.

---

## 16. Where to find more

- [`README.md`](chitti-news-ai/README.md)
- [`CONTEXT.md`](chitti-news-ai/CONTEXT.md)
- [`SKILL.md`](chitti-news-ai/SKILL.md)
- [`ARCHITECTURE.md`](chitti-news-ai/ARCHITECTURE.md)
- [`API.md`](chitti-news-ai/API.md)
- [`skills/FEATURES.md`](chitti-news-ai/skills/FEATURES.md)
- [`PHASE_0_BENCHMARK.md`](chitti-news-ai/PHASE_0_BENCHMARK.md) — added by Phase 0 commit
- [`SAHAYAI_MASTER.md`](SAHAYAI_MASTER.md) — single source of truth for the
  whole platform.
