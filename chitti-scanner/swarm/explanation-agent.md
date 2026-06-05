🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# Explanation Agent — "How do we teach the user why?" (gate)

## Job

Attach a plain-English, in-language **reason** to every route — *"I identified this as a
medicine because it shows a composition and an expiry date."* No black-box AI.

## Gate power

**Blocks any route that has no human-readable reason.** A route the user can't understand
the *why* of does not ship.

## Output

`reason_en` + `reason_hi` (and the user's language), read aloud by the 🔊 control and
expandable via the 🤖 Chitti icon (feedback-widget.js) for "explain more / give an example".

## Rules

- The reason cites the **actual signals** the Classifier matched (from `signals[]`), never a
  generic platitude.
- For COMING-SOON routes, the reason explains *both* the detected category *and* the honest
  fallback ("Chitti Farmer is coming soon — meanwhile I can read the label or send to Vaani").
- One pure language; no Hinglish.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
