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
