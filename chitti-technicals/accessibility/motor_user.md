🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# ACCESSIBILITY — Motor User (Persona: Arjun, ~1.5 crore Indians)

> Limited hand use — tremor (Parkinson's), partial paralysis, one-handed use, arthritis, or a single
> switch. Tiny tap targets and **drag-to-zoom / pinch charts** are unusable for him. The fix is **big
> targets, a full keyboard path, no drag-required gesture, and voice as an always-available
> alternative.** Implements [CONSTITUTION.md](CONSTITUTION.md) Art. 1–2 and [ACCESSIBILITY.md](../ACCESSIBILITY.md).

## What he needs
- **Large tap targets (≥48px)** with generous spacing — tremor causes mis-taps on small buttons.
- A **full keyboard / switch path** — every action reachable by Tab/Enter, none mouse-or-drag-only.
- **No gesture that requires drag, pinch, or precise swipe** to get the verdict (WCAG 2.5.1 single-pointer).
- **Voice as an alternative** to tapping, and **no time limits** on input (WCAG 2.2.1).

## How Chitti Technicals serves him
| Need | Implementation |
|---|---|
| Large targets | All controls ≥48px with spacing; verdict card, Tip Shield, widget icons sized for tremor |
| Full keyboard path | Skip-link · `role=tab` nav · visible focus ring · logical focus order (BO1); every action Tab+Enter reachable |
| No drag required | The chart's value is in the **spoken summary + data table**, not a pinch-zoom canvas; no verdict is locked behind a gesture (WCAG 2.5.1) |
| Voice alternative | He can speak instead of tap; mute users tap instead of speak — **both paths always exist** |
| No time limits | Confirm-gate (`chittiConfirmAndDo()`) **waits forever** — silence = wait, never times out (Golden Rule) |
| Tap-or-voice confirm | Side-effects confirmable by a single large tap OR voice — never a precise drag |

## Failure modes to prevent
- Tap targets under 48px or crowded together → mis-taps under tremor → defect.
- A verdict / zoom / feature reachable **only** by drag, pinch, or precise swipe → defect (WCAG 2.5.1).
- A control reachable by mouse but **not by keyboard / switch** → defect.
- A confirm that **times out** if he's slow to tap → Golden-Rule violation → defect.
- Hover-only tooltips with no focus/tap equivalent → defect.

## Test procedure (part of [../EVALS.md](../EVALS.md) + BO1/BO11 gate)
**Keyboard-only (no mouse) + simulated tremor (large-target check).** Any language:
1. Tab through the entire flow: pick stock → read verdict → open table → run Tip Shield → submit feedback — all via Tab/Enter.
2. Measure every interactive target ≥48px with adequate spacing.
3. Confirm **no** verdict or feature requires drag/pinch/swipe; the chart's content is in the table + spoken summary.
4. Trigger a side-effect → confirm it accepts a single large tap **and** waits indefinitely (no timeout).
5. Confirm voice is available as an alternative everywhere taps are used.
**Pass = the full flow completes keyboard-only, with ≥48px targets, no drag-required, and no time limit.**

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
