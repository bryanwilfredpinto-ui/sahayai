🎖️ World Class Chitti Technical — Commando Discipline. Zero Excuses.

# QUALITY — Chitti Technical

The gates a change must clear before it ships. Nothing is "done" until its gate is GREEN with evidence.

## Harness gates (run every change)
- `node tools/test_technical.mjs` — engine logic (current: **354/0**, 0 stop/RR violations).
- `node tools/cert_technical.mjs` — Playwright + axe (current: **31/0**, axe 0 serious, 14/14 boxes).
- `node tools/certify_prd.mjs` — per-PRD-feature evidence (current: **27/27**).
- `node tools/certify_technical.mjs` — 5 device screenshots + 101-button audit + axe per device.
- `node tools/gates_shots.mjs` — full-page on 5 device classes, **axe 0 WCAG 2.2 AA on all 5**.

## The 10-gate Certification Board
See [`certification/GATES_10_CERTIFICATION.md`](certification/GATES_10_CERTIFICATION.md) — currently **95/100**.
Production-readiness composite **<90 = NOT READY**.

## Non-negotiable gates (every BO)
- Four-user contract (blind/deaf/mute/illiterate) + the 5-element box (🔊/🤖/👍/👎/✏️).
- No-stop → no-signal. 0 banned phrases. NOT-SEBI bar always visible.
- 9-language whole-UI switch, 0 raw-key leaks, 0 Hinglish.
- axe-core 0 serious/critical WCAG 2.2 AA on Desktop/Laptop/iPad/Android/iPhone.
- Decision-first primary (CEOS §3); advanced surface = P9, one tap, never breaks the primary.

**Real-device sign-off** (iPhone + Android, VoiceOver/TalkBack, real mic, 3G) is reserved for Sire.
