# Safety — Chitti Vaani

> Per [SAHAYAI_MASTER.md §2](../../SAHAYAI_MASTER.md) locked decisions: family-cascade emergency
> protocol, CHITTI GOLDEN RULE (§2g), four-user accessibility contract, and
> [FEATURES.md §1.3a / §1.4](../skills/FEATURES.md) safety surface. Rules-only
> on the critical path. Fail-open semantics.

---

## The emergency denylist — hardcoded, never configurable

The following numbers are permanently refused by
[`../backend/services/emergency_service.py`](../backend/services/emergency_service.py)
`is_cop_number()`:

```python
COP_DENYLIST = {"112", "100", "101", "102", "108", "1098", "1930", "139"}
```

**108 is in the denylist.** The 🚑 **Ambulance 108** card in [FEATURES.md §1.3a](../skills/FEATURES.md)
uses `tel:108` as a *direct shortcut for the user to dial* — it is a pre-filled dialer
handoff after Golden Rule confirm, exactly like the Make-a-call card. This is
categorically different from the emergency cascade auto-dialling: the user taps
the button, the OS dialer opens, **the user dials**. Chitti never auto-dials 108
programmatically through the cascade. The distinction is:

| Path | Behaviour | 108 allowed? |
|---|---|---|
| User taps 🚑 Ambulance 108 card → Golden Rule confirm → `tel:108` | Dialer opens; user dials | ✓ (user action) |
| Emergency cascade auto-escalation | `is_cop_number()` refuses | ✗ (auto-dial blocked) |
| Trusted-circle entry contains 108 | `is_cop_number()` refuses at fan-out | ✗ (blocked even if stored) |

The family cascade always comes first:

1. **Confirm with master, 10 s** — *"Master, are you OK? Say theek hun."*
2. **Ring alarm** bypassing silent (`STREAM_ALARM` Android / Web Audio API web).
3. **Escalate to spouse / family** — `tel:` deep-link (web) / `ACTION_CALL` direct-dial (Android Phase 2).
4. **Fire Chitti-to-Chitti relay** — paired partners poll `/api/vaani/emergency/poll` (web) or receive FCM push (Phase 2).

**NEVER auto-dial police / government emergency lines.** This is a locked decision
([SAHAYAI_MASTER.md §2](../../SAHAYAI_MASTER.md)); it is not a product preference.

---

## CHITTI GOLDEN RULE — every side-effecting action gates here

Per [CONTEXT.md §"Chitti Golden Rule"](../CONTEXT.md) and SAHAYAI_MASTER.md §2g (LOCKED 2026-05-23):

> **Chitti NEVER acts on its own. EVER.**

Implementation: `chittiConfirmAndDo(question, onYes)` in
[`../../chitti_vaani.html`](../../chitti_vaani.html).

```
Step 1  Speaks the question in the user's language (Voice Factory cascade)
Step 2  Opens #chitti-confirm-overlay — Haan / Nahi buttons (mute-user safe)
Step 3  SpeechRecognition listens for haan/theek/yes/kar do OR nahi/ruko/stop/mat/cancel
Step 4  Fires onYes() ONLY on explicit Yes
Step 5  Never defaults to Yes. Never times out into Yes. Silence = wait forever.
```

Every action card, voice intent, and `ChittiNative` bridge method that produces
a side effect (call · SMS · WhatsApp · email · UPI · lock · silent · flashlight ·
camera · app launch · maps · alarm · reminder · anything) MUST pass through this gate.

HIGH-risk actions (filing an ITR, sending a legal notice, ordering medicine,
dialling a helpline) re-confirm on every invocation — there is no
"approve once, run forever" path.

---

## SafeWalk — guardian pattern, not an alarm dial

[FEATURES.md §1.3a](../skills/FEATURES.md) SafeWalk mode:

- `setTimeout` + `chittiConfirmAndDo` re-prompt **30 seconds before** the chosen deadline.
- On silence at deadline: `navigator.geolocation` captures location →
  WhatsApp fan-out to Trusted Circle picks via `wa.me?text=` (web) /
  `ChittiNative.shareLocation` (Phase 2 Android).
- State persists across reloads via `localStorage.chitti_vaani_safewalk_v1`.
- **NEVER auto-triggers the emergency cascade without master confirmation.**
- The re-prompt before deadline is itself a Golden Rule gate — Vaani asks
  *"SafeWalk check-in: are you safe? Say theek hun."* Silence beyond the
  deadline is the only condition that escalates — and escalation fans out
  to the Trusted Circle, not to 112.

---

## Mute-user-safe confirm pattern

All confirm dialogs must satisfy the four-user contract
([CONTEXT.md](../CONTEXT.md)):

| User | Confirm affordance |
|---|---|
| **Sighted** | Visual overlay — explicit Haan / Nahi buttons |
| **Blind** | Voice Factory speaks the question; SpeechRecognition listens |
| **Mute** | Tap Haan / Nahi — buttons are `min-width: 48px; min-height: 48px` per §7 |
| **Deaf** | Visual overlay with written question + Haan / Nahi buttons |
| **Illiterate** | Symbol icons (✓ / ✗) on buttons; Voice Factory reads the question |

The confirm overlay is never dismissed by a swipe gesture (gesture-blind users),
never auto-dismissed on a timer, and never replaced with a toast.

---

## Emergency keyword spotting — always on

Per [CONTEXT.md §"Emergency protocol"](../CONTEXT.md):

- Always-on keyword monitoring on any Chitti-mediated audio (day or night).
- Multi-language keyword set lives in
  [`../backend/services/emergency_service.py`](../backend/services/emergency_service.py)
  `EMERGENCY_KEYWORDS`:
  English (`emergency`, `ambulance`, `hospital`, `help`, …),
  Hindi (`bachao`, `madad`, `dard`, …),
  Tamil (`udavi`), Telugu (`sahaayam`), Bengali (`shahajjo`).
- Q3 planned item ([FEATURES.md §2a Quality Q3](../skills/FEATURES.md)):
  add Bangla / Tamil / Telugu / Marathi regional distress words — sourced
  from `chitti-vaani/skills/PSYCHOLOGY.md` distress lexicon.
- On detection: frontend POSTs `POST /api/vaani/emergency/trigger`; backend
  fans out to paired partners; frontend independently runs the local cascade.
- **Server-side validation** (planned): `emergency_service.trigger()` will
  weight and de-duplicate multi-language matches to suppress accidental triggers
  (e.g. a news story saying "ambulance").

---

## Psychology safety guardrail

Per [CHITTI_SOP.md §1](../../CHITTI_SOP.md) Quality standard:

- Psychology corpus is held to the **therapist-boundary lock** — Vaani
  offers psychological context but NEVER acts as a licensed therapist.
- **Q4 (planned)**: every response where the system prompt activates the
  psychology corpus path MUST end with the helpline cascade:
  Tele-MANAS **14416** · iCall · Vandrevala · NIMHANS.
  This footer is **server-enforced** (`_enforce_disclaimer()` analogue
  in `vaani_service.py`) — never client-controlled.
- The helpline numbers themselves are static corpus (not DB-driven) and
  are **re-verified quarterly** (stale data rule, CHITTI_SOP §1).

---

## Legal disclaimer — server-enforced, never omitted

`_enforce_disclaimer()` in
[`../backend/services/vaani_service.py`](../backend/services/vaani_service.py)
appends:

> *Yeh AI ki madad hai. Doctor ya lawyer se confirm zaroor karo.*

This runs even if the model omits it. The frontend MUST read it aloud after
every turn (not just display it). Never demotable to a footer.

---

## Fail-open contract

When DeepSeek / Voice Factory / Railway backend is down:

1. Log the failure. Self-ping from chitti-founder hits `/api/vaani/health`;
   non-200 triggers a debounced email to Sire (Layer 1 / Layer 2 BCP).
2. Emergency cascade (relay fan-out) is rules-only — it does NOT require
   the LLM. Paired partners continue to receive events.
3. Voice Factory Tier C never silently falls back — it surfaces an honest
   *"not supported in this language"* utterance using the closest available
   tier, never silence.
4. Never return HTTP 500 when the rules-only path can still serve the user.

---

## What this product never does (summary)

1. ❌ Never auto-dials 112, 100, 101, 102, 108, 1098, 1930, or 139 via cascade.
2. ❌ Never acts on a side-effecting intent without `chittiConfirmAndDo()`.
3. ❌ Never sends the user's disability profile or Medical ID to the backend.
4. ❌ Never defaults to Yes. Never times out into Yes.
5. ❌ Never uses colour-only signals to convey emergency state.
6. ❌ Never impersonates the user on an outbound call (always opens with
   *"Namaste, main Chitti hun, ek AI assistant."*).
7. ❌ Never silently degrades voice or emergency capability without an
   honest user-visible indicator.

---

Last reviewed: 2026-06-06
