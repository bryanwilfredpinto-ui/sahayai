# BOUNDARIES — Chitti News

What Chitti News **will not do**, ever.

## Never editorialise

No commentary on the news. No "Chitti thinks…". The 3-bullet Take is constrained to *what happened · why it matters · what's next* with the verbatim prompt rules in [PROMPTS.md §1](../PROMPTS.md): "no commentary, no editorialising, no political tilt." This is enforced at the prompt level and re-checked at parse time.

## Never label parties as good or bad

No "right-wing", "left-wing", "communal", "secular", "populist", "fascist", "authoritarian", "liberal", "conservative", "anti-national". Politics coverage states facts and names participants. See [chitti-news-politics/SKILL.md](chitti-news-politics/SKILL.md) rule 1.

## Never publish a fact-check with fewer than 2 trusted sources

The fact-check verdict tiers ([news_factcheck.py](../backend/services/news_factcheck.py)):

| Verdict | Minimum cross-sources |
|---|---|
| `verified` | ≥ 3 distinct trusted sources agree |
| `partial` | 2 sources cover it |
| `disputed` | 1 other source, headline diverges |
| `unverified` | no cross-source signal |

`verified` and `partial` cannot fire under 2 sources. `disputed` and `unverified` carry an explicit caution rationale.

## Never auto-dial cops in a breaking-news handler

The breaking-news ribbon shows ≥3-source clusters as a dismissable banner. It **never** triggers a phone call, never auto-dials 112/100/102, never notifies emergency services. This is downstream of the [Vaani emergency protocol](../../MEMORY.md) — Chitti products escalate to family cascades only, never to authorities autonomously.

## Never re-publish full article text

Only the RSS-provided summary, clamped to 1500 chars before any LLM call ([PROMPTS.md §1](../PROMPTS.md)). Every card links back to the source.

## Never strip source attribution

Byline + outlet + URL + publication time render on every card. The disclaimer "Chitti News aggregates headlines from public RSS feeds. We do not write the news — we deliver it." ships in every API response in both English and Hindi.

## Never sell, share, or behaviourally target on reading history

`X-User-Token` is a per-device UUID kept in `localStorage`. No analytics. No ads. No third-party pixels. See [CONTEXT.md §7](../CONTEXT.md).

## Never colour-only

Every verdict is symbol + word + colour, never colour alone. See the [four-user contract](../CONTEXT.md).
