// World Class Chitti Vaani Android — Commando Discipline. Zero Excuses.
package `in`.sahayai.chitti.vaani.db

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * QueuedVoiceSample — Phase-2.5 federated learning queue.
 *
 * Rows are written when the user's voice interaction is captured with
 * explicit consent (opt-in flag `fedlearn_optin` = true). Rows are
 * deleted by FedLearningSyncWorker after a successful POST to
 * /api/vaani/voice/sample. Data never leaves the device until the user
 * has opted in AND the worker fires on an unmetered, non-roaming network.
 *
 * DPDP Act 2023 compliance: user_token is a per-device UUID — no PII.
 * audioBase64 is the raw voice sample; it is never uploaded if retryCount
 * exceeds MAX_RETRY (sample is dropped, not retried indefinitely).
 */
@Entity(tableName = "queued_voice_samples")
data class QueuedVoiceSample(
    @PrimaryKey
    val id: String,                       // UUID — generated at capture time
    val audioBase64: String,              // Base64-encoded WAV/Opus audio
    val transcript: String,               // What the user said (from STT)
    val language: String,                 // BCP-47 locale, e.g. "hi-IN", "ta-IN"
    val timestampMs: Long,                // Unix epoch milliseconds
    val retryCount: Int = 0,             // Incremented on each failed upload
)
