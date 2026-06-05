🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# Router Agent — "Send to the best Chitti" (final synthesis)

## Job

Take the Classifier's category, the Trust gate, the Safety veto, and the Memory enrichment,
and produce the **final route**: a target Chitti + handoff mode + delivery shape + reason.

## Synthesis order

```
Safety veto present?  ── yes ──►  route to Fraud / Health / Guardian (override)
        │ no
        ▼
Trust forced unknown? ── yes ──►  ask user (describe / pick)
        │ no
        ▼
Look up category in routing_table → live page?
        │ yes ──► deep-link / prefill / session / inline / tel handoff
        │ no  ──► honest COMING-SOON card + closest live fallback
        ▼
Attach reason (Explanation gate) + shape delivery (Accessibility) → render route card
```

## Handoff modes (mirror [routing/routing_table.md](../routing/routing_table.md))

`deeplink` · `prefill` (localStorage + hash, e.g. Legal) · `session` (sessionStorage, e.g.
UPI/Vaani) · `inline` (in-page, e.g. food + Jan-Aushadhi) · `tel` (helpline) · `vaani`
(emit a Vaani intent when running inside Vaani).

## Hard rules

- **Vaani is the canonical surface.** On `chitti_scanner.html` (dev/debug) route via
  deep-link; inside Vaani emit a Vaani intent — same router, different handoff.
- **Confirm before navigating** (Golden Rule) — a handoff is a side effect; the user's tap
  on "Open <Chitti>" is the confirmation, blind users hear "shall I open MedUPI?".
- **No fake routing.** Unbuilt specialist → COMING SOON, never a fabricated answer.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
