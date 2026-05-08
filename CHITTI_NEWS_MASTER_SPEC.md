# CHITTI News — Master Specification

**Version:** 1.0 (initial build shipped)
**Date:** 2026-05-08
**Author:** Bryan Wilfred Pinto · drafted by Claude
**Status:** LIVING DOCUMENT — every Claude session that touches Chitti News must read this first.

> "Your state. Your language. Your news. Read aloud, fact-checked, and one-tap shareable."

---

## 0. Where this product sits

```
Chitti (parent brand at sahayai.in)
├── Chitti Shares
│   ├── Chitti Technical    (chitti_complete_technical.html)
│   └── Chitti Fundamentals (chitti_fundamentals.html)
├── Chitti MedUPI           (chitti_medupi.html)
└── Chitti News             (chitti_news.html)         ← THIS PRODUCT
```

Sibling product file at the workspace root. Same Bharat Premium theme.
Same Flask backend pattern under `chitti-news/backend/`. Same four-user
contract. Same `news.*` schema isolation alongside `medupi.*` and `shares.*`.

---

## 1. Product Overview

| Field | Value |
|---|---|
| **Product Name** | Chitti News |
| **Tagline** | "Your state · Your language · Your news" |
| **Category** | State-aware multi-language Indian news aggregator |
| **Mission** | Deliver the news every Indian needs, in the language they think in, with the context to trust it. |
| **Target users** | Tier-2/3 city families, vernacular-language readers, elderly + low-literacy users (audio-first), professionals tracking business + tech, anyone exhausted by paywall-loaded English news. |
| **Live URL** | `https://sahayai.in/chitti_news.html` |
| **Backend** | `https://chitti-news-api.onrender.com` (planned — `render.yaml` ready) |

**Positioning:**
- ✅ IS an aggregator + AI summariser + cross-source fact-checker.
- ❌ NOT a publisher. We never write news. We deliver others' RSS feeds.

---

## 2. Reference apps surveyed (build to copy + improve)

### 2.1 NewsBreak (US)
**Strengths copied:** hyperlocal feel · community feedback loop.
**Improved:** state+language is the FIRST interaction, not a sub-menu.

### 2.2 SmartNews (Japan)
**Strengths copied:** clean cards · swipe interaction.
**Improved:** + AI Take per article (CNA's FAST pattern).

### 2.3 Dailyhunt (India)
**Strengths copied:** 14+ Indian languages · vernacular-first.
**Improved:** + 8-language TTS read-aloud (most aggregators are read-only).

### 2.4 Dainik Bhaskar (India)
**Strengths copied:** Hindi-first feel.
**Improved:** + Hindi voice for TTS, not just text translation.

### 2.5 Way2News (India)
**Strengths copied:** short-form discipline.
**Improved:** + 3-bullet AI Take enforces brevity by structure, not just length.

### 2.6 CNA Singapore
**Strengths copied:** FAST button — AI summary with human review.
**Improved:** factcheck verdict in the same panel.

### 2.7 Moneycontrol (India)
**Strengths copied:** business depth · 44.86M MAU.
**Improved:** dedicated business sub-agent with strict unit-citation rules.

### 2.8 What none of them does well — Chitti News's edge

| Gap | Chitti's edge |
|---|---|
| None ENFORCES neutrality on political news | Chitti has hard guardrails per category (no labels, no opinion verbs, equal coverage) |
| None lets you DISMISS articles you don't want (only "save") | Cancelled folder — explicit "I don't want this" signal, separate from saved |
| None reads news ALOUD in 8 Indian languages | Browser SpeechSynthesis wired with `_LANG_CODE` map |
| None shows fact-check verdicts visibly | 4-tier verdict (✅/🟡/⚠️/❔) with source count + rationale on every article |
| None separates "Chitti's Take" from the source's own summary | Take is always Anthropic-generated 3 bullets, never the RSS blurb |
| None has per-category sub-agents with their own context | 7 SKILL.md files: summarizer, factcheck, politics, sports, business, tech, entertainment |

---

## 3. Input Channels

1. **State + Language picker** on first launch (modal) — persistent in `localStorage`
2. **Sticky picker bar** with state + language dropdowns + 🔄 Refresh
3. **8-tab category nav** — National · State · Business · Tech · Sports · Entertainment · ⭐ Read Later · 🗑️ Cancelled
4. **Per-article actions** — ✨ Take · 🛡️ Fact Check · 🔊 Read aloud · ⭐ Save · 🗑️ Cancel · 📤 Share · ↗ Open source

---

## 4. Core Pipeline

```
[RSS feeds: 26 sources × 4 categories × 2 languages]
      ↓
[news_scheduler.py]   ← APScheduler · rss_poll every 30 min · daily_breaking 06:00 IST
      ↓
[news_ingest.py]       ← feedparser · per-source · idempotent on link · 50 entries/feed cap
      ↓
[news.articles]        ← Postgres news.* schema (Supabase shared)
      ↓
[news_db.feed]         ← state × language × category filter · breaking-first · importance-weighted
      ↓
[GET /api/news/<state>/<lang>/<category>]
      ↓
[card feed in chitti_news.html]
      ↓
   On user tap:
     ✨ Take   → news_summary.py (Anthropic 3-bullet · falls back to RSS summary)
     🛡️ Fact   → news_factcheck.py (rapidfuzz cross-source, 6h cache, 4-tier verdict)
     ⭐ Save   → news.read_later (folder='saved')
     🗑️ Cancel → news.read_later (folder='cancelled')
     📤 Share  → navigator.share OR WhatsApp deep link with disclaimer
     🔊 Read   → SpeechSynthesis in `_LANG_CODE` for picked language
```

**Sample API response** (`GET /api/news/india/en/national`):

```json
{
  "items": [
    {
      "id": 42,
      "title": "Indian markets close higher amid IT rally",
      "link": "https://...",
      "summary": "Sensex gained 412 points...",
      "source_slug": "moneycontrol",
      "source_name": "Moneycontrol · Markets",
      "image_url": "https://...",
      "state": "india",
      "language": "en",
      "category": "business",
      "is_breaking": false,
      "importance": 6,
      "published_at": "2026-05-08T11:30:00",
      "fetched_at": "2026-05-08T11:35:12"
    }
  ],
  "count": 1,
  "speak_en": "1 business stories from India.",
  "speak_hi": "India से 1 business खबरें।",
  "disclaimer_en": "Chitti News aggregates headlines from public RSS feeds...",
  "disclaimer_hi": "चिट्टी न्यूज़ सार्वजनिक RSS फ़ीड से शीर्षक एकत्र करता है..."
}
```

---

## 5. Fact-Check Verdicts (non-negotiable rendering)

| Verdict | Symbol | Color | Meaning |
|---|---|---|---|
| `verified` | ✅ | green | ≥3 distinct trusted sources agree on the headline + key facts |
| `partial` | 🟡 | amber | 2 sources cover it; broad facts match, details differ |
| `disputed` | ⚠️ | red | 1 other source found, headline diverges or contradicts |
| `unverified` | ❔ | muted | No cross-source signal yet (single-source — could be hyperlocal or just-breaking) |

**Critical:** "verified" is NOT a truth claim — it's a "many outlets are saying this" claim. Every fact-check panel must render with the disclaimer "verify on the original source link before sharing".

---

## 6. Editorial Guardrails (per-category — non-negotiable)

Defined in `chitti-news/skills/chitti-news-{category}/SKILL.md`. Summary:

- **Politics**: no labels (right-wing/left-wing/communal/secular), no opinion verbs (slammed/lashed-out), equal coverage across parties, no predictions, election-period extra care.
- **Sports**: cricket-first hierarchy, scoreboard format, no controversy framing, no salary speculation, defer live-scores to ESPN Cricinfo.
- **Business**: always cite the unit (₹500 cr / 11.4% YoY), never recommend buy/sell, defer to Chitti Shares for investment analysis.
- **Tech**: AI/Indian-startups focus, no fanboy tone, no "AI will replace [job]" speculation without sourced quote, neutral on crypto.
- **Entertainment**: tasteful celebration of artistic achievement, no paparazzi framing, no personal-life speculation, source-cited box-office figures only.

---

## 7. Legal & Compliance

### Chitti News MUST NEVER:
- ❌ Re-publish full article text (we only show the RSS-provided summary)
- ❌ Strip the source attribution (every card shows source name + a link to the original)
- ❌ Misrepresent a fact-check verdict ("verified" = sources agree, NOT = factually correct)
- ❌ Sell or share user's reading history

### Always renders:
- ✅ Source name + link on every article card
- ✅ Verify-with-source disclaimer in feed response (`disclaimer_en` + `disclaimer_hi`)
- ✅ "Shared via Chitti News. Verify on the original source." appended to every WhatsApp share

---

## 8. Disclaimer text (verbatim)

### 8.1 Feed disclaimer (always returned in `disclaimer_*`)
> Chitti News aggregates headlines from public RSS feeds. We do not write the news — we deliver it. Verify with the source link before sharing.

### 8.2 Hindi version
> चिट्टी न्यूज़ सार्वजनिक RSS फ़ीड से शीर्षक एकत्र करता है। हम खबरें नहीं लिखते — हम पहुँचाते हैं। शेयर करने से पहले मूल स्रोत पर पुष्टि करें।

### 8.3 WhatsApp share footer (auto-appended)
> — Shared via Chitti News. Verify on the original source before sharing further.
> — चिट्टी न्यूज़ के माध्यम से। मूल स्रोत पर पुष्टि करें।

---

## 9. Complete Feature List

### Core (✅ DONE — v1.0)
- 📍 State + Language picker on first launch (persistent)
- 🇮🇳 26 RSS sources across 5 states + national, English + Hindi, 6 categories
- ⏱️ Hourly RSS polling (configurable: `RSS_POLL_MINUTES`)
- 📰 Card feed with image · time-ago · source · summary
- ✨ Chitti's Take (Anthropic 3-bullet AI summary with RSS-summary fallback)
- 🛡️ Fact Check Agent (rapidfuzz cross-source, 6h cache, 4-tier verdict)
- 🔊 Read Aloud in 8 Indian languages
- ⭐ Read Later folder
- 🗑️ Cancelled folder
- 📤 WhatsApp / native share with auto-disclaimer
- 🚨 Breaking news ribbon (≥3 sources agree → red banner, dismissable)
- 🌐 Hindi UI toggle (covers every visible string)
- 🎬 Demo Mode — 6-step guided walk-through, EN/HI narration
- 4-user contract: Blind / Deaf / Mute / Illiterate

### Pending (next session priority order)
1. **Deploy backend** to Render (`chitti-news-api.onrender.com`) — `render.yaml` ready, paste DATABASE_URL + ANTHROPIC_API_KEY, click deploy.
2. **First RSS poll verification** — after deploy, curl `/api/news/india/en/national` should return ≥10 real articles within 30 min.
3. **Regional language sources** — Bangla / Telugu / Tamil / Odia outlets mostly don't publish public RSS. Plan: HTML scraping or app-API integration in v1.1.
4. **Browser push notifications** for breaking news — service worker + Notification API.
5. **WhatsApp Business API** for breaking-news subscription (opt-in).
6. **User feedback loop** — thumbs up/down on Cancelled articles to learn preferences.
7. **Per-source preferences** — let users mute / pin specific outlets.
8. **Topic following** — instead of just category, allow following keywords (e.g. "Modi", "RBI", "ISRO").
9. **Audio-first mode** — hands-free playback queue for commute / cooking listeners.
10. **Citizen reporter submissions** (NewsBreak-style) — user can submit hyperlocal news with photos, moderated before publish.
11. **Cross-product sharing** — "this medicine news article from Chitti News mentions a generic — open in Chitti MedUPI".
12. **Newsletter digest** — daily 6 AM email with the top 5 stories from user's state in their language.

### Out of scope (intentionally NOT building)
- ❌ Original reporting / journalism (we are an aggregator)
- ❌ Paywalled / login-walled content (only public RSS)
- ❌ Comments / community discussions on articles (out of scope for v1)
- ❌ Selling user attention / behavioural targeting (privacy-first)
- ❌ Live video / TV streaming

---

## 10. Architecture

### 10.1 Frontend (`chitti_news.html` · 789 lines · mirror at `chitti-news/frontend/index.html`)

Single-file HTML SPA at workspace root (matches the pattern of every other Chitti page). Bharat Premium theme + Hindi UI toggle + four-user contract baked in from line 1.

**Tab structure (8 tabs):**

```
[🇮🇳 National] [📍 State] [💼 Business] [💡 Tech] [🏏 Sports] [🎬 Entertainment] [⭐ Read Later] [🗑️ Cancelled]
```

Plus header:
- Bharat C logo + "Chitti News" + tagline
- Switch buttons: 📈 Technical · 📋 Fundamentals · 💊 MedUPI
- EN / हिं language toggle
- 🎬 Demo Mode · 🔊 Read page · 🌐 Change state/language · ↑ Top

Plus sticky picker bar (state + language + refresh) and breaking-news ribbon.

### 10.2 Backend (`chitti-news/backend/`)

```
chitti-news/backend/
├── main.py                     Flask app · CORS · startup hooks · 5 error handlers
├── config.py                   Settings (DATABASE_URL · ANTHROPIC_API_KEY · CORS · scheduler)
├── database.py                 SQLAlchemy + ensure_schema('news')
├── requirements.txt            flask · feedparser · sqlalchemy · anthropic · rapidfuzz · apscheduler
├── runtime.txt + .python-version  → Python 3.11
├── render.yaml                 Render Blueprint
├── data/
│   ├── sources.json            26 RSS feeds (national + 4 state slices × 6 categories × 2 languages)
│   └── articles_seed.json      6-row welcome seed (EN + HI)
├── models/
│   ├── _schema.py              SCHEMA = 'news' on Postgres / None on SQLite
│   ├── article.py              brand · title · link · summary · state · language · category · published_at
│   ├── source.py               slug · rss_url · state · language · category · enabled · last_fetched_at
│   ├── read_later.py           user_token · article_id · folder ('saved' | 'cancelled')
│   ├── breaking_alert.py       headline · article_id · sources_count · expires_at
│   └── fact_check.py           article_id · verdict · confidence · matched_sources · rationale_en/hi
├── services/
│   ├── news_seed.py            seed_sources_if_empty() + seed_articles_if_empty() — JSON loaders
│   ├── news_db.py              feed() · list_breaking() · get_article() · list_sources()
│   ├── news_ingest.py          feedparser-based RSS poller · per-source · idempotent on link
│   ├── news_summary.py         Chitti's Take — Anthropic 3-bullet · RSS-summary fallback
│   ├── news_factcheck.py       Cross-source verification · rapidfuzz title-similarity · 6h cache
│   └── news_scheduler.py       APScheduler · rss_poll every 30 min · daily_breaking 06:00 IST
└── routes/
    └── news.py                 Flask Blueprint /api/news/* (13 endpoints)
```

### 10.3 Endpoint surface

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Lightweight check |
| GET | `/api/news/feed?state=&language=&category=&limit=` | Main feed |
| GET | `/api/news/<state>/<language>/<category>` | Pretty alias |
| GET | `/api/news/breaking?state=&language=` | Active breaking-news alerts |
| GET | `/api/news/article/<id>` | Single article |
| GET | `/api/news/article/<id>/take?language=` | Chitti's Take |
| GET/POST | `/api/news/article/<id>/factcheck` | Verdict (cached 6h) |
| GET | `/api/news/sources?state=&language=` | Source registry slice |
| POST | `/api/news/save` | Add to saved/cancelled folder (X-User-Token) |
| GET | `/api/news/save?folder=` | List a folder |
| DELETE | `/api/news/save/<entry_id>` | Remove from folder |
| GET | `/api/news/scheduler/status` | Diagnostic |
| POST | `/api/news/scheduler/trigger/<job_id>` | Force-run a scheduler job |

### 10.4 Database schema

```
news.articles(
  id, title, title_hash, link UNIQUE, summary, content,
  source_slug, source_name, source_url, image_url, author,
  state, language, category, is_breaking, sentiment, importance,
  published_at, fetched_at
)
news.sources(
  id, slug, display_name, rss_url, homepage_url,
  state, language, category, enabled, last_fetched_at, last_error
)
news.read_later(
  id, user_token, article_id FK→articles, folder, note, added_at
)
news.breaking_alerts(
  id, headline, article_id FK→articles, state, language,
  sources_count, expires_at, created_at
)
news.fact_checks(
  id, article_id FK→articles UNIQUE, verdict, confidence,
  matched_sources, rationale, rationale_hi, checked_at
)
```

### 10.5 Sub-agent skill files (`chitti-news/skills/`)

| Sub-agent | Purpose |
|---|---|
| `chitti-news/SKILL.md` | Top-level product overview |
| `chitti-news-summarizer/SKILL.md` | Chitti's Take format rules |
| `chitti-news-factcheck/SKILL.md` | Cross-source verification algorithm |
| `chitti-news-politics/SKILL.md` | Hard neutrality guardrails |
| `chitti-news-sports/SKILL.md` | Cricket-first, scoreboard format |
| `chitti-news-business/SKILL.md` | Unit-citation rules, no buy/sell advice |
| `chitti-news-tech/SKILL.md` | AI/startups focus, no fanboy tone |
| `chitti-news-entertainment/SKILL.md` | Tasteful, no paparazzi |

For runtime in Claude Code, copy these to `~/.claude/skills/` (the tracked
copies under `chitti-news/skills/` are the source of truth; `.claude/` is
gitignored at the repo root).

---

## 11. Trust, UX & Design Guidelines

- **Tone:** Friendly Chitti — informed, calm, never alarmist
- **Design:** Clean cards · Bharat Premium theme (saffron #E86A17 / navy #0E2344 / gold #D4AF37 / cream #f8f4ee)
- **Speed:** First Contentful Paint < 1.5s on 4G; feed renders before article images load
- **Privacy:** No tracking pixels, no third-party analytics, no behavioural targeting
- **Accessibility:** Every control aria-labelled, every result speakable, every state visible without colour alone

---

## 12. Build Status (this session — 2026-05-08)

### ✅ DONE — v1.0 first-shipping commit
- **`CHITTI_NEWS_MASTER_SPEC.md`** at workspace root (this file) + on GitHub main
- **`chitti_news.html`** — 789-line single-file SPA at workspace root + mirror at `chitti-news/frontend/index.html`
- **Backend** — full Flask service (19 Python files): main.py + config + database + 5 models + 6 services + 13-endpoint Blueprint
- **Source registry** — `data/sources.json` with 26 RSS feeds: TOI / The Hindu / NDTV / Moneycontrol / Deccan Herald / Deccan Chronicle / HT / News18 / Bhaskar / Jagran / NDTV-Hindi
- **Articles seed** — `data/articles_seed.json` with 6-row welcome content (EN + HI)
- **Sub-agent SKILL.md files** — 8 files under `chitti-news/skills/` (top-level + summarizer + factcheck + 5 categories with strict editorial guardrails)
- **Schema isolation** — `news.*` schema alongside `medupi.*` and `shares.*`. `database.ensure_schema()` runs on startup.
- **APScheduler** wired with two cron jobs (rss_poll · daily_breaking)
- **Demo Mode** — 6-step guided tour with EN/HI narration
- **Hindi UI toggle** — every visible string covered via `data-i18n` + I18N dict
- **First-launch onboarding modal** — state + language picker, persistent in localStorage
- **Read Later + Cancelled folders** with X-User-Token light auth
- **Smoke tests** — 19 Python files parse via `ast.parse`; 26 sources + 6 articles JSON-valid; 517 lines of inline JS pass `node --check`

### ⏳ PENDING (next session priority order)
1. **Deploy `chitti-news/backend`** to Render as `chitti-news-api.onrender.com` — `render.yaml` is ready. Paste DATABASE_URL (same Supabase URL the others use) + ANTHROPIC_API_KEY (same key). After deploy, first poll fires within 30 min.
2. **Live verification** — once deployed, curl `/health`, `/api/news/india/en/national`, `/api/news/article/1/take`, `/api/news/article/1/factcheck` from production.
3. **Frontend cache update** — verify the live deploy has `chitti_news.html` and the API_BASE points correctly. The default in HTML is `chitti-news-api.onrender.com`.
4. **Regional language RSS** — Bangla / Telugu / Tamil / Odia outlets mostly don't publish public RSS. Add HTML scraping or app-API integration in v1.1.
5. **Browser push notifications** for breaking news — service worker + Notification API.
6. **Topic following** — keyword-based subscriptions (e.g. "Modi", "RBI", "ISRO").
7. **User-feedback loop** — thumbs up/down on Cancelled articles to learn preferences.
8. **Newsletter digest** — daily 6 AM email with the top 5 stories from user's state.
9. **Citizen reporter submissions** — NewsBreak-style hyperlocal news with photos, moderated before publish.
10. **Cross-product handoff** — "this article mentions a medicine — open in Chitti MedUPI".

### 🟡 OUT OF SCOPE (intentionally NOT building)
- ❌ Original reporting / journalism
- ❌ Paywalled / login-walled content
- ❌ Comments / community discussions on articles
- ❌ Behavioural targeting / ad tracking
- ❌ Live video / TV streaming

---

## 13. Build rules (non-negotiable — copy into every session prompt)

1. **Bharat Premium theme** — saffron `#E86A17` / navy `#0E2344` / gold `#D4AF37` palette + cream `#f8f4ee` background. Same as Chitti Shares + MedUPI.
2. **Hindi UI toggle** — `_chittiLang` localStorage. `data-i18n="key"` + `applyChittiLang()`. Every visible string covered.
3. **Four-user contract** — every control: aria-label · 🔊 speak · symbols + word labels · plain English caption.
4. **Feed disclaimer** in every API response (`disclaimer_en` + `disclaimer_hi`). Verify-with-source language is non-negotiable.
5. **Fact-check verdict colours** — green / amber / red / muted. Never colour alone — always pair with symbol (✅ 🟡 ⚠️ ❔).
6. **No original reporting** — Chitti News is an aggregator. Every article links back to its source.
7. **Per-category sub-agent guardrails** — politics no labels, sports no salary speculation, business unit-citation rules, tech no fanboy tone, entertainment no paparazzi. See `chitti-news/skills/`.
8. **`node --check`** must pass on the main JS block before any commit.
9. **GitHub may be ahead of local** (Bryan's Colab) — fetch + cherry-pick before any push.
10. **`Switch to Chitti Technical / Fundamentals / MedUPI`** buttons in News header for cross-product navigation. Mirror in the other three pages.

---

## 14. Closing checklist (every session)

- [ ] `node --check` passes on `chitti_news.html`'s main script block
- [ ] `git fetch && git rev-list --count main...origin/main` is `0 0` before push
- [ ] Live URL `https://sahayai.in/chitti_news.html` opens, picker bar visible
- [ ] Hindi toggle switches every marked string and `sp()` voice
- [ ] Bharat theme consistent — same palette + card style as the other three pages
- [ ] Four-user lens audit on every new control
- [ ] State + language onboarding modal opens on first launch
- [ ] Update **section 12** (built / pending / out-of-scope) before close
- [ ] Update memory entry `project_chitti_news_spec.md` if structure shifts

---

*Living document. Update before every session close.*
