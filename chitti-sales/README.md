# Chitti Sales

In-house sales coach for Indian small-business owners. Voice-first, vernacular (Hindi / Tamil / Telugu / Bengali / Marathi and beyond), distilled from the top 10 sales books and reframed for the Indian MSME context — kirana shops, salons, tutors, gyms, pharmacies, restaurants, freelancers, MSMEs.

This product is an **honest stub**. Chitti Sales is text-only coaching today: no CRM integration, no autodialer, no contact-list ingestion. Every reply ends with a server-enforced "this is coaching, not a guarantee" disclaimer.

## What it does (proposed)

- Answers a single, voice-asked question like "How do I close more sales this week?" with **one tactic at a time** — never a wall of text.
- Pulls every tactic from a fixed set of 10 sales books (see [SALES_BOOKS.md](SALES_BOOKS.md)) and labels which book + author it came from.
- Reframes Western examples (Fortune-500 enterprise sales) into Indian MSME terms — a kirana counter, a salon WhatsApp list, a tutor's parent-network, a pharmacy queue, a restaurant footfall.
- Replies in plain Hindi / English / Tamil / Telugu / Bengali / Marathi etc. — same 12-language reply map shared by Chitti CA and Chitti Legal.
- Coach-style follow-ups: ends each reply with one specific action the owner can try this week, plus one question to bring to a mentor / peer / FBO.

## What it deliberately does **not** do

- **No CRM integration.** Chitti Sales does not read your contacts, your WhatsApp, your call log, your invoices, or your customer list.
- **No autodialer / autosender.** It never places a call or sends a message on the user's behalf.
- **No closing-rate guarantee.** It does not promise "this tactic gets you 10 more sales" — sales outcomes depend on product, price, market, and the owner's own effort.
- **No competitor names.** It does not name a rival shop, a rival brand, or a rival service.
- **No dark patterns.** No artificial urgency, no fake scarcity, no manipulative framing. See [skills/BOUNDARIES.md](skills/BOUNDARIES.md).
- **Not a substitute for a real sales mentor.** Every reply closes with the disclaimer.

## Shape (proposed, not built yet)

Same shape as [chitti-ca](../chitti-ca/) and [chitti-legal](../chitti-legal/) — tiny stateless Flask service, one route file (`routes/sales.py`), one service file (`services/sales_service.py`), one entrypoint (`main.py`), one config (`config.py`). DeepSeek as the only LLM provider (per the [LLM strategy](../MASTER_CONTEXT.md)).

**Status: docs only.** No backend code exists yet. The endpoint shape and the system prompt are proposals — see [API.md](API.md) and [PROMPTS.md](PROMPTS.md).

## See also

- [CONTEXT.md](CONTEXT.md) — why this product exists, four-user contract
- [ARCHITECTURE.md](ARCHITECTURE.md) — proposed wiring
- [API.md](API.md) — proposed endpoint surface
- [PROMPTS.md](PROMPTS.md) — proposed system prompt verbatim
- [SALES_BOOKS.md](SALES_BOOKS.md) — the 10 books that ground every reply
- [B2B_TO_B2C_FLYWHEEL.md](B2B_TO_B2C_FLYWHEEL.md) — go-to-market strategy
- [FEEDBACK_CAPTURE.md](FEEDBACK_CAPTURE.md) — how user feedback flows back into the product
- [TODO.md](TODO.md) — what is not built yet
- [skills/](skills/) — identity, personality, values, boundaries, guardrails
