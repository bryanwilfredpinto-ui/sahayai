🎖️ **World Class Chitti News — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

# Chitti News — Skills

> State-aware multi-language Indian news aggregator. ≥2 independent RSS sources required before issuing `verified` verdict. Politics sub-agent under hard neutrality guardrails.

---

## The 4 Users I Serve

| User | How News serves them |
|------|-----------------------|
| 👁️ Blind | "Chitti's Take" 3-bullet summary + full RSS body read aloud |
| 🦻 Deaf | Full text + ISL panel + fact-check verdict badge |
| 🤫 Mute | Tap-led category filter + Read Later / Cancelled folders |
| 📖 Illiterate | Voice everything in chosen language; picture menus for categories |

---

## Features

| # | Feature | Status | Tested By | Date |
|---|---------|--------|-----------|------|
| 1 | 25+ RSS feeds (EN + HI) | ✅ | CTO | 2026-05-15 |
| 2 | 8 sub-agents — politics · business · tech · entertainment · sports · factcheck · summarizer · news-AI bridge | ✅ | CTO | 2026-05-23 |
| 3 | State × language × category routing | ✅ | CTO | 2026-05-15 |
| 4 | Fact-checker requires ≥2 independent sources for `verified` verdict | ✅ | CTO | 2026-05-15 |
| 5 | `verified` / `partial` / `disputed` / `unverified` verdict labels | ✅ | CTO | 2026-05-15 |
| 6 | "Chitti's Take" — 3-bullet summary via DeepSeek | ✅ | CTO | 2026-05-15 |
| 7 | Politics neutrality guardrails (no opinion, no labels, equal coverage) | ✅ | CTO | 2026-05-15 |
| 8 | For You page — personalised tab driven by 👍/👎 → category profile in localStorage | ✅ | CTO | 2026-05-23 |
| 9 | Read Later / Cancelled folders per device | ✅ | CTO | 2026-05-15 |
| 10 | Speaker reads FULL RSS body (content:encoded), not just headline | ✅ | CTO | 2026-05-23 |
| 11 | DeepSeek `wrap_llm` at every call site | ✅ | CTO | 2026-05-15 |
| 12 | Per-response widget — 🔊 / 🤖 / 👍 / 👎 / ✏️🎙️ | ✅ | CTO | 2026-05-27 |
| 13 | Golden Rule confirm gate on every side-effecting action | ✅ | CTO | 2026-05-23 |
| 14 | Turso embedded-replica pattern wired in code | ✅ | CTO | 2026-05-12 |
| 15 | **Turso DATABASE_URL on Railway** — actually pointed at libsql:// | 🔴 | — | — |
| 16 | Morning briefing — 5 headlines read aloud at 07:00 IST | ⬜ | — | — |
| 17 | "Explain this news in simple Hindi" button (P0) | ⬜ | — | — |
| 18 | Fake-news score visible on every article (not just on open) | ⬜ | — | — |
| 19 | Regional language tabs (Tamil / Telugu / Bengali) | ⬜ | — | — |
| 20 | DeepSeek → Claude → Gemini Layer-5 fallback chain | ⬜ | — | — |

---

## Indian User Support

- Vernacular reader without paywalls
- State-specific news consumer (Mumbai user sees Maharashtra-relevant stories)
- Fact-conscious reader who needs cross-source verification
- User who wants voice-only news in 2G areas

## Language Support

EN + HI native today. Regional languages (Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam) stubbed for v1.1.

## Mandatory 5-element widget on every response box

🔊 Speaker · 🤖 Chitti icon · 👍👎 Thumbs · ✏️🎙️ Pencil+Mic · 🌐 Language selector — verified live on `chitti_news.html` per [CERT_LOG.md](../CERT_LOG.md).

## Commando Standard

- ≥2 independent sources for `verified` verdict — single-source articles surface as `unverified`, never auto-elevated
- Politics sub-agent: no opinion, no labels, equal coverage across parties
- No paywalls, no ads, no original journalism
- RSS poll cadence: every 30 min
- Articles older than 7 days auto-archive (demoted, still searchable)
- Sources reviewed monthly for trust score
- 🔴 OPEN DEFECT: Railway env `DATABASE_URL` must be `libsql://…` form — currently Supabase Postgres URL; embedded-replica bg sync never starts

---

> **World Class Chitti News — Commando Discipline. Zero Excuses.**
