CEOS Level 9 — Memory: Model & Retention

Authored 2026-06-06

> The MedUPI memory model in one line: **per-device, per-token, user-owned,
> anonymised-before-aggregation, forgettable.** This README is the map; the
> [life_twin.md](life_twin.md) file is the detail.

Companion docs: [life_twin.md](life_twin.md) · [../guardrails/privacy.md](../guardrails/privacy.md) · [../skills/OBSERVABILITY.md](../skills/OBSERVABILITY.md).

---

## 1. The three memory tiers

| Tier | Lives | Keyed by | Examples | Synced to backend? |
|---|---|---|---|---|
| **Device** | browser localStorage | the device | `_chittiLang`, Disability Profile, home location, For-You-style personalisation | **No — never** |
| **Per-token** | `medupi.*` (Turso/libSQL via direct-HTTPS shim) | `user_token` | family profiles, wallet entries, reminders, search history | Yes, but user-owned and forgettable |
| **Aggregate** | `medupi.*` aggregate tables | nothing user-identifying | community price median/IQR, district coverage gaps, top-N searched salts | Yes — `user_token` stripped first |

The `user_token` is an opaque `crypto.randomUUID()` minted on first visit and stored in localStorage — no account, no phone, no Aadhaar required (`medupi_family.py`).

---

## 2. Retention

| Data class | Retention | Notes |
|---|---|---|
| Family profiles / wallet / reminders | Persist until the user deletes them or says *"Chitti forget"* | per-token; survives across sessions on the same device |
| Search log (`medupi.search_log`) | Operational; drives popularity ranking | aggregated by salt, not by user |
| Brave price cache (`medupi.price_cache`) | Short-lived; snippets > 7 days tagged **stale** | freshness pill; never served as current |
| Community price reports | Retained as anonymised aggregate input | `user_token` stripped before aggregation |
| Application logs | Operational only; **no PII retained** | image bytes / brand+manufacturer tuple never logged |
| Aggregate camera/community rows on forget | **Tombstoned**, not deleted | preserves aggregate integrity ([../guardrails/privacy.md §4](../guardrails/privacy.md)) |

Per [QUALITY_STATUS.md](../../QUALITY_STATUS.md), MedUPI Turso writes are currently treated as **ephemeral across Railway redeploys** (tactical libsql replica bypass; revisit when DAU > 100). This is a known, labelled limitation — not a silent data-loss bug; the twin re-seeds from the device's localStorage roster on next use.

---

## 3. Durability caveat (honest status)

- **Read-survival:** proven 🟢 (medicines 1000→1000, jan_aushadhi 175→175 + 18 tables) per QUALITY_STATUS §5.
- **Write-durability under redeploy:** deferred until DAU > 100 (ARCHITECTURE §9). Until then, per-token rows are best-effort and the device roster is the resilient anchor.

---

## 4. Forget

*"Chitti forget"* (voice or tap) → per-token rows hard-deleted, localStorage cleared, aggregate contributions tombstoned. See [../guardrails/privacy.md §4](../guardrails/privacy.md). A consolidated one-tap backend purge endpoint across all `medupi.*` tables is a labelled **roadmap** item (P1).

---

## 5. What memory must never do

1. Sync device-tier preferences (lang, Disability Profile, For-You) to the server.
2. Let one `user_token` read another's rows.
3. Carry `user_token` into any aggregate.
4. Persist a value the user can't erase.
5. Remember a recommendation it should never have made (diagnose/prescribe/dose) — the guardrails stop those at write time ([../guardrails/safety.md](../guardrails/safety.md)).
