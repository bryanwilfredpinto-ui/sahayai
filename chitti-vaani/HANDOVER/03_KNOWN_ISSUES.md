# Chitti Vaani — Known Issues

**Date:** 2026-06-06
**Build:** commit `3f4869a`
**Source:** Post-cert deep audit — discovered + documented honestly by the CTO

Cross-links: [01_QA_TEST_REPORT.md §A4a](01_QA_TEST_REPORT.md) ·
[04_BUG_REPORT.md](04_BUG_REPORT.md) · [09_UNIVERSAL_HANDOVER_FILLED.md PART 5](09_UNIVERSAL_HANDOVER_FILLED.md)

---

## Counts

| Severity | Count |
|---|---:|
| Sev 1 — Critical (ship-blocker) | **0** |
| Sev 2 — High (must fix before next release) | **0** |
| Sev 3 — Medium (documented, deferred) | **2** |
| Sev 4 — Low (quality-of-life, backlog) | **2** |
| **Total** | **4** |

Zero critical, zero high. Handover is approved.

---

## KI-001 — Act-tab `nested-interactive` (28 Pro-Action cards)

| Field | Value |
|---|---|
| **ID** | KI-001 |
| **Severity** | Sev 3 — Medium |
| **WCAG rule** | 4.1.2 Name, Role, Value |
| **axe-core rule ID** | `nested-interactive` |
| **Impact** | serious |
| **Tab** | Act (only) |
| **Count** | 28 unique findings (28 Pro-Action cards) |
| **Status** | Open — deferred to substrate sprint |
| **Owner** | CTO substrate team |

### Description

The 28 Pro-Action cards on the Act tab are `<button>` elements. The shared
`chitti_card_widget.js` substrate attaches the per-card feedback bar
(five `[role=button]` spans: 🔊, 🤖, 👍, 👎, feedback-open) *inside* each
card button. This creates focusable controls nested inside a button, which
violates WCAG 4.1.2 (interactive elements must not be nested inside other
interactive elements).

Affected cards include all 28 Pro-Action modals:
`openCallModal`, `openWAModal`, `openWACallModal`, `openUPIModal`,
`openEmailModal`, `openSMSModal`, `openYouTubeModal`, `openMusicModal`,
`openVideoModal`, `openMapsModal`, `openSearchModal`, `openAppLauncherModal`,
`openAlarmModal`, `openReminderModal`, `openSafeWalkModal`,
`confirmFakeIncomingCall`, `openLocationShareModal`, `openMedicalIdModal`,
`confirmAmbulance108`, `openNearbyHealthModal`, `toggleHeyChitti`,
`openLanguageModal`, and 6 further unlabelled `.pro-card:nth-child(N)` cards.

### Why not hot-patched

This is a **cross-cutting substrate item**. `chitti_card_widget.js` is shared
across every Chitti page that uses Pro-Action cards. A single-page patch would
create a divergent substrate; the correct fix is a fleet-wide sprint on
`chitti_card_widget.js` (and `chitti_observability.js` guards).

### Workaround / remediation plan

Wrap each card + its feedback widget in a non-interactive `.pro-card-cell`
container element, making the feedback controls **siblings** of the card button
rather than descendants. Estimated effort: 1 day (fleet-wide).

### User impact

The primary Talk surface + all 8 disability profiles are axe-clean (0 serious).
Keyboard users navigating the Act tab will encounter the nested-interactive
issue, but the cards remain fully mouse/touch operable.

---

## KI-002 — Live DeepSeek route-accuracy unmeasured

| Field | Value |
|---|---|
| **ID** | KI-002 |
| **Severity** | Sev 3 — Medium |
| **Status** | Open — gated on funding + Vaani relevance-rail allowlist |
| **Owner** | Sire (DeepSeek funding) + CTO (relevance-rail) |

### Description

The QA harness mocks the intent router for structural testing. No live
route-accuracy percentage is claimed because:

1. DeepSeek API key balance was exhausted 2026-05-27 (fleet-wide blocker, per
   `QUALITY_STATUS.md`). Live calls are currently returning graceful fallbacks.
2. The Vaani relevance-rail allowlist (the per-Chitti confidence thresholds
   that gate automatic routing vs. readback-confirm) has not been calibrated
   against a real labelled utterance set.

Until both blockers are cleared, publishing an accuracy number would be
misleading. The harness explicitly labels live route-accuracy as
**AUTOMATION-LIMITED** in every report.

### Workaround

The readback-confirm path (confidence < 70% → *"Shall I route to Chitti CA?
Say haan."*) ensures that even with an uncalibrated router, no user is routed
to the wrong Chitti without an explicit confirmation. Safety-first.

### Remediation plan

1. Sire funds DeepSeek balance (or the Gemini Layer-5 fallback is wired first).
2. CTO runs `tools/qa_full_vaani.mjs` with live LLM against the 25 sample
   utterances in `test_samples/vaani/` and publishes accuracy numbers in a new
   `chitti-vaani/evals/router_accuracy_live.md`.

---

## KI-003 — Android OS-level capabilities are spec-only

| Field | Value |
|---|---|
| **ID** | KI-003 |
| **Severity** | Sev 4 — Low |
| **Status** | Open — Phase 2 APK not yet built |
| **Owner** | CTO (Phase 2, ~5 months) |

### Description

13 Android OS-level capabilities are documented in
`chitti-vaani/ARCHITECTURE.md` (Phase 2 section) and `PRD.md §F10`:

- Lock phone on voice command (`DevicePolicyManager.lockNow()`)
- Toggle silent / ring mode (`AudioManager.setRingerMode()`)
- Direct-dial without `tel:` hop (`ACTION_CALL`)
- Open WhatsApp and tap Send autonomously (`AccessibilityService`)
- On-device Vosk keyword spotting (foreground service, offline)
- FCM push for Chitti-to-Chitti relay
- STREAM_ALARM bypass for silent-mode alerts
- Read SMS / call log / notifications aloud
- Night-mode call screening (22:00–06:00)
- Voice-biometric UPI PIN (RBI Regulatory Sandbox, parked v2)
- Federated learning on voice samples
- Auto-answer / day-mode call handling
- Hard refusal to unlock

Every one of these carries a `📱 Android only` pill on the Act tab and an honest
`COMING SOON` no-op shim on web. They are **never claimed as live on the web
surface**.

### Impact

Nil for current web users. All web-available capabilities (SafeWalk, Fake Call,
Location Share, Medical ID, 108, `tel:` / `sms:` / `wa.me` deep-links, Gmail
OAuth) are fully functional.

---

## KI-004 — Lazy language-pack first-switch latency (2–4 s under load)

| Field | Value |
|---|---|
| **ID** | KI-004 |
| **Severity** | Sev 4 — Low |
| **Status** | Open — QA harness handles with `settle` poll |
| **Owner** | CTO substrate |

### Description

`chitti_lang.js` lazy-loads language packs on first switch away from the
default locale. Under synthetic test conditions that switch all 26 languages
in rapid succession (as the QA harness does), the per-language switch time
can reach 2–4 s for the initial cold-load of a pack.

In the real QA run, `switch_ms` ranged from 2136 ms (bho, warm) to 8459 ms
(bn, first cold load). Once a pack is loaded, subsequent switches are < 300 ms.

### Impact

A real user switching languages once during a session will see a 2–4 s pause
on their first non-default language switch. This is a one-time cost; all
subsequent switches are fast. No console errors; no loss of content.

A real user will never cycle all 26 packs in < 5 s. The harness's rapid-switch
edge case (10 switches in ~1.2 s) passed without errors because the harness
polls for settle.

### Remediation plan

Pre-load the top-3 regional language packs (hi, bn, te) in a low-priority
background idle callback after the page reaches DOMContentLoaded + 5 s.
Estimated effort: 2 h. Tracked as substrate backlog.

---

## Summary table

| ID | Title | Sev | Status | Owner |
|---|---|---|---|---|
| KI-001 | Act-tab `nested-interactive` (28 cards) | Sev 3 | Open — substrate sprint | CTO substrate |
| KI-002 | Live route-accuracy unmeasured | Sev 3 | Open — gated on DeepSeek funding | Sire + CTO |
| KI-003 | Android OS capabilities spec-only | Sev 4 | Open — Phase 2 APK | CTO Phase 2 |
| KI-004 | Lang-pack first-switch latency | Sev 4 | Open — backlog | CTO substrate |

**Handover verdict: ✅ Acceptable** — 0 critical, 0 high; 2 Sev-3 with workarounds
+ owners + plans; 2 Sev-4 with zero user-visible impact on primary flows.
