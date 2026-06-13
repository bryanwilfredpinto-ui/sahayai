# CNAI_BO2_SELFCHECK.md — Course Discovery & Registration

**Tests:** `tools/test_cnai_course_bo2.mjs` **27/27** · regression `tools/test_cnai_courses.mjs` **30/30** · full suite **336/336**.

| # | Question | Answer | Evidence |
|---|---|---|---|
| 1 | Best code I've written? | **YES** (scope) | 7-pattern scam shield + 4-check cert gate, deterministic, evidence-bearing, never throws. |
| 2 | Blind farmer in rural Bihar understands output? | **YES (engine)** | Warnings/checks are plain text; 1930 shown as text (never `tel:`); free/paid is a text label. Full a11y verified at render (BO6/7). |
| 3 | Researched 40 apps first? | **YES** | CNAI_BO2_RESEARCH.md — 20 + 20, committed before code. |
| 4 | Free-first? | **YES** | `free-first:*` tests prove paid never outranks a relevant free result; cert gate surfaces free alt for paid. |
| 5 | Broke existing API? | **NO** | `find/registrationPlan/speakable/tierLadder` unchanged; 30/30 regression + 336/336 suite. Additions only. |
| 6 | axe-core 0 violations? | **DEFERRED → BO6/7** | Engine emits a11y-ready text; axe runs on the page. |
| 7 | Better than Coursera/Udemy/SWAYAM for this feature? | **YES** | Free-first sort + scam shield (none of them warn) + cert gate + consent-only registration (never auto-enrol/sit exams). |

**Bug found & fixed in testing:** plural timeline ("2 hours") missed the scam regex (`\b` before plural 's') → fixed with plural-tolerant pattern, re-verified.

**BO2 status: COMPLETE.** → BO3.
