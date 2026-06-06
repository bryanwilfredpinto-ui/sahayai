# QUALITY — Chitti Vaani

> **Vaani is the sole user-facing surface for the entire sahayai.in platform
> (SAHAYAI_MASTER.md §2, LOCKED 2026-05-15).** A quality failure in Vaani
> is a failure across all 15 Chittis for every user. Quality gates here are
> therefore non-negotiable — a single FAIL drops the entire platform to RED.
>
> This file documents the Vaani-specific quality contract:
> the 5 frontend gates, the per-response widget, the Golden Rule gate,
> Voice Factory honest ledger, psychology helpline cascade, and the
> CI / certification run schedule.

---

## The Five Frontend Gates (SAHAYAI_MASTER.md §7 — LOCKED)

No Vaani page ships without all five gates PASS:

### Gate F1 — Per-Response Widget (`feedback-widget.js` + `data-chitti-response`)

Every response box on `chitti_vaani.html` carries 4 icons:
🔊 (read aloud) · 🤖 (ask Chitti more) · 👍 (helpful) · 👎 (not helpful)
plus a per-box feedback window (voice or type, tagged to the box ID,
sent to `/api/feedback/collect`, visible in the Founder dashboard daily).

This is **per-BOX**, not a page-footer widget.
See [feedback-widget.js](../../feedback-widget.js) (LOCKED 2026-05-13).

Passing criteria:
- [ ] Every `[data-chitti-response]` in `chitti_vaani.html` has the 4-icon
      widget attached (verified by `querySelectorAll('[data-chitti-response]')`
      followed by widget-presence check).
- [ ] 👍 / 👎 sends to `/api/feedback/collect` and receives HTTP 200.
- [ ] 🔊 reads the box text aloud via Voice Factory cascade.
- [ ] 🤖 proxies a follow-up question to `/api/vaani/ask`.
- [ ] Per-box feedback window opens on thumbs-down; accepts voice or text.

### Gate F2 — `chitti_a11y.js` Substrate

`chitti_a11y.js` (repo root) is auto-loaded on every Chitti page. It injects:
- Language selector (26 languages, script-aware).
- Voice Required marker.
- Braille mode toggle.
- Aria-live region for screen readers.
- User Disability Profile prompt (first visit, every Chitti).
- ISL animation panel on every `[data-chitti-response]`.
- Feature Discovery Box (`💡 What can Chitti do for you?`).
- Offline mode badge + service worker registration.

Passing criteria:
- [ ] `window.Chitti.a11y` is defined within 500 ms of DOMContentLoaded.
- [ ] Language selector renders with ≥ 10 P0 language options.
- [ ] Aria-live region (`#chitti-aria-live`) is present and has `aria-live="polite"`.
- [ ] ISL panel attaches to every `[data-chitti-response]` within 1 s of render.
- [ ] Voice Factory URL is `window.Chitti.a11y.VOICE_FACTORY_URL` (never hard-coded
      Bhashini URL directly in Vaani code).

### Gate F3 — User Disability Profile Prompt (LOCKED 2026-05-13)

On first visit to any Chitti page (including Vaani), the multi-select disability
profile prompt fires. It is:
- Emoji-anchored (never text-only).
- Spoken aloud in the user's detected language.
- Stored locally in `localStorage.disability_profile` (never synced to backend).
- Never re-asked once set.

Passing criteria:
- [ ] `disability_profile` check fires on DOMContentLoaded.
- [ ] If no profile exists: prompt renders and is accessible (axe: aria-dialog).
- [ ] Profile persists across page reloads.
- [ ] Profile is readable by all 15 Chittis (shared localStorage key name).
- [ ] Profile drives Voice-First Mode auto-activation (blind/illiterate = on).

### Gate F4 — Language Auto-Detect

`chitti_lang.js` detects or inherits the user's preferred language from:
1. `localStorage.chitti_lang` (user has previously selected).
2. Browser `navigator.language` mapping to the closest Indian language.
3. Default: `hi` (Hindi).

Passing criteria:
- [ ] `window.chitti_lang` is set before any text is rendered.
- [ ] Pro Card labels render in the selected language (T dict, not hardcoded English).
- [ ] DeepSeek responses arrive in the selected language (system prompt sets it).
- [ ] Language selector change triggers re-render of all text in the new language.
- [ ] Voice Factory TTS uses the correct BCP-47 language code for the selected language.

### Gate F5 — ISL Plugin (SAHAYAI_MASTER.md §2 ISL LOCKED)

Indian Sign Language is a first-class surface — Phase 1 is live.

Passing criteria:
- [ ] ISL panel attaches to every `[data-chitti-response]` when
      `disability_profile.deaf = true` or `.isl = true`.
- [ ] `chitti_isl_dictionary.json` loads and is accessible at
      `window.Chitti.isl.dictionary`.
- [ ] Tap-word modal opens on any word tap within an ISL-panel-attached response.
- [ ] Honest stub renders for words absent from the dictionary
      (never a wrong sign).
- [ ] Phase 2 (COMING SOON) camera placeholder is visible in the ISL panel
      — never claimed as built.

---

## Golden Rule Gate (SAHAYAI_MASTER.md §2g — LOCKED 2026-05-23)

Every side-effecting action (call / SMS / WhatsApp / email / UPI / lock /
silent / flashlight / camera / app launch / navigation / alarm) is gated by
`chittiConfirmAndDo()`.

Quality gate criteria:
- [ ] `chittiConfirmAndDo` is defined in `chitti_vaani.html`.
- [ ] Every Pro Card action button triggers `chittiConfirmAndDo` before
      executing the action (verified by code audit — no direct `tel:` / `sms:`
      / `wa.me` link without the gate wrapper).
- [ ] The modal has both voice listener AND tap buttons (mute-user safe).
- [ ] The modal never auto-closes. Never times out. Silence = Chitti waits.
- [ ] Golden Rule audit log: every confirmed action writes to `AuditLog`
      (accessible at `GET /api/vaani/audit` with `ADMIN_SECRET`).
- [ ] Any bypass attempt is logged as a CRITICAL alert in the Founder dashboard.

---

## Voice Factory Honest Ledger

The 4-supplier cascade (Tier A: Bhashini · Tier B: Browser TTS · Tier C: Honest
fallback) must maintain an honest ledger per language.

Quality gate criteria:
- [ ] `GET /api/voice/ledger` returns status per language per supplier.
- [ ] Tier C (no voice available) always announces the failure in text + screen
      reader — never silent.
- [ ] No Vaani code hard-codes Bhashini API endpoints. All voice calls route
      through `window.Chitti.a11y.VOICE_FACTORY_URL`.
- [ ] Voice Factory supplier fail → cascade down the ledger immediately (no
      user-visible 5xx).
- [ ] `mock_bhashini` status is honestly displayed in the developer console
      (`[Voice Factory] mock_bhashini active — ULCA creds not set`) — never
      presented as a real Bhashini call to the end user.
- [ ] Voice Factory ledger shows > 5% supplier failures → CTO escalation
      fires within 15 min (per SOP.md escalation thresholds).

---

## Psychology Helpline Cascade (SAHAYAI_MASTER.md §2 — LOCKED)

`chitti-vaani/skills/PSYCHOLOGY.md` is the knowledge corpus (PhD-level, locked).
Vaani's psychology responses must always end with the helpline cascade:

```
Tele-MANAS 14416 · iCall 9152987821 · Vandrevala Foundation 1860-2662-345
· NIMHANS 080-46110007
```

Quality gate criteria:
- [ ] Server-enforced disclaimer appended at the bottom of every response
      where the DeepSeek system prompt selected the psychology corpus path
      (`_enforce_disclaimer()` in `vaani_service.py`).
- [ ] Disclaimer cannot be removed by client-side code.
- [ ] Helpline numbers are verified quarterly (stale data rule in SOP.md).
- [ ] Vaani never claims to be a licensed therapist (hard-coded refusal in
      the system prompt: *"Main ek AI dost hun — trained therapist nahi.
      Agar bahut takleef hai, toh zaroor ek specialist se baat karein."*).
- [ ] HIGH-risk psychology corpus changes require Sire's review before merge
      (SOP.md operating rule 5).

---

## Emergency Cascade Quality Gate

- [ ] Emergency keyword bypass runs BEFORE the normal intent classifier
      (Safety Agent pre-check < 5 ms — no LLM in this path).
- [ ] `COP_DENYLIST` in `emergency_service.py` refuses all calls to
      112 / 100 / 101 / 102 / 1098 / 1930 / 139.
- [ ] 108 (medical ambulance) is explicitly NOT in the denylist — it is
      the one emergency number Chitti CAN assist with.
- [ ] Confirm-with-master window is 10 seconds (spoken twice).
- [ ] Family cascade median response time monitored; CTO alert fires if
      > 30 s median (SOP.md escalation threshold).
- [ ] Emergency cascade never requires voice input from the user
      (mute users trigger via touch-and-hold; illiterate users trigger via
      spoken keyword).

---

## Eight-Gate Done Definition (SAHAYAI_MASTER.md §7)

For every Vaani feature to be marked DONE, it must pass:

1. Blind path — voice-first, 5+ voice commands, aria-live.
2. Deaf path — ISL panel on every response, no audio-only signals.
3. Mute path — tap-only, Golden Rule modal has Haan/Nahi tap buttons.
4. Illiterate path — emoji prefix on every label, slow mode, voice readback.
5. Per-response widget on every box (feedback-widget.js).
6. ≥ 10 Indian languages render correctly.
7. 375 px viewport — no horizontal scroll, all content readable.
8. All tap targets ≥ 48 × 48 px.

---

## CI Gate Schedule

| Frequency | What runs |
|---|---|
| Every PR | `test_router_agent.py` + `test_golden_rule.py` + axe-core at 375px × 5 disability profiles |
| Nightly | Full 240-scan a11y matrix (8 profiles × 10 langs × 3 viewports) against production Railway URL |
| Daily 07:00 IST | Founder quality report — 👍/👎 ratios, psychology disclaimer presence, Voice Factory ledger summary |
| Weekly Sunday 08:00 IST | Trend report — routing accuracy, emergency response time, per-language voice coverage |
| Quarterly | Manual UAT (4 personas × 4 disability types), ISL dictionary coverage audit, helpline number verification |

---

## Certification Grades

```
████████████████████████████████████████████ 90-100%
GREEN — RELEASE READY
All 5 frontend gates PASS. Golden Rule enforced.
Voice Factory honest ledger. Emergency cascade tested.

██████████████████████████████████████░░░░░ 75-89%
YELLOW — CONDITIONAL
1-2 gates partial. Ship with caveat banner.

████████████████████████████████░░░░░░░░░░░ < 75%
RED — DO NOT RELEASE
Any accessibility gate FAIL or Golden Rule bypass.
```

Grade = lowest individual gate pass rate. A single FAIL on the ISL panel
(Gate F5) drops Vaani to RED even if all other gates are GREEN.

---

## How a Quality Run Is Logged

Each quality run writes to `chitti-founder/quality_runs.db`:

```
run_id · product="vaani" · gate_f1..gate_f5 · golden_rule ·
voice_factory · psychology_cascade · emergency_cascade ·
grade · sire_signoff · timestamp
```

The Founder dashboard at `sahayai.in/founder` surfaces the latest run's
grade in the Vaani row.

---

Last reviewed: 2026-06-06
