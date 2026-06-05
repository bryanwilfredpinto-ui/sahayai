🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# PRD — Chitti Universal Scanner

> Product requirements for the CEOS detection + routing + memory layer added on top of the
> existing label-reader. Subordinate to [CONSTITUTION.md](CONSTITUTION.md) and
> [ROLE.md](ROLE.md). Each feature carries: user story · UX flow · failure modes · evals.

## F1 — Universal Detection (deterministic)

- **Story:** As any user, I scan/type a thing and Chitti tells me *what category* it is,
  honestly, with a confidence I can trust.
- **UX:** After analyse, a **🧭 What Chitti sees** line: category + confidence + (if low)
  "I'm not sure — describe or pick".
- **Failure modes:** low confidence → `unknown` (never guess); conflicting signals →
  present top-2; backend offline → keyword router from typed text.
- **Evals:** [evals/router_accuracy.md](evals/router_accuracy.md), [evals/trust_eval.md](evals/trust_eval.md).

## F2 — Universal Routing (the hero)

- **Story:** As a user who doesn't know which Chitti to open, I get sent to the right
  specialist automatically, with a one-tap deep-link.
- **UX:** A **🧭 Chitti is sending this to …** card under the result: specialist name +
  emoji + reason + a "Open <Chitti>" button + a "wrong? pick another" correction.
- **Failure modes:** specialist not built → honest **COMING SOON** card + real fallback;
  safety signal → Fraud/Guardian wins over commerce.
- **Evals:** [evals/router_accuracy.md](evals/router_accuracy.md), [evals/wrong_routing.md](evals/wrong_routing.md), [evals/safety_eval.md](evals/safety_eval.md).

## F3 — Explanation Layer (no black box)

- **Story:** As a user, I can ask *why* Chitti routed here.
- **UX:** Every route card + result box carries the 🤖 icon (feedback-widget.js). The route
  card shows the plain-English `reason` string; 🤖 opens scoped Chitti for "explain more".
- **Failure modes:** a route with no reason is **blocked** (Explanation agent gate).
- **Evals:** explainability click-through + 👍 on the explanation box.

## F4 — Universal Memory / Life Twin (local-first)

- **Story:** As Priya the caregiver, every scan becomes a remembered life event I can recall
  ("when did I scan this medicine? when does it expire?").
- **UX:** The existing **Recent scans** section becomes a **Memory timeline**: category icon,
  date, summary, "Hear", and (where present) an expiry/renewal date chip.
- **Failure modes:** storage blocked → in-session only + honest notice; never silent loss.
- **Persistence:** **local-first only.** Cross-device sync is **COMING SOON** — gated on the
  Turso shim RED item ([CEOS_ARCHITECTURE.md](CEOS_ARCHITECTURE.md)).
- **Evals:** memory-recall-used telemetry.

## F5 — Family Knowledge Graph (COMING SOON, honest stub)

- **Story:** "Show everything expiring in the next 30 days" across the whole family.
- **UX:** A **👨‍👩‍👧 Family Graph** card that today shows the *local* linked entities and a
  visible **COMING SOON** badge for cross-device + predictive reminders.
- **Why stubbed:** needs verified backend persistence (RED item). No fake graph ever.

## F6 — Predictive reminders (COMING SOON)

- Medicine / insurance / warranty / service expiry → proactive reminder.
- Gated on F4 cross-device + F5; surfaced as a visible COMING SOON, never silently absent.

## F7 — Accessibility (the floor, inherited)

- Voice-guided capture (blind); caption + symbol + ISL on every route card (deaf);
  tap/camera-only flow (mute); picture menu for category pick (illiterate). All via
  `chitti_a11y.js` + `feedback-widget.js`. See [accessibility/](accessibility/).

## Non-functional requirements

- **Deterministic core works offline** (no vision spend for the text/type path).
- **375px mobile = 100%** (CTO visual cert).
- **5 frontend gates** inherited via substrate (G1–G5).
- **Golden-Rule confirm** on every side effect (camera, handoff, helpline, memory write).
- **One pure language** per response; no Hinglish.

## Out of scope (v1)

- Real-time camera object auto-detect of arbitrary objects (needs funded vision LLM).
- Cross-device Family Graph + predictive reminders (needs verified persistence).
- OBD / NFC / sensor capture (Level 12 "multi-modal" — roadmap).

## Rollback

Feature-flag `window.CHITTI_SCANNER_ROUTER`. Off → the page reverts to the certified
label-reader; router/memory cards simply don't render. No data migration, no gate regression.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
