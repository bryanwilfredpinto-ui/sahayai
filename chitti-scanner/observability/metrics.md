🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# observability/metrics.md — Level 10

> What the CEO dashboard tracks. Every number is honest; "not measured yet" is a valid state.

```
scans_per_day:
successful_routes:          # routed to a correct live specialist
coming_soon_routes:         # category detected, specialist not built (honest)
unknown_routes:             # low confidence, asked the user (honest, safe)
failed_routes:              # error / backend down
wrong_routes:               # routed to the wrong live specialist (target < 1%)
thumbs_up / thumbs_down:    # per route card + per result box
hallucinations:             # detected fabrications (target < 1%)
safety_vetoes:              # Safety agent overrode a route
confidence_distribution:    # histogram; watch the low tail + calibration
handoff_clickthrough:       # did the user accept "Open <Chitti>"?
memory_recall_used:         # Universal Memory queries
co2_g_per_scan:             # carbon (deterministic core ≈ 0 model spend)
```

## Per-category breakdown

Each metric sliced by category (medicine / vehicle / fraud / …) so a regression in one route
is visible without averaging it away.

## Trust signals on the page (inherited, [§6 part 7](../../SAHAYAI_MASTER.md))

Risk badge · CO₂/reply · last audit date · "helped today" — rendered by `feedback-widget.js`.

## Honest note

Remote telemetry is **opt-in** (`OBS_REMOTE` / `window.CHITTI_OBS_API`) — the badge runs
100% locally otherwise (fleet-wide fix from the 2026-06-04 Mechanic QA pass). No cross-origin
POST to a backend that lacks a CORS header.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
