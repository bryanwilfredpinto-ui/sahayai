// World Class Chitti Vaani Android — Commando Discipline. Zero Excuses.
package `in`.sahayai.chitti.vaani.push

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.speech.tts.TextToSpeech
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import `in`.sahayai.chitti.vaani.MainActivity
import `in`.sahayai.chitti.vaani.util.AuditLog
import java.util.Locale

/**
 * ChittiFcmService — Phase-2.4 FCM inbound relay push handler.
 *
 * ACTIVATION: This service is dormant until `google-services.json` is
 * dropped into `app/` and the Firebase/GMS dependency is uncommented in
 * `build.gradle.kts`. The service class compiles without it only when
 * the firebase-messaging-ktx dependency is present. See FCM_SETUP.md.
 *
 * Purpose:
 *   When a paired Chitti fires `/api/vaani/emergency/trigger` on the
 *   backend, the backend sends an FCM data message to this device. This
 *   service receives that message and triggers the emergency wake sequence
 *   locally — identical to what VaaniCallScreeningService does on an
 *   incoming call, but initiated from a remote Chitti (e.g., a family
 *   member's Chitti raises the alarm for a relative).
 *
 * Message contract (data map):
 *   type          : "emergency_relay"
 *   caller_label  : display name of who triggered it (e.g. "Maa")
 *   message       : optional text to read aloud (e.g. "Accident on NH44")
 *   severity      : "LOW" | "HIGH" — HIGH bypasses Do Not Disturb
 *
 * Golden Rule:
 *   This service NEVER auto-dials anyone. It wakes the user (alarm +
 *   vibration + TTS) and brings MainActivity to the foreground. The
 *   user decides what to call.
 *
 * COP_DENYLIST:
 *   Applies here too — the payload can never instruct this service to
 *   dial 112/100/101/102/108/1098/1930/139. Any such payload is logged
 *   as a SUSPICIOUS_PAYLOAD and ignored.
 *
 * FCM token rotation:
 *   onNewToken() logs the new token to AuditLog. The production flow is:
 *   token → POST to `/api/vaani/fcm/register` with the user's session
 *   token so the backend can route pushes to the right device.
 */
class ChittiFcmService : FirebaseMessagingService() {

    private val handler = Handler(Looper.getMainLooper())
    private var tts: TextToSpeech? = null

    companion object {
        private const val CHANNEL_ID       = "chitti_fcm_emergency"
        private const val NOTIF_ID         = 9099
        private const val REGISTER_ENDPOINT = "https://sahayai.in/api/vaani/fcm/register"

        /** Types this service acts on — all others are logged and ignored. */
        private val HANDLED_TYPES = setOf("emergency_relay", "reminder", "ping")

        /** COP_DENYLIST — identical to MainActivity / VaaniCallScreeningService. */
        private val COP_DENYLIST = setOf(112, 100, 101, 102, 108, 1098, 1930, 139)
    }

    // ── Token lifecycle ───────────────────────────────────────────────────

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        AuditLog.append(this, "FCM", "new token received — posting to backend")
        // POST token to backend so it can route pushes to this device.
        // Runs on a background thread (FCM calls onNewToken on a bg thread).
        Thread { registerTokenWithBackend(token) }.start()
    }

    private fun registerTokenWithBackend(token: String) {
        try {
            val prefs = getSharedPreferences("chitti_vaani_prefs", MODE_PRIVATE)
            val sessionToken = prefs.getString("session_token", "") ?: ""
            if (sessionToken.isEmpty()) {
                AuditLog.append(this, "FCM", "token registration skipped — no session_token yet")
                return
            }
            val url = java.net.URL(REGISTER_ENDPOINT)
            val conn = url.openConnection() as java.net.HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.connectTimeout = 10_000
            conn.readTimeout    = 10_000
            conn.doOutput       = true
            val body = "{\"fcm_token\":\"${token.replace("\"","\\\"")}\",\"session_token\":\"${sessionToken.replace("\"","\\\"")}\"}"
            conn.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
            val code = conn.responseCode
            conn.disconnect()
            AuditLog.append(this, "FCM", "token registration response: $code")
        } catch (e: Exception) {
            AuditLog.append(this, "FCM", "token registration failed: ${e.message ?: ""}")
        }
    }

    // ── Message handling ──────────────────────────────────────────────────

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        val type = message.data["type"] ?: "unknown"
        AuditLog.append(this, "FCM", "received · type=$type")

        if (type !in HANDLED_TYPES) {
            AuditLog.append(this, "FCM", "unhandled type=$type · ignoring")
            return
        }

        when (type) {
            "emergency_relay" -> handleEmergencyRelay(message.data)
            "reminder"        -> handleReminder(message.data)
            "ping"            -> AuditLog.append(this, "FCM", "ping received — device reachable")
        }
    }

    // ── Emergency relay ───────────────────────────────────────────────────

    private fun handleEmergencyRelay(data: Map<String, String>) {
        val callerLabel = data["caller_label"]?.ifBlank { null } ?: "Family contact"
        val extraMsg    = data["message"]?.ifBlank { null }
        val severity    = data["severity"] ?: "HIGH"

        // Reject any payload that encodes a cop number — signed or not.
        val rawPhone = data["phone"] ?: ""
        if (rawPhone.isNotEmpty()) {
            val num = rawPhone.replace(Regex("[^\\d]"), "").toIntOrNull()
            if (num != null && COP_DENYLIST.contains(num)) {
                AuditLog.append(this, "FCM", "SUSPICIOUS_PAYLOAD — cop number in phone field: $rawPhone · ignoring")
                return
            }
        }

        AuditLog.append(this, "FCM", "EMERGENCY_RELAY · caller=$callerLabel · severity=$severity")

        ensureChannel()
        postEmergencyNotification(callerLabel, extraMsg)
        fireAlarm(callerLabel, extraMsg, severity)
        bringMainActivityToFront(callerLabel)
    }

    private fun fireAlarm(callerLabel: String, extraMsg: String?, severity: String) {
        // 1. Max alarm volume
        try {
            val am = getSystemService(AUDIO_SERVICE) as AudioManager
            val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
            if (nm.isNotificationPolicyAccessGranted) {
                am.ringerMode = AudioManager.RINGER_MODE_NORMAL
                am.setStreamVolume(
                    AudioManager.STREAM_ALARM,
                    am.getStreamMaxVolume(AudioManager.STREAM_ALARM),
                    AudioManager.FLAG_SHOW_UI,
                )
            }
        } catch (_: SecurityException) {}

        // 2. Vibration
        try {
            val pattern = longArrayOf(0, 500, 200, 500, 200, 1000)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                vm.defaultVibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
            } else {
                @Suppress("DEPRECATION")
                val v = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                @Suppress("DEPRECATION")
                v.vibrate(pattern, -1)
            }
        } catch (_: Exception) {}

        // 3. TTS wake shout
        val wakeMsg = buildWakeMessage(callerLabel, extraMsg)
        handler.post {
            tts = TextToSpeech(this) { status ->
                if (status == TextToSpeech.SUCCESS) {
                    tts?.language = Locale("hi", "IN")
                    tts?.speak(wakeMsg, TextToSpeech.QUEUE_FLUSH, null, "fcm_alarm")
                    // Repeat after 5s
                    handler.postDelayed({
                        tts?.speak(wakeMsg, TextToSpeech.QUEUE_ADD, null, "fcm_alarm2")
                    }, 5000L)
                }
            }
        }
        AuditLog.append(this, "FCM", "alarm fired · $wakeMsg")
    }

    private fun buildWakeMessage(callerLabel: String, extraMsg: String?): String {
        val base = "जागिए, $callerLabel से आपातकाल संदेश है।"
        return if (extraMsg != null) "$base $extraMsg" else base
    }

    private fun bringMainActivityToFront(callerLabel: String) {
        try {
            val i = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("emergency_caller", callerLabel)
                putExtra("emergency_source", "fcm")
            }
            startActivity(i)
        } catch (e: Exception) {
            AuditLog.append(this, "FCM", "bring-to-front failed: ${e.message ?: ""}")
        }
    }

    // ── Reminder push ─────────────────────────────────────────────────────

    private fun handleReminder(data: Map<String, String>) {
        val title   = data["title"] ?: "Chitti Reminder"
        val body    = data["body"]  ?: ""
        val notifId = (data["notif_id"]?.toIntOrNull() ?: 0) + 9100
        AuditLog.append(this, "FCM", "reminder · title=$title")
        ensureChannel()

        val openIntent = PendingIntent.getActivity(
            this, notifId,
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            },
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        val notif = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(openIntent)
            .build()
        (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).notify(notifId, notif)
    }

    // ── Notification helpers ──────────────────────────────────────────────

    private fun postEmergencyNotification(callerLabel: String, extraMsg: String?) {
        val body = extraMsg ?: "Emergency alert from $callerLabel"
        val openIntent = PendingIntent.getActivity(
            this, NOTIF_ID,
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("emergency_caller", callerLabel)
            },
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        val notif = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_sys_warning)
            .setContentTitle("🚨 Emergency — $callerLabel")
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setOngoing(true)
            .setAutoCancel(false)
            .setContentIntent(openIntent)
            .build()
        (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).notify(NOTIF_ID, notif)
    }

    private fun ensureChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val mgr = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        if (mgr.getNotificationChannel(CHANNEL_ID) != null) return
        val ch = NotificationChannel(
            CHANNEL_ID,
            "Chitti emergency alerts",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "Emergency relay push notifications from paired Chitti devices."
            enableVibration(true)
            enableLights(true)
        }
        mgr.createNotificationChannel(ch)
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacksAndMessages(null)
        tts?.stop()
        tts?.shutdown()
        tts = null
    }
}
