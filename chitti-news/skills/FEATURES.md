# Chitti News — FEATURES

Honest inventory: **Built** (verified against routes + frontend),
**Planned** (queued, no working endpoint yet), **Future** (needs new
data source / partnership). Same contract as
[`chitti-vaani/skills/FEATURES.md`](../../chitti-vaani/skills/FEATURES.md).

Last touched: **2026-05-13**.

Verify with: `chitti-news/backend/routes/`, `chitti-news/backend/services/`,
`chitti_news.html`, and [`CHITTI_NEWS_MASTER_SPEC.md`](../../CHITTI_NEWS_MASTER_SPEC.md)
before claiming "built".

---

## 1. Built and working
- 26+ RSS feeds across 5 active languages (regional langs stubbed).
- State × language × category routing.
- **Chitti's Take** — 3-bullet DeepSeek summary per article.
- **Fact-checker** — cross-references ≥2 trusted RSS sources; emits a
  verdict (`verified` / `partial` / `disputed` / `unverified`) +
  rationale.
- Read Later / Cancelled folders per device.
- Sub-agent routing: politics → business → tech → entertainment →
  sports → factcheck (post-hoc) → summarizer (post-hoc).

---

## 2. Planned — queued 2026-05-13

| # | Feature | Priority | Why | Surface needed |
|---|---|---|---|---|
| N1 | **Morning briefing** — 5 headlines read aloud at 07:00 IST | **P1** | Habit-forming, voice-first; ideal for blind / elderly / illiterate (`project_four_user_contract`) | Cron 07:00 IST → user's chosen lang via Voice Factory → Vaani read-aloud handoff. Per-device opt-in. |
| N2 | **"Explain this news in simple Hindi"** button on every article | **P0** | Core illiterate / elderly contract. Mirrors the P0 "Explain simply" task in [`SAHAYAI_MASTER.md`](../../SAHAYAI_MASTER.md#p0--fix-the-homepage-this-sessions-audit-findings). | DeepSeek re-prompt with class-5 plain-Hindi system prompt + read-aloud. Button next to Chitti's Take on every article card. |
| N3 | **Fake-news score visible on every article** | **P0** | Currently the factcheck verdict only shows when the user opens an article. Trust contract says every card should carry the score. | Compute verdict at ingest time, persist on `articles` table, render as badge + word label (`verified` / `partial` / `disputed` / `unverified`) — never colour alone (`project_four_user_contract`). |

**How to apply:**
- "Explain simply" must use the same shared helper proposed in
  [`SAHAYAI_MASTER.md` §8 P0](../../SAHAYAI_MASTER.md#p0--fix-the-homepage-this-sessions-audit-findings)
  — don't fork a news-only version.
- Briefing alarm rings even on silent **only** if the user opted in;
  default is push + readable-on-open, never bypass-silent (that bypass
  is reserved for Vaani's emergency cascade,
  `project_chitti_vaani_emergency_protocol`).
- Fake-news badge follows the four-user contract: **symbol + word
  label**, never colour-only.

---

## 3. Future — needs partnership / regulator
- ANI / PTI / regional wire-service licensing — would replace fragile
  RSS scrapes.
- Audio-first content (AIR / community radio) — partnership-gated.
- On-device Vosk summariser for fully-offline briefings — depends on
  the Vaani Android phase-2 work.

---

## How to keep this file honest

1. Move Planned → Built **only after** curl-ing the production endpoint
   per `feedback_verify_before_handover`.
2. Politics sub-agent is opinion-free by hard guardrail
   (`chitti-news/skills/chitti-news-politics/SKILL.md`). The morning
   briefing and the "Explain simply" button must inherit the same
   neutrality contract — no opinions, no labels, equal coverage.
3. Fact-checker is the trust signal of the whole product. If a verdict
   regresses on a sample of 50 articles, that's a P0 quality
   incident — file under Chitti Quality v2 escalator.
