# Agent 8 — Language Agent

> Per COSDF L6 (lines 322-326). Final agent in the swarm pipeline.
> Translates the response to the user's chosen language.

---

## Purpose

Take the Trust & Quality Agent's verified response and render it in the user's `chitti_lang`. Honour the 100+ language target (COSDF L9) with honest fallback when a language is not yet covered.

---

## Input

```json
{
  "verified_response": { ... output of Agent 7 ... },
  "lang": "ta"
}
```

The `lang` field is the user's `chitti_lang` setting — written to localStorage by the language selector substrate (`chitti_lang.js`).

---

## Output

```json
{
  "translated_response": { ... same shape as input, but translated ... },
  "translation_meta": {
    "lang": "ta",
    "fallback_used": false,
    "fallback_from": null,
    "untranslated_fields": ["url", "prompt_text"],
    "tts_available": true,
    "isl_available": false,
    "as_of": "2026-06-06T07:00:00Z"
  }
}
```

`untranslated_fields` records fields we intentionally KEEP in source language:
- `url` — translating URLs would break them.
- `prompt_text` — translating prompts changes their behavior (an LLM responds differently to a translated prompt).
- `issuer` proper names (e.g. "Coursera", "Anthropic").

---

## Language tiers

| Tier | Languages | Translation path |
|---|---|---|
| P0 — Indian (12) | Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, Odia, Assamese, Urdu | Voice Factory dictionary + Bhashini (mock until ULCA creds land) |
| P0 — Global (9) | English, Spanish, French, Arabic, Portuguese (Brazil), Russian, Chinese (Simplified), Japanese, German | Curated translation tables + DeepSeek augmentation (non-critical path) |
| P1 — African | Swahili, Yoruba, Hausa, Igbo, Amharic, Zulu | DeepSeek augmentation; honest "in progress" badge |
| P1 — Southeast Asian | Indonesian, Thai, Vietnamese, Filipino | DeepSeek augmentation |
| P2 — European | Italian, Dutch, Polish, Turkish | DeepSeek augmentation |
| P2 — Middle Eastern | Farsi, Hebrew | DeepSeek augmentation |
| P3 — Other | ALL | Best-effort DeepSeek; honest fallback note |

---

## Fallback rules

1. If `lang` has no curated table AND DeepSeek is unavailable, fall back to the closest covered language family member:
   - Bhojpuri / Awadhi → Hindi.
   - Konkani → Marathi.
   - Sindhi → Urdu / Hindi.
   - Tulu → Kannada.
2. Set `fallback_used=true` and `fallback_from=<closest_covered>`.
3. Render an honest banner in the response: *"Translation in [closest_covered] — your language coming soon."*
4. Never silently fall back without telling the user.

---

## What we never translate

- URLs.
- Prompt text (semantic change risk).
- Tool / company proper nouns (Harvey, Coursera, DeepSeek, etc.).
- Numeric scores ("21/100" stays as digits regardless of locale; the surrounding word is translated).
- Code snippets in projects (starter-repo language stays in source).

---

## Voice + ISL availability metadata

The agent populates `tts_available` and `isl_available` flags so the Accessibility Agent's downstream-rendered hints can degrade gracefully:

```js
if (!translation_meta.tts_available) {
  render_hints.audio_autoplay = false;
  render_hints.honest_announce = "Voice not available in your language yet";
}
```

---

## Failure mode

| Failure | Behavior |
|---|---|
| Lang code unrecognized (e.g. "xx") | Falls back to English; sets fallback_used=true. |
| Curated table partial (covers 60% of fields) | Translates what's covered; leaves rest in English with honest note. |
| DeepSeek unavailable (rate-limited / down) | Curated-only path; logs YELLOW; users in non-curated langs see English with honest banner. |
| Mixed-script rendering issue (e.g. Tamil with Latin numerals) | We allow; numerals stay in user-selected numeral system if locale defaults to it. |

---

## Test

`backend/tests/test_feed_endpoints.py::test_language_agent_no_mixed_lang` asserts:
- For each P0 language fixture, the response has no English mixed in (except `untranslated_fields`).
- For an unknown `lang`, fallback_used=true and `fallback_from` is populated.
- URLs are byte-identical pre/post translation.

---

## Caching

Translated responses are cached per `(role, lang, response_hash)` with a 6-hour TTL. Cache invalidates when the underlying response changes (e.g. new RSS poll adds new news cards).

---

Last reviewed: 2026-06-06
