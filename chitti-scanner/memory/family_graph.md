🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# memory/family_graph.md — Level 8 · the moat

> Father · Mother · Child · Vehicle · Home · Farm · Medicine · Insurance · Certificates —
> all linked. *"Show everything expiring in the next 30 days."* Nobody has this for Bharat
> families.

## The graph

```
        Father ──── Medicine (exp Aug 2027)
          │  └────── Insurance (renew Mar 2026)
        Mother ──── Lab report (Jan 2026)
        Child  ──── School certificate
        Vehicle ─── Insurance · PUC · Service-due
        Home   ──── AC warranty · Fridge warranty
        Farm   ──── Crop history · Pesticide labels
```

Each node is created from a scan (Universal Memory) and tagged to a person/asset the user
names. Edges are "belongs to" + "expires on".

## HONEST status (no fake graph)

- **Local-first today** — a single-device graph built from this device's scans. The "link to
  a family member" tag is stored locally.
- **Cross-device family graph = COMING SOON** — needs verified backend persistence (the
  Turso shim RED item) so two family members' devices share one graph. Until then the
  Family Graph card shows the **local** entities + a visible COMING SOON badge for the
  cross-device + predictive parts. **It never shows a fabricated family.**

## The killer query (when live)

"Show everything expiring in the next 30 days" → scans across the graph, sorted by date,
read aloud. This is [reminders.md](reminders.md).

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
