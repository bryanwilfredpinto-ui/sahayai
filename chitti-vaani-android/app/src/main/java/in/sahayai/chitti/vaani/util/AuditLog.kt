package `in`.sahayai.chitti.vaani.util

import android.content.Context
import android.util.Log
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Append-only on-device audit log.
 *
 * DPDP Act 2023 requires a tamper-evident record of every action Chitti
 * takes on the user's behalf. Stored in app-private storage; never sent
 * to a server unless the user explicitly exports it.
 */
object AuditLog {

    private const val TAG = "ChittiAudit"
    private const val FILE = "vaani_audit.log"
    private val df = SimpleDateFormat("yyyy-MM-dd HH:mm:ss z", Locale.US)
    private var FALLBACK_CTX: Context? = null

    fun init(ctx: Context) { FALLBACK_CTX = ctx.applicationContext }

    fun append(ctx: Context, verb: String, detail: String) {
        val line = "${df.format(Date())} | $verb | $detail\n"
        try {
            File(ctx.filesDir, FILE).appendText(line)
        } catch (e: Exception) {
            Log.w(TAG, "audit append failed", e)
        }
        Log.i(TAG, "$verb · $detail")
    }

    /** SafetyChecks calls this from contexts that don't have a Context handle. */
    fun appendStatic(verb: String, detail: String) {
        val ctx = FALLBACK_CTX
        if (ctx != null) append(ctx, verb, detail)
        else Log.i(TAG, "[no-ctx] $verb · $detail")
    }
}
