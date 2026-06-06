CEOS Level 12 — Accessibility: Blind User

Authored 2026-06-06

> The blind user is a **first-class** MedUPI user. A medicine-cost tool that
> hides the price in an image is useless to her — and she is often the family
> member managing chronic care. Every price, every risk band, every saving is
> spoken; nothing is locked in a visual.

Companion docs: [deaf_user.md](deaf_user.md) · [mute_user.md](mute_user.md) · [illiterate_user.md](illiterate_user.md) · [../evals/accessibility_eval.md](../evals/accessibility_eval.md) · SAHAYAI_MASTER §7 + §5c (BLIND P0: every error spoken).

---

## 1. The §7 requirement

> Blind users: **Voice IN + Voice OUT, no visual-only signal.** Full TalkBack/screen-reader navigation; every error spoken; no information locked in an image.

---

## 2. How MedUPI meets it

| Need | MedUPI implementation |
|---|---|
| Search by voice | 🎤 mic on the Scan/Compare search bar → `recognise_text` |
| Hear every result | `speak_en` / `speak_hi` in **every** API response (`recognise_text`, `recognise_image`, `wallet_report`, `expiry_summary`) |
| Hear the price + saving | savings card speaks *"Save about {N} percent with the same-composition alternative"* (`_savings_summary`) |
| Hear the risk **before** acting | the risk banner **auto-speaks**; HIGH-risk reads the ⛔ doctor warning (`WARNING_TEXT_EN/HI`) |
| Hear the wallet | `wallet_report.speak_en/hi` — *"This month you saved ₹Y…"* |
| Hear expiries | `expiry_summary.spoken_summary_en/hi` — *"1 medicine expiring this week"* |
| Navigate the page | auto-announce on open; every response box has 🔊; `chitti_a11y.js` read-page + `aria-live` region |
| Hear every error | *"Image recognition not configured — please type the medicine name"* spoken in EN+HI (never a silent/visual-only failure) |

The per-response widget's 🔊 lets her replay any box; the Disability Profile (set once, never re-asked) marks her as a voice-first user across every Chitti on the device.

---

## 3. Failure modes to prevent (each a defect)

- A price, risk class, or saving shown but **not** spoken.
- A scan result whose extracted fields have no spoken read-back.
- An error (no DB match, vision unavailable, Brave quota) shown only as text/colour.
- A risk banner that requires sight to notice (must auto-speak).

---

## 4. Verification evidence

- `tools/medupi_a11y.mjs` → `tools/medupi_a11y_result.json`: **blind profile = 0 axe violations, 0 serious/critical, 0 page errors.**
- Named check #12 (colour-not-sole-indicator) PASS; #13 (axe WCAG2A/AA 0 serious) PASS.
- Real-hardware TalkBack pass (first-visit Disability Profile → search a medicine by voice → hear alternatives + risk + saving → hear the wallet) is the one slice reserved for Sire's iPhone/Android sign-off.
