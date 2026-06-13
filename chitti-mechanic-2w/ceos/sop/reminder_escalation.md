🎖️ World Class Chitti Mechanic 2W — Commando Discipline. Zero Excuses.

# SOP — Smart Reminders & escalation

Covers: **Smart Reminders 24/7/365** and **service/PUC/chain maintenance scheduling**.

## Goal
Make sure the user never misses an insurance renewal, PUC, service, chain lube, or tyre
rotation — and never pays a fine or rides illegal — with escalation that respects the
Golden Rule.

## Reminder sources
- Insurance expiry, PUC expiry, RC renewal → from the Document Vault.
- Next service, chain lube, tyre rotation, battery check → from service intervals
  (versioned table, see [../memory/rule_versioning.md](../memory/rule_versioning.md)) +
  the user's last-done dates in the Vehicle Twin.

## Escalation ladder (date-driven)
1. **T-30 days** — gentle nudge, read aloud: "your PUC expires in a month."
2. **T-7 days** — firmer nudge + what to do + fair cost band.
3. **T-1 day** — urgent nudge: "expires tomorrow — riding without it is a fine."
4. **Overdue** — daily reminder until cleared; flag the legal/safety risk.

## Golden Rule
Chitti **reminds**; it never auto-books, auto-pays, or auto-renews. Any action (book a
slot, open insurer, mark done) passes `chittiConfirmAndDo()` — speak the action, wait for
explicit "haan" or tap. Silence = wait, forever. Never default to yes, never time out into yes.

## Emergency overlap
A breakdown/accident reminder is NOT a renewal — it surfaces **108 / 112 visibly** and the
family-cascade option, but **never auto-dials** (see [crisis_handling.md](crisis_handling.md)).

## Rules
- Never invent a due date — if the Vault has no date, ask; don't manufacture one.
- Reminders are read aloud + shown with an icon, never colour-only.
- Every reminder carries `{confidence, sources:["vault"/"service-interval-table vN"]}`.

---
> **World Class Chitti Mechanic 2W — Commando Discipline. Zero Excuses.**
