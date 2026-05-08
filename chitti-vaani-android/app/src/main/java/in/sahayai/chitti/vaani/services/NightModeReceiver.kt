package `in`.sahayai.chitti.vaani.services

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.icu.util.Calendar
import android.icu.util.TimeZone
import `in`.sahayai.chitti.vaani.util.AuditLog

/**
 * NightModeReceiver
 * -----------------
 * Schedules the night-mode boundary at 22:00 IST (start) and 06:00 IST
 * (end). When the start fires, sets a SharedPreferences flag that
 * VaaniCallScreeningService consults on each incoming call.
 *
 * Why a receiver + alarm and not just a time check at call time:
 *   - We want to cover sub-cases (e.g. user is travelling — phone clock
 *     might be in a different timezone but the user wants night-mode
 *     based on local IST). The alarm is set on whatever timezone the
 *     phone is currently in, so this naturally tracks travel.
 */
class NightModeReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            "android.intent.action.BOOT_COMPLETED" -> scheduleNext(context)
            "in.sahayai.chitti.vaani.NIGHT_MODE_TICK" -> {
                toggleNightModeIfBoundary(context)
                scheduleNext(context)
            }
        }
    }

    companion object {
        private const val PREFS = "chitti_vaani_state"
        private const val KEY_ACTIVE = "night_mode_active"

        fun isNightModeActive(ctx: Context): Boolean {
            val sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            // Direct check: hour-of-day in IST between 22 and 6.
            // Falls back to stored flag if we already toggled at the boundary.
            val cal = Calendar.getInstance(TimeZone.getTimeZone("Asia/Kolkata"))
            val h = cal.get(Calendar.HOUR_OF_DAY)
            val byClock = h >= 22 || h < 6
            val byFlag  = sp.getBoolean(KEY_ACTIVE, false)
            return byClock || byFlag
        }

        fun scheduleNext(ctx: Context) {
            val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent("in.sahayai.chitti.vaani.NIGHT_MODE_TICK")
                .setPackage(ctx.packageName)
            val pi = PendingIntent.getBroadcast(
                ctx, 100, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            // Fire at the next boundary (22:00 or 06:00 IST), whichever comes first.
            val cal = Calendar.getInstance(TimeZone.getTimeZone("Asia/Kolkata"))
            val now = cal.timeInMillis
            val targets = listOf(22 to 0, 6 to 0)
            var nextAt = Long.MAX_VALUE
            for ((h, m) in targets) {
                val c = Calendar.getInstance(TimeZone.getTimeZone("Asia/Kolkata"))
                c.set(Calendar.HOUR_OF_DAY, h); c.set(Calendar.MINUTE, m)
                c.set(Calendar.SECOND, 0);     c.set(Calendar.MILLISECOND, 0)
                if (c.timeInMillis <= now) c.add(Calendar.DAY_OF_YEAR, 1)
                if (c.timeInMillis < nextAt) nextAt = c.timeInMillis
            }
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, nextAt, pi)
        }
    }

    private fun toggleNightModeIfBoundary(ctx: Context) {
        val sp: SharedPreferences = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val cal = Calendar.getInstance(TimeZone.getTimeZone("Asia/Kolkata"))
        val h = cal.get(Calendar.HOUR_OF_DAY)
        val newActive = h >= 22 || h < 6
        sp.edit().putBoolean(KEY_ACTIVE, newActive).apply()
        AuditLog.append(ctx, "NightMode boundary",
            if (newActive) "entering night mode (22:00 IST)" else "leaving night mode (06:00 IST)")
    }
}
