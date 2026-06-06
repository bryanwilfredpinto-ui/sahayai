🎖️ World Class Chitti Mechanic (Bike + Car Doctor) — Commando Discipline. Zero Excuses.

# 04 — BUG REPORT — Chitti Mechanic
**Universal Handover Part 4/6 · 2026-06-06.** Full detail: [CHITTI_MECHANIC_BUG_REPORT.md](../../CHITTI_MECHANIC_BUG_REPORT.md).
**Totals: Critical 0 · High 0 · Medium 1 OPEN + several FIXED · Low 0.**

## OPEN
| ID | Bug | Severity | Repro | Status |
|---|---|---|---|---|
| BUG-1 | Slow 3G first-visit load ~37s | Medium | CDP 400kbps → load → DOMContentLoaded | OPEN — documented, SW-cache mitigated, bundle-split tracked |

## FIXED this handover cycle (each found by a test/axe, each verified fixed)
| ID | Bug | Found by | Fix | Verify |
|---|---|---|---|---|
| BUG-2 | img missing `alt` | a11y audit | added alt | all img alt ✅ |
| BUG-3 | Car form title showed "My Bike" | visual cert | `mc.form.title` in 9 langs | hi="मेरी गाड़ी" ✅ |
| BUG-4 | Scan-RC buried in a tab (not on landing) | test_landing | moved to Home empty state | landing 12/12 ✅ |
| BUG-5 | Dropdown showed English while content Hindi | visual cert | persist chosen lang on init | lang-consistency ✅ |
| BUG-6 | Diagnosis trapped in vehicle-summary (roadside users blocked) | test_diagnose | HERO moved to landing | diagnose 10/10 ✅ |
| BUG-7 | SOS/Self-Fix/Scanners trapped in summary | test_roadside | moved to landing | roadside 10/10 ✅ |
| BUG-8 | Only 9 of 26 languages in dropdown | Sire / Vaani check | restored all 26 (cousins→Hindi) | dropdown 56/56 ✅ |
| BUG-9 | **axe-core critical: `aria-required-children`** (`.sds-tabs role=tablist` with button children) | axe-core | removed mis-applied tablist role (it's app nav) | axe 0 ✅ |
| BUG-10 | **axe-core serious: `color-contrast`** (active nav label 3.22, modal foot 2.56) | axe-core | darkened to #9a3412 / #475569 | axe 0 ✅ |

## Test-harness bugs found + fixed (product was correct)
- J11 read a prior journey's demo `make` (not an RC fabrication) → assertion clears make first.
- Four-user blind check scoped inside the box; the widget speak bar is a **sibling** → check box+sibling.
- RC button check counted the hidden landing Scan-RC button (height 0 on another tab) → filter to visible.

## Screenshots (committed)
[test_screenshots/mechanic/](../../test_screenshots/mechanic/) (5 per-category samples) ·
[cert_screenshots/](../../tools/cert_screenshots/) (LANDING_bike, HOME_bike_hero, RC_bike/car,
LANG_bhojpuri, CARFIX_form_title, handover_bike/car/safari).

---
> **World Class Chitti Mechanic — Commando Discipline. Zero Excuses.**
