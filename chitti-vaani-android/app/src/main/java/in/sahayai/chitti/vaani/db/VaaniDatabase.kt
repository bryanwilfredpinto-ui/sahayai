// World Class Chitti Vaani Android — Commando Discipline. Zero Excuses.
package `in`.sahayai.chitti.vaani.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

/**
 * VaaniDatabase — Phase-2.5 on-device Room database.
 *
 * Contains:
 *   - queued_voice_samples: federated-learning upload queue.
 *
 * Singleton pattern: getInstance() is the only way to obtain a reference.
 * Thread-safe via @Volatile + synchronized block.
 *
 * Schema version history:
 *   v1 (2026-06-12) — initial schema with queued_voice_samples.
 *
 * Migration policy: destructive re-create is acceptable for v1 → v2
 * because the queue is temporary upload storage — any data lost is
 * re-captured on the next voice interaction. If the schema grows to
 * hold user preferences or permanent records, add proper migrations.
 */
@Database(entities = [QueuedVoiceSample::class], version = 1, exportSchema = false)
abstract class VaaniDatabase : RoomDatabase() {

    abstract fun voiceSampleDao(): VoiceSampleDao

    companion object {
        @Volatile
        private var INSTANCE: VaaniDatabase? = null

        fun getInstance(context: Context): VaaniDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    VaaniDatabase::class.java,
                    "vaani_db",
                )
                    .fallbackToDestructiveMigration()   // safe for v1 queue data
                    .build()
                    .also { INSTANCE = it }
            }
        }
    }
}
