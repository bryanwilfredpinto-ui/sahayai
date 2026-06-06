# Agent 2 — Language Agent

> Swarm Agent 2 of 6 for Chitti Vaani. Runs after Router Agent, before Empathy Agent.
> Handles language auto-detection, Voice Factory cascade assignment, and honest
> Tier C fallback. Never silently substitutes a related language.
> Per SAHAYAI_MASTER.md §2 (Voice Factory — Tier C never silently falls back).

---

## Purpose

1. Normalise the user's language to a canonical Voice Factory language code.
2. Assign the correct Voice Factory supplier tier for that language.
3. Surface an honest, spoken message when a language has no voice support (Tier C).
4. Detect code-switching (e.g. Hindi-English mix) and handle gracefully.

---

## Input

```json
{
  "text_sample": "Main apna paisa kaise bachaaun?",
  "lang_hint": "hi",
  "browser_lang": "en-IN",
  "disability_profile": { "blind": true }
}
```

---

## Output

```json
{
  "lang_normalised": "hi",
  "lang_display": "Hindi",
  "voice_tier": "A",
  "tts_available": true,
  "stt_available": true,
  "supplier": "mock_bhashini",
  "supplier_note": null,
  "fallback_applied": false,
  "fallback_note": null,
  "code_switch_detected": false,
  "translation_meta": {
    "source_lang": "hi",
    "target_lang": "hi",
    "translated": false
  }
}
```

For a Tier C language:
```json
{
  "lang_normalised": "tcy",
  "lang_display": "Tulu",
  "voice_tier": "C",
  "tts_available": false,
  "stt_available": false,
  "supplier": null,
  "supplier_note": null,
  "fallback_applied": false,
  "fallback_note": "Voice service not supported for Tulu — please type or switch to Kannada.",
  "translation_meta": { "source_lang": "tcy", "target_lang": "tcy", "translated": false }
}
```

---

## Voice Factory Cascade (4 Suppliers)

| Order | Supplier | When active | Tier |
|---|---|---|---|
| 1 | mock_bhashini | Always — until ULCA creds arrive | A/B stub |
| 2 | Bhashini (real) | When ULCA creds are live | A/B live |
| 3 | 3rd-party TTS (Google Cloud TTS / Azure) | When Bhashini unavailable | B |
| 4 | Community-donated voices | As each language crosses quality threshold | A (replaces Bhashini) |

The cascade is assigned per language at request time. The Language Agent reads
the current ledger from `chitti-voice-factory/backend/services/voice_ledger.py`.

---

## Language Tiers

| Tier | Coverage | TTS | STT |
|---|---|---|---|
| A | 12 primary languages | Full | Full |
| B | 14 cousin languages | Partial (may use related-language model) | Partial |
| C | Remaining registered codes | None | None |

**Tier C rule:** If Tier C is reached, the Language Agent surfaces an honest
spoken message to the user in the closest available language (not silently):

> *"Is bhasha mein awaaz seva uplabdh nahi hai — kripya type karein ya doosri
> bhasha chunein."*

The Tier C message is never suppressed. No fallback to a "close-enough" language
without explicitly telling the user.

---

## 26 Registered Languages

| Code | Language | Tier |
|---|---|---|
| hi | Hindi | A |
| en | English | A |
| ta | Tamil | A |
| te | Telugu | A |
| bn | Bengali | A |
| mr | Marathi | A |
| gu | Gujarati | A |
| kn | Kannada | A |
| ml | Malayalam | A |
| or | Odia | A |
| as | Assamese | A |
| pa | Punjabi | A |
| ur | Urdu | B |
| bho | Bhojpuri | B |
| hne | Chhattisgarhi | B |
| mai | Maithili | B |
| kok | Konkani | B |
| doi | Dogri | B |
| sd | Sindhi | B |
| ks | Kashmiri | B |
| mni | Meitei (Manipuri) | B |
| brx | Bodo | B |
| sat | Santali | B |
| sa | Sanskrit | B |
| tcy | Tulu | C |
| kru | Kurukh (Oraon) | C |

---

## Code-Switch Detection

Indian users frequently mix languages (Hindi-English "Hinglish", Tamil-English,
etc.). The Language Agent detects code-switching and chooses the dominant language
for TTS output while DeepSeek answers in the same mixed register.

Detection heuristic:
- If > 40% tokens in the request are English AND `lang_hint` is a non-English
  Tier A language: `code_switch_detected = true`, `lang_normalised` stays as
  the non-English language, DeepSeek instructed to "reply in <lang> with
  natural English code-switching".
- If > 80% tokens are English regardless of hint: reclassify to `lang_normalised = en`.

---

## Guardrails

- **Provider name never exposed.** The user sees "Chitti" not "Bhashini" or
  "Google TTS". `supplier` field is internal only.
- **Tier C is never silent.** The honest fallback message is always spoken (or
  shown in text for deaf users) before any content is returned.
- **No silent language substitution.** If Tulu (Tier C) is detected, Vaani
  does NOT silently switch to Kannada. It tells the user and offers Kannada as
  an option: *"Tulu mein awaaz nahi hai — kya main Kannada mein bolunga?"*
- **Community voices replace Bhashini per-language** as quality thresholds are
  crossed. When a language moves to community-donated voices, the `supplier`
  field updates in the ledger; no code change needed in the Language Agent.

---

## Voting / Escalation

The Language Agent does not veto — it provides the language context that
all downstream agents use. If `tts_available = false`, the response assembler
returns text-only output for that turn.

If the Language Agent cannot determine a usable language at all (e.g. unrecognised
script, corrupted input): `lang_normalised = en`, `fallback_applied = true`,
`fallback_note = "Language not recognised — defaulting to English."`.

---

## Swarm Learning

Patterns the swarm CAN learn (LOW-risk, no Sire approval required):
- Better language auto-detection heuristics for new code-switching patterns.
- Improved Tier B matching (when one Tier B supplier improves for a specific language).

Patterns the swarm CANNOT change:
- The Tier C honest-fallback requirement.
- The no-silent-substitution rule.
- The provider-name-never-exposed rule.
- The 26-language registry (adding a new language requires a Voice Factory commit).

---

## Test

`backend/tests/test_language_agent.py`:
- `test_tier_c_surfaces_honest_message` — Tulu request -> fallback_note present, tts_available = false.
- `test_no_silent_kannada_for_tulu` — Tulu request -> lang_normalised = tcy, not kn.
- `test_hinglish_detects_code_switch` — "Mujhe stock price chahiye for INFY" -> code_switch_detected = true.
- `test_provider_name_not_exposed` — supplier field is not present in public API response.
- `test_26_languages_registered` — all 26 codes present in the ledger.

---

Last reviewed: 2026-06-06
