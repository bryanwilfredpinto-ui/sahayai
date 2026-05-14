# CHITTI NEWS AI — PROJECT CONTEXT

Last touched: **2026-05-14** · Version **2.0**

This file is the working copy of the founder-authored CONTEXT for the Chitti
News AI product. It is paraphrased into this repo with the references to
`[citation:N]` removed (those were research artefacts, not source links). The
substance below is the contract — anything that disagrees with the founder's
PDF, the PDF wins; update this file rather than the PDF.

---

## 1. Project overview

Chitti News AI is a **free AI tool and news discovery assistant**. It tracks
AI tool launches, model releases, pricing changes, and free tier updates
using **only free data sources**. It delivers personalised recommendations
based on the user's self-described profession — with **no hardcoded
categories**.

All output is in the user's selected language. **No language is hardcoded as
default.**

---

## 2. Agent persona

- **Name** — Chitti News AI
- **Role** — Personal AI tool scout. Finds free tools relevant to YOUR work.
- **Tone** — Informative, neutral, no hype, no affiliate links.
- **Core principle** — *"I am a tool tracker. Rankings are dynamic. Always
  check official sites."*

Identity full text lives in [`skills/IDENTITY.md`](skills/IDENTITY.md). Tone
and refusal contract live in [`skills/GUARDRAILS.md`](skills/GUARDRAILS.md).

---

## 3. Language behaviour — CRITICAL

Chitti **never assumes a default language**.

- The user selects their language in the interface (26 languages — see
  [Voice Factory §2 cascade][vf-cascade]).
- Chitti responds **only** in that selected language.
- **No Hinglish mixing** unless the user explicitly selects a mixed-language
  option.
- All tool names, technical terms (`LLM`, `API`, `model name`, etc.) and
  URLs remain in original form — not translated.

Strict rules and examples in
[`skills/LANGUAGE_BEHAVIOR.md`](skills/LANGUAGE_BEHAVIOR.md).

---

## 4. Data sources — all free

### RSS seed (verified, Layer 1 pre-approved)

**Official AI company blogs**

| Source | URL |
|---|---|
| OpenAI Blog | `openai.com/news/rss.xml` |
| Anthropic Blog | `anthropic.com/news/rss.xml` |
| Google AI Blog | `ai.googleblog.com/feeds/posts/default` |
| DeepMind Blog | `deepmind.com/blog/feed/basic` |
| Hugging Face Blog | `huggingface.co/blog/feed.xml` |
| Meta AI Blog | `ai.meta.com/blog/feed` |
| Microsoft AI Blog | `blogs.microsoft.com/ai/feed` |
| NVIDIA Blog | `blogs.nvidia.com/feed` |

**Tech news (AI-focused)**

| Source | URL |
|---|---|
| TechCrunch AI | `techcrunch.com/tag/artificial-intelligence/feed` |
| The Gradient | `thegradient.pub/feed` |
| MIT Tech Review AI | `technologyreview.com/tag/artificial-intelligence/feed` |

**Community sources (scraped, no API key)**

| Source | Mode |
|---|---|
| GitHub Trending (AI) | HTML scrape |
| Hugging Face new models | RSS |
| Hacker News (AI-filtered) | `news.ycombinator.com/rss` |
| Reddit `r/LocalLLaMA`, `r/MachineLearning` | `reddit.com/r/<sub>/.rss` |

### Discovering new free sources

Chitti actively searches for new sources every 7 days via:

1. GitHub curated repositories of free AI resources.
2. Community-driven RSS feed lists.
3. Cross-referencing existing approved sources' blogrolls / outbound links.
4. User submissions (verified before adding — see Layer 1).

Reference for continuous discovery — the "Free AI Bible" repository tracks
700+ free AI APIs and tools. FeedMind demonstrates AI-powered RSS briefing.

Full discovery contract lives in
[`skills/SOURCE_DISCOVERY.md`](skills/SOURCE_DISCOVERY.md).

---

## 5. Fake site avoidance — how Chitti stays safe

Multi-layer verification. Every source ships with a recomputed trust score.

### Layer 1 — Source pre-approval (run once per source)

| Check | What Chitti does | Red flag |
|---|---|---|
| Domain age | WHOIS lookup | < 6 months for a "news" site |
| Author presence | Named bylines, real profiles | No authors / `Posted by` only |
| About Us page | Address, team, editorial policy | Generic / fake addresses (e.g. `1234 Broad Street`) |
| Ad density | Ad-to-content ratio | Ads overwhelm content |
| Language quality | Tone analysis | Overly dramatic, robotic, verbose |
| Correction policy | Published corrections | No correction mechanism |

### Layer 2 — Ongoing monitoring

| Monitor | Frequency | Action on failure |
|---|---|---|
| Cross-source consistency | Every fetch | Flag if repeatedly contradicts ≥ 2 other sources |
| Fact-check vs trusted refs | Weekly | Downgrade trust score on false claim |
| AI crawling status | Monthly | Respect `robots.txt` and licensing blocks |

### Layer 3 — LLM response-time verification

For every response that includes news or claims:

- Every claim cites a source.
- Verified against 2+ reputable sources.
- Dates checked (current vs recycled).
- Language is neutral, fact-based — no emotional manipulation.
- Multiple perspectives — not one-sided.

### Layer 4 — Trust score (0–100)

| Factor | Weight |
|---|---|
| Historical accuracy | 40% |
| Correction responsiveness | 20% |
| Author transparency | 15% |
| Ad ratio | 10% |
| Age / established | 10% |
| AI licensing status | 5% |

| Band | Meaning |
|---|---|
| 80–100 | ✅ Trusted — use freely |
| 70–79 | ⚠️ Acceptable — use with caution, verify claims |
| 60–69 | 🟡 Questionable — corroborate before use |
| < 60 | ❌ Reject |

Full verification logic in
[`skills/TRUST_VERIFICATION.md`](skills/TRUST_VERIFICATION.md).

---

## 6. Automated pipeline

```
EVERY 6 HOURS (cron)
  Fetch RSS (17+ feeds)
    → Trust score check
    → LLM score (importance 0–100)
    → Detect new tools
    → Extract topics (DeepSeek, no hardcoded list)
    → Store in Turso

ON USER QUERY
  Extract topics from profession (DeepSeek)
    → Search DB for matching tools / news
    → Rank by relevance formula
    → Render in user's selected language
```

Pipeline implementation lives in `backend/services/` —
`rss_fetcher.py` → `trust_scorer.py` → `topic_extractor.py` → `scorer.py` →
`ranker.py`.

---

## 7. Ranking formula

```
Relevance = (Keyword Overlap × 0.4)
          + (Community Signal × 0.3)
          + (Freshness × 0.2)
          + (Free Generosity × 0.1)
```

| Term | Definition |
|---|---|
| Keyword overlap | % of user-extracted topics appearing in tool description |
| Community signal | GitHub stars + HN upvotes + Reddit mentions (normalised 0–100) |
| Freshness | Days since launch (newer = higher, max 365) |
| Free generosity | 1 (very limited) → 10 (unlimited) |

Full derivation + worked examples in
[`skills/RANKING_FORMULA.md`](skills/RANKING_FORMULA.md). Importance scoring
(0–100, separate axis from relevance) in
[`skills/IMPORTANCE_SCORING.md`](skills/IMPORTANCE_SCORING.md).

---

## 8. Technical stack

| Layer | Technology |
|---|---|
| Backend | Flask (matches Chitti News + every other Chitti backend) |
| Database | Turso libSQL (embedded-replica pattern, §2 locked decision) |
| LLM | DeepSeek (`api.deepseek.com`, OpenAI-compatible) — scoring + topic extraction + summarisation |
| Voice | Chitti Voice Factory (26 langs, swappable supplier at `window.Chitti.a11y.VOICE_FACTORY_URL`) |
| Scheduling | APScheduler (in-process) + Render free-tier cron |
| RSS | `feedparser` + `requests` |
| Scraping | `BeautifulSoup` + `requests` |
| Hosting | GitHub Pages (frontend) + Render free tier (backend) |

---

## 9. File structure

```
chitti-news-ai/
├── CONTEXT.md           (this file)
├── SKILL.md             (DeepSeek capability surface)
├── README.md
├── ARCHITECTURE.md
├── render.yaml
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── requirements.txt
│   ├── runtime.txt
│   ├── models/
│   │   ├── articles.py
│   │   ├── tools.py
│   │   ├── models.py
│   │   ├── sources.py
│   │   └── trust_scores.py
│   ├── routes/
│   │   ├── news.py
│   │   ├── tools.py
│   │   ├── languages.py
│   │   ├── trust.py
│   │   └── models.py
│   ├── services/
│   │   ├── rss_fetcher.py
│   │   ├── trust_scorer.py
│   │   ├── source_discovery.py
│   │   ├── scorer.py
│   │   ├── topic_extractor.py
│   │   └── ranker.py
│   └── data/
│       └── sources.json
└── skills/
    ├── FEATURES.md
    ├── IDENTITY.md
    ├── PERSONALITY.md
    ├── VALUES.md
    ├── GUARDRAILS.md
    ├── BOUNDARIES.md
    ├── DEVILS_ADVOCATE.md
    ├── TRUTH_SOURCES.md
    ├── LANGUAGE_BEHAVIOR.md
    ├── TRUST_VERIFICATION.md
    ├── SOURCE_DISCOVERY.md
    ├── RANKING_FORMULA.md
    ├── IMPORTANCE_SCORING.md
    ├── OBSERVABILITY.md
    └── SALES_BRIEF.md
```

---

## 10. Always remember

1. **User selects language** — Chitti never assumes or hardcodes a default.
2. **All news from free sources** — never recommend a paid source.
3. **No hardcoded professions** — rankings emerge from data.
4. **Verify sources before using** — apply the 4-layer trust system.
5. **Always cite sources** — every claim needs a source URL.
6. **Never trust a single source** — confirm against 2+.
7. **Respect AI crawling restrictions** — honour `robots.txt` and licensing.

---

## 11. Mandatory disclaimer

> *"I am an AI tool tracker. Rankings are dynamic and update every 6 hours.
> Pricing and free tiers may change. Always check official websites. I do not
> endorse any tool."*

Server-enforced (CA / Legal pattern, never client-controlled). Shown in the
user's selected language. Sticky bar at the top of the page, full modal
behind it.

[vf-cascade]: ../CHITTI_VOICE_FACTORY_MASTER_SPEC.md