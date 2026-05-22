package `in`.sahayai.chitti.vaani.services

import android.telecom.Call
import android.telecom.InCallService
import `in`.sahayai.chitti.vaani.util.AuditLog

/**
 * VaaniInCallService
 * ------------------
 * Becomes active once the user grants ROLE_DIALER. Receives every
 * incoming, outgoing, and active call.
 *
 * Day-mode "Chitti, answer call" flow (Phase 2.3):
 *   - User says "answer" via the always-on voice mic.
 *   - We invoke call.answer(VideoProfile.STATE_AUDIO_ONLY).
 *   - TTS plays: "Namaste. Main Chitti hun, ek AI assistant.
 *                  Main [user name] ki taraf se baat kar rahi hun."
 *   - Live transcription (DeepSeek or on-device) feeds the WebView so
 *     the user can read what's being said and reply by voice or tap.
 *   - When the user replies, TTS speaks the reply on the call.
 *
 * Night-mode flow is handed off from VaaniCallScreeningService.
 *
 * Stub: this skeleton just logs lifecycle. Wire the real flows in
 * Phase 2.3 / 2.4.
 */
class VaaniInCallService : InCallService() {

    override fun onCallAdded(call: Call) {
        super.onCallAdded(call)
        AuditLog.append(this, "InCallService onCallAdded",
            "state=${call.state} from=${call.details.handle?.schemeSpecificPart ?: "?"}")
        // Track the current call so the JS bridge's answerCall() /
        // rejectCall() voice intents (added 2026-05-22) can act on it
        // without re-plumbing the InCallService binder.
        currentCall = call
        // TODO Phase 2.3:
        //   - Listen for "answer" / "uthao" via VaaniBootService.
        //   - Start live transcription pipeline once accepted.
    }

    override fun onCallRemoved(call: Call) {
        super.onCallRemoved(call)
        AuditLog.append(this, "InCallService onCallRemoved", "ended")
        if (currentCall === call) currentCall = null
    }

    companion object {
        // Active call cursor — set on every onCallAdded, cleared on
        // onCallRemoved. Read by the JS bridge from MainActivity so
        // voice intents "answer the call" / "reject the call" can
        // operate without re-plumbing the InCallService binder.
        @Volatile
        private var currentCall: Call? = null

        /** Answer the current call if any. Returns "ok" on success,
         *  null if there's no active call.
         */
        fun tryAnswerCurrent(): String? {
            val c = currentCall ?: return null
            try {
                c.answer(android.telecom.VideoProfile.STATE_AUDIO_ONLY)
            } catch (e: Exception) {
                return null
            }
            return "ok"
        }

        /** Reject the current call if any. Returns "ok" on success,
         *  null if there's no active call.
         */
        fun tryRejectCurrent(): String? {
            val c = currentCall ?: return null
            try {
                c.reject(false, null)
            } catch (e: Exception) {
                return null
            }
            return "ok"
        }
    }
}
