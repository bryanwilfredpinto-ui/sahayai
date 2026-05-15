# Chitti News — FEATURES

Honest inventory: **Built** (verified against routes + frontend),
**Planned** (queued, no working endpoint yet), **Future** (needs new
data source / partnership). Same contract as
[`chitti-vaani/skills/FEATURES.md`](../../chitti-vaani/skills/FEATURES.md).

Last touched: **2026-05-13**.

Verify with: `chitti-news/backend/routes/`, `chitti-news/backend/services/`,
`chitti_news.html`, and [`CHITTI_NEWS_MASTER_SPEC.md`](../../CHITTI_NEWS_MASTER_SPEC.md)
before claiming "built".

---

## 1. Built and working
- 26+ RSS feeds across 5 active languages (regional langs stubbed).
- State × language × category routing.
- **Chitti's Take** — 3-bullet DeepSeek summary per article.
- **Fact-checker** — cross-references ≥2 trusted RSS sources; emits a
  verdict (`verified` / `partial` / `disputed` / `unverified`) +
  rationale.
- Read Later / Cancelled folders per device.
- Sub-agent routing: politics → business → tech → entertainment →
  sports → factcheck (post-hoc) → summarizer (post-hoc).

---

## 2. Planned — queued 2026-05-13

| # | Feature | Priority | Why | Surface needed |
|---|---|---|---|---|
| N1 | **Morning briefing** — 5 headlines read aloud at 07:00 IST | **P1** | Habit-forming, voice-first; ideal for blind / elderly / illiterate (`project_four_user_contract`) | Cron 07:00 IST → user's chosen lang via Voice Factory → Vaani read-aloud handoff. Per-device opt-in. |
| N2 | **"Explain this news in simple Hindi"** button on every article | **P0** | Core illiterate / elderly contract. Mirrors the P0 "Explain simply" task in [`SAHAYAI_MASTER.md`](../../SAHAYAI_MASTER.md#p0--fix-the-homepage-this-sessions-audit-findings). | DeepSeek re-prompt with class-5 plain-Hindi system prompt + read-aloud. Button next to Chitti's Take on every article card. |
| N3 | **Fake-news score visible on every article** | **P0** | Currently the factcheck verdict only shows when the user opens an article. Trust contract says every card should carry the score. | Compute verdict at ingest time, persist on `articles` table, render as badge + word label (`verified` / `partial` / `disputed` / `unverified`) — never colour alone (`project_four_user_contract`). |

**How to apply:**
- "Explain simply" must use the same shared helper proposed in
  [`SAHAYAI_MASTER.md` §8 P0](../../SAHAYAI_MASTER.md#p0--fix-the-homepage-this-sessions-audit-findings)
  — don't fork a news-only version.
- Briefing alarm rings even on silent **only** if the user opted in;
  default is push + readable-on-open, never bypass-silent (that bypass
  is reserved for Vaani's emergency cascade,
  `project_chitti_vaani_emergency_protocol`).
- Fake-news badge follows the four-user contract: **symbol + word
  label**, never colour-only.

---

## 3. Future — needs partnership / regulator
- ANI / PTI / regional wire-service licensing — would replace fragile
  RSS scrapes.
- Audio-first content (AIR / community radio) — partnership-gated.
- On-device Vosk summariser for fully-offline briefings — depends on
  the Vaani Android phase-2 work.

---

## How to keep this file honest

1. Move Planned → Built **only after** curl-ing the production endpoint
   per `feedback_verify_before_handover`.
2. Politics sub-agent is opinion-free by hard guardrail
   (`chitti-news/skills/chitti-news-politics/SKILL.md`). The morning
   briefing and the "Explain simply" button must inherit the same
   neutrality contract — no opinions, no labels, equal coverage.
3. Fact-checker is the trust signal of the whole product. If a verdict
   regresses on a sample of 50 articles, that's a P0 quality
   incident — file under Chitti Quality v2 escalator.
---

## 2a. Quality & Scope improvements — queued 2026-05-15

Per the *Quality & Scope Improvement directive* dated 2026-05-15. Items
land here first as a capability surface that the [Feature Discovery
Box](../../chitti_features.js) reads live; COMING SOON badges show until
the backend/UI work is wired per the [new-products process
(§2a)](../../SAHAYAI_MASTER.md). Locked decisions in §2 are never
relitigated by this section — the swarm + Sire may *propose* new
capabilities; locks (LLM provider, voice substrate, emergency protocol,
four-user contract, ISL, per-response widget, camera intelligence,
knowledge-corpus expert grades, Vaani sole interface) never move.

### Quality

| # | Item | How to apply |
|---|---|---|
| Q1 | Fact-check verdict shows **source count** — *"Verified by 3 sources"* vs *"Only 1 source — treat with caution"*. | Extend `news_factcheck.py` output: `corroborating_sources: int`. Frontend renders an inline count chip next to the verdict. |
| Q2 | Politics agent — visible **equal-coverage meter** — *"Sources: 2 Left · 2 Centre · 2 Right"*. | Tag each RSS source in `RSS_SOURCES.md` with a `lean: left|centre|right` field (founder-curated). Factchecker exposes the counts; frontend renders a 3-bar meter. |
| Q3 | *Chitti's Take* **never exceeds 3 bullets**. Truncate at 3, never append a 4th, never silently merge. | Output-schema rail in `news_summary.py` truncates strictly; honest if the article needed more depth (say *"More on the full article — tap to read"*). |
| Q4 | Articles older than **24 hours** show age prominently — *"Published 2 days ago"* chip at top, not buried in metadata. | Frontend computes `Date.now() - pubDate` per render; renders an age chip with `aria-live='polite'` so screen readers pick it up. |
| Q5 | **Sensitive news** (death / disaster / communal) — *"This may be distressing"* warning. Auto-on for Disability Profile users with `cognitive: true` or `elderly: true`. | Sub-agent emits `sensitivity: 'distressing'|'normal'`; frontend renders an opt-in reveal ("Tap to read — may be distressing"). Profile-aware default-on for sensitive readers. |


### Scope

| # | Item | Priority | Surface needed |
|---|---|---|---|
| S1 | State filter — show only news from user's state by default. Already partially in [Vaani's geo work](../../chitti-vaani/skills/FEATURES.md) — extend to News. | **P0** | Reuse `Chitti.location.pincode` → state mapping; per-device sticky preference. |
| S2 | Language filter — show news in user's language (not just Hindi / English). | **P0** | Activate the v1.1 regional-language stub feeds for Tamil / Telugu / Bangla / Marathi / Kannada / Malayalam / Gujarati / Punjabi. Per-language source curation needed. |
| S3 | Read Later folder — save articles to read later (already partial — surface across pages). | P1 | Already in `chitti_news.html` as a folder; expose `Chitti.news.readLater.add(article)` so other Chittis can deep-link. |
| S4 | Share article via WhatsApp — one tap. Uses [`Chitti.a11y.share`](../../chitti_a11y.js). | P1 | Add a 📲 button on every article card; tap → `Chitti.a11y.share(title + url)`. |
| S5 | *"More like this"* — show similar articles after reading. | P1 | Tag articles with topic + entity vectors during ingestion (today: stemmed keyword overlap; future: embedding-based). |
| S6 | Weekly news digest — Sunday morning summary of the week's top 5 stories in user's language. | P1 | Cron at Sunday 07:30 IST per language; ranks by per-user category preference + global engagement; emails via the existing Founder SMTP helper. Mirrors the chitti-founder weekly trend cadence. |

### Cross-Chitti improvements (substrate — every page inherits)

The 2026-05-15 directive's cross-cutting items #1–#10 ship as
substrate features in [`chitti_a11y.js`](../../chitti_a11y.js) so every
Chitti page inherits them without per-page edits:

| # | Cross-Chitti item | Where it lives | Status |
|---|---|---|---|
| 1 | Offline mode for basic queries | `chitti_offline.js` (service-worker cache + connectivity badge) | wired since 2026-05-14 |
| 2 | WhatsApp share on every response | `Chitti.a11y.share(text, opts)` | shipped 2026-05-15 |
| 3 | Save as PDF / print scoped to a node | `Chitti.a11y.print(el, opts)` | shipped 2026-05-15 |
| 4 | Voice input everywhere | Voice Factory cascade via `Chitti.a11y.speak` / Web Speech API on every page | wired since 2026-05-12 |
| 5 | Low-data / 2G mode | `chitti_offline.js` + `effectiveType <= 2g` heuristic; user-overridable via Disability Profile "rural / low connectivity" | wired since 2026-05-14 |
| 6 | Battery saver auto-dark below 20% | `Chitti.a11y.setBatterySaver()` + `html[data-chitti-batt="save"]` CSS | shipped 2026-05-15 |
| 7 | Font size large / medium / small | `Chitti.a11y.setFontSize('lg'\|'md'\|'sm')` | shipped 2026-05-15 |
| 8 | "Chitti forget" — one-tap local wipe | `Chitti.a11y.forget(scope)` + tombstone preserved for honest counts | shipped 2026-05-15 |
| 9 | Session history (last 5 questions) | `Chitti.a11y.history.{push,list,clear,mount}` per-Chitti scope | shipped 2026-05-15 |
| 10 | Rating after 3 uses | **REJECTED** — see "Rejected items" below | — |

### Confidence-score chip — shared primitive

The 2026-05-15 directive asks several Chittis to show a confidence
score on every answer (MedUPI strip scan, CA tax answer, Scanner FSSAI
flag, etc.). Rather than each backend hand-rolling a different chip,
the rendering primitive lives in `Chitti.a11y.renderConfidence(target,
pct, opts)` — the backend emits a number, the substrate renders the
coloured pill (green ≥ 80%, amber 50–79%, red < 50%). Below 70% the
chip carries a `Please verify` line; if `opts.verifyWith` is set, the
chip's `title` says where to verify (e.g. "FSSAI portal" / "your CA").

### Rejected items — directive-level reroute (2026-05-15)

The following two items conflict with [`feedback_design_from_pwd_user_perspective`](../../SAHAYAI_MASTER.md):

| Item | Why rejected | What we do instead |
|---|---|---|
| *"Did Chitti understand you? YES/NO after every routed response"* | Pre-action / pre-feedback modals **break blind / mute / illiterate users** — the four-user contract floor. We already collect per-response 👍 / 👎 + voice-or-text feedback on every box via the [per-response widget §7](../../feedback-widget.js). Adding a second YES/NO confirmation is redundant + creates a forced choice every turn. | The existing 4-icon row (🔊 · 🤖 · 👍 · 👎) covers the same intent; a 👎 click opens the per-box feedback window scoped to that response. No second prompt. |
| *"Rating after 3 uses — ask user to rate Chitti 1–5"* | Same anti-pattern as above. Generic SaaS rating prompts assume a literate, tap-fluent user. Forcing a 1–5 modal pesters elderly / illiterate / blind users and lowers honest feedback quality (rate-to-dismiss bias). | The per-response widget already produces a far richer signal — every box's 👍 / 👎 rolls into the Founder's daily 07:00 IST quality slice + the Sunday digest. Per-response signals beat point-in-time rating modals on every dimension. |

Both rejections are documented here, not silently dropped, so any
future revisit knows the reasoning. If Sire wants either of these
shipped anyway, the override lives in `Chitti.a11y` and either can be
wired in a future patch.
