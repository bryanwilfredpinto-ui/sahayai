// World Class Chitti Vaani Android — Commando Discipline. Zero Excuses.
package `in`.sahayai.chitti.vaani.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

/**
 * VoiceSampleDao — Room DAO for queued_voice_samples.
 *
 * All operations are suspend functions so callers must run them inside
 * a coroutine (FedLearningSyncWorker uses CoroutineWorker which handles this).
 */
@Dao
interface VoiceSampleDao {

    /** Return all queued samples, oldest first. */
    @Query("SELECT * FROM queued_voice_samples ORDER BY timestampMs ASC")
    suspend fun getAll(): List<QueuedVoiceSample>

    /** Queue a new voice sample. IGNORE on conflict so duplicate IDs are safe. */
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insert(sample: QueuedVoiceSample)

    /** Delete a successfully uploaded sample by its UUID. */
    @Query("DELETE FROM queued_voice_samples WHERE id = :id")
    suspend fun delete(id: String)

    /** Count of samples currently queued. */
    @Query("SELECT COUNT(*) FROM queued_voice_samples")
    suspend fun getCount(): Int

    /** Increment retry count after a failed upload attempt. */
    @Query("UPDATE queued_voice_samples SET retryCount = retryCount + 1 WHERE id = :id")
    suspend fun incrementRetryCount(id: String)

    /**
     * Drop samples that have exceeded MAX_RETRY to prevent infinite
     * queue growth. Called by FedLearningSyncWorker before each sync.
     */
    @Query("DELETE FROM queued_voice_samples WHERE retryCount >= :maxRetry")
    suspend fun deleteStale(maxRetry: Int)
}
