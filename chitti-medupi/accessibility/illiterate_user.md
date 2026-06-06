CEOS Level 12 — Accessibility: Illiterate / Low-Literacy User

Authored 2026-06-06

> The low-literacy user is MedUPI's **primary archetype** — the Tier-2/3 family
> caregiver buying medicines on a fixed budget. The product is voice-everything,
> picture-menus, large fonts, and plain Hindi-first language, so that someone who
> cannot read a chemist's bill can still find the cheaper same-composition option.

Companion docs: [blind_user.md](blind_user.md) · [deaf_user.md](deaf_user.md) · [mute_user.md](mute_user.md) · [../evals/accessibility_eval.md](../evals/accessibility_eval.md) · SAHAYAI_MASTER §7 · CHITTI_SOP §2 (primary user).

---

## 1. The §7 requirement

> Illiterate / low-literacy users: **Plain-language symbols + large fonts + Hindi UI.** Picture menus + voice-everything; numbers and jargon replaced by pictograms and spoken plain language wherever possible.

---

## 2. How MedUPI meets it

| Need | MedUPI implementation |
|---|---|
| Read nothing, hear everything | `speak_en` / `speak_hi` on every result; auto-read on first visit for voice-first users |
| Hindi-first (and 24 more) | `_chittiLang` EN↔हिं toggle; substrate covers **26 languages** (`tools/medupi_lang26.mjs`) |
| Understand *what a medicine is for* | `purpose_en` / `purpose_hi` on every medicine — plain words, not a salt string |
| Read risk without literacy | symbol-led banners ⛔ / ⚠️ / ✅ with a spoken explanation, not a paragraph |
| Read savings without numbers-literacy | savings card speaks the percent + shows a pictographic ₹ comparison, not a dense table |
| Larger text | large-font option in Settings; high-contrast support; 48×48dp targets |
| Picture menus | Scan (camera) / Compare (search) / Health File tabs are icon-led, not text-only |

The strip-scan path is the killer flow for this user: **point the camera at the strip → hear the cheaper option** — no reading, no typing, no bill-deciphering.

---

## 3. Failure modes to prevent (each a defect)

- A medicine shown by salt string with no `purpose_hi` plain-language gloss.
- A risk or saving conveyed only as English text or a number with no spoken/pictographic form.
- A menu that is text-only with no icon.
- A flow that assumes the user can read the chemist's English bill.

---

## 4. Verification evidence

- `tools/medupi_a11y.mjs` → `tools/medupi_a11y_result.json`: **illiterate profile = 0 axe violations, 0 serious/critical, 0 page errors**; **elderly + cognitive profiles = 0** likewise.
- `tools/medupi_lang26.mjs` → `tools/medupi_lang26_result.json`: **26/26 languages pass at 99% coverage**, so the Hindi-first (and regional) UI is real, not a stub.
- Real-hardware sign-off (a Hindi-only, voice-first run: scan a strip → hear the cheaper Jan Aushadhi option → hear the saving, with no reading) is reserved for Sire's iPhone/Android pass.
