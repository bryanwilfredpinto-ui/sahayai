# Life Twin — Chitti News AI User Profile

> The on-device user profile schema (`chittiCoachProfile_v1`). Lives in
> [`../../chitti_coach.js`](../../chitti_coach.js) lines 27-52 + 53-78.
> Stored ONLY in localStorage. Forward-migration stub at line 58-63.

---

## Schema name

- localStorage key: `chitti_user_profile`
- Schema version: `v: 1` (constant `SCHEMA_V = 1` in `chitti_coach.js`)
- Public name: **chittiCoachProfile_v1**

---

## Full schema

```js
{
  v: 1,                              // schema version
  profession:        'everyone',     // one of 13 hubs + 'everyone'
  experience:        '',             // '0-2' | '3-5' | '5-10' | '10+'
  salary_band:       '',             // optional, used for Mentor pace estimate
  current_skills:    [],             // gap #1 — what they know already; vocab in SKILL_VOCAB
  goal:              '',             // gap #1 — where they want to go; vocab in GOAL_VOCAB
  hours_per_week:    5,              // gap #2 — time budget for the plan
  language:          'en',           // mirrors chitti_lang (defensive copy)
  done_items:        [],             // gap #6, #25 — items the user marked Done
  skipped_items:     [],             // gap #6 — items the user marked Skip
  in_progress:       [],             // gap #25 — [{id, started_at, pct}]
  earned_credentials:[],             // gap #14 — feeds CV builder
  notification_optin:false,          // gap #15 — has user opted into notifications

  // COSDF v1.1 L15 — Readiness Score inputs
  ai_usage:          'none',         // 'none' | 'low' | 'med' | 'high'
  prompting:         'beginner',     // 'beginner' | 'intermediate' | 'advanced' | 'expert'
  automation:        'none',         // 'none' | 'some' | 'many'

  // COSDF v1.1 L16.5 — 28-day tour progress
  tour_days_done:    [],             // [1, 2, 3, ...] day-numbers completed

  // Dynamic curriculum progress (one key per curriculum id)
  // Stored at top level with computed key like 'curric_ai_for_doctors_days'
  // Helper: _curriculumDoneKey(id) in chitti_coach.js line 1747

  created_at:        '2026-06-06T07:00:00Z',
  updated_at:        '2026-06-06T07:00:00Z',
  last_visit:        '2026-06-06T07:00:00Z',
}
```

---

## v1.1 additions (committed 2026-06-04)

Three new fields landed in v1.1:

| Field | Vocab | Used by |
|---|---|---|
| `ai_usage` | none / low / med / high | `aiReadinessScore(profile)` — Readiness Score (COSDF L15) |
| `prompting` | beginner / intermediate / advanced / expert | `aiReadinessScore` + Prompt Agent ranking |
| `automation` | none / some / many | `aiReadinessScore` + Mentor pace estimate |
| `tour_days_done` | int[] of day numbers 1..28 | 28-Day AI Tool Tour progress (`renderTour` in chitti_news_ai.html) |
| `curric_<id>_days` | int[] of day numbers | Per-curriculum progress (8 curricula in v1.1) |

---

## Forward-migration stub

When the schema version bumps in the future, `_getProfile()` (line 53-67 of `chitti_coach.js`) preserves all known keys and resets unknown ones:

```js
if (!p || p.v !== SCHEMA_V) {
  var fresh = _emptyProfile();
  Object.keys(p || {}).forEach(function(k) {
    if (k in fresh) fresh[k] = p[k];
  });
  fresh.v = SCHEMA_V;
  _setProfile(fresh);
  return fresh;
}
```

This is forward-only. We never migrate v2 → v1. We never lose user data on a v1 → v2 bump if the field name is preserved.

---

## On-device only — never synced

This is the core privacy contract (see [`../guardrails/privacy.md`](../guardrails/privacy.md)):

- No `/api/profile/sync` endpoint exists.
- The CI guard `test_no_profile_sync_endpoint_exists` enforces this.
- The user's profession, goal, skill list, and progress are visible ONLY to code running in their browser tab.
- "Chitti forget" wipes the localStorage key `chitti_user_profile` (and all `curric_*_days` keys, and `disability_profile`, and `chitti_lang`).

---

## Derived fields (computed live, never persisted)

The following are computed on demand from the profile and never stored:

| Computed | Function | Source |
|---|---|---|
| AI Readiness Score (0-100) | `aiReadinessScore(profile)` | `chitti_coach.js` |
| AI Impact Score per task | `aiImpactScore(profession)` | `chitti_coach.js` + `COSDF_IMPACT_DATA.json` (Phase 1.5) |
| Mentor next-thing | `mentorNext(profile)` | `chitti_coach.js` |
| This week's mission | `missionThisWeek(profession, week_offset)` | `chitti_coach.js` |
| CV / LinkedIn section | `buildCV(profile, lang)` | `chitti_coach.js` |
| Tour pace estimate | `weekly_velocity = done_items.length / weeks_active` | `chitti_coach.js` |

---

## How the profile is used by the 8 agents

| Agent | Profile fields it reads |
|---|---|
| 1 — Role Mapping | `profession`, `language` |
| 2 — Certification | `profession`, `current_skills`, `experience`, `preferences.free_only` |
| 3 — Course | `profession`, `experience`, `hours_per_week`, `current_skills` |
| 4 — Tool | `profession` |
| 5 — Prompt | `profession`, `experience` (for difficulty filter) |
| 6 — Accessibility | (reads `disability_profile` separately, not this profile) |
| 7 — Trust & Quality | `preferences.free_only` |
| 8 — Language | `language` (mirrors `chitti_lang`) |

Each agent only reads — they don't mutate the profile. Mutations go through the public API:

```js
window.ChittiCoach.markDone(id);
window.ChittiCoach.markSkipped(id);
window.ChittiCoach.markInProgress(id, pct);
window.ChittiCoach.markTourDayDone(n);
window.ChittiCoach.updateIntake({ ai_usage: 'med', ... });
```

---

## Honest gaps

- ❌ No cross-device sync (intentional — privacy).
- ❌ No backup / export UI yet — user must copy localStorage manually (DPDP Act §11 export contract met by "this is just JSON; here's how to read it").
- 🟡 The `salary_band` field exists but the Mentor pace estimator does not yet weight it.
- 🟡 `notification_optin` exists but no notification system is wired (the Coach has no native notifications today).

---

Last reviewed: 2026-06-06
