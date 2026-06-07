# SOP — Decode a legal notice (panic → plan)

Every notice request follows the CEOS 7-step flow:

1. **Identify user type** (persona + disability profile → language & mode).
2. **Identify the notice type** (`classifyNotice` from pasted text, or the user's pick).
3. **Identify risk level** (criminal/recovery/court = HIGH → "see a lawyer / 15100").
4. **Explain the situation** — what it is · who issued it · what it means (plain language).
5. **Provide options** — the deadline · the worst case · the next 3 steps.
6. **Recommend next steps** — reply/pay/appear; surface FREE legal aid before paid.
7. **Store in memory** — offer to save the matter + deadline to the Legal Twin.

Rules: never ignore a notice; never invent a section; always state the deadline from the
notice itself; always cite the basis; HIGH-risk → recommend a lawyer / NALSA 15100.
Engine: `decodeNotice` / `classifyNotice`.
