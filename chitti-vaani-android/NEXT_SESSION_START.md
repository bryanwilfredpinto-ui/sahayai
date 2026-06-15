# 🎖️ CHITTI CTO — NEXT SESSION START CODE
### World Class Chitti Vaani Android — Commando Discipline. Zero Excuses.
**Paste this entire file at the start of your next Cowork session.**

---

## WHO YOU ARE
You are the Chitti CTO — autonomous AI agent for Sahay AI. You report to Sire (Bryan Wilfred Pinto, Founder). Read `C:\Users\DELL\sahayai\sahayai\chitti-cto\CTO.md` for full identity and rules.

---

## WHAT WAS COMPLETED (2026-06-12 — Sessions 1, 2, 3)

### Session 1 (earlier):
- `VaaniCallScreeningService.kt` — Phase 2.4 night-mode 10s loop + emergency keyword detection ✅
- `VaaniInCallService.kt` — Phase 2.3 `call.answer()` + Speak-for-Me (mute-user English-Partner) ✅
- `SafetyChecksTest.kt` — 8 JUnit4 tests for all hard-refusal paths ✅
- `res/values-hi/strings.xml` — Hindi translations ✅
- Launcher icons — saffron #FF9933 PNG rasters at hdpi/xhdpi/xxhdpi/xxxhdpi ✅

### Session 2 (2026-06-12):
- `chitti_native_bridge.js` — Phase 2.2 standalone bridge substrate at repo root ✅
- `db/QueuedVoiceSample.kt` + `db/VoiceSampleDao.kt` + `db/VaaniDatabase.kt` — Phase 2.5 Room DB ✅
- `ml/FedLearningSyncWorker.kt` — Phase 2.5 WorkManager sync worker ✅
- `build.gradle.kts` — Room v2.6.1 + KSP annotation processor added ✅
- 24 `values-XX/strings.xml` files — all 26 languages now complete ✅
- `app/src/main/play/listings/en-IN/` — title, short_description, full_description, permissions_declaration, accessibility_justification ✅
- `app/src/main/play/listings/hi/` — title, short_description, full_description ✅
- `TODO.md` — all items updated ✅

### Session 3 (2026-06-12 — earlier):
- `MainActivity.kt` — added `companion object { instance }`, `AuditLog.init(this)`, `FedLearningSyncWorker.schedule()` on opt-in, `onDestroy()` cleanup ✅
- `push/ChittiFcmService.kt` — complete FCM service (emergency_relay + reminder + ping handlers, COP_DENYLIST, TTS alarm, token registration) — DORMANT until google-services.json dropped ✅
- `build.gradle.kts` — FCM dependency block added (commented, ready to un-comment) ✅
- `app/libs/` directory — created, ready for Vosk AAR drop ✅
- `FCM_SETUP.md` — step-by-step self-serve guide for Sire to activate FCM + Vosk ✅

### Session 4 (2026-06-12):
- `androidTest/assets/bridge_smoke.html` — stub page for WebView bridge smoke + COP_DENYLIST JS fence ✅
- `androidTest/bridge/ChittiNativeBridgeInstrumentedTest.kt` — 12 instrumented tests: canHostNative, lockPhone, setSilentMode, requestNightMode, SafetyChecks (5 paths), AuditLog, WebView bridge exposure, COP_DENYLIST JS fence ✅
- `app/build.gradle.kts` — added testInstrumentationRunner + 6 androidTestImplementation deps ✅

---

## WHAT IS STILL BLOCKED (waiting on Sire)

| # | Blocker | What Sire must do |
|---|---------|-------------------|
| B1 | `google-services.json` missing | Create Firebase project at console.firebase.google.com → download google-services.json → drop into `chitti-vaani-android/app/` |
| B2 | Vosk AAR missing | Download `vosk-android-0.3.47.aar` from alphacephei.com → drop into `chitti-vaani-android/app/libs/` |
| B3 | Privacy policy not live | Deploy `sahayai.in/privacy/chitti-vaani` with DPDP grievance officer line |
| B4 | DeepSeek API funding | Balance exhausted 2026-05-27 — currently routing through Gemini via env-var hijack |

---

## WHAT TO DO NEXT SESSION (in priority order)

### Priority 1 — IF Sire has google-services.json:
**Code is written. Sire just needs to follow `FCM_SETUP.md`:**
1. Copy `google-services.json` into `app/`
2. Un-comment 3 lines in `build.gradle.kts` (instructions in FCM_SETUP.md)
3. Sync Gradle → build → done. ChittiFcmService activates automatically.

### Priority 2 — IF Sire has Vosk AAR:
1. Drop `vosk-android-0.3.47.aar` into `app/libs/`
2. Un-comment line in `build.gradle.kts`: `implementation("com.alphacephei:vosk-android:0.3.47@aar")`
3. Bundle Hindi model (~50MB) into `app/src/main/assets/vosk/hi/` and English model into `app/src/main/assets/vosk/en/`
4. In `VaaniCallScreeningService.kt` emergency listening path — replace `SpeechRecognizer` with Vosk `Recognizer` using the Hindi model
5. Test keyword set: "emergency", "ambulance", "hospital", "accident", "bachao", "madad", "dard", "help", "urgent"

### Priority 3 — BlueStacks smoke test (can do any session):
Run the APK on BlueStacks and verify every bridge method:
- `lockPhone()` → phone locks ✅/❌
- `setSilentMode(true)` → ringer silenced ✅/❌
- `makeCall('9876543210')` → dialer opens ✅/❌
- `makeCall('112')` → REFUSED (COP_DENYLIST) ✅/❌
- `openWhatsApp('9876543210', 'test')` → WA opens ✅/❌
- `openUpiPay('test@upi', '1', 'test')` → UPI intent ✅/❌
- `triggerEmergencyAlarm()` → alarm + vibration ✅/❌
- `enableHeyChitti()` → service starts, notification appears ✅/❌
- Night mode: incoming call at 22:00 IST → 10s prompt fires ✅/❌

### Priority 4 — FedLearningSyncWorker scheduling:
✅ DONE — already wired in `MainActivity.onCreate()` (Session 3).

---

## KEY FILE LOCATIONS

```
C:\Users\DELL\sahayai\sahayai\
├── SAHAYAI_MASTER.md              ← Platform truth (22 locked decisions)
├── QUALITY_STATUS.md              ← 15 Chitti quality matrix
├── chitti-cto\CTO.md              ← CTO identity + defects + UI standard
├── chitti_native_bridge.js        ← NEW: Phase 2.2 bridge substrate
└── chitti-vaani-android\
    ├── TODO.md                    ← Updated — check this first
    ├── app\build.gradle.kts       ← Room + KSP added 2026-06-12
    ├── app\src\main\java\in\sahayai\chitti\vaani\
    │   ├── MainActivity.kt        ← WebView host + full ChittiNativeBridge
    │   ├── services\
    │   │   ├── VaaniBootService.kt          ✅ complete
    │   │   ├── VaaniBootReceiver.kt         ✅ complete
    │   │   ├── VaaniCallScreeningService.kt ✅ complete (night mode)
    │   │   ├── VaaniInCallService.kt        ✅ complete (speak-for-me)
    │   │   ├── VaaniAccessibilityService.kt ✅ complete (wa_send)
    │   │   └── NightModeReceiver.kt         ✅ complete
    │   ├── db\
    │   │   ├── QueuedVoiceSample.kt         ✅ NEW 2026-06-12
    │   │   ├── VoiceSampleDao.kt            ✅ NEW 2026-06-12
    │   │   └── VaaniDatabase.kt             ✅ NEW 2026-06-12
    │   ├── ml\
    │   │   └── FedLearningSyncWorker.kt          ✅ NEW 2026-06-12
    ├── push\
    │   └── ChittiFcmService.kt               ✅ NEW 2026-06-12 (DORMANT — needs google-services.json)
    │   └── util\
    │       ├── AuditLog.kt                  ✅ complete
    │       └── SafetyChecks.kt              ✅ complete
    ├── app\src\main\res\
    │   ├── values\strings.xml               ✅ English
    │   ├── values-hi\strings.xml            ✅ Hindi
    │   └── values-XX\strings.xml            ✅ 24 more (ta/te/bn/mr/gu/kn/ml/pa/or/ur/as/bho/sa/sat/kok/mai/doi/mni/ks/ne/sd/bo/brx/lus)
    ├── app/src/androidTest/
    │   ├── assets/bridge_smoke.html          ✅ NEW 2026-06-12
    │   └── bridge/ChittiNativeBridgeInstrumentedTest.kt  ✅ NEW 2026-06-12 (12 tests)
    └── app/src/main/play/listings\
        ├── en-IN\  ✅ title + short + full + permissions + accessibility justification
        └── hi\     ✅ title + short + full
```

---

## NON-NEGOTIABLES — NEVER FORGET

1. **Golden Rule (LOCKED 2026-05-23)**: Chitti NEVER acts without explicit user confirm via `chittiConfirmAndDo()`. Silence = wait forever. No timeout-to-yes.
2. **COP_DENYLIST**: {112, 100, 101, 102, 108, 1098, 1930, 139} — never auto-dial. Hard-coded fence. Not configurable remotely.
3. **Every bridge method**: `SafetyChecks.requireNotUnlock()` → action → `AuditLog.append()`
4. **unlockPhone() / bypassLock()**: Hard refusal always. No exceptions. No workarounds.
5. **Four-user contract**: Blind / Deaf / Mute / Illiterate — everything must work for all four.
6. **No Hinglish**: Pure language only. Technical terms (UPI, DPDP, WhatsApp, Chitti) stay in English.
7. **Never mark GREEN without verification**: curl output, screenshot, or log. No exceptions.

---

## CTO OPEN DEFECTS (from CTO.md — still open)

| # | Defect | Priority |
|---|--------|----------|
| 2 | `chitti-business` folder missing — no backend | 🔴 P0 |
| 3 | Turso DATABASE_URL broken on Railway for chitti-news-ai | 🔴 P0 |
| 4 | Layer 5 BCP fallback wired on 0/15 Chittis | 🔴 P0 |
| 5 | `chitti_share.js` referenced in docs but does not exist | 🔴 P1 |
| 6 | `feedback-widget.js` — verify all 5 mandatory elements | 🔴 P1 |
| 7 | 26 Voice Factory language pages unverified | 🟡 P2 |
| 8 | SAHAYAI_MASTER.md header date stale | 🟡 P2 |
| 9 | chitti-ca/legal/upi/scanner Turso shim unverified | 🔴 P0 |

---

**World Class Chitti CTO — Commando Discipline. Zero Excuses.**
