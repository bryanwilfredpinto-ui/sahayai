# CHANGELOG — Chitti News

All shipped commits affecting [chitti-news/](.) (the product folder) plus the workspace-root mirrors [`chitti_news.html`](../chitti_news.html) and [`CHITTI_NEWS_MASTER_SPEC.md`](../CHITTI_NEWS_MASTER_SPEC.md).

Format: chronological, oldest first, grouped by feature theme. Pulled from `git log --oneline -- chitti-news/` + the master spec.

---

## v1.0 — Initial ship (2026-05-08)

### Foundation

- **`43ce210`** — `feat: Chitti News v1.0 — state-aware multi-language Indian news aggregator`
  - First shipping commit. 19 Python files (`main.py` + `config.py` + `database.py` + 5 models + 6 services + 13-endpoint Blueprint).
  - 789-line single-file SPA at workspace root with mirror at [`frontend/index.html`](frontend/index.html).
  - 26 RSS feeds in [`data/sources.json`](backend/data/sources.json) (TOI / The Hindu / NDTV / Moneycontrol / Deccan Herald / Deccan Chronicle / HT / News18 / Bhaskar / Jagran / NDTV-Hindi).
  - 6-row welcome seed in `data/articles_seed.json` (EN + HI).
  - 8 sub-agent `SKILL.md` files under [`skills/`](skills/) (top-level + summarizer + factcheck + 5 categories).
  - `news.*` schema isolation alongside `medupi.*` and `shares.*`.
  - APScheduler wired with `rss_poll` (every 30 min) + `daily_breaking` (06:00 IST).
  - First-launch state + language onboarding modal, persistent in `localStorage`.
  - Read Later + Cancelled folders with `X-User-Token` light auth.
  - Bharat Premium theme parity (saffron / navy / gold / cream).
  - Hindi UI toggle via `data-i18n` markers covering every visible string.
  - Demo Mode — 6-step guided tour with EN/HI narration.
  - Smoke tests: 19 Python files parse via `ast.parse`; 26 sources + 6 articles JSON-valid; 517 lines of inline JS pass `node --check`.

### Documentation

- **`c147ce3`** — `docs(news): master spec at workspace root + onboarding prompt refresh`
  - [`CHITTI_NEWS_MASTER_SPEC.md`](../CHITTI_NEWS_MASTER_SPEC.md) landed at workspace root as the canonical reference.

### Resilience

- **`435ac73`** — `fix(news): graceful fallback when chitti-news-api is unreachable`
  - Frontend now degrades cleanly when the backend Railway service is cold-starting or down.

### Accessibility (four-user contract)

- **`c336173`** — `feat(news): 🔊 speaker button on every box (4-user contract parity with MedUPI)`
  - Every article card, picker dropdown, and overlay panel now has an explicit TTS button matching the MedUPI pattern.

### RSS coverage expansion

- **`1ae6324`** — `feat(news): RSS coverage for 10 priority states · 16 new verified feeds + bug fix`
  - 16 new verified feeds across MP, MH, KA, TN, WB, UP, DL, GJ, PB, AS.

- **`6ea3aac`** — `feat(news): +15 RSS feeds — Punjab/Bengali/Odia/Assam unblocked, BBC vernacular national`
  - Punjabi · Bangla · Odia · Assamese unblocked.
  - BBC vernacular national feeds added.

- **`8ff2511`** — `fix(news): seed_sources honours JSON enabled flag — keep stubs disabled`
  - [`news_seed.seed_sources_if_empty()`](backend/services/news_seed.py) now reads the `enabled` flag from `sources.json` so stub entries can ship disabled.

---

## v1.0.1 — Coverage + language polish (2026-05-09)

### Chitti Special

- **`ec8a784`** — `feat(news): Chitti Special — +26 feeds, first Malayalam/Kannada/Odia/Urdu coverage`
  - 26 new feeds; first publisher-grade coverage for Malayalam (`ml`), Kannada (`kn`), Odia (`od`), Urdu (`ur`).
  - "Chitti Special" curation: Bryan-supplied list of trusted vernacular outlets.

### Pan-India directory

- **`5537b6a`** — `feat(news): +10 feeds — Bryan-supplied Pan-India directory + 5 new states`
  - 10 additional feeds covering 5 new states (added to the `state` allowlist alongside the existing 10).

### Cross-product nav

- **`b540a8c`** — `feat(nav): expose Vaani · UPI Guard · Scanner from existing pages`
  - Header switch-buttons in News now link to Chitti Vaani, UPI Guard, and Scanner (alongside the existing Technical / Fundamentals / MedUPI links).

### Language picker fix

- **`570e4a5`** — `fix(news): unblock 5/12 languages — picker had Malayalam/Gujarati/Punjabi/Urdu missing + Odia code mismatch`
  - Frontend picker was missing 4 language options that the backend already supported.
  - Odia language code mismatch fixed (`od` vs `or`).

---

## Pending (next release — pulled from spec section 12)

See [TODO.md](TODO.md) for the full open-issue list. Highest priority:

1. **Deploy backend to Railway** — `render.yaml` is ready. Paste `DATABASE_URL` (same Supabase URL the siblings use) + `DEEPSEEK_API_KEY`. First poll fires within 30 min.
2. **Live verification** — once deployed, curl `/health`, `/api/news/india/en/national`, `/api/news/article/1/take`, `/api/news/article/1/factcheck`.
3. **Frontend cache update** — verify `API_BASE` points to `chitti-news-api-production.up.railway.app`.
4. **Regional language RSS** — Bangla / Telugu / Tamil / Odia outlets often don't publish public RSS. Plan: HTML scraping or app-API integration.
5. **Browser push notifications** for breaking news.
6. **Topic following** — keyword-based subscriptions ("Modi", "RBI", "ISRO").
7. **User-feedback loop** — thumbs up/down on Cancelled articles.
8. **Newsletter digest** — daily 6 AM email with top 5 stories per state.

---

## Versioning convention

- `v1.x` = pre-Railway-deploy iteration. Frontend live, backend is dev-ready but unconnected.
- `v2.x` planned for when the backend goes live on Railway and serves the first 100 real articles end-to-end.

---

*Living document. Append every commit before session close. Group by feature theme; date in IST.*
