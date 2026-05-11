# Prompts — Chitti Voice Factory

**N/A.** The Voice Factory does not call any LLM. It is a pure TTS / STT
substrate — text in, audio out (or in future, audio in, text out). The
suppliers are TTS engines (`bhashini`, `ai4bharat`, `sarvam`,
`mock_bhashini`, `on_device`), not language models. No system prompts, no
user prompts, no tool definitions, no Anthropic / DeepSeek API key, no
prompt-caching configuration.

The only natural-language strings the backend emits are **static disclaimer
text** and **static Tier-C donor messages**, defined in code as Python
constants:

| Constant | Location | Audience |
|---|---|---|
| `_DISCLAIMER` | [`backend/suppliers/mock_bhashini.py:21`](backend/suppliers/mock_bhashini.py) | spoken + written on every mock_bhashini response |
| Bhashini disclaimer literal | [`backend/suppliers/bhashini.py:107`](backend/suppliers/bhashini.py) | spoken + written on every real Bhashini response |
| `_TIER_C_HUMAN_EN` | [`backend/routes/voice.py:13`](backend/routes/voice.py) | English banner for Tulu / Kodava / Oraon |
| `_TIER_C_HUMAN_NATIVE` | [`backend/routes/voice.py:18`](backend/routes/voice.py) | Native-script banner for the same three |

If LLM-generated multilingual disclaimers (or hate-speech moderation on
submitted audio — see [`TODO.md`](TODO.md) §2.3) ever land, this file
becomes a real index. Until then, there are no prompts to document.
