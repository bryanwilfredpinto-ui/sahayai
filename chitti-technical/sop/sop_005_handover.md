# SOP-005 — Handover protocol

1. Run ALL harnesses yourself: `node tools/test_technical.mjs` (logic), `node tools/cert_technical.mjs`
   (Playwright + axe + 375/768/1280 + 9-lang flip + live), `node tools/test_nifty50_live.mjs` (real symbols).
2. Fill `HANDOVER/08_FINAL_HANDOVER.md` — every section with **measured** results, **0 placeholders**.
   Anything not run is marked PENDING (never GREEN); real-device-only items are flagged as Sire's slot.
3. CEOS L0–L12 doc check must pass; 28-deliverable checklist must be complete.
4. Critical bugs = 0, High bugs = 0 to hand over. Known issues documented honestly.
5. Self-sign as QE + Architect; leave the Product-Owner sign-off for Sire's real-device test.
6. Never ask Sire to test what could be automated.
