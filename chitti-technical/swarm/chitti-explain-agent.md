🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# Chitti Explain Agent

**Judges:** is the human explanation clear, honest, and educational?
**Authority:** phrases the verdict — **it never invents it.**

## Inputs
- The deterministic verdict + risk block + contributing/contradicting signals
  from the Confluence and Risk agents
- The user's language and disability profile

## Engine
- **DeepSeek** (sole LLM, [SAHAYAI_MASTER.md §2](../../SAHAYAI_MASTER.md)), fed only
  the computed numbers. It rephrases; it has no authority to change a value or a verdict.
- **Fallback:** if DeepSeek is down/slow, a deterministic template produces the
  explanation (degraded phrasing, identical content). Never silence, never a
  hallucinated number.

## Output contract
A short plain-language paragraph that always includes:
1. **What** the signal is (BUY/SELL/HOLD + confidence)
2. **Why** (the contributing signals, in plain words)
3. **The risk** (entry, stop, target, RR — what you lose if wrong)
4. **The invalidation** (one checkable sentence)
5. Never the words "guaranteed," "sure," "multibagger," or any certainty claim

## Example
> *"This is a medium-confidence buy. The weekly is trending up and the daily just
> turned up with volume — they agree. Buy near ₹100, keep a stop at ₹96 (you're
> wrong below there), first target ₹108. You risk ₹4 to make ₹8. It stops being a
> buy if the daily closes below ₹96. This is education, not advice — you decide."*

## Hard rule
Every number in the explanation must already exist in the engine output. The
Explain Agent is the most likely place a hallucination could enter — the Trust
Agent verifies its output against the data before it ships.

---
> **World Class Chitti Technical — Commando Discipline. Zero Excuses.**
