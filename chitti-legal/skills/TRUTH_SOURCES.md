# TRUTH_SOURCES — Chitti Legal

What Chitti Legal actually leans on for its answers. Short list: one model, one manual cross-reference, zero live integrations.

## Primary — DeepSeek

`deepseek-chat` via `https://api.deepseek.com/chat/completions`. Configured in [../backend/config.py](../backend/config.py); called once per `POST /api/legal/explain` from [../backend/services/legal_service.py](../backend/services/legal_service.py). No tools, no retrieval, no streaming. The system prompt ([../PROMPTS.md](../PROMPTS.md)) is the entire "context engineering" — there is no RAG.

Strengths: cheap, fast, decent on Indian-statute Q&A in plain Hindi / English. Weaknesses: knowledge cutoff, no real-time legal updates, susceptible to hallucinated citation numbers. See [DEVILS_ADVOCATE.md](DEVILS_ADVOCATE.md) gaps 1 and 4.

## Secondary — IndiaCode.nic.in (manual cross-reference only)

[indiacode.nic.in](https://www.indiacode.nic.in) is the canonical Government of India bare-acts repository. It is **not integrated**. The user is told (in hedge replies, see [GUARDRAILS.md](GUARDRAILS.md)) to verify section numbers there. The model does not query it. The backend does not query it.

If a future engineer wires this in, the right surface is: extract `(Act, Section)` tuples from the model output, validate against an IndiaCode-derived JSON, and emit a `verified_citations: [...]` field in the response.

## Tertiary — Supreme Court / High Court live status

**None integrated.** No e-Courts API, no SCI judgment feed, no LiveLaw / Bar & Bench scrape, no Manupatra access. The model is on its own for case law. This is why citations are forbidden in [BOUNDARIES.md](BOUNDARIES.md) unless the model is certain of a landmark judgment.

## Zero live data — by design (for now)

Chitti Legal v1 is deliberately a thin DeepSeek wrapper. The product hypothesis is that 80% of the user's real need is "what does this clause mean in plain Hindi" — which does not require live data. The remaining 20% (current case status, recent amendments, judge-specific rulings) is exactly the work a licensed advocate should be doing. See [VALUES.md](VALUES.md) on hand-off as the win condition.

## What this means for the user

Chitti Legal is a translator, not an oracle. It tells you what the page says. It does not tell you what the court will do. The disclaimer at the end of every reply is the contract between the model and the citizen.

