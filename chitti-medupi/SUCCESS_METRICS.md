🎖️ World Class Chitti MedUPI — Commando Discipline. Zero Excuses.

# CEOS Level 3 — SUCCESS_METRICS (Chitti MedUPI)

Authored 2026-06-06

> The numbers Sire tracks. Aligned to [CHITTI_SOP.md §2](../CHITTI_SOP.md)
> "Success metric": (a) ₹ saved per cart vs branded · (b) same-composition match
> rate · (c) expiry-reminder follow-through. The North Star is chosen to be
> **un-gameable by engagement** — we never measure time-in-app or sessions
> (Founder Rule, [CONSTITUTION.md](CONSTITUTION.md) Article 0).
>
> **TARGET** vs **MEASURED** is labelled on every row. A target is a bar we hold
> ourselves to; a measured value cites a real QA artifact. We never present a
> target as if it were achieved.

---

## North Star

> **Rupees saved per same-composition cart vs the branded equivalent, per active
> family, per month.**

Every time MedUPI swaps a branded cart for a strict same-composition cart and the
family logs the realised saving, the product worked. It rewards trust, the
strict-match safety contract, and the Jan Aushadhi mission simultaneously. It
cannot be inflated by ads, carts, or screen time.

---

## Business metrics

| Metric | Type | Target | How it's measured |
|---|---|---|---|
| ₹ saved per cart vs branded | TARGET | ≥ ₹150 median monthly cart saving | `wallet.savings_realized` summed per profile per month; cart simulator delta |
| Annual savings per chronic family | TARGET | ≥ ₹2,000 / year | family-wallet `last_12_months_saved` + `annual_projection` |
| Jan Aushadhi savings surfaced | MEASURED (sample) | 50–90% off branded MRP, present on every match | README pillar + sample battery `max_savings_pct` (e.g. 71.4% on Amlong 5) — see `tools/test_medupi_samples_result.json` |
| Expiry-reminder follow-through | TARGET | ≥ 60% of EXPIRING_SOON (≤7d) reminders acknowledged | `reminder.status` transition active → done within the lead window |
| Wallet adoption | TARGET | ≥ 40% of repeat users log ≥1 wallet entry | distinct `user_token` with ≥1 `wallet` row |
| Pharmacy-marketplace cut | HARD | **₹0** (we never sell or take placement) | architectural — no checkout path exists |

---

## AI / correctness metrics

| Metric | Type | Target | How it's measured |
|---|---|---|---|
| Cross-molecule leakage | MEASURED — **HARD 100% clean** | **0 leaks, always** | `tools/test_medupi_samples_result.json` → 25/25 samples, `zero_cross_molecule_leakage` = `leaks=0` on every row |
| Same-composition match rate | MEASURED (sample) | ≥ 2 strict alternatives where they exist | sample battery `min_alternatives>=2` pass on 25/25 |
| NPPA ceiling respected | MEASURED (sample) | **0 results above ceiling** | sample battery `nppa_ceiling_respected` → `over_ceiling=0` on 25/25 |
| Composition-match precision | TARGET | ≥ 99% (molecule + strength + form exact) | offline judge-eval against master DB; `ix_medicines_strict_match` is the only match path |
| Risk-classification accuracy | TARGET | ≥ 95% on the curated top-200 molecule map | `medupi_risk.py` RISK_MAP vs a labelled molecule set; unknowns default LOW **and are logged** |
| Strip-scan confidence honesty | TARGET | 100% of <70%-confidence scans show the verify-with-pharmacist hint | `medupi_recognition.py` emits `confidence`; `Chitti.a11y.renderConfidence` gates the chip |
| Vision honest-degrade | MEASURED (behaviour) | 100% honest fallback when DeepSeek key unset / 402 | text-only mode, never a fabricated extraction (CONSTITUTION Article 8) |
| Hallucination / phantom medicine | TARGET | < 1% | results outside the master DB dropped + logged, never invented |

> **Note on "current" values.** Composition-match precision, risk accuracy, and
> follow-through rates are **targets** — no production-scale measured figure is
> claimed here. The only hard *measured* AI results today are the offline sample
> battery (25/25, zero cross-molecule leakage, NPPA respected) and the
> multilingual battery below.

---

## Accessibility metrics

| Metric | Type | Target | How it's measured |
|---|---|---|---|
| Language coverage | MEASURED | **26/26 languages pass** at 99–100% string coverage | `tools/medupi_lang26_result.json` → 26 pass / 0 fail (en 100%, hi/bn 99%, no raw keys, no overflow) |
| axe-core serious/critical | TARGET | **0 serious, 0 critical** | `tools/medupi_a11y.mjs` / `medupi_axe_detail.mjs` → `medupi_a11y_result.json` |
| Four-user task completion | TARGET | 100% — Blind / Deaf / Mute / Illiterate each complete the core compare flow | scripted profile runs (voice-only, caption-only, tap-only, Hindi-pictogram) |
| Per-response widget present | HARD | 100% of response boxes carry `data-chitti-response` (🔊 / 🤖 / 👍 / 👎) | frontend 5-gate audit, merge-blocker |
| ISL panel present | HARD | 100% of responses | `chitti_a11y.js` ISL Phase-1 panel injection |
| Never colour-only | HARD | 0 colour-only signals | manual + axe contrast audit; every signal carries symbol OR text OR voice |
| Mobile pass @375px | TARGET | 100% | `tools/medupi_crossplatform.mjs` → `medupi_crossplatform_result.json` |
| Per-response 👍 rate | TARGET | ≥ 80% | feedback-widget per box → Founder daily 07:00 IST slice |

---

## Counter-metrics (we want these LOW / ZERO)

| Counter-metric | Ceiling |
|---|---|
| Cross-molecule / cross-strength / cross-form substitutions shown | **0 (hard)** |
| Results priced above NPPA ceiling shown without a violation chip | **0 (hard)** |
| Dose / switch / therapeutic recommendations made | **0 (hard — that is prescribing)** |
| Fake / fabricated vision extractions | **0 (hard)** |
| Responses missing the server-enforced disclaimer | **0 (hard)** |
| Single-source price alerts that fired | **0** (needs ≥2 independent reports) |
| Silent failures (no honest "unconfigured" / "unclear" state) | **0** |

---

## Stale-data SLAs (from [CHITTI_SOP.md §2](../CHITTI_SOP.md))

| Data | Refresh cadence | Scheduler job |
|---|---|---|
| Jan Aushadhi price catalog | weekly / monthly-1 | `monthly_jan_aushadhi` (03:00 IST, day 1) |
| NPPA NLEM ceiling list | monthly / weekly diff | `weekly_nppa` (04:00 IST, Mon) |
| Brand → molecule mapping | monthly diff vs regulator | loader scripts |
| Top-100 live pharmacy snippets | daily | `daily_top100_brave` (02:00 IST) + `cache_evict` (02:55 IST) |
| Price-alert scan | daily | `daily_price_alert_scan` (09:00 IST) |
| Medicine composition itself | **immutable** — matched on master DB, never inferred | — |

---

## How to keep this file honest

1. A row moves from **TARGET** to **MEASURED** only after the cited QA artifact
   exists and is checked in (per `feedback_verify_before_handover`).
2. The three HARD AI rows (cross-molecule leakage, NPPA respected, no
   prescribing) are re-run on every release via the sample battery — a non-zero
   value is a release blocker, not a metric regression.
3. No production-scale "current" number is invented. Where we have only a target,
   it says TARGET.
