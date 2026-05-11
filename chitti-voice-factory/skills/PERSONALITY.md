# PERSONALITY — Chitti Voice Factory

## Not a chat product

Voice Factory has **no LLM** in the TTS / STT path. There is no system
prompt, no temperature, no "tone of voice" to tune at the model layer.
Spec [`../PROMPTS.md`](../PROMPTS.md) is therefore deliberately empty of
LLM prompts. The "personality" of Voice Factory is its **supplier-cascade
policy** — the order in which we try voice sources, and the rules around
fallback, attribution, and honesty.

## The cascade as personality

```
on_device  →  bhashini  →  mock_bhashini  →  ai4bharat  →  sarvam
```

The order is fixed and load-bearing. It expresses what Voice Factory
*believes*:

1. **`on_device` first.** A blind user on a flaky 3G connection deserves
   sub-100 ms voice with zero ongoing cost. The dream is local. Today
   `on_device` returns `unavailable` for every language until quantised
   ONNX IndicTTS models are packaged (Phase 10) — but it gets first dibs
   so the day the models ship, nothing else has to change.
2. **`bhashini` second.** Bhashini is the Government of India NLTM
   platform — the legal, citizen-free, attribution-only source of truth
   for Indic TTS. Anything we can route through Bhashini, we must.
3. **`mock_bhashini` third — and honestly named.** Until ULCA credentials
   land, the mock returns a `client_directive: speech_synthesis` so the
   browser uses its own Web Speech API. The supplier in the ledger is
   **always** `mock_bhashini`, never relabelled as `bhashini`. Spec §11.1
   makes this a hard rule.
4. **`ai4bharat` fourth.** IIT Madras IndicTTS / IndicParler-TTS. Open
   weights, self-hosted, free at point of use.
5. **`sarvam` last.** Commercial, metered, rate-limited to 100 chars per
   request, only fires after every free supplier has failed. Spec §11.3.

## Tier C is its own personality

For Tier C (Tulu, Kodava, Oraon) there is **no cascade.** The router
short-circuits at the language gate and returns HTTP 503 with a donor URL.
This is not a failure mode — it is a stance. Voice Factory would rather
say "Chitti is still learning your language; please donate your voice"
than synthesise a fake-Tulu by routing Tulu text through a Kannada model.

## Tone of the audio response

Every successful `POST /api/voice/speak` response carries a `disclaimer`
field, e.g.:

> "MOCK supplier — replaces real Bhashini once NLTM credentials are
> issued. Voice is your device's built-in TTS. Not a real person."

That disclaimer is spoken first by the calling Chitti, then displayed in
captions. Honesty over polish. See [`../API.md`](../API.md) §1.
