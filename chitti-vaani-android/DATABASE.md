# DATABASE — Chitti Vaani Android client

## TL;DR — Current state

**There is no Room or SQLite database in the Android client today.** The skeleton at [`app/build.gradle.kts`](app/build.gradle.kts) does not declare `androidx.room:*` dependencies, no `@Entity` / `@Dao` / `@Database` annotations exist anywhere under [`app/src/main/java/`](app/src/main/java/), and no `*.db` files are bundled in assets.

All durable client-side state today lives in:

| Surface | Where | What it stores |
|---|---|---|
| WebView `localStorage` | `app/no_backup/WebView/Default/Local Storage/` (scoped to the WebView profile) | `user_token` UUID, language preference, trusted-circle contacts, recent conversation buffers |
| WebView `IndexedDB` | Same WebView profile | Federated voice-sample blobs (≤ user opt-in cap), queued emergency relay events, conversation history beyond what fits in `localStorage` |
| `SharedPreferences` (`chitti_vaani_state`) | App-private prefs file | `night_mode_active` boolean — read by [`NightModeReceiver.isNightModeActive()`](app/src/main/java/in/sahayai/chitti/vaani/services/NightModeReceiver.kt) |
| `filesDir/vaani_audit.log` | App-private internal storage | Append-only DPDP audit log written by [`AuditLog.append()`](app/src/main/java/in/sahayai/chitti/vaani/util/AuditLog.kt) |
| `filesDir/` (planned) | App-private | Vosk acoustic models for the on-device keyword spotter (Phase 2.4) — bundled via `app/src/main/assets/vosk/` |

This is **deliberate** for the skeleton. The Phase 2 spec only mandates Room once Phase 2.4 (offline emergency relay) and Phase 2.5 (federated voice-sample queue) require durable native-side storage that survives the WebView being paged out.

---

## Planned schema (Phase 2.4 → Phase 2.5)

Room 2.6+ with `kotlinx-coroutines` flows for live queries. Schema number starts at 1, migrations added as needed.

### Module layout (planned)

```
chitti-vaani-android/
└── data/room/                          ← future Gradle module :data:room
    └── src/main/java/in/sahayai/chitti/vaani/data/
        ├── VaaniDatabase.kt            @Database(entities = [...], version = 1)
        ├── entity/
        │   ├── ConversationTurn.kt
        │   ├── EmergencyContact.kt
        │   ├── PairedDevice.kt
        │   ├── QueuedRelayEvent.kt
        │   └── QueuedVoiceSample.kt
        ├── dao/
        │   ├── ConversationDao.kt
        │   ├── EmergencyContactDao.kt
        │   ├── PairedDeviceDao.kt
        │   ├── QueuedRelayDao.kt
        │   └── QueuedVoiceSampleDao.kt
        └── migration/
            └── (empty until v2)
```

### Table 1 — `conversation_history`

Mirrors a short rolling window of the most recent conversation turns. Used to give context to the always-on listener so it can resume a thread after the screen unlocks. **Not** a full transcript log — that stays in the WebView's IndexedDB which is the source of truth.

```kotlin
@Entity(tableName = "conversation_history",
        indices = [Index(value = ["created_at"])])
data class ConversationTurn(
    @PrimaryKey(autoGenerate = true) val id: Long = 0L,
    @ColumnInfo(name = "role")        val role: String,            // "user" | "chitti"
    @ColumnInfo(name = "text")        val text: String,            // ≤ 6000 chars
    @ColumnInfo(name = "language")    val language: String,        // ISO-639-1
    @ColumnInfo(name = "created_at")  val createdAt: Long          // epoch millis
)

@Dao
interface ConversationDao {
    @Insert suspend fun insert(turn: ConversationTurn): Long
    @Query("SELECT * FROM conversation_history ORDER BY created_at DESC LIMIT :limit")
    suspend fun recent(limit: Int = 20): List<ConversationTurn>
    @Query("DELETE FROM conversation_history WHERE created_at < :cutoffMillis")
    suspend fun pruneOlderThan(cutoffMillis: Long): Int
}
```

Retention: 7 days, pruned by `WorkManager` job daily. **Why on-device only:** DPDP Act 2023 — conversation content never crosses the network unless the user explicitly exports.

### Table 2 — `emergency_contacts`

Trusted-circle contacts the cascade dials in priority order. Sourced from the user's "Chitti's people" onboarding voice flow (web tier) plus optional `READ_CONTACTS` resolution.

```kotlin
@Entity(tableName = "emergency_contacts",
        indices = [Index(value = ["priority"]), Index(value = ["phone_e164"], unique = true)])
data class EmergencyContact(
    @PrimaryKey(autoGenerate = true) val id: Long = 0L,
    @ColumnInfo(name = "label")       val label: String,           // "Mom" / "Anil (son)"
    @ColumnInfo(name = "phone_e164")  val phoneE164: String,       // +91XXXXXXXXXX, validated
    @ColumnInfo(name = "priority")    val priority: Int,           // 0 = call first
    @ColumnInfo(name = "is_spouse")   val isSpouse: Boolean = false,
    @ColumnInfo(name = "consented_at") val consentedAt: Long,      // when contact gave verbal consent
    @ColumnInfo(name = "updated_at")  val updatedAt: Long
)

@Dao
interface EmergencyContactDao {
    @Query("SELECT * FROM emergency_contacts ORDER BY priority ASC")
    suspend fun all(): List<EmergencyContact>
    @Query("SELECT * FROM emergency_contacts ORDER BY priority ASC LIMIT 1")
    suspend fun first(): EmergencyContact?
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun upsert(c: EmergencyContact): Long
    @Delete suspend fun delete(c: EmergencyContact)
}
```

**Validation invariant:** every insert must run [`SafetyChecks.refuseIfPinLike(phoneE164)`](app/src/main/java/in/sahayai/chitti/vaani/util/SafetyChecks.kt) — a 4/6-digit value here would be a PIN slip and is rejected.

### Table 3 — `paired_devices`

Mirrors the backend's `/api/vaani/emergency/pair/list` so the cascade can fan out via FCM even when offline.

```kotlin
@Entity(tableName = "paired_devices",
        indices = [Index(value = ["partner_token"], unique = true)])
data class PairedDevice(
    @PrimaryKey(autoGenerate = true) val id: Long = 0L,
    @ColumnInfo(name = "partner_token") val partnerToken: String,  // backend-issued opaque
    @ColumnInfo(name = "partner_label") val partnerLabel: String,  // "Anil (son)"
    @ColumnInfo(name = "since")         val since: Long,           // epoch seconds
    @ColumnInfo(name = "last_seen")     val lastSeen: Long? = null,
    @ColumnInfo(name = "fcm_token")     val fcmToken: String? = null
)

@Dao
interface PairedDeviceDao {
    @Query("SELECT * FROM paired_devices ORDER BY since DESC")
    suspend fun all(): List<PairedDevice>
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun upsert(p: PairedDevice): Long
    @Query("DELETE FROM paired_devices WHERE partner_token = :token") suspend fun unpair(token: String)
    @Query("UPDATE paired_devices SET last_seen = :ts WHERE partner_token = :token")
    suspend fun touch(token: String, ts: Long)
}
```

Sync strategy: refreshed on every successful `GET /api/vaani/emergency/pair/list` (called from the WebView; native side reads the table for the FCM fanout).

### Table 4 — `queued_relay_events`

Inbound emergency relay events that arrived via FCM **while the WebView was paused** (or before the user had granted notification access). The native listener queues them here, and the WebView drains them on next foreground.

```kotlin
@Entity(tableName = "queued_relay_events",
        indices = [Index(value = ["received_at"])])
data class QueuedRelayEvent(
    @PrimaryKey(autoGenerate = true) val id: Long = 0L,
    @ColumnInfo(name = "from_partner_token") val fromPartnerToken: String,
    @ColumnInfo(name = "kind")               val kind: String,          // "emergency" | "emergency_check_in"
    @ColumnInfo(name = "payload_json")       val payloadJson: String,   // raw payload, server-issued
    @ColumnInfo(name = "received_at")        val receivedAt: Long,
    @ColumnInfo(name = "delivered_to_web_at") val deliveredToWebAt: Long? = null
)

@Dao
interface QueuedRelayDao {
    @Insert suspend fun enqueue(e: QueuedRelayEvent): Long
    @Query("SELECT * FROM queued_relay_events WHERE delivered_to_web_at IS NULL ORDER BY received_at ASC")
    suspend fun pending(): List<QueuedRelayEvent>
    @Query("UPDATE queued_relay_events SET delivered_to_web_at = :ts WHERE id IN (:ids)")
    suspend fun markDelivered(ids: List<Long>, ts: Long): Int
}
```

### Table 5 — `queued_voice_samples` (Phase 2.5)

For the federated-learning upload pipeline. Voice samples are recorded by the WebView's `MediaRecorder` and exported as small Opus blobs; the native `FedLearningSyncWorker` (WorkManager, planned) batches them and POSTs to `/api/vaani/voice/sample` (backend endpoint **TBD** — see [API.md](API.md#native-calls-planned--not-implemented-yet)).

```kotlin
@Entity(tableName = "queued_voice_samples",
        indices = [Index(value = ["queued_at"])])
data class QueuedVoiceSample(
    @PrimaryKey(autoGenerate = true) val id: Long = 0L,
    @ColumnInfo(name = "language")     val language: String,
    @ColumnInfo(name = "transcript")   val transcript: String,      // user-confirmed text
    @ColumnInfo(name = "audio_path")   val audioPath: String,       // relative to filesDir/voice/
    @ColumnInfo(name = "duration_ms")  val durationMs: Long,
    @ColumnInfo(name = "queued_at")    val queuedAt: Long,
    @ColumnInfo(name = "uploaded_at")  val uploadedAt: Long? = null,
    @ColumnInfo(name = "attempts")     val attempts: Int = 0,
    @ColumnInfo(name = "last_error")   val lastError: String? = null
)

@Dao
interface QueuedVoiceSampleDao {
    @Insert suspend fun enqueue(s: QueuedVoiceSample): Long
    @Query("SELECT * FROM queued_voice_samples WHERE uploaded_at IS NULL ORDER BY queued_at ASC LIMIT :limit")
    suspend fun pending(limit: Int = 32): List<QueuedVoiceSample>
    @Query("UPDATE queued_voice_samples SET uploaded_at = :ts WHERE id = :id")
    suspend fun markUploaded(id: Long, ts: Long): Int
    @Query("UPDATE queued_voice_samples SET attempts = attempts + 1, last_error = :err WHERE id = :id")
    suspend fun bumpAttempt(id: Long, err: String): Int
    @Query("DELETE FROM queued_voice_samples WHERE uploaded_at < :cutoff")
    suspend fun pruneUploadedOlderThan(cutoff: Long): Int
}
```

Storage budget: ≤ 50 MB queued audio (`filesDir/voice/`), pruned after upload + 30 days.

### Database wiring (planned)

```kotlin
@Database(
    entities = [
        ConversationTurn::class,
        EmergencyContact::class,
        PairedDevice::class,
        QueuedRelayEvent::class,
        QueuedVoiceSample::class
    ],
    version = 1,
    exportSchema = true
)
abstract class VaaniDatabase : RoomDatabase() {
    abstract fun conversationDao(): ConversationDao
    abstract fun emergencyContactDao(): EmergencyContactDao
    abstract fun pairedDeviceDao(): PairedDeviceDao
    abstract fun queuedRelayDao(): QueuedRelayDao
    abstract fun queuedVoiceSampleDao(): QueuedVoiceSampleDao

    companion object {
        fun build(ctx: Context): VaaniDatabase =
            Room.databaseBuilder(ctx, VaaniDatabase::class.java, "chitti_vaani.db")
                .fallbackToDestructiveMigration()   // pre-1.0 only; remove before Play Store
                .build()
    }
}
```

`exportSchema = true` → schemas committed under `app/schemas/` so migrations are reviewable.

---

## Migrations

No migrations yet (Room not introduced). Plan: every schema bump after v1 ships in production gets a `Migration(from, to)` object **and** a JUnit test in `androidTest` that loads the previous DB fixture and asserts the upgrade is non-destructive.

---

## Backup and DPDP compliance

- `android:allowBackup="false"` in [`AndroidManifest.xml`](app/src/main/AndroidManifest.xml) — Android auto-backup is **disabled**. The database stays on the user's device unless they explicitly export.
- The DPDP audit log ([`AuditLog`](app/src/main/java/in/sahayai/chitti/vaani/util/AuditLog.kt)) records every write that could be construed as a privacy-relevant event, even before Room arrives: `lockPhone`, `setSilentMode`, `makeCall direct`, `openWhatsApp`, `openUpiPay`, `EMERGENCY alarm fired`, every `REFUSED-*` outcome.

---

## Cross-references

- Service files that will read/write Room once it lands: [`services/`](app/src/main/java/in/sahayai/chitti/vaani/services/)
- Backend tables that mirror some of these: see `vaani.emergency_*` schema notes in [`../chitti-vaani/DATABASE.md`](../chitti-vaani/DATABASE.md)
- Architecture notes on networking + WorkManager: [ARCHITECTURE.md § 5](ARCHITECTURE.md#5-networking-layer)
