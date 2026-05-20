# Architecture — Chitti Product Scanner

## One-line summary

A stateless Flask 3 service that takes either a multipart image **or** a JSON text payload, sends it to DeepSeek with a strict-JSON system prompt, normalises the reply, attaches a type-specific legal disclaimer and cross-product hand-off links, and returns it to a single-page frontend.

## Runtime topology

```
                                              ┌────────────────────┐
                                              │ DeepSeek API       │
                                              │ /chat/completions  │
                                              └─────────▲──────────┘
                                                        │ HTTPS (Bearer)
                                                        │ JSON-mode
                                                        │
                                              ┌─────────┴──────────┐
                                              │ scanner_service.py │
                                              │  analyze_text()    │
                                              │  analyze_image()   │
                                              │  _safe_parse()     │
  Browser                  Flask Blueprint    │  _normalise()      │
  ┌──────────┐    HTTPS    ┌──────────────┐   │  _cross_links()    │
  │ chitti_  │ ──────────► │ routes/      │ ──┤  _fallback()       │
  │ scanner. │   multipart │   scanner.py │   └────────────────────┘
  │ html     │   or JSON   │              │
  └──────────┘ ◄────────── │  /analyze    │
                JSON       │  /analyze/   │
                response   │     text     │
                           │  /health     │
                           └──────┬───────┘
                                  │
                                  │ register_blueprint
                                  │
                           ┌──────┴───────┐
                           │ main.py      │
                           │  Flask app,  │
                           │  CORS,       │
                           │  error       │
                           │  handlers    │
                           └──────────────┘
```

No database. No queue. No background worker. Each request is a single synchronous HTTP fan-out to DeepSeek.

## Layer breakdown

### 1. Entrypoint — `backend/main.py`

| Concern | Implementation |
|---|---|
| WSGI app | `app = _create_app()` at module scope so Gunicorn can import |
| Local dev | `python main.py` binds `0.0.0.0:8005`, `debug=True` |
| Body cap | `MAX_CONTENT_LENGTH = 8 MB` (returns HTTP 413 automatically) |
| CORS | `flask_cors.CORS` with origins from `ALLOWED_ORIGINS` env (CSV) or `*` if unset |
| Banner | `GET /` returns `{app, version, status}` |
| Liveness | `GET /health` returns `{ok: True}` |
| Error JSONification | Custom 400/404/405/413/415/500 handlers return `{error, detail}` JSON |
| Blueprint | `scanner_bp` mounted at `/api/scanner` |

### 2. Settings — `backend/config.py`

Frozen `@dataclass` reading from environment:

| Var | Default | Purpose |
|---|---|---|
| `DEEPSEEK_API_KEY` | `""` | Bearer token; if empty, service runs in `fallback` mode |
| `DEEPSEEK_MODEL` | `deepseek-chat` | Chat model id |
| `DEEPSEEK_URL` | `https://api.deepseek.com/chat/completions` | OpenAI-compatible endpoint |
| `DEEPSEEK_VISION_MODEL` | `deepseek-vl-chat` | Vision model id; set to `off` to disable image path |
| `ALLOWED_ORIGINS` | `""` | CSV of CORS origins |
| `SCANNER_MAX_TOKENS` | `700` | DeepSeek `max_tokens` |
| `SCANNER_TEMPERATURE` | `0.2` | DeepSeek `temperature` (kept low for strict JSON) |
| `MEDUPI_API_BASE` | `https://chitti-medupi-api-production.up.railway.app` | Used by the frontend only; the backend echoes it in `/health` |

### 3. Routes — `backend/routes/scanner.py`

A single Flask `Blueprint("scanner", url_prefix="/api/scanner")`:

| Endpoint | Branch logic |
|---|---|
| `POST /analyze` | If `request.files["image"]` present → validate MIME + size → `scanner_service.analyze_image(bytes, content_type, language)`. Otherwise parse JSON body and call `scanner_service.analyze_text(text, language)`. |
| `POST /analyze/text` | JSON-only convenience — same as the text branch above |
| `GET /health` | Returns `scanner_service.health()` (DeepSeek + vision status) |

Validation:
- Image must be `image/*` content type → `abort(415)` otherwise
- Empty image → `abort(400)`
- Image > 8 MB → `abort(413)`
- Empty text → `abort(400)`
- Text > 6000 chars → `abort(413)`

### 4. Service — `backend/services/scanner_service.py`

The brain. Public functions:

| Function | Returns |
|---|---|
| `analyze_text(text, language="hi")` | dict matching the canonical response shape |
| `analyze_image(image_bytes, content_type, language="hi")` | same shape (or `fallback_no_vision` if vision is off) |
| `health()` | `{ok, service, deepseek_configured, model, vision_model, medupi_api_base}` |

Internal helpers:

| Helper | Purpose |
|---|---|
| `CHITTI_SCANNER_PROMPT` | Frozen system prompt (see [PROMPTS.md](./PROMPTS.md)) |
| `LEGAL_BY_TYPE` | Server-enforced legal disclaimer per `type` |
| `_safe_parse(raw)` | Strip ``` fences, fall back to first `{...}` block, return `{}` on failure |
| `_normalise(parsed)` | Cap field lengths, validate `type`, attach `legal_disclaimer`, attach `cross_links` |
| `_clean_list(v, max_items, max_len)` | Coerce stringy lists, trim, cap |
| `_cross_links(type, out)` | Build the per-type hand-off array — see table below |
| `_fallback(text, language, error?)` | Returns a graceful "AI offline" response when DeepSeek is unreachable or unconfigured |

#### Cross-link rules

| `type` | Hand-off entry |
|---|---|
| `medicine` | `{product:"medupi", kind:"medupi_lookup", query:<brand or molecule or summary>}` |
| `bill`, `mrp` | `{product:"consumer_helpline", kind:"tel", query:"1800114000"}` |
| `insurance` | `{product:"upi_guard", kind:"upi_check", query:<summary>}` |
| `food` | `{product:"vaani", kind:"vaani_read", query:<speak_hi or speak_en>}` |
| `legal_doc`, `other` | (no auto hand-off — UI still shows the universal "Send to Vaani" FAB) |

### 5. Frontend — `chitti_scanner.html` (mirrored to `frontend/index.html`)

Single-file static page, hosted at `https://sahayai.in/chitti_scanner.html`. Key responsibilities:

| Concern | Implementation |
|---|---|
| Consent gate | `localStorage.chitti_scanner_consent_given` — six-section T&C modal with per-section 🔊 Hear buttons in 9 Indian languages |
| Capture | `navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}})` → live `<video>` → `canvas.toBlob('image/jpeg', 0.85)`; camera stream killed on `closeCamera()` or `beforeunload` |
| Upload | `<input type="file" accept="image/*">` |
| Text fallback | Textarea + 🎙️ mic button using Web SpeechRecognition |
| Analyse | `analyseUploadedImage()` POSTs multipart to `/api/scanner/analyze`; `analyseTypedText()` POSTs JSON to `/api/scanner/analyze/text` |
| Result render | Type badge (colour-coded), summary, key facts grid, findings, warnings (red), savings (green), legal box (amber), cross-link buttons |
| Auto read-aloud | `speechSynthesis.speak()` on `(speak_hi or speak_en) + legal_disclaimer` in chosen `bcp47` locale |
| MedUPI inline | When `type==='medicine'`, frontend `fetch(MEDUPI_API_BASE + '/api/medupi/medicine/<query>')` and renders the Jan Aushadhi alts inline |
| UPI Guard hand-off | `sessionStorage.chitti_handoff_text = query; window.location='chitti_upi.html?from=scanner'` |
| Vaani hand-off | Same pattern → `chitti_vaani.html?from=scanner` |
| History | 20-row `localStorage` ring buffer (`chitti_scanner_history`), cleared with one button |
| API base override | `?api=https://my-host` query param so the same HTML can hit local backend or production |
| MedUPI base override | `?medupi=https://my-medupi` query param |

### 6. Skill — `skills/chitti-scanner/SKILL.md`

A single sub-agent skill (no nested sub-skills yet) that describes the product end-to-end for Claude Code orchestration. It documents the repo layout, endpoint surface, response shape, per-type legal lines, consent gating, and cross-product hooks.

## Deployment

| Surface | Path | Hosting | Status |
|---|---|---|---|
| Frontend | `chitti_scanner.html` (root) + `chitti-scanner/frontend/index.html` (mirror) | Cloudflare Pages → `sahayai.in` | Live |
| Backend | `chitti-scanner/backend/` via `chitti-scanner/render.yaml` | Render (planned) | **Not connected** — render.yaml ready, service not yet provisioned |

### Render blueprint (`render.yaml`)

```yaml
services:
  - type: web
    name: chitti-scanner-api
    runtime: python
    rootDir: backend
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn main:app --bind 0.0.0.0:$PORT --workers 2 --timeout 90
    envVars:
      - PYTHON_VERSION=3.11.10
      - DEEPSEEK_API_KEY=<secret, sync:false>
      - DEEPSEEK_MODEL=deepseek-chat
      - DEEPSEEK_VISION_MODEL="off"
      - ALLOWED_ORIGINS=https://sahayai.in,https://www.sahayai.in
      - SCANNER_MAX_TOKENS=700
      - SCANNER_TEMPERATURE=0.2
      - MEDUPI_API_BASE=https://chitti-medupi-api-production.up.railway.app
```

## Dependencies

```
flask==3.0.3
flask-cors==4.0.1
gunicorn==22.0.0
httpx==0.27.2
```

Python `3.11.10` (pinned via `runtime.txt`).

## Failure modes

| Failure | Behaviour |
|---|---|
| `DEEPSEEK_API_KEY` missing | `_fallback()` — UI shows "AI offline" with `source:"fallback"` |
| DeepSeek HTTP error | `_fallback(..., error="deepseek_http_<status>")` |
| DeepSeek timeout / network | `_fallback(..., error=<exception>)` |
| Non-JSON model output | `_safe_parse()` extracts the first `{...}` block; if none, `_normalise({})` produces a polite "could not read clearly" reply |
| Vision model off / unset | `analyze_image()` returns a friendly "type the label" response with `source:"fallback_no_vision"` |
| CORS rejected | Browser fetch fails; user sees "Network: …" inline error |
