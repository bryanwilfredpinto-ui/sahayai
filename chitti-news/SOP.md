# CNOS — STANDARD OPERATING PROCEDURES

Mechanical steps for the operational events. Owned by the 7-agent swarm in [`swarm/`](swarm/).

---

## SOP-001 — New article arrives

When a publisher RSS / app-API ingest lands a new article in `news.articles`:

| Step | Owner | Output |
|---|---|---|
| 1. **Classify** | News Agent + Content classifier | category {national, state, politics, business, sports, entertainment, tech} |
| 2. **Verify** | Verification Agent ([`skills/chitti-news-factcheck/`](skills/chitti-news-factcheck/)) | verdict {verified, partial, disputed, unverified} + `match_count` |
| 3. **Deduplicate** | News Agent | suppress if hash matches existing article from another publisher |
| 4. **Summarize** | Summarizer ([`skills/chitti-news-summarizer/`](skills/chitti-news-summarizer/)) | 3-bullet "Chitti's Take" in en + hi (and user's chosen lang on demand) |
| 5. **Generate impact** | Context Agent | 1-line "why this matters" + affected-group note |
| 6. **Generate action plan** | Action Agent | 1-sentence "what to watch for" or "what to do next" |
| 7. **Publish** | feed engine | article surfaces in feed; coverage payload updated |

**Time budget per SOP-001 run: < 60 s end-to-end** (target).

---

## SOP-002 — Fact-check verdict drift

When a new corroborating source lands AFTER an article has been verdicted:

1. Re-run cross-source match
2. If verdict changes → reflect in UI immediately (`/api/news/feed` returns new verdict)
3. Log verdict history → user sees both old + new on tap-and-hold
4. If verdict drifts `verified` → `disputed`: surface alert on Founder dashboard

**Hard rule:** Verdict can downgrade. Verdict NEVER upgrades silently — every `verified` requires ≥2 source match at verdict time.

---

## SOP-003 — Per-language coverage gap detected

Triggered nightly by [`scripts/coverage_sla_check.py`](backend/scripts/coverage_sla_check.py):

1. Check per-(state, language, category): article count over last 24h
2. If any cell < per-cell minimum (default 5): write violation row to report
3. If report has violations: send alert email to Sire via Founder report
4. If a language has been below SLA for 7 consecutive days: auto-create TODO entry in chitti-news/TODO.md

---

## SOP-004 — Publisher fetch failure

Triggered by `news_ingest._http_get` on any non-2xx:

1. Log `last_error` + `last_fetched_at` per source
2. Retry with cloudscraper fallback (for Cloudflare-protected)
3. After 24h consecutive failure: auto-deprioritise in feed (still ingested if recovers)
4. After 7d consecutive failure: flag for manual mitmproxy capture (see Sandesh / Divya Bhaskar pattern)

---

## SOP-005 — Cancelled-story respect

When a user cancels a story:

1. Story ID written to `localStorage.chitti_news_cancelled`
2. On every subsequent feed render, cancelled IDs filtered out
3. NEVER re-appears for that device — `Chitti.forget()` is the only way to reset
4. Per-device only. Never synced to backend.

Cert: [`tools/cert_cancelled_story.mjs`](../tools/cert_cancelled_story.mjs) (4/4 PASS).

---

## SOP-006 — Trust Strip render

On every card render:

1. Pull `factcheck.verdict` + `factcheck.match_count` + per-publisher trust score + computed reading time
2. Render in < 2 s — these 4 elements must be in the DOM before any image / video loads
3. If any of the 4 elements is missing → show "Verification pending" honestly (never silent omission)

Cert: [`tools/cert_chitti_news_v2.mjs`](../tools/cert_chitti_news_v2.mjs) (signals: verified + fact + sources + reading present live).

---

## SOP-007 — Politics neutrality enforcement

Triggered weekly by [`scripts/neutrality_eval.py`](backend/scripts/neutrality_eval.py):

1. Sample 100 politics articles across 13 states
2. Scan summaries for partisan-label dictionary (curated list)
3. If any article triggers a partisan label hit: alert immediately
4. Hard rule: 0 violations per quarter. >0 → block release until fixed.

Current state: 0/100 violations (run 2026-06-03).

---

## SOP-008 — Voice + ISL per response

For every card surfaced:

1. 🔊 button auto-attached via `feedback-widget.js` (data-chitti-response)
2. ISL panel auto-attached via `chitti_a11y.js` (when user's Disability Profile has ISL)
3. Speaker reads FULL RSS body, not just headline
4. If language fallback occurs: speaker reads in source language with honest note

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
