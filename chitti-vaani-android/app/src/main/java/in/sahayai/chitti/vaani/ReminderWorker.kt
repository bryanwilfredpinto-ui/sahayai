package `in`.sahayai.chitti.vaani

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import `in`.sahayai.chitti.vaani.util.AuditLog

/**
 * ReminderWorker — fires a one-shot system notification at the
 * scheduled time. Wired by MainActivity.scheduleReminder(text, atIsoTime,
 * channel="notification"). The worker is short-lived: post the
 * notification, log it, exit.
 *
 * Notification tap opens MainActivity (the Vaani web UI is the audit
 * surface), so the user can hear the full context aloud if they want.
 *
 * Channel id: "chitti_reminders" (priority HIGH — the user explicitly
 * asked for a reminder, so it should ping the lockscreen too).
 *
 * If POST_NOTIFICATIONS isn't granted (Android 13+), the worker logs
 * the miss honestly so the user can see why the reminder didn't fire
 * the next time they open Chitti.
 */
class ReminderWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {

    override suspend fun doWork(): Result {
        val ctx = applicationContext
        val title = inputData.getString("title") ?: "🪔 Chitti reminder"
        val body  = inputData.getString("body") ?: ""

        val mgr = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val ch = NotificationChannel(
                CHANNEL_ID,
                "Chitti Reminders",
                NotificationManager.IMPORTANCE_HIGH,
            ).apply {
                description = "Reminders scheduled via voice in Chitti Vaani"
                enableVibration(true)
            }
            mgr.createNotificationChannel(ch)
        }

        // Android 13+ — without POST_NOTIFICATIONS we can't fire; log
        // honestly instead of silently dropping.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                ctx, android.Manifest.permission.POST_NOTIFICATIONS,
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED
            if (!granted) {
                AuditLog.append(ctx, "Reminder skipped (no POST_NOTIFICATIONS)", body.take(80))
                return Result.success()
            }
        }

        val tapIntent = Intent(ctx, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            ctx,
            0,
            tapIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )

        val notif = NotificationCompat.Builder(ctx, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        mgr.notify((System.currentTimeMillis() % Int.MAX_VALUE).toInt(), notif)
        AuditLog.append(ctx, "Reminder fired", body.take(120))
        return Result.success()
    }

    companion object {
        const val CHANNEL_ID = "chitti_reminders"
    }
}
