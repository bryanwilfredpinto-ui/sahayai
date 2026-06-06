# VISION — Chitti News AI

> **Level 1** of the COSDF stack.
> Sourced from [`COSDF.md`](COSDF.md) §LEVEL 1 (lines 80-89) +
> [`COSDF.md`](COSDF.md) §LEVEL 24 final-rating reframing (lines 935-941).

---

## Mission

Help **ANY** professional — regardless of role, language, disability, or location — understand AI news AND upgrade their skills with personalized certifications, courses, tools, and prompts.

The mission has three verbs, not one:

1. **Understand** what's happening in AI today (the curator layer)
2. **Decide** what to do about it for *your* role (the coach layer)
3. **Act** on the next 30-minute thing this week (the mentor layer)

A news app does verb 1. A course platform does verb 2. Nobody does verb 3. Chitti News AI does all three.

---

## Vision statement

A world where the same product opens for —

- A **doctor in rural Tamil Nadu**, speaking Tamil, blind
- A **CA in Mumbai**, speaking Marathi, deaf
- A **teacher in Nigeria**, speaking Yoruba, unable to read
- A **lawyer in Brazil**, speaking Portuguese, fully sighted

— and ALL four see, in their own language and modality:

> *"Here's AI news for your profession. Here's what to learn for YOUR role. Here's how to use AI tomorrow — in YOUR language."*

That is the product. Anything that doesn't render that sentence for all four users is a bug.

---

## The shift — from news aggregator to universal career copilot

### Where Chitti News AI was (v1.0, May 2026)

A multilingual AI-news app with 4 tabs (*AI Aaj*, *Tools*, *Bharat AI*, *Prashikshan*), 5 live RSS sources + 3 honest stubs, and a 🤖 Chitti icon that DeepSeek-explains any article through a 9-profession jargon lens.

At this stage Chitti News AI competed with:
- **Inshorts / Google News** (the news aggregator category)
- **Coursera / UpGrad** (the course marketplace category)
- **There's An AI For That** (the AI tool directory category)

That competition was a category mistake. We were trying to be three different things badly.

### Where Chitti News AI is going (v1.1, June 2026)

A single product — the **Profession Hub** (COSDF L23) — that opens for any role the user types and assembles 10 sections per role:

```
[Pick a role] → ANY HUB
  ├── 1. AI News              (this week's news that affects YOU)
  ├── 2. Chitti Explains      (per-card relevance verdict)
  ├── 3. AI Readiness Score   (your number + roadmap)
  ├── 4. Certifications       (FREE-first, ranked)
  ├── 5. Courses              (FREE-first, ranked)
  ├── 6. Tools                (curated stack for your role)
  ├── 7. Prompts              (copy-paste-ready)
  ├── 8. Projects             (build to learn)
  ├── 9. Jobs Radar           (news → jobs → skills)
  └── 10. Mentor              (next 1 thing to do)
```

At v1.1, Chitti News AI is no longer competing with news apps, course marketplaces, or AI directories. It becomes a **Global AI Career Copilot for Every Profession, Language, and Ability Level**. This reframing is locked in [`COSDF.md`](COSDF.md) §LEVEL 24.

---

## What "universal" means concretely

| Dimension | Floor | Target |
|---|---|---|
| Roles | 13 hardcoded Hubs (Phase 1) | Any role via dynamic mapping (Phase 2) |
| Languages | 12 Indian + 9 global (P0) | 100+ (P3 "ALL other") |
| Disabilities | Blind + Deaf + Mute + Illiterate (LIVE) | + Low Vision + Blind+Deaf + Cognitive |
| Pricing | FREE option always shown first | FREE-only mode toggle in profile |
| Connectivity | Online + low-bandwidth | Offline voice mode (COSDF L12) |

The floor is what ships today via `chitti_coach.js` + `chitti_news_ai.html` + `chitti_a11y.js`. The target is what the swarm + Community Intelligence agent (COSDF L20) earns over time.

---

## What success looks like — in one sentence per persona

- **Blind Tamil doctor**: opens the page, Voice-First Mode auto-activates, hears today's AI-in-healthcare news and the next 30-minute mission, never sees a screen.
- **Deaf Marathi CA**: opens the page, ISL panel attaches to every news card, sees the relevance verdict as an emoji band, never needs audio.
- **Illiterate Yoruba teacher**: opens the page, sees 6 face-emoji role buttons, taps "👩‍🏫", hears today's mission in Yoruba voice.
- **Sighted Portuguese lawyer**: opens the page, sees the standard Hub, picks a project, builds a Contract Summarizer this weekend.

Same product. Same code path. Different rendering.

---

## What this product refuses to become

- A platform that sells courses. (We link out. We never take affiliate fees that distort ranking.)
- A platform that "guarantees jobs". (Career outcomes are probabilistic; we forecast, not promise.)
- A platform that gives medical / legal / financial advice. (See [`guardrails/safety.md`](guardrails/safety.md).)
- A platform that ranks paid above free. (See Founder Rule clause 2.)
- A platform that hides accessibility behind a paid tier. (Universal Access is constitutional.)

---

Last reviewed: 2026-06-06
