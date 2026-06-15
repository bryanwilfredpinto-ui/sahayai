# app/libs/

Drop `vosk-android-0.3.47.aar` here for Phase 2.4 on-device keyword
spotting, then uncomment the Vosk line in
[`app/build.gradle.kts`](../build.gradle.kts) and bundle the small Hindi +
English models under `app/src/main/assets/vosk/`.

Keyword spotting runs **on-device only** — emergency / ambulance /
hospital / accident / bachao / madad / dard must never leave the phone.
