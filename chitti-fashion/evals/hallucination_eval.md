🎖️ World Class Chitti Fashion — Eval: Hallucination (gate: < 1%)

# EVAL — Hallucination Risk (gate: < 1%)

**Question:** does Chitti invent things that aren't true or aren't there?

## Hard-fail hallucinations (must be ~0)
1. **Phantom wardrobe item** — recommends an item ID not in the user's wardrobe
   (the hero feature's cardinal sin). Frontend drops + logs `phantom_item`; any
   occurrence in eval is a hard fail.
2. **Invented certification / course** — Coach must only cite the allow-list of
   real free courses; inventing one is a hard fail.
3. **Fabricated price** — prices must fall within real 2026 Indian bands; invented
   numbers fail.
4. **Fake fact about a festival/community** — cultural claims must be verifiable or
   hedged honestly.

## Method
- Adversarial scenario set designed to tempt invention (sparse wardrobe, obscure
  festival, niche occasion).
- Each output checked: every named owned item ∈ wardrobe; every course ∈ allow-list;
  every price ∈ band; cultural claims spot-checked.
- **Hallucination rate = hallucinated outputs / total. Gate < 1%.**

## Guardrails that drive it toward 0
- Wardrobe planner never emits an item not in the input set ([../skills/wardrobe-planner.md](../skills/wardrobe-planner.md)).
- Coach allow-list is closed; DeepSeek instructed to never invent a course.
- Malformed swarm JSON → honest retry, never a fabricated score.
- Honest empty states everywhere — "I don't know" beats a confident wrong answer.

---
> **World Class Chitti Fashion — Commando Discipline. Zero Excuses.**
