# SOP-004 — Deploy

- **Frontend** (`chitti_technical.html` + `chitti_technical_engine.js` + `_i18n.js` + `_a11y.js` + `_sw.js`):
  pushed to `main` → GitHub Pages auto-deploys to https://sahayai.in/chitti_technical.html (~1–2 min; HTML
  is served `max-age=600`). The Service Worker is **network-first for HTML** so a deploy is never stale.
  Cache-bust a fresh load with `?v=<n>`.
- **Backend** (`chitti-shares-api`): pushed to `main` → Railway auto-redeploys (~2 min). `/health` returns 200.
- **Commit hygiene:** local tree is tangled on `feat/vaani-ceos-handover`; commit via a worktree off
  `origin/main` (`git worktree add /tmp/wt origin/main`), copy changed files in, commit, push `HEAD:main`, prune.
- **Post-deploy:** hard-refresh / `?v=` and confirm the change live before reporting done.
