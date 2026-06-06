# Agent 6 — Accessibility Agent

> Per COSDF L6 (lines 308-313). Adapts the assembled response to the user's
> disability profile + chosen modality.

---

## Purpose

Take the merged output of Agents 1-5 and rewrite/restyle it so the same content works for blind, deaf, mute, illiterate, low-vision, blind+deaf, and cognitive users — each in their preferred modality.

This is the agent that turns "a list of certs" into "a voice-narrated, ISL-rendered, emoji-prefixed list of certs" without changing the underlying data.

---

## Input

```json
{
  "merged_response": { ... output of Agents 1-5 ... },
  "disability_profile": {
    "blind": false,
    "deaf": true,
    "isl": true,
    "mute": false,
    "illiterate": false,
    "low_vision": false,
    "cognitive": false
  },
  "lang": "mr"
}
```

`disability_profile` is read from `localStorage.disability_profile` by `chitti_a11y.js` before the call.

---

## Output

```json
{
  "modality": "visual+isl",
  "render_hints": {
    "audio_autoplay": false,
    "audio_on_demand": true,
    "isl_panel": true,
    "captions_inline": true,
    "emoji_prefix_labels": false,
    "voice_command_listener": false,
    "tap_target_min_px": 48,
    "color_band_required": true
  },
  "content": { ... possibly-rewritten merged_response ... },
  "fallback_notes": []
}
```

The Accessibility Agent picks ONE primary modality from the matrix below and sets render hints. The frontend (`chitti_a11y.js`) honours every hint.

---

## Modality matrix (per COSDF L9)

| Profile signal | Primary modality | Key render hints |
|---|---|---|
| `blind=true` | voice-first | audio_autoplay=true, voice_command_listener=true, isl_panel=false |
| `deaf=true && isl=true` | visual+isl | isl_panel=true, audio_autoplay=false, captions_inline=true |
| `deaf=true && !isl` | visual+caption | captions_inline=true, audio_autoplay=false |
| `mute=true` (alone) | tap-only | voice_command_listener=false, tap_target_min_px=48 |
| `illiterate=true` | voice-first + emoji | audio_autoplay=true, emoji_prefix_labels=true, voice_command_listener=true |
| `low_vision=true` | large + voice | large_text=true, high_contrast=true, audio_on_demand=true |
| `blind=true && deaf=true` | haptic + tactile | haptic_pattern=morse, audio_autoplay=false |
| `cognitive=true` | simple + voice | simplify_language=true, repeat_on_request=true |
| none | default visual | standard render |

When multiple flags are set, the agent composes hints by OR-ing the truthy render hints from each profile. Conflicts resolve in the order above (blind > deaf > mute > illiterate > low_vision > cognitive).

---

## Content adaptation

| Modality | Adaptation applied |
|---|---|
| voice-first | Each list item shortened to a single sentence; "Shall I read the next one?" prompts inserted; URLs read as "tap to open" |
| visual+isl | ISL animation triggered per card; relevance verdict rendered as color band + emoji |
| voice-first + emoji | Every label prefixed with one of the 50-emoji vocabulary (📺 📖 ✍️ 🚀 ✅ ⏭️ 💾 🔧 …); voice readback on focus |
| tap-only | Free-text inputs replaced with tap chips; mic-button feedback path |
| haptic + tactile | Haptic pattern encodes count + importance; audio at max-volume fallback |

The underlying data (cert title, course URL, prompt text) is never changed — only the surfacing layer.

---

## Language layering

The Accessibility Agent does NOT translate. It only adapts modality. Translation is Agent 8 (Language Agent), which runs after this one. The chain is:

```
Agent 6 (Accessibility) → modality-adapted content (still in primary lang)
   ↓
Agent 8 (Language) → translated to user.lang
```

This separation lets us keep modality rendering logic independent of translation rules.

---

## Failure mode

| Failure | Behavior |
|---|---|
| `disability_profile` absent | Default visual modality; no haptic/ISL/voice-command opt-in. |
| `chitti_a11y.js` substrate not loaded | Agent emits hints anyway; frontend ignores them — feature degraded, never broken. |
| ISL dictionary entry missing for a word | Honest "ISL animation coming soon for this word" panel renders; fallback_notes append `"isl-missing:<word>"`. |
| TTS unavailable in `lang` | Falls back to closest supported language; fallback_notes append `"tts-fallback:<from>→<to>"`. |

---

## Test

`backend/tests/test_feed_endpoints.py::test_accessibility_agent_modality_matrix` asserts:
- For each row of the modality matrix, the agent produces the expected render_hints.
- Multi-flag profiles produce the composed hints in priority order.
- No modality ever returns audio_autoplay=true AND captions_inline=false together (would orphan deaf users).

---

## Integration with substrate

The output of this agent is consumed by `chitti_a11y.js` at render time:

```js
window.Chitti.a11y.applyHints(response.render_hints);
window.Chitti.a11y.renderModality(response.modality, response.content);
```

Substrate also re-runs the agent (via re-emit) when `disability_profile` changes (the `chitti:disability_profile` event in `chitti_news_ai.html` line 634).

---

Last reviewed: 2026-06-06
