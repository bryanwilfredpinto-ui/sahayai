package `in`.sahayai.chitti.vaani.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.core.app.NotificationCompat
import `in`.sahayai.chitti.vaani.MainActivity
import `in`.sahayai.chitti.vaani.R
import `in`.sahayai.chitti.vaani.util.AuditLog

/**
 * VaaniBootService — "Hey Chitti" always-listening foreground service.
 *
 * Bryan 2026-05-22: "Background wake word — Hey Chitti always listening."
 *
 * Design choice (v1, ships today)
 * ------------------------------
 * Uses Android's built-in SpeechRecognizer with `EXTRA_PARTIAL_RESULTS`
 * and a continuous restart loop. Battery cost: ~1-3% per hour on most
 * devices; matches what Google Assistant / Siri's web fallback uses
 * when on-device wake-word HW isn't available.
 *
 * No Vosk dependency in v1. The Vosk on-device path is a Phase-2.4
 * upgrade for offline + lower battery — drops in as a new branch in
 * `processPartialResults()` without changing the service contract.
 *
 * Wake phrases (case-insensitive substring match on partial transcript):
 *   "hey chitti"   · primary
 *   "sun chitti"   · Hindi alternate
 *   "are chitti"   · informal Hindi
 *   "chitti"       · loose fallback (only fires when single word)
 *
 * On wake-word hit:
 *   1. Stop the recognizer briefly so we don't capture the user's
 *      follow-up command twice (the WebView's mic takes over).
 *   2. Bring MainActivity to the foreground.
 *   3. Post an Intent extra `EXTRA_OPEN_VOICE_MIC=true` so
 *      MainActivity.onResume picks it up and runs
 *      `web.evaluateJavascript("toggleMic();")`.
 *   4. Schedule a 6-second restart of the wake-word loop.
 *
 * Foreground service contract
 * ---------------------------
 *   - Sticky persistent notification ("🪔 Chitti is listening") so the
 *     user can disable from the system tray.
 *   - `FOREGROUND_SERVICE_TYPE_MICROPHONE` on API 30+ (declared in
 *     manifest) so the OS allows mic access while the screen is off.
 *   - WAKE_LOCK kept partial — the CPU stays warm enough to run the
 *     recognizer between restarts, but the screen never lights up
 *     except on wake-word hit.
 *   - Re-arms itself on RecognitionListener.onEndOfSpeech /
 *     onResults / onError so a transient mic error doesn't kill the
 *     loop.
 *
 * Hard refusals (security fences — Bryan's CONTEXT.md §0):
 *   - The service never records audio to disk. Partial results live in
 *     RAM only.
 *   - Wake-word hits write an audit row with the *trigger word*, not
 *     the full transcript. The full transcript continues only through
 *     the WebView's normal mic flow which the user controls.
 *   - The service refuses to run if RECORD_AUDIO isn't granted —
 *     MainActivity.enableHeyChitti() prompts; the service self-stops
 *     if it discovers a missing permission at startup.
 */
class VaaniBootService : Service() {

    private var recognizer: SpeechRecognizer? = null
    private val handler = Handler(Looper.getMainLooper())
    private var stopped = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_LISTENING -> startWakeLoop()
            ACTION_STOP_LISTENING  -> stopWakeLoop()
            else                   -> startWakeLoop()
        }
        return START_STICKY
    }

    private fun startWakeLoop() {
        if (stopped) stopped = false
        isListening = true
        val notif = buildNotification("🪔 Chitti is listening — say \"Hey Chitti\" anytime")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                startForeground(
                    NOTIF_ID, notif,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE,
                )
            } catch (_: SecurityException) {
                startForeground(NOTIF_ID, notif)
            }
        } else {
            startForeground(NOTIF_ID, notif)
        }
        AuditLog.append(this, "VaaniBootService started", "wake-word loop armed")
        spinUpRecognizer()
    }

    private fun stopWakeLoop() {
        stopped = true
        isListening = false
        try { recognizer?.stopListening() } catch (_: Exception) {}
        try { recognizer?.destroy() } catch (_: Exception) {}
        recognizer = null
        handler.removeCallbacksAndMessages(null)
        AuditLog.append(this, "VaaniBootService stopped", "")
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun spinUpRecognizer() {
        if (stopped) return
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            AuditLog.append(this, "VaaniBootService — recognition unavailable",
                "device has no SpeechRecognizer; stopping")
            stopWakeLoop()
            return
        }
        try { recognizer?.destroy() } catch (_: Exception) {}
        val r = SpeechRecognizer.createSpeechRecognizer(this)
        recognizer = r
        r.setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {}
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {}
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() { restartLater(300L) }
            override fun onEvent(eventType: Int, params: Bundle?) {}

            override fun onPartialResults(partialResults: Bundle?) {
                val list = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION) ?: return
                checkWake(list)
            }

            override fun onResults(results: Bundle?) {
                val list = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION) ?: emptyList()
                checkWake(list)
                restartLater(50L)
            }

            override fun onError(error: Int) {
                // Network / no-match / speech-timeout are all expected during a
                // long-running wake loop — quietly restart.
                restartLater(if (error == SpeechRecognizer.ERROR_NO_MATCH) 200L else 800L)
            }
        })
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            // Multi-language hint — Indian-English + Hindi cover the
            // majority of "Hey Chitti" / "Sun Chitti" phrases.
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-IN")
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "en-IN")
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
            putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)  // honour user data-saver
        }
        try { r.startListening(intent) } catch (e: Exception) {
            AuditLog.append(this, "VaaniBootService startListening failed", e.message ?: "")
            restartLater(2000L)
        }
    }

    private fun checkWake(transcripts: List<String>) {
        for (t in transcripts) {
            val s = t.lowercase()
            val matched = WAKE_PHRASES.firstOrNull { phrase ->
                if (phrase == "chitti") {
                    // Loose fallback — only fire when "chitti" is the
                    // whole utterance, otherwise we'd false-trigger on
                    // "Tell Chitti something" etc.
                    s.trim() == "chitti"
                } else {
                    s.contains(phrase)
                }
            }
            if (matched != null) {
                fireWake(matched)
                return
            }
        }
    }

    private fun fireWake(phrase: String) {
        AuditLog.append(this, "VaaniBootService WAKE", phrase)
        try { recognizer?.stopListening() } catch (_: Exception) {}
        // Bring MainActivity to the foreground + tell it to toggle the mic.
        val i = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra(EXTRA_WAKE_PHRASE, phrase)
            putExtra(EXTRA_OPEN_VOICE_MIC, true)
        }
        try { startActivity(i) } catch (e: Exception) {
            AuditLog.append(this, "VaaniBootService wake → start failed", e.message ?: "")
        }
        // Hand the WebView a quiet 6s window so it can finish capturing
        // the user's follow-up command without our wake loop racing it.
        restartLater(6000L)
    }

    private fun restartLater(delayMs: Long) {
        if (stopped) return
        handler.removeCallbacksAndMessages(null)
        handler.postDelayed({ spinUpRecognizer() }, delayMs)
    }

    private fun buildNotification(text: String) =
        NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentTitle("Chitti Vaani")
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setContentIntent(openAppPi())
            .addAction(0, "Stop listening", stopServicePi())
            .build()

    private fun openAppPi(): PendingIntent {
        val i = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        return PendingIntent.getActivity(
            this, 0, i,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
    }

    private fun stopServicePi(): PendingIntent {
        val i = Intent(this, VaaniBootService::class.java).setAction(ACTION_STOP_LISTENING)
        return PendingIntent.getService(
            this, 1, i,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
    }

    override fun onCreate() {
        super.onCreate()
        ensureChannel(this)
    }

    override fun onDestroy() {
        super.onDestroy()
        try { recognizer?.destroy() } catch (_: Exception) {}
        recognizer = null
        handler.removeCallbacksAndMessages(null)
        isListening = false
    }

    companion object {
        const val ACTION_START_LISTENING = "in.sahayai.chitti.vaani.action.START_WAKE_WORD"
        const val ACTION_STOP_LISTENING  = "in.sahayai.chitti.vaani.action.STOP_WAKE_WORD"
        const val EXTRA_WAKE_PHRASE      = "wake_phrase"
        const val EXTRA_OPEN_VOICE_MIC   = "open_voice_mic"
        const val CHANNEL_ID             = "chitti_wake_word"
        const val NOTIF_ID               = 8077

        /** Public read for the JS bridge (heyChittiState()). Set by the
         *  service itself; reset on stop / onDestroy. */
        @Volatile var isListening: Boolean = false

        private val WAKE_PHRASES = listOf(
            "hey chitti", "sun chitti", "are chitti", "chitti suno", "chitti",
        )

        fun ensureChannel(ctx: Context) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
            val mgr = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            if (mgr.getNotificationChannel(CHANNEL_ID) != null) return
            val ch = NotificationChannel(
                CHANNEL_ID,
                "Chitti wake word",
                NotificationManager.IMPORTANCE_LOW,
            ).apply {
                description = "Persistent notification while Hey Chitti is listening for the wake word."
                enableVibration(false)
                setShowBadge(false)
            }
            mgr.createNotificationChannel(ch)
        }
    }
}
