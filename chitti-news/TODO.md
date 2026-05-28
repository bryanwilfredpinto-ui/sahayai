# TODO — Chitti News

Open work items. Sourced from:
- [CHITTI_NEWS_MASTER_SPEC.md](../CHITTI_NEWS_MASTER_SPEC.md) sections 9 (Pending) + 12 (Build Status).
- `# TODO` / `# FIXME` / `# XXX` comments in the codebase (`grep TODO chitti-news/`).
- Live-deploy gaps identified in `project_render_deploy_status_2026_05_10.md`.

A note on `TODO` markers: a grep of [`chitti-news/`](.) for `TODO|FIXME|XXX` returned **no matches**. The work below comes from the spec + memory entries, not from inline code comments.

---

## P0 — Blocking production launch

### Deploy backend to Railway

- [ ] Paste `DATABASE_URL` (the shared Supabase URL the medupi + shares services already use) into the Railway dashboard.
- [ ] Paste `DEEPSEEK_API_KEY` (same key as siblings — locked LLM provider).
- [ ] Click "Apply" on the [render.yaml](render.yaml) blueprint.
- [ ] Wait for the first `rss_poll` to fire (within `RSS_POLL_MINUTES`, default 30).
- [ ] Verify the live curl invocations below return real data.

### Live verification (per memory `feedback_verify_before_handover.md`)

- [ ] `curl https://chitti-news-api-production.up.railway.app/health` → `{"ok": true}`.
- [ ] `curl https://chitti-news-api-production.up.railway.app/api/news/india/en/national` → `count >= 10` after first poll.
- [ ] `curl -X POST https://chitti-news-api-production.up.railway.app/api/news/article/1/factcheck` → returns a verdict with rationale.
- [ ] `curl 'https://chitti-news-api-production.up.railway.app/api/news/article/1/take?language=hi'` → returns 3 Hindi bullets.
- [ ] Open `https://sahayai.in/chitti_news.html` end-to-end: picker → category nav → Take → Fact → Save → Share.

### Frontend API_BASE pointer

- [ ] Confirm the inline JS `API_BASE` constant in `chitti_news.html` resolves to `https://chitti-news-api-production.up.railway.app` in production. The default in the HTML targets that hostname.

---

## P1 — Coverage gaps

### Regional language RSS (v1.1)

Most of the country's vernacular outlets don't publish public RSS, publish broken RSS, or geoblock it. The current partial coverage will not scale by adding more URLs to [`sources.json`](backend/data/sources.json).

- [ ] **Bangla** — Anandabazar Patrika, Ei Samay (no public RSS — plan HTML-scrape).
- [ ] **Telugu** — Eenadu, Sakshi (HTML-scrape or licensed feed).
- [ ] **Tamil** — Dinamalar, Daily Thanthi.
- [ ] **Malayalam** — beyond the BBC vernacular feed shipped in `ec8a784`, add Mathrubhumi / Manorama.
- [ ] **Odia** — Sambad, Pragativadi.
- [ ] **Assamese** — beyond BBC, add Asomiya Pratidin / Dainik Janambhumi.
- [ ] Build an HTML-scrape worker (separate from `news_ingest.py` to keep the RSS path pure) once we have ≥3 sources that justify it.

### State coverage

Currently `india`, `mp`, `mh`, `ka`, `tn`, `wb`, `up`, `dl`, `gj`, `pb`, `as`, `od`. Add:
- [ ] Bihar (`br`), Rajasthan (`rj`), Haryana (`hr`), Jharkhand (`jh`), Chhattisgarh (`cg`), Uttarakhand (`uk`), HP (`hp`), J&K (`jk`).
- [ ] North-east beyond Assam: Manipur, Meghalaya, Tripura, Nagaland, Arunachal, Mizoram, Sikkim.

---

## P2 — Feature gaps from spec

### Notifications + digest

- [ ] **Browser push notifications** for breaking news — service worker + Notification API.
- [ ] **Newsletter digest** — daily 6 AM email with the top 5 stories from user's state in their language. Likely a new APScheduler cron + an email-send service (Resend / Postmark / SES).
- [ ] **WhatsApp Business API** for breaking-news subscription (opt-in).

### Feedback + personalisation

- [ ] **User-feedback loop** — thumbs up/down on Cancelled articles to learn preferences. Schema: extend [`models/read_later.py`](backend/models/read_later.py) with a `reaction` column.
- [ ] **Per-source preferences** — let users mute/pin specific outlets. Schema: new `news.source_prefs(user_token, source_slug, status)` table.
- [ ] **Topic following** — keyword subscriptions ("Modi", "RBI", "ISRO"). Schema: new `news.topic_subs(user_token, keyword)` table + a filter applied in `news_db.feed`.

### Audio-first mode

- [ ] **Hands-free playback queue** for commute / cooking listeners. Frontend feature — chain SpeechSynthesis utterances over the current feed.

### Citizen reporter

- [ ] **NewsBreak-style submissions** — user can submit hyperlocal news with photos. Requires moderation + content-policy review. Out of v1.x by intent.

### Cross-product handoff

- [ ] **MedUPI link-out** — when an article mentions a medicine, surface a "Open in Chitti MedUPI" deep-link.
- [ ] **Shares link-out** — when an article mentions a listed company, surface a "Open in Chitti Technical" deep-link.

---

## P3 — Fact-check engine v2

The v1 fact-checker uses title-similarity (`rapidfuzz.fuzz.token_set_ratio` ≥ 70). It misses paraphrased headlines like "RBI cuts repo rate" vs "Central bank lowers benchmark".

- [ ] **Entity + verb extraction** via DeepSeek — extract the actor, action, object from each title; compare on those, not raw tokens.
- [ ] **Sentence-embedding similarity** as a second signal (sentence-transformers; DeepSeek does not currently ship a hosted embeddings endpoint, so this stays local).
- [ ] Promote the rationale generation from template to LLM-generated once the matching improves.

---

## P4 — Out of scope (intentionally NOT building)

From [CHITTI_NEWS_MASTER_SPEC.md](../CHITTI_NEWS_MASTER_SPEC.md) section 9:

- Original reporting / journalism — Chitti News is an aggregator.
- Paywalled / login-walled content.
- Comments / community discussions on articles.
- Behavioural targeting / ad tracking.
- Live video / TV streaming.

These are not items to do later — they are explicitly out of scope.

---

## Inline-comment audit

Result of `grep -rn 'TODO\|FIXME\|XXX' chitti-news/`:

```
(no matches)
```

The code is comment-clean. All open work is captured above from the spec + memory entries.

---

## Closing checklist (per session)

Copied from [CHITTI_NEWS_MASTER_SPEC.md](../CHITTI_NEWS_MASTER_SPEC.md) section 14:

- [ ] `node --check` passes on `chitti_news.html`'s main script block.
- [ ] `git fetch && git rev-list --count main...origin/main` is `0 0` before push.
- [ ] Live URL `https://sahayai.in/chitti_news.html` opens, picker bar visible.
- [ ] Hindi toggle switches every marked string and `sp()` voice.
- [ ] Bharat theme consistent — same palette + card style as Technical / Fundamentals / MedUPI.
- [ ] Four-user lens audit on every new control.
- [ ] State + language onboarding modal opens on first launch.
- [ ] Update master-spec section 12 (built / pending / out-of-scope) before close.
- [ ] Update memory entry `project_chitti_news_spec.md` if structure shifts.
