🎖️ World Class Chitti Technicals — Commando Discipline. Zero Excuses.

# ACCESSIBILITY — Mute User (Persona: Imran, ~2 crore Indians)

> The mute / speech-impaired user can hear and read but **cannot speak a command**. A voice-command
> UI silently excludes him. Every microphone must have a **tap/type twin**, and every action Chitti
> takes must be a **draft he approves**, not a thing he had to say out loud. Implements
> [CONSTITUTION.md](CONSTITUTION.md) Art. 1–3 and [ACCESSIBILITY.md](../ACCESSIBILITY.md).

## What he needs
- A non-voice path for **everything** a voice user can do — no feature gated behind "say it."
- To pick a stock by **tapping a list** or typing a symbol, never by speaking.
- Chitti to **draft** the action and let him **approve with a tap** (he cannot say "haan").
- Full output by voice + text — he hears fine; output is not the problem, input is.

## How Chitti Technicals serves him
| Need | Implementation |
|---|---|
| Tap/type twin for every mic | Every 🎙️ button is paired with a tap-list of symbols + a type box; no flow requires speech |
| Pick a stock without speaking | Searchable symbol list (NSE/BSE) + recent/watchlist taps; type "RELIANCE" → result |
| Chitti-drafts-you-approve | Side-effects (set reminder, log paper trade) → Chitti drafts the action, he confirms with a **tap** via `chittiConfirmAndDo()` — the Golden Rule confirm accepts **tap OR voice**, never voice-only (Art. 3) |
| Feedback without voice | ✏️ type-box on every box (`feedback-widget.js`); 👍/👎 are taps |
| Question entry | Type "why sell?" → DeepSeek phrases the deterministic explanation; no spoken question needed |

## Failure modes to prevent
- A confirm dialog that accepts **only spoken "haan"** with no tap-to-confirm → he is locked out → defect.
- Any feature reachable **only** through a voice command (e.g. "say a stock name") → defect.
- A "hold to speak" mic with **no typed alternative** → defect.
- Chitti acting **without** an explicit tap-confirm (auto-logging a trade) → Golden-Rule violation → defect.
- Feedback widget that requires a voice note with no ✏️ type option → defect.

## Test procedure (part of [../EVALS.md](../EVALS.md) + BO4 gate)
**Microphone physically disabled / never used.** Full journey with **zero** speech:
1. Type/tap "RELIANCE" → result renders, verdict spoken + shown.
2. Type "why sell?" → explanation appears, indicator cited.
3. Tap "log paper trade" → Chitti drafts it → **tap** to confirm (`chittiConfirmAndDo()` accepts the tap).
4. Submit 👎 + a typed feedback note via the ✏️ box.
5. Verify **nothing** required speaking and **no** side-effect happened without the explicit tap-confirm.
**Pass = the full flow completes with zero voice required, and every action was tap-approved.**

---
> **World Class Chitti Technicals — Commando Discipline. Zero Excuses.**
