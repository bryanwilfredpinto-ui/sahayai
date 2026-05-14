# Chitti News AI — Master Spec

**The 14th Chitti.** Dedicated AI tool and model discovery — the AI-only
sibling of [Chitti News](CHITTI_NEWS_MASTER_SPEC.md) (general state-aware
Indian news).

Last touched: **2026-05-14** · Version **0.1.0** · Status: **SKELETON LIVE**.

> Read [`SAHAYAI_MASTER.md`](SAHAYAI_MASTER.md) first. This spec sits under
> the platform-wide locked decisions there — never overrides them.

---

## 1. Why this Chitti exists

Indian users are flooded with AI tool launches every week. Most coverage is
English-first, hype-laden, and paywalled. Chitti News AI fixes three things:

1. **No paywalls** — Chitti only tracks free tools and reads from free
   sources.
2. **No hardcoded categories** — *"I am a teacher / a small-shop owner / a
   YouTuber"* gets a custom ranking. DeepSeek extracts topics; no fixed
   profession list.
3. **No default language** — the user picks one of 26 Indian languages
   on first visit. Tool names stay in original form; everything else is
   localised.

It is **not** general news (politics, sports, business) — that lives in
[Chitti News](CHITTI_NEWS_MASTER_SPEC.md). It is **only** about AI tools,
models, and the free-tier landscape around them.

---

## 2. Reference apps surveyed (new-products process §2a)

| App | What we copied | What we changed |
|---|---|---|
| **Product Hunt** | Vote-weighted leaderboard layout | Replaced votes with composite community signal (HN + Reddit + GitHub stars) and capped paid tools at 90% — free generosity is a 10% weight. |
| **There's An AI For That** | Task-filtered tool directory | Added per-profession ranking (DeepSeek topic extraction) on top of static tasks. |
| **Hugging Face Daily Papers** | Velocity feed for research | Combined with vendor-blog RSS for full Daily Briefing surface. |
| **Inshorts** | 60-word card discipline | Adopted as the line-budget for every briefing card. |
| **Ground News** | Multi-source corroboration UI | Adopted for the *"corroborated by N sources"* badge on every claim. |
| **Artifact (RIP)** | Importance-ranked feed + topic model | Adopted the importance score (0–100); only ≥ 75 reach the daily briefing. |

This skeleton ships the **full feature surface** from this audit in commit
#1 (per the [Skeleton-first must be exhaustive](SAHAYAI_MASTER.md#3-process--build-rules) rule). Unbuilt features carry visible `COMING SOON` badges.

---

## 3. Folder layout

```
chitti-news-ai/                           ← this product's folder
├── README.md                             ← entry doc
├── CONTEXT.md                            ← agent persona + data + trust layers
├── SKILL.md                              ← DeepSeek capability surface
├── ARCHITECTURE.md
├── API.md
├── CHANGELOG.md
├── TODO.md
├── render.yaml                           ← Render free-tier deploy blueprint
├── backend/                              ← Flask + APScheduler + Turso libSQL
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── requirements.txt
│   ├── runtime.txt
│   ├── data/sources.json                 ← 17 verified RSS seeds
│   ├── models/                           ← 5 SQLAlchemy models
│   ├── routes/news_ai.py                 ← 10 endpoints (2 LIVE, 8 honest 501)
│   └── services/                         ← rss / trust / discovery / scorer / ranker / topics
└── skills/                               ← parsed live by chitti_features.js
    ├── FEATURES.md
    ├── IDENTITY.md   PERSONALITY.md   VALUES.md
    ├── GUARDRAILS.md BOUNDARIES.md    DEVILS_ADVOCATE.md
    ├── TRUTH_SOURCES.md   LANGUAGE_BEHAVIOR.md
    ├── TRUST_VERIFICATION.md   SOURCE_DISCOVERY.md
    ├── RANKING_FORMULA.md  IMPORTANCE_SCORING.md
    ├── OBSERVABILITY.md   SALES_BRIEF.md
```

Frontend stays at the repo root: [`chitti_news_ai.html`](chitti_news_ai.html). GitHub Pages serves from `/`.

---

## 4. The full feature surface (frontend tabs)

| Tab | Purpose | Status |
|---|---|---|
| 🆕 **Today** | Daily AI briefing, importance ≥ 75, read-aloud in user's language. | COMING SOON |
| 🛠️ **Tools for Me** | Profession input → DeepSeek topic extraction → ranked tool list. | SKELETON LIVE |
| 🚀 **New Launches** | Last 7 days of detected AI tools / models. | COMING SOON |
| 💰 **Free Tier Tracker** | Nightly diff of every tracked tool's free tier. | COMING SOON |
| 🛡️ **Trust Check** | Paste any URL → 4-layer verification → 0-100 score. | SKELETON LIVE |
| 📊 **Sources** | 17 verified RSS sources + trust scores. | SEEDED LIVE |
| 🏆 **Leaderboard** | Top tools by importance × community signal. | COMING SOON |
| 🤖 **Models** | LLM / SLM / vision / audio model tracker. | COMING SOON |
| 🔎 **Discover Sources** | Community submission queue → Layer 1 verification. | COMING SOON |
| 🧠 **My Stack** | Saved tools per device, voice alerts on changes. | FUTURE |

Every tab inherits:

- **Ask Chitti AI strip** — DeepSeek-powered conversational entry, voice or text, in the user's language.
- **Per-response widget** — 🔊 / 🤖 / 👍 / 👎 on every response box ([§7](SAHAYAI_MASTER.md#per-response-widget--mandatory-on-every-page-locked-2026-05-13)).
- **Server-enforced disclaimer bar** — sticky at top, full modal behind it.
- **Feature Discovery Box** — auto-loaded by `chitti_a11y.js`, parses `chitti-news-ai/skills/FEATURES.md` live.
- **ISL panel** on every response — auto-on for users with ☑ ISL in their disability profile.
- **No-default-language picker** — onboarding modal on first visit, voice-guided for blind users.

---

## 5. The four-user contract on every surface

| User | How News AI honours the contract |
|---|---|
| **Blind** | Every card has 🔊; the disclaimer is voice-first; the Ask Chitti strip works voice-only. |
| **Deaf** | Every response has an ISL panel alongside text; sources directory works without audio; the disclaimer renders large with symbols. |
| **Mute** | Every input is text + dropdown; voice is optional via 🎙️ on Ask, Profession, and Source-submit forms. |
| **Illiterate** | Emoji glyphs on every tab; voice-first onboarding; tool ranking cards show free-tier as a colour-coded pill *with* a word label, never colour alone. |

---

## 6. Trust contract

- **17 sources seeded** (`backend/data/sources.json`), all Layer-1 pre-approved.
- **Trust score 0–100** on every source, weekly recompute (Sunday 04:00 IST).
- **< 60 trust score → reject.** Even if the user pastes the URL directly, Chitti refuses.
- **All claims cite a source URL.** Single-source claims are tagged *"verify before sharing"*.
- **AI crawling blocks respected** — sources that block `robots.txt` are not scraped.

Full contract: [`chitti-news-ai/skills/TRUST_VERIFICATION.md`](chitti-news-ai/skills/TRUST_VERIFICATION.md).

---

## 7. Language contract

- **No default.** Onboarding modal on first visit picks one of 26.
- **Saved locally** in `chitti_news_ai_lang`. Synced across all Chittis on the device via `chitti_a11y.js`.
- **Tool names stay original** — `Cursor`, `Groq API`, `Llama 3.1`, URLs.
- **No Hinglish** unless the user explicitly picks a mixed-language option.
- **Server-enforced disclaimer** localised — never client-controlled.

Full contract: [`chitti-news-ai/skills/LANGUAGE_BEHAVIOR.md`](chitti-news-ai/skills/LANGUAGE_BEHAVIOR.md).

---

## 8. Voice strategy

Inherits the [LOCKED voice strategy](SAHAYAI_MASTER.md#voice-strategy--locked):

- **Bhashini is temporary.** Community-donated voices replace it over time.
- **Voice Factory 4-supplier cascade.** Tier C never silently falls back.
- **Swappable at one URL** — `window.Chitti.a11y.VOICE_FACTORY_URL`.

---

## 9. Self-ping & continuity (§2e)

- `chitti-news-ai-api` exposes `GET /health`.
- `chitti-founder` self-pings every **4 minutes** (NOT UptimeRobot — locked
  decision §2). Non-200 → emails Sire (debounced 1 h).
- DeepSeek 5xx ×3 → fallback chain Claude → Gemini.
- Turso unreachable → embedded replica keeps writes flowing; sync resumes.

---

## 10. Build status snapshot (2026-05-14)

**Live (skeleton commit):**

- Folder + 14 skill files + backend Flask skeleton (5 models, 10 endpoints,
  6 service stubs, APScheduler wiring, 17-source seed).
- Frontend at [`chitti_news_ai.html`](chitti_news_ai.html) with all 10 tabs
  and the Ask Chitti strip.
- All mandatory plugins wired: `chitti_disclaimer.js`, `feedback-widget.js`,
  `chitti_a11y.js` (which auto-loads `chitti_features.js`, ISL dictionary,
  Feature Discovery Box), `chitti_camera.js`.
- `GET /health`, `GET /`, `GET /api/news-ai/languages`, `GET
  /api/news-ai/disclaimer` are **LIVE**.
- All other endpoints return HTTP 501 with structured COMING SOON payloads —
  honest stubs, never fake data.

**Next session (P0 from `chitti-news-ai/TODO.md`):**

- DeepSeek client in `services/topic_extractor.py`.
- Trust scorer Layer 1 + Layer 4 implementation.
- RSS poll wiring against the 17 seeded sources.
- `POST /api/news-ai/tools-for-me` end-to-end.
- Turso libSQL embedded-replica adapter.

---

## 11. What this Chitti will never do

- Recommend a paid tool as "best free".
- Endorse a specific vendor (rankings are reproducible from the public formula).
- Use a source below trust score 60.
- Default to a language. Pick. Always.
- Mix Hinglish unless asked.
- Capture camera by default (the camera substrate is loaded for future
  consent-gated features only — `Chitti.forget()` always wipes).
- Auto-dial helplines (Vaani is the only Chitti with emergency dial; News AI
  is not in that contract).
- Ship a feature without a `COMING SOON` badge if it isn't fully wired.

---

## 12. Where to find more

- [`README.md`](chitti-news-ai/README.md)
- [`CONTEXT.md`](chitti-news-ai/CONTEXT.md)
- [`SKILL.md`](chitti-news-ai/SKILL.md)
- [`ARCHITECTURE.md`](chitti-news-ai/ARCHITECTURE.md)
- [`API.md`](chitti-news-ai/API.md)
- [`skills/FEATURES.md`](chitti-news-ai/skills/FEATURES.md)
- [`SAHAYAI_MASTER.md`](SAHAYAI_MASTER.md) — single source of truth for the
  whole platform.
