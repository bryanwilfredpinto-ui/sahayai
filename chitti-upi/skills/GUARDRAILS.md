# GUARDRAILS — Chitti UPI Fraud Guard

Behavioural invariants. These are not the LLM's job; they live in code so the LLM cannot drift past them.

## 1. Verbatim echo of evidence

Any VPA, phone number, amount, URL, or merchant name that appears in the suspicious text must be **echoed back verbatim** in `indicators[]` or `reason` — never paraphrased, never re-spelled, never "cleaned up".

- `support@paytm-secure.in` is not normalised to `paytm.in`.
- `9XXXXXXXXX` is not redacted in indicator output (it is the evidence).
- `Rs.4,999` is not converted to `4999` or `INR 4999`.

Reason: a blind user trusting the spoken indicators must hear the **exact** string so they can match it against what their phone is showing. A paraphrase is a lie.

## 2. Deterministic verdict (given input + model version)

`temperature: 0.2` with `response_format: json_object` ([`../PROMPTS.md`](../PROMPTS.md) §1, "Why these knobs"). The same scam SMS classifies the same way across sessions. A user who pastes the same KYC-update template twice and gets HIGH then LOW will (rightly) lose trust.

The 0.2 is deliberate non-zero — DeepSeek `deepseek-chat` at exact-0 has been observed to repeat phrasing across unrelated inputs.

## 3. Risk coerced to the allowed set

`_normalise()` clamps `risk` to `{HIGH, MEDIUM, LOW}`. Anything else → `MEDIUM` ([`../API.md`](../API.md) §2, field guarantees). No "CRITICAL", no "UNKNOWN", no empty string ever reaches the frontend.

## 4. Length caps that cannot blow up the voice surface

A 5000-word warning is unspeakable. Hard caps enforced in `_normalise()`:

- `reason ≤ 240` chars
- `warning ≤ 300` chars
- `indicators` ≤ 6 items × 120 chars each
- `actions` ≤ 5 items × 160 chars each

## 5. Legal lines are constants, not generated

`LEGAL_LINES` is a Python tuple. The model cannot rewrite, suppress, or shorten it. Appended on both DeepSeek path and fallback path ([`../PROMPTS.md`](../PROMPTS.md) §1, "Static strings appended outside the LLM").

## 6. Input cap = 4000 chars

`text > 4000` → `413 payload_too_large`. Prevents prompt-injection spam and bounds DeepSeek cost ([`../API.md`](../API.md) §2).

## 7. CORS allow-list in prod

Only `sahayai.in` and `www.sahayai.in` can call the API in production ([`../ARCHITECTURE.md`](../ARCHITECTURE.md) §7). No third-party embed.

## 8. Stateless

No DB, no log of body, no Redis. Body is processed and discarded. There is nothing to leak.
