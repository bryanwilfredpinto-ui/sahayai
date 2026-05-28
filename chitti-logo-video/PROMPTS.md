# PROMPTS — Chitti Logo & Video

## N/A — this service uses zero LLM prompts today

Unlike sibling Chitti products ([Chitti CA](../chitti-ca/), [Chitti Legal](../chitti-legal/), [Chitti News](../chitti-news/)), Chitti Logo & Video does **not** call DeepSeek, Anthropic, OpenAI, or any LLM in v1. There is therefore nothing to quote.

### Verification

- [`backend/requirements.txt`](backend/requirements.txt) — three lines: `flask`, `flask-cors`, `gunicorn`. No `anthropic`, `openai`, `deepseek`, `replicate`, or any LLM client.
- [`backend/config.py`](backend/config.py) — no `*_API_KEY` env for an LLM; only `REPLICATE_API_TOKEN` (image gen) and `VIDEO_PROVIDER_KEY` (video gen).
- `grep -nE "anthropic|openai|deepseek|claude|gpt|llm|prompt"` across `chitti-logo-video/` → no hits.

### Where prompts *would* go (and what they should look like)

When the real generators wire in, prompts will live in:

| Future file | Will contain |
|---|---|
| `backend/services/logo_service.py` (new helper `_build_logo_prompt()`) | The image-gen prompt template for Replicate / Stability / Ideogram. |
| `backend/services/video_service.py` (new helper `_build_video_prompt()`) | The video-gen prompt template, plus narrator-script polishing prompt if we route via DeepSeek. |
| `backend/services/narrator.py` (new) | TTS request body to Chitti Voice Factory — not really a "prompt" but worth tracking. |

### Draft prompt sketches (NOT IN CODE YET — for reference only)

These are illustrative — they will be added to this file *verbatim* once they ship in code.

**Logo prompt sketch (Replicate / SDXL / Ideogram):**

```
A minimalist {style} logo for a small Indian business named "{brand_name}".
{tagline_clause}
Color palette: primary {primary_hex}, secondary {secondary_hex}, accent {accent_hex}.
Style: clean vector, flat, no gradient noise, transparent background, square 1024x1024,
no text artifacts, no watermark, no signature, suitable for WhatsApp profile picture
and 600 DPI Xerox printing. Bharat / Indian small-business aesthetic.
```

**Narrator-script polishing prompt sketch (optional DeepSeek pass):**

```
You are writing a 30-second voiceover script for a small Indian shop's explainer reel.
The shop owner wrote: {user_script}
Language: {language}
Rewrite this script so it:
- Fits within {duration_s} seconds when spoken at normal Indian conversational pace.
- Sounds natural to a {language} speaker (not translated-from-English).
- Mentions the shop name "{brand_name}" exactly once near the start.
- Ends with a clear call-to-action.
- Contains no claims that require regulatory disclaimers (no medical, no investment,
  no political claims).
Output only the final script, no commentary, no quotes.
```

**Video-gen prompt sketch (Pika / Runway):**

```
30-second explainer reel for an Indian small business "{brand_name}".
Visuals: {visual_brief_derived_from_script}.
Style: warm, festive, vibrant Bharat aesthetic, palette {palette_name}.
Aspect ratio: 9:16 vertical (Instagram reel + WhatsApp status).
No on-screen text — narrator audio carries the message.
```

These will be moved into code (and quoted here verbatim) the moment the real-provider branches in [`logo_service._replicate_generate()`](backend/services/logo_service.py) and [`video_service.enqueue()`](backend/services/video_service.py) ship.

### Why no prompts today

The "honest stub" pattern means we ship a real deterministic output (an `_mock_svg()` hand-built in Python, an `_placeholder_url()` data-URL card) without involving an LLM. This:

1. Costs zero per request (free-tier Railway only).
2. Has zero failure modes from external LLM rate limits / outages.
3. Stays meaningful for users even when API keys are unset — the SVG is *real*.

The day Bryan provides keys, prompts land in code and this file is updated to quote them verbatim per the rules in [Chitti Technical master spec](../CHITTI_TECHNICAL_MASTER_SPEC.md).
