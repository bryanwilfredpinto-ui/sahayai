# CNOS — Memory

> *"Per-device only. Never synced to backend. `Chitti.forget()` wipes everything."*

---

## What we remember (per-device, localStorage only)

| Key | Schema | Purpose |
|---|---|---|
| `chitti_news_state` | string (e.g. `mh`, `tn`, `india`) | Last-selected state filter |
| `chitti_news_lang` | string (e.g. `en`, `mr`, `hi`) | Last-selected display language |
| `chitti_news_category` | string (e.g. `national`, `politics`) | Last-selected category tab |
| `chitti_news_for_you` | JSON `{categories: {politics: 0.7, sports: -0.3, ...}}` | Per-category 👍/👎 weights driving For You ranking |
| `chitti_news_read_later` | JSON `[<article_id>, ...]` | Saved-for-later list |
| `chitti_news_cancelled` | JSON `[<article_id>, ...]` | Permanently muted stories |
| `chitti_news_user_token` | UUID | Per-device anonymous id (for feedback aggregation, not user-linked) |
| `chitti_disability_profile` | JSON `{blind: bool, deaf: bool, mute: bool, illiterate: bool, isl: bool}` | Drives a11y behaviors (shared across all Chittis) |

---

## What we DO NOT remember

| | Why |
|---|---|
| Reader's name / email / phone | No PII; we never asked |
| Reader's location beyond state | Sub-state location → tracking risk |
| Reader's political / communal / religious profile | Hard rule per Founder neutrality |
| Reader's reading history beyond Read Later / Cancelled | Doomscroll incentive |
| Cross-device link | Per-device only; no cloud sync |

---

## Recall examples (per persona)

| Persona | What we recall | What we render differently |
|---|---|---|
| Maharashtra-Marathi mother (P1) | state=mh, lang=mr | State-first ordering; mr publishers prioritised |
| Tamil retired teacher (P2) | state=tn, lang=ta | Tamil Nadu state + ta publishers + 🔊 auto-on if blind=true |
| Vidarbha farmer (P5) | state=mh, lang=mr, illiterate=true | Voice-first onboarding; agriculture rail at top |
| Tech student (P10) | state=ka, lang=en | Tech rail at top; CNAIOS career-handoff (Phase 2 cross-Chitti swarm) |

---

## How `Chitti.forget()` works

User taps "🗑 Forget me" anywhere in the Chitti ecosystem:

1. All localStorage keys above are deleted
2. Any per-device aggregate row in `quality_feedback` keyed on `chitti_news_user_token` is tombstoned (count preserved, identity removed)
3. ISL / disability profile cleared (so the next visit re-asks)
4. Per-device opt-out flag set: subsequent feedback signals are dropped, not aggregated

---

**World Class CNOS — Commando Discipline. Zero Excuses.**
