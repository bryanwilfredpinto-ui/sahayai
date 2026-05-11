# GUARDRAILS — Chitti Logo + Video

Mechanical guarantees enforced in code. Different from [`./BOUNDARIES.md`](./BOUNDARIES.md) (those are policy promises) — these are invariants the runtime maintains.

## 1. Brand name is echoed VERBATIM in the SVG monogram

The user types "Saraswati Kirana" → the SVG contains the literal string "Saraswati Kirana" inside the `<text>` element. No translation, no normalisation, no Title-Case rewrite, no profanity filter on the brand string itself.

- Source: [`../backend/services/logo_service.py`](../backend/services/logo_service.py) `_mock_svg()` — the brand string is passed straight through after `.strip()`.
- Why: rebranding "गोपाल किराना" silently to "Gopal Kirana" would destroy the user's identity.
- Limit: server still enforces `len <= 80` and rejects empty input (HTTP 400 / 413). See [`../API.md`](../API.md) endpoint 4.

## 2. Job IDs are uuid4 (collision-free)

Every video enqueue allocates `uuid4().hex` (32 hex chars). Probability of collision across the product's lifetime is negligible.

- Source: [`../backend/services/video_service.py`](../backend/services/video_service.py) `enqueue()`.
- Why: a collision would let user A poll user B's job and see their brand script. Unacceptable even in stub mode.
- Stronger guarantee later: when we move to Redis (P0 item 9 in [`../TODO.md`](../TODO.md)), uuid4 collisions are checked against existing keys.

## 3. Mock video URL points to a known placeholder, never a real video

`_placeholder_url()` returns a `data:image/svg+xml;utf8,<svg>...</svg>` URL inlining a 640x360 navy SVG card containing the job id prefix and the literal text "Mock video · Real renderer wires in when VIDEO_PROVIDER is set".

- Source: [`../backend/services/video_service.py`](../backend/services/video_service.py) `_placeholder_url()` lines 42–57.
- Why: violates [`./BOUNDARIES.md`](./BOUNDARIES.md) rule 5 if we ever return a real YouTube / stock-footage URL.
- Test: `assert resp["url"].startswith("data:image/svg+xml")` before flagging a deploy live.

## 4. Palette falls back to `bharat` for unknown names

Unknown palette → `bharat` (saffron + navy + gold + white). Never throws, never returns null colours, never renders a colourless SVG.

- Source: [`../backend/services/logo_service.py`](../backend/services/logo_service.py) `generate_logo()` palette lookup.

## 5. Style falls back to `monogram` for unknown values

Same shape — unknown `style` renders as monogram. Never an empty SVG.

## 6. CORS restricted to ALLOWED_ORIGINS

No `*`-wildcard. Origins come from env, comma-split in [`../backend/main.py`](../backend/main.py) `_origins()`.

## 7. Duration clamped to [5, 120] seconds

Even if the client sends `duration_s: 99999`, the server clamps to 120. Even if `-30`, clamps to 5. See [`../backend/services/video_service.py`](../backend/services/video_service.py) `enqueue()`.

## 8. Health endpoint always returns 200 with `{ok: true}`

So Render's health check never restarts the service mid-job. See [`../backend/main.py`](../backend/main.py) `health()`.
