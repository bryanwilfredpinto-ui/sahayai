# Chitti News AI — TODO

## P0 — Next session

- [ ] Wire DeepSeek client in `services/topic_extractor.py` (no hardcoded profession list — see RANKING_FORMULA worked example).
- [ ] Implement Layer 1 of `trust_scorer.py` — domain age (WHOIS) + author presence + About Us + ad density + language quality + correction policy.
- [ ] Implement Layer 4 — weekly 0–100 trust score recompute.
- [ ] Wire `rss_fetcher.poll_all()` against the 17 seeded RSS sources, honour `robots.txt` blocks.
- [ ] Hook `POST /api/news-ai/tools-for-me` end-to-end (DeepSeek → ranker → render in user's language).
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
