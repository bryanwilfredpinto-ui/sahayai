package `in`.sahayai.chitti.vaani.services

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import `in`.sahayai.chitti.vaani.util.AuditLog

/**
 * VaaniBootReceiver — restarts the Hey-Chitti wake-word loop after a
 * reboot if the user had it enabled before the device shut down.
 *
 * Bryan 2026-05-22 — wake word must keep working across reboots, not
 * just within a single app session.
 *
 * State lives in SharedPreferences "chitti_vaani_prefs"
 *   key: hey_chitti_enabled  type: Boolean
 *
 * The flag is written by MainActivity.enableHeyChitti / disableHeyChitti.
 * If the flag is true and we have RECORD_AUDIO at boot time, we kick
 * VaaniBootService into listening mode immediately. Otherwise we stay
 * quiet — the user can re-enable from the app.
 */
class VaaniBootReceiver : BroadcastReceiver() {

    override fun onReceive(ctx: Context, intent: Intent) {
        val action = intent.action ?: return
        if (action != Intent.ACTION_BOOT_COMPLETED &&
            action != "android.intent.action.QUICKBOOT_POWERON" &&
            action != Intent.ACTION_LOCKED_BOOT_COMPLETED) return

        val prefs: SharedPreferences = ctx.getSharedPreferences("chitti_vaani_prefs", Context.MODE_PRIVATE)
        val enabled = prefs.getBoolean("hey_chitti_enabled", false)
        if (!enabled) return

        AuditLog.append(ctx, "VaaniBootReceiver", "boot — restarting Hey Chitti")
        val svc = Intent(ctx, VaaniBootService::class.java)
            .setAction(VaaniBootService.ACTION_START_LISTENING)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try { ctx.startForegroundService(svc) }
            catch (e: Exception) { AuditLog.append(ctx, "VaaniBootReceiver start_foreground failed", e.message ?: "") }
        } else {
            ctx.startService(svc)
        }
    }
}
