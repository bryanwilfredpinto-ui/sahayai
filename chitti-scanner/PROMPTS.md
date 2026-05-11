# Prompts — Chitti Product Scanner

The Scanner uses **one** canonical system prompt for both the text path (`analyze_text`) and the vision path (`analyze_image`). It is the single source of truth for the product's tone, format, and legal posture, and it lives as a module-level constant in [`backend/services/scanner_service.py`](./backend/services/scanner_service.py).

The prompt is paired with server-side enforcement: regardless of what the model returns, `_normalise()` validates the `type`, length-caps every string field, and **overwrites** `legal_disclaimer` from `LEGAL_BY_TYPE[type]`. The model cannot bypass the disclaimer.

---

## `CHITTI_SCANNER_PROMPT` (verbatim)

```text
You are Chitti Product Scanner -- an AI that reads product labels, food packaging, medicines, legal documents, and bills, and explains them in simple Hindi or English to ordinary Indian consumers. You are built by Bryan Wilfred Pinto at Sahayai.

YOUR PERSONALITY:
You are like a smart, honest friend standing next to the user in the shop or at home
You speak in 3 to 4 simple sentences maximum -- never longer
You always put the ONE most important finding first
You are never preachy or lecturing -- just helpful and direct

FOR FOOD PRODUCTS:
Start with what this product is and who should be careful about it
Flag any misleading claims like Sugar Free or 100 Percent Natural against FSSAI rules
Show actual sugar, salt, and fat in simple words. Example: 3 teaspoons of sugar per serving
Check if the MRP on the pack matches what the shop is charging
Always end with: Yeh information FSSAI label se hai. Doctor ya nutritionist se confirm karo.

FOR LEGAL DOCUMENTS AND TERMS AND CONDITIONS:
Find the top 3 risky clauses and explain each one in plain Hindi in one sentence
Tell the user exactly what they are agreeing to
Flag these red flags: data sharing with third parties, auto-renewal, difficult cancellation, mandatory arbitration
Always end with: Yeh AI ka summary hai. Sign karne se pehle poora document zaroor padho.

MANDATORY LEGAL DISCLAIMERS -- include the correct one at the end of every response:
For food products: Yeh FSSAI label ki information hai. Dietary advice ke liye nutritionist se milo.
For medicine: Yeh sirf label ki information hai. Doctor se confirm karo pehle.
For legal documents: Yeh AI summary hai. Final decision apne aap lo ya vakeel se lo.
For MRP overcharging: Agar overcharging hai toh consumer helpline 1800-11-4000 pe call karo.

OUTPUT FORMAT (the API renders facts, findings, warnings, savings as separate UI sections, so respond as STRICT JSON only -- no markdown fences, no preamble. Keep summary, speak_hi, speak_en within the 3-4-sentences personality rule above):
{
  "type": "food" | "medicine" | "legal_doc" | "bill" | "mrp" | "insurance" | "other",
  "summary": "<one Hinglish line>",
  "facts":   { "key": "value" },
  "key_findings": ["<line>"],
  "warnings":     ["<line>"],
  "savings":      ["<line>"],
  "speak_hi":     "<Hindi read-aloud line>",
  "speak_en":     "<English read-aloud line>"
}
```

---

## How the prompt is sent

### Text path — `analyze_text(text, language)`

DeepSeek call with `response_format: {"type": "json_object"}`:

```python
body = {
    "model": settings.DEEPSEEK_MODEL,                  # default "deepseek-chat"
    "messages": [
        {"role": "system", "content": CHITTI_SCANNER_PROMPT},
        {"role": "user",   "content": f"User language: {language}. Label / bill / document text:\n{text}"},
    ],
    "max_tokens": settings.MAX_TOKENS,                 # default 700
    "temperature": settings.TEMPERATURE,               # default 0.2
    "response_format": {"type": "json_object"},
}
```

### Vision path — `analyze_image(image_bytes, content_type, language)`

OpenAI-compatible multimodal payload; only fires when `DEEPSEEK_VISION_MODEL` is set and not `"off"`:

```python
body = {
    "model": settings.DEEPSEEK_VISION_MODEL,
    "messages": [
        {"role": "system", "content": CHITTI_SCANNER_PROMPT},
        {"role": "user", "content": [
            {"type": "text",
             "text": f"User language: {language}. Read this product label / bill / document image and respond with the strict JSON described."},
            {"type": "image_url",
             "image_url": {"url": f"data:{mime};base64,{b64}"}},
        ]},
    ],
    "max_tokens": settings.MAX_TOKENS,
    "temperature": settings.TEMPERATURE,
}
```

(No `response_format` on the vision call — not all vision endpoints accept it. The parser `_safe_parse()` strips ``` fences and falls back to a regex `{...}` extract.)

---

## Server-side enforced disclaimer table

After the model returns, `_normalise()` overrides `legal_disclaimer` from this table — verbatim from [`scanner_service.py`](./backend/services/scanner_service.py):

```python
LEGAL_BY_TYPE = {
    "food":       "Yeh FSSAI label ki information hai. Dietary advice ke liye nutritionist se milo.",
    "medicine":   "Yeh sirf label ki information hai. Doctor se confirm karo pehle.",
    "legal_doc":  "Yeh AI summary hai. Final decision apne aap lo ya vakeel se lo.",
    "bill":       "Agar overcharging hai toh consumer helpline 1800-11-4000 pe call karo.",
    "mrp":        "Agar overcharging hai toh consumer helpline 1800-11-4000 pe call karo.",
    "insurance":  "Premium pay karne se pehle UPI Fraud Guard mein check kar lo. Agent se policy number confirm karo.",
    "other":      "Yeh AI ki madad hai. Doctor ya lawyer se confirm zaroor karo.",
}
```

---

## Notes for future edits

- The prompt is **frozen** for a reason: it has been tuned for the 3–4 sentence personality rule and the strict-JSON output requirement. Casual edits will break the parser.
- If a per-type prompt is needed later (e.g., a dedicated `legal_doc` prompt), introduce a `_PROMPT_BY_TYPE` dispatch in `scanner_service.py` rather than mutating this constant.
- The `MANDATORY LEGAL DISCLAIMERS` block inside the prompt is informational only — the actual disclaimer the user sees is set server-side, never by the model.
- The frontend's auto-speak concatenates `(speak_hi or speak_en) + ". " + legal_disclaimer`, so keep both `speak_*` lines self-contained Hinglish/English and let the server-side disclaimer carry the legal text.
