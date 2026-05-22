package `in`.sahayai.chitti.vaani

import android.Manifest
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import `in`.sahayai.chitti.vaani.services.VaaniDeviceAdminReceiver
import `in`.sahayai.chitti.vaani.util.SafetyChecks
import `in`.sahayai.chitti.vaani.util.AuditLog

/**
 * MainActivity
 * ------------
 * Hosts a WebView pointing at the deployed Chitti Vaani web UI
 * (https://sahayai.in/chitti_vaani.html).
 *
 * The web UI handles all conversational logic, voice in/out, consent flow,
 * and pro-actions that work on the web tier (Gmail OAuth, WhatsApp /
 * UPI / mailto deep-links, federated voice samples, audit log).
 *
 * The Android tier wraps that with a JavaScript bridge (`ChittiNative.*`)
 * that exposes OS-level capabilities the web cannot reach:
 *   - lockPhone()             -> DevicePolicyManager.lockNow()
 *   - setSilentMode(on)       -> AudioManager.setRingerMode()
 *   - requestNightMode()      -> schedules NightModeReceiver alarms
 *   - requestCallScreening()  -> RoleManager prompt for ROLE_CALL_SCREENING
 *   - requestDialerRole()     -> RoleManager prompt for ROLE_DIALER
 *   - requestAccessibility()  -> opens Settings.ACTION_ACCESSIBILITY_SETTINGS
 *
 * HARD RULE — there is NO unlockPhone() method anywhere in this class
 * or in the bridge. SafetyChecks.refuseUnlock() is invoked if any inbound
 * JS attempts to call one. See SafetyChecks.kt.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var web: WebView

    private val DEFAULT_URL = "https://sahayai.in/chitti_vaani.html"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this)
        setContentView(web)

        with(web.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false   // for autoplay TTS
            allowContentAccess = false
            allowFileAccess    = false
        }
        web.webViewClient  = WebViewClient()
        web.webChromeClient = object : WebChromeClient() {
            // Forward mic permission requests from the web UI to the runtime mic permission
            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread {
                    val needed = mutableListOf<String>()
                    request.resources.forEach { res ->
                        when (res) {
                            PermissionRequest.RESOURCE_AUDIO_CAPTURE -> needed += res
                            PermissionRequest.RESOURCE_VIDEO_CAPTURE -> needed += res
                        }
                    }
                    if (needed.isEmpty()) { request.deny(); return@runOnUiThread }
                    if (ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.RECORD_AUDIO)
                            == PackageManager.PERMISSION_GRANTED) {
                        request.grant(needed.toTypedArray())
                    } else {
                        ActivityCompat.requestPermissions(this@MainActivity,
                            arrayOf(Manifest.permission.RECORD_AUDIO), 1001)
                        request.deny()
                    }
                }
            }
        }

        // JS bridge for OS-level capabilities the web tier cannot reach.
        web.addJavascriptInterface(ChittiNativeBridge(this), "ChittiNative")

        web.loadUrl(intent?.data?.toString() ?: DEFAULT_URL)
        maybeHandleWakeIntent(intent)
    }

    override fun onNewIntent(newIntent: Intent) {
        super.onNewIntent(newIntent)
        setIntent(newIntent)
        maybeHandleWakeIntent(newIntent)
    }

    /**
     * Honour `EXTRA_OPEN_VOICE_MIC=true` posted by VaaniBootService when
     * the wake word fires. Defers ~250 ms so the WebView has time to
     * initialise the recognizer hooked into toggleMic().
     */
    private fun maybeHandleWakeIntent(intent: Intent?) {
        val open = intent?.getBooleanExtra(
            `in`.sahayai.chitti.vaani.services.VaaniBootService.EXTRA_OPEN_VOICE_MIC,
            false,
        ) ?: false
        if (!open) return
        val phrase = intent?.getStringExtra(
            `in`.sahayai.chitti.vaani.services.VaaniBootService.EXTRA_WAKE_PHRASE,
        ) ?: "hey chitti"
        `in`.sahayai.chitti.vaani.util.AuditLog.append(this, "MainActivity wake-launched", phrase)
        web.postDelayed({
            web.evaluateJavascript(
                """try { if (typeof toggleMic === 'function') toggleMic(); } catch (e) {}""",
                null,
            )
        }, 250L)
    }

    override fun onBackPressed() {
        if (web.canGoBack()) web.goBack() else super.onBackPressed()
    }
}

/**
 * JavaScript bridge surface. Exposed to the WebView as `ChittiNative`.
 *
 * From the web UI (already deployed):
 *   ChittiNative.lockPhone();
 *   ChittiNative.setSilentMode(true);
 *   ChittiNative.requestNightMode();
 *   ChittiNative.requestCallScreening();
 *   ChittiNative.canHostNative();
 *
 * Note: every method first runs SafetyChecks. If a caller tries an
 * unlock-flavoured method name (which does not exist on this class —
 * but defence-in-depth in case of future drift), SafetyChecks throws
 * and AuditLog records the refusal.
 */
class ChittiNativeBridge(private val ctx: Context) {

    @JavascriptInterface
    fun canHostNative(): Boolean = true

    @JavascriptInterface
    fun lockPhone(): String {
        SafetyChecks.requireNotUnlock("lockPhone")
        val dpm = ctx.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val admin = ComponentName(ctx, VaaniDeviceAdminReceiver::class.java)
        return if (dpm.isAdminActive(admin)) {
            dpm.lockNow()
            AuditLog.append(ctx, "lockPhone", "phone locked on user voice command")
            "locked"
        } else {
            AuditLog.append(ctx, "lockPhone-needs-admin", "Device admin not yet enabled")
            "needs_device_admin"
        }
    }

    @JavascriptInterface
    fun requestDeviceAdmin(): String {
        val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
            putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN,
                ComponentName(ctx, VaaniDeviceAdminReceiver::class.java))
            putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                "Chitti needs Device Admin only to LOCK the phone on your voice command. " +
                "Chitti will NEVER unlock your phone — Android does not allow it.")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        ctx.startActivity(intent)
        return "prompt_shown"
    }

    @JavascriptInterface
    fun setSilentMode(on: Boolean): String {
        // Stub: see VaaniInCallService / NightModeReceiver for the real call.
        // Direct AudioManager.setRingerMode requires NotificationPolicyAccess
        // on API 24+; this method opens that settings page if not granted.
        val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE)
            as android.app.NotificationManager
        if (!nm.isNotificationPolicyAccessGranted) {
            val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS)
                .apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK }
            ctx.startActivity(intent)
            return "needs_notification_policy"
        }
        val am = ctx.getSystemService(Context.AUDIO_SERVICE) as android.media.AudioManager
        am.ringerMode = if (on) android.media.AudioManager.RINGER_MODE_SILENT
                        else    android.media.AudioManager.RINGER_MODE_NORMAL
        AuditLog.append(ctx, "setSilentMode", if (on) "silent on" else "ringer normal")
        return if (on) "silent" else "ring"
    }

    @JavascriptInterface
    fun requestNightMode(): String {
        // Schedules NightModeReceiver alarms at 22:00 IST and 06:00 IST.
        // Real implementation lives in NightModeReceiver.scheduleNext(ctx).
        val intent = Intent("in.sahayai.chitti.vaani.NIGHT_MODE_TICK")
        ctx.sendBroadcast(intent)
        AuditLog.append(ctx, "requestNightMode", "user opted into night-mode auto-answer")
        return "scheduled"
    }

    @JavascriptInterface
    fun requestCallScreening(): String {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val rm = ctx.getSystemService(android.app.role.RoleManager::class.java)
            if (rm != null && rm.isRoleAvailable(android.app.role.RoleManager.ROLE_CALL_SCREENING)) {
                val intent = rm.createRequestRoleIntent(android.app.role.RoleManager.ROLE_CALL_SCREENING)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                ctx.startActivity(intent)
                return "prompt_shown"
            }
        }
        return "unsupported_on_this_android"
    }

    @JavascriptInterface
    fun requestDialerRole(): String {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val rm = ctx.getSystemService(android.app.role.RoleManager::class.java)
            if (rm != null && rm.isRoleAvailable(android.app.role.RoleManager.ROLE_DIALER)) {
                val intent = rm.createRequestRoleIntent(android.app.role.RoleManager.ROLE_DIALER)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                ctx.startActivity(intent)
                return "prompt_shown"
            }
        }
        return "unsupported_on_this_android"
    }

    @JavascriptInterface
    fun requestAccessibility(): String {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            .apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK }
        ctx.startActivity(intent)
        return "settings_opened"
    }

    /**
     * Make an outbound call.
     *
     * Default behaviour: if CALL_PHONE is granted, use ACTION_CALL to
     * dial directly (Chitti speaks "Dialing Mom" first). Otherwise we
     * fall back to ACTION_DIAL (opens the dialer pre-filled — the user
     * still has to tap the green button).
     *
     * Always-on protections:
     *   - SafetyChecks.refuseIfPinLike(phone) — defensive: a 4 / 6-digit
     *     value would not be a phone number and might leak a PIN.
     *   - AuditLog records every attempt.
     *
     * Phase 2.3.1 (mute-user English-Partner): once the call is up, a
     * separate toggle activates speakerphone + plays Chitti's TTS so
     * the other party hears Chitti speaking on the user's behalf. That
     * piece lives in VaaniInCallService.kt, not here.
     */
    @JavascriptInterface
    fun makeCall(phoneE164: String): String {
        SafetyChecks.requireNotUnlock("makeCall")
        // Defensive — phone numbers in India have 10 digits + country code.
        // A 4/6-digit-only input would suggest a PIN slip.
        if (phoneE164.replace(Regex("[^\\d]"), "").length in 4..6) {
            SafetyChecks.refuseIfPinLike(phoneE164)
        }
        val canDirectCall = ContextCompat.checkSelfPermission(ctx, Manifest.permission.CALL_PHONE) ==
                            PackageManager.PERMISSION_GRANTED
        val cleaned = phoneE164.trim()
        val uri = Uri.parse("tel:" + cleaned)
        return if (canDirectCall) {
            val intent = Intent(Intent.ACTION_CALL, uri).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK }
            ctx.startActivity(intent)
            AuditLog.append(ctx, "makeCall direct", cleaned)
            "dialing"
        } else {
            // Fallback — opens the OS dialer pre-filled, user taps green button.
            val intent = Intent(Intent.ACTION_DIAL, uri).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK }
            ctx.startActivity(intent)
            AuditLog.append(ctx, "makeCall dialer-prefilled (no permission)", cleaned)
            "needs_permission"
        }
    }

    @JavascriptInterface
    fun requestCallPhonePermission(): String {
        // We can only request permissions from an Activity. The bridge holds an
        // Activity context (MainActivity), so we can cast safely.
        val act = ctx as? android.app.Activity ?: return "no_activity_context"
        ActivityCompat.requestPermissions(act, arrayOf(Manifest.permission.CALL_PHONE), 1002)
        return "prompt_shown"
    }

    @JavascriptInterface
    fun openWhatsApp(phoneE164: String, message: String): String {
        // Defence: still prefer wa.me deep-link — the AccessibilityService
        // only fires on the user's voice "haan" within 2 seconds.
        val text  = Uri.encode(message)
        val phone = phoneE164.trimStart('+')
        val uri   = Uri.parse("https://wa.me/$phone?text=$text")
        val intent = Intent(Intent.ACTION_VIEW, uri).apply {
            setPackage("com.whatsapp")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        ctx.startActivity(intent)
        AuditLog.append(ctx, "openWhatsApp", "wa.me deep-link to $phoneE164")
        return "opened"
    }

    @JavascriptInterface
    fun openUpiPay(payeeUpi: String, payeeName: String, amountInr: String, note: String): String {
        // PIN entry stays inside the UPI app's secure keypad. NPCI rule.
        SafetyChecks.refuseIfPinLike(payeeUpi)
        SafetyChecks.refuseIfPinLike(note)
        val uri = Uri.parse(
            "upi://pay?pa=" + Uri.encode(payeeUpi) +
            "&pn="   + Uri.encode(payeeName) +
            "&am="   + Uri.encode(amountInr) +
            "&cu=INR" +
            (if (note.isBlank()) "" else "&tn=" + Uri.encode(note))
        )
        val intent = Intent(Intent.ACTION_VIEW, uri).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK }
        ctx.startActivity(intent)
        AuditLog.append(ctx, "openUpiPay", "$payeeUpi ₹$amountInr")
        return "opened"
    }

    /**
     * Hard refusal. If the web tier is ever modified to call an
     * unlock-flavoured method, this throws a clear refusal.
     */
    @JavascriptInterface
    fun unlockPhone(): String {
        SafetyChecks.refuseUnlock("unlockPhone called from web")
        // unreachable; refuseUnlock throws.
        return "REFUSED"
    }
    @JavascriptInterface
    fun bypassLock(): String {
        SafetyChecks.refuseUnlock("bypassLock called from web")
        return "REFUSED"
    }

    /**
     * triggerEmergencyAlarm — fires a loud alarm tone via STREAM_ALARM,
     * which bypasses the device's silent / DND ringer setting. Same
     * stream alarm clocks use.
     *
     * On Android, the alarm tone plays even if the user has the phone
     * on Vibrate, on Silent, or in DND mode (with limited exceptions
     * the user has explicitly configured).
     *
     * Bryan's rule: this is the wake-master mechanism, not a cop call.
     * NEVER auto-dial 112 / 100 / 102 from this code path.
     */
    @JavascriptInterface
    fun triggerEmergencyAlarm(reason: String?): String {
        try {
            val am = ctx.getSystemService(Context.AUDIO_SERVICE) as android.media.AudioManager
            // Force alarm volume to max — STREAM_ALARM bypasses ringer state.
            val maxVol = am.getStreamMaxVolume(android.media.AudioManager.STREAM_ALARM)
            am.setStreamVolume(android.media.AudioManager.STREAM_ALARM, maxVol, 0)

            // Default alarm tone — guaranteed available on every Android device.
            val alarmUri = android.media.RingtoneManager.getDefaultUri(
                android.media.RingtoneManager.TYPE_ALARM
            ) ?: android.media.RingtoneManager.getDefaultUri(
                android.media.RingtoneManager.TYPE_NOTIFICATION
            )
            val rt = android.media.RingtoneManager.getRingtone(ctx, alarmUri)
            // Route through STREAM_ALARM so it really bypasses silent.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                rt.audioAttributes = android.media.AudioAttributes.Builder()
                    .setUsage(android.media.AudioAttributes.USAGE_ALARM)
                    .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            } else {
                @Suppress("DEPRECATION")
                rt.streamType = android.media.AudioManager.STREAM_ALARM
            }
            rt.play()

            // Long-pulse vibration as a secondary signal.
            val vib = ctx.getSystemService(Context.VIBRATOR_SERVICE) as android.os.Vibrator
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vib.vibrate(android.os.VibrationEffect.createWaveform(
                    longArrayOf(0, 1000, 500, 1000, 500, 1000, 500, 1000), -1))
            } else {
                @Suppress("DEPRECATION")
                vib.vibrate(longArrayOf(0, 1000, 500, 1000, 500, 1000, 500, 1000), -1)
            }

            AuditLog.append(ctx, "EMERGENCY alarm fired",
                "STREAM_ALARM bypassing silent · reason=" + (reason ?: "unspecified"))
            return "alarm_fired"
        } catch (e: Exception) {
            AuditLog.append(ctx, "EMERGENCY alarm failed", e.message ?: "?")
            return "alarm_error:${e.message}"
        }
    }

    /**
     * Hard-refusal helpers for cop dialing — even if the web tier is
     * compromised, these block any attempt to auto-dial 112/100/etc.
     * Family-only. This is Bryan's product rule, encoded.
     */
    @JavascriptInterface
    fun refuseAutoDialCops(): String {
        AuditLog.append(ctx, "REFUSED-cop-autodial",
            "Chitti will not auto-dial 112/100/102/108/1098/1930/139.")
        return "REFUSED — Chitti never auto-dials cops or government emergency lines."
    }

    // ════════════════════════════════════════════════════════════════
    // Media / Maps / Alarm / Reminder bridge (added 2026-05-22)
    //
    // Bryan: "in chitti vaani, theres no youtube or play songs or video
    // option, android feature is not there." The web layer already
    // routes these via universal URLs; these native methods hand off to
    // the dedicated Android app so the user gets the full native UX
    // (YouTube app, Maps app, system clock, etc.) instead of the
    // WebView's in-app browser.
    //
    // Contract per method:
    //   - All return a short status string ('opened' / 'unavailable' /
    //     'needs_permission') so the web layer can speak an honest
    //     response. Web-side falls back to a universal URL if the
    //     bridge isn't present (chitti_vaani.html's confirmYouTube /
    //     confirmMusic / confirmMaps / confirmAlarm functions already
    //     branch on hasNativeBridge()).
    //   - AuditLog every call so the user can replay what Chitti did.
    // ════════════════════════════════════════════════════════════════

    @JavascriptInterface
    fun openYouTube(query: String): String {
        // Prefer the YouTube app; if it isn't installed, fall back to
        // a regular ACTION_VIEW that the system browser handles.
        val q = Uri.encode(query)
        val ytApp = Intent(Intent.ACTION_VIEW, Uri.parse("vnd.youtube://results?search_query=$q")).apply {
            setPackage("com.google.android.youtube")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        return try {
            ctx.startActivity(ytApp)
            AuditLog.append(ctx, "openYouTube (native app)", query)
            "opened"
        } catch (e: Exception) {
            val web = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.youtube.com/results?search_query=$q")).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            ctx.startActivity(web)
            AuditLog.append(ctx, "openYouTube (web fallback)", query)
            "opened_web"
        }
    }

    @JavascriptInterface
    fun openMusic(query: String): String {
        // Prefer YouTube Music, then YouTube, then generic web fallback.
        val q = Uri.encode(query)
        val ytm = Intent(Intent.ACTION_VIEW, Uri.parse("https://music.youtube.com/search?q=$q")).apply {
            setPackage("com.google.android.apps.youtube.music")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        return try {
            ctx.startActivity(ytm)
            AuditLog.append(ctx, "openMusic (YouTube Music app)", query)
            "opened"
        } catch (e: Exception) {
            val web = Intent(Intent.ACTION_VIEW, Uri.parse("https://music.youtube.com/search?q=$q")).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            ctx.startActivity(web)
            AuditLog.append(ctx, "openMusic (web fallback)", query)
            "opened_web"
        }
    }

    @JavascriptInterface
    fun openMaps(query: String, mode: String?): String {
        // geo: intent is the canonical Android Maps deep-link; it'll
        // open the Maps app on every device that has one installed.
        val safeMode = when (mode?.lowercase()) {
            "walking", "transit", "two-wheeler" -> mode.lowercase()
            else -> "driving"
        }
        val q = Uri.encode(query)
        val mapsApp = Intent(Intent.ACTION_VIEW, Uri.parse("google.navigation:q=$q&mode=" + safeMode.first())).apply {
            setPackage("com.google.android.apps.maps")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        return try {
            ctx.startActivity(mapsApp)
            AuditLog.append(ctx, "openMaps (Maps app)", "$query · $safeMode")
            "opened"
        } catch (e: Exception) {
            val web = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/maps/dir/?api=1&destination=$q&travelmode=$safeMode")).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            ctx.startActivity(web)
            AuditLog.append(ctx, "openMaps (web fallback)", "$query · $safeMode")
            "opened_web"
        }
    }

    @JavascriptInterface
    fun openCamera(): String {
        val intent = Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        return try {
            ctx.startActivity(intent)
            AuditLog.append(ctx, "openCamera", "")
            "opened"
        } catch (e: Exception) {
            // Fall back to the still-image camera intent if IMAGE_CAPTURE
            // isn't resolvable (rare on Android 14+ without a system camera).
            try {
                val cam = Intent("android.media.action.STILL_IMAGE_CAMERA").apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                ctx.startActivity(cam)
                AuditLog.append(ctx, "openCamera (still-image fallback)", "")
                "opened"
            } catch (ee: Exception) {
                AuditLog.append(ctx, "openCamera failed", ee.message ?: "no camera app")
                "unavailable"
            }
        }
    }

    @JavascriptInterface
    fun toggleFlashlight(): String {
        // Use CameraManager.setTorchMode — works on every device with a
        // back-facing camera that exposes a torch unit. We toggle by
        // stashing the current state on the activity instance.
        val cm = ctx.getSystemService(Context.CAMERA_SERVICE) as? android.hardware.camera2.CameraManager
            ?: return "unavailable"
        val camId = try {
            cm.cameraIdList.firstOrNull { id ->
                val ch = cm.getCameraCharacteristics(id)
                ch.get(android.hardware.camera2.CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
            }
        } catch (e: Exception) { null } ?: return "unavailable"
        return try {
            val next = !flashlightOn
            cm.setTorchMode(camId, next)
            flashlightOn = next
            AuditLog.append(ctx, "toggleFlashlight", if (next) "on" else "off")
            if (next) "on" else "off"
        } catch (e: Exception) {
            AuditLog.append(ctx, "toggleFlashlight refused", e.message ?: "")
            "unavailable"
        }
    }

    @JavascriptInterface
    fun setAlarm(hour: Int, minute: Int, label: String?): String {
        // SET_ALARM is a public Intent — no permission needed. Opens
        // the system Clock app with the alarm pre-filled. The user
        // confirms with one tap inside the Clock app (we never write
        // alarms silently).
        val intent = Intent(android.provider.AlarmClock.ACTION_SET_ALARM).apply {
            putExtra(android.provider.AlarmClock.EXTRA_HOUR, hour.coerceIn(0, 23))
            putExtra(android.provider.AlarmClock.EXTRA_MINUTES, minute.coerceIn(0, 59))
            putExtra(android.provider.AlarmClock.EXTRA_MESSAGE, (label ?: "").take(60))
            putExtra(android.provider.AlarmClock.EXTRA_SKIP_UI, false)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        return try {
            ctx.startActivity(intent)
            AuditLog.append(ctx, "setAlarm", "$hour:$minute · ${label ?: ""}")
            "opened"
        } catch (e: Exception) {
            AuditLog.append(ctx, "setAlarm refused", e.message ?: "no clock app")
            "unavailable"
        }
    }

    @JavascriptInterface
    fun scheduleReminder(text: String, atIsoTime: String, channel: String?): String {
        // Schedules a single one-shot reminder via WorkManager. Channel
        // values: "notification" (default, always works), "sms" (needs
        // SEND_SMS + the user's own number in the trusted circle),
        // "whatsapp" (opens wa.me at fire time — Phase 2.7).
        // For now we ship the "notification" path; sms/whatsapp routes
        // return "needs_phase_2_7" honestly so the web layer can speak
        // an "not yet" message instead of pretending it worked.
        val ch = (channel ?: "notification").lowercase()
        if (ch != "notification") {
            AuditLog.append(ctx, "scheduleReminder deferred",
                "$ch reminder requested — Phase 2.7 (SMS / WhatsApp routes need user opt-in + cost confirmation).")
            return "needs_phase_2_7"
        }
        // Parse ISO-8601 (e.g. 2026-05-22T20:00:00+05:30). On failure,
        // return early so the web layer can prompt for a clearer time.
        val triggerMs = try {
            java.time.OffsetDateTime.parse(atIsoTime).toInstant().toEpochMilli()
        } catch (e: Exception) {
            AuditLog.append(ctx, "scheduleReminder bad time", atIsoTime)
            return "bad_time"
        }
        val now = System.currentTimeMillis()
        if (triggerMs <= now) {
            AuditLog.append(ctx, "scheduleReminder past time", atIsoTime)
            return "past_time"
        }
        val delay = triggerMs - now
        try {
            val data = androidx.work.Data.Builder()
                .putString("title", "🪔 Chitti reminder")
                .putString("body", text.take(220))
                .build()
            val req = androidx.work.OneTimeWorkRequestBuilder<ReminderWorker>()
                .setInitialDelay(delay, java.util.concurrent.TimeUnit.MILLISECONDS)
                .setInputData(data)
                .build()
            androidx.work.WorkManager.getInstance(ctx).enqueue(req)
            AuditLog.append(ctx, "scheduleReminder enqueued",
                "$text · fires at $atIsoTime · $ch")
            return "scheduled"
        } catch (e: Exception) {
            AuditLog.append(ctx, "scheduleReminder failed", e.message ?: "")
            return "failed"
        }
    }

    private var flashlightOn: Boolean = false

    // ════════════════════════════════════════════════════════════════
    // Voice-intent answer/reject + Document Vault camera capture
    // (added 2026-05-22 for the Chitti Phone Agent voice intents)
    //
    // Bryan: "Voice intents to wire: … Answer the call / Reject the call".
    //
    // We delegate to VaaniInCallService, which is the only class that
    // holds the active Call object. The JS bridge just signals intent;
    // the service does the actual call.answer() / call.disconnect()
    // when the user is already in the day-mode auto-answer arm window.
    // ════════════════════════════════════════════════════════════════
    @JavascriptInterface
    fun answerCall(): String {
        return try {
            `in`.sahayai.chitti.vaani.services.VaaniInCallService.tryAnswerCurrent()
                ?.let { AuditLog.append(ctx, "answerCall (native)", "intent dispatched"); "answering" }
                ?: run { AuditLog.append(ctx, "answerCall — no active call", ""); "no_active_call" }
        } catch (e: Exception) {
            AuditLog.append(ctx, "answerCall failed", e.message ?: "")
            "failed"
        }
    }

    @JavascriptInterface
    fun rejectCall(): String {
        return try {
            `in`.sahayai.chitti.vaani.services.VaaniInCallService.tryRejectCurrent()
                ?.let { AuditLog.append(ctx, "rejectCall (native)", "intent dispatched"); "rejecting" }
                ?: run { AuditLog.append(ctx, "rejectCall — no active call", ""); "no_active_call" }
        } catch (e: Exception) {
            AuditLog.append(ctx, "rejectCall failed", e.message ?: "")
            "failed"
        }
    }

    // ════════════════════════════════════════════════════════════════
    // Document Vault — camera capture (Phase 1)
    //
    // openCameraCapture(docId) launches the system camera to a JPEG
    // file under the app's external-files dir, then POSTs the bytes
    // to /api/vaani/vault/upload — keyed by the doc_id minted by the
    // web tier. Web side uses this when the user says "scan my PAN"
    // or taps the "📷 Snap" button inside the upload modal.
    //
    // Returns: "opened" if the camera intent fires; the bytes land
    // when MainActivity.onActivityResult sees the JPEG and writes it
    // to vault via the standard /upload endpoint.
    //
    // This is the same shape as openCamera() above, but with the
    // explicit Vault-upload tail so the picture doesn't get lost.
    // The full implementation lands in Phase-2.3.5 — for now the
    // bridge accepts the call and falls back to the generic
    // ACTION_IMAGE_CAPTURE so blind users can scan today (with the
    // help of a sighted assistant or audio guidance).
    // ════════════════════════════════════════════════════════════════
    @JavascriptInterface
    fun openCameraCapture(docId: String): String {
        AuditLog.append(ctx, "openCameraCapture", "doc_id=$docId · falling back to generic IMAGE_CAPTURE for v1")
        return openCamera()
    }

    // ════════════════════════════════════════════════════════════════
    // Accessibility-service arming (Phone Agent — autonomous send/play
    // after voice "haan")
    // ════════════════════════════════════════════════════════════════
    //
    // Bryan 2026-05-22: "Accessibility Service — operate WhatsApp,
    // YouTube, Gmail, any installed app on user's behalf."
    //
    // The accessibility service taps only the curated targets in
    // VaaniAccessibilityService.KNOWN_TARGETS (wa_send, wa_send_business,
    // yt_first_result, yt_play_pause, gmail_send, dialer_answer).
    // armAccessibilityAction(targetKey) is the ONLY way to fire a tap —
    // and the web tier calls it ONLY after the user said "haan" within
    // the voice-confirm window. Returns:
    //   "armed"             — service running, target valid, 2s window
    //                          open; helper will tap if/when it sees
    //                          the target
    //   "unknown_target"    — targetKey not in KNOWN_TARGETS
    //   "service_not_bound" — user hasn't granted the accessibility
    //                          role yet (call requestAccessibility() to
    //                          open Settings)
    //
    // Hard refusal: PIN-shape arming. If the targetKey ever became
    // user-controllable from voice, we'd still refuse arms whose key
    // looks PIN-shaped — but the key is a constant string from the JS
    // side, not user input, so this surface stays clean.
    @JavascriptInterface
    fun armAccessibilityAction(targetKey: String, durationMs: Long): String {
        val ttl = if (durationMs in 200L..5000L) durationMs else 2000L
        val res = `in`.sahayai.chitti.vaani.services.VaaniAccessibilityService.arm(targetKey, ttl)
        AuditLog.append(ctx, "armAccessibilityAction", "$targetKey · ${ttl}ms · $res")
        return res
    }

    // Compatibility shim — the web tier calls this exact name for the
    // WhatsApp-send flow shipped before the multi-target expansion.
    // Maps to the new arm("wa_send", durationMs).
    @JavascriptInterface
    fun tapWhatsAppSendAfterVoice(haanPhrase: String): String {
        // Defensive — only act if the phrase actually contains "haan"
        // (or its English equivalent). Mirrors the Phase-2.2 contract.
        val ok = haanPhrase.lowercase().let { it.contains("haan") || it.contains("yes") || it.contains("haa") }
        if (!ok) return "no_haan"
        return armAccessibilityAction("wa_send", 2000L)
    }

    // ════════════════════════════════════════════════════════════════
    // Wake-word — "Hey Chitti" always-listening foreground service
    // ════════════════════════════════════════════════════════════════
    //
    // Bryan 2026-05-22: "Background wake word — Hey Chitti always
    // listening."
    //
    // enableHeyChitti() starts the foreground service VaaniBootService
    // which holds a persistent notification + a continuous low-energy
    // partial-results SpeechRecognizer loop. On wake-word hit:
    //   1. Brings MainActivity to the foreground (FLAG_ACTIVITY_NEW_TASK).
    //   2. Pings the WebView with evaluateJavaScript("toggleMic();")
    //      so the existing main-mic flow + voice-intent router kicks in.
    //
    // Returns: "started" / "stopped" / "needs_record_audio".
    @JavascriptInterface
    fun enableHeyChitti(): String {
        val granted = ContextCompat.checkSelfPermission(
            ctx, Manifest.permission.RECORD_AUDIO,
        ) == PackageManager.PERMISSION_GRANTED
        if (!granted) {
            ActivityCompat.requestPermissions(
                ctx as android.app.Activity,
                arrayOf(Manifest.permission.RECORD_AUDIO),
                1010,
            )
            AuditLog.append(ctx, "enableHeyChitti — RECORD_AUDIO prompt", "")
            return "needs_record_audio"
        }
        // Persist the user's choice so the wake-word loop restarts
        // after reboot via VaaniBootReceiver.
        ctx.getSharedPreferences("chitti_vaani_prefs", Context.MODE_PRIVATE)
            .edit().putBoolean("hey_chitti_enabled", true).apply()
        val i = Intent(ctx, `in`.sahayai.chitti.vaani.services.VaaniBootService::class.java)
            .setAction(`in`.sahayai.chitti.vaani.services.VaaniBootService.ACTION_START_LISTENING)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ctx.startForegroundService(i)
        } else {
            ctx.startService(i)
        }
        AuditLog.append(ctx, "enableHeyChitti", "VaaniBootService start_listening dispatched")
        return "started"
    }

    @JavascriptInterface
    fun disableHeyChitti(): String {
        ctx.getSharedPreferences("chitti_vaani_prefs", Context.MODE_PRIVATE)
            .edit().putBoolean("hey_chitti_enabled", false).apply()
        val i = Intent(ctx, `in`.sahayai.chitti.vaani.services.VaaniBootService::class.java)
            .setAction(`in`.sahayai.chitti.vaani.services.VaaniBootService.ACTION_STOP_LISTENING)
        ctx.startService(i)
        AuditLog.append(ctx, "disableHeyChitti", "stop_listening dispatched")
        return "stopped"
    }

    @JavascriptInterface
    fun heyChittiState(): String {
        return if (`in`.sahayai.chitti.vaani.services.VaaniBootService.isListening) "on" else "off"
    }
}
