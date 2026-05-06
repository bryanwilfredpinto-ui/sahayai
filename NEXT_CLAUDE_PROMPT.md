# Onboarding prompt for the next Claude session

**Paste this at the start of any new Claude session that touches the Chitti codebase.**

---

You're picking up the Chitti project. Bryan Wilfred Pinto is the founder.

## 1. Read these FIRST (in order, before any code)

1. `C:\Users\DELL\.claude\projects\c--Users-DELL-sahayai-sahayai\memory\MEMORY.md` — auto-loaded. Index of every project rule + spec.
2. `CHITTI_TECHNICAL_MASTER_SPEC.md` (workspace root) — full Chitti Technical structure, built vs pending, build rules.
3. `CHITTI_MEDUPI_MASTER_SPEC.md` (workspace root) — full Chitti MedUPI v1.4 spec.
4. `chitti-shares/README.md` — backend phase history.

**No equivalent master-spec for Chitti Fundamentals exists yet. Bryan's original Fundamentals spec is in conversation history (Word-doc paste, 2026-05-05). If a session needs it, draft from `chitti_fundamentals.html` + the existing memory entries.**

## 2. Product layout

```
Chitti (parent brand) at sahayai.in
├── Chitti Shares
│   ├── Chitti Technical    →  sahayai.in/chitti_complete_technical.html
│   └── Chitti Fundamentals →  sahayai.in/chitti_fundamentals.html
└── Chitti MedUPI           →  sahayai.in/chitti_medupi.html
```

Backend (FastAPI on Render): `chitti-shares-api.onrender.com`
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
| Backend root | `chitti-shares/backend/` |
| Shares services | `services/technical.py`, `scanner.py`, `levels.py`, `intraday_candles.py`, `screener_client.py`, `news_client.py`, `fundamental_scanner.py`, `angel_client.py` |
| MedUPI services | `services/medupi_recognition.py`, `medupi_database.py`, `medupi_alternatives.py`, `medupi_risk.py`, `medupi_jan_aushadhi.py` |
| Routes (mounted in `main.py`) | `routes/technical.py`, `routes/stocks.py`, etc. |
| Master specs (workspace root) | `CHITTI_TECHNICAL_MASTER_SPEC.md`, `CHITTI_MEDUPI_MASTER_SPEC.md` |
| Backups | `backups/chitti_*_pre_bharat_2026-05-06.html` |

## 7. Live URLs to test

- Sites: `https://sahayai.in/chitti_complete_technical.html`, `/chitti_fundamentals.html`, `/chitti_medupi.html`
- Backend health: `https://chitti-shares-api.onrender.com/health`
- Sample endpoints: `/api/technical/NSE:RELIANCE`, `/api/fundamentals/NSE:RELIANCE`, `/api/news/market`, `/api/fundamental-scan?universe=nifty50&strategy=buffett`, `/api/medupi/alternatives?molecule=Paracetamol&strength=650mg&dosage_form=Tablet`, `/api/medupi/jan_aushadhi?lat=23.26&lng=77.41`

## 8. What's pending (in priority order)

**Chitti Technical** — manual drawing tools · watchlist + alerts · custom rule builder · Story Mode per signal · Confidence Dial · sector heatmap · multi-Indian-language audio.

**Chitti Fundamentals** — Tickertape composite scorecard scoring engine · Trendlyne DVM scoring · pros/cons auto-generator · SWOT auto-generator · DCF calculator · returns calculator · top-10 institutional holders + KMP wiring · earnings calendar live data · NSE/BSE shareholding scrape for ownership tab.

**Chitti MedUPI** (full pending list in `CHITTI_MEDUPI_MASTER_SPEC.md` §13) — NPPA price seed · Jan Aushadhi catalog seed · OCR pipeline · Anthropic composition extractor · `/api/medupi/scan` endpoint · camera-capture frontend · Family Wallet auth + multi-profile · Twilio phone-call reminders · Hindi audio for every disclaimer.

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
