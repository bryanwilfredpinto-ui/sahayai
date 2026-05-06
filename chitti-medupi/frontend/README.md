# Chitti MedUPI — Frontend

`index.html` is a verbatim mirror of the workspace-root `chitti_medupi.html`
which is what's currently live at sahayai.in/chitti_medupi.html. Same
single-file SPA — Bharat Premium theme + Hindi UI toggle + 8 tabs +
medical disclaimer banner + medical disclaimer modal.

This folder exists so the structure matches `chitti-shares/` (sister
product). Until we set up a separate static-site deploy for MedUPI, the
file Bryan edits + serves is the workspace-root one.

## What's wired
Frontend talks to the live backend via `API_BASE`, defaulting to
`https://chitti-shares-api.onrender.com` (current production). To swap
to the new `chitti-medupi/backend` once deployed, run this in the
browser console on the live page:

```js
localStorage.setItem('chitti_medupi_api_base', 'https://chitti-medupi-api.onrender.com');
location.reload();
```

## Endpoints called
- `GET  /api/medupi/medicine/{name}` — text search
- `POST /api/medupi/scan` — image upload
- `GET  /api/medupi/jan_aushadhi?lat=&lng=` — geo store locator
- `GET  /api/medupi/jan_aushadhi/state?state=` — by-state fallback
- `GET  /api/medupi/insurance/{molecule}?scheme=` — coverage
- `GET/POST/DELETE /api/medupi/family/profile[s]` — multi-profile
- `GET/POST /api/medupi/family/wallet` — entries + monthly report
- `GET/POST/PATCH/DELETE /api/medupi/reminder` — reminder CRUD

Every API response carries `speak_en` + `speak_hi` so the frontend can
pipe results straight to SpeechSynthesis (four-user contract).
