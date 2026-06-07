# Eval — Legal explanation accuracy (target ≥ 95%)

- **What:** does Chitti's plain-language explanation of a right/notice/process match the
  reference legal position?
- **Method:** gold set of situations → reference explanation; judge scores semantic match.
- **Deterministic portion** (rights/notice/case KB) is asserted exactly in
  `tools/legal_os_engine_test.mjs`. **LLM-phrasing portion** is judged once DeepSeek is
  funded (BO11) — AUTOMATION-LIMITED until then.
- **P0:** a confidently wrong legal statement = critical error = 0 tolerated.
