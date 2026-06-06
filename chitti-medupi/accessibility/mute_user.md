CEOS Level 12 — Accessibility: Mute User

Authored 2026-06-06

> The mute user must complete **every** MedUPI flow without ever speaking. Voice
> input is an option, never a requirement — there is always a tap, a typed
> field, a file picker, or a Next/Skip button for the same outcome.

Companion docs: [blind_user.md](blind_user.md) · [deaf_user.md](deaf_user.md) · [illiterate_user.md](illiterate_user.md) · [../evals/accessibility_eval.md](../evals/accessibility_eval.md) · SAHAYAI_MASTER §7 + Golden Rule (mute-safe confirm).

---

## 1. The §7 requirement

> Mute users: **Buttons + sliders + Next/Skip, no voice required.** Text/gesture input only; every action reachable without speech.

---

## 2. How MedUPI meets it

| Need | MedUPI implementation |
|---|---|
| Find a medicine without speaking | typed search bar → `recognise_text` (the mic is optional, never required) |
| Scan a strip without speaking | **file picker / camera capture** → `recognise_image` (image path needs no voice) |
| Confirm an action without speaking | `chittiConfirmAndDo()` Yes/No modal is **tap-OR-voice** — silence waits, never times into Yes |
| Manage the family wallet | add profile / log purchase / set reminder all via buttons + typed fields (`medupi_family.py`, `medupi_reminders.py`) |
| Give feedback | per-response 👍/👎 tap; the feedback window accepts **typed** text, not only voice |
| Advance any demo/flow | Next / Skip buttons (no voice-advance dependency) |

Crucially, the Golden Rule confirmation is explicitly **mute-safe**: every side-effecting action (wallet write, reminder, price alert) can be approved by a tap. There is no voice-only gate anywhere in the product.

---

## 3. Failure modes to prevent (each a defect)

- Any flow that can only be advanced by speaking.
- A confirmation modal that only accepts a voice "haan."
- A scan path that requires a spoken trigger (must work from the file/camera button).
- A feedback box that records voice only and has no text field.

---

## 4. Verification evidence

- `tools/medupi_a11y.mjs` → `tools/medupi_a11y_result.json`: **mute profile = 0 axe violations, 0 serious/critical, 0 page errors.**
- 48×48dp minimum touch targets (CONTEXT §"Android Accessibility Compliance") verified in the a11y harness — every button is tappable.
- Real-hardware sign-off (complete a scan → see alternatives → log a wallet entry → confirm by tap, zero speech) is reserved for Sire's iPhone/Android pass.
