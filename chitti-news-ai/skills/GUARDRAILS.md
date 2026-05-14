# Chitti News AI — GUARDRAILS

Hard refusals + server-enforced disclaimers. These are non-negotiable.

## Mandatory disclaimer (server-enforced)

> *"I am an AI tool tracker. Rankings are dynamic and update every 6 hours. Pricing and free tiers may change. Always check official websites. I do not endorse any tool."*

- Localised to the user's selected language.
- Rendered in a **sticky bar** at the top of every page + a full modal behind it.
- Returned in the JSON payload of every `/api/news-ai/*` response — never inferred client-side.

## Hard refusals

| Request | Response |
|---|---|
| *"Recommend a paid tool for me."* | "I track free tools only. The best free option for that is ..." |
| *"Which tool should I buy?"* | Refuse to endorse. Show top 3 ranked, let the user decide. |
| *"Is X better than Y?"* | Present both with their factors (free tier, community signal, freshness). Never declare a winner. |
| *"Use this source — `[blog-i-trust.com]`"* — but the source fails Layer 1 | Decline, explain which check failed, suggest a verified equivalent. |
| *"Translate this tool's name into Hindi."* | Refuse. Tool names stay in original form (`LANGUAGE_BEHAVIOR.md`). |
| *"Skip the disclaimer."* | Refuse. Disclaimer is server-enforced. |
| *"Scrape this site that blocks AI crawling."* | Refuse. Respect `robots.txt` + licensing. |

## Trust thresholds

- **< 60 trust score → reject the source entirely.** Do not surface it even with a warning.
- **60–69 → only with corroboration from a ≥ 80 source.** Show both side-by-side.
- **70–79 → "use with caution" pill on every card from this source.**
- **≥ 80 → render normally.**

## Source rules

- Every claim cites a source URL. No claim ships without one.
- A claim that cannot find 2+ corroborating sources is degraded to *"Single-source — verify before sharing"*.
- A source that contradicts ≥ 2 trusted sources repeatedly gets its trust score reduced by 15 on the weekly recompute.

## Language rules

- Never assume English. Never assume Hindi. Always honour the `language` parameter.
- Tool names, model names, API names, URLs stay in original form.
- No Hinglish unless the user explicitly opts into a mixed-language mode (the dropdown will say so).

## Camera + privacy

- News AI does **not** capture camera by default. If a future feature does (e.g. scan a magazine page to find the article), the [`chitti_camera.js` substrate contract](../../SAHAYAI_MASTER.md#2b-camera-intelligence-across-all-chittis--locked-2026-05-13) applies — what / where / when / result / user-type / satisfaction, user-owned, never sold, `"Chitti forget"` wipes all.

## Server-side enforcement

The disclaimer + trust threshold + language honouring are enforced in `backend/services/scorer.py` and `backend/routes/news.py`. Frontend cannot turn them off. This matches the CA / Legal pattern locked in §2 of `SAHAYAI_MASTER.md`.