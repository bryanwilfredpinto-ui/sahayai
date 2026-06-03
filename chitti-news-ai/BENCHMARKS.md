# Chitti News AI — BENCHMARKS

> *"Never claim world-class without benchmarks."* — Sire, 2026-05-29

This is the planned + ongoing comparison against the products we said we'd surpass.

---

## 1. Internal benchmark (rules-only classifier — DONE)

See [PHASE_0_BENCHMARK.md](PHASE_0_BENCHMARK.md). Current state: 12 / 13 professions PASS F1 ≥ 0.85.

---

## 2. Comparative benchmark vs industry — REQUIRED, NOT YET RUN

For each of the 5 north-star scenarios below, we will side-by-side compare Chitti News AI with the industry incumbents Sire named.

### Methodology

- 5 fixed scenarios per profession × 3 professions (Software Developer, Doctor, Farmer) = 15 scenario × N-products comparison cells
- For each cell, the products are queried with the SAME prompt or SAME profession filter
- Results scored on a blind rubric (rubric in `scripts/benchmark_rubric.json`):
  - **Specificity** (1-5): did the result cite a specific tool/course/cert/job, or a generic "AI is changing X"?
  - **Trustability** (1-5): is the source clear, attributed, and free?
  - **Vernacular fitness** (1-5): can a Hindi/Marathi/Tamil reader use this directly?
  - **Time-to-useful-answer** (1-5): seconds from open to actionable item
  - **No-paywall** (1-5): does the answer stay free?
- Tied results break ties by Trustability.

### Scenarios

1. *"What free AI cert should an Indian developer pursue right now?"*
2. *"Latest LLM tooling for production deployment"*
3. *"What's the latest oncology AI guideline update (NCCN)?"*
4. *"PM-Kisan scheme update + precision agriculture training"*
5. *"Free Microsoft Azure cert for an Indian college student"*

### Competitor matrix

| Competitor | What we compare against | How we query |
|---|---|---|
| **Bloomberg** | Bloomberg Sector Brief — paid AI sector intel | manual: 5 scenarios; record response |
| **Coursera** | Coursera catalog search + Cert recommendation engine | manual + their public API |
| **Perplexity** | Perplexity Pro — AI-mediated career intel with citations | manual |
| **LinkedIn Learning** | LinkedIn Learning's catalog + AI Skill Reports | manual (where accessible without paywall) |
| **GitHub** | GitHub Trending + GitHub Skills | their public API |
| **Google News (AI vertical)** | Google News topic page + Discover | manual |
| **Inshorts** | Inshorts AI category | manual |
| **Naukri Learning** | Naukri's L&D recommendations | manual |

### Output

`chitti-news-ai/BENCHMARK_VS_INDUSTRY.md` — committed table with cell-by-cell scores, screenshots, and Chitti's response side-by-side.

### Pass criteria

To call ourselves world-class:
- Chitti's *Trustability* score ≥ Bloomberg's
- Chitti's *Vernacular fitness* score > every English-only competitor
- Chitti's *Specificity* score within 80 % of Coursera (we will not beat them on course catalog depth)
- Chitti's *Time-to-useful-answer* score ≥ Perplexity (we are simpler UI)
- Chitti's *No-paywall* score = 5 (we don't have one; they often do)

### Why this isn't done yet (honesty)

- Doing 15 cells × 7 competitors × screenshots is a 4-hour focused task.
- We've spent the build budget on getting the engine ready FOR the benchmark.
- This benchmark is the next gate before SHIP.md says GREEN.

---

## 3. Latency benchmark — REQUIRED

| Endpoint | Current p50 | Target | Method |
|---|---|---|---|
| `/health` | < 100 ms ✅ | < 100 ms | live curl |
| `/api/news-ai/feed/courses?profession=X&n=20` | ❓ | < 200 ms | k6 50 RPS |
| `/api/news-ai/feed/job?profession=X` (live RSS path) | ❓ | < 500 ms | k6 50 RPS |
| Cold-start to first /feed response | ~60 s ✅ | < 60 s | manual |
| Frontend first-paint on 4G | ❓ | < 3 s | WebPageTest |
| Frontend first-paint on 2G | ❓ | < 12 s | WebPageTest |

---

## 4. Storage / cost benchmark — REQUIRED

| Metric | Current | Target |
|---|---|---|
| Turso DB size at 10k items | ❓ | < 100 MB |
| Monthly Turso cost at 10k items | ❓ | $0 (Turso free tier ≤ 9 GB) |
| LLM cost per 1000 explain calls | ❓ | < $0.50 |
| Total monthly cost at 1k DAU | ❓ | < $10 |

---

## What's still required

| Benchmark | Status |
|---|---|
| Internal F1 per profession | ✅ DONE 12/13 |
| vs Bloomberg / Coursera / Perplexity / LinkedIn / GitHub / Google News / Inshorts / Naukri Learning | ❌ NOT DONE |
| Latency p50/p95 per endpoint | ❌ NOT DONE |
| Cold-start + first-paint timings | ⚠️ partial |
| Storage + cost projections | ❌ NOT DONE |
| Mobile cert (375 px) — gate to SHIP | ❌ NOT DONE |

---

**World Class Chitti News AI — Commando Discipline. Zero Excuses.**
