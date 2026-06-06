🎖️ World Class Chitti CA OS — Commando Discipline. Zero Excuses.

# EVAL — Tax accuracy (≥95%)

Gold cases hand-computed from FY24-25 / FY25-26 rule tables, asserted in
`tools/ca_os_engine_test.mjs` against `incomeTax()` / `capitalGains()`.

| Case | Input | Gold | 
|---|---|---|
| New regime FY25-26, ₹12L salary | std-ded ₹75k, slabs, 87A | exact ₹ to the rupee |
| Old regime, ₹12L − 80C ₹1.5L − 80D ₹25k | slabs + cess 4% | exact ₹ |
| Regime crossover | which regime is cheaper | correct recommendation |
| LTCG equity ₹3L | exempt ₹1.25L, 12.5% on rest | exact ₹ |
| Rebate 87A boundary (7L new / 5L old) | tax = 0 | correct |

Pass = every gold figure matches to the rupee AND result carries `confidence`/`risks`/
`sources`. A mismatch is a P0 (HIGH-risk money math).

---
> **World Class Chitti CA OS — Commando Discipline. Zero Excuses.**
