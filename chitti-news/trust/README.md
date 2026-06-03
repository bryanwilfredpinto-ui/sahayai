# CNOS — Trust

> *"Trust is the primary KPI. If broken once, never recovered."*

---

## The Trust Strip (per card, visible in <2 s)

| Element | What it shows | Source |
|---|---|---|
| Verdict badge | `verified` / `partial` / `disputed` / `unverified` | `factcheck.verdict` |
| Corroboration count | "verified by N independent sources" | `factcheck.match_count` |
| Publisher trust score | 0–100 numeric (per-publisher rolling) | per-source `trust_score` (PENDING render) |
| Reading time | "X min read" | computed from content length |
| Publisher attribution | "📡 The Hindu" | `source_name` |

---

## Verdict matrix

| Verdict | Required signal | Color |
|---|---|---|
| `verified` | ≥ 2 independent corroborating sources at verdict time | 🟢 green |
| `partial` | 1 source on-record OR corroboration partial / context-dependent | 🟡 amber |
| `disputed` | ≥ 1 independent source actively refutes | 🔴 red |
| `unverified` | 0 corroborating sources; not yet refuted | ⚪ gray |

**Hard rule:** `verified` is NEVER assigned silently. Verdict can downgrade. Verdict never upgrades without re-running cross-source match.

---

## Publisher trust score (PENDING build)

Per publisher, rolling weekly:

| Signal | Weight |
|---|---:|
| Verified verdict rate (publisher's articles → verified) | +1.0 |
| Disputed verdict rate | -2.0 |
| User 👎 rate per publisher | -0.5 |
| Per-article dead-link rate | -0.5 |
| Cloudflare-block rate (we can't ingest reliably) | -0.3 |
| Vernacular publisher in underserved language | +0.5 (community service bonus) |

Score clamped to [0, 100]. Surfaced on every card. PENDING build per [SHIP #11](../SHIP.md).

---

## Trust drift handling

When a verdict drifts `verified` → `disputed` (a new source refutes):
1. Trust Strip re-renders immediately on next feed query
2. Users who saved the article see a verdict-history badge
3. Founder dashboard alert on any high-importance verdict drift

---

## What we will never do

| | |
|---|---|
| 🚫 | Show `verified` without listing the corroborating sources |
| 🚫 | Hide `disputed` verdict because publisher is high-trust |
| 🚫 | Auto-upgrade `unverified` to `verified` over time |
| 🚫 | Aggregate trust score across users (trust is per-source, not per-reader) |

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
