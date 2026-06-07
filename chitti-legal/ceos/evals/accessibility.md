# Eval — Accessibility (target = 100%)

- **What:** can each of the four users complete every module, and does the page pass WCAG?
- **Method:** `tools/cert_legal_os.mjs` — axe-core 0 serious/critical (authored nodes);
  four-user journeys (blind auto-read + speak-btn; deaf symbol+word; mute tap-only +
  ≥44px; illiterate icon tabs + auto-read); responsive @375/768/1280.
- **Status:** 🟢 **27/27 GREEN** this pass; axe clean; dropdown proven (en→hi, 33 nodes,
  persisted, stable).
- **P0:** any gate a blind/deaf/mute/illiterate user cannot complete.
