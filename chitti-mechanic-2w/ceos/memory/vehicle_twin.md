🎖️ World Class Chitti Mechanic 2W — Commando Discipline. Zero Excuses.

# MEMORY — Vehicle Twin

A living, on-device record of one machine. `localStorage` only; never leaves the phone;
"Chitti forget" wipes it.

## The timeline (append-only)
- **Purchase** — model, year, km at buy, price, new/used.
- **Services** — date, km, what was done, parts, cost, workshop type.
- **Repairs** — symptom, fix, cost, urgency at the time.
- **Insurance** — policy dates, cover type, NCB, premium, add-ons.
- **PUC** — test dates + expiry.
- **Tyres** — fitment date, brand/spec, km at fit, rotation history.
- **Battery** — fitment date, type, health checks.
- **Chain / CVT** — lube/adjust/replace history.
- **Accidents** — date, severity, claim status.

## What the Twin powers
- Smart Reminders (next service / chain / tyre from real last-done dates).
- **Resale-readiness score** — from service regularity, doc status, accident history,
  tyre/battery age.
- Ownership Scores (maintenance / document / safety / resale).
- Cross-domain swarm insights (e.g. "no NCB + frequent claims → premium will jump").

## Rules
- Every row tagged `{source:"user-entered" | "vault" | "engine-derived", confidence}`.
- Never fabricate a missing event — absent history lowers a score, it doesn't invent one.
- All scores are read aloud + shown with icons, never colour-only.

---
> **World Class Chitti Mechanic 2W — Commando Discipline. Zero Excuses.**
