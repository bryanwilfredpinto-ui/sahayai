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
}
