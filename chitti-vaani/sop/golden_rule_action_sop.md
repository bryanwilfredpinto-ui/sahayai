# SOP-V003 — Golden Rule Action Gate

> Standard Operating Procedure for executing any side-effecting action through
> Chitti Vaani. Applies to every action, every session, every user — no exceptions.
> Per SAHAYAI_MASTER.md §2g (CHITTI GOLDEN RULE — LOCKED 2026-05-23).
> *"Chitti NEVER acts on its own. EVER."*

---

## Triggered When

- Any assembled response contains a side-effecting action (call, SMS, WhatsApp,
  email, UPI payment, device control, HIGH-risk Chitti action).
- A voice intent resolves to an actionable Pro Card.
- A user taps a Pro Card button.
- An action is proposed by a downstream Chitti (e.g. MedUPI: "order this medicine").
- SafeWalk: user confirms they want to start the walk timer.
- Any action that produces an observable external effect on a device or external system.

---

## Definition — What Counts as a Side-Effecting Action

A side-effecting action is ANY action where:
- Another person receives something (call, SMS, WhatsApp, email, UPI payment).
- The device state changes (lock, silent mode, alarm set, app opened).
- Data is written to an external system (ITR filing, legal notice sent, medicine ordered).
- A safety trigger fires (emergency cascade, SafeWalk arm).

If in doubt: it is a side-effecting action. Gate it.

---

## Procedure

### Step 1 — Detect Action in Assembled Response (Action Agent, Agent 5)

1. Action Agent scans the assembled response for action-type fields.
2. Identifies `action_type`, `recipient`, `payload`.
3. Runs `is_cop_number(recipient)` — if true, block immediately. Never reach Step 2.
4. Identifies whether the action is HIGH-risk (CA / Legal / MedUPI / psychology).

### Step 2 — Synthesise Confirm Question

5. Action Agent constructs the confirm question in the user's language (via Language Agent):
   - Call: *"Sire, kya main [name] ko call karun?"*
   - WhatsApp: *"Sire, kya main [name] ko WhatsApp bhejun: '[message preview]'?"*
   - Email: *"Sire, kya main [recipient] ko email bhejun: '[subject]'?"*
   - UPI: *"Sire, kya main [amount] rupaye [name] ko bhejun?"*
   - SafeWalk: *"Sire, kya main SafeWalk shuru karun — [N] minute ka timer?"*
   - Device: *"Sire, kya main phone ko silent karun?"*
   - HIGH-risk: *"Sire, kya main [specific legal / medical / financial action] karun?"*
6. For HIGH-risk actions, the confirm question includes a one-line consequence:
   *"Sire, kya main yeh ITR file karun? Iske baad aap file karna undo nahi kar sakte."*

### Step 3 — Open the Gate

7. Call `chittiConfirmAndDo(confirm_question, onYes)`.
8. Gate behaviour:
   - Speaks confirm_question via Voice Factory in user's language.
   - Opens `#chitti-confirm-overlay` modal with Haan (Yes) and Nahi (No) buttons.
   - Buttons: 48 x 48 dp minimum, high-contrast, visible to low-vision users.
   - Parallel SpeechRecognition listens for Yes words / No words.
   - ISL panel shows "YES / NO" sign animations if `disability_profile.isl = true`.

### Step 4 — Wait for Explicit Haan

9. Wait. No timeout. No reminder. No default.
10. Silence = gate remains open. Wait forever, if needed.
11. If the user navigates away (app backgrounded, page change): gate remains open
    on return. The action has NOT fired.

### Step 5 — Yes Path

12. User says haan / theek / yes / kar do / bhejo / chalo, OR taps Haan button.
13. `onYes()` fires immediately.
14. Action executes via the correct channel (deeplink / API call / ChittiNative bridge).
15. AuditLog entry written: `gate_outcome = confirmed`, `confirmed_at`, `action_fired_at`.
16. 30-second undo window opens (where technically possible — see §Undo below).
17. Vaani confirms aloud: *"[Action] ho gaya."*

### Step 6 — No Path

18. User says nahi / ruko / stop / mat / cancel / band karo, OR taps Nahi button.
19. Gate closes immediately. Action does NOT fire.
20. Vaani speaks: *"Theek hai, rok diya."*
21. AuditLog entry written: `gate_outcome = no`, `aborted_at`.
22. Pipeline returns to idle. No residual action state.

---

## HIGH-risk Chitti Extra Rule

For CA / Legal / MedUPI / Vaani-psychology, the Golden Rule Gate runs on
EVERY INDIVIDUAL ACTION in the session. Prior approvals in the same session
are never inherited.

| Prior action | This action | Gate |
|---|---|---|
| Filed ITR | File another ITR | Gate opens fresh |
| Sent legal notice to A | Send legal notice to B | Gate opens fresh |
| Ordered paracetamol | Order aspirin | Gate opens fresh |

There is no "approve once, run forever" for HIGH-risk Chittis.

---

## Undo Window

A 30-second undo window is registered after every confirmed action (where technically
possible):

| Action | Undo possible | Method |
|---|---|---|
| Email sent (Gmail API) | Yes — within 30 s | Gmail API delete the sent message |
| WhatsApp (deeplink opened) | No — external app | Honest label: "Undo not possible — please delete in WhatsApp" |
| Call (tel: deeplink) | No — OS dialer | Honest label: "Undo not possible — call may have connected" |
| UPI payment | No — RBI rules | Honest label: "UPI payments cannot be reversed — use UPI dispute if needed" |
| SafeWalk timer | Yes — cancel button shown | `clearSafeWalk()` call |

Undo button: visible in the response card for 30 s, then fades. Spoken: *"Undo ke
liye 30 second hain."* (once, not repeated — anti-nag rule).

---

## Audit Log

Every gate event writes to `chitti-founder/action_audit.db` (append-only):

```
event_id · user_hash · action_type · recipient_hash · gate_outcome
         · opened_at · outcome_at · session_id · agent_version
         · is_high_risk
```

A `GOLDEN_RULE_BYPASS` event (action executed without a prior `confirmed` event)
is a CRITICAL anomaly. Triggers immediate CTO notification via the Founder
dashboard. Never silently logged.

---

## Escalation

| Condition | Action |
|---|---|
| chittiConfirmAndDo() fails to load (JS error) | Action is blocked; user sees: "Action blocked — please reload Chitti." |
| Voice recognition unavailable (mute or broken mic) | Gate defaults to tap-only mode — Haan and Nahi buttons always visible |
| Network drops during email send (after gate confirm) | Retry once; if still fails, surface honest error: "Email nahi gaya — dobara try karein." |
| Golden Rule bypass detected | Block action, write CRITICAL to audit log, notify CTO |

---

## What We NEVER Do

- NEVER execute a side-effecting action without a prior explicit Yes.
- NEVER time out the gate into a Yes — silence = wait forever.
- NEVER auto-approve an action based on context ("you usually call Maa at 8pm").
- NEVER skip the gate because the user said "do it quickly" or "just do it".
- NEVER present the gate as a formality — it IS the safety mechanism.
- NEVER dial a cop-denylist number even if the user explicitly requests it.
- NEVER claim "undo done" for a UPI payment or an external-app action.

---

## Verification

- Automated: `backend/tests/test_action_agent.py` (silence gate, nahi gate, bypass detection).
- Manual: CTO taps every Pro Card on `chitti_vaani.html` and verifies gate opens.
- Cert artefact: `tools/cert_screenshots/chitti_vaani_golden_rule_375.png`.

---

Last reviewed: 2026-06-06
