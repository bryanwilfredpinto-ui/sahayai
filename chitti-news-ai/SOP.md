🎖️ **World Class Chitti News AI — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

# Chitti News AI — Standard Operating Procedure

## Objective
Track new AI tools, models, and papers from the AI ecosystem (Product Hunt, There's An AI For That, HF Daily Papers) in an Inshorts / Ground News / Artifact-style feed.

## Primary User
Indian AI builder, student, founder watching the AI ecosystem — and downstream Chitti developers looking for new substrate.

## Success Metric
(a) New-tool freshness (median lag from launch → appearance in feed) · (b) summary 👍 rate · (c) verification rate (% tools surfaced with ≥2 corroborating sources).

## Quality Standard
- SLA-timing curl-verified (`x-chitti-response-time-ms` header present)
- Skeleton services that aren't built yet return **honest 501** (8 of 10 endpoints today) — never fake demos
- Per-response widget on every response box (🔊 / 🤖 / 👍 / 👎 / ✏️🎙️)
- **Turso embedded-replica sync UNVERIFIED today** — flagged 🔴 until Railway env var fix lands

## Operating Rules
1. **Honest 501.** If a service isn't built, it returns 501 with explanation. NEVER fake a demo.
2. **No subjective ranking.** No "top 10" lists. No paid placement.
3. **No mainstream news.** That's Chitti News. News AI is AI-ecosystem only.
4. **Two-source rule for verification.** Single-source tools tagged `unverified`. NEVER auto-elevate.
5. **9-profession jargon lens.** Tap 🤖 → DeepSeek explains article in user's language + profession context. Default = farmer.
6. **Golden Rule on every action.** Save-for-later, subscribe-to-tool — all confirm before fire.

## Error Handling
- DeepSeek 5xx → return RSS article without 🤖 explanation + honest "explanation unavailable" banner
- RSS source 5xx → mark as down in ledger; never silently drop
- Turso bg sync fails → log to Founder dashboard (🔴 OPEN: DATABASE_URL gap blocks this entirely)
- Skeleton endpoint hit → return 501 with body explaining "not built yet"

## Escalation to CTO
- Turso `articles` table empty after RSS poll (confirms `DATABASE_URL` env still broken)
- Layer-5 fallback chain still env-slot placeholder (the 4 remaining skeleton services need DeepSeek wiring + Claude/Gemini fallback)
- New skeleton service shipped without honest 501 (defect — fake-demo violation)
- Railway service unreachable > 1h (cold-start vs outage)

## Stale Data Rule
RSS poll every 30 min. Tools not corroborated by ≥2 sources tagged `unverified`. Deprecated / dead models archived monthly.

## Evolution Owner
[chitti-news-ai/skills/](skills/) — 14 skill files + `RSS_SOURCES_AI.md`. New sources reviewed by Sire.

---

> **World Class Chitti News AI — Commando Discipline. Zero Excuses.**
