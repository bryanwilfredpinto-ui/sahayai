# TRUTH SOURCES — Chitti Product Scanner

Scanner does **not** verify any document against an external registry. Its only upstream is the DeepSeek inference endpoint, and the only "ground truth" is the pixels or characters the user supplied. This file enumerates what Chitti reads, where, and what it deliberately does not read.

## 1. DeepSeek text inference (primary path)

| Property | Value |
|---|---|
| Endpoint | `https://api.deepseek.com/chat/completions` (env `DEEPSEEK_URL`) |
| Model | `deepseek-chat` (env `DEEPSEEK_MODEL`) |
| Auth | `Authorization: Bearer ${DEEPSEEK_API_KEY}` |
| Response mode | `response_format: {"type": "json_object"}` |
| Max tokens | 700 (env `SCANNER_MAX_TOKENS`) |
| Temperature | 0.2 (env `SCANNER_TEMPERATURE`) |
| Activation | Always — this is the default path |

This is the path that fires when the user types or speech-to-texts the label.

## 2. DeepSeek vision inference (image path)

| Property | Value |
|---|---|
| Model | env `DEEPSEEK_VISION_MODEL` (default `"off"` in production) |
| Payload | OpenAI-compatible multimodal — system prompt + text instruction + `image_url` data-URL |
| Activation | Only when `DEEPSEEK_VISION_MODEL` is set and not `"off"` |
| Fallback | `source: "fallback_no_vision"` envelope when off |

See vision request body in [../PROMPTS.md](../PROMPTS.md). Pending DeepSeek vision credentials per workspace memory `project_ai_provider_switch_to_deepseek.md`.

## 3. Text-only fallback model

When `DEEPSEEK_API_KEY` is missing or DeepSeek returns non-2xx / times out, `_fallback()` synthesises a static envelope locally:

- `source: "fallback"` (or `fallback_no_vision` for the image path).
- `summary: "AI offline — could not analyse this label right now."`
- Empty `facts`, `warnings`, `savings`.
- Conservative `legal_disclaimer` ("Doctor ya lawyer se confirm zaroor karo").

No second model is wired. There is no Anthropic / OpenAI / Gemini fallback. The workspace contract is "DeepSeek for all" (see workspace memory `project_ai_provider_switch_to_deepseek.md`).

## 4. External document-verification sources — DELIBERATELY NONE

| Registry | Wired? | Why not |
|---|---|---|
| UIDAI (Aadhaar) | No | False-positive "verified" stamp would be worse than honest illiteracy. See [BOUNDARIES.md](BOUNDARIES.md) #3. |
| NSDL (PAN) | No | Same. |
| FSSAI (food licences) | No | Out of v1 scope; the prompt only checks **claims on the label** (e.g., "Sugar Free") against FSSAI labelling rules. |
| Insurance regulator | No | Hand-off to UPI Fraud Guard instead. |
| Consumer-helpline registry | No | `tel:1800114000` deep-link only. |

## 5. The MedUPI cross-link is **not** a truth source for Scanner

When `type === "medicine"`, the frontend (not the Scanner backend) calls `${MEDUPI_API_BASE}/api/medupi/medicine/<query>` to fetch Jan Aushadhi alternatives. That is a sibling-product API, not a verification step. Scanner's own response is finalised before MedUPI is consulted.
