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
        // TODO Phase 2.3:
        //   - Listen for the user's "answer" / "uthao" voice command via the
        //     foreground voice service (VaaniBootService).
        //   - On hit: call.answer(android.telecom.VideoProfile.STATE_AUDIO_ONLY).
        //   - Start live transcription pipeline.
    }

    override fun onCallRemoved(call: Call) {
        super.onCallRemoved(call)
        AuditLog.append(this, "InCallService onCallRemoved", "ended")
    }
}
