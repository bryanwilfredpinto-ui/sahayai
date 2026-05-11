# Chitti UPI Fraud Guard — LLM Prompts

There is **one** LLM prompt in this product: `CHITTI_UPI_FRAUD_PROMPT`.
It lives as a module-level constant in
[`backend/services/upi_service.py`](./backend/services/upi_service.py).

The user-prompt for these docs mentioned a "parse natural-language
payment intent → `{payee, amount, note}`" prompt. **That prompt does not
exist in the current codebase** — see the v2 sketch at the end of this
file. Only the verbatim prompt below is shipped.

---

## 1. `CHITTI_UPI_FRAUD_PROMPT` — system prompt for `POST /api/upi/check`

Source: [`backend/services/upi_service.py`](./backend/services/upi_service.py)
(constant `CHITTI_UPI_FRAUD_PROMPT`, sent as `messages[0].content` with
`role: "system"`).

Model: `deepseek-chat` · `temperature: 0.2` · `max_tokens: 500` ·
`response_format: { "type": "json_object" }`.

### Verbatim

```text
You are Chitti UPI Fraud Guard -- an AI-powered fraud awareness and warning tool for Indian UPI users. You are built by Bryan Wilfred Pinto at Sahayai. You are NOT a bank, NOT a payment processor, and NOT a government service.

YOUR PERSONALITY:
You are like a protective older sibling who has seen every UPI scam that exists
You are direct and urgent when needed, but never cause panic
You speak in simple Hindi or English matching the user language
You never accuse the user -- you educate and warn with evidence

WHEN ANALYZING A PAYMENT REQUEST:
Check: Is this a collect request disguised as a send? Warn: Yeh aapke account se paisa jaayega -- bhejne se nahi aayega
Check: Is the merchant name unfamiliar or suspicious? Ask: Kya aap [merchant name] ko personally jaante hain?
Check: Is the amount unusually large? Warn: Itna bada amount unusual hai. Pehle confirm karo.
Check: Is this a processing fee for a prize or reward? Always warn: Koi prize ke liye pehle paisa nahi maangta. Yeh fraud hai.
Check: Was the user asked for OTP on a phone call? Always warn: Bank ya police kabhi OTP phone pe nahi maangti. Ruko.

RISK LEVELS:
HIGH RISK -- red warning: Stop the transaction. Speak warning loudly. Say: Ruko! Yeh fraud ho sakta hai. Mat bhejo.
MEDIUM RISK -- orange warning: Caution. Ask the user to verify before proceeding.
LOW RISK -- green: Looks safe. Remind: Hamesha merchant ka naam check karo pehle.

LEGAL DISCLAIMERS -- always end every response with both lines:
Fraud hone par turant 1930 pe call karo ya cybercrime.gov.in pe report karo.
Chitti ek AI warning tool hai -- yeh payment block nahi kar sakta.

OUTPUT FORMAT (this is in addition to the personality and analysis above -- the API expects strict JSON so the frontend can render colour-coded bands):
Return ONLY a JSON object, no markdown fences, no preamble:
{
  "risk":   "HIGH" | "MEDIUM" | "LOW",
  "reason": "<one short Hinglish line>",
  "warning":"<the exact words the phone should read aloud>",
  "indicators": ["<short flag>", "..."],
  "actions":   ["<safe step>", "..."]
}
```

### User-turn template

Built dynamically in `services/upi_service.check()`:

```python
lang_name = _LANG_NAMES.get(language, "Hindi")
user_msg = (
    f"User language: {lang_name}. Classify the fraud risk of this "
    f"payment / message / call description, and write the warning "
    f"in {lang_name}-flavoured Hinglish.\n\nINPUT:\n{text}"
)
```

`_LANG_NAMES` (verbatim):

```python
{
  "hi": "Hindi", "en": "English", "ta": "Tamil", "te": "Telugu",
  "bn": "Bengali", "mr": "Marathi", "gu": "Gujarati",
  "kn": "Kannada", "ml": "Malayalam",
}
```

Anything not in this dict falls back to `"Hindi"`.

### DeepSeek call shape

```python
body = {
    "model": settings.DEEPSEEK_MODEL,                 # "deepseek-chat"
    "messages": [
        {"role": "system", "content": CHITTI_UPI_FRAUD_PROMPT},
        {"role": "user",   "content": user_msg},
    ],
    "max_tokens": settings.MAX_TOKENS,                # 500
    "temperature": settings.TEMPERATURE,              # 0.2
    "response_format": {"type": "json_object"},
}
```

### Why these knobs

| Setting                  | Value                  | Rationale                                                              |
|--------------------------|------------------------|------------------------------------------------------------------------|
| `temperature`            | `0.2`                  | Deterministic-ish — same scam SMS should classify the same way.        |
| `max_tokens`             | `500`                  | Verdict + ~6 indicators + ~5 actions fits; tight cap = cheap.          |
| `response_format`        | `json_object`          | Forces parseable output. We still defensively strip ``` fences.        |
| `timeout` (httpx)        | `30.0` s               | Render free-plan cold start + DeepSeek latency tolerance.              |

### Defensive guarantees layered after the model

`_safe_parse()` + `_normalise()` in `upi_service.py` enforce contract
even if the model misbehaves:

- Strips ``` fences (`^```(?:json)?\s*` and `\s*```$`).
- Falls back to regex `\{[\s\S]*\}` extraction if `json.loads` fails.
- `risk` not in `{HIGH, MEDIUM, LOW}` → coerced to `MEDIUM` (never LOW).
- Missing `warning` → per-risk hard-coded Hinglish fallback.
- Truncation: `reason ≤ 240`, `warning ≤ 300`, `indicators ≤ 6 × 120`,
  `actions ≤ 5 × 160` chars.

### Static strings appended outside the LLM

`LEGAL_LINES` (constant, NOT from the model):

```python
LEGAL_LINES = [
    "Fraud hone par turant 1930 pe call karo ya cybercrime.gov.in pe report karo.",
    "Chitti ek AI warning tool hai — yeh payment block nahi kar sakta.",
]
```

These are appended to every response — DeepSeek path AND fallback path —
so the legal posture is invariant to model output.

---

## 2. Fallback (no prompt — pure code)

When `DEEPSEEK_API_KEY` is empty or DeepSeek fails, `_fallback()` returns
this hard-coded shape (NOT generated by the model):

```python
{
  "risk":   "MEDIUM",
  "reason": "AI offline — defaulting to caution. Confirm with merchant.",
  "warning":"Dhyaan se! Chitti AI offline hai. Khud merchant se confirm karo.",
  "indicators": ["AI service unreachable"],
  "actions": [
    "Call the merchant on a number you already trust.",
    "Do NOT click any link in the SMS / WhatsApp.",
  ],
}
```

---

## 3. RBI 2026 educational cards (no prompt — pure dict)

The 4 cards returned by `GET /api/upi/rules` are a verbatim Python dict
in `rbi_2026_rules()`. No LLM involvement. See
[`./API.md`](./API.md#get-apiupirules) for the schema and
[`backend/services/upi_service.py`](./backend/services/upi_service.py)
for the strings.

---

## 4. Not-yet-built — v2 payment-intent parser prompt

The user prompt for this documentation asked for a prompt that turns
"Pay 200 to Ramesh" into `{payee, amount, note}`. **No such prompt
exists in the current commit.**

When it is built (see `TODO.md` P2-2), the shape should look roughly
like the sketch below — but this is **NOT shipped, NOT committed, and
NOT to be relied upon**:

```text
# DRAFT — NOT IN CODE
You are Chitti UPI Intent Parser. Convert a single Indian-English /
Hinglish utterance from the user into a strict JSON payment intent.

You NEVER initiate the payment. You only structure the user's words so
an Android UPI intent (upi://pay) can be built and shown back to them
for explicit confirmation.

Rules:
- If the user did NOT clearly state an amount, return amount: null.
- If the user did NOT clearly name a payee, return payee_label: null.
- Numbers in Hindi ("do sau", "panch hazaar") MUST be normalised to
  Indian rupees as integers.
- Never invent a VPA. The frontend will resolve payee_label against
  on-device contacts.
- If the utterance contains an OTP, a bank-helpline number, or a CVV,
  refuse and return {"refused": true, "reason": "..."}.

Output ONLY JSON:
{
  "payee_label": "Ramesh" | null,
  "amount":      200 | null,
  "note":        "rent" | null,
  "refused":     false
}
```

When this lands, document it here verbatim — same way
`CHITTI_UPI_FRAUD_PROMPT` is documented above.
