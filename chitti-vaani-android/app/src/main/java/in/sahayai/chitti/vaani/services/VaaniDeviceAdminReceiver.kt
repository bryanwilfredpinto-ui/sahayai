package `in`.sahayai.chitti.vaani.services

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import `in`.sahayai.chitti.vaani.util.AuditLog

/**
 * VaaniDeviceAdminReceiver
 * ------------------------
 * Required to call DevicePolicyManager.lockNow(). Declared in
 * AndroidManifest as a BIND_DEVICE_ADMIN receiver.
 *
 * NOTE: Android exposes lockNow() but does NOT expose any 3rd-party
 * unlock API. There is no method on this class to unlock; there is no
 * such method in DevicePolicyManager either. The hard refusal is
 * structural — the surface simply doesn't exist.
 */
class VaaniDeviceAdminReceiver : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        AuditLog.append(context, "DeviceAdmin enabled",
            "User granted Device Admin so Chitti can lock the phone on voice command")
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        AuditLog.append(context, "DeviceAdmin disabled",
            "User revoked Device Admin — lockPhone() will no longer work until re-enabled")
    }

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        return "Disabling Chitti as Device Admin will turn off 'Chitti, phone lock'. Are you sure?"
    }
}
