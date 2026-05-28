🎖️ **World Class Chitti News AI — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

> 8 RSS sources · 4 tabs (AI Aaj · Tools · Bharat AI · Prashikshan) · tap 🤖 Chitti icon → DeepSeek explains the article in user's language with 9-profession jargon lens.

| Field | Value |
|---|---|
| Live URL | https://sahayai.in/chitti_news_ai.html |
| Health | https://chitti-news-ai-api-production.up.railway.app/health |
| Status | 🟡 YELLOW — SLA-timing curl-verified 2026-05-15 PM, **but Turso embedded-replica sync UNVERIFIED (`SELECT COUNT(*) FROM articles` → empty)** |
| 4 Users | 👁️ Blind · 🦻 Deaf · 🤫 Mute · 📖 Illiterate — voice-first, ISL panel, plain-EN/HI |
| Languages | EN + HI native · 9-profession jargon lens |
| Companion docs | [SKILLS.md](SKILLS.md) · [SOP.md](SOP.md) · [CHITTI_SOP.md §7](../CHITTI_SOP.md) · [MASTER_SPEC](../CHITTI_NEWS_AI_MASTER_SPEC.md) |

---

# Chitti News AI

**Free AI tool and model discovery — in YOUR language.**

Chitti News AI is the 14th Chitti. It is **dedicated to AI** — tools, models, free
tiers, pricing changes, launches. It is the AI-only sibling of
[`chitti-news/`](../chitti-news/) (which covers general state-aware Indian news).

Two products, one substrate. Same `chitti_a11y.js`, same `feedback-widget.js`,
same Voice Factory, same DeepSeek, same four-user accessibility contract.

---

## Frontend

[`chitti_news_ai.html`](../chitti_news_ai.html) at the repo root.

GitHub Pages serves from `/`, so the page stays at the root. The `<!-- Frontend
for chitti-news-ai/ -->` comment on line 2 binds it to this folder.

## Backend

Railway free-tier Flask service `chitti-news-ai-api`. See
[`render.yaml`](render.yaml) for the deploy blueprint.

Endpoint surface:

| Route | Status | Notes |
|---|---|---|
| `GET /health` | LIVE | Self-ping target — chitti-founder hits this every 4 min (§2e). |
| `GET /api/news-ai/today` | COMING SOON | Daily AI briefing (top stories, importance ≥ 75). |
| `GET /api/news-ai/launches` | COMING SOON | New tools from the last 7 days. |
| `POST /api/news-ai/tools-for-me` | COMING SOON | Profession → ranked tool list (DeepSeek topic extraction). |
| `GET /api/news-ai/free-tier-tracker` | COMING SOON | Tracked tools whose free tier changed in the last 30 days. |
| `POST /api/news-ai/trust-check` | COMING SOON | 4-layer URL trust verification. |
| `GET /api/news-ai/sources` | COMING SOON | All seeded sources + trust scores. |
| `POST /api/news-ai/sources/submit` | COMING SOON | Community source submission (queued for Layer 1 verification). |
| `GET /api/news-ai/leaderboard` | COMING SOON | Top tools by importance score, dynamic. |
| `GET /api/news-ai/models` | COMING SOON | LLM / SLM / vision tracker. |

Every COMING SOON endpoint returns HTTP **501** with a structured payload so the
frontend can render an honest stub (see [Honest stubs over fake demos][honest]).

## Database

**One Turso DB**, per the §2 locked decision. Embedded-replica pattern.
DB name: `chitti-news-ai`, region `aws-ap-south-1` (Mumbai).

Tables: `articles`, `tools`, `models`, `sources`, `trust_scores`,
`profession_topics`, `free_tier_history`. Schema lives in `backend/models/`.

## LLM

**DeepSeek only.** Topic extraction, profession matching, importance scoring,
trust verification, summarisation. Disclaimer is server-enforced (CA / Legal
pattern — never client-controlled).

## Voice

**Chitti Voice Factory** for 26 languages. **No default language** — the user
picks on first visit. Voice IN + Voice OUT. Tool names / API names / URLs stay
in original form; everything else translates.

---

## Quick start (local)

```bash
cd chitti-news-ai/backend
pip install -r requirements.txt
export DEEPSEEK_API_KEY=sk-...
export DATABASE_URL=libsql://chitti-news-ai-...turso.io
gunicorn main:app --bind 0.0.0.0:8080
```

## Specs

- [`../CHITTI_NEWS_AI_MASTER_SPEC.md`](../CHITTI_NEWS_AI_MASTER_SPEC.md) — root master spec
- [`CONTEXT.md`](CONTEXT.md) — agent persona + data sources + trust layers
- [`SKILL.md`](SKILL.md) — capability surface for DeepSeek
- [`skills/FEATURES.md`](skills/FEATURES.md) — parsed live by the Feature Discovery Box (§2d)
- [`skills/TRUST_VERIFICATION.md`](skills/TRUST_VERIFICATION.md) — the 4-layer system
- [`skills/RANKING_FORMULA.md`](skills/RANKING_FORMULA.md) — relevance score
- [`skills/LANGUAGE_BEHAVIOR.md`](skills/LANGUAGE_BEHAVIOR.md) — strict no-default-language rule

[honest]: ../SAHAYAI_MASTER.md#3-process--build-rules