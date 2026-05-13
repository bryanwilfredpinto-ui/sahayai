# Chitti News — Frontend

`index.html` is a verbatim mirror of the workspace-root `chitti_news.html`
(the file deployed at sahayai.in/chitti_news.html). Single-file SPA —
Bharat Premium theme + Hindi UI toggle + state/language picker + 6-tab
category feed + Demo Mode + Read Later/Cancelled folders.

## What's wired
The frontend talks to the Chitti News backend via `API_BASE`, defaulting
to `https://chitti-news-api.onrender.com`. To override per-device:

```js
localStorage.setItem('chitti_news_api_base', 'http://localhost:8002');
location.reload();
```

## Endpoints called
- `GET  /api/news/{state}/{language}/{category}` — main feed
- `GET  /api/news/breaking?state=&language=` — ribbon
- `GET  /api/news/article/{id}/take?language=` — Chitti's Take (DeepSeek)
- `GET  /api/news/article/{id}/factcheck` — cross-source verdict
- `GET/POST/DELETE /api/news/save` — Read Later / Cancelled folders

Every API response carries `speak_en` + `speak_hi` for the four-user contract.
