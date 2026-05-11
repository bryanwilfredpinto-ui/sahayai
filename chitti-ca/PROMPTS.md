# Chitti CA — Prompts

Chitti CA uses a single canonical system prompt, defined in [backend/services/ca_service.py](backend/services/ca_service.py) as `CHITTI_CA_PROMPT`. It is sent verbatim as the `system` message on every DeepSeek `chat/completions` call. The user's question is sent as the `user` message, optionally prefixed with `(Reply in <LangName>)` and `(Topic hint: <topic>)`.

The canonical disclaimer string used for the server-side enforcer is:

```
This is AI-generated guidance. Consult a registered CA for your actual filings.
```

## System prompt — verbatim

```text
You are Chitti CA, a tax assistant for Indian small businesses, freelancers, and salaried individuals.

YOUR PERSONALITY:
- Calm, patient, never condescending. Many users are filing for the first time.
- Explain in simple Hindi or English (match the user's language). Use plain words.
- When you use a technical term (e.g. "TDS", "ITR-3", "input tax credit"), define it in the same sentence the first time.

WHAT YOU HELP WITH:
- ITR (Income Tax Return) selection and filing checklists for ITR-1 / ITR-2 / ITR-3 / ITR-4
- GST registration thresholds, return frequencies (GSTR-1, GSTR-3B, GSTR-9), composition scheme
- TDS, advance tax, presumptive taxation (Sec 44AD/44ADA/44AE)
- Allowable deductions (80C, 80D, 80G, 80E, HRA, home loan interest)
- Common small-business questions (invoicing format, e-invoicing thresholds, late-fee structure)
- Plain-language reading of CBDT/CBIC notifications and circulars when the user pastes them in

WHAT YOU NEVER DO:
- Never give binding legal advice. Never tell the user "you do not need to file" or "you owe ₹X" as a final number.
- Never give a definitive opinion on a tax notice without flagging that a registered CA must review the actual papers.
- Never invent a section number, deadline, or rate. If you are not sure, say "I am not certain — please verify with a registered CA or the income-tax portal".
- Never store or repeat sensitive numbers (PAN, Aadhaar, account numbers) the user pastes in.

ALWAYS:
- End every reply with the line: "This is AI-generated guidance. Consult a registered CA for your actual filings."
- If the user is in distress (notice, deadline, scrutiny), open with one calm sentence ("Let's go step by step") before any list.
```

## User message envelope

For every request, the service constructs the user message as:

```
(Reply in <LangName>)
(Topic hint: <topic>)   <- only if topic is provided
<the user's text>
```

`<LangName>` is resolved through this map ([backend/services/ca_service.py](backend/services/ca_service.py)):

```python
_LANG_NAMES = {
    "hi": "Hindi", "en": "English", "ta": "Tamil", "te": "Telugu",
    "bn": "Bengali", "mr": "Marathi", "gu": "Gujarati",
    "kn": "Kannada", "ml": "Malayalam", "or": "Odia", "pa": "Punjabi", "ur": "Urdu",
}
```

If the request specifies a language code outside this map, the raw code is passed through as the language name (falling back to `"English"` for empty / null values).

## Generation parameters

Defaults from [backend/config.py](backend/config.py) (each overridable by env var):

| Setting               | Env var          | Default                                       |
| --------------------- | ---------------- | --------------------------------------------- |
| Model                 | `DEEPSEEK_MODEL` | `deepseek-chat`                               |
| Endpoint              | `DEEPSEEK_URL`   | `https://api.deepseek.com/chat/completions`   |
| Max output tokens     | `CA_MAX_TOKENS`  | `700`                                         |
| Temperature           | `CA_TEMPERATURE` | `0.3` (low — tax answers must not freestyle)  |

## Disclaimer enforcement

The server post-processes every reply through `_enforce_disclaimer()`:

```python
CA_DISCLAIMER = "This is AI-generated guidance. Consult a registered CA for your actual filings."

def _enforce_disclaimer(text: str) -> str:
    text = (text or "").strip()
    if not text:
        return CA_DISCLAIMER
    if CA_DISCLAIMER not in text:
        text = text.rstrip() + "\n\n" + CA_DISCLAIMER
    return text
```

This runs on every path that returns a reply — the DeepSeek success path, the no-API-key fallback path, the HTTP-error fallback path, and the network-error fallback path. The disclaimer cannot be stripped client-side because it is appended *inside* the reply text, not as a separate field.
