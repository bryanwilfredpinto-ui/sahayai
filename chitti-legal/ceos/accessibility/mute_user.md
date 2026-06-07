# Accessibility — Mute user (tap-first)

**Promise:** every action is reachable without speaking.

- Full tap-only path: chips, buttons, selects and date pickers for all input — no step
  requires voice.
- Tap targets ≥44px (header, tabs, chips, buttons, selects) — verified in cert.
- The Golden-Rule confirm gate (for any future side-effecting action) exposes Yes/No
  buttons, never voice-only ([SAHAYAI_MASTER §2g](../../../SAHAYAI_MASTER.md)).

Verified by `tools/cert_legal_os.mjs` (tap-only journeys + tap-target ≥44px assert).
