# FILE_TRANSFER — Chitti Vaani Android

Capability surface for offline phone-to-phone file / photo / document transfer between two Chitti users. Ships as Phase 2.7 — a separate Play Store submission after Phase 2.6 lands. Source of truth: [`CHITTI_OFFLINE_TRANSFER_SPEC.md`](../../CHITTI_OFFLINE_TRANSFER_SPEC.md) at the repo root. Locked decision: [SAHAYAI_MASTER.md §2 "Offline P2P transfer (Android)"](../../SAHAYAI_MASTER.md).

## What Chitti can do here

- Send any file up to **20 MB** to another nearby Chitti, with no internet on either phone.
- Send any text or contact / UPI ID / pair-token (≤ 2.9 KB) as a QR code — readable by any device, including iPhones.
- Hear the destination phone's name spoken aloud before accepting — works for blind / illiterate users.
- Confirm the transfer with the voice command "haan" — no buttons required.
- Send an emergency cascade payload in parallel with the existing FCM relay, so the cascade still reaches family when both phones are in airplane mode.
- Tell Chitti to **forget** a transfer record (`"Chitti, forget this share"`) — removes the audit log entry locally.

## Two tracks, one substrate

### Track A — Emergency relay offline tier

`VaaniBootService` (Phase 2.4 keyword spotter) fires `TransferManager.advertiseForRelay(cascadeJSON)` **simultaneously** with the existing FCM POST. Whichever paired Chitti receives the alert first triggers the alarm on the partner's phone. The 4-digit auth-code step is skipped — the payload is signed with the sender's paired-Chitti private key, so signature verification replaces interactive auth.

### Track B — General share

A `📤 Share` button appears on **every Chitti page** via the `chitti_share.js` substrate (auto-loaded by `chitti_a11y.js`, same pattern as `chitti_camera.js`). User picks a file, picks the recipient from the nearby list (or speaks their name), both phones show the same 4-digit auth code spoken aloud, "haan" on both sides starts the transfer.

## How Chitti behaves

- **Voice-first.** Every UI step has a spoken readout in the user's selected language — destination name, auth code digits, progress percentage, success / failure outcome.
- **Honest refusal on unsupported devices.** On phones without Google Play Services (AOSP forks, some KaiOS-Android transitions, MicroG users), Chitti says "Your phone is missing Google Play Services. Use QR for text instead" and surfaces the QR escape hatch. No silent fallback to raw Bluetooth or Wi-Fi Direct.
- **One-tap accept / refuse.** No device picker lists, no PIN entry, no obscure pairing UX. Auto-discovery by service-id, one button on each side.
- **Audit log on both ends.** Every advertise / discover / accept / send / receive event lands in [`AuditLog.kt`](../app/src/main/java/in/sahayai/chitti/vaani/util/AuditLog.kt) — DPDP Act 2023 receipt.
- **Camera intelligence contract preserved.** When a Chitti-camera photo (medicine strip / scanner / legal scan) gets shared later, the sender's original capture audit row stays put. The share itself does not re-trigger camera capture per §2b.

## Hard refusals

- **Never sends auto-call cops.** Same structural fence as [`SafetyChecks.refuseUnlock`](../app/src/main/java/in/sahayai/chitti/vaani/util/SafetyChecks.kt) — any payload that looks like a request to dial 112 / 100 / 102 / 108 / 1098 / 1930 / 139 is refused at the bridge layer with a logged `REFUSED-cop-autodial` audit row.
- **Never uploads the transferred file to our servers.** File bytes flow phone-to-phone only. Backend never sees them.
- **Never silently re-shares.** Each share is a discrete user-initiated action; no daemon re-sends in the background.
- **Never enables Bluetooth / Wi-Fi globally.** Nearby Connections handles radio toggling internally; Chitti does not call `BluetoothAdapter.enable()` or `WifiManager.setWifiEnabled(true)`.

## Permissions Chitti requests at this surface

Per [`AndroidManifest.xml`](../app/src/main/AndroidManifest.xml) (Phase 2.7 delta):

- `BLUETOOTH_SCAN` / `BLUETOOTH_ADVERTISE` / `BLUETOOTH_CONNECT` (API 31+, `neverForLocation`)
- `NEARBY_WIFI_DEVICES` (API 33+, `neverForLocation`)
- `ACCESS_WIFI_STATE` / `CHANGE_WIFI_STATE`
- `FOREGROUND_SERVICE_DATA_SYNC` (for `FileTransferService` keeping the transfer alive when the WebView pauses)
- Legacy `BLUETOOTH` / `BLUETOOTH_ADMIN` / `ACCESS_COARSE_LOCATION` for API ≤ 30 via `maxSdkVersion`

No `ACCESS_FINE_LOCATION` — `neverForLocation` flag avoids it. Play Store Data Safety form gains exactly one new row: "File and document data — local-only, never leaves device."

## JS bridge surface — what the web tier can call

Seven new `window.ChittiNative.*` methods, each gated by `SafetyChecks.requireTransferGranted()` and audit-logged:

| Method | Returns |
|---|---|
| `advertiseForTransfer(label, mode)` | `"advertising"` / `"transfer_unsupported_no_play_services"` |
| `discoverNearby()` | `"discovering"` |
| `connectTo(endpointId)` | `"connecting"` / `"endpoint_not_found"` |
| `acceptIncoming(connectionId, authCodeConfirmed)` | `"accepted"` |
| `sendFile(connectionId, mimeType, base64Bytes, filename)` | `"sending"` |
| `cancelTransfer(connectionId)` | `"cancelled"` |
| `transferState()` | `{"state":"transferring","bytes":N,"total":M}` |

The `mode` argument on `advertiseForTransfer` is `"general"` (auth code required) or `"emergency_relay"` (auth skipped, signed payload).

## What ships when

| Sub-capability | Phase 2.7 | Later |
|---|---|---|
| 1-to-1 share, file or text | ✅ | |
| Emergency relay offline tier | ✅ | |
| Voice-confirm accept | ✅ | |
| QR escape hatch | ✅ | |
| Auto-discovery one-tap | ✅ | |
| Group share (1 → N) | | COMING SOON |
| Scheduled share | | COMING SOON |
| End-to-end-encrypted general share | | COMING SOON |
| UPI wallet handoff | | COMING SOON |
| iOS bidirectional file transfer | | OUT OF SCOPE v1 |

## Out of scope (v1)

- iOS bidirectional file transfer (Multipeer Connectivity is incompatible with Nearby Connections)
- Raw Wi-Fi Direct fallback when Play Services is missing (separate decision if demand emerges)
- Web-tier Nearby Connections (browsers don't expose the APIs)
- Cross-Chitti share routing (sender's substrate is symmetric — picks any nearby Chitti regardless of which Chitti opened the share modal)

## Related skill files

- [`IDENTITY.md`](IDENTITY.md), [`PERSONALITY.md`](PERSONALITY.md), [`VALUES.md`](VALUES.md) — voice + tone Chitti uses while narrating a transfer.
- [`GUARDRAILS.md`](GUARDRAILS.md) — the audit log surface that records every transfer event.
- [`BOUNDARIES.md`](BOUNDARIES.md) — structural refusals the bridge inherits.
- [`TRUTH_SOURCES.md`](TRUTH_SOURCES.md) — `Nearby Connections` data is **never** a truth source; only sender-asserted metadata.
