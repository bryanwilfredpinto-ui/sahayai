# SOP-002 — Change the signal / risk engine

1. Change `generateSignal` / `confluenceScore` / `atrRiskBlock` etc. in `chitti_technical_engine.js`.
2. **Guardrail invariant:** every directional signal MUST carry a stop on the correct side; if none, downgrade to HOLD. No stop → no signal.
3. Add/extend node tests: directional→has-stop, opposed-TFs→HOLD, RR floor, no-banned-phrase. Run `node tools/test_technical.mjs` (0 FAIL; stopViolations=0, rrViolations=0).
4. Re-run the Playwright cert (`cert_technical.mjs`) — trade_plan BUY/SELL/TARGET/SL present, live-Angel pipeline green.
5. Update `evals/RESULTS.md` only with measured numbers from this run.
6. Bump engine `VERSION`. Commit via worktree.
