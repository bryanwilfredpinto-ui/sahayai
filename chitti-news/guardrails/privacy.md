# CNOS — Guardrails · Privacy by Design

> *"The For You algorithm runs in your browser. We never see what you read. That is the moat against Google and Meta."*

CNOS is built so there is **nothing to extract**. The personalization that powers the feed lives entirely on the reader's device. This file ties to **Trust > Engagement** and the locked Founder neutrality rule.

---

## 1. The privacy contract

| # | Rule |
|---|---|
| 1 | **For You + Read Later + Cancelled run in `localStorage` ONLY** — never synced to backend. |
| 2 | **No PII is ever collected** — no name, no email, no phone. We never ask. |
| 3 | **No sub-state location.** State (`mh`, `tn`, `india`) is the finest granularity; never GPS, never pincode. |
| 4 | **Never infer a political / communal / religious profile** — hard neutrality rule, no exception. |
| 5 | **Anonymous per-device `user_token`** exists only for feedback aggregation, never user-linked. |
| 6 | **`Chitti.forget()`** wipes everything on device + tombstones the aggregate row. |
| 7 | **No off-device tracking, no ads, no third-party trackers, no cross-device link.** |

---

## 2. What lives on-device (and only on-device)

All keys are `localStorage` on the reader's device — see [memory/README.md](../memory/README.md) for full schema.

| Key | What it holds | Leaves device? |
|---|---|---|
| `chitti_news_state` | last state filter | ❌ never |
| `chitti_news_lang` | last display language | ❌ never |
| `chitti_news_category` | last category tab | ❌ never |
| `chitti_news_for_you` | per-category 👍/👎 weights | ❌ never — the ranker runs in-browser |
| `chitti_news_read_later` | saved article ids | ❌ never |
| `chitti_news_cancelled` | muted article ids | ❌ never |
| `chitti_news_user_token` | anonymous per-device UUID | aggregate-only, never identity-linked |
| `chitti_disability_profile` | a11y flags (shared across Chittis) | ❌ never |

The For You weights `{categories: {politics: 0.7, sports: -0.3, ...}}` are computed and applied **in the browser**. The backend never receives them.

---

## 3. The hard neutrality rule (Rule 4 expanded)

CNOS will **never** build a model of *who you are politically*:

1. 👍/👎 signals adjust **category** weights (politics, sports, tech) — never **party**, **religion**, or **community** affinity.
2. No story is ever labelled partisan (politics neutrality lock: 0/100 violations 2026-06-03).
3. CNOS does not record *which* political stories you opened, only that "politics" as a category is up or down for you, on your device.
4. Communal/religious inference is structurally impossible: there is no such field, no such key, no such backend column.

---

## 4. The anonymous token (Rule 5 expanded)

`chitti_news_user_token` is a per-device UUID. Its only purpose:

- Aggregate 👍/👎 feedback so quality trends are visible to the Founder dashboard **in aggregate**.
- It is **not** linked to a name, email, phone, IP, or any identity.
- It cannot be reversed to "who" — only "a device thought this card was good/bad".

---

## 5. `Chitti.forget()` — the right to be unremembered

One tap, anywhere in the Chitti ecosystem:

1. **All `localStorage` keys above are deleted** — state, language, For You weights, Read Later, Cancelled, token, disability profile.
2. **The aggregate row keyed on `user_token` in `quality_feedback` is tombstoned** — the count is preserved (so quality stats stay honest) but the identity is removed.
3. **Disability/ISL profile is cleared** so the next visit re-asks.
4. **A per-device opt-out flag is set** — subsequent feedback signals are dropped, not aggregated.

There is no "soft delete", no "30-day retention", no backup that survives forget.

---

## 6. CI enforcement

| Rule | Where enforced |
|---|---|
| For You / Read Later / Cancelled stay client-side | structural — no backend write path exists |
| No PII fields | structural — no name/email/phone column in schema |
| Cancelled story never re-appears | `tools/cert_cancelled_story.mjs` — per release |
| `Chitti.forget()` wipes + tombstones | manual smoke + memory/README contract |
| No third-party trackers on page | `tools/cert_chitti_news_v2.mjs` — per release |

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
