# Chitti News AI — FEATURES

**Read by the [Feature Discovery Box](../../SAHAYAI_MASTER.md#2d-feature-discovery-box--locked-2026-05-14) on every page load.** Parsed live by [`chitti_features.js`](../../chitti_features.js); nothing in this file is hardcoded in JS. The status badge (`LIVE 🟢 / PLANNED 🟡 / FUTURE 🔵 / ANDROID 📱`) is inferred from the section title.

Last touched: **2026-05-14**.

---

## 1. Built and working

### 🔊 Voice-first language onboarding
On first visit, the page asks the user to pick one of **26 Indian languages** (Voice Factory cascade). No default. Voice-guided for blind users via `chitti_a11y.js`.

### 🌐 No-default-language responses
Every Chitti reply lands in the user's chosen language. Tool names (`Cursor`, `Groq API`, `Llama 3.1`) stay in original form.

### 📰 Daily AI Briefing — skeleton
Top stories of the day, importance score ≥ 75, rendered as honest stub cards while the RSS pipeline ships.

### 🛡️ Trust score badges on every source
Every article / tool card carries a 0–100 trust score badge (Trusted ≥ 80 ✅ · Acceptable 70–79 ⚠️ · Questionable 60–69 🟡 · Reject < 60 ❌). Score logic lives in [`TRUST_VERIFICATION.md`](TRUST_VERIFICATION.md).

### ⚖️ Mandatory disclaimer bar
Server-enforced sticky bar — *"I am an AI tool tracker. Rankings are dynamic. Pricing may change. Always check official sites."* Localised. Behind it: full modal with the 7 ALWAYS REMEMBER points from [`CONTEXT.md`](../CONTEXT.md).

### 🤖 Per-response widget
Every response box carries 🔊 / 🤖 / 👍 / 👎 + per-box feedback popup. Tagged to box ID, into the daily founder report. Inherited from [`feedback-widget.js`](../../feedback-widget.js) — no per-page wiring needed.

### 🤟 ISL panel on every response
Indian Sign Language animation alongside every Chitti response. Tap-word-to-sign modal. Auto-on for users with ☑ ISL in their disability profile.

### 💡 Feature Discovery Box
The button you opened to read this file. Lists every feature below, speaks them aloud, taps to activate.

### 🆘 Honest empty states
Every section that has no data yet renders `COMING SOON` with a description — never a fake-data demo. Matches the [Honest stubs over fake demos](../../SAHAYAI_MASTER.md#3-process--build-rules) rule.

### 🌅 AI Daily Tip — feeds Chitti PA morning brief (LOCKED 2026-05-15)
`GET /api/daily-tip?profession=<free_text>&lang=<26-locale>&date=<YYYY-MM-DD>` — SKELETON LIVE.

- **Profession is free-form** — DeepSeek topic-extracts; no fixed profession list (same contract as the *Profession → Tools* feature).
- DeepSeek scans articles ingested in the last 24 h whose source carries **trust score ≥ 70** (Acceptable ⚠️ tier or higher per [`TRUST_VERIFICATION.md`](TRUST_VERIFICATION.md)) and writes **one class-5-simplicity actionable tip IN the master's language** — no translate-from-English.
- **Cache** keyed by `(profession_norm, lang, date_ist)` so repeated calls (Chitti PA + masters with the same profession) hit cache, not DeepSeek.
- **Pre-warm cron at 06:45 IST** seeds Hindi tips for common professions (teacher, student, shopkeeper, farmer, homemaker, driver, small business owner) so Chitti PA's 07:00 IST brief almost always hits cache.
- **Voice** rendered via Voice Factory `/api/voice/speak` cascade — response carries `audio_url` + `audio_speak_payload` (Voice Factory is POST-only in v1; honest contract collapses to a single GET URL when v2 ships pre-rendered cache).
- **Honest 503 reasons** (never a fake tip): `no_high_trust_article_today` / `deepseek_not_configured` / `no_relevant_article` / `upstream_error` / `upstream_http_<code>` / `malformed_response` / `empty_response`.
- **Admin trigger** for manual pre-warm: `POST /api/news-ai/admin/daily-tip/prewarm-now` (METRICS_TOKEN-gated).

Full contract: [`CHITTI_NEWS_AI_MASTER_SPEC.md §10a`](../../CHITTI_NEWS_AI_MASTER_SPEC.md#10a-ai-daily-tip--part-of-chitti-pa-morning-brief-locked-2026-05-15). Backend in [`services/daily_tip.py`](../backend/services/daily_tip.py) + [`models/daily_tips.py`](../backend/models/daily_tips.py).

---

## 2. Planned — queued 2026-05-14

| # | Feature | Priority | Surface needed |
|---|---|---|---|
| N1 | **Profession → Tools** — *"I am a [profession]. Tell me about AI tools."* DeepSeek extracts topics (no hardcoded profession list), ranks tools by relevance + community signal + freshness + free generosity. | **P0** | `POST /api/news-ai/tools-for-me` + ranker.py + DeepSeek topic extraction |
| N2 | **New launches (last 7 days)** — surfaces every AI tool / model RSS-detected in the rolling 7-day window. | **P0** | `GET /api/news-ai/launches` + rss_fetcher cron @ 6h |
| N3 | **Free Tier Tracker** — Chitti watches the free tier of every tracked tool and alerts on quota cuts, price introductions, ad insertions. | **P0** | `GET /api/news-ai/free-tier-tracker` + nightly diff vs previous snapshot |
| N4 | **4-Layer Trust Check (paste a URL)** — runs the full Layer 1 verification on demand; returns the trust card. | **P0** | `POST /api/news-ai/trust-check` + trust_scorer.py |
| N5 | **Daily AI Briefing (07:00 IST)** — read-aloud 5 headlines in user's language; opt-in. Same cron substrate as chitti-founder. | **P1** | `GET /api/news-ai/today` + APScheduler 07:00 IST job |
| N6 | **Model Tracker** — LLM / SLM / vision / audio models by release date, params, license, free-tier availability. | **P1** | `GET /api/news-ai/models` + models table seeded from Hugging Face RSS |
| N7 | **Community source submission** — user pastes a URL; goes into Layer 1 queue; visible Hall of Fame for accepted contributors. | **P1** | `POST /api/news-ai/sources/submit` + admin review surface |
| N8 | **Tool Leaderboard** — top tools by importance + community signal, dynamic. Filterable by task (writing / code / image / video / voice / data). | **P1** | `GET /api/news-ai/leaderboard` |
| N9 | **My Stack** — saved tools per device; price + free-tier change alerts pushed via voice. | **P2** | `localStorage` + push channel via Vaani |
| N10 | **Pricing diff alerts** — *"Cursor dropped its free tier to 50 requests/day"* — voice-pushed to subscribers. | **P2** | nightly price scrape diff |
| N11 | **WhatsApp briefing** — same daily briefing pushed via WhatsApp Business API for low-connectivity users. | **P2** | cross-cutting WhatsApp gateway (§5b) |

> ~~N12 — AI Daily Tip~~ moved to **§1 Built** on 2026-05-15 (skeleton live). See *AI Daily Tip — feeds Chitti PA morning brief* in §1.

How to apply when implementing:
- Every Planned item must arrive with a route in `backend/routes/`, a UI affordance in `chitti_news_ai.html`, and a Voice Required marker if blind/illiterate users are the primary audience.
- DeepSeek answers carry **server-enforced disclaimers** — never client-controlled.
- Trust score must render before the tool name on every card, not after.
- Free-tier alerts respect Vaani's quiet rules — never wake the master at night for a price drop.

---

## 3. Future — needs partnership / signal

- **Live AI usage telemetry** — anonymised aggregate of what tools Chitti users actually open via the leaderboard; needs an opt-in consent surface per [§2b camera-intelligence contract](../../SAHAYAI_MASTER.md#2b-camera-intelligence-across-all-chittis--locked-2026-05-13). Anonymised before analysis, *"Chitti forget"* wipes all.
- **Vendor-confirmed free tier feeds** — partnerships with OpenAI / Anthropic / Google / DeepSeek for authoritative pricing JSON instead of scraping. Honest stub until they ship.
- **Model bench eval ingest** — pull LMSYS / Open LLM Leaderboard / HELM into the model tracker; needs polling cadence + license review.
- **Annual "free-AI access in India" report** — published openly on `sahayai.in/reports/`, same pattern as the FSSAI fake-product report (§2b).
- **Chitti News AI on Android** 📱 — native app with offline daily briefing pre-cached. Same `chitti_a11y.js` substrate, just hosted in WebView.

---

## How to keep this file honest

1. Move Planned → Built **only after** curl-ing the live endpoint per [`feedback_verify_before_handover`](../../SAHAYAI_MASTER.md#3-process--build-rules).
2. New features follow the [LOCKED new-products process](../../SAHAYAI_MASTER.md#2a-locked-decisions--agent-vision-voice-strategy-new-product-process-2026-05-13): research top 3 reference apps (Inshorts · Ground News · Product Hunt · There's An AI For That · Hugging Face Daily Papers) → ship full skeleton with `COMING SOON` → DeepSeek + community voices → declare capability here.
3. Never silently substitute a paid source for a free one. The "all sources free" rule is a product-positioning contract — surface a `COMING SOON` empty state instead.
4. Never list a tool without its trust score. If the score is missing, the card is broken — fix the data, not the rendering.

---

## Cross-product hooks

- **Chitti News** ([../../chitti-news/skills/FEATURES.md](../../chitti-news/skills/FEATURES.md)) — general state-aware Indian news. AI-tagged stories from there can boost into the News AI briefing by topic.
- **Chitti Vaani (PA)** — `tools-for-me` answers pipe through Vaani's voice cascade for hands-free use. **AI Daily Tip (N12) feeds Vaani's 07:00 IST morning brief** via `GET /api/daily-tip` — single endpoint, no shared state. Owner split: this Chitti generates; Vaani delivers. Full contract: [`CHITTI_NEWS_AI_MASTER_SPEC.md §10a`](../../CHITTI_NEWS_AI_MASTER_SPEC.md#10a-ai-daily-tip--part-of-chitti-pa-morning-brief-locked-2026-05-15).
- **Chitti Founder** — daily briefing email at 07:00 IST contains the News AI top-3 alongside the platform health digest.