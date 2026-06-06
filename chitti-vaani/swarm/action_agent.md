# Agent 5 — Action Agent

> Swarm Agent 5 of 6 for Chitti Vaani. Runs after Safety Agent (which has already
> cleared the request), before Trust Agent.
> Enforces the Chitti Golden Rule — every side-effecting action gates on
> chittiConfirmAndDo() before firing.
> Rules-only; no LLM in the gate logic. Per SAHAYAI_MASTER.md §2g (LOCKED 2026-05-23).

---

## Purpose

1. Detect whether the assembled response contains a side-effecting action.
2. Synthesise the confirm question in the user's language.
3. Open the Golden Rule gate (chittiConfirmAndDo()) and wait for explicit haan.
4. Fire the action only on explicit Yes; abort silently on No or silence.
5. Log every gate decision to the append-only AuditLog.

---

## Input

```json
{
  "assembled_response": {
    "type": "pro-action",
    "action": "send-whatsapp",
    "recipient_name": "Raj",
    "recipient_phone": "+919876543210",
    "message_body": "Maa ne kaha kal ki dawai lena mat bhoolna.",
    "lang": "hi"
  },
  "safety_verdict": "PROCEED",
  "user_profile": { "disability_profile": { "mute": false, "blind": true } }
}
```

---

## Output

```json
{
  "action_gated": true,
  "confirm_question": "Sire, kya main Raj ko WhatsApp bhejun: 'Maa ne kaha kal ki dawai lena mat bhoolna.'?",
  "gate_method": "voice+tap",
  "gate_state": "awaiting_haan",
  "action_payload": {
    "type": "send-whatsapp",
    "deeplink": "https://wa.me/919876543210?text=Maa+ne+kaha+kal+ki+dawai+lena+mat+bhoolna.",
    "android_method": "ChittiNative.openWhatsApp(phone, body)"
  },
  "audit_log_entry": {
    "action": "send-whatsapp",
    "recipient": "+919876543210",
    "gate_opened_at": "2026-06-06T07:12:44Z",
    "gate_outcome": null
  }
}
```

After user says haan:
```json
{
  "gate_state": "confirmed",
  "audit_log_entry": {
    "gate_outcome": "yes",
    "confirmed_at": "2026-06-06T07:12:49Z",
    "action_fired_at": "2026-06-06T07:12:49Z"
  }
}
```

After user says nahi or silence (30 s passes):
```json
{
  "gate_state": "aborted",
  "abort_reason": "user_said_nahi",
  "spoken_response": "Theek hai, rok diya.",
  "audit_log_entry": {
    "gate_outcome": "no",
    "aborted_at": "2026-06-06T07:12:52Z"
  }
}
```

---

## Side-Effecting Actions (Exhaustive — any item not on this list that produces an
observable external effect is ALSO covered by this agent)

| Category | Actions |
|---|---|
| Communication | WhatsApp (wa.me deeplink / AccessibilityService tap) · SMS (sms: RFC 5724 / SmsManager) · Email (Gmail OAuth server-side send) · Call (tel: / ChittiNative.makeCall) |
| Payments | UPI (upi://pay deeplink — user enters PIN in UPI app; Chitti never sees PIN) |
| Safety surface | SafeWalk start / extend · Location share to trusted circle · Ambulance 108 dial · Fake incoming call trigger |
| Device (Android Phase 2) | Lock screen · Silent/ring toggle · App launch · Alarm set · Reminder set · Accessibility-service arming |
| HIGH-risk Chittis | Filing ITR via CA · Sending legal notice via Legal · Ordering medicine via MedUPI · Dialling a helpline (psychology) |
| Routing side-effects | Any route to a HIGH-risk Chitti where the target Chitti will perform an action (not just return information) |

---

## Golden Rule Implementation Contract

The single implementation of the gate is `chittiConfirmAndDo(question, onYes)` in
`chitti_vaani.html`.  The Action Agent synthesises the confirm question and hands it
to this function.  No action card may implement its own confirm pattern.

Gate behaviour:

```
chittiConfirmAndDo(question, onYes):
  1. Speak question via Voice Factory in user's language.
  2. Open #chitti-confirm-overlay modal — Haan button + Nahi button (48x48 dp, mute-user safe).
  3. Start parallel SpeechRecognition listening for:
       Yes words: haan, theek, yes, kar do, bhejo, chalo, okay
       No words:  nahi, ruko, stop, mat, cancel, band karo
  4. On Yes: close modal, call onYes(), write CONFIRMED to AuditLog.
  5. On No: close modal, speak "Theek hai, rok diya.", write ABORTED to AuditLog.
  6. On silence: wait forever. NO timeout. NO default. NO reminder prompt.
```

**Silence = wait. Forever, if needed.**

---

## HIGH-risk Chitti Extra Confirm

For the HIGH-risk Chittis (CA / Legal / MedUPI / Vaani-psychology), the Action
Agent runs the gate on **every individual action**, even if a prior action of
the same type was approved in the same session.

There is no "approve once, run forever" for HIGH-risk Chittis.

Example: if the user approved sending a legal notice 2 minutes ago, and now
asks for a second legal notice to a different party, the gate opens again.
The prior approval is never inherited.

---

## AuditLog

Every gate decision — opened, confirmed, aborted, bypassed — writes to the
append-only `chitti-founder/action_audit.db`:

```
event_id · user_hash · action_type · recipient_hash · gate_outcome
         · opened_at · outcome_at · session_id · agent_version
```

This log is the evidence trail for the Golden Rule.  It cannot be purged except
by "Chitti forget" for the specific user.

A `bypassed` event (an action that somehow reached the execution path without
a prior `confirmed` event) is a CRITICAL anomaly.  It writes a `GOLDEN_RULE_BYPASS`
record to the log and triggers an immediate CTO escalation notification.

---

## Guardrails

- **No LLM in the gate logic.** The gate is a pure function: does the response
  contain a side-effecting action, yes or no?  DeepSeek is not consulted.
- **chittiConfirmAndDo is the single implementation.** The Action Agent will
  VETO (via Safety Agent escalation) any response card that hand-rolls its own
  confirm pattern.
- **Cop-number check.** Before synthesising the confirm question for a call action,
  the Action Agent passes the phone number through `is_cop_number()`. If it returns
  true, the action is blocked immediately — the gate never even opens.
- **Mute-user safe.** The gate modal always shows Haan and Nahi as large tappable
  buttons regardless of voice availability.
- **30-second undo window.** After a confirmed action fires, a 30-second undo
  closure is registered in the AuditLog.  Tap Undo (visible on screen) within
  30 s to cancel (for actions that support undo — deep-links that opened an
  external app cannot be undone).

---

## Voting / Escalation

- If `gate_state = awaiting_haan` the pipeline pauses. The response assembler
  holds the final output until a Yes or No is received.
- If `gate_state = aborted` the response assembler returns only the spoken abort
  message ("Theek hai, rok diya.") and no action is taken.
- If a GOLDEN_RULE_BYPASS is detected, the Action Agent escalates to Safety Agent
  and triggers CTO notification.

---

## Swarm Learning

The Action Agent's gate logic is locked against swarm learning.

The swarm CANNOT change:
- The gate requirement for any side-effecting action.
- The "silence = wait forever" rule.
- The HIGH-risk Chitti individual-confirm-every-action rule.
- The no-undo-for-external-apps honest label.

The swarm CAN suggest (LOW-risk, Sire review):
- Better confirm question phrasing (more natural in a specific language).
- Better Yes/No word lists for new regional languages.

---

## Test

`backend/tests/test_action_agent.py`:
- `test_whatsapp_action_gates` — WhatsApp action -> gate opens, awaiting_haan.
- `test_silence_waits_forever` — no input for 60 s -> gate_state still awaiting_haan.
- `test_nahi_aborts_cleanly` — "nahi" -> gate_state = aborted, spoken_response present.
- `test_high_risk_confirms_each_individual_action` — two CA actions -> two separate gates.
- `test_bypass_detection_triggers_escalation` — action without prior confirm -> CRITICAL log.
- `test_cop_number_blocked_before_gate` — tel:112 -> blocked before gate opens.

---

Last reviewed: 2026-06-06
