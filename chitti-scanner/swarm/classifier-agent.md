🎖️ World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.

# Classifier Agent — "What is it?"

## Job

Assign the detected input to a category from the [taxonomy](../DETECTION_ENGINE.md):
`document · medicine · food · human · appliance · vehicle · crop · fashion · animal ·
building · fraud_signal · unknown`, with a confidence and the matched signals.

## Inputs

- Backend `type` field (`food/medicine/legal_doc/bill/mrp/insurance/other`).
- Client-side keyword matches (weighted) over typed/OCR text.
- (COMING SOON) vision-LLM visible-feature description.

## Output

`{ category, sub_type, confidence, signals[] }` — `signals` feeds the Explanation agent.

## Rules

- **Deterministic-first.** Rules + backend `type` decide; vision only enhances.
- **Never invent.** No signal → low confidence → hand to the Trust agent (likely `unknown`).
- **Sub-type matters** (`document → legal/government/education/career/bill`;
  `human → skin/eye/wound/lab_report`) because it changes the route.

## Failure modes

- Two strong categories → emit both; do not pick. (Router presents a choice.)
- Backend offline → classify from typed text alone; mark `source: "text-rules"`.

---
> **World Class Chitti Universal Scanner — Commando Discipline. Zero Excuses.**
