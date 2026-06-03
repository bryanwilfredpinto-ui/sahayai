# Chitti News — SWARM Intelligence

Inherits the platform-wide [SAHAYAI_MASTER §2f Swarm Intelligence contract](../SAHAYAI_MASTER.md#2f-swarm-intelligence--locked-2026-05-14).

---

## Signals collected (anonymised)

| Signal | Source | Per-row attributes | Stored where |
|---|---|---|---|
| Per-card 👍 / 👎 | `feedback-widget.js` | article_id, state, language, category, sentiment | `quality_feedback` (Turso, `news.*` schema) |
| Per-article "Open at source" CTR | frontend | article_id, state, language, clicked | `/api/feedback/collect` |
| Per-article fact-check verdict + confidence | `chitti-news-factcheck` sub-agent | article_id, verdict, corroborating_source_count | `news.fact_checks` |
| Per-publisher fetch result | `news_ingest._http_get` | source_slug, status, used_cloudscraper, items_count | `feeds_health.log` + Turso `news.ingest_logs` |
| Coverage payload returned to user | `news_db.feed()` | per_category, total_in_language, english_fallback_count | application logs |

**Never collected:**
- User's reading history beyond per-device localStorage
- Cross-product linking
- Per-user political/communal/religious profile inference

## Pattern detection

| Pattern | Detection | Action |
|---|---|---|
| **Cross-publisher hoax** | same claim appears in 1 publisher; ≥3 other trusted publishers refute it | flag as `disputed` verdict on the original article |
| **Language coverage thin** | per-(language, category) `total_in_language < 5` for ≥7 consecutive days | add to TODO.md as "expand language X coverage" |
| **Cloudflare-blocked publisher** | source last_error contains "403 cloudflare" or similar | auto-retry with cloudscraper; if still fails, flag for manual mitmproxy capture |
| **Per-state coverage gap** | per-state `total_in_state < 10` for any state | promote publisher discovery task |
| **Recurring high-engagement story** | ≥100 👍, ≥10:1 👍/👎 | candidate for "must-read" badge across state/language slices |
| **Fact-check verdict drift** | story re-verdicted from `verified` → `disputed` after new sources land | reflect in UI immediately; user sees verdict history |

## Weekly validation (Sunday 09:00 IST cron)

Same pattern as platform: aggregate week's signals → human review → push to data/rules.

## Cross-Chitti swarm

For chitti-news specifically:
- Fact-check verdicts shared with [chitti-vaani](../chitti-vaani/) emergency keyword spotter (so a "verified" alert doesn't get misclassified as a hoax during family-cascade)
- Per-publisher trust score shared with [chitti-news-ai](../chitti-news-ai/) so a low-trust publisher in news is treated as low-trust in news-ai too
- Per-state coverage maps shared with [chitti-government](../chitti-government/) so policy-related stories get the right state context

## Sub-agent swarm

The 8 sub-agents under [skills/](skills/) (chitti-news-tech, chitti-news-business, chitti-news-politics, chitti-news-sports, chitti-news-entertainment, chitti-news-factcheck, chitti-news-summarizer, plus the main chitti-news/) share:
- Vocabulary expansion (terms one sub-agent flags as out-of-its-domain go to the right one's keyword list)
- Trust score updates (a publisher caught with a hoax in politics has its trust score reduced for sports / business / etc.)
- Fact-check verdicts (cross-category cross-reference)

## Hard rules (locked)

- **Neutrality first**: politics sub-agent NEVER incorporates a partisan signal even if the swarm sees one
- **No personal-attribute inference**: never infer caste/religion/party from per-user reading patterns
- **Per-device only**: For You / Read Later / Cancelled never leave the device

---

**World Class Chitti News — Commando Discipline. Zero Excuses.**
