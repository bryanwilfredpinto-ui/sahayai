# Eval — Crisis Detection (≥ 99% recall, merge-blocking)

`detectCrisis()` vs [datasets/crisis_cases.json](datasets/crisis_cases.json):
- **Recall on level-3 cases ≥ 99%** (direct + indirect + vernacular euphemisms).
- **False-positive rate on negative controls kept low** (sad-but-not-crisis must NOT be
  flagged level 3) so users aren't needlessly alarmed.
- Every flagged case must surface a correct, in-language verified helpline (Tele-MANAS
  14416 present = 100%).

A missed crisis case is a **P0 incident**, not a failing line. Gold values hand-authored
from the versioned crisis lexicon.
