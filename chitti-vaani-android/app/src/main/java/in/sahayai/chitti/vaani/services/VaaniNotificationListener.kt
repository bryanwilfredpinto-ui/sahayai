package `in`.sahayai.chitti.vaani.services

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import `in`.sahayai.chitti.vaani.util.AuditLog

/**
 * VaaniNotificationListener — Phase 4.
 *
 * Caches the last few notifications (app · title · text) so the WebView's
 * ChittiNative.readNotifications() can read them aloud for blind / busy users
 * ("WhatsApp se Maa ka message: kab aaoge?"). Read-only: Chitti never dismisses
 * or acts on a notification on its own — the Golden Rule confirm gate (JS layer)
 * governs any follow-up action the user chooses.
 *
 * The user must explicitly enable this in Settings → Notification access; until
 * then the cache stays empty and readNotifications() returns "[]".
 */
class VaaniNotificationListener : NotificationListenerService() {

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        if (sbn == null) return
        try {
            val extras = sbn.notification?.extras ?: return
            val title = extras.getCharSequence("android.title")?.toString() ?: ""
            val text = extras.getCharSequence("android.text")?.toString() ?: ""
            if (title.isBlank() && text.isBlank()) return
            synchronized(CACHE) {
                CACHE.add(0, Triple(sbn.packageName ?: "", title, text.take(160)))
                while (CACHE.size > 5) CACHE.removeAt(CACHE.size - 1)
            }
        } catch (e: Exception) { /* honest skip */ }
    }

    companion object {
        private val CACHE = ArrayList<Triple<String, String, String>>()

        private fun esc(s: String): String =
            "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", " ") + "\""

        /** Last 5 cached notifications as a JSON array string. */
        fun lastFive(): String {
            synchronized(CACHE) {
                val sb = StringBuilder("[")
                CACHE.take(5).forEachIndexed { i, (app, title, text) ->
                    if (i > 0) sb.append(",")
                    sb.append("""{"app":${esc(app)},"title":${esc(title)},"text":${esc(text)}}""")
                }
                sb.append("]")
                return sb.toString()
            }
        }
    }
}
