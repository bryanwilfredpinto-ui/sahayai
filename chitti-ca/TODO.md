# Chitti CA — TODO

## In-code markers

A grep for `TODO`, `FIXME`, `XXX`, `HACK` across `chitti-ca/` returned **no matches**. There are no inline code-debt markers at the moment.

## Frontend features the backend does not yet support

The user-facing page `chitti_ca.html` (at the repo root) exposes some UI affordances that work entirely client-side today but would benefit from server-side support. Backend gaps inferred by reading the page:

1. **Read-aloud (text-to-speech) uses the browser's `SpeechSynthesis` only.**
   The browser API has poor Indian-language coverage (especially for Odia, Punjabi, Urdu, Malayalam). Once the shared Chitti Voice Factory is wired up here, the backend should expose a `/api/ca/tts` route that proxies to the Voice Factory's 4-supplier cascade so blind users get a consistent voice across all Chitti products.

2. **Speech-to-text (the mic button) uses the browser's `webkitSpeechRecognition` only.**
   Same problem as above — patchy support, often English-biased. A future `/api/ca/stt` route should call Bhashini (or the mock_bhashini stub until ULCA creds land) so the four-user contract holds on phones without Web Speech.

3. **Topic chips are sent as a free-text `topic` hint.**
   The backend passes the topic into the user message as `(Topic hint: …)` but does not validate or normalise it. A small enum + per-topic prompt-prefix would let us tighten answers (e.g. always pull the latest GST threshold for the `GST` topic).

4. **No multi-turn history.**
   Each `POST /api/ca/ask` is independent. The frontend does not send prior turns either. For notice-reading questions ("here is the notice — now what should I do?") a 2-turn session would help. Out of scope while we hold the stateless guarantee, but worth listing.

5. **No rate limiting.**
   The free-tier Render deploy is exposed without any per-IP throttling. Acceptable while traffic is low; revisit once the page is linked from `index.html` and gets real users.

## Product gaps (from CONTEXT)

These are the deliberate "not yet" items called out in [CONTEXT.md](CONTEXT.md):

- **No ITR filing integration.** Chitti CA never submits to the income-tax portal. This is a hard line — the product is positioned as triage, not as a filer. Lifting this line would require a registered ERI (e-Return Intermediary) partnership.
- **No book-of-accounts reading.** We do not parse bank statements, invoices, or 26AS. The roadmap for "Chitti CA Pro" would start here, but it needs a real Chartered Accountant in the loop before launch.
- **No notice OCR.** Users today paste the notice text into the textarea. A `/api/ca/notice/ocr` route that accepts a photo and returns extracted text would be a clear next step once we have a vision provider (DeepSeek vision pending — see the AI-provider-switch memo).
- **No DigiLocker hookup.** Form 26AS / AIS / TIS pull would let us answer "what does the IT department already think I earned?" — but DigiLocker access requires a partner agreement, same blocker as Chitti Government.

## Operational gaps

- **No monitoring.** `/health` exists but nothing polls it.
- **No structured logging.** `log.error` / `log.exception` go to stdout only.
- **No metrics on disclaimer enforcement.** We assume `_enforce_disclaimer()` runs on every reply; a counter would let us verify in production.
