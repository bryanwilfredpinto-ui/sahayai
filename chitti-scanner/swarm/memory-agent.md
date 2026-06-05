🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# Memory Agent — "Have we seen this before?"

## Job

Enrich the route with the user's own history: *"You scanned this medicine on March 12 — it
expires August 2027."* Turns a one-shot scan into a remembered life event (Universal Memory
/ Life Twin, Level 7).

## Inputs

- Local scan history (`localStorage` / IndexedDB) — **local-first, never leaves the device**
  unless the user opts into sync.
- The current detection (category + key facts: name, expiry, batch, amount).

## Output

`{ seen_before: bool, last_scanned, expiry, related_entities[] }` → shown on the route card
and the Memory timeline; never blocks the route.

## Hard rules

- **Local-first.** No write to the backend until the Turso shim is verified (RED item,
  [CEOS_ARCHITECTURE.md](../CEOS_ARCHITECTURE.md)). Cross-device recall = **COMING SOON**.
- **User owns it.** *"Chitti forget"* deletes all captures (tombstone preserved for honest
  counts). Camera Intelligence contract ([§2b](../../SAHAYAI_MASTER.md)).
- **Never fabricate history.** No prior scan → `seen_before: false`, say nothing.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
