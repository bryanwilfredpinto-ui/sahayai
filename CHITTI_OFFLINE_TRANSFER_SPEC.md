# Chitti Offline P2P Transfer — Master Spec

**Locked 2026-05-15.** Memory: [`project_chitti_offline_p2p_transfer_locked`](C:/Users/DELL/.claude/projects/c--Users-DELL-sahayai-sahayai/memory/project_chitti_offline_p2p_transfer_locked.md). Ships as **Phase 2.7** in `chitti-vaani-android` — a separate Play Store submission after Phase 2.6 lands.

Offline file / photo / document transfer between two Chitti Android users with no internet. Two tracks share one substrate.

---

## 1. Why this exists

Rural Indian context — **no signal is not an edge case**. Two concrete user stories drive this:

1. **Emergency cascade must survive airplane-mode-both-phones.** The Chitti-to-Chitti relay in [SAHAYAI_MASTER.md §2 row 5](SAHAYAI_MASTER.md) currently rides on FCM; FCM needs the internet. A grandfather having a stroke at home + the daughter on a train through a no-signal pocket = current cascade fails silently.
2. **Family document handoff currently requires WhatsApp.** WhatsApp requires data, requires the recipient to have WhatsApp, and exfiltrates the file to Meta. A 20 MB scanned legal notice / medicine strip / Form 16 should hop phone-to-phone without leaving the family.

---

## 2. Reference apps (top-3, copied per [SAHAYAI_MASTER.md §2a](SAHAYAI_MASTER.md))

| App | What we copy | What we deliberately don't |
|---|---|---|
| **Google Quick Share** | Service-id auto-discovery, one-tap accept, 4-digit auth code, automatic strategy selection (BT/BLE/Wi-Fi Direct) | Branded "Shared via Google" toast; ad-id surfaces |
| **Apple AirDrop** | Visibility = Everyone / Contacts / Off; haptic + sound feedback on accept | Apple-account-only contacts; iCloud telemetry |
| **Files by Google → Nearby Share** | Visible-name editing; transfer log; "saved to Downloads" pattern | Anonymous-usage upload; cross-app monetisation hooks |

Nothing here is invented from scratch.

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  WebView UI (every Chitti page)                              │
│    ↑                                                         │
│    └── chitti_share.js (auto-loaded by chitti_a11y.js)       │
│        renders Share / Receive buttons + Quick-Share-style   │
│        modal flow. Voice readouts at every step.             │
│                                                              │
│  window.ChittiNative.* JS bridge ↓↑                          │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Native side — :feature:transfer module                      │
│    TransferManager.kt    — state machine + Nearby wrapper    │
│    FileTransferService.kt — FOREGROUND_SERVICE_DATA_SYNC     │
│    TransferAuth.kt        — 4-digit code OOB verification    │
│      ↑                                                       │
│      └── com.google.android.gms:play-services-nearby:19.x   │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼ over BT / BLE / Wi-Fi Direct
                  ┌──────────────────────────┐
                  │  Other Chitti device     │
                  │  (same module + bridge)  │
                  └──────────────────────────┘
```

**Substrate file**: `chitti_share.js` at repo root, mirroring [`chitti_camera.js`](chitti_camera.js) and [`chitti_features.js`](chitti_features.js). Auto-loaded by [`chitti_a11y.js`](chitti_a11y.js) so every Chitti page inherits without per-page edits — same pattern as the per-response widget, Feature Discovery box, and camera substrate.

**Native module**: `:feature:transfer` in `chitti-vaani-android`, isolated so unit tests don't pull WebView. Package: `in.sahayai.chitti.vaani.transfer`.

---

## 4. Two tracks

### 4.1 Track A — Emergency relay offline tier

Extends [SAHAYAI_MASTER.md §2 row 5](SAHAYAI_MASTER.md) cascade step 4. When the on-device keyword spotter ([TODO.md Phase 2.4](chitti-vaani-android/TODO.md)) fires, the existing FCM POST runs **in parallel** with `TransferManager.advertiseForRelay(cascadeJSON)`. Whichever paired Chitti hears first wins.

Why parallel and not fallback: FCM offline detection is heuristic and slow (15–30 s). The offline relay must also work when both devices are in airplane mode (rural reality, not edge case).

Payload schema:

```json
{
  "v": 1,
  "sender_user_token": "...",
  "trigger_keyword": "bachao",
  "captured_utc": "2026-05-15T13:42:00Z",
  "pincode": "400028",
  "tier": "spouse_unreachable",
  "sig": "<ed25519 sig over the above>"
}
```

Signed with the sender's paired-Chitti private key (key exchange already exists per [`project_chitti_vaani_emergency_protocol`](C:/Users/DELL/.claude/projects/c--Users-DELL-sahayai-sahayai/memory/project_chitti_vaani_emergency_protocol.md)). The 4-digit auth code is **skipped** for this tier — the signature verifies authenticity. Receiver verifies before firing the alarm; a random Nearby device can't spoof emergencies.

GPS never leaves the device — only the pincode (rounded). Matches the [§2b camera intelligence](SAHAYAI_MASTER.md) anonymisation contract.

### 4.2 Track B — General share

Substrate adds a `📤 Share` button to every Chitti page. The **user-canonical Share surface lives inside Vaani** per the 2026-05-15 [`project_chitti_vaani_sole_interface_locked`](C:/Users/DELL/.claude/projects/c--Users-DELL-sahayai-sahayai/memory/project_chitti_vaani_sole_interface_locked.md) §2 lock — a user invokes "share this" through their conversation with Vaani, and Vaani's router opens the substrate's flow inline. The `chitti_share.js` substrate remains auto-loaded on all 14 standalone Chitti pages for development continuity and substrate-parity testing (same precedent as the per-response widget's "no page ships without it" rule), but those pages are dev / debug surface, not the canonical user path.

Canonical flow:

```
[Sender]                                  [Receiver]
   │                                          │
   ▼                                          ▼
Tap "📤 Share"                          Tap "📥 Receive"
   │                                          │
   ▼                                          ▼
Pick file (or pre-filled by the         Auto-advertise as visible
context that opened the modal —         (name = device profile + Chitti slug)
e.g. MedUPI photo, Legal scan,          
CA Form 16, etc.)                       
   │                                          │
   ▼                                          ▼
Speak target name OR pick from          Hear: "Chitti from <sender> wants
discovered list                          to send <file>. Say haan to accept."
   │                                          │
   ▼                                          ▼
Both phones show same 4-digit auth      Same 4-digit code spoken aloud
code (also spoken aloud)                
   │                                          │
   ▼                                          ▼
Voice "haan" OR tap confirm   ←──────→   Voice "haan" OR tap confirm
   │                                          │
   ▼                                          ▼
Progress bar + spoken percent           Progress bar + spoken percent
   │                                          │
   ▼                                          ▼
"Sent" + AuditLog entry                 "Received — saved to Downloads"
                                         + spoken filename + AuditLog entry
```

20 MB ceiling — covers scanned legal notice PDFs. Larger payloads refuse with a spoken message and a suggestion to split.

---

## 5. Feature surface — LIVE / PHASE 2.7 / COMING SOON

Skeleton-first per [project_new_products_process_locked](C:/Users/DELL/.claude/projects/c--Users-DELL-sahayai-sahayai/memory/project_new_products_process_locked.md). All sub-features visible on commit #1 — unbuilt ones carry COMING SOON badges.

| Sub-feature | Status | Note |
|---|---|---|
| 1-to-1 share, file or text | PHASE 2.7 | Initial ship target |
| Emergency relay offline tier | PHASE 2.7 | Parallel with FCM; signed; auth-skipped |
| Voice-confirm accept ("haan" / spoken auth code) | PHASE 2.7 | A11y-first; mandatory for blind / illiterate users |
| QR escape hatch (≤ 2.9 KB text → iPhone-readable) | PHASE 2.7 | Zero native code; works on every device |
| Auto-discovery by service-id (P2P_CLUSTER strategy) | PHASE 2.7 | One-tap UX; copied from Quick Share |
| Group share (1 → N) | COMING SOON | Nearby Connections supports it; UX deferred |
| Scheduled share (queue and send on next proximity) | COMING SOON | Useful for daily-share workflows |
| End-to-end-encrypted share (paired-Chitti pubkey) | COMING SOON | Emergency tier already signed; general tier upgrade |
| Wallet handoff (UPI ID + amount preview) | COMING SOON | Hooks into existing `openUpiPay` flow |
| Voice-pinned share ("send tomorrow when ma'am is home") | COMING SOON | Cross-references geofence + presence |
| iOS bidirectional file transfer (Multipeer Connectivity) | OUT OF SCOPE v1 | QR escape hatch is the only iOS interop today |

---

## 6. Permissions delta

Added to [`chitti-vaani-android/app/src/main/AndroidManifest.xml`](chitti-vaani-android/app/src/main/AndroidManifest.xml). All flagged `neverForLocation` where supported so we don't need `ACCESS_FINE_LOCATION`.

| Permission | API range | Flag |
|---|---|---|
| `BLUETOOTH_SCAN` | 31+ | `neverForLocation` |
| `BLUETOOTH_ADVERTISE` | 31+ | |
| `BLUETOOTH_CONNECT` | 31+ | |
| `NEARBY_WIFI_DEVICES` | 33+ | `neverForLocation` |
| `ACCESS_WIFI_STATE` | all | |
| `CHANGE_WIFI_STATE` | all | |
| `FOREGROUND_SERVICE_DATA_SYNC` | 34+ | for `FileTransferService` |
| `BLUETOOTH` | ≤30 only | `maxSdkVersion="30"` |
| `BLUETOOTH_ADMIN` | ≤30 only | `maxSdkVersion="30"` |
| `ACCESS_COARSE_LOCATION` | 28–30 only | `maxSdkVersion="30"` — Nearby pre-31 needs it |

Dependency added to [`app/build.gradle.kts`](chitti-vaani-android/app/build.gradle.kts):

```
implementation("com.google.android.gms:play-services-nearby:19.x")
```

APK size delta: ~250 KB.

---

## 7. JS bridge surface — new `ChittiNative.*` methods

Documented in full in [`chitti-vaani-android/ARCHITECTURE.md §4`](chitti-vaani-android/ARCHITECTURE.md).

| Method | Returns |
|---|---|
| `advertiseForTransfer(label, mode)` | `"advertising"` / `"transfer_unsupported_no_play_services"` |
| `discoverNearby()` | `"discovering"` |
| `connectTo(endpointId)` | `"connecting"` / `"endpoint_not_found"` |
| `acceptIncoming(connectionId, authCodeConfirmed)` | `"accepted"` |
| `sendFile(connectionId, mimeType, base64Bytes, filename)` | `"sending"` |
| `cancelTransfer(connectionId)` | `"cancelled"` |
| `transferState()` | `{"state":"transferring","bytes":N,"total":M}` |

Each method: `SafetyChecks.requireTransferGranted()` → action → `AuditLog.append()`. Mirrors the existing 14-method surface.

`mode` on `advertiseForTransfer`: `"general"` (with auth code) or `"emergency_relay"` (auth skipped, signed payload).

---

## 8. Honest stub — AOSP / GMS-less

On devices without Google Play Services (some KaiOS-Android transitions, AOSP forks, MicroG users), every bridge method returns `"transfer_unsupported_no_play_services"`. The substrate surfaces this honestly: the Share button stays visible but shows "Not supported on your device — your phone is missing Google Play Services. Use QR for text instead." Spoken aloud for blind users.

No silent fallback to raw `WifiP2pManager` / `BluetoothAdapter` — that's a separate decision if/when demand justifies the ~400 LOC + worse UX.

---

## 9. Camera intelligence contract — unchanged

§2b capture-at-scan-time rule applies as written. When MedUPI scans a medicine strip and the user later shares the photo via Nearby to a family member's Chitti, the sender-side capture record was already written at scan time — the share itself does **not** re-trigger capture. The destination Chitti receives the file blob only; the sender's camera audit row stays on the sender's device.

---

## 10. Ship sequencing — strict ordering

1. **Phase 2.6 lands first.** Current SMS / CallLog / Accessibility Play Store submission goes through its review cycle (TODO.md expects 2–3 rejection rounds).
2. **Wait for store approval.** No Phase 2.7 work pushed to the release branch until 2.6 is on the store.
3. **Tag `v1.0.0-store`** on `main` at the moment of 2.6 approval.
4. **Branch `phase-2.7-offline-transfer`** off that tag.
5. **2.7 release** = isolated permission diff (BT / Wi-Fi-nearby / FG-data-sync only). Data Safety form gains "File and document data — local-only, never leaves device" row. Privacy policy update at `sahayai.in/privacy/chitti-vaani` documents the new flow.
6. **Never bundle 2.7 permissions into a 2.6 amendment.** Compounds reviewer scrutiny.

---

## 11. Out of scope (v1)

- iOS bidirectional file transfer (Multipeer Connectivity)
- Raw Wi-Fi Direct fallback for AOSP devices
- Encrypted general-share (emergency tier is already signed)
- Web-tier Nearby Connections shim (browsers don't expose Nearby APIs)
- Cross-product share routing (share-to-Chitti-X-from-Chitti-Y; substrate is symmetric for now)

These earn COMING SOON markers; they do not earn silent omission.

---

## 12. References

- Build plan (this session): the numbered Phase A–G plan in `main` chat history.
- Memory: [`project_chitti_offline_p2p_transfer_locked`](C:/Users/DELL/.claude/projects/c--Users-DELL-sahayai-sahayai/memory/project_chitti_offline_p2p_transfer_locked.md)
- Base cascade: [`project_chitti_vaani_emergency_protocol`](C:/Users/DELL/.claude/projects/c--Users-DELL-sahayai-sahayai/memory/project_chitti_vaani_emergency_protocol.md)
- Skill file: [`chitti-vaani-android/skills/FILE_TRANSFER.md`](chitti-vaani-android/skills/FILE_TRANSFER.md)
- Master row: [SAHAYAI_MASTER.md §2 "Offline P2P transfer (Android)"](SAHAYAI_MASTER.md)
