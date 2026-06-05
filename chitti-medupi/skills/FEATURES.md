# Chitti MedUPI — FEATURES

Honest inventory of what Chitti MedUPI does today plus what is queued. Same
three-section contract as
[`chitti-vaani/skills/FEATURES.md`](../../chitti-vaani/skills/FEATURES.md):
**Built & working** (verified against routes + handlers), **Planned**
(queued, has no working endpoint yet), **Future** (needs partnership /
regulator / new data source).

Last touched: **2026-05-13**.

Verify with: `chitti-medupi/backend/routes/`, `chitti-medupi/backend/services/`,
and `chitti_medupi.html` before claiming "built". See
[`../CHANGELOG.md`](../CHANGELOG.md) for what's actually shipped.

---

## 1. Built and working
_Anchor against routes + frontend handlers. Cross-reference
[`CHITTI_MEDUPI_MASTER_SPEC.md`](../../CHITTI_MEDUPI_MASTER_SPEC.md)._

- Same-composition match (molecule + strength + form, strict — never
  approximate).
- Jan Aushadhi price lookup + NPPA ceiling comparison.
- Family Wallet (per-device, voice-buildable).
- Insurance match + cart simulator.
- Scanner deep-link in from `chitti_scanner.html`.

---

## 2. Planned — queued 2026-05-13

Founder wave (Bryan, 2026-05-13). Each item must arrive with a route in
`backend/routes/`, a UI affordance in `chitti_medupi.html`, and a Voice
Required marker if blind/illiterate users are the primary audience.

| # | Feature | Priority | Why | Surface needed |
|---|---|---|---|---|
| M1 | **Price alert** — "Tell me when Crocin drops below ₹20" | **P1** | Saves money on chronic-use meds; high family value | `POST /api/medupi/alerts` + cron poll on Jan Aushadhi / NPPA price feeds + push-back via Vaani read-aloud |
| M2 | **Expiry reminder for medicines at home** | **P0** | Expired meds are a **safety** issue (elderly + children). Highest priority in this wave. | Cabinet item gets `expires_on` field; daily 08:00 IST cron → Vaani read-aloud "Crocin expires next week" |
| M3 | **Family medicine cabinet tracker** | **P1** | Stops duplicate-purchase + missed-refill; ties to Family Wallet | `cabinet` table per family_id; barcode scan adds; voice add via Vaani |

**How to apply** when implementing:
- Expiry + alerts must read out on the user's chosen language via
  `chitti_a11y.js` — no silent badges.
- Pictures of the strip (FSSAI/MRP block) accompany every cabinet row
  for illiterate users. Symbols + word label, never colour alone
  (`project_four_user_contract`).
- Alerts respect Vaani's emergency-cascade quiet rules — never wake the
  master at night for a price drop.

---

## 2b. Cross-product hooks — Chitti Health Scanner (sibling capability)

**Chitti Health Scanner** is a new visual-health capability in the MedUPI
family. It **shares this backend** — it extends `chitti-medupi-api` with
`/api/health-scanner/*` (no new service) — and every confirmed scan **feeds
the Chitti Health File timeline**, the same timeline MedUPI's wallet /
reminder events flow into. Frontend is `chitti_health_scanner.html`; the
COSDF v1.0 doc set lives under
[`../../chitti-health-scanner/`](../../chitti-health-scanner/README.md).

- **AI analysis is COMING SOON** — all `/api/health-scanner/*` analysis
  endpoints return an honest `501 coming_soon`. The vision models are NOT
  built / NOT clinically validated; every accuracy figure (skin 95%, dental
  89–97%, etc.) is a research **target**, never an achieved result.
- **Never diagnoses** — it DETECTS / NOTICES and ESCALATES to a professional.
  *"Chitti helps you notice — doctors help you heal."*
- **Cross-links back to MedUPI** — a scan that suggests a consult can hand off
  to MedUPI's Jan Aushadhi / generic-cost lookup, and to Chitti Government's
  PMJAY check.

---

## 3. Future — needs partnership / regulator

- Direct Jan Aushadhi store inventory (live stock, not just price)
  — needs PMBI partnership.
- Pharmacist-confirmed substitution audit trail — needs Chitti Pharmacy
  shop-Chitti product (doesn't exist yet,
  `project_render_deploy_status_2026_05_10`).
- ABDM-linked medication history — needs ABDM HFR/HPR enrolment.

---

## How to keep this file honest

1. Move Planned → Built **only after** curl-ing the live endpoint per
   `feedback_verify_before_handover`.
2. New features must follow the LOCKED new-products process: research
   top 3 reference apps (1mg, PharmEasy, Netmeds) → ship full skeleton
   with `COMING SOON` → DeepSeek + community voices → declare capability
   here.
3. Never silently substitute a different composition. Strict match is a
   safety contract (`project_chitti_medupi_spec`).
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
| Q1 | Every medicine result shows **Brand price · Generic price · Jan Aushadhi price** — all three, always. Empty value shows `—` honestly, never silently dropped. | Extend `medupi_pricing.py` to compute all three for every match; render in a 3-column grid on `chitti_medupi.html`. |
| Q2 | Savings amount in big bold numbers — *"You save ₹340 by switching to generic"* — spoken aloud for blind users + WhatsApp-shareable. | Compute `savings = max_price - jan_aushadhi_price`; render as a hero chip; auto-speak in user's language on first display. |
| Q3 | NPPA ceiling violation — red warning if the pharmacy charges above the NPPA ceiling. | Add `nppa_ceiling_violation` boolean to every pricing payload; frontend renders a red `⚠️ Above NPPA ceiling` chip; copy-to-clipboard a complaint draft pre-addressed to NPPA grievance portal. |
| Q4 | Expiry reminder **at add-to-wallet time** — not just on expiry day. User chooses lead-time (default 7 days). | Family Wallet already stores `expiry_date`; add a cron in `medupi_wallet.py` that emits an in-app + Notification API reminder lead_time before expiry. |
| Q5 | Strip scan confidence level — render via [`Chitti.a11y.renderConfidence`](../../chitti_a11y.js). If `< 80%`, say *"I am not fully sure, please verify with pharmacist"*. Already wired in `medupi_recognition.py` — exposes `confidence` in the vision response. | Frontend reads `confidence`, calls `renderConfidence(el, confidence, { verifyWith: 'your pharmacist' })`. Below 70% the chip carries the verify hint automatically. |


### Scope

| # | Item | Priority | Surface needed |
|---|---|---|---|
| S1 | Medicine interaction checker — *"Is it safe to take Medicine A with Medicine B?"* | **P0** (safety) | DeepSeek with strict-mode prompt + a curated `drug_interactions.json` seed (built from openFDA / NIH MedlinePlus). HIGH-risk Swarm gate — never auto-promote new patterns. |
| S2 | Nearest Jan Aushadhi store locator (5 km / 25 km auto-expand) | P1 | Uses `Chitti.location.get()` + the Jan Aushadhi store directory (CSV publicly available). 5 km metro / 25 km tier-2/3 — same radius rule as the Vaani local-business lookup. |
| S3 | Prescription photo → full medicine list extracted automatically | P1 | DeepSeek vision (same path as `analyze_image`); strict JSON output `{ medicines: [{ name, strength, form, frequency }] }`; honest `unclear` per row when confidence < 70%. |
| S4 | "Out of stock" alert — notify when a Jan Aushadhi store gets stock of a searched medicine | P2 | Per-device watchlist (local-only); periodic poll of the Jan Aushadhi stock API (when partner access lands — **COMING SOON** for inventory feed). |
| S5 | PMJAY / Ayushman Bharat coverage check | P1 | DeepSeek + curated `pmjay_covered_medicines.json` (seed from the PMJAY package list). Cross-link to Chitti Government's PMJAY eligibility checker. |

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
