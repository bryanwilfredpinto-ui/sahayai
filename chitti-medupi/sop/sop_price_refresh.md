CEOS Level 7 — SOP: Price Refresh Cadence
Authored 2026-06-06

# SOP — Refreshing prices (Jan Aushadhi · NPPA · brand→molecule)

**Trigger:** the scheduled refresh jobs, or a manual refresh when a price source
publishes an update.

**Backing:** `services/medupi_scheduler.py` (APScheduler) ·
`services/medupi_jan_aushadhi.py` · `services/medupi_pricing.py` ·
`services/medupi_price_freshness.py` · `backend/scripts/` loaders.

---

## The stale-data rule (CHITTI_SOP §2 / SOP.md)
| Source | Cadence | Trust treatment |
|---|---|---|
| **Jan Aushadhi price catalog** | **weekly** refresh | always trusted — badged 🏥 "Official Jan Aushadhi price" (monthly govt update upstream) |
| **NPPA NLEM ceiling list** | **monthly** | badged 🛡️ "Maximum legal price — no pharmacy can charge more" |
| **Brand→molecule mapping** | **monthly** diff against drug-regulator updates | dated MRP badge 💊 |
| **Medicine composition** | **never** — immutable, matched on master DB | n/a |

## Daily scheduler order (IST)
| Time | Job |
|---|---|
| 02:00 | Brave Search snippet refresh (live pharmacy price discovery — snippets only) |
| 03:00 | Jan Aushadhi catalog (monthly cadence; daily idempotent check) |
| 04:00 | NPPA ceiling (weekly/monthly cadence; daily idempotent check) |
| 08:00 | Expiry-reminder bucketing (EXPIRED / EXPIRING_SOON / EXPIRING / OK) |
| 09:00 | `daily_price_alert_scan` — runs *after* the above so data is freshest |

## Freshness badge thresholds (`medupi_price_freshness`)
| Age of an MRP | Badge |
|---|---|
| ≤ 7 days | 💊 "Last updated N day(s) ago" (green) |
| ≤ 30 days | 💊 dated (navy) |
| 31–90 days | ⚠️ "price may have changed" (amber) |
| > 90 days | ❗ "verify current price with pharmacy" (red) |

## Steps
1. Run the source loader; stamp each updated row's `updated_at` + `price_source`.
2. Re-annotate freshness so the badges reflect the new ages.
3. Re-run `annotate_savings` so `savings_pct` + `above_nppa_ceiling` recompute.
4. Smoke-test a known molecule (e.g. `Metformin`) end-to-end.

## Hard rules — non-negotiable
- **Never silently return stale prices.** If a refresh fails, the existing rows keep
  ageing into the ⚠️/❗ badges — Chitti tells the user the price may be old rather
  than pretending it's current.
- **Brave Search is snippets only** — never visit 1mg / PharmEasy / NetMeds /
  Apollo URLs programmatically (README non-negotiable #5).
- **Jan Aushadhi store geo failure → by-state fallback** (`find_in_state`), never
  "no Jan Aushadhi available".

## Escalation to CTO (SOP.md)
- Jan Aushadhi catalog refresh fails > 7 days.
- An NPPA ceiling violation is detected in any response.

---
> **World Class Chitti MedUPI — Commando Discipline. Zero Excuses.**
