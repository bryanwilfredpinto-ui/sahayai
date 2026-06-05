# Chitti Fashion — Evaluation Results

Generated: 2026-06-05T11:14:52Z · DeepSeek: **HTTP 429 rate-limited at run time**

| Suite | Run mode | N | Pass | Blocked | Fail | Score |
|---|---|---|---|---|---|---|
| accessibility | deterministic (live page) | 107 | 107 | 0 | 0 | 100% |
| outfit | live API (sampled 6 of 100) | 6 | 0 | 6 | 0 | — (blocked) |
| occasion | live API (sampled 6 of 100) | 6 | 0 | 6 | 0 | — (blocked) |

## Honesty notes
- **Accessibility** is a REAL deterministic score measured against the live page now.
- **Outfit / Occasion** accuracy is **provisional/blocked** for TWO infra reasons (neither is a model-quality failure): (1) DeepSeek HTTP 429 rate-limit; (2) the shared `chitti-vaani-api` **relevance rail rejects fashion prompts as `off_topic`** (its job list is call/email/message/send/speak). FIX (backend, chitti-vaani-api): add a fashion intent/allowlist to the relevance rail OR route fashion via a dedicated mode. The harness scores answer-quality automatically once a fashion answer comes back.
