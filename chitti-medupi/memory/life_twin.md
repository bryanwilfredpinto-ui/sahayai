CEOS Level 9 — Memory: The Family Medicine Twin

Authored 2026-06-06

> Most medicine-cost tools are stateless — you scan, you see a price, you forget.
> A *family* on chronic care needs continuity: who takes what, when it runs out,
> what it should have cost, and how much MedUPI has saved them over a year. The
> **Family Medicine Twin** is that continuity — a living, on-device, per-token
> model of a household's medicine life, forgettable at any moment.

Companion docs: [memory/README.md](README.md) (retention model) · [guardrails/privacy.md](../guardrails/privacy.md) · `backend/services/medupi_family.py` · `backend/services/medupi_reminders.py` · [skills/FEATURES.md](../skills/FEATURES.md).

---

## 1. What the twin holds

The twin is **not** a server-side health record. It is a per-device model keyed on the opaque `user_token` (localStorage `crypto.randomUUID()`), with the structured rows persisted per-token in the `medupi.*` schema and the preferences kept purely on-device.

| Layer | Holds | Backed by |
|---|---|---|
| **Family roster** | One profile per member — `name`, `relation` (self/parent/spouse/child), `dob`, `conditions[]` (e.g. diabetes, BP, thyroid) | `medupi_family.py → FamilyProfile` |
| **Per-member medicine list** | The medicines each member actually buys, with salt + strength + form | wallet entries (`WalletEntry`) tagged to `profile_id` |
| **Chronic-care regimens** | Recurring medicines for ongoing conditions; refill cadence | `Reminder(kind='refill', recurrence=...)` |
| **Expiry / refill timeline** | Per-medicine `next_due` bucketed EXPIRED / EXPIRING_SOON (≤7d) / EXPIRING (≤30d) / OK | `medupi_reminders.py → expiry_summary` |
| **Savings history** | Per purchase: `price_paid`, `cheapest_equivalent_price`, `savings_realized`; rolled to monthly + 12-month + annual projection | `medupi_family.py → wallet_report` |
| **Preferences (device-only)** | `_chittiLang` (EN↔HI↔24 more), Disability Profile, home location for Jan Aushadhi | localStorage — never synced |

---

## 2. The wallet — the heart of the twin

`medupi_family.py → wallet_report` is the twin's memory of money. For a profile (or the whole family) it computes:

- `this_month_spend` / `this_month_saved`
- `last_12_months_spend` / `last_12_months_saved`
- `annual_projection` (this-month spend × 12 — a naïve, **honestly-labelled** projection, not a measured forecast)

…and returns voice-ready `speak_en` / `speak_hi` plus printed `caption_en` / `caption_hi` (e.g. *"This month you spent ₹X and saved ₹Y. Over the last 12 months you saved ₹Z by choosing same-composition equivalents."*). `savings_realized` is computed **only** when a real cheaper equivalent existed (`price_paid > cheapest_equivalent_price`) — the twin never invents a saving (see [guardrails/hallucination.md §3](../guardrails/hallucination.md)).

> Note: the example savings ranges users see (e.g. **67–78%** on the harness samples) come from real Jan-Aushadhi-vs-branded deltas measured in `tools/test_medupi_samples_result.json`, not from twin-side extrapolation.

---

## 3. Continuity the twin enables

| Twin memory | What it unlocks |
|---|---|
| Per-member condition + medicine list | *"Time to refill Amma's metformin"* without re-entry each month |
| Expiry timeline | Daily 08:00 IST scan buckets every medicine; voice summary *"1 medicine expiring this week"* (`run_daily_expiry_scan`) |
| Savings history | The savings card on the page + the annual story *"you saved ₹X this year"* |
| Multi-profile roster | One caregiver manages parents + children + self from one device |

Every twin surface carries the per-response widget (🔊 / 🤖 / 👍 / 👎) and renders EN+HI; status uses symbol + word, never colour alone (`_BUCKET_BADGE`: ❌ EXPIRED · ⚠️ EXPIRING SOON · ⏰ EXPIRING · ✅ OK).

---

## 4. What the twin is NOT

- **Not a diagnosis or a regimen recommender.** It remembers what the user told it; it never proposes adding/removing/changing a medicine ([guardrails/safety.md](../guardrails/safety.md)).
- **Not a cloud health record.** No ABDM linkage today; auth is intentionally light (`user_token`). ABDM-grade auth (verified phone hash) is a labelled roadmap item that would swap the token later — not built.
- **Not shared across users.** One device's twin never leaks into another's; aggregates are anonymised before they leave the token's scope ([guardrails/privacy.md §2](../guardrails/privacy.md)).
- **Not permanent against the user's will.** *"Chitti forget"* erases it.

---

## 5. Action-gating on the twin

Every twin write is a side-effecting action and gates on the Golden Rule (`chittiConfirmAndDo()`): adding a profile, logging a purchase/switch, creating/dismissing a reminder, setting a price alert. Read-back of the twin (speak my wallet, list reminders) is non-side-effecting and does not gate. MedUPI is HIGH-risk — no "approve once, run forever."
