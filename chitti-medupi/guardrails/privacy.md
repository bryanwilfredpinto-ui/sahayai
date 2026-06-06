CEOS Level 8 — Guardrails: Privacy

Authored 2026-06-06

> Medicine queries are among the most sensitive data a person generates — a
> chronic-illness search list is effectively a health record. MedUPI's rule is
> **the user owns it, it lives on the device first, it is anonymised before it is
> ever aggregated, and "Chitti forget" actually forgets.**

Companion docs: [skills/OBSERVABILITY.md §1, §6](../skills/OBSERVABILITY.md) (what we never log) · [memory/life_twin.md](../memory/life_twin.md) · SAHAYAI_MASTER §2b (camera intelligence contract) · CONTEXT.md "What we explicitly refuse."

---

## 1. The ownership contract

| Principle | How MedUPI honours it |
|---|---|
| **User owns their data** | Family wallet, profiles, reminders, and search history are keyed to a per-device `user_token` (opaque `crypto.randomUUID()` in localStorage — `medupi_family.py`). No account, no mandatory phone/Aadhaar. |
| **On-device first** | The `_chittiLang` preference, Disability Profile, and For-You-style personalisation live in localStorage and are never synced to the backend. |
| **Anonymised before aggregation** | Community price reports + camera captures are stripped of `user_token` before they enter any aggregate (median/IQR, district coverage). |
| **Never sold** | No medicine event is ever sold, brokered, or shared with a pharmacy/insurer/advertiser. |
| **Forgettable** | *"Chitti forget"* tombstones the user's rows (see §4). |

Aadhaar is opt-in everywhere; there is no Chitti-pass, no mandatory biometric, no centralised identity ([CONTEXT.md "What we explicitly refuse"](../CONTEXT.md)).

---

## 2. Camera-intelligence contract (SAHAYAI_MASTER §2b)

Every MedUPI strip/prescription scan is governed by the platform camera contract. Each scan may capture the six-tuple **what / where / when / result / user / satisfaction**:

| Field | MedUPI meaning | Privacy treatment |
|---|---|---|
| **what** | the medicine recognised (brand + salt) | anonymised — aggregated by *salt*, never by user |
| **where** | coarse location (district/pincode for Jan Aushadhi coverage) | never finer than district in any aggregate |
| **when** | scan timestamp | rolled up; never a per-user time-series |
| **result** | match found / not in DB / cheaper alt surfaced | aggregate counts only |
| **user** | the per-device `user_token` | **stripped before aggregation** |
| **satisfaction** | the per-response 👍/👎 | aggregate only |

The **uploaded image bytes are never stored or logged** (binary or base64), and the raw vision response that combines brand + manufacturer (a user-identifying tuple on chronic-illness queries) is never logged ([skills/OBSERVABILITY.md §1](../skills/OBSERVABILITY.md)). Aggregates feed community "cheaper nearby" signals and coverage-gap maps — **user-owned, anonymised, never sold** (§2b).

---

## 3. Health-data sensitivity — extra rules

Because a medicine list is a de-facto health record, MedUPI applies stricter-than-default handling:

- **No third-party health analytics.** No Google Analytics custom dimensions on medicine queries; no Mixpanel / Amplitude / Segment health events ([skills/OBSERVABILITY.md §6](../skills/OBSERVABILITY.md)).
- **Family wallet entries are never logged at row level** — only aggregates leave the device's scope.
- **No identifier capture.** PAN / Aadhaar / phone are never logged even if they surface in a free-text search.
- **Four-user telemetry respect:** a blind user's screen-reader stream is not captured; a mute user's tap-pattern is not fingerprinted; an illiterate user's Hindi-voice query is not transcribed for training.
- Encryption-at-rest for stored health-file artefacts is handled by the Health File sub-system (`health_file_crypto.py`); MedUPI core stores no medical free-text beyond the medicine name the user themselves entered.

---

## 4. "Chitti forget" — tombstone, not silent delete

On *"Chitti forget"* (voice or tap), MedUPI deletes the user's profiles, wallet entries, reminders, and search history for that `user_token`, and writes a **tombstone** in place of each aggregated camera/community row so that aggregate counts stay honest (a deleted scan does not make a district's coverage count *increase*; it is replaced, not silently removed) — matching the platform rule in [CHITTI_SOP.md §9 (Scanner)](../../CHITTI_SOP.md) and SAHAYAI_MASTER §2b.

| Data class | On forget |
|---|---|
| Family profiles / wallet / reminders (per `user_token`) | hard-deleted |
| localStorage (lang, Disability Profile, For-You) | cleared on device |
| Camera/community aggregate contributions | tombstoned (row replaced; aggregate integrity preserved) |
| Application logs | retain no PII to forget (none was logged) |

**Roadmap (labelled target):** a one-tap "Forget my MedUPI data" control wired to a backend purge endpoint that fans out across `medupi.*` tables for a `user_token`. Today forget is honoured on-device + via the platform tombstone rule; the consolidated one-tap purge endpoint is a P1.

---

## 5. Done-definition

A change touching scans, wallet, reminders, or community price is **not done** until:

1. No image bytes and no brand+manufacturer tuple are logged.
2. `user_token` is stripped before any aggregate write.
3. No new third-party health-analytics call was introduced.
4. "Chitti forget" still deletes per-token rows and tombstones aggregates.
5. No location finer than district leaves the device in an aggregate.
