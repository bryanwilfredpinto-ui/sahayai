# Agent 4 — Safety Agent

> Swarm Agent 4 of 6 for Chitti Vaani. The supreme veto authority.
> Runs after Empathy Agent, before Action Agent.
> Rules-only — no LLM in this agent's critical path. Ever.
> Per SAHAYAI_MASTER.md §2 (emergency protocol, LOCKED) and CONTEXT.md §Emergency.

---

## Purpose

1. Detect all emergency, safety, and cop-routing signals.
2. Enforce the family-cascade protocol — NEVER auto-dial any government emergency line.
3. Arm the SafeWalk / emergency cascade when triggered.
4. Hold supreme veto authority over every other agent — Safety Agent can block any
   assembled response, regardless of what Agents 1-3 produced.

---

## Input

```json
{
  "text": "bachao koi aa raha hai",
  "lang": "hi",
  "router_output": { "intent_slug": "emergency", "target_chitti": "SAFETY_AGENT_VETO" },
  "empathy_output": { "distress_level": 3 },
  "disability_profile": { "mute": false }
}
```

---

## Output

```json
{
  "safety_verdict": "EMERGENCY",
  "cascade_armed": true,
  "confirm_step": {
    "question": "Master, are you OK? Say theek hun.",
    "timeout_s": 10,
    "abort_on": ["theek hun", "I'm fine", "okay", "sab theek hai"]
  },
  "emergency_steps": [
    "POST /api/vaani/emergency/trigger",
    "ring_alarm_bypass_silent",
    "call_trusted_circle_tier_1",
    "relay_to_paired_chittis"
  ],
  "cop_dial_blocked": true,
  "cop_dial_reason": "COP_DENYLIST: 112 is a government emergency line — family cascade only"
}
```

Or for a non-emergency safety check:
```json
{
  "safety_verdict": "PROCEED",
  "cascade_armed": false,
  "cop_dial_blocked": false
}
```

Or for a veto (e.g. a routed response that would auto-act without confirm):
```json
{
  "safety_verdict": "VETO",
  "veto_reason": "Action card attempted to bypass chittiConfirmAndDo()"
}
```

---

## Safety Verdicts

| Verdict | Meaning | Pipeline effect |
|---|---|---|
| `PROCEED` | No safety concern — continue to Agent 5 (Action) | Normal flow |
| `VETO` | Response or action violates a safety contract | Block; log; surface error to user |
| `EMERGENCY` | Emergency keyword or distress level 3 detected | Arm cascade; skip Agent 5 if immediate danger |

---

## COP_DENYLIST (Hard-Coded — Never Modifiable by Swarm)

```python
COP_DENYLIST = [
    "112",   # National emergency
    "100",   # Police
    "101",   # Fire
    "102",   # (old ambulance — superseded by 108, kept on denylist for safety)
    "1098",  # Childline
    "1930",  # Cybercrime
    "139",   # Railways emergency
]
```

Even if a misconfigured trusted-circle entry stores one of these numbers, the
Safety Agent hard-refuses the dial:

```python
def is_cop_number(phone: str) -> bool:
    stripped = re.sub(r"[^0-9]", "", phone)
    return stripped in COP_DENYLIST
```

Source: `../backend/services/emergency_service.py`. This function is the single
check point for all dial paths — ChittiNative Android bridge calls it too.

**One exception: 108 (medical / ambulance).**  108 is NOT on the denylist.
Chitti CAN dial 108 after an explicit Golden Rule confirm.  It is shown as the
large-tap Ambulance card in the safety surface.

---

## Emergency Cascade Steps (LOCKED Order)

All five steps run in order. No step may be skipped or re-ordered.

```
Step 1: POST /api/vaani/emergency/trigger
        Backend fans the event to every paired partner's relay inbox.

Step 2: Confirm with master (10 s)
        Vaani speaks: "Master, are you OK? Say theek hun to cancel."
        If user says theek hun -> POST /api/vaani/emergency/check-in -> abort.
        If silence or continued distress -> proceed.

Step 3: Ring alarm bypassing silent
        Web: Web Audio API (STREAM_ALARM frequency, 10 s).
        Android: AudioManager.STREAM_ALARM (Phase 2).
        Purpose: alert anyone physically nearby.

Step 4: Outbound to trusted circle
        Web: tel: deep-link to first paired contact.
        Android: ChittiNative.makeCall(phone) (Phase 2).
        Fan-out order: spouse -> immediate family -> extended circle.

Step 5: Chitti-to-Chitti relay
        Web: /api/vaani/emergency/poll (long-poll).
        Android: FCM push (Phase 2).
        Paired partners' Chittis ring STREAM_ALARM even if on silent.
```

If all five steps complete and no family member acknowledges within 5 minutes:
- Continue ringing alarm on the user's device.
- Surface large-tap `tel:108` (ambulance) button with Golden Rule confirm.
- Never auto-dial 112.

---

## SafeWalk Integration

SafeWalk (from `FEATURES.md §1.3a`) uses this same cascade — not a separate
notification path. When the SafeWalk deadline passes:

1. Safety Agent fires Step 1 (emergency trigger).
2. Skips the Step 2 master-confirm (the SafeWalk itself was the "master is unreachable"
   signal — do not ask again).
3. Runs Steps 3, 4, 5 in order.

---

## Guardrails

- **No LLM in this agent.** The entire safety evaluation is rules-only.
  DeepSeek is never called to decide whether something is an emergency.
- **Supreme veto.** Safety Agent output overrides all prior agents. A warm,
  empathic response from Agent 3 that would recommend calling 112 is blocked here.
- **No timeout-to-emergency.** Step 2 (master confirm) waits exactly 10 s
  then escalates on silence. The cascade is not a timeout-to-yes — it is a
  timeout-to-cascade (safety-positive, not action-positive).
- **Mute-user safe.** SafeWalk check-in can be acknowledged by tap (not just voice).
  Emergency trigger can be fired by touch-and-hold gesture.
- **The emergency cascade log is append-only** — every trigger, check-in, abort,
  and relay event writes to `chitti-founder/emergency_events.db`. It cannot be
  purged except by "Chitti forget" for the specific user.

---

## Voting / Escalation

- `EMERGENCY` -> pipeline halted at Agent 4; cascade arm + alarm fire.
  Action Agent (5) and Trust Agent (6) are bypassed.
- `VETO` -> pipeline halted; structured error returned to the user.
- `PROCEED` -> continue to Agent 5 (Action Agent).
- `EMERGENCY` from Empathy Agent (distress level 3) is accepted as input;
  Safety Agent verifies independently before arming cascade.

---

## Swarm Learning

The Safety Agent is **locked against swarm learning** for its core logic.
The COP_DENYLIST, cascade steps, and 10-second master-confirm window cannot
be changed by any swarm pattern, regardless of sample size.

The swarm CAN suggest (with Sire approval only):
- New emergency-keyword vocabulary in additional languages.
- Improved prosody thresholds for distress detection.

The swarm CANNOT change:
- The COP_DENYLIST.
- The cascade step order.
- The master-confirm window duration.
- The 108 exception rule.
- The "no timeout-to-yes" contract.

---

## Test

`backend/tests/test_safety_agent.py`:
- `test_cop_denylist_hard_refuses_112` — tel:112 is always refused, even from trusted circle.
- `test_108_allowed_after_confirm` — tel:108 proceeds to Golden Rule confirm.
- `test_emergency_keyword_arms_cascade` — "bachao" -> cascade_armed = true.
- `test_safewalk_timeout_escalates` — SafeWalk deadline passed -> emergency trigger.
- `test_veto_blocks_bypass_attempt` — Action without chittiConfirmAndDo -> VETO.

---

Last reviewed: 2026-06-06
