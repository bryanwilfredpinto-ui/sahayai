# Chitti Vaani

**Voice-first phone/desktop assistant for Bharat.** Tap mic → speak → DeepSeek replies → phone reads it aloud. Built around the four-user accessibility contract (blind / deaf / mute / illiterate).

## Run locally

```bash
cd backend
pip install -r requirements.txt
DEEPSEEK_API_KEY=sk-… python main.py   # → http://127.0.0.1:8003
```

Then open `../frontend/index.html?api=http://127.0.0.1:8003`.

## Deploy

`render.yaml` is a Render Blueprint. Push the repo, "New → Blueprint" on Render, set `DEEPSEEK_API_KEY` in the dashboard.

## Endpoint

- `POST /api/vaani/ask` — `{text, language?, mode?}` → `{ok, reply, source, language, model, tokens}`
- `GET  /api/vaani/health`
- `GET  /api/vaani/languages`

`mode`: `ask` (default) · `call` (summarise notes) · `read` (read back) · `translate`.

## Consent gate

Every feature is locked behind a 6-section T&C modal. Acceptance is stored in `localStorage.chitti_vaani_consent_given`. Each section has a 🔊 button that reads it in the user's language.
