# 04 — Bug Report (Chitti CA OS)

Real defects found by automated QA this build and FIXED:
1. speak-btn tap target 40px → 44px (BO10/cert).
2. `.prov` + footer contrast #777 → #5a5a5a (was <4.5:1) (BO10/axe).
3. sample-harness provenance skip-list (incomeTaxOne internal helper) — harness fix.
4. QA slow-3G throttle leaked to shared context → isolated to its own page + reset — harness fix.
Open bugs: 0 critical, 0 high. See [03_KNOWN_ISSUES.md](03_KNOWN_ISSUES.md) for non-bug limitations.
