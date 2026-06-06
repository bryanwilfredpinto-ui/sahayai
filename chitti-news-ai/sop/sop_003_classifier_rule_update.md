# SOP-003 — Classifier Rule Update

> Standard Operating Procedure for adding a new profession, or adding/changing
> keywords on an existing profession in the rules-only classifier. End-to-end:
> edit registry → benchmark re-run → CI test → commit.
> Source files: `backend/services/profession_classifier.py`,
> `data/profession_registry.json`, `chitti_coach.js`,
> `backend/tests/test_classifier_sire_worked_examples.py`.

---

## When to invoke this SOP

- A new profession needs to graduate from "Phase 2 dynamic mapping" to "Phase 1 hardcoded Hub" (e.g. unknown-role tracking shows "Pharmacist" requested 500+ times last month).
- An existing profession's F1 drops below 0.85 (classifier regression).
- Sire authors a new keyword based on a swarm-promoted pattern.
- A bug like "cricket-in-business" surfaces (false positives need a context-check rule).

---

## Step 1 — Edit profession_registry.json

File: `chitti-news-ai/data/profession_registry.json`.

Add or modify an entry:

```json
{
  "slug": "pharmacist",
  "label": "Pharmacist",
  "domain": "healthcare",
  "adjacent_domains": ["finance", "ops"],
  "keywords": [
    "pharmacy", "pharmacist", "prescription", "drug interaction",
    "compounding", "dispensing", "B.Pharm", "Pharm.D", "MR",
    "medical representative", "OTC", "schedule H", "schedule X",
    "Jan Aushadhi", "PCI", "pharmacy council", "pharma sales",
    "drug controller", "DCGI", "CDSCO", "GPP", "good pharmacy practice"
  ],
  "source_defaults": {
    "indian-pharma-rss": 0.4,
    "anthropic-blog": 0.0,
    "mit-tech-review-pharma": 0.3
  },
  "context_excludes": [
    {"if_contains": ["cricket", "match", "IPL"], "drop": true}
  ],
  "min_keyword_hits_for_confidence_0_5": 1,
  "added_at": "2026-06-06",
  "added_by": "Sire",
  "issue_ref": "JIRA-1234"
}
```

Rules:
- `domain` MUST be one of the 17 canonical domains (healthcare, finance, legal, etc.).
- `keywords` MUST be at least 15 entries.
- `source_defaults` MUST sum to ≤ 1.0 to avoid source-only confidence inflation.
- `context_excludes` is the regression-protection layer.

---

## Step 2 — Edit chitti_coach.js if Hub goes hardcoded

If the profession is promoting to a Phase 1 hardcoded Hub:

File: `chitti_coach.js`.

Add entries to:

```js
var SKILL_VOCAB = {
  ...
  'pharmacist': ['pharmacology', 'compounding', 'dispensing', 'mrp-calc', 'jan-aushadhi', ...],
  ...
};

var GOAL_VOCAB = {
  ...
  'pharmacist': [
    { v: 'open-jan-aushadhi-store',   t: 'Open a Jan Aushadhi store' },
    { v: 'become-hospital-pharmacist', t: 'Become a hospital pharmacist' },
    { v: 'learn-ai-drug-interactions', t: 'Use AI for drug interaction checks' },
    ...
  ],
  ...
};
```

Add the hub to the 13 → 14 hardcoded list. Update COSDF.md L23 if it's a structural change.

---

## Step 3 — Add fixtures

File: `chitti-news-ai/backend/tests/test_classifier_sire_worked_examples.py`.

Add 8-15 positive fixtures + 5-10 negative fixtures (articles that look pharma-adjacent but should NOT classify, e.g. cosmetic pharmacy ads).

```python
PHARMACIST_FIXTURES = [
    ("Drug Controller General clears AI-based prescription audit tool",  "pharmacist", 0.85),
    ("New schedule-H amendment for AI-driven dispensing",                "pharmacist", 0.90),
    ("Jan Aushadhi expansion plan announced",                            "pharmacist", 0.75),
    # ... 5+ more positives
    ("MakeUp ad in pharmacy section of supermarket",                     "none",        0.30),  # negative
    # ... 2+ more negatives
]
```

Each tuple is `(headline, expected_profession_or_none, min_expected_confidence_or_max_for_negative)`.

---

## Step 4 — Run benchmark locally

```bash
cd chitti-news-ai/backend
pytest tests/test_classifier_sire_worked_examples.py -v
```

Expected output:

```
test_classifier_sire_worked_examples.py::test_pharmacist_fixtures PASSED
... (other 13 professions still ≥ 0.85)
test_classifier_no_false_positive_on_regression_set PASSED
```

If pharmacist F1 < 0.85, tune keywords:
- Add more domain-specific keywords (look at top 👍-receiving articles in the swarm signals).
- Tighten `context_excludes` if false positives are sneaking in.
- DO NOT inflate `source_defaults` past 0.3 — that's the FP risk.

---

## Step 5 — CI gate

Open the PR. CI runs:

- `test_classifier_sire_worked_examples` — must be GREEN.
- `test_no_llm_imports_in_classifier_critical_path` — must be GREEN.
- `test_classifier_no_false_positive_on_regression_set` — must be GREEN.
- `test_no_pii_in_registry_keywords` — verify no keyword is a phone / email / PAN regex.

If any gate fails, the PR cannot merge.

---

## Step 6 — Deploy

After merge:

- Railway auto-deploys the backend.
- The classifier picks up the new registry on next `rss_poll` cycle (within 30 min).
- The first articles classified into `pharmacist` start populating the new Hub.

Verify via:

```bash
curl https://chitti-news-ai-production-*.up.railway.app/api/news-ai/feed/news?profession=pharmacist
```

Within 2 hours of merge, the new Hub has ≥ 1 article.

---

## Step 7 — Post-deploy observability

For the first 7 days:

- Watch `chitti-founder` digest for `unknown-role: 'pharmacist'` count (should drop to ~0 since the Hub now exists).
- Watch the per-card 👍 / 👎 ratio for the new pharmacist cards.
- Watch the classifier confidence histogram for the new profession (should be right-tailed within a week).

If ratios are bad, file a tuning PR in week 2.

---

## Failure modes

| Failure | Behavior |
|---|---|
| New profession F1 < 0.85 | PR blocked at CI. Tune and re-PR. |
| F1 OK but high false-positive in production | Add `context_excludes` rule + regression fixture; ship as a follow-up PR. |
| Backend boot fails on registry parse | `fail-open` mode kicks in; existing professions continue; new profession unavailable until fix. Logged RED in /health. |
| `chitti_coach.js` Hub absent for new profession | Hub Phase 2 dynamic mapping serves it; honest "Phase 2 dynamic" badge on the Hub. |

---

## Cross-references

- [`../swarm/role_mapping_agent.md`](../swarm/role_mapping_agent.md) — the agent this SOP feeds.
- [`../evals/router_accuracy.md`](../evals/router_accuracy.md) — the F1 contract this SOP must meet.
- [`./sop_002_swarm_pattern_promotion.md`](./sop_002_swarm_pattern_promotion.md) — how swarm patterns might originate a classifier change.

---

Last reviewed: 2026-06-06
