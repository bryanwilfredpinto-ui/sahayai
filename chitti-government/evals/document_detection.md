# EVAL — Document detection (gate: 95%)

**Claim:** Chitti correctly identifies which documents a citizen has vs needs, and the
unlock value of each missing document.

## Two paths
1. **Declare path (live):** citizen taps the documents they hold → engine computes
   `have/missing/unknown` per scheme + `unlock_map`. Eval: gold `{twin.documents,
   scheme} → expected gap`. Pass = 95% correct gap.
2. **Scan path (Universal Scanner, when vision funded):** image → document type. Eval
   against labelled document images; until the vision key is funded this path returns
   honest `pick_or_describe`, never a fabricated type.

## Dataset
[datasets/document_cases.json](datasets/document_cases.json).
