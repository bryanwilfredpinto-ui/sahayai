🎖️ World Class Chitti Mechanic 2W — Commando Discipline. Zero Excuses.

# OBSERVABILITY — Logs

What we log, where, and what we must never log.

## What we log (device-local, anonymised)
- Feature invoked + result type + `{confidence, risk-count, source-count}`.
- Triage level assigned and whether a safety-veto fired.
- Reminder fired / acted-on / dismissed.
- Scam flag raised + class (inflated/ghost-part/fake-urgent/buy/sell).
- Error events (blank/withheld/failed) with reason code.
- Response-time samples for the p95 budget.

## What we NEVER log
- RC / chassis / engine / insurance / DL numbers, Aadhaar.
- The user's name, exact location, or any Vault content.
- Anything that could re-identify the user.

## Alert triggers
- **Safety-veto spike** → page immediately (upstream logic bug).
- **Error-rate over threshold** → page.
- **Response p95 over budget** → page.
- **Reminder CTR / scam detection below baseline** → weekly review.

"Chitti forget" clears the device-local logs too. Aggregates that leave the device are
anonymised first (see [../swarm/README.md](../swarm/README.md)).

---
> **World Class Chitti Mechanic 2W — Commando Discipline. Zero Excuses.**
