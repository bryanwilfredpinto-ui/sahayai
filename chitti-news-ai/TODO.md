# Chitti News AI — TODO

## P0 — Next session

- [x] **Wire `rss_fetcher.poll_all()` against the 17 seeded RSS sources** — shipped 2026-05-14 (0.2.0). 15 active + 2 honestly-inactive (vendor RSS retired). 322-article first-poll, 0 errors, dedupe verified.
- [ ] Scrape adapter for `anthropic.com/news` + `ai.meta.com/blog/` — flip both back to `active=true` once it lands. Honest stub `active=false` until then.
- [ ] Wire DeepSeek client in `services/topic_extractor.py` (no hardcoded profession list — see RANKING_FORMULA worked example).
- [ ] Implement Layer 1 of `trust_scorer.py` — domain age (WHOIS) + author presence + About Us + ad density + language quality + correction policy.
- [ ] Implement Layer 4 — weekly 0–100 trust score recompute.
- [ ] Hook `POST /api/news-ai/tools-for-me` end-to-end (DeepSeek → ranker → render in user's language).
- [ ] DeepSeek importance scorer (0–100) — replaces the 0.0 honest stub. Cross-source corroboration via §2e Layer 2 monitoring.
- [ ] `robots.txt` precheck in `rss_fetcher._poll_rss` — set `ai_crawl_blocked=True` automatically when a vendor disallows our UA.
- [ ] Connect Turso libSQL embedded-replica adapter (replace local SQLite fallback in `database.py`).

## P1 — After P0 ships

- [ ] Daily briefing cron @ 07:00 IST — top 5 items, importance ≥ 75, read-aloud via Voice Factory.
- [ ] Free Tier Tracker — nightly diff vs previous snapshot per tool.
- [ ] Community source submission UI on the frontend; admin review surface for Layer 1 verification.
- [ ] Model Tracker — Hugging Face new-models RSS ingest + LMSYS eval polling.
- [ ] WhatsApp briefing channel (shared substrate with §5b).

## P2 — Cross-cutting

- [ ] Hall of Fame integration — accepted community submitters credited on `chitti_voice_hall_of_fame.html`.
- [ ] Camera substrate — magazine-page scan to find an article (P3 — needs new contract negotiation with users).
- [ ] Annual "Free-AI access in India" report — published openly on `sahayai.in/reports/`, FSSAI-style.

## Process reminders

- Every Planned → Built move requires curl-ing the live endpoint first ([`feedback_verify_before_handover`](../SAHAYAI_MASTER.md#3-process--build-rules)).
- New features follow the [LOCKED new-products process](../SAHAYAI_MASTER.md#2a-locked-decisions--agent-vision-voice-strategy-new-product-process-2026-05-13).
- Every page commit must keep all plugins loaded — verify via DevTools Network tab that `chitti_a11y.js`, `feedback-widget.js`, `chitti_features.js`, `chitti_isl_dictionary.json` all return 200.
