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
---

## 2a. Quality & Scope improvements — queued 2026-05-15

Per the *Quality & Scope Improvement directive* dated 2026-05-15. Items
land here first as a capability surface that the [Feature Discovery
Box](../../chitti_features.js) reads live; COMING SOON badges show until
the backend/UI work is wired per the [new-products process
(§2a)](../../SAHAYAI_MASTER.md). Locked decisions in §2 are never
relitigated by this section — the swarm + Sire may *propose* new
capabilities; locks (LLM provider, voice substrate, emergency protocol,
four-user contract, ISL, per-response widget, camera intelligence,
knowledge-corpus expert grades, Vaani sole interface) never move.

### Quality

| # | Item | How to apply |
|---|---|---|
| Q1 | Every tool listing shows **Free / Paid / Freemium** clearly. | Required field on every tool record; honest `unknown` when not yet classified — never silently default to `free`. |
| Q2 | India-relevant tools have an **"Available in India"** badge. Tools that geo-block India carry a `"Not available in India — VPN may be needed"` honest disclosure. | Curated `availability: ['IN','GLOBAL']` field per tool; periodic re-check during the existing trust-verification pass. |
| Q3 | Honest 501 endpoints — show estimated launch date OR *"No ETA"* — never blank. *"Tool comparison launching by 2026-06"* if a date exists; *"No ETA"* otherwise. | Stub responses already return 501; enrich with `eta_iso: null|'2026-06-15'` field surfaced in the UI. |
| Q4 | Verification tag **explains why** — *"Verified: found on Product Hunt + TechCrunch"* — not just a green tick. | Factchecker (mirrors chitti-news verdict shape) returns `corroborating_sources: ['Product Hunt', 'TechCrunch']`. Frontend renders the source list inline. |


### Scope

| # | Item | Priority | Surface needed |
|---|---|---|---|
| S1 | *"Indian AI tools"* filter — show only India-built AI products. | P1 | Filter by `origin_country: 'IN'` field; surfaces BharatGPT, Bhashini, Krutrim, Sarvam, etc. |
| S2 | Weekly digest — top 5 AI launches of the week, in user's language. | P1 | Same Sunday-cron pattern as chitti-news S6. |
| S3 | *"Will this replace my job?"* — honest explainer for each tool category. | P2 | Curated reasoning per category (writing assistant / code assistant / image gen / data extraction etc.); never speculative — flag tools where the honest answer is *"unclear yet"*. |
| S4 | AI tool comparison — *"Compare Tool A vs Tool B"* — honest table. | **COMING SOON** | Endpoint exists as a 501 today; LLM-generated comparison with `sources_n` ≥ 2 required before publishing. |
| S5 | Government AI initiatives tracker — BharatGPT, Bhashini, IndiaAI Mission updates. | P1 | Dedicated RSS sub-feed; surfaces every PIB / MeitY release tagged AI. |

### Cross-Chitti improvements (substrate — every page inherits)

The 2026-05-15 directive's cross-cutting items #1–#10 ship as
substrate features in [`chitti_a11y.js`](../../chitti_a11y.js) so every
Chitti page inherits them without per-page edits:

| # | Cross-Chitti item | Where it lives | Status |
|---|---|---|---|
| 1 | Offline mode for basic queries | `chitti_offline.js` (service-worker cache + connectivity badge) | wired since 2026-05-14 |
| 2 | WhatsApp share on every response | `Chitti.a11y.share(text, opts)` | shipped 2026-05-15 |
| 3 | Save as PDF / print scoped to a node | `Chitti.a11y.print(el, opts)` | shipped 2026-05-15 |
| 4 | Voice input everywhere | Voice Factory cascade via `Chitti.a11y.speak` / Web Speech API on every page | wired since 2026-05-12 |
| 5 | Low-data / 2G mode | `chitti_offline.js` + `effectiveType <= 2g` heuristic; user-overridable via Disability Profile "rural / low connectivity" | wired since 2026-05-14 |
| 6 | Battery saver auto-dark below 20% | `Chitti.a11y.setBatterySaver()` + `html[data-chitti-batt="save"]` CSS | shipped 2026-05-15 |
| 7 | Font size large / medium / small | `Chitti.a11y.setFontSize('lg'\|'md'\|'sm')` | shipped 2026-05-15 |
| 8 | "Chitti forget" — one-tap local wipe | `Chitti.a11y.forget(scope)` + tombstone preserved for honest counts | shipped 2026-05-15 |
| 9 | Session history (last 5 questions) | `Chitti.a11y.history.{push,list,clear,mount}` per-Chitti scope | shipped 2026-05-15 |
| 10 | Rating after 3 uses | **REJECTED** — see "Rejected items" below | — |

### Confidence-score chip — shared primitive

The 2026-05-15 directive asks several Chittis to show a confidence
score on every answer (MedUPI strip scan, CA tax answer, Scanner FSSAI
flag, etc.). Rather than each backend hand-rolling a different chip,
the rendering primitive lives in `Chitti.a11y.renderConfidence(target,
pct, opts)` — the backend emits a number, the substrate renders the
coloured pill (green ≥ 80%, amber 50–79%, red < 50%). Below 70% the
chip carries a `Please verify` line; if `opts.verifyWith` is set, the
chip's `title` says where to verify (e.g. "FSSAI portal" / "your CA").

### Rejected items — directive-level reroute (2026-05-15)

The following two items conflict with [`feedback_design_from_pwd_user_perspective`](../../SAHAYAI_MASTER.md):

| Item | Why rejected | What we do instead |
|---|---|---|
| *"Did Chitti understand you? YES/NO after every routed response"* | Pre-action / pre-feedback modals **break blind / mute / illiterate users** — the four-user contract floor. We already collect per-response 👍 / 👎 + voice-or-text feedback on every box via the [per-response widget §7](../../feedback-widget.js). Adding a second YES/NO confirmation is redundant + creates a forced choice every turn. | The existing 4-icon row (🔊 · 🤖 · 👍 · 👎) covers the same intent; a 👎 click opens the per-box feedback window scoped to that response. No second prompt. |
| *"Rating after 3 uses — ask user to rate Chitti 1–5"* | Same anti-pattern as above. Generic SaaS rating prompts assume a literate, tap-fluent user. Forcing a 1–5 modal pesters elderly / illiterate / blind users and lowers honest feedback quality (rate-to-dismiss bias). | The per-response widget already produces a far richer signal — every box's 👍 / 👎 rolls into the Founder's daily 07:00 IST quality slice + the Sunday digest. Per-response signals beat point-in-time rating modals on every dimension. |

Both rejections are documented here, not silently dropped, so any
future revisit knows the reasoning. If Sire wants either of these
shipped anyway, the override lives in `Chitti.a11y` and either can be
wired in a future patch.
