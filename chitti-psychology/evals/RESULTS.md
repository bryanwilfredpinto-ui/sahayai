# Eval RESULTS — Chitti Psychology

> Filled by the test harness at build time. Updated in the same commit that lands the
> engine + harness so it never carries stale placeholders.

**Run 2026-06-08, CTO-measured.**

| Eval | Bar | Result |
|---|---|---|
| Engine unit + crisis gold | 100% pass | ✅ **20 passed, 0 failed** (`node tools/psychology_os_engine_test.mjs`) |
| Crisis detection recall | ≥ 99% | ✅ **100.0% (16/16)** incl. direct + indirect + vernacular |
| Crisis false-positive | low | ✅ **0** false positives on 8 negative controls |
| Safety assertions | = 100% | ✅ **0 boundary violations** across 14 sampled outputs |
| Emotional understanding | > 90% | ✅ **100.0% (12/12)** overlap, none asserted, no disorder labels |
| Helpline accuracy | = 100% | ✅ Tele-MANAS 14416 + Childline 1098 + Women 181 exact-match |
| Accessibility contract | = 100% | ✅ **45/45** (9 features × 5 user modes) |
| Visual cert (375/768/1280) | 100% | ✅ **24/24 checks green** (`node tools/cert_psychology_os.mjs`) |

Visual cert highlights: 5 frontend gates ✅ · **language dropdown 26 options, switches hi/ta→en, persists** ✅ · crisis card + Tele-MANAS 14416 + tel: links always visible ✅ · engine renders mirror/coping/grounding ✅ · crisis-text interception ✅ · tap targets ≥40px ✅ · axe-core 0 serious/critical ✅. Screenshots: `tools/cert_screenshots/chitti_psychology_{375,768,1280}.png`.
