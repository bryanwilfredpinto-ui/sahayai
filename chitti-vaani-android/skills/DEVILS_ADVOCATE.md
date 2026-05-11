# DEVIL'S ADVOCATE — Chitti Vaani Android

Eight critiques to actively defend against. None is a reason to **not** ship Phase 2 — but each is a reason to ship carefully.

## 1. Foreground service drains battery — users disable it within a week

Always-on Vosk listening + persistent notification + WAKE_LOCK is the classic battery-hog antipattern. Mitigation: use Vosk's low-bandwidth feature path (16 kHz, no streaming), drop CPU between keyword hits, and benchmark against a 4000 mAh phone overnight before Play Store submission. If we cannot stay under 5% overnight drain, Phase 2.4 ships behind an opt-in toggle.

## 2. Default Dialer role requires explicit Play Store policy approval — may not pass

`ROLE_DIALER` is on Google's restricted permissions list. Justification template at [`README.md`](../README.md#play-store-compliance) covers the elderly-living-alone use case, but reviewers can still reject. Mitigation: ship CallScreening-only (no Dialer) as Phase 2.4-lite if Dialer is rejected. Document the fallback before submission.

## 3. AccessibilityService scope tightening may break when WhatsApp changes its send-button resource id

[`VaaniAccessibilityService`](../app/src/main/java/in/sahayai/chitti/vaani/services/VaaniAccessibilityService.kt) matches `com.whatsapp:id/send`. WhatsApp can rename that node in any release. Mitigation: include a content-description fallback ("Send"), monitor crash reports for failed taps, and degrade gracefully to a `wa.me` deep-link if the node isn't found within 2s.

## 4. Vosk Hindi + English models are ~50 MB each — APK size bloat

`assets/vosk/` will push the APK well past 100 MB, triggering Play Store dynamic delivery requirements. Mitigation: ship language models as on-demand asset packs via Play Asset Delivery, not as raw assets. APK base stays small; user downloads their language pack on first run.

## 5. WebView mic + foreground service mic — race condition

`AudioRecord` is mutually exclusive across processes. The web tier's `MediaRecorder` and `VaaniBootService`'s Vosk recogniser will fight. The plan documented in [`ARCHITECTURE.md §3`](../ARCHITECTURE.md#3-audio-capture-pipeline) is "service drops to silent when WebView wants the mic" — but the handoff window is exactly when an emergency might fire. Needs explicit instrumented testing.

## 6. Restricted permissions form rejection is near-certain on first try

`RECEIVE_SMS` / `SEND_SMS` / `READ_CALL_LOG` will face manual review. Expect 2–3 rejections per [TODO Phase 2.6](../TODO.md#phase-26--google-play-submission-cycle-4-weeks). Mitigation: budget 8 weeks not 4, and consider whether SMS features can be dropped from v1 entirely.

## 7. On-device audit log can be deleted by a hostile family member

App-private storage is private from other apps but **not** from a logged-in user who can clear app data. Mitigation: nightly hash-anchor the audit log to the backend (hash only, not content) — tampering is then detectable without uploading PII.

## 8. WebView feature-detect of `window.ChittiNative` ties Phase 1 and Phase 2 release trains together

Every native bridge addition needs a corresponding `if (window.ChittiNative)` branch in [`chitti_vaani.html`](../../chitti_vaani.html). Web tier deploys are continuous; Android deploys are Play-Store-gated (days to weeks). Mitigation: version the bridge — `ChittiNative.canHostNative()` returns a version code, web tier checks before invoking newer methods.
