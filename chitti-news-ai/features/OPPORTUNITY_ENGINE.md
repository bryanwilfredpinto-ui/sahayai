# Chitti Opportunity Engine (Phase 2)

> Combines **News + Courses + Certs + Jobs + Grants + Research + Tools + Schemes** into **ONE** recommendation per day per profession.

---

## What it does

The crown feature: every profession gets ONE high-impact opportunity per day, synthesised from all 9 streams.

## Rules-only design

Inputs:
- All 9 streams' fresh items (last 24-48h)
- User's profession (localStorage)
- User's completed skills (localStorage opt-in)
- AI Impact Score for their profession

Algorithm:
1. **Score every fresh item** across 9 streams for this profession:
   - News: importance × profession-confidence × time-decay
   - Courses: in-demand-skill × free? × provider-trust
   - Certs: hiring-signal × free-study?
   - Jobs: postings-growth × location-match × skill-match
   - Grants: profession-match × deadline-proximity
   - Research: citation-velocity × profession-relevance
   - Tools: github-stars × free-tier × profession-confidence
   - Schemes: profession-match × deadline-proximity
2. **Take TOP 1** across all streams
3. **Render as the day's "Chitti Opportunity"** with: why-this + what-to-do + estimated-effort + source-attribution

## Output

```json
{
  "kind": "opportunity_of_the_day",
  "profession": "farmer",
  "date": "2026-06-04",
  "opportunity": {
    "stream": "scheme",
    "item_id": <id>,
    "title": "PM-Kisan instalment notification — apply by 30 June",
    "provider": "PM-Kisan Portal",
    "why_this": "Highest-priority government scheme with closest deadline (26 days)",
    "next_action": "Tap Open at source → fill instalment form",
    "estimated_minutes": 15,
    "source_url": "https://pmkisan.gov.in/...",
    "score_components": {
      "profession_match": 1.0,
      "deadline_proximity": 0.87,
      "scheme_priority": 1.0
    }
  },
  "rule_version": "opportunity-engine-v1"
}
```

## Surface

Pinned card at top of For You. One per day. Refreshes 06:45 IST (before Chitti PA's morning brief, so Chitti PA can read it aloud).

## Fail-open

If a stream is down → its candidates are excluded; engine still picks top from remaining streams. If ALL streams are down → "Chitti is recharging; check tomorrow" honestly.

## Why this is rules-only

Every score component is a deterministic function. The synthesis is rank-and-take-top-1. No LLM judgment.

## Cross-handoff to Chitti PA

If Chitti PA is configured to deliver morning brief, the Opportunity Engine's result feeds into the PA's pre-warm at 06:45 IST per [`CHITTI_PA_MASTER.md`](../../CHITTI_PA_MASTER.md). User hears it as part of their morning ritual — never as a second notification.

---

**World Class CNAIOS — Commando Discipline. Zero Excuses.**
