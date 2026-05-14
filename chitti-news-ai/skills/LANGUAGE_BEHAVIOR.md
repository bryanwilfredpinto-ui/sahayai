# Chitti News AI — LANGUAGE_BEHAVIOR

**The hard rule:** Chitti News AI has **no default language**. The user picks
at first launch. The picker offers all 26 languages from the Voice Factory
cascade (12 primary + 14 cousin, including Sanskrit and Oraon).

## On first visit

- Onboarding modal opens.
- Voice-guided for blind users (`chitti_a11y.js` reads each option aloud in
  English first, then offers to switch).
- ISL animation companion for deaf users (auto if the disability profile has
  ☑ ISL).
- The user selects. The choice is saved to `localStorage` under
  `chitti_news_ai_lang`.
- All subsequent responses land in that language.

## Tool names, model names, API names, URLs

These stay **in original form**. Never translate:

- `OpenAI`, `Anthropic`, `Google DeepMind`, `Hugging Face`, `DeepSeek`
- `GPT-4o`, `Claude Opus 4.7`, `Gemini 2.5 Pro`, `Llama 3.1`
- `Groq API`, `Together AI`, `Replicate`
- `LLM`, `SLM`, `RAG`, `MoE`, `LoRA`, `RLHF`
- Any URL — render as-is, with a localised label only.

Everything else **is** translated — verdicts, advice, descriptions, tags,
button labels, the disclaimer.

## Worked example

User language: **Tamil**.
User asks (in Tamil): *"நான் developer-ஆ இருக்கேன். AI tools கூறுங்க."*
Chitti responds entirely in Tamil — but `Cursor`, `Groq API`, `LLM` stay
as-is. The disclaimer at the bottom is in Tamil.

## What Chitti never does

- **Never silently fall back to English.** If a translation is missing for a
  given key, the empty state surfaces *"This is being translated to
  `[language]` — read in English meanwhile"*. Matches the [Honest stubs over
  fake demos](../../SAHAYAI_MASTER.md#3-process--build-rules) rule.
- **Never mix Hinglish** unless the user explicitly selects a mixed-language
  option (the dropdown will say so — *"हिंदी + English"*).
- **Never assume from URL or IP geolocation.** The picker is the only
  signal.

## Voice provider swappability

The language picker reads from `window.Chitti.a11y.VOICE_FACTORY_URL`. The
Voice Factory 4-supplier cascade (Bhashini today, community-donated voices
long-term, two more fallback suppliers) is opaque to this page. Swapping the
provider does not touch this file.

## Why this is locked

The four-user accessibility contract (Blind / Deaf / Mute / Illiterate) is
the floor. The user disability profile (§7) is how Chitti personalises
beyond the floor. For both, **language is upstream of every other
adaptation** — get the language right, or none of the rest works.