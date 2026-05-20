# SALES_BRIEF — Chitti News

Ten pains an Indian news reader lives with today, each paired with the specific Chitti News answer.

| # | Pain | Benefit Chitti News delivers |
|---|---|---|
| 1 | **English-only national aggregators.** Inshorts, Google News India default to English. Anyone whose first language isn't English is a second-class user. | **Language-first picker.** State + language is the **first** interaction — see [CONTEXT.md §3](../CONTEXT.md). 12 Indian languages surfaced; English readers also have to pick "English". No language privileged. |
| 2 | **Regional voices missing.** Vernacular outlets each have their own app; cross-source view across outlets in your language doesn't exist. | **Aggregator across 25+ feeds** — see [TRUTH_SOURCES.md](TRUTH_SOURCES.md). All Hindi outlets in one place. Bangla, Tamil, Telugu, Marathi, Kannada, Malayalam, Gujarati, Punjabi, Urdu, Odia growing. |
| 3 | **No fact-check.** A headline scrolls past on three apps and you have no idea if any other outlet ran the same story. | **Per-article fact-check verdict.** ✓ verified / • partial / ! disputed / ? unverified, computed from cross-source agreement on the title. See [chitti-news-factcheck/SKILL.md](chitti-news-factcheck/SKILL.md). |
| 4 | **Sensational headlines.** "SLAMMED!" "DESTROYED!" — algorithmic rage-bait optimised for clicks. | **Neutral re-summary.** [PROMPTS.md §1](../PROMPTS.md) bans editorial verbs and political tilt in the 3-bullet Take. |
| 5 | **No plain summary.** Long articles, jargon-heavy. Elderly + low-literacy users bounce. | **Chitti's Take — 3 bullets, plain words.** A 12-year-old should understand each one. Read-aloud one tap. |
| 6 | **Paywalls everywhere.** Hindu, ET, Mint behind logins. | **Pure RSS, no paywall, no login.** Article cards link back to source for full read. No tracking pixels. No ads. |
| 7 | **Blind / illiterate readers excluded.** No screen-reader-friendly aggregator. | **Voice IN + voice OUT** on every control. Symbols + words, never colour alone. [Four-user contract](../CONTEXT.md). |
| 8 | **Delhi-centric national feeds.** A Karnataka reader gets a TOI-Delhi-heavy default. | **State-aware routing.** `state × language × category` is the core query shape; state pages are the top-bar selector, not buried two taps deep. |
| 9 | **Behavioural targeting + ads.** Every "free" aggregator monetises your reading history. | **Zero tracking. Zero ads. Zero analytics.** `X-User-Token` is a per-device UUID kept in localStorage. Bryan never sees what you read. |
| 10 | **No save / dismiss memory.** You scroll past something you wanted to revisit and lose it forever. | **Read Later + Cancelled folders** per device. Explicit save vs explicit dismiss. Backed by [models/read_later.py](../backend/models/read_later.py). |

## Channels

- Frontend live: [sahayai.in/chitti_news.html](https://sahayai.in/chitti_news.html)
- Backend planned: `chitti-news-api-production.up.railway.app` — [render.yaml](../render.yaml) wired, deploy pending per [TODO.md §P0](../TODO.md).

## Positioning sentence

*"The news every Indian needs, in the language they think in, with the context to trust it."*
