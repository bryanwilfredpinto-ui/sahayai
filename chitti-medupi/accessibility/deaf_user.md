CEOS Level 12 — Accessibility: Deaf User

Authored 2026-06-06

> The deaf user must get **everything** the spoken interface gives — as visible
> captions and symbols. No MedUPI signal is audio-only. Every 🔊 has a printed
> twin; every risk band carries a symbol **and** a word, never a colour alone.

Companion docs: [blind_user.md](blind_user.md) · [mute_user.md](mute_user.md) · [illiterate_user.md](illiterate_user.md) · [../evals/accessibility_eval.md](../evals/accessibility_eval.md) · SAHAYAI_MASTER §7.

---

## 1. The §7 requirement

> Deaf users: **Visible captions + symbols, never audio-only.** Full visual interface; no audio dependency.

---

## 2. How MedUPI meets it

| Need | MedUPI implementation |
|---|---|
| Read what would be spoken | `caption_en` / `caption_hi` printed next to every 🔊 (e.g. wallet card: *"This month: ₹X spent · ₹Y saved"*) |
| See the risk band as symbol + word | ⛔ HIGH RISK · ⚠️ MEDIUM RISK · ✅ LOW RISK — `SYMBOL` + `LABEL_EN/HI`, never the colour alone |
| See expiry urgency without sound | ❌ EXPIRED · ⚠️ EXPIRING SOON · ⏰ EXPIRING · ✅ OK (`_BUCKET_BADGE`) with day counts |
| See freshness of live prices | freshness pill: emoji + colour + **text** (*"stale — pulled 8 days ago"*) |
| ISL panel | per-response ISL animation panel via `chitti_a11y.js` (Phase 1 honest placeholder animations; tap-word modal) |
| No audio-only errors | every error is printed (*"Image recognition not configured — type the name"*) in EN+HI |

The **never-colour-only** rule is the spine here: every status carries symbol OR text (usually both), so a deaf user with colour-vision differences still parses it.

---

## 3. Failure modes to prevent (each a defect)

- A risk banner distinguished only by red/amber/green with no symbol or word.
- A "stale price" or "expiring" signal conveyed by colour alone.
- An audio confirmation (e.g. action success) with no on-screen caption.
- An ISL panel missing on a response box.

---

## 4. Verification evidence

- `tools/medupi_a11y.mjs` → `tools/medupi_a11y_result.json`: **deaf profile = 0 axe violations, 0 serious/critical, 0 page errors**; **isl profile = 0** likewise.
- Named check #12 (colour-not-sole-indicator) PASS — *"2 word/symbol labels accompany status colours."*
- `tools/medupi_lang26.mjs`: captions render correctly across all 26 languages (26/26 pass), so the printed twin of every speak is localised, not English-only.
