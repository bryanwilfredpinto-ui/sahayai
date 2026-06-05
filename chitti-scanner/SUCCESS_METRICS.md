🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# SUCCESS_METRICS — Chitti Universal Scanner

> Numbers are **measured, never claimed.** Until the labelled router-eval set runs, every
> bar below is a *target*, and the observability dashboard says so honestly.

## North-star metric

**Correct-route rate from a cold first scan** — for a brand-new user who scanned one thing
and chose no product, did Chitti send it to the right specialist Chitti?

## Primary metrics

| # | Metric | Target | Source |
|---|---|---|---|
| 1 | **Router accuracy** (scan → correct specialist) | ≥ 95% | [evals/router_accuracy.md](evals/router_accuracy.md) |
| 2 | **Wrong-routing rate** (sent to the *wrong* Chitti) | < 1% | [evals/wrong_routing.md](evals/wrong_routing.md) |
| 3 | **Honest-unknown rate** (low confidence correctly surfaced as `unknown`, not guessed) | 100% of low-confidence cases | [evals/trust_eval.md](evals/trust_eval.md) |
| 4 | **Accessibility pass** (all 4 users complete a scan→route→hear flow) | 100% | [evals/accessibility_eval.md](evals/accessibility_eval.md) |
| 5 | **Safety critical failures** (diagnosis leaked, cop auto-dialed, unsafe action) | 0 | [evals/safety_eval.md](evals/safety_eval.md) |

## Supporting telemetry (per [observability/metrics.md](observability/metrics.md))

```
scans_per_day:
successful_routes:
failed_routes:
coming_soon_routes:        # honest — category detected but specialist not built
thumbs_up:
thumbs_down:
hallucinations:
safety_vetoes:
confidence_distribution:   # histogram; watch the low-confidence tail
handoff_clickthrough:      # did the user accept the routed Chitti?
memory_recall_used:        # Universal Memory / "when did I scan this?"
```

## Per-user-archetype success (the floor — must all hit ≥ 95%)

| User | Success means |
|---|---|
| 👁️ Blind | Completed scan → route → heard the result, with zero reading |
| 🦻 Deaf | Got caption + symbol + ISL on every routed result |
| 🤫 Mute | Completed the whole flow by tap / camera, voice never required |
| 📖 Illiterate | Picture menus + voice-everything; understood where Chitti routed |

## Trust metrics (the Trust Layer is a first-class product surface)

- **Explainability click-through** — % of users who tapped 🤖 "why did Chitti route here"
  and were satisfied (👍 on the explanation box).
- **Confidence calibration** — when Chitti said "97% sure", was it right ~97% of the time?
  (Over-confidence is a defect; the Trust agent in the swarm exists to catch it.)

## Anti-metrics (we do NOT optimize for these)

- Engagement / session length (Founder Rule: trust over virality).
- Scans-per-user as a vanity number — a user who scanned once and got the right answer is a
  **success**, not a churn risk.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
