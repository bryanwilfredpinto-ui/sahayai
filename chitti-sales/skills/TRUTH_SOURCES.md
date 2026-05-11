# Chitti Sales — TRUTH_SOURCES

Chitti Sales has **no live integration** with any external service today. It is a (proposed) stateless DeepSeek wrapper. The truth chain runs through the model's training data plus a fixed, named canon of 10 books — and the [GUARDRAILS.md](GUARDRAILS.md) rule that the model must name which book a tactic came from.

## 1. The 10-book canon — primary

The full list is in [../SALES_BOOKS.md](../SALES_BOOKS.md):

1. *How to Win Friends and Influence People* — Dale Carnegie
2. *Influence* — Robert Cialdini
3. *SPIN Selling* — Neil Rackham
4. *The Challenger Sale* — Matthew Dixon and Brent Adamson
5. *Predictable Revenue* — Aaron Ross
6. *Never Split the Difference* — Chris Voss
7. *Pitch Anything* — Oren Klaff
8. *To Sell is Human* — Daniel Pink
9. *Crossing the Chasm* — Geoffrey Moore
10. *The Psychology of Selling* — Brian Tracy

These are the **only** named sources. Any tactic cited by Chitti must trace back to one of these books or be flagged as "general sales wisdom, not from one of the 10 books." See [GUARDRAILS.md](GUARDRAILS.md) item 1.

We do not have the book text loaded as a retrieval corpus. The model recalls from training. The risk this introduces is documented in [DEVILS_ADVOCATE.md](DEVILS_ADVOCATE.md) item 4.

## 2. DeepSeek (`deepseek-chat`) — primary inference

The only live source. Will be called via `https://api.deepseek.com/chat/completions` from the proposed `services/sales_service.py`. All language understanding, tactic recall, book attribution, and Hindi/regional translation come from the model.

Failure modes (HTTP error, network error, missing key, empty reply) all route through `_fallback()` which still appends the server-enforced disclaimer. See [../ARCHITECTURE.md](../ARCHITECTURE.md).

The DeepSeek-only decision is the Sahay AI family-wide LLM policy as of 2026-05-11 — see [../../MASTER_CONTEXT.md](../../MASTER_CONTEXT.md). No Anthropic, no OpenAI, no other provider.

## 3. Indian MSME context — model + prompt

The "Indian MSME reframing" rule in [../PROMPTS.md](../PROMPTS.md) instructs the model to translate every tactic into Indian small-business terms. The model's training data includes Indian small-business context — kirana, salon, dhaba, tutor, freelancer, MSME — but we have no live cross-reference to a curated Indian MSME case-study DB. The model is doing this in-context, not retrieval-augmented.

A future v2 would add real Indian MSME case studies (FBO success stories, NSIC case studies, MSME Sambandh examples) as a retrieval corpus.

## 4. Sahay AI family routing — internal

When the user's question crosses into tax, law, equity, or government schemes, Chitti Sales does not answer — it routes:

| Topic                  | Destination                              |
| ---------------------- | ---------------------------------------- |
| Tax, GST, ITR          | [Chitti CA](../../chitti-ca/)             |
| Contracts, notices     | [Chitti Legal](../../chitti-legal/)       |
| Equity, SEBI           | [Chitti Vaani](../../chitti-vaani/)       |
| Government schemes     | [Chitti Government](../../chitti-government/) |
| Medicines              | [Chitti MedUPI](../../chitti-medupi/)     |
| Voice setup            | [Chitti Voice Factory](../../chitti-voice-factory/) |

This is a prompt-level rule, not a programmatic redirect. See [BOUNDARIES.md](BOUNDARIES.md) item 5.

## 5. The model training cutoff is a known weakness

Sales books published after the model's training cutoff are unknown to the model. Chitti's canon is deliberately fixed to 10 well-known books, all of which predate any plausible training cutoff. This insulates the product from the cutoff problem in a way that Chitti CA (annual tax-budget shifts) and Chitti Government (yearly scheme launches) cannot achieve.

## What is **not** a source

- No live blog scrape (LinkedIn, Medium, sales-coaching newsletters). The 10-book canon is deliberate insulation against blog noise.
- No customer database. No CRM ingestion. No WhatsApp Business pull. See [BOUNDARIES.md](BOUNDARIES.md).
- No previous-turn memory. Every ask is independent.
- No DB. The service holds zero state. See [../DATABASE.md](../DATABASE.md).
- No competitor data, no market research reports, no industry benchmarks. The product is a coach, not an analyst.
