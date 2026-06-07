# Accessibility — Blind user (voice-first)

**Promise:** a notice the user cannot read is a notice Chitti reads aloud.

- Voice-first: every result has a 🔊 "Read this aloud" button; the first result
  auto-reads when the disability profile marks the user blind/illiterate.
- Skip-to-content link; single `<h1>`; landmark roles; `role=tab`/`tabpanel`; managed
  focus to the active panel heading; visible `:focus-visible` ring.
- `aria-live="polite"` on every result host so screen readers announce results.
- No visual-only errors — every status carries a spoken word, not just colour.
- Voice cascade via `window.Chitti.a11y.speak()` (Voice Factory, 26 languages).

Verified by `tools/cert_legal_os.mjs` (auto-read, speak-btn present, aria-live ≥8, axe 0).
