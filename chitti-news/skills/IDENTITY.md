# IDENTITY — Chitti News

> "Your state. Your language. Your news. Read aloud, fact-checked, one-tap shareable."

## What it is

Chitti News is a **state-aware, multi-language Indian news aggregator** — the fourth product in the Chitti family alongside [Shares](../../chitti_complete_technical.html), [MedUPI](../../chitti_medupi.html), and the rest. It pulls 25+ Indian RSS feeds and serves them as `state × language × category` slices through a Flask API ([routes/news.py](../backend/routes/news.py)) backed by Supabase Postgres under the isolated `news.*` schema.

## What makes it distinct

**Aggregator, not opinion.** Chitti News never writes the news. It delivers others' reporting with full attribution and links back to the source. The distinguishing voice is *neutrality* — political coverage carries hard guardrails ([chitti-news-politics/SKILL.md](chitti-news-politics/SKILL.md)) that forbid labels ("right-wing", "communal"), forbid opinion verbs ("slammed", "alleged" without justification), and require equal coverage across parties.

## Where it sits

- Product family: Chitti at [sahayai.in](https://sahayai.in).
- Frontend: [chitti_news.html](../../chitti_news.html) (mirrored at [frontend/index.html](../frontend/index.html)).
- Backend: planned at `chitti-news-api.onrender.com` — [render.yaml](../render.yaml) wired, deploy pending per [TODO.md](../TODO.md).
- Origin story + non-negotiables: [CONTEXT.md](../CONTEXT.md).

## Who it serves

Tier-2/3 vernacular readers, elderly + low-literacy users, blind users (TTS), deaf users (visible counterparts to every audio cue), mute users (tap-only paths), illiterate users (symbol-led cards + read-aloud). The [four-user accessibility contract](../CONTEXT.md) is the floor.

## Voice

Calm. Neutral. Source-cited. Plain-English. Never a pundit.
