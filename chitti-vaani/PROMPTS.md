# PROMPTS — Chitti Vaani

There is **one** DeepSeek prompt in the Vaani backend and it lives as a single string constant inside [vaani_service.py](backend/services/vaani_service.py). It is intentionally a CONSTANT so it can be replaced verbatim by the text approved in the Master Product Spec without touching any other file.

## The canonical system prompt — `CHITTI_VAANI_PROMPT`

Source: [`services/vaani_service.py`](backend/services/vaani_service.py), top of file.

```text
You are Chitti Vaani -- a warm, calm, and capable AI assistant built for Indians who may be blind, deaf, mute, illiterate, elderly, or living in rural areas. You are built by Bryan Wilfred Pinto at Sahayai.

YOUR PERSONALITY:
You are like a trusted family member who handles difficult tasks for people who cannot do them alone
You are calm, never rushed, never condescending, always reassuring
You always say I am Chitti, an AI assistant when making calls on behalf of the user -- never pretend to be the user
You automatically match the user language: Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, or English

WHEN MAKING A CALL FOR A MUTE USER:
Always start with: Namaste, main Chitti hun, ek AI assistant. Main [user name] ki taraf se baat kar raha hun.
Speak clearly and slowly. Confirm key information. Ask for confirmation before ending the call.
If the other party refuses to speak to an AI, say: Kya aap [user name] ke liye ek message le sakte hain?

FOR ELDERLY USERS IN SLOW MODE:
Use shorter sentences. Add a pause between instructions.
Repeat important information twice. Confirm understanding by asking: Kya aapko samajh aaya?
Never use English words when a Hindi equivalent exists

FOR SOS EMERGENCY:
Immediately call the emergency contacts and dial 112
Say: Emergency. [Name] ko madad chahiye. Location: [GPS coordinates]. Blood group: [X]. Please send help now.
Do not wait for any confirmation. Act immediately. Log the exact time and list of contacts called.

LEGAL COMPLIANCE -- mandatory in every interaction:
Always identify yourself as Chitti AI -- never claim to be the user
Never store voice data without explicit user consent
For any medical or legal task, add at the end: Yeh AI ki madad hai. Doctor ya lawyer se confirm zaroor karo.
```

### Drift between this prompt and the family-cascade memory

The **SOS EMERGENCY** clause in this prompt says "dial 112" — but Sahay AI's master memory rule (`project_chitti_vaani_emergency_protocol.md`) is **family cascade, never cops**. The protocol-layer code in [`emergency_service.py`](backend/services/emergency_service.py) enforces the family-only rule (`COP_DENYLIST = {112, 100, 101, 102, 108, 1098, 1930, 139}`) at the source of any actual outbound call. The DeepSeek text inside SOS is therefore best treated as the model's narrative voice while the cascade itself ignores cop numbers. Aligning the prompt with the cop-denylist is a tracked improvement (replace the SOS block with the spouse-first cascade).

## The mode framings — `MODE_FRAMING`

Source: [`vaani_service.py`](backend/services/vaani_service.py).

The frontend picks a mode; the service prepends a short framing string to the user message. The system prompt does the heavy lifting.

| `mode` | Framing prepended |
|---|---|
| `ask` (default) | `User asked: ` |
| `call` | `Summarise this call for me. Call notes:\n` |
| `read` | `Read this back to me clearly:\n` |
| `translate` | `Translate this for me into the user's language:\n` |

## Language hinting

The service also prepends `(Reply in <Hindi|Tamil|…>)\n` to the user message, drawn from `_LANG_NAMES`:

```python
_LANG_NAMES = {
    "hi": "Hindi", "en": "English", "ta": "Tamil", "te": "Telugu",
    "bn": "Bengali", "mr": "Marathi", "gu": "Gujarati",
    "kn": "Kannada", "ml": "Malayalam",
}
```

Unknown language codes fall through and are passed to the model unchanged (DeepSeek treats them as a freeform "reply in X" hint).

## Mandatory legal disclaimer — `_enforce_disclaimer()`

Every reply is post-processed by [`_enforce_disclaimer()`](backend/services/vaani_service.py) which appends the line if missing:

```text
Yeh AI ki madad hai. Doctor ya lawyer se confirm zaroor karo.
```

Frontend MUST read this aloud after every Vaani turn. The line is also the entire `reply` of the fallback response when no `DEEPSEEK_API_KEY` is configured (the frontend gets a polite "Chitti is offline right now" preface plus the line, so the experience never goes silent).

## Wire-level shape sent to DeepSeek

```json
{
  "model": "deepseek-chat",
  "messages": [
    { "role": "system", "content": "<CHITTI_VAANI_PROMPT — the constant above>" },
    { "role": "user",   "content": "(Reply in Hindi)\nUser asked: <user text>" }
  ],
  "max_tokens": 600,
  "temperature": 0.4
}
```

Tuned via env (`VAANI_MAX_TOKENS`, `VAANI_TEMPERATURE`). Timeout is 30 s. HTTP errors surface as `{ok:true, source:"fallback", error:"deepseek_http_<code>"}` so the UI never hard-fails.

## Other prompt-bearing services

None as of 2026-05-11. The admin / feedback / email / emergency services are deterministic — they do not call DeepSeek. The Sahay AI provider switch (memory: `project_ai_provider_switch_to_deepseek.md`) is announced but Vaani has *already* been on DeepSeek from day one, so this prompt is unchanged by that switch.

## Editing rules

- Keep the prompt at the top of [`vaani_service.py`](backend/services/vaani_service.py) as a single `CHITTI_VAANI_PROMPT` constant. **No paraphrasing from helpers.** Replace verbatim when the Master Spec ships a new revision.
- Do not move the disclaimer line — it is the trusted-source-of-truth for the legal post-processor.
- If the SOS block is ever updated to align with the family cascade, also update the memory note `project_chitti_vaani_emergency_protocol.md` so future Claude sessions don't reintroduce 112.
