🎖️ World Class Chitti Mechanic (Bike + Car Doctor) — Commando Discipline. Zero Excuses.

# 01 — QA TEST REPORT — Chitti Mechanic
**Universal Handover Part 4 · all numbers MEASURED 2026-06-06 by the harnesses named below.**

Harnesses (all in [tools/](../../tools/)): `qa_handover.mjs` (22 journeys × Chromium/Firefox/
WebKit-Safari + edge + perf + a11y), `cert_mechanic.mjs`, `test_landing_journey.mjs`,
`test_diagnose_journey.mjs`, `test_roadside_journey.mjs`, `test_four_users.mjs`,
`test_lang_dropdown.mjs`, `scan_hinglish.mjs`, `test_rc_scan.mjs`, `axe_mechanic.mjs`,
`test_all_samples_mechanic.mjs`, backend `pytest`.

## 4.1 Functional Journeys — **20/20 PASS**
| # | Journey | Status | Evidence |
|---|---|---|---|
| 1 | Page loads, 0 console errors | ✅ | qa_handover J1 (3 engines) |
| 2 | Primary action — diagnose on landing (no vehicle) | ✅ | test_diagnose J3 |
| 3 | Secondary — Scan-your-RC on landing | ✅ | test_landing / test_rc_scan |
| 4 | Result/verdict displays | ✅ | test_diagnose verdict |
| 5 | Language switch (all 26) | ✅ | test_lang_dropdown 56/56 |
| 6 | Voice output control present on every box | ✅ | test_four_users (blind) |
| 7 | Feedback 👍/👎 works | ✅ | qa J + feedback-widget |
| 8 | Explanation 🤖 (per-box Chitti) | ✅ | per-response widget |
| 9 | Memory/save (Vehicle Twin → localStorage) | ✅ | qa J2 persist |
| 10 | Recall (saved vehicle reloads) | ✅ | qa J2 |
| 11 | Delete/forget | ✅ | localStorage clear path |
| 12 | Blind profile — voice-first | ✅ | test_four_users |
| 13 | Deaf profile — visual + ISL | ✅ | test_four_users |
| 14 | Mute profile — tap/photo only | ✅ | test_four_users |
| 15 | Illiterate profile — icons + voice | ✅ | test_four_users |
| 16 | Roadside Self-Fix (offline) | ✅ | test_roadside (offline) |
| 17 | State persists after reload | ✅ | qa J2 |
| 18 | Error handling graceful (10MB/corrupt img) | ✅ | qa edge |
| 19 | SOS / Find-mechanic routing | ✅ | test_roadside |
| 20 | "Coming soon" shown honestly (AI auto-read) | ✅ | test_rc_scan (no fabrication) |

**Journeys Verdict: 20/20 PASS.** (qa_handover counts 22 incl. 11 bike + 11 car.)

## 4.2 Edge Cases — **8/9 PASS** (1 documented)
| # | Edge case | Status |
|---|---|---|
| 1 | No internet → offline Self-Fix works | ✅ |
| 2 | Slow 3G load within 10s | ❌ **~37s (BUG-1, documented + SW-cache mitigated)** |
| 3 | localStorage disabled → no crash | ✅ |
| 4 | Rapid language switch ×10 in 5s | ✅ |
| 5 | Backend down → honest fallback | ✅ |
| 6 | No API key → "coming soon" | ✅ |
| 7 | Corrupted image upload | ✅ |
| 8 | Invalid symptom input | ✅ |
| 9 | Concurrent requests (last write wins) | ✅ |

**Edge Verdict: 8/9 PASS** (the 1 fail is BUG-1, slow-3G first load).

## 4.3 Cross-Platform — engines **8/8 emulated PASS**; real devices PENDING (Sire)
| # | Platform | Emulated | Real device |
|---|---|---|---|
| 1 | Chrome desktop (Chromium) | ✅ | N/A |
| 2 | Firefox desktop (Gecko) | ✅ | N/A |
| 3 | Safari desktop (WebKit) | ✅ | N/A |
| 4 | Chrome on Android | ✅ (WebKit/Chromium engine) | ⏳ Sire |
| 5 | Safari on iOS | ✅ (WebKit engine) | ⏳ Sire |
| 6 | 375px mobile | ✅ no overflow | ⏳ Sire |
| 7 | 768px tablet | ✅ | ⏳ Sire |
| 8 | 1440px desktop | ✅ | N/A |

**Cross-Platform Verdict: 8/8 engines PASS.** Real iPhone/Android = the ONLY items left for Sire.

## 4.4 Accessibility — **13/13 PASS**
| # | Test | Status |
|---|---|---|
| 1–3 | Blind: flow by voice · spoken nav · errors spoken | ✅ test_four_users (blind) |
| 4–6 | Deaf: caption+symbol · ISL panel · never audio-only | ✅ test_four_users (deaf) |
| 7–8 | Mute: tap/camera-only flow · Yes/No confirm buttons | ✅ test_four_users (mute) |
| 9–10 | Illiterate: picture menu · every label spoken | ✅ test_four_users (illiterate) |
| 11 | Tap targets ≥44px | ✅ qa a11y (0 small) |
| 12 | Colour not the only indicator | ✅ (icon + word everywhere) |
| 13 | **axe-core WCAG 2.1 AA = 0 violations** | ✅ **bike 0 · car 0** (`axe_mechanic.mjs`) |

**Accessibility Verdict: 13/13 PASS.** (axe found 2 real issues — `aria-required-children`
+ `color-contrast` — both FIXED this pass; re-run = 0/0. Human AT-user sessions = PENDING, Sire.)

## 4.5 Language Testing — **26/26 render PASS**
`test_lang_dropdown.mjs` = **56/56** (1 options + 26 switch + 1 stale-guard, × 2 pages).
`scan_hinglish.mjs` = **0 violations**.

| Languages | UI renders | No raw keys | No flicker | Voice |
|---|---|---|---|---|
| 9 translated (en/hi/ta/te/bn/mr/gu/kn/ml) | ✅ native | ✅ | ✅ | Web Speech (audio not verifiable headless — PENDING) |
| 17 cousins (pa/or/as/ur/sa/mai/kok/doi/ks/ne/sd/mni/sat/bho/raj/kru/hoc) | ✅ Hindi fallback (matches Chitti Vaani) | ✅ | ✅ | Web Speech |

**Language Verdict: 26/26 render PASS.** Voice OUTPUT uses the browser Web Speech API; the
fact that the speak control fires is tested, but *hearing* the audio is the one thing only a
real device proves → flagged for Sire.

## 4.6 Regression — **PASS**
cert **24/24** unchanged · backend `pytest` **24 + 22 passed** · landing/diagnose/roadside/
four-users/RC/dropdown all green · no prior feature broke · other Chittis untouched (only the
shared `chitti_disability_profile.js` contrast fix, which improves all of them).

## 4.7 Performance — **4/5 PASS** (1 = BUG-1)
| Metric | Target | Measured | Status |
|---|---|---|---|
| Page load (networkidle, mobile/tablet/desktop) | <3s | **~1.2 / 0.9 / 0.8 s** | ✅ |
| Page load (3G first visit) | <10s | **~37 s (BUG-1)** | ❌ |
| Language switch | <1s | **~0.16 s** | ✅ |
| Primary action (diagnose) response | <5s | **<1 s** | ✅ |
| JS heap (idle) | <100MB | **~10 MB** | ✅ |

## 4.8 QA Summary
| Section | Pass | Fail | Rate |
|---|---|---|---|
| Functional Journeys (20) | 20 | 0 | 100% |
| Edge Cases (9) | 8 | 1 | 89% |
| Cross-Platform engines (8) | 8 | 0 | 100% |
| Accessibility (13) | 13 | 0 | 100% |
| Language (26) | 26 | 0 | 100% |
| Regression | ✅ | — | 100% |
| Performance (5) | 4 | 1 | 80% |
| **TOTAL** | **79** | **2** | **97.5%** |

**QA Verdict: ✅ PASS (97.5% ≥ 95%).** The 2 fails are both **BUG-1 (slow-3G first load)** —
Medium, documented, SW-cache-mitigated. Critical = 0, High = 0.

---
> **World Class Chitti Mechanic — Commando Discipline. Zero Excuses.**
