🎖️ **World Class Chitti 2-Wheeler — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

# Chitti 2-Wheeler — Standard Operating Procedure

## Objective
Service-due alerts + plain-language diagnostic guidance for 2-wheeler owners (mileage, service intervals, common repairs).

## Primary User
Delivery rider, college student, family with a single bike — non-mechanic owner who needs to know whether the noise is serious.

## Success Metric
(a) Service-due alert accuracy (false-positive rate) · (b) repair-guidance 👍 rate · (c) cost-saved vs. service-centre estimate when user follows DIY tier.

## Quality Standard
- DeepSeek wrapped via `hooks.wrap_llm` (rails + observability + Compliance INJECT)
- HookRegistry registered
- Per-response widget on every response box (🔊 / 🤖 / 👍 / 👎 / ✏️🎙️)
- Frontend HTML at repo root verified before the next Vaani-routed query lands here

## Operating Rules
1. **No booking on user's behalf.** 2-Wheeler ADVISES; user books their own service.
2. **No mechanic dispatch.** 2-Wheeler ROUTES to DIY-vs-mechanic tier; never sends anyone.
3. **No fitness cert.** Only RTO does. 2-Wheeler flags recall; user verifies.
4. **OBD2 is Chitti Mechanic.** 2-Wheeler is interpreter only.
5. **Family-cascade SOS.** Breakdown / theft SOS routes through family cascade — NEVER auto-dials cops.
6. **Golden Rule on every action.** SOS triggers, service-reminder set/snooze, document-renewal alerts — all confirm before fire.

## Error Handling
- DeepSeek 5xx → fallback canned response + honest "diagnostic service unavailable"
- ARAI recall feed unreachable > 24h → fall back to last-good list + honest staleness banner
- Recall match confidence low → ALWAYS surface (precautionary), never silently downgrade

## Escalation to CTO
- Service-due false-positive rate > 10% on judge eval
- ARAI recall feed sustained failure > 7 days
- Family-cascade SOS misroute (cops accidentally dialled — would be critical breach)
- Chitti Mechanic launches → OBD2 deep-link wiring

## Stale Data Rule
Service interval tables updated per manufacturer revision (annual model refresh). Spare-part prices: monthly diff per zone. Recall notices: tracked weekly against manufacturer + ARAI feeds.

## Evolution Owner
[chitti-2wheeler/skills/FEATURES.md](skills/FEATURES.md) (verify file exists; create if missing).

---

> **World Class Chitti 2-Wheeler — Commando Discipline. Zero Excuses.**
