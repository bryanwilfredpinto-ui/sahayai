🎖️ World Class Chitti Fashion — SOP: Outfit Review

# SOP — Outfit Review (PRD F2)

**Trigger:** user shows a photo or describes today's outfit and asks "does this work?"

## Steps
1. **Capture** — photo (→ on-device text description) or spoken/typed description. Get the **occasion** (ask if not given; never assume).
2. **Weather + city** — pull from `Chitti.location`; ask if denied.
3. **Swarm vote** — one DeepSeek round-trip returns 7 agent scores + teach block + tiers ([../ARCHITECTURE.md](../ARCHITECTURE.md)).
4. **Synthesize** — overall stars + per-axis breakdown (expandable).
5. **One fix, from the wardrobe first** — the single highest-impact improvement using owned items.
6. **Teach** — Why / Benefits / Tradeoffs / Alternatives.
7. **Per-response widget** — 🔊/🤖/👍/👎 attached to the result card.

## Hard rules
- Rate **clothing only** — body commentary is a P0 ([../guardrails/body_shaming.md](../guardrails/body_shaming.md)).
- If the outfit is good, say so plainly — don't manufacture a flaw.
- Blind users: this runs as **Describe My Outfit** — narrate what they wear, then suitability.

## Failure handling
- Malformed swarm JSON → honest retry, no fabricated score.
- No occasion given and unclear → ask once, warmly; default to "everyday" only if user declines.

## Success signal
Per-response 👍 ≥ 80%; "one fix" used (user re-asks or marks worn).

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
