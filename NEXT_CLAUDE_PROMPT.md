# Onboarding prompt for the next Claude session

**Paste this at the start of any new Claude session that touches the Chitti codebase.**

---

You're picking up the Chitti project. Bryan Wilfred Pinto is the founder.

## 1. Read these FIRST (in order, before any code)

1. `C:\Users\DELL\.claude\projects\c--Users-DELL-sahayai-sahayai\memory\MEMORY.md` — auto-loaded. Index of every project rule + spec.
2. `CHITTI_TECHNICAL_MASTER_SPEC.md` (workspace root) — Chitti Technical.
3. `CHITTI_MEDUPI_MASTER_SPEC.md` (workspace root) — Chitti MedUPI v1.7.
4. `CHITTI_NEWS_MASTER_SPEC.md` (workspace root) — Chitti News v1.0.
5. `chitti-shares/README.md` — backend phase history.

**No equivalent master-spec for Chitti Fundamentals exists yet. Bryan's original Fundamentals spec is in conversation history (Word-doc paste, 2026-05-05). If a session needs it, draft from `chitti_fundamentals.html` + the existing memory entries.**

## 2. Product layout

```
Chitti (parent brand) at sahayai.in
├── Chitti Shares
│   ├── Chitti Technical    →  sahayai.in/chitti_complete_technical.html
│   └── Chitti Fundamentals →  sahayai.in/chitti_fundamentals.html
├── Chitti MedUPI           →  sahayai.in/chitti_medupi.html
└── Chitti News             →  sahayai.in/chitti_news.html
```

Backends on Render:
- `chitti-shares-api.onrender.com`     (FastAPI · Supabase · `shares.*` schema)
- `chitti-medupi-api.onrender.com`     (Flask · Supabase · `medupi.*` schema · also runs against Neon for the Apollo 211k-row local load)
- `chitti-news-api.onrender.com`       (Flask · Supabase · `news.*` schema · NOT YET DEPLOYED — `chitti-news/render.yaml` ready)

Frontend: GitHub Pages serves the workspace root.

## 3. Hard rules (non-negotiable — prior sessions wasted hours violating these)

1. **Yahoo Finance is BLOCKED from Render's IPs.** Use `screener.in` scrape for fundamentals (`services/screener_client.py`), Angel SmartAPI for prices/candles. `yahoo_client` kept only as local-dev fallback. Don't reach for it first.
2. **All Chitti pages share the Bharat Premium theme** — saffron `#E86A17` / navy `#0E2344` / gold `#D4AF37` / cream `#f8f4ee` background / white rounded 18px cards / navy gradient header / saffron CTAs. Defined as a CSS overlay at the end of each page's `<style>`. Don't reinvent.
3. **Four-user contract on every control:** Blind (aria-label + 🔊 speak), Deaf (▲▼ symbols + word labels — never colour alone), Mute (tap or dropdown — voice input is optional), Illiterate (🎤 mic next to text inputs + plain-English caption + Hindi UI toggle).
4. **Hindi UI toggle is page-wide.** `_chittiLang` in localStorage; `applyChittiLang()` walks `[data-i18n]` / `[data-i18n-aria]` / `[data-i18n-placeholder]`. Mark every visible string with `data-i18n="key"` + add to `I18N` dict.
5. **Sticky disclaimer banner at the top of every page** — never move to footer. SEBI for Chitti Shares, MEDICAL for Chitti MedUPI. Modal opens with full legal text. Both English + Hindi versions.
6. **Colours `rgba()` or `#RRGGBB` only.** Never 8-digit hex (LightweightCharts silently fails on those).
7. **`node --check` must pass** on the main `<script>` block of every HTML before commit. Extract the second `<script>` block (skip the inlined LightweightCharts in technical) and `node --check` it.
8. **Bryan deploys via Colab.** `origin/main` may be ahead of local because his Colab auto-pushed while you were editing. **Always `git fetch origin` first.** If `git rev-list --left-right --count main...origin/main` is not `0 0`, do NOT force-push. Cherry-pick recovery: backup local with `git branch main-backup-$(date +%F)`, `git reset --hard origin/main`, `git cherry-pick <local-shas>`, push.
9. **Never update git config globally.** For commits, use `git -c user.email="bryanderrylpinto@gmail.com" -c user.name="Bryan Wilfred Pinto" commit ...`.
10. **Never suggest paid services** beyond what's already wired (DeepSeek, Anthropic, Twilio for alerts). No Kite Connect, no Bloomberg, no Refinitiv. Free-tier only.
11. **Verify on the live URL before saying "live."** Curl the production endpoint, confirm 200 + non-empty body. Bryan should never be the one to find it broken.
12. **Skeleton-first pass must be exhaustive** when Bryan says "skeleton" or "shamelessly copy" — audit every reference app + ship the FULL feature surface in commit #1, with `Coming Soon` amber badges. Iterating to comprehensive over multiple turns wastes his time.
13. **Roshan rule** (Chitti Technical): RSI(14) > SMA(20) on TF1 AND TF2 + both candles green + pullback TF candle RED. Always `df.iloc[-2]` (last *closed* candle), never `iloc[-1]`.
14. **Chart timeframe lookbacks** (Chitti Technical): Monthly=730 / Weekly=365 / Daily=120 / 4H=60 / 1H=30 / 15min=10 / 5min=5 / 1min=2. Never 120 days for intraday.
15. **MedUPI matching engine is STRICT** — same molecule + same strength + same dosage form ONLY. NEVER therapeutic alternatives across molecules. EVER.

## 4. Communication style with Bryan

- Terse. Bryan ALL-CAPS when frustrated.
- Don't drip-feed — if he asks for a feature, ship the whole thing one shot.
- Don't ask for confirmation before building. He explicitly authorised "all commands without asking."
- One-liner status updates between tool calls. Long apologies are unwelcome.
- "Build, test, commit, push" — verify each step on production.
- Skeleton work uses Coming Soon amber badges. Never hide unbuilt features — show the slot.

## 5. Push workflow (every commit)

```bash
cd /path/to/sahayai

# 1. Sanity check
node -e "const fs=require('fs');const h=fs.readFileSync(FILE,'utf8');const m=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)];fs.writeFileSync('_c.js',m[m.length-1][1]);require('child_process').execSync('node --check _c.js')"

# 2. Fetch (don't skip — Bryan's Colab may have pushed)
git fetch origin

# 3. If diverged, cherry-pick recovery
git rev-list --left-right --count main...origin/main      # not 0 0?
git branch main-backup-$(date +%F)                        # safety net
git reset --hard origin/main                              # pick up Colab's work
git cherry-pick <local-shas>                              # re-apply your edits

# 4. Add + commit + push
git add <only-the-files-you-touched>
git -c user.email="bryanderrylpinto@gmail.com" -c user.name="Bryan Wilfred Pinto" commit -m "..."
git push origin main

# 5. Verify live (~60s after push)
curl -sS "https://sahayai.in/<page>.html" | grep -c "<your-new-feature>"
curl -sS "https://chitti-shares-api.onrender.com/<your-new-endpoint>" | head -c 400
```

## 6. Where work lives

| Layer | Path |
|---|---|
| Frontend (Technical) | `chitti_complete_technical.html` |
| Frontend (Fundamentals) | `chitti_fundamentals.html` |
| Frontend (MedUPI) | `chitti_medupi.html` |
| Frontend (News) | `chitti_news.html` |
| Backend (Shares) | `chitti-shares/backend/` (FastAPI · `shares.*` schema) |
| Backend (MedUPI) | `chitti-medupi/backend/` (Flask · `medupi.*` schema) |
| Backend (News) | `chitti-news/backend/` (Flask · `news.*` schema) |
| Shares services | `services/technical.py`, `scanner.py`, `levels.py`, `intraday_candles.py`, `screener_client.py`, `news_client.py`, `fundamental_scanner.py`, `angel_client.py` |
| MedUPI services | `services/medupi_recognition.py`, `medupi_database.py`, `medupi_alternatives.py`, `medupi_risk.py`, `medupi_jan_aushadhi.py`, `medupi_brave_search.py`, `medupi_community.py`, `medupi_scheduler.py` |
| News services | `services/news_seed.py`, `news_db.py`, `news_ingest.py`, `news_summary.py`, `news_factcheck.py`, `news_scheduler.py` |
| News loaders | `chitti-news/backend/data/sources.json` (26 RSS feeds) · `articles_seed.json` (welcome seed) |
| MedUPI loaders | `chitti-medupi/backend/scripts/load_apollo_oneshot.py` + `scripts/loaders/{jan_aushadhi,bppi_products,nppa,cdsco,kaggle,rxnorm,openfda}.py` |
| Sub-agent skills (News) | `chitti-news/skills/chitti-news-{summarizer,factcheck,politics,sports,business,tech,entertainment}/SKILL.md` |
| Master specs (workspace root) | `CHITTI_TECHNICAL_MASTER_SPEC.md`, `CHITTI_MEDUPI_MASTER_SPEC.md`, `CHITTI_NEWS_MASTER_SPEC.md` |
| Backups | `backups/chitti_*_pre_bharat_2026-05-06.html` |

## 7. Live URLs to test

- Sites: `/chitti_complete_technical.html`, `/chitti_fundamentals.html`, `/chitti_medupi.html`, `/chitti_news.html` (all under `https://sahayai.in/`)
- Backend health endpoints:
  - `https://chitti-shares-api.onrender.com/health`
  - `https://chitti-medupi-api.onrender.com/health`
  - `https://chitti-news-api.onrender.com/health` (after deploy)
- Sample endpoints:
  - Shares: `/api/technical/NSE:RELIANCE`, `/api/fundamentals/NSE:RELIANCE`, `/api/news/market`, `/api/fundamental-scan?universe=nifty50&strategy=buffett`
  - MedUPI: `/api/medupi/medicine/Crocin%20650`, `/api/medupi/alternatives?molecule=Paracetamol&strength=650mg&dosage_form=Tablet`, `/api/medupi/jan_aushadhi?lat=23.26&lng=77.41`, `/api/medupi/scheduler/status`
  - News: `/api/news/india/en/national`, `/api/news/india/hi/business`, `/api/news/article/1/take?language=hi`, `/api/news/article/1/factcheck`, `/api/news/breaking?state=india&language=en`

## 8. What's pending (in priority order)

**Cross-cutting / urgent**
1. **Deploy `chitti-news/backend`** to Render — `render.yaml` ready, paste DATABASE_URL (same Supabase URL the others use) + ANTHROPIC_API_KEY.
2. **Apollo data is in Neon, live MedUPI API queries Supabase.** Decide: switch chitti-medupi-api's DATABASE_URL to Neon, OR re-run the Apollo loader against Supabase. (211,207 rows in `medupi.medicines` on Neon today.)
3. **Three Supabase passwords leaked in transcripts** (`SahayAI2026`, `Sahay2026`, `7cF7KW9u9muQg96N`) + Neon password (`npg_nqDgROxuE1i4`) — rotate when convenient and don't paste the new ones.
4. **Stale Windows User-level `DATABASE_URL`** — `[Environment]::SetEnvironmentVariable("DATABASE_URL", $null, "User")` to clean.

**Chitti Technical** — manual drawing tools · watchlist + alerts · custom rule builder · Story Mode per signal · Confidence Dial · sector heatmap · multi-Indian-language audio.

**Chitti Fundamentals** — Tickertape composite scorecard scoring engine · Trendlyne DVM scoring · pros/cons auto-generator · SWOT auto-generator · DCF calculator · returns calculator · top-10 institutional holders + KMP wiring · earnings calendar live data · NSE/BSE shareholding scrape for ownership tab.

**Chitti MedUPI** (full list in `CHITTI_MEDUPI_MASTER_SPEC.md` §13) — Run NPPA + BPPI products + JA stores + CDSCO loaders to fill prices on the 211k Apollo rows · browser push reminders (service worker) · WhatsApp + Twilio voice reminders · prescription decoder (multi-medicine Rx image) · Optimised Cart simulator · real Ayushman empanelled list · `rxcui` schema column.

**Chitti News** (full list in `CHITTI_NEWS_MASTER_SPEC.md` §12) — Backend Render deploy · live RSS poll verification · regional-language sources (Bangla / Telugu / Tamil / Odia HTML scraping in v1.1) · browser push notifications · topic following · user-feedback loop on Cancelled · daily digest email · citizen reporter submissions · cross-product handoff (e.g. medicine mention in news → Chitti MedUPI).

## 9. Open with this

```
Read MEMORY.md first, then the master specs at the workspace root,
then say "Ready" and wait for Bryan's instruction.
Don't volunteer plans. Don't ask multiple-choice questions.
Just build what he asks, verify on the live URL, push, report.
```

---

**Author:** Claude (drafted 2026-05-06).
**Update this file** when rules change.
