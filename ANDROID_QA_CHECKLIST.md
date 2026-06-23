# ANDROID QA CHECKLIST — Chitti Vaani app

**Status:** 🟡 QUEUED for next session (added 2026-06-23 by Sire).
**Rule (CTO Oath):** Android **public launch only after a full QA pass — not before.**
The APK exists and is installed on Sire's phone, but **must NOT be published for download**
until every item below passes. Until then, `chitti_vaani.html` + `index.html` show an
**honest "📱 Android App — Testing in progress · notify me → sire@sahayai.in"** badge
(no fake download link). Live now.

## The 10-point gate (all must pass before any public download link)

1. **Fresh install on 3 Android devices** — budget (~₹8,000), mid (~₹15,000), flagship.
2. **All 25+ actions** — Call, WhatsApp, UPI, SafeWalk, Vault, SOS, lock, silent, flashlight, camera, maps, alarm, reminders, etc. Each fires through the Golden-Rule confirm gate.
3. **All 4 user contracts** — Blind (TalkBack on), Deaf (no audio), Mute (no voice input), Illiterate (icons only).
4. **All 9 languages** — voice input + voice output each.
5. **Connectivity** — 2G / 3G / offline behaviour (honest degradation, no silent failure).
6. **Battery drain** — measured over 30 minutes of active use.
7. **Grandmother test** — 65-year-old non-tech user, zero guidance, **60 seconds to first successful interaction**.
8. **Lighthouse mobile ≥ 90** (WebView surfaces).
9. **Zero crashes over 100 interactions.**
10. **DPDP consent flow** — every toggle works; "Chitti sab bhool ja / Chitti forget" tested end-to-end.

## Notes for the QA session
- The web homepage v2 (language gate → Disability Profile → consent → magic moment → 6-card home) is the same UX the WebView wraps — verify the native bridge (`ChittiNative`) confirm-gate path on each side-effecting action.
- Real-device + human-AT items are Sire's slot; everything automatable (Lighthouse, crash loop, language render, consent toggles) the CTO runs first.
- Do **not** flip the homepage Android badge to a download link until this file is all-green and Sire signs off.
