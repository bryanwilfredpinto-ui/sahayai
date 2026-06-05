🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# ACCESSIBILITY — Mute trader (P-mute)

> A mute trader runs the **entire** product by tap. Voice input is **optional,
> never required** ([SAHAYAI_MASTER.md §7](../../SAHAYAI_MASTER.md) four-user contract).

## Requirements (all mandatory)
- **Every input is a tap/dropdown** — stock search (type/pick), trade-type select,
  indicator toggles, screener filters, trade logging.
- **Voice input is never the only path** to any action.
- The **Golden Rule confirm modal is mute-safe** — every "Sire, shall I …?"
  carries Yes / No **buttons**, not just a voice prompt ([SAHAYAI_MASTER.md §2g](../../SAHAYAI_MASTER.md)).
- Setting an alert, logging a trade, switching language — all reachable by tap.

## Output (mute users can still hear/read)
- Mute ≠ deaf or blind — output can be voice + text + visual; the constraint is on
  **input**, not output. Respect the user's *other* profile flags.

## Anti-patterns (defects)
- A "speak your stock name" flow with no type/pick fallback. ❌
- A confirm dialog that only accepts a spoken "haan." ❌
- Any feature gated behind a microphone. ❌

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
