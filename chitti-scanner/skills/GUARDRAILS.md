# GUARDRAILS — Chitti Product Scanner

Guardrails are the in-band checks that catch the model going off-script.

## 1. No fabrication — extracted fields are read, not invented

If the prompt asks for `facts.expiry` and the label is smudged, the only correct answer is:

```json
{ "facts": { "expiry": "unreadable" } }
```

The frozen prompt in [../PROMPTS.md](../PROMPTS.md) instructs the model to "never invent" a printed value. Server-side, the `_clean_list()` and `_normalise()` helpers cap lengths but do **not** infer missing fields.

## 2. "Unreadable" is a first-class value

Every field that cannot be confidently extracted returns the string `"unreadable"`. The frontend renders that verbatim — never as a blank, never as "N/A", never as a guess. A blind user hearing "unreadable" knows to re-scan; a blank box tells them nothing.

## 3. Conservative document-type detection

`type` is constrained to the enum: `food` / `medicine` / `legal_doc` / `bill` / `mrp` / `insurance` / `other`. `_normalise()` validates and coerces any out-of-set value to `other`. **On low confidence, the model defaults to `other`** — and the conservative "AI ki madad hai. Doctor ya lawyer se confirm" disclaimer fires.

This matters because the `type` decides which cross-link fires. A misclassified Aadhaar-card-as-medicine would offer Jan Aushadhi alternatives — wrong, and arguably harmful. Default-to-`other` is the safe failure mode.

## 4. Strict-JSON parsing with regex fallback

`_safe_parse()` strips ``` fences, then falls back to a `{...}` regex extract, then returns `{}`. If the model emits malformed JSON, `_normalise({})` produces a polite "could not read clearly" reply — never a 500 to the user.

## 5. Field length caps

- `summary` ≤ 240 chars.
- `key_findings` ≤ 4 items × 200 chars.
- `warnings` ≤ 3 items × 200 chars.
- `savings` ≤ 2 items × 200 chars.
- `speak_hi`, `speak_en` ≤ 300 chars.
- `facts` values ≤ 200 chars each.

Caps are enforced in `_clean_list()` and `_normalise()`. The model can be verbose; the user sees concision.

## 6. Disclaimer cannot be suppressed

Already enumerated in [BOUNDARIES.md](BOUNDARIES.md), repeated here because guardrails are belt-and-braces: `legal_disclaimer` is **set** server-side from `LEGAL_BY_TYPE[type]`, never **read** from model output.

## 7. Temperature pinned low

`SCANNER_TEMPERATURE = 0.2` (see [../ARCHITECTURE.md](../ARCHITECTURE.md)). Strict-JSON output drifts at high temperature. 0.2 is the empirical sweet spot.

## 8. Vision path off by default

`DEEPSEEK_VISION_MODEL = "off"` in production until a vision endpoint is provisioned and verified. Image uploads return `source: "fallback_no_vision"` with a "type out the label" message. No silent fallback to a weaker vision model.
