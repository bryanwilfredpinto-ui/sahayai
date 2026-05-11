# TRUTH SOURCES — Chitti UPI Fraud Guard

What the verdict is actually based on. There is exactly one inference path and one fallback path.

## 1. The model

| Field | Value |
|---|---|
| Provider | DeepSeek |
| Model | `deepseek-chat` |
| Mode | JSON-mode (`response_format: {"type": "json_object"}`) |
| Temperature | `0.2` |
| Max tokens | `500` |
| Timeout | `30s` (httpx) |
| Endpoint | `https://api.deepseek.com/chat/completions` |

Source: [`../PROMPTS.md`](../PROMPTS.md) §1 ("DeepSeek call shape", "Why these knobs") and [`../ARCHITECTURE.md`](../ARCHITECTURE.md) §3 (request lifecycle).

The model is the project-wide choice (project memory _AI provider switching Anthropic → DeepSeek_). No Anthropic fallback in this product.

## 2. The prompt

One system prompt, named `CHITTI_UPI_FRAUD_PROMPT`, defined as a module-level constant in `backend/services/upi_service.py`. Verbatim in [`../PROMPTS.md`](../PROMPTS.md) §1. It is the **only** LLM prompt in v1.

The prompt enumerates five check categories: collect-vs-send, unfamiliar merchant, unusually-large amount, processing-fee-for-prize, OTP-on-call. These are the heuristics the model is instructed to apply. There is no external rules engine — the heuristics live in the prompt string.

## 3. The known-scam corpus

**Today: prompt-only.** There is no labelled dataset, no blacklist of VPAs, no allow-list of merchants. The classifier is the prompt and the model's training. The only "examples" are the 4 sample-card scams in `chitti_upi.html` (KYC scam, electricity scam, KBC-lottery scam, OTP-on-call) — these are UI hints, not training data.

**Future:** P1-8 in [`../TODO.md`](../TODO.md) adds a "report this scam" button that POSTs `{text, verdict}` to an endpoint we then use to build a private corpus and a shared blacklist for prompt-tuning and few-shot examples. Not built.

## 4. The static educational layer

`GET /api/upi/rules` returns the **RBI 2026** framework — four cards (2FA, 1-hour cooling lag, Trusted Person, Kill Switch) — as a hard-coded Python dict in `rbi_2026_rules()`. No LLM. No drift. These are educational facts about the regulator's framework, not classifier output.

## 5. The fallback path

When `DEEPSEEK_API_KEY` is empty or DeepSeek errors, `_fallback()` returns a hard-coded `MEDIUM` envelope — no LLM, no truth source beyond "we cannot reach the model, default to caution" ([`../PROMPTS.md`](../PROMPTS.md) §2).
