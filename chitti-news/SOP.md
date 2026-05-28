🎖️ **World Class Chitti News — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

# Chitti News — Standard Operating Procedure

## Objective
Aggregate trusted RSS feeds across India in the user's state × language × category, with a 3-bullet *"Chitti's Take"* and a fact-check verdict on every article.

## Primary User
Vernacular reader (Hindi today, regional langs in v1.1) who wants state-specific news without paywalls.

## Success Metric
(a) Fact-check pass rate (% articles cleared with ≥2 corroborating sources) · (b) *"Chitti's Take"* 👍 rate · (c) cross-state coverage breadth (states represented per day).

## Quality Standard
- Fact-checker requires **≥2 independent RSS sources** before issuing `verified` / `partial` / `disputed` verdicts — single-source articles surface as `unverified`, never auto-elevated
- Politics sub-agent runs under hard neutrality guardrails (no opinion, no labels, equal coverage)
- Per-response widget on every response box (🔊 / 🤖 / 👍 / 👎 / ✏️🎙️)
- Summarizer respects the user's selected language end-to-end

## Operating Rules
1. **Two-source rule.** No `verified` without ≥2 independent RSS sources corroborating. Single-source = `unverified`. NEVER auto-elevate.
2. **Politics neutrality.** No opinion words. No party labels in summarizer output. Equal coverage rule (Politics is 7 RSS sources balanced).
3. **No paywalls.** Only public-RSS sources seeded.
4. **No original journalism.** Aggregator only.
5. **No ads, no monetisation.**
6. **Camera capture N/A** — News has no camera surface.
7. **Golden Rule on every action.** Read Later add/remove, morning-briefing subscribe — all confirm before fire.

## Error Handling
- RSS source 5xx/timeout → mark source as down in honest ledger; never silently drop
- DeepSeek 5xx (summarizer) → return article without summary + honest "summary unavailable" banner
- Fact-checker fails to find ≥2 sources → return `unverified` honestly
- Turso bg sync fails → log to Founder dashboard (🔴 OPEN: DATABASE_URL gap blocks this entirely)

## Escalation to CTO
- Any RSS source sustained 5xx > 24h
- Fact-check pass rate < 60% (too many `unverified`)
- Politics neutrality breach detected in summarizer output (test eval)
- Turso DB empty after RSS poll — confirms `DATABASE_URL` env still broken
- For You localStorage drift across devices reported by user

## Stale Data Rule
RSS poll cadence: every 30 min. Articles older than 7 days auto-archive (still searchable, demoted in feed). Sources reviewed monthly for trust score; sources with sustained low fact-check pass rate are deprecated.

## Evolution Owner
[chitti-news/skills/](skills/) — 8 sub-agent SKILL.md files + `sources/RSS_SOURCES.md`. New sources reviewed by Sire before seeding.

---

> **World Class Chitti News — Commando Discipline. Zero Excuses.**
