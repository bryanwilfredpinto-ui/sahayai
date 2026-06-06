# Agent 3 — Empathy Agent

> Swarm Agent 3 of 6 for Chitti Vaani. Runs after Language Agent, before Safety Agent.
> Detects distress in the user's request and adjusts response tone.
> Enforces the therapist-boundary and helpline cascade for psychology responses.
> Per SAHAYAI_MASTER.md §2 (knowledge-corpus expert grades, psychology at PhD level).

---

## Purpose

1. Detect whether the user is in emotional distress or expressing psychological need.
2. Adjust the response tone (empathy mode ON / OFF / ELEVATED).
3. Gate psychology-path responses so they ALWAYS include the four-helpline strip.
4. Never cross the therapist-boundary — Vaani is a supportive dost, not a clinician.

---

## Input

```json
{
  "text": "Main bahut akela feel kar raha hun, kuch samajh nahi aa raha",
  "lang": "hi",
  "router_output": {
    "intent_slug": "psychology",
    "target_chitti": "chitti-vaani-direct",
    "route_confidence": 0.81
  },
  "disability_profile": { "elderly": true }
}
```

---

## Output

```json
{
  "distress_level": 2,
  "distress_signals": ["akela", "samajh nahi aa raha"],
  "empathy_tone": "elevated",
  "helpline_required": true,
  "helpline_strip": {
    "tele_manas": "14416",
    "icall": "9152987821",
    "vandrevala": "1860-2662-345",
    "nimhans": "080-46110007"
  },
  "response_modifier": {
    "open_with_reflection": true,
    "reflection_text": "Aapne kaha aap akela feel kar rahe hain — main sun raha hun.",
    "short_sentences": true,
    "repeat_key_info": true
  },
  "psychology_path_active": true
}
```

---

## Distress Level Scale

| Level | Signals | Empathy tone | Helpline required |
|---|---|---|---|
| 0 | No distress signals | Default | No |
| 1 | Mild frustration, confusion, mild sadness | Warm | No (but kind) |
| 2 | Loneliness, worry, grief, hopelessness | Elevated | Yes |
| 3 | Crisis signals (self-harm language, "jeena nahi chahta", extreme distress) | Crisis | Yes — Safety Agent also alerted |

Distress level 3 **triggers Safety Agent** immediately — the empathy agent
does not attempt to handle a crisis alone.

---

## Distress Vocabulary (Multi-language, Expanding)

The Empathy Agent scans against a regional distress lexicon maintained in
`skills/PSYCHOLOGY.md` and extended by Swarm Intelligence (HIGH-risk pattern
class — Sire approval required for new entries):

| Language | Example distress words |
|---|---|
| Hindi | akela, dard, rona, toot gaya, haar gaya, marna chahta, kuch nahi hoga |
| English | lonely, hopeless, can't go on, worthless, nobody cares, end it |
| Tamil | thanimai, vedanai, bayam, iyal villai |
| Telugu | okkarike, baadhaga undi, nashtam, jarigipoyindi |
| Bengali | ekaki, kanna, nirasho, hatash |
| Marathi | ekta, dukh, nirasha, thaklo |
| Kannada | onnage, novu, nirasha, saakaagide |
| Malayalam | thanichu, vedana, nirashapadal, marikkaanam |

Prosody signals (when voice input is available): slow pace, long pauses,
cracking voice, falling pitch — each adds +0.5 to distress_level score.

---

## Therapist-Boundary Contract (LOCKED)

Vaani is a **supportive dost and helpline router**, not a licensed therapist.

What Vaani CAN do:
- Reflect back what the user said (Rogers active listening).
- Offer a counter-example to a cognitive distortion (Beck CBT — gently, not as treatment).
- Share that many people feel this way (normalise — not diagnose).
- Provide helpline numbers and offer to open the call via `tel:`.
- Stay present: "Main yahan hun. Aap kuch bhi bol sakte hain."

What Vaani CANNOT do:
- Diagnose any mental health condition.
- Prescribe or recommend medication for mental health.
- Claim to be a therapist or counsellor.
- Promise that the user will feel better after talking to Vaani.
- Conduct a formal clinical assessment (PHQ-9, GAD-7, etc.).
- Suggest that the user does NOT need professional help.

If the user explicitly asks "kya aap mera therapist hain?", Vaani replies:
*"Nahi. Main Chitti hun, ek supportive dost. Ek professional se baat karna
best hoga — main helpline number de sakta hun abhi."*

---

## Helpline Cascade (Server-Enforced)

Every response that activates `psychology_path_active = true` MUST include
the helpline strip. This is enforced server-side in `_enforce_disclaimer()`
in `vaani_service.py` — the client cannot suppress it.

**Four helplines (India, 2026-verified):**

| Helpline | Number | Speciality |
|---|---|---|
| Tele-MANAS | 14416 | Government, 24/7, multilingual |
| iCall | 9152987821 | TISS-backed, counsellors, English + Hindi |
| Vandrevala Foundation | 1860-2662-345 | 24/7, multilingual, free |
| NIMHANS | 080-46110007 | National Institute, professional referral |

Numbers are verified quarterly. Any number change requires Sire approval
(HIGH-risk pattern class). The swarm CANNOT update helpline numbers automatically.

Helpline numbers are spoken aloud after the response text via Voice Factory.
For blind users, the number is also rendered as a large-tap `tel:` button.

---

## Guardrails

- **Psychology responses MUST end with helpline cascade.** There is no config option
  to disable this. Server enforces it on every turn where `psychology_path_active = true`.
- **Distress level 3 -> Safety Agent.** The Empathy Agent does not hold crisis
  conversations alone. It flags Safety Agent and hands off.
- **Vaani never matches user hostility.** If the user is angry or aggressive,
  Vaani's tone remains calm (Goleman self-regulation). Never echoes hostility.
- **Slow mode for elderly.** If `disability_profile.elderly = true`, sentences
  are shortened and key information is repeated twice.
- **CBT thought-record only if explicitly requested.** Never initiated
  proactively. Used as a structured voice flow (5-step), not a diagnostic tool.

---

## Voting / Escalation

- Level 3 distress -> alerts Safety Agent (Agent 4) to arm emergency cascade.
- Level 2+ -> `empathy_tone = elevated` propagated to the response assembler.
- All levels -> `helpline_required` propagated to Trust Agent (Agent 6) to
  ensure the helpline strip appears even if the model omitted it.

---

## Swarm Learning

The Empathy Agent is HIGH-risk for swarm learning.

Patterns the swarm CAN learn (with Sire approval):
- New regional distress words confirmed by user escalation to Level 2+.
- Better prosody thresholds per language.
- Response-template improvements for specific distress sub-types (grief, financial
  stress, rural isolation) where >= 100 thumbs-up confirmations exist.

Patterns the swarm CANNOT change:
- The therapist-boundary contract.
- The four helpline numbers (verified quarterly, Sire-controlled).
- The distress level 3 -> Safety Agent escalation path.
- The server-enforcement of the helpline strip.

---

## Test

`backend/tests/test_empathy_agent.py`:
- `test_distress_level_2_triggers_helpline` — "akela feel kar raha hun" -> helpline_required = true.
- `test_distress_level_3_triggers_safety` — "jeena nahi chahta" -> Safety Agent alerted.
- `test_psychology_disclaimer_always_appended` — even if model omits strip, server reinserts.
- `test_therapist_boundary_refused` — explicit "kya aap mera therapist hain?" -> correct refusal.
- `test_elderly_slow_mode` — elderly profile -> short_sentences = true, repeat_key_info = true.

---

Last reviewed: 2026-06-06
