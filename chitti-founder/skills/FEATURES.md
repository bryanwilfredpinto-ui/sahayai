# Chitti Founder — FEATURES

Internal aggregator + BCP Layer-1 self-ping. **Not a user-facing Chitti** — surface only on Sire's dashboard.
Honest inventory: **Built** (verified end-to-end) · **Planned** (queued, no working endpoint yet) · **Future** (needs new substrate). Same contract as [`chitti-vaani/skills/FEATURES.md`](../../chitti-vaani/skills/FEATURES.md).

Last touched: **2026-05-15**.

---

## 1. Built and working
- Self-ping every 4 minutes — hits every Chitti `/health` (BCP Layer 1, SAHAYAI_MASTER §2e).
- Daily 07:00 IST quality + defect-rate email to Sire.
- Weekly Sunday 08:00 IST trend digest — now embeds the Swarm Intelligence weekly pass (3 sections per [commit 81317b8](../../chitti-founder/backend/main.py)).
- Hourly :15 escalator pass — low-thumbs → SMS, repeating defect → GitHub issue, > 0.5 g CO₂ → carbon issue.
- On-demand `/admin/founder/swarm` endpoint (auth via `Authorization: Bearer $ADMIN_SECRET`).
- LLM fallback shim — DeepSeek → Claude → Gemini honest cascade (BCP Layer 5, never silent).

---

## 2. Planned — queued 2026-05-13
_See [TODO.md](../TODO.md) once it lands; for now this section is co-located with the 2026-05-15 directive below._
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
| Q1 | Daily 07:00 IST report shows **GREEN / RED / degraded** per Chitti — already partially via the daily slice; surface a one-line status column at the top of the email. | Add `health_status: 'green'|'amber'|'red'` to each row in `WeeklyTrendRow` + the daily slice; derived from last-7-day `thumbs_up_pct` + BCP Layer-1 `/health` non-200 count. |
| Q2 | Alert debounce — **1 hour per Chitti** — never spam Sire's inbox. Already implemented (BCP Layer-1 `HEALTH_ALERT_COOLDOWN_S`); verified via QUALITY_STATUS.md §5. | Existing — verify in `chitti-founder/backend/main.py::run_self_ping`. |
| Q3 | Swarm Sunday pass shows **new patterns found + promoted to skills** — shipped in commit `81317b8` (the three new sections in the weekly digest). | Already live — see [`lib/chitti_quality.render_swarm_section_html`](../../lib/chitti_quality.py). |


### Scope

| # | Item | Priority | Surface needed |
|---|---|---|---|
| S1 | Weekly revenue forecast — **COMING SOON** until monetisation begins. | P3 | Honest stub; reads from a `revenue_v1.db` table that is empty today. |
| S2 | User-growth dashboard — DAU / WAU / MAU per Chitti. | P1 | Aggregated from the `quality_audit` per-request rows; renders on a new `/admin/founder/growth` endpoint. |
| S3 | Feedback sentiment summary — top 3 complaints + compliments per Chitti per week. | P1 | DeepSeek-clusters the `quality_feedback` table's free-text by sentiment; honest *"insufficient data"* below ≥ 20 entries / week. |
| S4 | Database-size tracker per Turso DB — alert when approaching free-tier limit (9 GB). | **P0** | Daily cron polls `turso db inspect <db>` size; emails Sire at 6 GB / 7.5 GB / 8.5 GB thresholds. |

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
