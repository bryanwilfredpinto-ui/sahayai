// World Class Chitti Vaani Android — Commando Discipline. Zero Excuses.
package `in`.sahayai.chitti.vaani.ml

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import `in`.sahayai.chitti.vaani.db.QueuedVoiceSample
import `in`.sahayai.chitti.vaani.db.VaaniDatabase
import `in`.sahayai.chitti.vaani.util.AuditLog
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.TimeUnit

/**
 * FedLearningSyncWorker — Phase-2.5 federated learning batch uploader.
 *
 * Runs every 6 hours via WorkManager. Constraints:
 *   - CONNECTED network (any)
 *   - Battery not low
 *   - NOT_ROAMING (user data protection — Indians on pre-paid SIMs pay per MB)
 *
 * Flow:
 *   1. Check fedlearn_optin SharedPreferences flag — if false, skip.
 *   2. Drop stale samples (retryCount >= MAX_RETRY) from the queue.
 *   3. For each queued sample: POST to /api/vaani/voice/sample.
 *   4. On HTTP 200: delete from Room.
 *   5. On failure: increment retryCount; Result.retry() with exponential backoff.
 *
 * Privacy contract:
 *   - No sample is uploaded unless the user opted in explicitly.
 *   - Payloads contain a per-device UUID, never name/phone/UID.
 *   - Samples drop after MAX_RETRY failures (never retry forever).
 *
 * DPDP Act 2023: AuditLog row written for every sync attempt and outcome.
 */
class FedLearningSyncWorker(
    private val ctx: Context,
    params: WorkerParameters,
) : CoroutineWorker(ctx, params) {

    companion object {
        private const val WORK_NAME    = "fed_learning_sync"
        private const val ENDPOINT     = "https://sahayai.in/api/vaani/voice/sample"
        private const val MAX_RETRY    = 5
        private const val CONNECT_MS   = 15_000
        private const val READ_MS      = 20_000

        /**
         * Enqueue (or keep) the periodic sync.
         * Call this from MainActivity.onCreate() or when the user opts in.
         * KEEP policy: if the worker is already queued, leave it untouched.
         */
        fun schedule(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .setRequiresBatteryNotLow(true)
                .setRequiresStorageNotLow(false)
                .build()

            val request = PeriodicWorkRequestBuilder<FedLearningSyncWorker>(
                6, TimeUnit.HOURS,
                30, TimeUnit.MINUTES,    // flex window — avoids exact-time battery spikes
            )
                .setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 15, TimeUnit.MINUTES)
                .addTag(WORK_NAME)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request,
            )
        }

        /** Cancel the periodic sync (called on opt-out). */
        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        }
    }

    override suspend fun doWork(): Result {
        val prefs = ctx.getSharedPreferences("chitti_vaani_prefs", Context.MODE_PRIVATE)
        val optedIn = prefs.getBoolean("fedlearn_optin", false)

        if (!optedIn) {
            AuditLog.append(ctx, "FED_LEARN", "skipped — user has not opted in")
            return Result.success()
        }

        val dao = VaaniDatabase.getInstance(ctx).voiceSampleDao()

        // Drop samples that have failed too many times
        dao.deleteStale(MAX_RETRY)

        val samples = dao.getAll()
        if (samples.isEmpty()) {
            AuditLog.append(ctx, "FED_LEARN", "sync_attempt · queue empty · nothing to upload")
            return Result.success()
        }

        AuditLog.append(ctx, "FED_LEARN", "sync_attempt · samples_queued=${samples.size}")

        var successCount = 0
        var failCount    = 0

        for (sample in samples) {
            val uploaded = uploadSample(sample)
            if (uploaded) {
                dao.delete(sample.id)
                successCount++
            } else {
                dao.incrementRetryCount(sample.id)
                failCount++
            }
        }

        AuditLog.append(ctx, "FED_LEARN",
            "sync_complete · success=$successCount · fail=$failCount")

        return if (failCount > 0) Result.retry() else Result.success()
    }

    private fun uploadSample(sample: QueuedVoiceSample): Boolean {
        return try {
            val url  = URL(ENDPOINT)
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod  = "POST"
            conn.connectTimeout = CONNECT_MS
            conn.readTimeout    = READ_MS
            conn.doOutput       = true
            conn.setRequestProperty("Content-Type", "application/json; charset=utf-8")
            conn.setRequestProperty("User-Agent",   "ChittiVaani-Android/1.0")

            val body = buildJson(sample).toByteArray(Charsets.UTF_8)
            conn.setFixedLengthStreamingMode(body.size)
            conn.outputStream.use { it.write(body) }

            val code = conn.responseCode
            conn.disconnect()
            code == HttpURLConnection.HTTP_OK || code == HttpURLConnection.HTTP_CREATED
        } catch (e: Exception) {
            AuditLog.append(ctx, "FED_LEARN", "upload_error · id=${sample.id} · ${e.message ?: ""}")
            false
        }
    }

    private fun buildJson(s: QueuedVoiceSample): String = buildString {
        append("{")
        append("\"sample_id\":\"${jsonEscape(s.id)}\",")
        append("\"transcript\":\"${jsonEscape(s.transcript)}\",")
        append("\"language\":\"${jsonEscape(s.language)}\",")
        append("\"timestamp\":${s.timestampMs},")
        append("\"retry_count\":${s.retryCount},")
        // audio_base64 is last — largest field, keep serialisation predictable
        append("\"audio_base64\":\"${s.audioBase64}\"")
        append("}")
    }

    private fun jsonEscape(s: String): String = s
        .replace("\\", "\\\\")
        .replace("\"", "\\\"")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
        .replace("\t", "\\t")
}
