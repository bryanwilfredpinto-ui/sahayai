# Chitti News — BENCHMARKS

This is the planned + ongoing comparison against the products we'd surpass.

---

## 1. Comparative benchmark vs Indian-news incumbents — REQUIRED, NOT YET RUN

### Methodology

- 5 fixed scenarios × 3 reader personas (Maharashtra-Marathi mother / Tamil retired teacher / Vidarbha farmer voice-only) = 15 cells × N-products
- Blind rubric:
  - **State-awareness** (1-5): does the user's state's news surface first?
  - **Vernacular completeness** (1-5): does picking Marathi/Tamil/Bengali yield ≥10 stories per category?
  - **Trust signal** (1-5): is a verification badge / fact-check verdict visible in <2s?
  - **Time-to-informed** (1-5): seconds from open to "I'm caught up"
  - **Doom-scroll resistance** (1-5): reading time visible? Cancelled folder? No autoplay?
  - **No-paywall** (1-5): does the answer stay free?

### Scenarios

1. *"Maharashtra political update today in Marathi"*
2. *"Tamil Nadu sports headlines, voice-only, in Tamil"*
3. *"PM-Kisan instalment news in Vidarbha-Marathi"*
4. *"Karnataka business news + Sensex update in Kannada"*
5. *"WhatsApp-forwarded political claim — is it true?"* (fact-check probe)

### Competitor matrix

| Competitor | What we compare |
|---|---|
| **MSN India** | English-first aggregator; their per-language depth |
| **DailyHunt** | Vernacular-first aggregator; their fact-check stance |
| **Inshorts** | 60-word card format; their language coverage |
| **Google News (India)** | Google's per-language depth + Discover feed |
| **NDTV / Times of India / The Hindu** | Direct publisher comparison |
| **Saamana / Lokmat / Eenadu / The Hindu Tamil** | Per-language regional publisher direct |
| **AltNews / BoomLive** | Fact-check verdict speed + verdict trust |

### Output

`chitti-news/BENCHMARK_VS_INDUSTRY.md` — table with per-cell scores + screenshots.

### Pass criteria

To call ourselves world-class:
- Chitti's *State-awareness* score > every incumbent
- Chitti's *Vernacular completeness* score ≥ DailyHunt's
- Chitti's *Trust signal* score ≥ AltNews/BoomLive's
- Chitti's *Doom-scroll resistance* score = 5 (we have reading-time + Cancelled folder; they don't)
- Chitti's *No-paywall* score = 5

---

## 2. Coverage benchmark — partial

Per [QUALITY_STATUS.md 2026-06-02 PM section](../QUALITY_STATUS.md), after the language-coverage fix:

| Language | Sources |
|---|---|
| en | 53 ✅ |
| hi | 18 ✅ |
| ml | 11 ✅ |
| ta | 8 ✅ |
| te | 7 ✅ |
| pa | 7 ✅ |
| mr | 6 ⚠️ |
| or | 5 ⚠️ |
| bn | 5 ⚠️ |
| kn | 4 🔴 |
| ur | 3 🔴 |
| gu | 3 🔴 (app-API only; mitmproxy capture pending) |

**Target for SHIP:** ≥10 publishers per Indian-state-official-language.

---

## 3. Latency benchmark — REQUIRED

| Endpoint | Target | Status |
|---|---|---|
| `/health` | < 100 ms | ✅ |
| `/api/news/feed?state=X&language=Y&category=Z` p50 | < 300 ms | ❓ |
| `/api/news/feed` p95 | < 1 s | ❓ |
| Fact-check verdict latency (ingest → verdict) | p50 < 6 h | ❓ |
| Frontend first-paint on 2G | < 12 s | ❌ |

---

## 4. Trust benchmark — REQUIRED

| Metric | Target | Status |
|---|---|---|
| Per-card Trust Strip render-time | < 2 s | ⚠️ implemented; not timed |
| Fact-check verdict accuracy (vs human ground-truth 200-row dataset) | ≥ 0.85 F1 | ❌ dataset not built |
| Per-publisher trust score visible on every card | 100 % | ⚠️ scored but not consistently rendered |
| Honest empty state (coverage payload visible to user when feed thin) | 100 % | ✅ (verified live for mr) |

---

## What's still required

| Benchmark | Status |
|---|---|
| vs MSN India / DailyHunt / Inshorts / Google News India / NDTV / TOI / AltNews | ❌ NOT DONE |
| Per-language coverage to ≥10 publishers | ⚠️ en/hi/ml/ta/te/pa done; mr/or/bn/kn/ur/gu under target |
| Latency p50/p95 | ❌ NOT DONE |
| Fact-check verdict accuracy benchmark | ❌ dataset not built |
| Mobile cert (375 px) refresh post Trust Strip | ❌ NOT DONE |

---

**World Class Chitti News — Commando Discipline. Zero Excuses.**
