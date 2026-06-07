# Accessibility — Deaf user (visual + text + ISL)

**Promise:** nothing is audio-only.

- Every result is **text + symbol + WORD** (`.res-status` shows ✅ Good / ⚠️ Check this /
  ℹ️ Note) — never colour-only, never audio-only.
- Visual result cards with clear headings, lists and provenance lines.
- ISL panel + tap-word-to-sign injected by `chitti_a11y.js` next to every
  `data-chitti-response` box (ISL Phase 1; camera detection = Phase 2 future).
- Captions/transcripts for any future voice content.

Verified by `tools/cert_legal_os.mjs` (symbol+word status assert, ISL gate, data-chitti-response on every card).
