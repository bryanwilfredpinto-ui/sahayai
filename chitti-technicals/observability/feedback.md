🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# Feedback — per-response 👍/👎, never page-footer

> Subordinate to [../OBSERVABILITY.md](../OBSERVABILITY.md) and [../CONSTITUTION.md](../CONSTITUTION.md) Article 12 ("Every Box Carries the Widget").
> **Status: 🔵 PENDING** — widget wiring lands in BO10; no feedback collected yet.

---

## The per-response widget (locked, never page-footer)

Every response box on the page carries the per-response widget via `feedback-widget.js` + `data-chitti-response` ([per_response_widget_locked]):

| Icon | Action | Accessibility note |
|---|---|---|
| 🔊 | read this box aloud | the blind user's primary channel |
| 🤖 | ask Chitti to explain this box | tap-to-explain (Danelfin pattern) |
| 👍 | this read helped | logged per box id |
| 👎 | this read was wrong/confusing | logged per box id → triage |
| ✏️🎙️ | type **or voice** feedback, tagged to the box | mute users type; illiterate users speak |

The widget is **per-box, not page-footer** — a tool with a verdict box, a confluence box, a Tip-Shield box, and a journal box needs to know *which* box failed.

## What feedback feeds

1. **Daily Founder dashboard** — 👍/👎 per box id, aggregated ([per_response_widget_locked]).
2. **Swarm learning** — anonymised 👍/👎 patterns; a 👎→👍 reversal or high-👍 phrasing can (after ≥100 confirmations, HIGH-risk human review for a financial product) push to `skills/*.md` (swarm lock).
3. **Quality triage** — a 👎 on a *verdict* box is a possible hallucination/accuracy issue → cross-checked against [logs.md](logs.md) narration drift.

## Accessibility of the feedback path itself

The feedback widget must itself pass the four-channel floor (Article 2):
- keyboard-operable (motor archetype),
- voice-input path (mute can't speak → types; illiterate can't type → speaks),
- icons paired with labels (not colour-only),
- reachable by screen reader with `aria-label`.

This is asserted in [../evals/accessibility_eval.md](../evals/accessibility_eval.md).

## Privacy

- Per-user feedback is **never synced to a backend without consent** (mirrors Chitti News For-You: profile stays local).
- Only anonymised, aggregated signals reach swarm/founder dashboards.
- "Chitti forget" purges the user's feedback trail.

## Status

| Item | Status |
|---|---|
| `feedback-widget.js` + `data-chitti-response` on every box | 🔵 PENDING (BO10) |
| Voice + type feedback path | 🔵 PENDING |
| Daily founder aggregation | 🔵 PENDING |
| Swarm intake (anonymised) | 🔵 PENDING |

Cross-links: [metrics.md](metrics.md) · [quality_dashboard.md](quality_dashboard.md) · [../QUALITY_GATES.md](../QUALITY_GATES.md) (widget is a frontend gate).

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
