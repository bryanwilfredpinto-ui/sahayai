🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# Quality Dashboard — one screen, the guardian's vitals

> Subordinate to [../OBSERVABILITY.md](../OBSERVABILITY.md). The dashboard is the single Vaani/CTO-inbox surface that rolls up [metrics.md](metrics.md) + [logs.md](logs.md) + [feedback.md](feedback.md).
> **Status: 🔵 PENDING** — all tiles read PENDING until production data flows (BO11/BO12).

---

## Layout (priority order — safety on top)

### Tile 1 — Safety vitals (red if any breach)
| Vital | Target | Now |
|---|---|---|
| Stopless signals (24h) | 0 | 🔵 PENDING |
| Crisis redirects fired / crisis turns | 100% | 🔵 PENDING |
| Crisis turns that touched LLM | 0 | 🔵 PENDING |
| NOT-SEBI present rate | 100% | 🔵 PENDING |
| Loss-spiral cool-downs engaged | 100% of triggers | 🔵 PENDING |

### Tile 2 — Honesty vitals
| Vital | Target | Now |
|---|---|---|
| Hallucination rate | < 1% | 🔵 PENDING |
| Fabricated accuracy % | 0 | 🔵 PENDING |
| Engine↔narration drift | 0 | 🔵 PENDING |

### Tile 3 — Coverage & accessibility
| Vital | Target | Now |
|---|---|---|
| Languages live | 26/26 | 🔵 PENDING |
| Four-channel complete rate | 100% | 🔵 PENDING |
| axe-core serious findings | 0 | 🔵 PENDING |

### Tile 4 — Guardian usage (honest, not engagement-maxed)
| Vital | Healthy | Now |
|---|---|---|
| Tip Shield invocations | up = guardian used | 🔵 PENDING |
| Scam tips flagged | tracked | 🔵 PENDING |
| Signals "urged" | 0 | 🔵 PENDING |

### Tile 5 — Feedback pulse
| Vital | Now |
|---|---|
| 👍 / 👎 per box (top failing box) | 🔵 PENDING |
| 👎 on verdict boxes → triage queue | 🔵 PENDING |

## Reporting cadence

- **Daily** founder report (07:00 IST) — Founder report substrate ([chitti_quality_v2]).
- **Weekly** quality roll-up (Sun 08:00 IST).
- **Hourly :15** escalator for SEV-1 safety vitals.
- Delivered to **Vaani / CTO inbox**, never mid-session chat ([chitti_cto_autonomous_mode]).

## Alerting

- SEV-1 (stopless signal · crisis LLM leak · fabricated accuracy %) → page immediately.
- SEV-2 (axe regression · language drop · four-channel gap) → next daily report.

Cross-links: [../QUALITY.md](../QUALITY.md) (the gate targets these tiles enforce) · [../evals/RESULTS.md](../evals/RESULTS.md).

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
