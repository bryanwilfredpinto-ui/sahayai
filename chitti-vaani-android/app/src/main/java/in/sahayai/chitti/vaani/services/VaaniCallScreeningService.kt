package `in`.sahayai.chitti.vaani.services

import android.telecom.Call
import android.telecom.CallScreeningService
import android.os.Build
import androidx.annotation.RequiresApi
import `in`.sahayai.chitti.vaani.util.AuditLog

/**
 * VaaniCallScreeningService
 * -------------------------
 * Phase-2.4 night-mode auto-answer + emergency keyword wake.
 *
 * Flow at runtime:
 *   1. Incoming call ringing event lands here BEFORE the phone rings.
 *   2. If it's daytime OR the user has not enabled night mode:
 *        respondWithDefault() — let the call ring normally.
 *   3. If it's night mode (between 22:00 and 06:00 IST) AND the user
 *      did not respond within 10 seconds to "Mom is calling. Answer?":
 *        respondToCall(silenceCall = true) → call goes silent.
 *        Hand the call to VaaniInCallService which:
 *          - Picks up
 *          - TTS: "This is Chitti AI. The user is sleeping. Is this an emergency?"
 *          - Listens via on-device SpeechRecognizer for keywords:
 *              emergency · ambulance · hospital · accident · bachao · madad · dard
 *          - On a hit:
 *              AudioManager.setRingerMode(RINGER_MODE_NORMAL)
 *              setStreamVolume(STREAM_RING, max)
 *              vibrate long-pulse
 *              TTS in user language: "Wake up master, emergency call from <name>"
 *              repeat every 5s until phone unlocked OR call ends.
 *          - Otherwise: hang up after 30s silence with a polite line.
 *
 * Stub: this skeleton logs and falls through to default behaviour. The
 * keyword spotting integration (Vosk on-device, no network) is the
 * Phase-2.4 milestone in CHITTI_VAANI_PHASE2_ANDROID_SPEC.md.
 */
@RequiresApi(Build.VERSION_CODES.N)
class VaaniCallScreeningService : CallScreeningService() {

    override fun onScreenCall(callDetails: Call.Details) {
        val number = callDetails.handle?.schemeSpecificPart ?: "unknown"
        val isNightMode = NightModeReceiver.isNightModeActive(this)
        AuditLog.append(this, "incoming call",
            "$number · nightMode=$isNightMode")

        if (!isNightMode) {
            // Day mode: let the phone ring normally.
            respondToCall(callDetails, CallResponse.Builder().build())
            return
        }

        // Night mode: silence the ringer, speak caller ID aloud, open a 10s
        // answer window. VaaniBootService's wake-word loop listens for "haan"
        // during that window and calls VaaniInCallService.tryAnswerCurrent().
        val resp = CallResponse.Builder()
            .setSilenceCall(true)
            .setSkipCallLog(false)
            .setSkipNotification(false)
            .build()
        respondToCall(callDetails, resp)

        // Speak "<caller> ka call aa raha hai. Uthane ke liye haan bolo." via TTS.
        val tts = android.speech.tts.TextToSpeech(this, null)
        val callerDisplay = callDetails.callerDisplayName?.takeIf { it.isNotBlank() } ?: number
        handler.postDelayed({
            tts.speak(
                "$callerDisplay ka call aa raha hai. Uthane ke liye haan bolo.",
                android.speech.tts.TextToSpeech.QUEUE_FLUSH, null, "chitti_night_call",
            )
        }, 500)

        // 10-second window: VaaniBootService listens for "haan"/"answer" and
        // calls VaaniInCallService.tryAnswerCurrent() if detected. After 10s
        // with no response the call stays silenced.
        AuditLog.append(this, "night-mode call", "10s answer window opened for $callerDisplay")
    }

    private val handler = android.os.Handler(android.os.Looper.getMainLooper())
}
