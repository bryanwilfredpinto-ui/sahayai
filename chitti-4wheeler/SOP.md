🎖️ **World Class Chitti 4-Wheeler — Commando Discipline. Zero Excuses.**

> **This Chitti is someone's lifeline. Build it like your family depends on it. Because someone's family does.**

# Chitti 4-Wheeler — Standard Operating Procedure

## Objective
Service-due alerts + plain-language diagnostic guidance for 4-wheeler owners (mileage, service intervals, common repairs, OBD2-ready).

## Primary User
Family-car owner in Tier-2/3, taxi driver, small-business fleet manager — non-mechanic decision-maker.

## Success Metric
(a) Service-due alert accuracy · (b) repair-guidance 👍 rate · (c) cost-saved vs. service-centre estimate when user follows DIY tier.

## Quality Standard
- DeepSeek wrapped via `hooks.wrap_llm`
- HookRegistry registered
- Per-response widget on every response box (🔊 / 🤖 / 👍 / 👎 / ✏️🎙️)
- Frontend HTML at repo root verified before Vaani-routed queries land here

## Operating Rules
1. **No booking on user's behalf.** 4-Wheeler ADVISES; user books their own service.
2. **No mechanic dispatch.**
3. **No fitness cert.** RTO does. 4-Wheeler flags due; user verifies.
4. **OBD2 capture is Chitti Mechanic.** 4-Wheeler is interpreter only.
5. **Family-cascade SOS.** Breakdown / theft SOS through family cascade — NEVER auto-dials cops.
6. **Anti-overcharge guard.** Surface zone-benchmark price; flag when quote > 1.3× median. Never silently approve.
7. **Golden Rule on every action.** SOS triggers, service-reminder set/snooze, document renewal alerts — all confirm before fire.

## Error Handling
- DeepSeek 5xx → fallback canned response + honest "diagnostic service unavailable"
- ARAI feed unreachable → last-good fallback with staleness banner
- Anti-overcharge benchmark missing → return quote with honest "no benchmark for this part in this zone"

## Escalation to CTO
- Service-due false-positive rate > 10%
- ARAI feed sustained failure > 7 days
- Family-cascade SOS misroute
- Anti-overcharge median miscalibration (zone benchmark drift)
- Chitti Mechanic launches → OBD2 deep-link wiring

## Stale Data Rule
Same as 2-wheeler — manufacturer service tables annually, parts monthly, recalls weekly (manufacturer + ARAI).

## Evolution Owner
[chitti-4wheeler/skills/FEATURES.md](skills/FEATURES.md) (verify file exists; create if missing).

---

> **World Class Chitti 4-Wheeler — Commando Discipline. Zero Excuses.**
