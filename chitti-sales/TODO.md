# Chitti Sales — TODO

## Status (2026-05-12)

**Nothing is built yet.** This folder is docs-only. The list below is the build queue, in rough order.

## 1. Backend skeleton (not started)

Mirror [chitti-ca/backend/](../chitti-ca/backend/) one-for-one:

- [ ] `backend/main.py` — Flask app factory, blueprint registration, `/` banner + `/health`.
- [ ] `backend/config.py` — `Settings` dataclass driven by env vars.
- [ ] `backend/routes/sales.py` — blueprint under `/api/sales`, `GET /health` + `POST /ask`.
- [ ] `backend/services/sales_service.py` — DeepSeek wrapper, system prompt, language map, topic map, `_enforce_disclaimer()`.
- [ ] `backend/requirements.txt` — `flask 3.0.3`, `flask-cors 4.0.1`, `gunicorn 22.0.0`, `httpx 0.27.2`.
- [ ] `backend/runtime.txt` — `python-3.11.10`.
- [ ] `render.yaml` — `chitti-sales-api` free-plan web service.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the proposed wiring and [PROMPTS.md](PROMPTS.md) for the proposed system prompt.

## 2. Frontend page (not started)

`chitti_sales.html` at the repo root:

- [ ] Permanent sticky "this is coaching, not a guarantee" banner.
- [ ] Topic chips: Lead / Follow-up / Pricing / Objection / Referral / Cold call / Customer retention / Upsell.
- [ ] Language selector (12 Indian languages — same set as [chitti-ca](../chitti-ca/) and [chitti-legal](../chitti-legal/)).
- [ ] Web Speech mic-in.
- [ ] SpeechSynthesis read-aloud out.
- [ ] Inclusion of [feedback-widget.js](../feedback-widget.js) at the bottom with `data-page="chitti_sales"`.
- [ ] High contrast, 48x48 dp touch targets, alt text on every icon — per the four-user contract in [CONTEXT.md](CONTEXT.md).

## 3. Deploy (not started)

- [ ] Railway service `chitti-sales-api` (free plan).
- [ ] `DEEPSEEK_API_KEY` env var (no other secrets).
- [ ] UptimeRobot poll on `/health` at 5-minute interval.
- [ ] Link the page from `index.html` at the repo root.

## 4. Future product gaps (deliberate "not yet")

These are the items called out in [CONTEXT.md](CONTEXT.md) and [skills/DEVILS_ADVOCATE.md](skills/DEVILS_ADVOCATE.md):

- **No CRM integration.** No contact-list ingestion, no WhatsApp Business hookup, no autodialer. Hard line — the product is positioned as a coach, not a doer. Lifting this line would require a partner agreement and a careful privacy review.
- **No roleplay / pitch practice.** Text-only coaching today. A "rehearse this cold call with me" feature using the Voice Factory STT + TTS is the obvious next step but is out of scope for v1.
- **No outcome tracking.** Chitti cannot tell whether the tactic actually closed a sale. A v2 with optional "did this work?" follow-up (stored anonymously, opt-in) is sketched in [skills/OBSERVABILITY.md](skills/OBSERVABILITY.md).
- **No sector-specific verticals.** A "Chitti Sales for Kirana" or "Chitti Sales for Salon" with sector-tuned tactics is a v2 — the system prompt does the framing inline for v1.
- **No live cross-ref to book passages.** The model recalls from training; we do not have the 10 books as a retrieval-augmented corpus. Adding RAG with verified excerpts would let us cite verbatim — see [skills/GUARDRAILS.md](skills/GUARDRAILS.md) item on fabricated tactic names.

## 5. Voice Factory integration (deferred)

Today the frontend will use the browser's `webkitSpeechRecognition` and `SpeechSynthesis` — same approach as the other coaching Chittis. Once the shared [Chitti Voice Factory](../chitti-voice-factory/) ships, two routes get proxied:

- [ ] `/api/sales/stt` — proxy to Voice Factory STT (Bhashini → AI4Bharat → Google → ElevenLabs cascade).
- [ ] `/api/sales/tts` — proxy to Voice Factory TTS.

Until then the browser-only path is the four-user fallback.

## 6. Operational gaps (will arrive with the backend)

- [ ] Structured JSON logging (anonymised — `language`, `topic`, `len(text)` only; never the body). See [skills/OBSERVABILITY.md](skills/OBSERVABILITY.md).
- [ ] Disclaimer-injection audit counter (cheapest safety metric — same as Chitti CA / Legal).
- [ ] Per-tactic-citation frequency counter to catch the model fabricating tactic names.
- [ ] Rate limiting (per-IP) once the page is linked from `index.html`.

## 7. Feedback pipeline (will arrive with the frontend)

[FEEDBACK_CAPTURE.md](FEEDBACK_CAPTURE.md) lays out the storage schema, response SLA, and feedback-to-roadmap pipeline. The widget already exists ([feedback-widget.js](../feedback-widget.js)); the backend write path is wired through the existing Chitti Vaani feedback endpoint, so no new ingestion endpoint is needed for v1.
