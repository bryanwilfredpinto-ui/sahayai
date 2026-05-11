# TODO — Chitti Legal

## In-code markers

`grep -rE "TODO|FIXME|XXX" chitti-legal/` returns **no matches**. The backend is small enough that nothing has been deferred with an explicit marker.

## Frontend says it, backend does not

Cross-reading [chitti_legal.html](../chitti_legal.html) against [routes/legal.py](backend/routes/legal.py) and [services/legal_service.py](backend/services/legal_service.py), these features are visible / promised on the page but have no backend support yet:

- **Image / PDF upload of a notice.** The tagline says "Paste any rent agreement, notice, NDA, employment contract clause, FIR copy, or affidavit" and the placeholder warns users not to paste their Aadhaar — but the only input is a textarea. There is no file picker, no OCR endpoint, and no `multipart/form-data` route on the backend. A blind user with a paper notice has no path in.
- **Aadhaar / PAN / account-number scrubbing.** The system prompt tells the model never to *repeat* sensitive numbers, but the request payload is sent verbatim to DeepSeek. There is no server-side regex scrub of the inbound `text` before the upstream call. Logging at `httpx` error paths could also leak the first 200 chars of the body.
- **`🔊 Read aloud` for 12 languages.** The button calls `SpeechSynthesisUtterance` with `lang = <code>-IN`. Real browser support for `or-IN`, `pa-IN`, `ur-IN` voice synthesis is patchy; on those locales the deaf-illiterate fallback still works (text on screen), but the voice-out promise is partial. Routing through the Chitti Voice Factory (Tier C never-silently-fall-back rule) would close this.
- **Footer claims "Built on DeepSeek"** but the README and config also leave room for a DeepSeek-compatible gateway via `DEEPSEEK_URL`. No issue per se — just worth noting if Bryan migrates providers per the AI-provider-switching note.
- **No rate limit / no abuse guard.** Production exposes a free public endpoint with an 8000-char cap and a 30-second timeout — that is the only throttle. A single bad actor can burn the free-tier DeepSeek quota.

## Things the system prompt promises but no code verifies

- **"Open with the typical response window for time-sensitive notices."** This depends entirely on the model. There is no rule-based check that, when `doc_type` contains `notice` / `summons` / `138`, the first sentence mentions a deadline.
- **"Never invent statute numbers or case citations."** No regex or look-up against a real Indian statute list. The disclaimer is the only safety net.

## Nice-to-have for v1.1

- **Lawyer-directory referral** — at the end of every reply, optionally surface a "find a lawyer near you" CTA (consent-gated, location from the user's chosen state). The page currently links only to other Chitti products.
- **`/api/legal/explain` streaming** — long notices can take 6–8s on DeepSeek; a token-stream would let the screen reader start reading sooner.
- **Server-side language validation** — `_LANG_NAMES.get(language, language or "English")` silently passes garbage through. If the frontend ever sends `lang=xx`, the model is told *"Reply in xx"*. Should 400 instead.
- **Health endpoint should ping DeepSeek.** Currently `/api/legal/health` only reports `deepseek_configured: bool`. A real readiness check would help Render's health probe distinguish "key set but invalid" from "all good."
